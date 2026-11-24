import {
  FALLBACK_TTS_MODEL,
  PRIMARY_TTS_MODEL,
  isGeminiTtsConfigured,
  } from '../src/server/ttsService.ts';

  interface ApiRequest {
  method?: string;
  }

  interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(payload: unknown): void;
  end(): void;
  }

  export default function handler(req: ApiRequest, res: ApiResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
  res.status(204).end();
  return;
  }

  res.status(200).json({
  ok: true,
  ttsConfigured: isGeminiTtsConfigured(),
  model: PRIMARY_TTS_MODEL,
  fallbackModel: FALLBACK_TTS_MODEL,
  });
  }
