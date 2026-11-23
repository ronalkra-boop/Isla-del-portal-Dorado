import { STORY_CUES, type StoryCueDef, type VoiceSpeakerId } from './storyCues';

export class AdventureAudio {
private ctx: AudioContext | null = null;
private muted = false;
private oceanGain: GainNode | null = null;
private musicMasterGain: GainNode | null = null;
private musicTimer: number | null = null;
private musicStep = 0;
private currentWorldId: 1 | 2 | 3 = 1;
private isSpeaking = false;
private lastStepTime = 0;

private wavClientCache = new Map<string, string>();
private activeHtmlAudio: HTMLAudioElement | null = null;
private speechTimers: number[] = [];

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
return this.ctx;
}

public setMuted(muted: boolean): void {
this.muted = muted;
if (this.oceanGain && this.ctx) {
this.oceanGain.gain.setTargetAtTime(
muted ? 0 : 0.026,
this.ctx.currentTime,
0.15,
);
}
if (this.musicMasterGain && this.ctx) {
this.musicMasterGain.gain.setTargetAtTime(
muted ? 0 : this.isSpeaking ? 0.035 : 0.095,
this.ctx.currentTime,
0.2,
);
}
if (muted) {
this.stopStoryCue();
}
}

public isMuted(): boolean {
return this.muted;
}

public setWorldTheme(worldId: 1 | 2 | 3): void {
this.currentWorldId = worldId;
}

public startAmbience(): void {
const ctx = this.ensureContext();
if (!ctx) return;

if (!this.oceanGain) {
// Gentle filtered ocean breeze & coastal surf
const bufferSize = ctx.sampleRate * 2;
const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
const data = buffer.getChannelData(0);
let lastOut = 0;
for (let i = 0; i < bufferSize; i++) {
const white = Math.random() * 2 - 1;
data[i] = (lastOut + 0.02 * white) / 1.02;
lastOut = data[i];
data[i] *= 2.4;
}

const noise = ctx.createBufferSource();
noise.buffer = buffer;
noise.loop = true;

const filter = ctx.createBiquadFilter();
filter.type = 'lowpass';
filter.frequency.value = 410;

const gain = ctx.createGain();
gain.gain.value = this.muted ? 0 : 0.026;

noise.connect(filter);
filter.connect(gain);
gain.connect(ctx.destination);
noise.start();
this.oceanGain = gain;
}

if (!this.musicMasterGain) {
this.musicMasterGain = ctx.createGain();
this.musicMasterGain.gain.value = this.muted ? 0 : 0.095;
this.musicMasterGain.connect(ctx.destination);
this.startBackgroundMusicLoop();
}
}

private startBackgroundMusicLoop(): void {
if (this.musicTimer !== null || typeof window === 'undefined') return;

// Warm tropical marimba & biblical harp melodies per world
const worldMelodies: Record<1 | 2 | 3, number[]> = {
// World 1: Isla del Portal Dorado (Joyful C Major / G Major island marimba)
1: [
523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
523.25, 587.33, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25,
],
// World 2: Valle de los Cedros (Pastoral F Major / Oasis Harp)
2: [
440.0, 523.25, 587.33, 698.46, 659.25, 587.33, 523.25, 440.0,
392.0, 440.0, 523.25, 587.33, 698.46, 783.99, 698.46, 587.33,
],
// World 3: Ciudadela Celestial de Sión (Celestial Harp & Chimes)
3: [
587.33, 739.99, 880.0, 1174.66, 1108.73, 880.0, 739.99, 659.25,
587.33, 659.25, 739.99, 880.0, 1174.66, 1318.5, 1174.66, 880.0,
],
};

const worldBass: Record<1 | 2 | 3, number[]> = {
1: [130.81, 174.61, 196.0, 130.81],
2: [146.83, 174.61, 130.81, 146.83],
3: [146.83, 185.0, 220.0, 146.83],
};

this.musicTimer = window.setInterval(() => {
if (this.muted || !this.ctx || !this.musicMasterGain) return;
if (this.ctx.state === 'suspended') return;

const now = this.ctx.currentTime;
const melody = worldMelodies[this.currentWorldId] || worldMelodies[1];
const bass = worldBass[this.currentWorldId] || worldBass[1];
const step = this.musicStep % melody.length;
this.musicStep++;

// Lead marimba / harp note
const noteFreq = melody[step];
const osc = this.ctx.createOscillator();
const noteGain = this.ctx.createGain();
osc.type = this.currentWorldId === 3 ? 'sine' : 'triangle';
osc.frequency.setValueAtTime(noteFreq, now);

noteGain.gain.setValueAtTime(0.001, now);
noteGain.gain.linearRampToValueAtTime(0.11, now + 0.025);
noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

osc.connect(noteGain);
noteGain.connect(this.musicMasterGain);
osc.start(now);
osc.stop(now + 0.38);

// Warm bass pulse every 4 steps
if (step % 4 === 0) {
const bassFreq = bass[Math.floor(step / 4) % bass.length];
const bOsc = this.ctx.createOscillator();
const bGain = this.ctx.createGain();
bOsc.type = 'sine';
bOsc.frequency.setValueAtTime(bassFreq, now);

bGain.gain.setValueAtTime(0.001, now);
bGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
bGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

bOsc.connect(bGain);
bGain.connect(this.musicMasterGain);
bOsc.start(now);
bOsc.stop(now + 1.15);
}
}, 340);
}

