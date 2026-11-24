import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import type { HudSnapshot, VirtualControlState } from '../game/GameEngine';
import { WORLD_THEMES, type WorldId } from '../game/phase1Logic';
import type { VoiceSpeakerId } from '../game/storyCues';

interface GameHUDProps {
hud: HudSnapshot;
onStart: () => void;
onRestart: () => void;
onNextWorld: () => void;
onSelectWorld: (worldId: WorldId) => void;
onTogglePause: () => void;
onReturnTitle: () => void;
onToggleMute: () => void;
onToggleMusic: () => void;
onToggleGraphics: () => void;
onAskWaka: () => void;
onInteractNpc: () => void;
onPlayCue: (cueId: string) => void;
onDismissCue: () => void;
onOpenQuiz: () => void;
onSpeakQuizHint: () => void;
onSpeakQuizWrong: () => void;
onCloseQuiz: () => void;
onSolveQuiz: (cueId: string) => void;
onVirtualInput?: (partial: Partial<VirtualControlState>) => void;
}

function blurAfter(fn: () => void) {
return (e: MouseEvent<HTMLButtonElement>) => {
e.currentTarget.blur();
fn();
};
}

function tryLockLandscape(): void {
try {
const orientation = window.screen?.orientation as
| (ScreenOrientation & { lock?: (mode: string) => Promise<void> })
| undefined;
if (orientation && typeof orientation.lock === 'function') {
void orientation.lock('landscape').catch(() => {});
}
} catch {
// ignore
}
}

function StarSvg({ filled = true, size = 22 }: { filled?: boolean; size?: number }) {
return (
<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
<path
d="M12 2.2l2.9 6.05 6.65.92-4.84 4.66 1.18 6.62L12 17.28l-5.89 3.17 1.18-6.62L2.45 9.17l6.65-.92L12 2.2z"
fill={filled ? '#ffd24c' : 'rgba(255, 244, 214, 0.22)'}
stroke="#2c1b0c"
strokeWidth="1.6"
strokeLinejoin="round"
/>
{filled && (
<path
d="M12 4.3l1.75 3.65-2.65 2.05L9.4 7.75 12 4.3z"
fill="#fff6c7"
opacity="0.7"
/>
)}
</svg>
);
}

function WingsSvg({ size = 28 }: { size?: number }) {
return (
<svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
<path
d="M4 17C4 10 10 6 14 11C18 6 24 10 24 17C20 16 17 18 14 21C11 18 8 16 4 17Z"
fill="#ffd85e"
stroke="#4a280a"
strokeWidth="1.6"
strokeLinejoin="round"
/>
</svg>
);
}

function ChestSvg({ opened = false, size = 20 }: { opened?: boolean; size?: number }) {
return (
<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
<rect
x="3"
y="10"
width="18"
height="10"
rx="2"
fill={opened ? '#d97b18' : '#5c3a1e'}
stroke="#ffe28a"
strokeWidth="1.6"
/>
<path
d="M3 10C3 6.5 7 5 12 5s9 1.5 9 5H3z"
fill={opened ? '#ffd24c' : '#7a4d28'}
stroke="#ffe28a"
strokeWidth="1.6"
/>
<rect x="10.5" y="9" width="3" height="4" rx="1" fill="#fff3b0" />
</svg>
);
}

const PORTRAIT_PALETTE: Record<VoiceSpeakerId, { bg: string; ring: string }> = {
Oli: { bg: '#ffe6b3', ring: '#f59e0b' },
Waka: { bg: '#ffd4cf', ring: '#ef4444' },
CapitanCoral: { bg: '#cceef5', ring: '#0ea5e9' },
Mateo: { bg: '#d9f2d0', ring: '#22c55e' },
Ixchel: { bg: '#d4f5ee', ring: '#14b8a6' },
MineroNoe: { bg: '#d6e4ff', ring: '#38bdf8' },
Ester: { bg: '#eed6ff', ring: '#a855f7' },
Samuel: { bg: '#f2eadc', ring: '#f59e0b' },
Miriam: { bg: '#ccf5ee', ring: '#0d9488' },
David: { bg: '#ffedd5', ring: '#ea580c' },
Caleb: { bg: '#f5e0cc', ring: '#b45309' },
};

