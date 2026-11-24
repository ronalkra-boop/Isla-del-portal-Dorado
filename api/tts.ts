import {
  generateDramatizedSpeech,
  isGeminiTtsConfigured,
  } from '../src/server/ttsService.ts';

  interface ApiRequest {
  method?: string;
  body?: unknown;
  [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | string>;
  }

  interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(payload: unknown): void;
  end(): void;
  }

  async function parseJsonBody(req: ApiRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
  return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
  try {
  return JSON.parse(req.body) as Record<string, unknown>;
  } catch {
  return {};
  }
  }
  if (typeof req[Symbol.asyncIterator] === 'function') {
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Uint8Array | string>) {
  chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
  return JSON.parse(raw) as Record<string, unknown>;
  } catch {
  return {};
  }
  }
  return {};
  }

  export default async function handler(
  req: ApiRequest,
  res: ApiResponse,
  ): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
  res.status(204).end();
  return;
  }

  if (req.method !== 'POST') {
  res.status(405).json({ error: 'Method not allowed' });
  return;
  }

  const body = await parseJsonBody(req);
  const { speaker, text } = body;

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
  res.status(200).json({
  fallback: true,
  reason: isQuota ? 'quota' : 'api_error',
  });
  }
  }
