import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { STORY_CUES } from './src/game/storyCues.ts';
import {
FALLBACK_TTS_MODEL,
PRIMARY_TTS_MODEL,
generateDramatizedSpeech,
isGeminiTtsConfigured,
} from './src/server/ttsService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

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
ttsConfigured: isGeminiTtsConfigured(),
model: PRIMARY_TTS_MODEL,
fallbackModel: FALLBACK_TTS_MODEL,
});
});

app.get('/api/voice/health', (_req, res) => {
res.json({
available: isGeminiTtsConfigured(),
ttsConfigured: isGeminiTtsConfigured(),
model: PRIMARY_TTS_MODEL,
fallbackModel: FALLBACK_TTS_MODEL,
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

if (!isGeminiTtsConfigured()) {
res.status(200).json({ fallback: true, reason: 'unconfigured' });
return;
}

try {
const speakerName = typeof speaker === 'string' ? speaker : 'Holy';
const result = await generateDramatizedSpeech(speakerName, text);
res.setHeader('Cache-Control', 'private, max-age=3600');
res.status(200).json({
audioBase64: result.audioBase64,
mimeType: 'audio/wav',
model: result.model,
});
} catch (err) {
const errMsg = err instanceof Error ? err.message : String(err);
const isQuota =
errMsg.includes('QUOTA_EXHAUSTED') ||
errMsg.includes('429') ||
errMsg.includes('RESOURCE_EXHAUSTED');
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

if (!isGeminiTtsConfigured()) {
res.status(200).json({ fallback: true, reason: 'unconfigured' });
return;
}

try {
const firstLine = cue.lines[0];
const result = await generateDramatizedSpeech(
firstLine.speaker,
firstLine.text,
);
res.setHeader('Cache-Control', 'private, max-age=3600');
res.status(200).json({
cueId,
mimeType: 'audio/wav',
audioBase64: result.audioBase64,
model: result.model,
});
} catch (err) {
const errMsg = err instanceof Error ? err.message : String(err);
res.status(200).json({
fallback: true,
reason:
errMsg.includes('QUOTA_EXHAUSTED') || errMsg.includes('429')
? 'quota'
: 'api_error',
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