private setMusicDucking(ducked: boolean): void {
this.isSpeaking = ducked;
if (this.musicMasterGain && this.ctx && !this.muted) {
this.musicMasterGain.gain.setTargetAtTime(
ducked ? 0.032 : 0.095,
this.ctx.currentTime,
0.18,
);
}
}

/**
* Playful synthesized parrot squawk ("¡Brrr-kaka!") for Waka's funny voice!
*/
public playWakaSquawk(): void {
const ctx = this.ensureContext();
if (!ctx) return;
const now = ctx.currentTime;

const chirps = [
{ start: 0, f1: 680, f2: 1320, dur: 0.085 },
{ start: 0.1, f1: 1180, f2: 760, dur: 0.075 },
{ start: 0.19, f1: 860, f2: 1480, dur: 0.11 },
];

for (const c of chirps) {
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'triangle';
const t = now + c.start;
osc.frequency.setValueAtTime(c.f1, t);
osc.frequency.exponentialRampToValueAtTime(c.f2, t + c.dur);

gain.gain.setValueAtTime(0.001, t);
gain.gain.linearRampToValueAtTime(0.085, t + 0.015);
gain.gain.exponentialRampToValueAtTime(0.001, t + c.dur);

osc.connect(gain);
gain.connect(ctx.destination);
osc.start(t);
osc.stop(t + c.dur + 0.01);
}
}

public stopStoryCue(): void {
for (const timer of this.speechTimers) {
clearTimeout(timer);
}
this.speechTimers = [];

if (this.activeHtmlAudio) {
this.activeHtmlAudio.pause();
this.activeHtmlAudio.src = '';
this.activeHtmlAudio = null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
window.speechSynthesis.cancel();
}
this.setMusicDucking(false);
}

/**
* Plays a dramatized story cue or Biblical Treasure audio explanation.
* Automatically uses server Gemini TTS when available and falls back seamlessly
* to expressive Spanish Web Speech synthesis + Waka's funny voice effects.
*/
public playStoryCue(
cueId: string,
onLineChange?: (lineIndex: number) => void,
onComplete?: () => void,
): void {
const cue = STORY_CUES[cueId];
if (!cue) return;

this.stopStoryCue();
if (this.muted) {
onLineChange?.(0);
return;
}

this.startAmbience();
this.setMusicDucking(true);

// If Waka speaks first, play her signature funny chirp
if (cue.lines[0]?.speaker === 'Waka') {
this.playWakaSquawk();
}

const cachedWav = this.wavClientCache.get(cueId);
if (cachedWav) {
this.playWavBase64(cachedWav, cue, onLineChange, onComplete);
return;
}

// Attempt server TTS with a crisp 2.2s timeout so gameplay never lags
const controller = new AbortController();
const timeoutId = window.setTimeout(() => controller.abort(), 2200);

fetch('/api/voice/dramatize', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ cueId }),
signal: controller.signal,
})
.then(async (res) => {
clearTimeout(timeoutId);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = (await res.json()) as { audioBase64?: string };
if (!data.audioBase64) throw new Error('Empty audioBase64');
this.wavClientCache.set(cueId, data.audioBase64);
this.playWavBase64(data.audioBase64, cue, onLineChange, onComplete);
})
.catch(() => {
clearTimeout(timeoutId);
this.playBrowserSpeechFallback(cue, onLineChange, onComplete);
});
}