function CharacterPortraitSvg({
speaker,
size = 54,
}: {
speaker: VoiceSpeakerId;
size?: number;
}) {
const palette = PORTRAIT_PALETTE[speaker] || PORTRAIT_PALETTE.Oli;

return (
<svg
width={size}
height={size}
viewBox="0 0 80 80"
aria-hidden="true"
className="shrink-0 drop-shadow-[0_3px_8px_rgba(0,0,0,0.4)]"
>
<circle cx="40" cy="40" r="37" fill={palette.bg} stroke={palette.ring} strokeWidth="4.5" />
{speaker === 'Waka' && (
<g>
<path d="M36 16 Q42 8 50 18 Q43 16 36 16 Z" fill="#f4c425" />
<circle cx="40" cy="43" r="20" fill="#d92525" />
<path d="M14 58 Q22 48 30 64 Z" fill="#1e66d6" />
<path d="M66 58 Q58 48 50 64 Z" fill="#f4c425" />
<ellipse cx="34" cy="40" rx="11" ry="9" fill="#f9f3ea" />
<ellipse cx="46" cy="40" rx="11" ry="9" fill="#f9f3ea" />
<circle cx="33" cy="39" r="3.2" fill="#1d1c1b" />
<circle cx="47" cy="39" r="3.2" fill="#1d1c1b" />
<circle cx="32" cy="37.8" r="1.1" fill="#ffffff" />
<circle cx="46" cy="37.8" r="1.1" fill="#ffffff" />
<path d="M33 44 Q40 39 47 44 Q43 56 40 57 Q37 56 33 44 Z" fill="#f2e4c7" stroke="#2b211a" strokeWidth="1.5" />
</g>
)}
{speaker === 'Oli' && (
<g>
<circle cx="19" cy="52" r="7" fill="#3a2013" />
<circle cx="61" cy="52" r="7" fill="#3a2013" />
<circle cx="40" cy="44" r="18" fill="#eeb992" />
<path d="M22 39 Q30 27 40 31 Q50 27 58 39 Q50 32 40 34 Q30 32 22 39 Z" fill="#351d11" />
<ellipse cx="40" cy="28" rx="26" ry="7" fill="#c5a26d" stroke="#422715" strokeWidth="2" />
<path d="M25 27 Q40 12 55 27 Z" fill="#c5a26d" stroke="#422715" strokeWidth="2" />
<circle cx="33" cy="44" r="3.4" fill="#2c190d" />
<circle cx="47" cy="44" r="3.4" fill="#2c190d" />
<circle cx="31.8" cy="42.8" r="1.2" fill="#ffffff" />
<circle cx="45.8" cy="42.8" r="1.2" fill="#ffffff" />
<path d="M34 52 Q40 58 46 52" fill="none" stroke="#9e3d35" strokeWidth="2.4" strokeLinecap="round" />
</g>
)}
{speaker === 'CapitanCoral' && (
<g>
<circle cx="40" cy="45" r="17" fill="#e6ad82" />
<path d="M24 49 Q40 69 56 49 Q52 66 40 67 Q28 66 24 49 Z" fill="#5c3621" />
<path d="M13 33 Q40 12 67 33 Q40 37 13 33 Z" fill="#202736" stroke="#f4c430" strokeWidth="2.4" />
<circle cx="40" cy="24" r="4" fill="#f4c430" />
<circle cx="33" cy="42" r="3" fill="#23160f" />
<circle cx="47" cy="42" r="3" fill="#23160f" />
<path d="M35 53 Q40 57 45 53" stroke="#fff2e6" strokeWidth="2.2" strokeLinecap="round" fill="none" />
</g>
)}
{speaker === 'MineroNoe' && (
<g>
<circle cx="40" cy="46" r="17" fill="#e6ad82" />
<path d="M26 52 Q40 66 54 52 Z" fill="#4f3322" />
{/* Miner Helmet + Glowing Headlamp */}
<path d="M21 34 Q40 14 59 34 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
<circle cx="40" cy="25" r="5.5" fill="#fef08a" stroke="#b45309" strokeWidth="2" />
<circle cx="33" cy="43" r="3" fill="#23160f" />
<circle cx="47" cy="43" r="3" fill="#23160f" />
<path d="M34 51 Q40 55 46 51" stroke="#fff2e6" strokeWidth="2.2" strokeLinecap="round" fill="none" />
</g>
)}
{(speaker === 'Samuel' || speaker === 'Caleb') && (
<g>
<circle cx="40" cy="44" r="17" fill="#e0a87e" />
{/* Wise White Beard & Hair */}
<path d="M24 46 Q40 71 56 46 Q51 64 40 65 Q29 64 24 46 Z" fill="#f3f4f6" />
<path d="M22 36 Q40 18 58 36 Q48 28 32 28 Z" fill="#e5e7eb" />
<circle cx="33" cy="42" r="2.8" fill="#1f2937" />
<circle cx="47" cy="42" r="2.8" fill="#1f2937" />
<path d="M35 51 Q40 55 45 51" stroke="#9e3d35" strokeWidth="2.2" strokeLinecap="round" fill="none" />
</g>
)}
{(speaker === 'Mateo' || speaker === 'David') && (
<g>
<circle cx="40" cy="46" r="17" fill="#ebba94" />
<path d="M22 36 Q40 17 58 36 Z" fill={speaker === 'David' ? '#d97706' : '#c29e65'} stroke="#4a280a" strokeWidth="2" />
<circle cx="34" cy="44" r="3" fill="#261810" />
<circle cx="46" cy="44" r="3" fill="#261810" />
<path d="M34 53 Q40 58 46 53" stroke="#9e3d35" strokeWidth="2.4" strokeLinecap="round" fill="none" />
</g>
)}
{(speaker === 'Ixchel' || speaker === 'Ester' || speaker === 'Miriam') && (
<g>
<path d="M20 40 Q20 65 28 67 L52 67 Q60 65 60 40 Q40 20 20 40 Z" fill="#291c18" />
<circle cx="40" cy="45" r="16.5" fill="#e6ad82" />
<path d="M24 31 L29 21 L35 28 L40 18 L45 28 L51 21 L56 31 Z" fill="#f6c945" stroke="#8c540b" strokeWidth="1.5" />
<circle cx="34" cy="44" r="2.8" fill="#1f1512" />
<circle cx="46" cy="44" r="2.8" fill="#1f1512" />
<path d="M35 52 Q40 56 45 52" stroke="#9e3d35" strokeWidth="2.2" strokeLinecap="round" fill="none" />
</g>
)}
</svg>
);
}

