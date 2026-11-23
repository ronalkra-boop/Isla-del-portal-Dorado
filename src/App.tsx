import { useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameEngine, type HudSnapshot } from './game/GameEngine';
import {
STARS_TO_UNLOCK_FLIGHT,
TOTAL_GEMS,
TOTAL_STARS,
WORLD_THEMES,
createSunGems,
} from './game/phase1Logic';

const INITIAL_HUD: HudSnapshot = {
phase: 'title',
worldId: 1,
worldName: WORLD_THEMES[1].name,
worldSubtitle: WORLD_THEMES[1].subtitle,
worldBibleVerse: WORLD_THEMES[1].bibleVerse,
stars: 0,
totalStars: TOTAL_STARS,
starsNeededForFlight: STARS_TO_UNLOCK_FLIGHT,
chestsCollected: [],
chestsDefs: createSunGems(1),
totalChests: TOTAL_GEMS,
portalAwakened: false,
flightUnlocked: false,
isFlying: false,
flightEnergy: 100,
elapsedTime: 0,
justUnlockedFlight: false,
muted: false,
nearbyNpc: null,
activeStoryCue: null,
activeQuiz: null,
};

export default function App() {
const mountRef = useRef<HTMLDivElement | null>(null);
const engineRef = useRef<GameEngine | null>(null);
const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
const [webglError, setWebglError] = useState<string | null>(null);

useEffect(() => {
const container = mountRef.current;
if (!container) return;

const params = new URLSearchParams(window.location.search);
const autostart = params.get('autostart') === '1';

let engine: GameEngine | null = null;
try {
engine = new GameEngine(
container,
(snapshot) => {
setHud(snapshot);
},
autostart,
);
engineRef.current = engine;
} catch (err) {
setWebglError(
err instanceof Error ? err.message : 'No se pudo inicializar WebGL 3D.',
);
}

return () => {
engine?.dispose();
engineRef.current = null;
};
}, []);

return (
<main className="relative h-screen w-screen overflow-hidden bg-[#0c2738]">
{/* Isolated WebGL canvas mount outside React HUD reconciliation */}
<div
ref={mountRef}
data-testid="game-viewport"
className="h-full w-full"
/>

{webglError ? (
<div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0c2738] p-6 text-center">
<div className="max-w-md rounded-2xl border border-amber-300/40 bg-[#24160b] p-6">
<h1 className="font-display text-2xl font-bold text-amber-50">
No se pudo iniciar la vista 3D
</h1>
<p className="mt-2 text-sm text-amber-100/80">{webglError}</p>
</div>
</div>
) : (
<GameHUD
hud={hud}
onStart={() => engineRef.current?.startGame()}
onRestart={() => engineRef.current?.restartGame()}
onNextWorld={() => engineRef.current?.travelToNextWorld()}
onSelectWorld={(wId) => engineRef.current?.selectWorld(wId)}
onTogglePause={() => engineRef.current?.togglePause()}
onReturnTitle={() => engineRef.current?.returnToTitle()}
onToggleMute={() => engineRef.current?.toggleMute()}
onAskWaka={() => engineRef.current?.askWakaGuide()}
onInteractNpc={() => engineRef.current?.interactWithNearbyNpc()}
onPlayCue={(cueId) => engineRef.current?.triggerStoryCue(cueId)}
onDismissCue={() => engineRef.current?.dismissStoryCue()}
onOpenQuiz={() => engineRef.current?.openQuizForActiveCue()}
onCloseQuiz={() => engineRef.current?.closeQuiz()}
onSolveQuiz={(cueId) => engineRef.current?.completeQuizChallenge(cueId)}
/>
)}
</main>
);
}