private playWavBase64(
base64: string,
cue: StoryCueDef,
onLineChange?: (lineIndex: number) => void,
onComplete?: () => void,
): void {
if (this.muted) return;
const audio = new Audio(`data:audio/wav;base64,${base64}`);
this.activeHtmlAudio = audio;
onLineChange?.(0);

if (cue.lines.length > 1) {
const switchTimer = window.setTimeout(() => {
if (cue.lines[1]?.speaker === 'Waka') {
this.playWakaSquawk();
}
onLineChange?.(1);
}, 4200);
this.speechTimers.push(switchTimer);
}

audio.onended = () => {
this.activeHtmlAudio = null;
this.setMusicDucking(false);
onComplete?.();
};
audio.onerror = () => {
this.activeHtmlAudio = null;
this.playBrowserSpeechFallback(cue, onLineChange, onComplete);
};

void audio.play().catch(() => {
this.playBrowserSpeechFallback(cue, onLineChange, onComplete);
});
}

private getVoiceProfile(speaker: VoiceSpeakerId): { pitch: number; rate: number } {
  switch (speaker) {
  case 'Waka':
  // Funny, squeaky, super energetic macaw voice!
  return { pitch: 1.65, rate: 1.13 };
  case 'Oli':
  // Warm, joyful young explorer girl
  return { pitch: 1.28, rate: 1.04 };
  case 'CapitanCoral':
  // Deep, theatrical pirate captain
  return { pitch: 0.78, rate: 0.98 };
  case 'Mateo':
  // Enthusiastic young guide
  return { pitch: 1.04, rate: 1.05 };
  case 'Ixchel':
  // Gentle, wise temple guardian
  return { pitch: 1.14, rate: 0.96 };
  }
  }

  private playBrowserSpeechFallback(
  cue: StoryCueDef,
  onLineChange?: (lineIndex: number) => void,
  onComplete?: () => void,
  ): void {
  if (this.muted || typeof window === 'undefined') return;

  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  if (!synth) {
  this.setMusicDucking(false);
  onComplete?.();
  return;
  }

  synth.cancel();
  const voices = synth.getVoices();
  const spanishVoices = voices.filter((v) =>
  /^es(-|_|$)/i.test(v.lang) || /Spanish|Español/i.test(v.name),
  );

  const speakLine = (idx: number) => {
  if (this.muted || idx >= cue.lines.length) {
  this.setMusicDucking(false);
  onComplete?.();
  return;
  }

  const line = cue.lines[idx];
  onLineChange?.(idx);

  if (line.speaker === 'Waka' && idx > 0) {
  this.playWakaSquawk();
  }

  const utter = new SpeechSynthesisUtterance(line.text);
  utter.lang = 'es-MX';
  const profile = this.getVoiceProfile(line.speaker);
  utter.pitch = profile.pitch;
  utter.rate = profile.rate;
  utter.volume = 1.0;

  if (spanishVoices.length > 0) {
  // Pick a suitable Spanish voice
  utter.voice = spanishVoices[idx % spanishVoices.length];
  }

  utter.onend = () => {
  const nextTimer = window.setTimeout(() => speakLine(idx + 1), 220);
  this.speechTimers.push(nextTimer);
  };
  utter.onerror = () => {
  this.setMusicDucking(false);
  onComplete?.();
  };

  synth.speak(utter);
  };

  speakLine(0);
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
  const pitch = 110 + (Math.random() - 0.5) * 18;
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);

  gain.gain.setValueAtTime(0.045, now);
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
  }
  }
  }
