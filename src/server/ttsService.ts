import { GoogleGenAI } from '@google/genai';
import { getSpeakerVoiceProfile, sanitizeSpokenText } from '../game/storyCues.ts';

export const PRIMARY_TTS_MODEL = 'gemini-3.8-flash-lite-tts';
export const FALLBACK_TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const MAX_TTS_CACHE = 320;
const ttsCache = new Map<string, { audioBase64: string; model: string }>();
const inflightTts = new Map<
string,
Promise<{ audioBase64: string; model: string }>
>();

// Serialized pacing queue (220ms apart) so burst cues never trip free-tier RPM limits
let ttsQueueTail: Promise<void> = Promise.resolve();
function enqueueTtsWork<T>(work: () => Promise<T>): Promise<T> {
const result = ttsQueueTail.then(work, work);
ttsQueueTail = result.then(
() => new Promise<void>((r) => setTimeout(r, 220)),
() => new Promise<void>((r) => setTimeout(r, 220)),
);
return result;
}

let cachedClientKey = '';
let aiClient: GoogleGenAI | null = null;

function resolveGeminiApiKey(): string | null {
const raw =
process.env.GEMINI_API_KEY ||
process.env.GOOGLE_API_KEY ||
process.env.VITE_GEMINI_API_KEY ||
'';
const trimmed = raw.trim();
if (!trimmed || trimmed === 'MY_GEMINI_API_KEY') {
return null;
}
return trimmed;
}

export function isGeminiTtsConfigured(): boolean {
return Boolean(resolveGeminiApiKey());
}

function getGeminiClient(): GoogleGenAI | null {
const apiKey = resolveGeminiApiKey();
if (!apiKey) return null;
if (!aiClient || cachedClientKey !== apiKey) {
cachedClientKey = apiKey;
aiClient = new GoogleGenAI({
apiKey,
httpOptions: {
headers: {
'User-Agent': 'aistudio-build',
},
},
});
}
return aiClient;
}

/**
* Guarantees valid RIFF/WAV base64 output: if Gemini TTS already returns WAV,
* returns as-is; if raw L16 24kHz mono PCM, prepends a standard 44-byte WAV header.
*/
export function ensureWavBase64(rawBase64: string, sampleRate = 24000): string {
const buf = Buffer.from(rawBase64, 'base64');
if (
buf.length >= 4 &&
buf[0] === 0x52 && // R
buf[1] === 0x49 && // I
buf[2] === 0x46 && // F
buf[3] === 0x46 // F
) {
return rawBase64;
}

const numChannels = 1;
const bitsPerSample = 16;
const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
const blockAlign = (numChannels * bitsPerSample) / 8;
const dataSize = buf.length;
const header = Buffer.alloc(44);

header.write('RIFF', 0);
header.writeUInt32LE(36 + dataSize, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(numChannels, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(byteRate, 28);
header.writeUInt16LE(blockAlign, 32);
header.writeUInt16LE(bitsPerSample, 34);
header.write('data', 36);
header.writeUInt32LE(dataSize, 40);

return Buffer.concat([header, buf]).toString('base64');
}

function isQuotaError(err: unknown): boolean {
const msg = err instanceof Error ? err.message : String(err);
return (
msg.includes('429') ||
msg.includes('RESOURCE_EXHAUSTED') ||
msg.toLowerCase().includes('quota')
);
}

function isPermissionError(err: unknown): boolean {
const msg = err instanceof Error ? err.message : String(err);
return (
msg.includes('403') ||
msg.includes('401') ||
msg.includes('PERMISSION_DENIED') ||
msg.includes('API_KEY_INVALID')
);
}

async function synthesizeWithModel(
ai: GoogleGenAI,
model: string,
cleanText: string,
voiceName: string,
style: string,
includeSpeechMetadata: boolean,
): Promise<string> {
const partPayload = includeSpeechMetadata
? {
text: cleanText,
speechMetadata: { style },
}
: {
text: cleanText,
};

const response = await ai.models.generateContent({
model,
contents: [
{
role: 'user',
parts: [partPayload as Record<string, unknown>],
},
],
config: {
responseModalities: ['AUDIO'],
speechConfig: {
voiceConfig: {
prebuiltVoiceConfig: {
voiceName,
},
},
},
},
});

const base64Audio =
response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

if (!base64Audio) {
throw new Error(`La respuesta de ${model} no incluyó datos de audio.`);
}

return ensureWavBase64(base64Audio);
}

/**
* Dual-model resilient character speech synthesis:
* 1) Primary: `gemini-3.8-flash-lite-tts` with silent acting `speechMetadata.style`
* 2) Automatic fallback: `gemini-2.5-flash-preview-tts` (separate quota bucket, pure Spanish text)
* 3) One 1500ms backoff retry across both models if both momentarily hit 429.
*/
export async function generateDramatizedSpeech(
speaker: string,
text: string,
): Promise<{ audioBase64: string; model: string }> {
const cleanSpeaker = speaker.trim() || 'Holy';
const cleanText = sanitizeSpokenText(text);
if (!cleanText) {
throw new Error('Texto vacío para TTS.');
}

const cacheKey = `${cleanSpeaker}::${cleanText}`;
const cached = ttsCache.get(cacheKey);
if (cached) return cached;

const inflight = inflightTts.get(cacheKey);
if (inflight) return inflight;

const task = enqueueTtsWork(async () => {
const again = ttsCache.get(cacheKey);
if (again) return again;

const profile = getSpeakerVoiceProfile(cleanSpeaker);
const ai = getGeminiClient();
if (!ai) {
throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
}

let lastError: unknown = null;
const attempts: Array<{ model: string; useMetadata: boolean }> = [
{ model: PRIMARY_TTS_MODEL, useMetadata: true },
{ model: FALLBACK_TTS_MODEL, useMetadata: false },
];

for (let round = 0; round < 2; round++) {
let sawQuota = false;

for (const spec of attempts) {
try {
const wavBase64 = await synthesizeWithModel(
ai,
spec.model,
cleanText,
profile.voiceName,
profile.style,
spec.useMetadata,
);
const entry = { audioBase64: wavBase64, model: spec.model };
if (ttsCache.size >= MAX_TTS_CACHE) {
const oldestKey = ttsCache.keys().next().value;
if (oldestKey) ttsCache.delete(oldestKey);
}
ttsCache.set(cacheKey, entry);
return entry;
} catch (err) {
lastError = err;
if (isPermissionError(err)) {
throw err;
}
if (isQuotaError(err)) {
sawQuota = true;
}
}
}

if (round === 0 && sawQuota) {
await new Promise((resolve) => setTimeout(resolve, 1500));
} else if (round === 0) {
await new Promise((resolve) => setTimeout(resolve, 350));
}
}

if (isQuotaError(lastError)) {
throw new Error('QUOTA_EXHAUSTED');
}

throw lastError instanceof Error
? lastError
: new Error('No se pudo sintetizar la voz dramatizada.');
});

inflightTts.set(cacheKey, task);
try {
return await task;
} finally {
inflightTts.delete(cacheKey);
}
}