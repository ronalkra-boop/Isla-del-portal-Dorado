import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { STORY_CUES } from './src/game/storyCues.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// In-memory WAV cache so dramatized cues only call TTS once per cueId
const audioCache = new Map<string, string>();

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
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
* Ensures raw PCM audio (L16 / 24kHz mono) returned by Gemini TTS is wrapped
* in a standard 44-byte RIFF/WAV header if it doesn't already have one.
*/
function ensureWavBase64(rawBase64: string, sampleRate = 24000): string {
const pcmBuf = Buffer.from(rawBase64, 'base64');
if (
pcmBuf.length >= 4 &&
pcmBuf[0] === 0x52 && // 'R'
pcmBuf[1] === 0x49 && // 'I'
pcmBuf[2] === 0x46 && // 'F'
pcmBuf[3] === 0x46    // 'F'
) {
return rawBase64;
}

const numChannels = 1;
const bitsPerSample = 16;
const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
const blockAlign = (numChannels * bitsPerSample) / 8;
const dataSize = pcmBuf.length;
const header = Buffer.alloc(44);

header.write('RIFF', 0);
header.writeUInt32LE(36 + dataSize, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
header.writeUInt16LE(numChannels, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(byteRate, 28);
header.writeUInt16LE(blockAlign, 32);
header.writeUInt16LE(bitsPerSample, 34);
header.write('data', 36);
header.writeUInt32LE(dataSize, 40);

return Buffer.concat([header, pcmBuf]).toString('base64');
}

async function synthesizeCueWavBase64(cueId: string): Promise<string> {
const cached = audioCache.get(cueId);
if (cached) return cached;

const cue = STORY_CUES[cueId];
if (!cue) {
throw new Error(`Unknown story cue: ${cueId}`);
}

const ai = getAiClient();
if (!ai) {
throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
}

const uniqueSpeakers = Array.from(
new Map(cue.lines.map((l) => [l.speaker, l])).values(),
);

const isDualSpeaker = uniqueSpeakers.length === 2;

const parts = cue.lines.map((line) => ({
text: line.ttsPromptText,
speechMetadata: isDualSpeaker
? {
speaker: line.speaker,
style: line.style,
}
: {
style: line.style,
},
}));

const speechConfig = isDualSpeaker
? {
multiSpeakerVoiceConfig: {
speakerVoiceConfigs: uniqueSpeakers.map((s) => ({
speaker: s.speaker,
voiceConfig: {
prebuiltVoiceConfig: { voiceName: s.voiceName },
},
})),
},
}
: {
voiceConfig: {
prebuiltVoiceConfig: { voiceName: uniqueSpeakers[0].voiceName },
},
};

const response = await ai.models.generateContent({
model: 'gemini-3.8-flash-tts',
contents: [
{
role: 'user',
parts,
},
],
config: {
responseModalities: ['AUDIO'],
speechConfig,
},
});

const base64Audio =
response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

if (!base64Audio) {
throw new Error('TTS returned empty audio payload');
}

const wavBase64 = ensureWavBase64(base64Audio);
audioCache.set(cueId, wavBase64);
return wavBase64;
}

async function startServer(): Promise<void> {
const app = express();
app.use(express.json());

app.get('/api/voice/health', (_req, res) => {
res.json({
available: Boolean(getAiClient()),
model: 'gemini-3.8-flash-tts',
});
});

app.post('/api/voice/dramatize', async (req, res) => {
const cueId = typeof req.body?.cueId === 'string' ? req.body.cueId : '';
if (!cueId || !STORY_CUES[cueId]) {
res.status(400).json({ error: 'Invalid or missing cueId' });
return;
}

try {
const audioBase64 = await synthesizeCueWavBase64(cueId);
res.json({
cueId,
mimeType: 'audio/wav',
audioBase64,
});
} catch (err) {
const message = err instanceof Error ? err.message : 'TTS generation failed';
if (message === 'GEMINI_API_KEY_NOT_CONFIGURED') {
res.status(503).json({ error: message });
return;
}
console.warn('[voice/dramatize] Fallback to client voice:', message);
res.status(503).json({ error: message, fallback: true });
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