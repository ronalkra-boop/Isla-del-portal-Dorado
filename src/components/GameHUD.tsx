import { useState, type MouseEvent } from 'react';
import type { HudSnapshot } from '../game/GameEngine';
import type { WorldId } from '../game/phase1Logic';

interface GameHUDProps {
hud: HudSnapshot;
onStart: () => void;
onRestart: () => void;
onNextWorld: () => void;
onSelectWorld: (worldId: WorldId) => void;
onTogglePause: () => void;
onReturnTitle: () => void;
onToggleMute: () => void;
onAskWaka: () => void;
onInteractNpc: () => void;
onPlayCue: (cueId: string) => void;
onDismissCue: () => void;
onOpenQuiz: () => void;
onCloseQuiz: () => void;
onSolveQuiz: (cueId: string) => void;
}

function blurAfter(fn: () => void) {
return (e: MouseEvent<HTMLButtonElement>) => {
e.currentTarget.blur();
fn();
};
}

function StarSvg({ filled = true, size = 22 }: { filled?: boolean; size?: number }) {
return (
<svg
width={size}
height={size}
viewBox="0 0 24 24"
aria-hidden="true"
className="shrink-0"
>
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

function ChestSvg({ opened = false, size = 20 }: { opened?: boolean; size?: number }) {
return (
<svg
width={size}
height={size}
viewBox="0 0 24 24"
aria-hidden="true"
className="shrink-0"
>
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

export function GameHUD({
hud,
onStart,
onRestart,
onNextWorld,
onSelectWorld,
onTogglePause,
onReturnTitle,
onToggleMute,
onAskWaka,
onInteractNpc,
onPlayCue,
onDismissCue,
onOpenQuiz,
onCloseQuiz,
onSolveQuiz,
}: GameHUDProps) {
const [selectedOption, setSelectedOption] = useState<number | null>(null);
const [showWakaQuizHint, setShowWakaQuizHint] = useState(false);

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
className="fixed inset-y-0 left-0 w-[560px] max-w-full bg-gradient-to-r from-[#0e222e]/85 via-[#0e222e]/45 to-transparent"
/>

<div className="relative z-10 max-w-xl pt-2 md:pt-6">
<div className="mb-3 flex items-center gap-3">
<svg
width="44"
height="44"
viewBox="0 0 48 48"
aria-hidden="true"
className="shrink-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)]"
>
<circle
cx="24"
cy="24"
r="20"
fill="#3d2411"
stroke="#f5c451"
strokeWidth="3"
/>
<path
d="M24 9l4.2 8.7 9.6 1.3-7 6.7 1.7 9.5L24 30.6l-8.5 4.6 1.7-9.5-7-6.7 9.6-1.3L24 9z"
fill="#ffd85e"
stroke="#4a280a"
strokeWidth="1.5"
strokeLinejoin="round"
/>
</svg>
<span className="font-display text-sm font-semibold tracking-wider text-amber-200 uppercase">
Aventura Bíblica 3D · 3 Mundos Jugables
</span>
</div>

<h1 className="font-display text-stroke-warm text-4xl leading-tight font-bold text-amber-50 sm:text-5xl [text-wrap:balance]">
Isla del Portal Dorado
</h1>

<p className="mt-3 max-w-md text-base leading-relaxed text-amber-50/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
Explora con <strong>Oli</strong> y su divertida guacamaya guía{' '}
<strong>Waka</strong>, encuentra los{' '}
<strong>Cofres de Tesoros Bíblicos</strong> (como el Candelero de Oro,
la Santa Biblia y el Cayado del Buen Pastor) con explicaciones en
audio, y cruza el Portal Dorado hacia <strong>2 mundos más</strong>.
</p>

<div className="mt-6 flex flex-wrap items-center gap-3">
<button
type="button"
data-start="true"
onClick={blurAfter(onStart)}
className="pointer-events-auto cursor-pointer rounded-xl border-2 border-[#ffe28a] bg-[#d97b18] px-7 py-3.5 font-display text-lg font-bold whitespace-nowrap text-amber-50 shadow-[0_6px_0_#7c3f08,0_12px_24px_rgba(0,0,0,0.45)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#e58822] active:translate-y-0.5"
>
Explorar Mundo 1 · La Isla
</button>
<button
type="button"
onClick={blurAfter(() => onSelectWorld(2))}
className="pointer-events-auto cursor-pointer rounded-xl border border-amber-300/50 bg-[#2a1a0d]/90 px-4 py-3 font-display text-sm font-semibold text-amber-100 shadow-md transition-colors hover:bg-[#3d2613]"
>
Mundo 2 · Valle de los Cedros
</button>
<button
type="button"
onClick={blurAfter(() => onSelectWorld(3))}
className="pointer-events-auto cursor-pointer rounded-xl border border-amber-300/50 bg-[#2a1a0d]/90 px-4 py-3 font-display text-sm font-semibold text-amber-100 shadow-md transition-colors hover:bg-[#3d2613]"
>
Mundo 3 · Ciudadela de Sión
</button>
</div>
</div>

<div
aria-hidden="true"
className="fixed inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent"
/>
<p className="relative z-10 text-center text-xs font-semibold tracking-wide text-amber-50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] sm:text-sm">
WASD Mover · Espacio Saltar / Volar · F Hablar / Reto Bíblico · G Guía Waka · Arrastrar ratón Cámara
</p>
</div>
);
}

const starsProgressText = hud.flightUnlocked
? hud.isFlying
? 'Volando · Atraviesa los aros dorados del cielo'
: 'Vuelo listo · Mantén Espacio para elevarte'
: `Recoge ${Math.max(0, hud.starsNeededForFlight - hud.stars)} estrellas más para volar`;

const nextWorldLabel =
hud.worldId === 1
? 'Mundo 2: Valle de los Cedros'
: hud.worldId === 2
? 'Mundo 3: Ciudadela Celestial de Sión'
: 'Mundo 1: Isla del Portal Dorado';

return (
<div className="pointer-events-none fixed inset-0 z-10">
{/* Top-Left Adventure & Biblical Treasures Cluster */}
<div className="fixed top-3 left-3 flex max-w-xs flex-col gap-2 sm:top-4 sm:left-4 sm:max-w-sm">
{/* Current World Selector Pill */}
<div className="pointer-events-auto rounded-xl border border-amber-300/45 bg-[#24160b]/90 px-3.5 py-2 shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
<div className="flex items-center justify-between gap-2">
<div>
<div className="font-display text-xs font-bold tracking-wide text-amber-200 uppercase">
{hud.worldName}
</div>
<div className="text-[11px] text-amber-100/80">{hud.worldSubtitle}</div>
</div>
<div className="flex items-center gap-1">
{([1, 2, 3] as WorldId[]).map((wId) => (
<button
key={wId}
type="button"
onClick={blurAfter(() => onSelectWorld(wId))}
title={`Viajar al Mundo ${wId}`}
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
<div className="flex items-center gap-2.5 rounded-xl border border-amber-300/45 bg-[#24160b]/88 px-3.5 py-2 shadow-md">
<StarSvg filled size={22} />
<div className="flex items-baseline gap-1.5">
<span
data-testid="star-count"
className="font-display text-stroke-sm text-xl leading-none font-bold text-amber-100 tabular-nums"
>
{hud.stars}/{hud.totalStars}
</span>
<span className="text-[11px] font-semibold tracking-wide text-amber-200/80 uppercase">
Estrellas
</span>
</div>
</div>

{hud.flightUnlocked && (
<div className="flex items-center gap-2 rounded-xl border border-amber-300/40 bg-[#24160b]/88 px-3 py-2 shadow-md">
<span className="text-[10px] font-bold tracking-wider text-amber-200 uppercase">
Vuelo
</span>
<div className="h-2 w-16 overflow-hidden rounded-full bg-amber-950/90 ring-1 ring-amber-200/25">
<div
className="h-full origin-left rounded-full bg-[#ffd24c] transition-transform duration-100"
style={{
transform: `scaleX(${Math.max(0, Math.min(1, hud.flightEnergy / 100))})`,
}}
/>
</div>
<span className="text-[11px] font-bold text-amber-100 tabular-nums">
{hud.flightEnergy}%
</span>
</div>
)}
</div>

<div className="rounded-lg border border-amber-200/25 bg-[#1a1108]/80 px-3 py-1 text-[11px] font-medium text-amber-50 shadow-sm">
{starsProgressText}
</div>

{/* Cofres de Tesoros Bíblicos Interactive List */}
<div className="pointer-events-auto rounded-xl border border-amber-300/45 bg-[#24160b]/90 p-2.5 shadow-lg">
<div className="mb-1.5 flex items-center justify-between">
<span className="font-display text-xs font-bold tracking-wide text-[#ffe27a] uppercase">
Cofres de Tesoros Bíblicos ({hud.chestsCollected.length}/{hud.totalChests})
</span>
<span className="text-[10px] font-semibold text-amber-200/80">
{hud.portalAwakened ? '¡Portal Abierto!' : 'Abre los 3 cofres'}
</span>
</div>
<div className="flex flex-col gap-1.5">
{hud.chestsDefs.map((chest) => {
const found = hud.chestsCollected.includes(chest.id);
return (
<button
key={chest.id}
type="button"
onClick={blurAfter(() => onPlayCue(chest.cueId))}
title="Haz clic para escuchar la explicación bíblica en audio"
className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
found
? 'border-amber-300/60 bg-[#3b2410] text-amber-50 hover:bg-[#4c2f15]'
: 'border-amber-200/15 bg-[#170e07]/85 text-amber-100/75 hover:bg-[#2b1a0d]'
}`}
>
<div className="flex min-w-0 items-center gap-2">
<ChestSvg opened={found} size={18} />
<div className="min-w-0">
<div className="truncate text-xs font-bold">
{chest.name}
</div>
<div className="truncate text-[10px] text-amber-200/80">
{chest.bibleVerse}
</div>
</div>
</div>
<span className="shrink-0 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
🔊 Audio
</span>
</button>
);
})}
</div>
</div>
</div>

{/* Top-Right Compact Utility Controls + Waka Funny Voice Guide Button */}
<div className="fixed top-3 right-3 flex items-center gap-2 sm:top-4 sm:right-4">
<button
type="button"
tabIndex={-1}
onClick={blurAfter(onAskWaka)}
title="Escuchar consejo gracioso de Waka (G)"
className="pointer-events-auto flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#ffe28a] bg-[#b83227]/95 px-3.5 font-display text-xs font-bold text-amber-50 shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#cc3b2f]"
>
<span>🦜 Guía Waka</span>
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
<path
d="M11 5L6 9H2v6h4l5 4V5z"
fill="currentColor"
stroke="currentColor"
strokeWidth="1.5"
strokeLinejoin="round"
/>
{hud.muted ? (
<path
d="M22 9l-6 6M16 9l6 6"
stroke="#fca5a5"
strokeWidth="2"
strokeLinecap="round"
/>
) : (
<path
d="M15.5 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"
stroke="currentColor"
strokeWidth="1.8"
strokeLinecap="round"
/>
)}
</svg>
</button>

<button
type="button"
tabIndex={-1}
aria-label="Reiniciar fase"
title="Reiniciar mundo (R)"
onClick={blurAfter(onRestart)}
className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-amber-200/40 bg-[#24160b]/85 text-amber-100 shadow-md transition-colors hover:bg-[#382312]"
>
<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
<path
d="M3 12a9 9 0 103-6.7L3 8"
stroke="currentColor"
strokeWidth="2"
strokeLinecap="round"
strokeLinejoin="round"
/>
<path
d="M3 3v5h5"
stroke="currentColor"
strokeWidth="2"
strokeLinecap="round"
strokeLinejoin="round"
/>
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
<div className="fixed top-16 left-1/2 -translate-x-1/2 rounded-xl border-2 border-[#ffe28a] bg-[#36200b]/95 px-6 py-3 text-center shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
<p className="font-display text-lg font-bold text-[#ffe27a]">
¡Poder de Vuelo Desbloqueado!
</p>
<p className="mt-0.5 text-xs font-medium text-amber-50">
Mantén Espacio para elevarte y busca el cofre celestial y el Portal Dorado
</p>
</div>
)}

{/* Nearby NPC Interaction Prompt */}
{hud.nearbyNpc && hud.phase === 'playing' && !hud.activeQuiz && (
<div className="fixed top-16 right-4 z-20 flex flex-col items-end">
<button
type="button"
onClick={blurAfter(() => {
setSelectedOption(null);
setShowWakaQuizHint(false);
onInteractNpc();
})}
className="pointer-events-auto cursor-pointer rounded-xl border-2 border-[#ffe28a] bg-[#2a1a0d]/95 px-4 py-2.5 text-left shadow-xl transition-transform hover:scale-105"
>
<div className="font-display text-xs font-bold text-[#ffe27a]">
✨ {hud.nearbyNpc.name} ({hud.nearbyNpc.role})
</div>
<div className="mt-0.5 text-[11px] font-semibold text-amber-100">
Haz clic o presiona [F] para Reto Bíblico y Audio
</div>
</button>
</div>
)}

{/* Active Dramatized Story / Biblical Treasure Audio Card */}
{hud.activeStoryCue && hud.phase === 'playing' && !hud.activeQuiz && (
<div className="pointer-events-auto fixed bottom-9 left-1/2 z-20 w-[94%] max-w-2xl -translate-x-1/2 rounded-2xl border-2 border-[#ffe28a] bg-[#24150a]/95 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.65)]">
<div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/20 pb-2">
<div>
<div className="font-display text-sm font-bold text-[#ffe27a]">
{hud.activeStoryCue.title}
</div>
{hud.activeStoryCue.bibleVerse && (
<div className="text-xs font-semibold text-amber-200/90">
📖 {hud.activeStoryCue.bibleVerse}
</div>
)}
</div>
<div className="flex items-center gap-1.5">
<button
type="button"
onClick={blurAfter(() => onPlayCue(hud.activeStoryCue!.cueId))}
className="cursor-pointer rounded-lg border border-amber-300/40 bg-[#3b2310] px-2.5 py-1 text-xs font-bold text-amber-100 hover:bg-[#4f2f16]"
>
🔊 Repetir Audio
</button>
{hud.activeStoryCue.hasQuiz && (
<button
type="button"
onClick={blurAfter(() => {
setSelectedOption(null);
setShowWakaQuizHint(false);
onOpenQuiz();
})}
className="cursor-pointer rounded-lg border border-[#ffe28a] bg-[#d97b18] px-2.5 py-1 text-xs font-bold text-amber-50 hover:bg-[#e58822]"
>
{hud.activeStoryCue.quizSolved ? '✅ Reto Superado' : '🎯 Reto Bíblico'}
</button>
)}
<button
type="button"
onClick={blurAfter(onDismissCue)}
className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-amber-200/75 hover:text-amber-50"
>
✕
</button>
</div>
</div>

<div className="mt-2.5 flex items-start gap-3">
<div
className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200/50 text-lg shadow-inner ${
hud.activeStoryCue.speaker === 'Waka'
? 'bg-[#b82927]'
: hud.activeStoryCue.speaker === 'Oli'
? 'bg-[#d97b18]'
: 'bg-[#2b5e7a]'
}`}
>
{hud.activeStoryCue.speaker === 'Waka'
? '🦜'
: hud.activeStoryCue.speaker === 'Oli'
? '🧭'
: '✨'}
</div>
<div className="min-w-0 flex-1">
<div className="font-display text-xs font-bold text-amber-200">
{hud.activeStoryCue.displayName}
</div>
<p className="mt-0.5 text-sm leading-snug text-amber-50">
“{hud.activeStoryCue.text}”
</p>
</div>
</div>
</div>
)}

{/* Interactive Biblical Challenge Quiz Modal */}
{hud.activeQuiz && (
<div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#091620]/70 p-4">
<div className="w-full max-w-lg rounded-2xl border-2 border-[#ffe28a] bg-[#2a1a0d] p-6 shadow-[0_20px_55px_rgba(0,0,0,0.75)]">
<div className="flex items-center justify-between">
<span className="font-display text-xs font-bold tracking-wider text-[#ffe27a] uppercase">
📖 Reto Bíblico Interactivo
</span>
<button
type="button"
onClick={blurAfter(onCloseQuiz)}
className="cursor-pointer text-xs font-semibold text-amber-200/80 hover:text-amber-50"
>
Cerrar ✕
</button>
</div>

<h3 className="mt-2 font-display text-xl font-bold text-amber-50">
{hud.activeQuiz.question}
</h3>

<div className="mt-4 flex flex-col gap-2.5">
{hud.activeQuiz.options.map((opt, idx) => {
const isSelected = selectedOption === idx;
const isCorrect = idx === hud.activeQuiz!.correctIndex;
return (
<button
key={idx}
type="button"
onClick={() => setSelectedOption(idx)}
className={`cursor-pointer rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
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
<div className="mt-3 rounded-xl border border-amber-300/40 bg-[#3d2210] p-3 text-xs font-medium text-amber-100">
🦜 <strong>Pista de Waka:</strong> {hud.activeQuiz.wakaHint}
</div>
)}

{selectedOption !== null && (
<div className="mt-3 text-sm font-bold">
{selectedOption === hud.activeQuiz.correctIndex ? (
<p className="text-emerald-300">
🌟 {hud.activeQuiz.rewardMessage}
</p>
) : (
<p className="text-amber-200">
🦜 ¡Casi! Pídele una pista a Waka o intenta otra respuesta.
</p>
)}
</div>
)}

<div className="mt-5 flex flex-wrap items-center justify-between gap-2">
<button
type="button"
onClick={() => setShowWakaQuizHint(true)}
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

{/* Subtle Bottom-Center Controls Reminder in Playing */}
{hud.phase === 'playing' && (
<div className="fixed bottom-2 left-1/2 -translate-x-1/2 text-center text-[11px] font-medium whitespace-nowrap text-amber-50/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
WASD Mover · {hud.flightUnlocked ? 'Espacio Volar · C Bajar' : 'Espacio Saltar'} · F Hablar · G Guía Waka · Haz clic en un Cofre para oír su historia bíblica
</div>
)}

{/* Pause Modal */}
{hud.phase === 'paused' && (
<div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#091620]/65 p-4">
<div
role="dialog"
aria-modal="true"
aria-label="Juego en pausa"
className="w-full max-w-sm rounded-2xl border-2 border-amber-300/60 bg-[#2a1a0d] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
>
<h2 className="font-display text-2xl font-bold text-amber-50">
Aventura en pausa
</h2>
<p className="mt-1 text-sm text-amber-200/80">{hud.worldName}</p>

<div className="mt-5 grid grid-cols-3 gap-2.5">
<div className="rounded-xl bg-[#1b1007] p-3">
<div className="text-[11px] font-medium text-amber-200/75 uppercase">
Estrellas
</div>
<div className="mt-1 font-display text-lg font-bold text-amber-100 tabular-nums">
{hud.stars}/{hud.totalStars}
</div>
</div>
<div className="rounded-xl bg-[#1b1007] p-3">
<div className="text-[11px] font-medium text-amber-200/75 uppercase">
Cofres
</div>
<div className="mt-1 font-display text-lg font-bold text-[#ffd24c] tabular-nums">
{hud.chestsCollected.length}/{hud.totalChests}
</div>
</div>
<div className="rounded-xl bg-[#1b1007] p-3">
<div className="text-[11px] font-medium text-amber-200/75 uppercase">
Tiempo
</div>
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
className="w-full max-w-md rounded-2xl border-2 border-[#ffe28a] bg-[#2a1a0d] p-7 text-center shadow-[0_22px_60px_rgba(0,0,0,0.65)]"
>
<div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#442a13] ring-2 ring-[#ffd24c]/70">
<StarSvg filled size={32} />
</div>

<h2 className="font-display text-3xl font-bold text-amber-50">
¡Portal Dorado Alcanzado!
</h2>
<p className="mt-1.5 text-sm text-amber-100/90">
Descubriste los 3 Tesoros Bíblicos de <strong>{hud.worldName}</strong> con Oli y Waka.
</p>
<p className="mt-1 text-xs font-semibold text-amber-200/85">
📖 {hud.worldBibleVerse}
</p>

<div className="mt-5 grid grid-cols-3 gap-2.5">
<div className="rounded-xl bg-[#1b1007] p-3">
<div className="text-[11px] font-medium text-amber-200/75 uppercase">
Cofres Bíblicos
</div>
<div className="mt-1 font-display text-xl font-bold text-[#ffd24c] tabular-nums">
{hud.chestsCollected.length}/{hud.totalChests}
</div>
</div>
<div className="rounded-xl bg-[#1b1007] p-3">
<div className="text-[11px] font-medium text-amber-200/75 uppercase">
Estrellas
</div>
<div className="mt-1 font-display text-xl font-bold text-amber-100 tabular-nums">
{hud.stars}/{hud.totalStars}
</div>
</div>
<div className="rounded-xl bg-[#1b1007] p-3">
<div className="text-[11px] font-medium text-amber-200/75 uppercase">
Tiempo
</div>
<div className="mt-1 font-display text-xl font-bold text-amber-100 tabular-nums">
{formatSeconds(hud.elapsedTime)}
</div>
</div>
</div>

<div className="mt-6 flex flex-col gap-2.5">
<button
type="button"
data-start="true"
onClick={blurAfter(onNextWorld)}
className="w-full cursor-pointer rounded-xl border-2 border-[#ffe28a] bg-[#d97b18] px-5 py-3.5 font-display text-base font-bold text-amber-50 shadow-lg transition-colors hover:bg-[#e58822]"
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