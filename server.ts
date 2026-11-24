import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
STORY_CUES,
getSpeakerVoiceProfile,
sanitizeSpokenText,
} from './src/game/storyCues.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const MAX_TTS_CACHE = 240;
const ttsCache = new Map<string, string>();
const inflightTts = new Map<string, Promise<string>>();

// Serialized pacing queue so rapid clicks never trigger burst 429 rate-limits
let ttsQueueTail: Promise<void> = Promise.resolve();
function enqueueTtsWork<T>(work: () => Promise<T>): Promise<T> {
const result = ttsQueueTail.then(work, work);
ttsQueueTail = result.then(
() => new Promise<void>((r) => setTimeout(r, 120)),
() => new Promise<void>((r) => setTimeout(r, 120)),
);
return result;
}

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
return null;
}
if (!aiClient) {
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
function ensureWavBase64(rawBase64: string, sampleRate = 24000): string {
const buf = Buffer.from(rawBase64, 'base64');
if (
buf.length >= 4 &&
buf[0] === 0x52 && // R
buf[1] === 0x49 && // I
buf[2] === 0x46 && // F
buf[3] === 0x46    // F
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

/**
* Synthesizes natural, dramatized character speech using `gemini-3.8-flash-lite-tts`
* (matching Crónicas Bíblicas 2D): passes ONLY pure spoken Spanish in `parts[0].text`
* and passes the acting/emotion direction silently in `parts[0].speechMetadata.style`.
*/
async function generateDramatizedSpeech(
speaker: string,
text: string,
): Promise<string> {
const cleanSpeaker = speaker.trim() || 'Oli';
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
for (let attempt = 0; attempt < 2; attempt++) {
try {
const response = await ai.models.generateContent({
model: 'gemini-3.8-flash-lite-tts',
contents: [
{
role: 'user',
parts: [
{
text: cleanText,
speechMetadata: {
style: profile.style,
},
},
],
},
],
config: {
responseModalities: ['AUDIO'],
speechConfig: {
voiceConfig: {
prebuiltVoiceConfig: {
voiceName: profile.voiceName,
},
},
},
},
});

const base64Audio =
response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

if (!base64Audio) {
throw new Error('La respuesta de Gemini TTS no incluyó datos de audio.');
}

const wavBase64 = ensureWavBase64(base64Audio);

if (ttsCache.size >= MAX_TTS_CACHE) {
const oldestKey = ttsCache.keys().next().value;
if (oldestKey) ttsCache.delete(oldestKey);
}
ttsCache.set(cacheKey, wavBase64);
return wavBase64;
} catch (err) {
lastError = err;
const errMsg = err instanceof Error ? err.message : String(err);
if (
errMsg.includes('429') ||
errMsg.includes('RESOURCE_EXHAUSTED') ||
errMsg.includes('403') ||
errMsg.includes('PERMISSION_DENIED')
) {
break;
}
await new Promise((resolve) => setTimeout(resolve, 260));
}
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

async function startServer(): Promise<void> {
const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((_req, res, next) => {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
next();
});

app.options('*', (_req, res) => {
res.sendStatus(204);
});

app.get('/api/health', (_req, res) => {
res.json({
ok: true,
ttsConfigured: Boolean(getGeminiClient()),
model: 'gemini-3.8-flash-lite-tts',
});
});

app.get('/api/voice/health', (_req, res) => {
res.json({
available: Boolean(getGeminiClient()),
ttsConfigured: Boolean(getGeminiClient()),
model: 'gemini-3.8-flash-lite-tts',
});
});

// Primary dramatized character voice endpoint
app.post('/api/tts', async (req, res) => {
const { speaker, text } = (req.body ?? {}) as {
speaker?: unknown;
text?: unknown;
};

if (typeof text !== 'string' || !text.trim()) {
res.status(400).json({ error: 'Se requiere un texto válido para TTS.' });
return;
}

if (!getGeminiClient()) {
res.status(200).json({ fallback: true, reason: 'unconfigured' });
return;
}

try {
const speakerName = typeof speaker === 'string' ? speaker : 'Oli';
const audioBase64 = await generateDramatizedSpeech(speakerName, text);
res.status(200).json({
audioBase64,
mimeType: 'audio/wav',
});
} catch (err) {
const errMsg = err instanceof Error ? err.message : String(err);
const isQuota =
errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
if (!isQuota) {
console.warn('[TTS Fallback]', errMsg);
}
res.status(200).json({
fallback: true,
reason: isQuota ? 'quota' : 'api_error',
});
}
});

// Legacy cueId endpoint kept for compatibility
app.post('/api/voice/dramatize', async (req, res) => {
const cueId = typeof req.body?.cueId === 'string' ? req.body.cueId : '';
const cue = STORY_CUES[cueId];
if (!cue || cue.lines.length === 0) {
res.status(400).json({ error: 'Invalid or missing cueId' });
return;
}

if (!getGeminiClient()) {
res.status(200).json({ fallback: true, reason: 'unconfigured' });
return;
}

try {
const firstLine = cue.lines[0];
const audioBase64 = await generateDramatizedSpeech(
firstLine.speaker,
firstLine.text,
);
res.status(200).json({
cueId,
mimeType: 'audio/wav',
audioBase64,
});
} catch (err) {
const errMsg = err instanceof Error ? err.message : String(err);
res.status(200).json({
fallback: true,
reason: errMsg.includes('429') ? 'quota' : 'api_error',
});
}
});

if (!isProduction) {
const { createServer: createViteServer } = await import('vite');
const vite = await createViteServer({
server: { middlewareMode: true },
appType: 'spa',
});
app.use(vite.middlewares);
} else {
const distDir = path.resolve(__dirname, 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => {
res.sendFile(path.join(distDir, 'index.html'));
});
}

app.listen(PORT, '0.0.0.0', () => {
console.log(`Server listening on http://localhost:${PORT}`);
});
}

startServer().catch((err) => {
console.error('Failed to start server:', err);
process.exit(1);
});