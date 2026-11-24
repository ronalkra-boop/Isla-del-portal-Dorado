import {
  STORY_CUES,
  getSpeakerVoiceProfile,
  sanitizeSpokenText,
  type VoiceSpeakerId,
  } from './storyCues';

  const PERSISTENT_TTS_CACHE = 'isla-portal-tts-v3';

  function sleepAbortable(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
  if (signal.aborted) {
  reject(new DOMException('Aborted', 'AbortError'));
  return;
  }
  const timer = window.setTimeout(() => {
  signal.removeEventListener('abort', onAbort);
  resolve();
  }, ms);
  const onAbort = () => {
  clearTimeout(timer);
  reject(new DOMException('Aborted', 'AbortError'));
  };
  signal.addEventListener('abort', onAbort, { once: true });
  });
  }

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
  bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
  }

  export class AdventureAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicEnabled = true;
  private oceanGain: GainNode | null = null;
  private musicMasterGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private currentWorldId: 1 | 2 | 3 = 1;
  private isDucking = false;
  private lastStepTime = 0;

  // Two-tier client cache for dramatized Gemini TTS voices
  private rawBase64Cache = new Map<string, string>();
  private decodedVoiceCache = new Map<string, AudioBuffer>();
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private activeAbort: AbortController | null = null;
  private activeSpeechGen = 0;
  private serverTtsEnabled = true;
  private serverTtsCooldownUntil = 0;
  private prefetchTimer: number | null = null;

  private ensureContext(): AudioContext | null {
  if (this.muted) return null;
  if (!this.ctx && typeof window !== 'undefined') {
  const AudioCtx =
  window.AudioContext ||
  (window as unknown as { webkitAudioContext: typeof AudioContext })
  .webkitAudioContext;
  if (AudioCtx) {
  this.ctx = new AudioCtx();
  }
  }
  if (this.ctx && this.ctx.state === 'suspended') {
  void this.ctx.resume();
  }
  if (this.ctx && !this.voiceGain) {
  this.voiceGain = this.ctx.createGain();
  this.voiceGain.gain.value = this.muted ? 0 : 1.08;
  this.voiceGain.connect(this.ctx.destination);
  }
  return this.ctx;
  }

  public setServerTtsAvailable(available: boolean): void {
  this.serverTtsEnabled = available;
  }

  public setMuted(muted: boolean): void {
  this.muted = muted;
  this.applyGainLevels();
  if (muted) {
  this.stopStoryCue();
  }
  }

  public setMusicEnabled(enabled: boolean): void {
  this.musicEnabled = enabled;
  this.applyGainLevels();
  }

  public isMusicEnabled(): boolean {
  return this.musicEnabled;
  }

  private applyGainLevels(): void {
  if (!this.ctx) return;
  const now = this.ctx.currentTime;
  if (this.oceanGain) {
  const baseAmb = this.currentWorldId === 2 ? 0.018 : 0.022;
  this.oceanGain.gain.setTargetAtTime(
  this.muted ? 0 : this.isDucking ? baseAmb * 0.35 : baseAmb,
  now,
  0.16,
  );
  }
  if (this.musicMasterGain) {
  const musicVol = !this.musicEnabled
  ? 0
  : this.isDucking
  ? 0.024
  : 0.09;
  this.musicMasterGain.gain.setTargetAtTime(
  this.muted ? 0 : musicVol,
  now,
  0.18,
  );
  }
  if (this.voiceGain) {
  this.voiceGain.gain.setTargetAtTime(
  this.muted ? 0 : 1.08,
  now,
  0.05,
  );
  }
  }

  public isMuted(): boolean {
  return this.muted;
  }

  public setWorldTheme(worldId: 1 | 2 | 3): void {
  this.currentWorldId = worldId;
  this.musicStep = 0;
  this.applyGainLevels();
  }

  public startAmbience(): void {
  const ctx = this.ensureContext();
  if (!ctx) return;

  if (!this.oceanGain) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
  const white = Math.random() * 2 - 1;
  data[i] = (lastOut + 0.02 * white) / 1.02;
  lastOut = data[i];
  data[i] *= 2.2;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 390;

  const gain = ctx.createGain();
  gain.gain.value = this.muted ? 0 : 0.022;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
  this.oceanGain = gain;
  }

  if (!this.musicMasterGain) {
  this.musicMasterGain = ctx.createGain();
  this.musicMasterGain.gain.value =
  this.muted || !this.musicEnabled ? 0 : 0.09;
  this.musicMasterGain.connect(ctx.destination);
  this.startBackgroundMusicLoop();
  }
  }

  private startBackgroundMusicLoop(): void {
  if (this.musicTimer !== null || typeof window === 'undefined') return;

  // World 1: Sunny Tropical Marimba (C Major pentatonic)
  // World 2: Mysterious Subterranean Crystal Celesta (D Minor / Dorian)
  // World 3: Warm Golden Desert Oud & Harp (E Hijaz / Phrygian-Dominant)
  const worldMelodies: Record<1 | 2 | 3, Array<number | null>> = {
  1: [
  523.25, null, 659.25, 783.99, 880.0, null, 783.99, 659.25,
  587.33, null, 659.25, 783.99, 1046.5, null, 783.99, null,
  ],
  2: [
  587.33, null, 698.46, null, 880.0, 783.99, 698.46, null,
  659.25, null, 587.33, 523.25, 587.33, null, 880.0, null,
  ],
  3: [
  659.25, 698.46, 830.61, null, 880.0, 830.61, 698.46, 659.25,
  587.33, null, 659.25, 698.46, 830.61, null, 659.25, null,
  ],
  };

  const worldBass: Record<1 | 2 | 3, number[]> = {
  1: [130.81, 174.61, 196.0, 130.81],
  2: [146.83, 130.81, 116.54, 146.83],
  3: [164.81, 174.61, 146.83, 164.81],
  };

  this.musicTimer = window.setInterval(() => {
  if (
  this.muted ||
  !this.musicEnabled ||
  !this.ctx ||
  !this.musicMasterGain
  ) {
  return;
  }
  if (this.ctx.state === 'suspended') return;

  const now = this.ctx.currentTime;
  const melody = worldMelodies[this.currentWorldId] || worldMelodies[1];
  const bass = worldBass[this.currentWorldId] || worldBass[1];
  const step = this.musicStep % melody.length;
  this.musicStep++;

  const noteFreq = melody[step];
  if (noteFreq) {
  const osc = this.ctx.createOscillator();
  const noteGain = this.ctx.createGain();

  if (this.currentWorldId === 2) {
  osc.type = 'sine';
  osc.frequency.setValueAtTime(noteFreq, now);
  noteGain.gain.setValueAtTime(0.001, now);
  noteGain.gain.linearRampToValueAtTime(0.095, now + 0.015);
  noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
  osc.connect(noteGain);
  noteGain.connect(this.musicMasterGain);
  osc.start(now);
  osc.stop(now + 0.68);
  } else if (this.currentWorldId === 3) {
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(noteFreq * 0.75, now);
  noteGain.gain.setValueAtTime(0.001, now);
  noteGain.gain.linearRampToValueAtTime(0.11, now + 0.012);
  noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
  osc.connect(noteGain);
  noteGain.connect(this.musicMasterGain);
  osc.start(now);
  osc.stop(now + 0.45);
  } else {
  osc.type = 'sine';
  osc.frequency.setValueAtTime(noteFreq, now);
  noteGain.gain.setValueAtTime(0.001, now);
  noteGain.gain.linearRampToValueAtTime(0.11, now + 0.015);
  noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
  osc.connect(noteGain);
  noteGain.connect(this.musicMasterGain);
  osc.start(now);
  osc.stop(now + 0.36);
  }
  }

  if (step % 4 === 0) {
  const bassFreq = bass[Math.floor(step / 4) % bass.length];
  const bOsc = this.ctx.createOscillator();
  const bGain = this.ctx.createGain();
  bOsc.type = 'sine';
  bOsc.frequency.setValueAtTime(bassFreq, now);

  bGain.gain.setValueAtTime(0.001, now);
  bGain.gain.linearRampToValueAtTime(0.13, now + 0.06);
  bGain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

  bOsc.connect(bGain);
  bGain.connect(this.musicMasterGain);
  bOsc.start(now);
  bOsc.stop(now + 1.2);
  }
  }, 330);
  }

  public stopStoryCue(): void {
  this.activeSpeechGen++;

  if (this.prefetchTimer !== null) {
  clearTimeout(this.prefetchTimer);
  this.prefetchTimer = null;
  }

  if (this.activeAbort) {
  this.activeAbort.abort();
  this.activeAbort = null;
  }

  if (this.activeVoiceSource) {
  try {
  this.activeVoiceSource.onended = null;
  this.activeVoiceSource.stop();
  this.activeVoiceSource.disconnect();
  } catch {
  // ignore if already stopped
  }
  this.activeVoiceSource = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.cancel();
  }

  this.isDucking = false;
  this.applyGainLevels();
  }
  private async readPersistentVoiceCache(
    cacheKey: string,
    ): Promise<string | null> {
    if (typeof window === 'undefined' || !('caches' in window)) return null;
    try {
    const cache = await window.caches.open(PERSISTENT_TTS_CACHE);
    const res = await cache.match(
    `https://tts-cache.local/${encodeURIComponent(cacheKey)}`,
    );
    if (!res) return null;
    const text = (await res.text()).trim();
    return text || null;
    } catch {
    return null;
    }
    }

    private async writePersistentVoiceCache(
    cacheKey: string,
    base64: string,
    ): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    try {
    const cache = await window.caches.open(PERSISTENT_TTS_CACHE);
    await cache.put(
    `https://tts-cache.local/${encodeURIComponent(cacheKey)}`,
    new Response(base64, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }),
    );
    } catch {
    // Ignore quota / private-browsing CacheStorage failures
    }
    }

    private async fetchLineBase64(
    speaker: VoiceSpeakerId,
    rawText: string,
    signal: AbortSignal,
    ): Promise<string | null> {
    const cleanText = sanitizeSpokenText(rawText);
    if (!cleanText) return null;

    const cacheKey = `${speaker}::${cleanText}`;
    const existing = this.rawBase64Cache.get(cacheKey);
    if (existing) return existing;

    const persisted = await this.readPersistentVoiceCache(cacheKey);
    if (persisted) {
    this.rawBase64Cache.set(cacheKey, persisted);
    return persisted;
    }

    if (!this.serverTtsEnabled) {
    return null;
    }

    const waitMs = this.serverTtsCooldownUntil - Date.now();
    if (waitMs > 0) {
    await sleepAbortable(Math.min(waitMs, 3500), signal);
    }

    for (let attempt = 0; attempt < 2; attempt++) {
    if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
    }

    const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speaker, text: cleanText }),
    signal,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
    return null;
    }

    if (!response.ok) {
    if (response.status >= 500 || response.status === 429) {
    if (attempt === 0) {
    await sleepAbortable(1400, signal);
    continue;
    }
    }
    return null;
    }

    const payload = (await response.json()) as {
    audioBase64?: string;
    fallback?: boolean;
    reason?: string;
    };

    if (payload.fallback || !payload.audioBase64) {
    if (payload.reason === 'unconfigured') {
    this.serverTtsEnabled = false;
    return null;
    }
    if (attempt === 0) {
    await sleepAbortable(1400, signal);
    continue;
    }
    if (payload.reason === 'quota') {
    this.serverTtsCooldownUntil = Date.now() + 3_500;
    }
    return null;
    }

    this.rawBase64Cache.set(cacheKey, payload.audioBase64);
    void this.writePersistentVoiceCache(cacheKey, payload.audioBase64);
    return payload.audioBase64;
    }

    return null;
    }

    private async playSingleDramatizedLine(
    myGen: number,
    speaker: VoiceSpeakerId,
    rawText: string,
    signal: AbortSignal,
    onDone: () => void,
    onPlaybackStarted?: () => void,
    ): Promise<void> {
    const cleanText = sanitizeSpokenText(rawText);
    if (!cleanText || this.muted || myGen !== this.activeSpeechGen) {
    onDone();
    return;
    }

    const cacheKey = `${speaker}::${cleanText}`;

    try {
    let buffer = this.decodedVoiceCache.get(cacheKey);

    if (!buffer) {
    const base64 = await this.fetchLineBase64(speaker, cleanText, signal);
    if (myGen !== this.activeSpeechGen || this.muted) return;

    if (base64) {
    const ctx = this.ensureContext();
    if (ctx) {
    if (ctx.state === 'suspended') {
    await ctx.resume();
    }
    const arrayBuf = base64ToArrayBuffer(base64);
    buffer = await ctx.decodeAudioData(arrayBuf.slice(0));
    this.decodedVoiceCache.set(cacheKey, buffer);
    }
    }
    }

    if (myGen !== this.activeSpeechGen || this.muted) return;

    if (buffer) {
    const ctx = this.ensureContext();
    if (ctx && this.voiceGain) {
    if (ctx.state === 'suspended') {
    await ctx.resume();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.voiceGain);
    this.activeVoiceSource = source;
    this.isDucking = true;
    this.applyGainLevels();

    source.onended = () => {
    if (this.activeVoiceSource === source) {
    this.activeVoiceSource = null;
    }
    if (myGen === this.activeSpeechGen) {
    onDone();
    }
    };

    source.start();
    onPlaybackStarted?.();
    return;
    }
    }
    } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
    return;
    }
    }

    onPlaybackStarted?.();
    this.speakLineWithBrowserSynthesis(myGen, speaker, cleanText, onDone);
    }

    /**
    * Speaks ANY dynamic line (quiz questions, Waka's hints, wrong-answer jokes, rewards)
    * through the EXACT SAME unified dramatized Gemini TTS pipeline!
    */
    public speakDynamicLine(
    speaker: VoiceSpeakerId,
    text: string,
    onComplete?: () => void,
    ): void {
    this.stopStoryCue();
    if (this.muted) {
    onComplete?.();
    return;
    }

    this.startAmbience();
    const myGen = ++this.activeSpeechGen;
    const controller = new AbortController();
    this.activeAbort = controller;

    void this.playSingleDramatizedLine(
    myGen,
    speaker,
    text,
    controller.signal,
    () => {
    if (myGen === this.activeSpeechGen) {
    this.isDucking = false;
    this.applyGainLevels();
    onComplete?.();
    }
    },
    );
    }

    /**
    * Plays a multi-line dramatized Story Cue with sequential prefetching
    * (Line idx+1 is prefetched 350ms AFTER Line idx begins playing so there are no 429 bursts).
    */
    public playStoryCue(
    cueId: string,
    onLineChange?: (lineIndex: number) => void,
    onComplete?: () => void,
    ): void {
    const cue = STORY_CUES[cueId];
    if (!cue || cue.lines.length === 0) return;

    this.stopStoryCue();
    if (this.muted) {
    onLineChange?.(0);
    return;
    }

    this.startAmbience();
    const myGen = ++this.activeSpeechGen;
    const controller = new AbortController();
    this.activeAbort = controller;

    const playIndex = (idx: number) => {
    if (this.muted || myGen !== this.activeSpeechGen) return;
    if (idx >= cue.lines.length) {
    this.isDucking = false;
    this.applyGainLevels();
    onComplete?.();
    return;
    }

    const currentLine = cue.lines[idx];
    onLineChange?.(idx);

    void this.playSingleDramatizedLine(
    myGen,
    currentLine.speaker,
    currentLine.text,
    controller.signal,
    () => {
    if (myGen === this.activeSpeechGen) {
    playIndex(idx + 1);
    }
    },
    () => {
    const nextLine = cue.lines[idx + 1];
    if (nextLine && myGen === this.activeSpeechGen) {
    this.prefetchTimer = window.setTimeout(() => {
    if (myGen === this.activeSpeechGen) {
    void this.fetchLineBase64(
    nextLine.speaker,
    nextLine.text,
    controller.signal,
    ).catch(() => null);
    }
    }, 1400);
    }
    },
    );
    };

    playIndex(0);
    }
    private speakLineWithBrowserSynthesis(
      myGen: number,
      speaker: VoiceSpeakerId,
      cleanText: string,
      onDone: () => void,
      ): void {
      if (
      this.muted ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
      ) {
      onDone();
      return;
      }

      try {
      const synth = window.speechSynthesis;
      synth.cancel();

      const profile = getSpeakerVoiceProfile(speaker);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-419';
      utterance.pitch = profile.pitch;
      utterance.rate = profile.rate;
      utterance.volume = 0.95;

      const voices = synth.getVoices();
      const esVoice =
      voices.find(
      (v) =>
      v.lang.toLowerCase().startsWith('es') &&
      (v.name.includes('Natural') ||
      v.name.includes('Google') ||
      v.name.includes('Paulina') ||
      v.name.includes('Sabina') ||
      v.name.includes('Helena')),
      ) || voices.find((v) => v.lang.toLowerCase().startsWith('es'));

      if (esVoice) {
      utterance.voice = esVoice;
      }

      this.isDucking = true;
      this.applyGainLevels();

      utterance.onend = () => {
      if (myGen === this.activeSpeechGen) {
      onDone();
      }
      };
      utterance.onerror = () => {
      if (myGen === this.activeSpeechGen) {
      onDone();
      }
      };

      synth.speak(utterance);
      } catch {
      onDone();
      }
      }

      public playFootstep(): void {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (now - this.lastStepTime < 0.24) return;
      this.lastStepTime = now;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const basePitch =
      this.currentWorldId === 2 ? 145 : this.currentWorldId === 3 ? 92 : 110;
      const pitch = basePitch + (Math.random() - 0.5) * 16;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.06);

      gain.gain.setValueAtTime(0.042, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
      }

      public playJump(): void {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(490, now + 0.14);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
      }

      public playMushroomBounce(): void {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.22);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
      }

      public playWindRingBoost(): void {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [587.33, 783.99, 1046.5, 1318.5];

      notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.085, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
      });
      }

      public playStarPickup(starCount: number): void {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const baseShift = 1 + starCount * 0.04;

      notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq * baseShift, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
      });
      }

      public playTreasureChestOpen(): void {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5, 1567.98];

      chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.78);
      });
      }

      public playFlightUnlock(): void {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = [440, 554.37, 659.25, 880, 1108.73];

      chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.075;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.88);
      });
      }

      public playPortalVictory(): void {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];

      fanfare.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.05);
      });
      }

      public dispose(): void {
      this.stopStoryCue();
      if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
      }
      if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.oceanGain = null;
      this.musicMasterGain = null;
      this.voiceGain = null;
      }
      }
      }
    