export function GameHUD({
  hud,
  onStart,
  onRestart,
  onNextWorld,
  onSelectWorld,
  onTogglePause,
  onReturnTitle,
  onToggleMute,
  onToggleMusic,
  onToggleGraphics,
  onAskWaka,
  onInteractNpc,
  onPlayCue,
  onDismissCue,
  onOpenQuiz,
  onSpeakQuizHint,
  onSpeakQuizWrong,
  onCloseQuiz,
  onSolveQuiz,
  onVirtualInput,
  }: GameHUDProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showWakaQuizHint, setShowWakaQuizHint] = useState(false);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const joyRef = useRef<HTMLDivElement | null>(null);
  const joyPointerIdRef = useRef<number | null>(null);
  const jumpPointerIdRef = useRef<number | null>(null);
  const descendPointerIdRef = useRef<number | null>(null);

  useEffect(() => {
  if (hud.phase !== 'playing') {
  joyPointerIdRef.current = null;
  jumpPointerIdRef.current = null;
  descendPointerIdRef.current = null;
  setKnobOffset({ x: 0, y: 0 });
  onVirtualInput?.({
  analogX: 0,
  analogY: 0,
  jumpOrAscend: false,
  descend: false,
  });
  }
  }, [hud.phase, onVirtualInput]);

  const maxJoyRadius = 40;
  const updateJoystick = (clientX: number, clientY: number) => {
  const el = joyRef.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > maxJoyRadius) {
  dx = (dx / dist) * maxJoyRadius;
  dy = (dy / dist) * maxJoyRadius;
  }
  setKnobOffset({ x: dx, y: dy });
  onVirtualInput?.({
  analogX: dx / maxJoyRadius,
  analogY: -dy / maxJoyRadius,
  });
  };

  const handleJoyDown = (e: PointerEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  if (joyPointerIdRef.current !== null) return;
  joyPointerIdRef.current = e.pointerId;
  try {
  e.currentTarget.setPointerCapture(e.pointerId);
  } catch {}
  updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: PointerEvent<HTMLDivElement>) => {
  if (e.pointerId !== joyPointerIdRef.current) return;
  e.preventDefault();
  e.stopPropagation();
  updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyUp = (e: PointerEvent<HTMLDivElement>) => {
  if (e.pointerId !== joyPointerIdRef.current) return;
  e.preventDefault();
  e.stopPropagation();
  joyPointerIdRef.current = null;
  setKnobOffset({ x: 0, y: 0 });
  onVirtualInput?.({ analogX: 0, analogY: 0 });
  };

  const handleJumpDown = (e: PointerEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();
  jumpPointerIdRef.current = e.pointerId;
  try {
  e.currentTarget.setPointerCapture(e.pointerId);
  } catch {}
  onVirtualInput?.({ jumpOrAscend: true });
  };

  const handleJumpUp = (e: PointerEvent<HTMLButtonElement>) => {
  if (e.pointerId !== jumpPointerIdRef.current) return;
  e.preventDefault();
  e.stopPropagation();
  jumpPointerIdRef.current = null;
  onVirtualInput?.({ jumpOrAscend: false });
  };

  const handleDescendDown = (e: PointerEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();
  descendPointerIdRef.current = e.pointerId;
  try {
  e.currentTarget.setPointerCapture(e.pointerId);
  } catch {}
  onVirtualInput?.({ descend: true });
  };

  const handleDescendUp = (e: PointerEvent<HTMLButtonElement>) => {
  if (e.pointerId !== descendPointerIdRef.current) return;
  e.preventDefault();
  e.stopPropagation();
  descendPointerIdRef.current = null;
  onVirtualInput?.({ descend: false });
  };

  const formatSeconds = (sec: number): string => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  if (hud.phase === 'title') {
  return (
  <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-6 md:p-10">
  <div
  aria-hidden="true"
  className="fixed inset-y-0 left-0 w-[580px] max-w-full bg-gradient-to-r from-[#0e222e]/88 via-[#0e222e]/48 to-transparent"
  />

  <div className="relative z-10 max-w-xl pt-2 md:pt-6">
  <div className="mb-3 flex items-center gap-3">
  <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
  <circle cx="24" cy="24" r="20" fill="#3d2411" stroke="#f5c451" strokeWidth="3" />
  <path
  d="M24 9l4.2 8.7 9.6 1.3-7 6.7 1.7 9.5L24 30.6l-8.5 4.6 1.7-9.5-7-6.7 9.6-1.3L24 9z"
  fill="#ffd85e"
  stroke="#4a280a"
  strokeWidth="1.5"
  strokeLinejoin="round"
  />
  </svg>
  <span className="font-display text-sm font-semibold tracking-wider text-amber-200 uppercase">
  Aventura Bíblica 3D · 3 Mundos Únicos
  </span>
  </div>

  <h1 className="font-display text-stroke-warm text-4xl leading-tight font-bold text-amber-50 sm:text-5xl [text-wrap:balance]">
  Isla del Portal Dorado
  </h1>

  <p className="mt-3 max-w-md text-base leading-relaxed text-amber-50/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
  Explora con <strong>Oli</strong> y su divertida guacamaya guía <strong>Waka</strong>{' '}
  tres mundos completamente distintos: la <strong>Isla Tropical</strong>, la{' '}
  <strong>Caverna Subterránea de Cristal</strong> y el{' '}
  <strong>Desierto Dorado del Éxodo</strong>, abriendo los{" "}
  <strong>9 Cofres de Tesoros Bíblicos</strong> con voces dramatizadas.
  </p>

  <div className="mt-6 flex flex-wrap items-center gap-3">
  <button
  type="button"
  data-start="true"
  onClick={blurAfter(() => {
  tryLockLandscape();
  onStart();
  })}
  className="pointer-events-auto cursor-pointer rounded-xl border-2 border-[#ffe28a] bg-[#d97b18] px-7 py-3.5 font-display text-lg font-bold whitespace-nowrap text-amber-50 shadow-[0_6px_0_#7c3f08,0_12px_24px_rgba(0,0,0,0.45)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#e58822]"
  >
  Explorar Mundo 1 · Isla Tropical
  </button>
  <button
  type="button"
  onClick={blurAfter(() => {
  tryLockLandscape();
  onSelectWorld(2);
  })}
  className="pointer-events-auto cursor-pointer rounded-xl border border-cyan-300/60 bg-[#182142]/92 px-4 py-3 font-display text-sm font-semibold text-cyan-100 shadow-md transition-colors hover:bg-[#233163]"
  >
  Mundo 2 · Caverna Subterránea
  </button>
  <button
  type="button"
  onClick={blurAfter(() => {
  tryLockLandscape();
  onSelectWorld(3);
  })}
  className="pointer-events-auto cursor-pointer rounded-xl border border-amber-300/60 bg-[#47250e]/92 px-4 py-3 font-display text-sm font-semibold text-amber-100 shadow-md transition-colors hover:bg-[#613314]"
  >
  Mundo 3 · Desierto Dorado
  </button>
  </div>
  </div>

  <div aria-hidden="true" className="fixed inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
  <p className="relative z-10 text-center text-xs font-semibold tracking-wide text-amber-50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] sm:text-sm">
  Joystick / WASD Mover · Botón / Espacio Saltar y Volar · F Hablar / Reto Bíblico · G Guía Waka
  </p>
  </div>
  );
  }

  const starsProgressText = hud.flightUnlocked
  ? hud.isFlying
  ? 'Volando · Atraviesa los aros del cielo'
  : 'Vuelo listo · Mantén el botón de Alas o Espacio para elevarte'
  : `Recoge ${Math.max(0, hud.starsNeededForFlight - hud.stars)} estrellas más para volar`;

  const nextWorldLabel =
  hud.worldId === 1
  ? 'Mundo 2: Caverna Subterránea de Cristal'
  : hud.worldId === 2
  ? 'Mundo 3: Desierto Dorado del Éxodo'
  : 'Mundo 1: Isla del Portal Dorado';

  return (
  <div className="pointer-events-none fixed inset-0 z-10">
  {/* Top-Left Adventure & Biblical Treasures Cluster */}
  <div className="fixed top-3 left-3 flex max-w-xs flex-col gap-1.5 sm:top-4 sm:left-4 sm:max-w-sm">
  {/* Current World Selector Pill */}
  <div className="pointer-events-auto rounded-xl border border-amber-300/45 bg-[#24160b]/90 px-3 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
  <div className="flex items-center justify-between gap-2">
  <div className="min-w-0">
  <div className="truncate font-display text-xs font-bold tracking-wide text-amber-200 uppercase">
  {hud.worldName}
  </div>
  <div className="truncate text-[10px] text-amber-100/80">{hud.worldSubtitle}</div>
  </div>
  <div className="flex shrink-0 items-center gap-1">
  {([1, 2, 3] as WorldId[]).map((wId) => (
  <button
  key={wId}
  type="button"
  onClick={blurAfter(() => onSelectWorld(wId))}
  title={`Viajar a ${WORLD_THEMES[wId].shortName}`}
  className={`h-7 w-7 cursor-pointer rounded-lg font-display text-xs font-bold transition-colors ${
  hud.worldId === wId
  ? 'border border-[#ffe28a] bg-[#d97b18] text-amber-50'
  : 'bg-[#170e06] text-amber-200/75 hover:bg-[#382312] hover:text-amber-50'
  }`}
  >
  {wId}
  </button>
  ))}
  </div>
  </div>
  </div>

  {/* Stars & Flight Row */}
  <div className="flex items-center gap-2">
  <div className="flex items-center gap-2 rounded-xl border border-amber-300/45 bg-[#24160b]/88 px-3 py-1.5 shadow-md">
  <StarSvg filled size={20} />
  <div className="flex items-baseline gap-1.5">
  <span
  data-testid="star-count"
  className="font-display text-stroke-sm text-lg leading-none font-bold text-amber-100 tabular-nums"
  >
  {hud.stars}/{hud.totalStars}
  </span>
  <span className="text-[10px] font-semibold tracking-wide text-amber-200/80 uppercase">
  Estrellas
  </span>
  </div>
  </div>

  {hud.flightUnlocked && (
  <div className="flex items-center gap-1.5 rounded-xl border border-amber-300/40 bg-[#24160b]/88 px-2.5 py-1.5 shadow-md">
  <WingsSvg size={18} />
  <div className="h-2 w-14 overflow-hidden rounded-full bg-amber-950/90 ring-1 ring-amber-200/25">
  <div
  className="h-full origin-left rounded-full bg-[#ffd24c] transition-transform duration-100"
  style={{
  transform: `scaleX(${Math.max(0, Math.min(1, hud.flightEnergy / 100))})`,
  }}
  />
  </div>
  <span className="text-[10px] font-bold text-amber-100 tabular-nums">
  {hud.flightEnergy}%
  </span>
  </div>
  )}
  </div>

  <div className="hidden rounded-lg border border-amber-200/25 bg-[#1a1108]/80 px-3 py-1 text-[11px] font-medium text-amber-50 shadow-sm sm:block">
  {starsProgressText}
  </div>

  {/* Cofres de Tesoros Bíblicos Interactive List */}
  <div className="pointer-events-auto rounded-xl border border-amber-300/45 bg-[#24160b]/90 p-2 shadow-lg">
  <div className="mb-1 flex items-center justify-between">
  <span className="font-display text-[11px] font-bold tracking-wide text-[#ffe27a] uppercase">
  Cofres Bíblicos ({hud.chestsCollected.length}/{hud.totalChests})
  </span>
  <span className="text-[10px] font-semibold text-amber-200/80">
  {hud.portalAwakened ? '¡Portal Abierto!' : 'Abre los 3 cofres'}
  </span>
  </div>
  <div className="flex flex-col gap-1">
  {hud.chestsDefs.map((chest) => {
  const found = hud.chestsCollected.includes(chest.id);
  return (
  <button
  key={chest.id}
  type="button"
  onClick={blurAfter(() => onPlayCue(chest.cueId))}
  title="Toca para escuchar la explicación bíblica en audio"
  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-2 py-1 text-left transition-colors ${
  found
  ? 'border-amber-300/60 bg-[#3b2410] text-amber-50 hover:bg-[#4c2f15]'
  : 'border-amber-200/15 bg-[#170e07]/85 text-amber-100/75 hover:bg-[#2b1a0d]'
  }`}
  >
  <div className="flex min-w-0 items-center gap-1.5">
  <ChestSvg opened={found} size={16} />
  <div className="min-w-0">
  <div className="truncate text-[11px] font-bold">{chest.name}</div>
  <div className="truncate text-[9px] text-amber-200/80">{chest.bibleVerse}</div>
  </div>
  </div>
  <span className="shrink-0 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
  🔊 Audio
  </span>
  </button>
  );
  })}
  </div>
  </div>
  </div>

  {/* Top-Right Compact Utility Controls + Waka Funny Voice Guide Button */}
  <div className="fixed top-3 right-3 flex items-center gap-1.5 sm:top-4 sm:right-4 sm:gap-2">
  <button
  type="button"
  tabIndex={-1}
  onClick={blurAfter(onAskWaka)}
  title="Escuchar consejo gracioso de Waka (G)"
  className="pointer-events-auto flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#ffe28a] bg-[#b83227]/95 px-3 font-display text-xs font-bold text-amber-50 shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#cc3b2f]"
  >
  <span>🦜 Guía Waka</span>
  </button>

  <button
  type="button"
  tabIndex={-1}
  onClick={blurAfter(onToggleGraphics)}
  title={
  hud.graphicsQuality === 'ultra'
  ? 'Calidad gráfica: Nintendo HD (Bloom + MSAA + Sombras HD). Toca para modo Rápido'
  : 'Calidad gráfica: Modo Rápido. Toca para Nintendo HD'
  }
  className={`pointer-events-auto flex h-10 cursor-pointer items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold shadow-md transition-colors hover:bg-[#382312] ${
  hud.graphicsQuality === 'ultra'
  ? 'border-[#ffe28a]/70 bg-[#2d1b0c]/90 text-[#ffe27a]'
  : 'border-amber-200/30 bg-[#24160b]/85 text-amber-100/80'
  }`}
  >
  <span>{hud.graphicsQuality === 'ultra' ? '✨ HD' : '⚡ Rápido'}</span>
  </button>

  <button
  type="button"
  tabIndex={-1}
  aria-label={hud.musicEnabled ? 'Pausar música' : 'Activar música'}
  title={hud.musicEnabled ? 'Música activa' : 'Música apagada'}
  onClick={blurAfter(onToggleMusic)}
  className={`pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border bg-[#24160b]/85 shadow-md transition-colors hover:bg-[#382312] ${
  hud.musicEnabled
  ? 'border-amber-200/45 text-amber-200'
  : 'border-amber-200/20 text-amber-200/45'
  }`}
  >
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M9 18V5l11-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
  <circle cx="17" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
  {!hud.musicEnabled && <path d="M4 4l16 16" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round" />}
  </svg>
  </button>

  <button
  type="button"
  tabIndex={-1}
  aria-label={hud.muted ? 'Activar sonido' : 'Silenciar sonido'}
  title={hud.muted ? 'Activar sonido (M)' : 'Silenciar (M)'}
  onClick={blurAfter(onToggleMute)}
  className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-amber-200/40 bg-[#24160b]/85 text-amber-100 shadow-md transition-colors hover:bg-[#382312]"
  >
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  {hud.muted ? (
  <path d="M22 9l-6 6M16 9l6 6" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
  ) : (
  <path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  )}
  </svg>
  </button>

  <button
  type="button"
  tabIndex={-1}
  aria-label="Reiniciar mundo"
  title="Reiniciar mundo (R)"
  onClick={blurAfter(onRestart)}
  className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-amber-200/40 bg-[#24160b]/85 text-amber-100 shadow-md transition-colors hover:bg-[#382312]"
  >
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M3 12a9 9 0 103-6.7L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
  </button>

  <button
  type="button"
  tabIndex={-1}
  aria-label="Pausar juego"
  title="Pausa (P)"
  onClick={blurAfter(onTogglePause)}
  className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-amber-200/40 bg-[#24160b]/85 text-amber-100 shadow-md transition-colors hover:bg-[#382312]"
  >
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <rect x="6" y="5" width="4" height="14" rx="1" />
  <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
  </button>
  </div>

  {/* Transient Flight Unlock Banner */}
  {hud.justUnlockedFlight && hud.phase === 'playing' && (
  <div className="fixed top-16 left-1/2 -translate-x-1/2 rounded-xl border-2 border-[#ffe28a] bg-[#36200b]/95 px-6 py-2.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
  <p className="font-display text-base font-bold text-[#ffe27a] sm:text-lg">
  ¡Poder de Vuelo Desbloqueado!
  </p>
  </div>
  )}

  {/* Nearby NPC Interaction Prompt */}
  {hud.nearbyNpc && hud.phase === 'playing' && !hud.activeQuiz && (
  <div className="fixed top-15 right-3 z-20 flex flex-col items-end sm:right-4">
  <button
  type="button"
  onClick={blurAfter(() => {
  setSelectedOption(null);
  setShowWakaQuizHint(false);
  onInteractNpc();
  })}
  className="pointer-events-auto cursor-pointer rounded-xl border-2 border-[#ffe28a] bg-[#2a1a0d]/95 px-3.5 py-2 text-left shadow-xl transition-transform hover:scale-105"
  >
  <div className="font-display text-xs font-bold text-[#ffe27a]">
  ✨ {hud.nearbyNpc.name} ({hud.nearbyNpc.role})
  </div>
  <div className="mt-0.5 text-[10px] font-semibold text-amber-100">
  Toca aquí o presiona [F] para Reto Bíblico
  </div>
  </button>
  </div>
  )}

  {/* Active Dramatized Story / Biblical Treasure Audio Card */}
  {hud.activeStoryCue && hud.phase === 'playing' && !hud.activeQuiz && (
  <div className="pointer-events-auto fixed bottom-4 left-1/2 z-20 w-[min(520px,calc(100vw-16.5rem))] min-w-[260px] -translate-x-1/2 rounded-2xl border-2 border-[#ffe28a] bg-[#24150a]/95 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.65)] sm:p-4">
  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/20 pb-1.5">
  <div className="min-w-0 flex-1">
  <div className="truncate font-display text-xs font-bold text-[#ffe27a] sm:text-sm">
  {hud.activeStoryCue.title}
  </div>
  {hud.activeStoryCue.bibleVerse && (
  <div className="truncate text-[10px] font-semibold text-amber-200/90 sm:text-xs">
  📖 {hud.activeStoryCue.bibleVerse}
  </div>
  )}
  </div>
  <div className="flex shrink-0 items-center gap-1">
  <button
  type="button"
  onClick={blurAfter(() => onPlayCue(hud.activeStoryCue!.cueId))}
  className="cursor-pointer rounded-lg border border-amber-300/40 bg-[#3b2310] px-2 py-1 text-[11px] font-bold text-amber-100 hover:bg-[#4f2f16]"
  >
  🔊 Repetir
  </button>
  {hud.activeStoryCue.hasQuiz && (
  <button
  type="button"
  onClick={blurAfter(() => {
  setSelectedOption(null);
  setShowWakaQuizHint(false);
  onOpenQuiz();
  })}
  className="cursor-pointer rounded-lg border border-[#ffe28a] bg-[#d97b18] px-2 py-1 text-[11px] font-bold text-amber-50 hover:bg-[#e58822]"
  >
  {hud.activeStoryCue.quizSolved ? '✅ Reto' : '🎯 Reto Bíblico'}
  </button>
  )}
  <button
  type="button"
  onClick={blurAfter(onDismissCue)}
  className="cursor-pointer rounded-lg px-1.5 py-1 text-xs font-semibold text-amber-200/75 hover:text-amber-50"
  >
  ✕
  </button>
  </div>
  </div>

  <div className="mt-2 flex items-center gap-3">
  <CharacterPortraitSvg speaker={hud.activeStoryCue.speaker} size={50} />
  <div className="min-w-0 flex-1">
  <div className="font-display text-xs font-bold text-amber-200">
  {hud.activeStoryCue.displayName}
  </div>
  <p className="mt-0.5 text-xs leading-snug text-amber-50 sm:text-sm">
  “{hud.activeStoryCue.text}”
  </p>
  </div>
  </div>
  </div>
  )}

  {/* Big Golden Analog Virtual Joystick + Round Tactile Action Buttons */}
  {hud.phase === 'playing' && !hud.activeQuiz && (
  <div data-touch-controls="true" className="pointer-events-none fixed inset-0 z-15 select-none">
  <div
  ref={joyRef}
  onPointerDown={handleJoyDown}
  onPointerMove={handleJoyMove}
  onPointerUp={handleJoyUp}
  onPointerCancel={handleJoyUp}
  aria-label="Mover exploradora"
  className="pointer-events-auto fixed bottom-4 left-4 flex h-26 w-26 touch-none items-center justify-center rounded-full border-2 border-amber-200/55 bg-[#1b1209]/60 shadow-[0_6px_22px_rgba(0,0,0,0.45)] backdrop-blur-[2px] sm:h-28 sm:w-28"
  >
  <div className="pointer-events-none absolute inset-3 rounded-full border border-amber-300/25" />
  <div
  className="pointer-events-none h-11 w-11 rounded-full border-2 border-[#fff0b3] bg-gradient-to-b from-[#ffb83d] to-[#d97b18] shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
  style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
  />
  </div>

  <div className="pointer-events-none fixed right-4 bottom-4 flex items-end gap-2.5">
  {hud.nearbyNpc && (
  <button
  type="button"
  tabIndex={-1}
  onPointerDown={(e) => {
  e.preventDefault();
  e.stopPropagation();
  setSelectedOption(null);
  setShowWakaQuizHint(false);
  onInteractNpc();
  }}
  aria-label="Hablar con personaje"
  className="pointer-events-auto flex h-14 w-14 touch-none items-center justify-center rounded-full border-2 border-white bg-sky-500 text-white shadow-[0_5px_0_#0369a1,0_10px_20px_rgba(0,0,0,0.4)] active:translate-y-0.5"
  >
  <span className="font-display text-xs font-bold">Hablar</span>
  </button>
  )}

  {hud.flightUnlocked && (
  <button
  type="button"
  tabIndex={-1}
  onPointerDown={handleDescendDown}
  onPointerUp={handleDescendUp}
  onPointerCancel={handleDescendUp}
  aria-label="Bajar al suelo"
  className="pointer-events-auto flex h-14 w-14 touch-none items-center justify-center rounded-full border-2 border-amber-200 bg-[#3a2511]/90 text-amber-100 shadow-[0_5px_0_#1e1207,0_10px_20px_rgba(0,0,0,0.4)] active:translate-y-0.5"
  >
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 5v14m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
  </button>
  )}

  <button
  type="button"
  tabIndex={-1}
  onPointerDown={handleJumpDown}
  onPointerUp={handleJumpUp}
  onPointerCancel={handleJumpUp}
  aria-label={hud.flightUnlocked ? 'Saltar o volar' : 'Saltar'}
  className="pointer-events-auto flex h-20 w-20 touch-none flex-col items-center justify-center rounded-full border-2 border-[#fff3bf] bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-amber-50 shadow-[0_6px_0_#7c3f08,0_12px_24px_rgba(0,0,0,0.45)] active:translate-y-0.5"
  >
  {hud.flightUnlocked ? (
  <>
  <WingsSvg size={32} />
  <span className="font-display text-[10px] font-bold">Volar</span>
  </>
  ) : (
  <>
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 19V5m0 0l-6 6m6-6l6 6" stroke="#fff8db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
  <span className="font-display text-[10px] font-bold">Saltar</span>
  </>
  )}
  </button>
  </div>
  </div>
  )}

  {/* Interactive Biblical Challenge Quiz Modal (100% Dramatized Voice) */}
  {hud.activeQuiz && (
  <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#091620]/70 p-4">
  <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-[#ffe28a] bg-[#2a1a0d] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.75)] sm:p-6">
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-2.5">
  <CharacterPortraitSvg speaker={hud.activeQuiz.npcSpeaker} size={38} />
  <span className="font-display text-xs font-bold tracking-wider text-[#ffe27a] uppercase">
  📖 Reto Bíblico Interactivo
  </span>
  </div>
  <button
  type="button"
  onClick={blurAfter(onCloseQuiz)}
  className="cursor-pointer text-xs font-semibold text-amber-200/80 hover:text-amber-50"
  >
  Cerrar ✕
  </button>
  </div>

  <h3 className="mt-2.5 font-display text-lg font-bold text-amber-50 sm:text-xl">
  {hud.activeQuiz.question}
  </h3>

  <div className="mt-3.5 flex flex-col gap-2">
  {hud.activeQuiz.options.map((opt, idx) => {
  const isSelected = selectedOption === idx;
  const isCorrect = idx === hud.activeQuiz!.correctIndex;
  return (
  <button
  key={idx}
  type="button"
  onClick={() => {
  setSelectedOption(idx);
  if (idx !== hud.activeQuiz!.correctIndex) {
  onSpeakQuizWrong();
  }
  }}
  className={`cursor-pointer rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
  isSelected
  ? isCorrect
  ? 'border-emerald-300 bg-emerald-800/80 text-emerald-50'
  : 'border-rose-300 bg-rose-900/75 text-rose-100'
  : 'border-amber-200/30 bg-[#1a1008] text-amber-100 hover:bg-[#382312]'
  }`}
  >
  {opt}
  </button>
  );
  })}
  </div>

  {showWakaQuizHint && (
  <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-amber-300/40 bg-[#3d2210] p-2.5 text-xs font-medium text-amber-100">
  <CharacterPortraitSvg speaker="Waka" size={34} />
  <div>
  <strong>Pista de Waka:</strong> {hud.activeQuiz.wakaHint}
  </div>
  </div>
  )}

  {selectedOption !== null && (
  <div className="mt-2.5 text-sm font-bold">
  {selectedOption === hud.activeQuiz.correctIndex ? (
  <p className="text-emerald-300">🌟 {hud.activeQuiz.rewardMessage}</p>
  ) : (
  <p className="text-amber-200">🦜 {hud.activeQuiz.wrongReply}</p>
  )}
  </div>
  )}

  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
  <button
  type="button"
  onClick={blurAfter(() => {
  setShowWakaQuizHint(true);
  onSpeakQuizHint();
  })}
  className="cursor-pointer rounded-xl border border-amber-300/45 bg-[#b83227] px-4 py-2 font-display text-xs font-bold text-amber-50 hover:bg-[#cc3b2f]"
  >
  🦜 Pista graciosa de Waka
  </button>

  {selectedOption === hud.activeQuiz.correctIndex && (
  <button
  type="button"
  onClick={blurAfter(() => {
  const cId = hud.activeQuiz!.cueId;
  setSelectedOption(null);
  setShowWakaQuizHint(false);
  onSolveQuiz(cId);
  })}
  className="cursor-pointer rounded-xl border-2 border-[#ffe28a] bg-[#d97b18] px-5 py-2 font-display text-sm font-bold text-amber-50 hover:bg-[#e58822]"
  >
  ¡Recibir Bendición y Continuar!
  </button>
  )}
  </div>
  </div>
  </div>
  )}

  {/* Pause Modal */}
  {hud.phase === 'paused' && (
  <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#091620]/65 p-4">
  <div
  role="dialog"
  aria-modal="true"
  aria-label="Juego en pausa"
  className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-2xl border-2 border-amber-300/60 bg-[#2a1a0d] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
  >
  <h2 className="font-display text-2xl font-bold text-amber-50">Aventura en pausa</h2>
  <p className="mt-1 text-sm text-amber-200/80">{hud.worldName}</p>

  <div className="mt-5 grid grid-cols-3 gap-2.5">
  <div className="rounded-xl bg-[#1b1007] p-3">
  <div className="text-[11px] font-medium text-amber-200/75 uppercase">Estrellas</div>
  <div className="mt-1 font-display text-lg font-bold text-amber-100 tabular-nums">
  {hud.stars}/{hud.totalStars}
  </div>
  </div>
  <div className="rounded-xl bg-[#1b1007] p-3">
  <div className="text-[11px] font-medium text-amber-200/75 uppercase">Cofres</div>
  <div className="mt-1 font-display text-lg font-bold text-[#ffd24c] tabular-nums">
  {hud.chestsCollected.length}/{hud.totalChests}
  </div>
  </div>
  <div className="rounded-xl bg-[#1b1007] p-3">
  <div className="text-[11px] font-medium text-amber-200/75 uppercase">Tiempo</div>
  <div className="mt-1 font-display text-lg font-bold text-amber-100 tabular-nums">
  {formatSeconds(hud.elapsedTime)}
  </div>
  </div>
  </div>

  <div className="mt-6 flex flex-col gap-2.5">
  <button
  type="button"
  onClick={blurAfter(onTogglePause)}
  className="cursor-pointer rounded-xl border border-[#ffe28a] bg-[#d97b18] px-5 py-2.5 font-display text-base font-bold text-amber-50 transition-colors hover:bg-[#e58822]"
  >
  Continuar
  </button>
  <button
  type="button"
  onClick={blurAfter(onRestart)}
  className="cursor-pointer rounded-xl border border-amber-200/30 bg-[#3c2614] px-5 py-2.5 text-sm font-semibold text-amber-100 transition-colors hover:bg-[#4b3019]"
  >
  Reiniciar mundo
  </button>
  <button
  type="button"
  onClick={blurAfter(onReturnTitle)}
  className="cursor-pointer rounded-xl px-5 py-2 text-sm font-medium text-amber-200/80 transition-colors hover:text-amber-50"
  >
  Volver al título
  </button>
  </div>
  </div>
  </div>
  )}

  {/* Golden Portal Victory & Next World Transition Modal */}
  {hud.phase === 'gameover' && (
  <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#091620]/70 p-4">
  <div
  role="dialog"
  aria-modal="true"
  aria-label="Portal Dorado Alcanzado"
  className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#ffe28a] bg-[#2a1a0d] p-6 text-center shadow-[0_22px_60px_rgba(0,0,0,0.65)]"
  >
  <div className="mx-auto mb-3 flex items-center justify-center gap-3">
  <CharacterPortraitSvg speaker="Oli" size={50} />
  <StarSvg filled size={32} />
  <CharacterPortraitSvg speaker="Waka" size={50} />
  </div>

  <h2 className="font-display text-2xl font-bold text-amber-50 sm:text-3xl">
  ¡Portal Dorado Alcanzado!
  </h2>
  <p className="mt-1.5 text-sm text-amber-100/90">
  Descubriste los 3 Tesoros Bíblicos de <strong>{hud.worldName}</strong> con Oli y Waka.
  </p>
  <p className="mt-1 text-xs font-semibold text-amber-200/85">📖 {hud.worldBibleVerse}</p>

  <div className="mt-4 grid grid-cols-3 gap-2.5">
  <div className="rounded-xl bg-[#1b1007] p-2.5">
  <div className="text-[11px] font-medium text-amber-200/75 uppercase">Cofres Bíblicos</div>
  <div className="mt-1 font-display text-lg font-bold text-[#ffd24c] tabular-nums">
  {hud.chestsCollected.length}/{hud.totalChests}
  </div>
  </div>
  <div className="rounded-xl bg-[#1b1007] p-2.5">
  <div className="text-[11px] font-medium text-amber-200/75 uppercase">Estrellas</div>
  <div className="mt-1 font-display text-lg font-bold text-amber-100 tabular-nums">
  {hud.stars}/{hud.totalStars}
  </div>
  </div>
  <div className="rounded-xl bg-[#1b1007] p-2.5">
  <div className="text-[11px] font-medium text-amber-200/75 uppercase">Tiempo</div>
  <div className="mt-1 font-display text-lg font-bold text-amber-100 tabular-nums">
  {formatSeconds(hud.elapsedTime)}
  </div>
  </div>
  </div>

  <div className="mt-5 flex flex-col gap-2.5">
  <button
  type="button"
  data-start="true"
  onClick={blurAfter(onNextWorld)}
  className="w-full cursor-pointer rounded-xl border-2 border-[#ffe28a] bg-[#d97b18] px-5 py-3 font-display text-base font-bold text-amber-50 shadow-lg transition-colors hover:bg-[#e58822]"
  >
  ✨ Viajar por el Portal al {nextWorldLabel}
  </button>
  <div className="flex gap-2.5">
  <button
  type="button"
  onClick={blurAfter(onRestart)}
  className="flex-1 cursor-pointer rounded-xl border border-amber-200/30 bg-[#3c2614] px-4 py-2.5 text-sm font-semibold text-amber-100 transition-colors hover:bg-[#4b3019]"
  >
  Repetir este mundo
  </button>
  <button
  type="button"
  onClick={blurAfter(onReturnTitle)}
  className="flex-1 cursor-pointer rounded-xl border border-amber-200/30 bg-[#24160b] px-4 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-[#382312]"
  >
  Pantalla inicial
  </button>
  </div>
  </div>
  </div>
  </div>
  )}
  </div>
  );
  }