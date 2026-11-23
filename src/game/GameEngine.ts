import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AdventureAudio } from './audio';
import { createExplorerGirl, updateExplorerPose } from './models/explorerGirl';
import { buildIslandWorld } from './models/islandWorld';
import { createScarletMacaw, updateMacawCompanion } from './models/macaw';
import { createPirateShip } from './models/pirateShip';
import {
PIRATE_SHIP_ORIGIN,
STARS_TO_UNLOCK_FLIGHT,
TEMPLE_PORTAL_POS,
TOTAL_GEMS,
TOTAL_STARS,
WATERFALL_POS,
WORLD_THEMES,
clampDt,
createBouncyMushrooms,
createInitialMagicStars,
createInitialPlayerState,
createIslandNpcs,
createSunGems,
createWindRings,
findNearestNpc,
getIslandGroundHeight,
isNearLockedPortal,
isPortalAwakened,
stepPlayerSimulation,
type BouncyMushroomDef,
type GamePhaseState,
type MagicStarDef,
type NpcDef,
type PlayerSimState,
type SunGemDef,
type SunGemId,
type WindRingDef,
type WorldId,
} from './phase1Logic';
import { createOceanMaterial, createSkyDomeMaterial } from './shaders';
import {
STORY_CUES,
type BiblicalQuizChallenge,
type VoiceSpeakerId,
} from './storyCues';
import { createContactShadowTexture } from './textures';

export interface ActiveStoryBanner {
cueId: string;
title: string;
subtitle?: string;
bibleVerse?: string;
speaker: VoiceSpeakerId;
displayName: string;
text: string;
lineIndex: number;
totalLines: number;
hasQuiz: boolean;
quizSolved: boolean;
}

export interface HudSnapshot {
phase: GamePhaseState;
worldId: WorldId;
worldName: string;
worldSubtitle: string;
worldBibleVerse: string;
stars: number;
totalStars: number;
starsNeededForFlight: number;
chestsCollected: SunGemId[];
chestsDefs: SunGemDef[];
totalChests: number;
portalAwakened: boolean;
flightUnlocked: boolean;
isFlying: boolean;
flightEnergy: number;
elapsedTime: number;
justUnlockedFlight: boolean;
muted: boolean;
nearbyNpc: {
id: NpcDef['id'];
name: string;
role: string;
cueId: string;
} | null;
activeStoryCue: ActiveStoryBanner | null;
activeQuiz: (BiblicalQuizChallenge & { cueId: string }) | null;
}

function detectSoftwareGl(): boolean {
const gl = document.createElement('canvas').getContext('webgl2');
if (!gl) return true;
const ext = gl.getExtension('WEBGL_debug_renderer_info');
const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
const gpu = String(gl.getParameter(param));
gl.getExtension('WEBGL_lose_context')?.loseContext();
return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export class GameEngine {
private container: HTMLElement;
private onHudUpdate: (snapshot: HudSnapshot) => void;
private renderer: THREE.WebGLRenderer;
private scene: THREE.Scene;
private camera: THREE.PerspectiveCamera;
private isSoftwareGl: boolean;
private audio = new AdventureAudio();

private phase: GamePhaseState = 'title';
private worldId: WorldId = 1;
private player: PlayerSimState = createInitialPlayerState();
private starsDef: MagicStarDef[] = createInitialMagicStars();
private gemsDef: SunGemDef[] = createSunGems(1);
private mushroomsDef: BouncyMushroomDef[] = createBouncyMushrooms();
private windRingsDef: WindRingDef[] = createWindRings();
private npcsDef: NpcDef[] = createIslandNpcs(1);

private explorerRig: ReturnType<typeof createExplorerGirl>;
private macawRig: ReturnType<typeof createScarletMacaw>;
private pirateShip: THREE.Group;
private world: ReturnType<typeof buildIslandWorld>;
private skyMat: THREE.ShaderMaterial;
private oceanMat: THREE.ShaderMaterial;
private contactShadow: THREE.Mesh;

private keys = new Set<string>();
private cameraYaw = 0; // 0 looks toward -Z
private cameraPitch = 0.24;
private isDragging = false;
private lastPointerX = 0;
private lastPointerY = 0;

private frameId = 0;
private disposed = false;
private lastTimestamp = 0;
private totalTime = 0;
private lastHudPush = 0;
private unlockBannerTimer = 0;
private prevYaw = Math.PI;
private sparkleCooldown = 0;
private waterfallMistTimer = 0;
private portalHintCooldown = 0;
private wakaTipToggle = false;

private nearbyNpc: NpcDef | null = null;
private greetedNpcs = new Set<string>();
private solvedQuizzes = new Set<string>();
private activeStoryCue: ActiveStoryBanner | null = null;
private activeQuiz: (BiblicalQuizChallenge & { cueId: string }) | null = null;
private storyCueDismissTimer = 0;

// Pre-allocated scratch vectors for zero-GC render loop
private readonly _camTarget = new THREE.Vector3();
private readonly _camDesired = new THREE.Vector3();
private readonly _lookDesired = new THREE.Vector3();

constructor(
container: HTMLElement,
onHudUpdate: (snapshot: HudSnapshot) => void,
autostart: boolean,
) {
this.container = container;
this.onHudUpdate = onHudUpdate;
this.isSoftwareGl = detectSoftwareGl();

const width = container.clientWidth || window.innerWidth;
const height = container.clientHeight || window.innerHeight;

this.renderer = new THREE.WebGLRenderer({
antialias: !this.isSoftwareGl,
powerPreference: 'high-performance',
});
this.renderer.setSize(width, height);
this.renderer.setPixelRatio(
this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
);
this.renderer.outputColorSpace = THREE.SRGBColorSpace;
this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
this.renderer.toneMappingExposure = 0.94;
this.renderer.shadowMap.enabled = !this.isSoftwareGl;
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
this.renderer.domElement.style.display = 'block';
this.renderer.domElement.style.width = '100%';
this.renderer.domElement.style.height = '100%';
container.appendChild(this.renderer.domElement);

this.scene = new THREE.Scene();
this.scene.fog = new THREE.FogExp2(0xa6dcf5, 0.0016);

const pmrem = new THREE.PMREMGenerator(this.renderer);
this.scene.environment = pmrem.fromScene(
new RoomEnvironment(),
0.04,
).texture;
this.scene.environmentIntensity = 0.36;
pmrem.dispose();

this.camera = new THREE.PerspectiveCamera(54, width / height, 0.15, 420);

// Three-point warm/cool tropical adventure lighting
const hemi = new THREE.HemisphereLight(0x88d2fa, 0x264a22, 0.52);
this.scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xffedc2, 1.55);
sunLight.position.set(28, 42, -32);
sunLight.castShadow = !this.isSoftwareGl;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 5;
sunLight.shadow.camera.far = 160;
const d = 64;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.bias = -0.0005;
sunLight.shadow.normalBias = 0.02;
this.scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0xffcb7d, 0.32);
rimLight.position.set(-28, 18, 32);
this.scene.add(rimLight);

// Sky Dome
this.skyMat = createSkyDomeMaterial();
const skyDome = new THREE.Mesh(
new THREE.SphereGeometry(280, 28, 18),
this.skyMat,
);
this.scene.add(skyDome);

// Stylized Ocean / River / Cloud Sea
this.oceanMat = createOceanMaterial();
const oceanMesh = new THREE.Mesh(
new THREE.PlaneGeometry(520, 520, 96, 96),
this.oceanMat,
);
oceanMesh.rotation.x = -Math.PI / 2;
oceanMesh.position.y = 0;
this.scene.add(oceanMesh);

const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

// Expanded Island World, Temple, Waterfall, Biblical Chests, NPCs & Animals
this.world = buildIslandWorld(
this.starsDef,
maxAniso,
this.gemsDef,
this.mushroomsDef,
this.windRingsDef,
this.npcsDef,
);
this.scene.add(this.world.worldGroup);
// Pirate Ship in Western Cove
this.pirateShip = createPirateShip(maxAniso);
this.pirateShip.position.set(
PIRATE_SHIP_ORIGIN.x,
PIRATE_SHIP_ORIGIN.y,
PIRATE_SHIP_ORIGIN.z,
);
this.pirateShip.rotation.y = 0.72;
this.scene.add(this.pirateShip);

// Explorer Girl Protagonist (Oli)
this.explorerRig = createExplorerGirl();
this.explorerRig.root.position.set(
this.player.x,
this.player.y,
this.player.z,
);
this.explorerRig.root.rotation.y = this.player.yaw;
this.scene.add(this.explorerRig.root);

// Soft Contact Shadow Disc under Oli
this.contactShadow = new THREE.Mesh(
new THREE.CircleGeometry(0.65, 18),
new THREE.MeshBasicMaterial({
map: createContactShadowTexture(),
transparent: true,
opacity: 0.52,
depthWrite: false,
}),
);
this.contactShadow.rotation.x = -Math.PI / 2;
this.scene.add(this.contactShadow);

// Scarlet Macaw Companion (Waka)
this.macawRig = createScarletMacaw();
this.macawRig.root.position.set(
this.player.x - 1.5,
this.player.y + 2.2,
this.player.z - 1.0,
);
this.scene.add(this.macawRig.root);

if (!this.isSoftwareGl) {
this.renderer.compile(this.scene, this.camera);
}

this.bindEvents();

if (autostart) {
this.startGame();
} else {
this.setPhase('title');
this.positionTitleCamera(0);
}

this.lastTimestamp = performance.now();
this.tick();
}

private applyWorldAtmosphere(worldId: WorldId): void {
const theme = WORLD_THEMES[worldId];
this.skyMat.uniforms.uZenithColor.value.setHex(theme.skyZenithHex);
this.skyMat.uniforms.uMidSkyColor.value.setHex(theme.skyMidHex);
this.skyMat.uniforms.uHorizonColor.value.setHex(theme.skyHorizonHex);
this.skyMat.uniforms.uSunGlowColor.value.setHex(theme.sunGlowHex);

this.oceanMat.uniforms.uDeepColor.value.setHex(theme.waterDeepHex);
this.oceanMat.uniforms.uShallowColor.value.setHex(theme.waterShallowHex);
this.oceanMat.uniforms.uFoamColor.value.setHex(theme.waterFoamHex);
this.oceanMat.uniforms.uFogColor.value.setHex(theme.fogHex);

if (this.scene.fog instanceof THREE.FogExp2) {
this.scene.fog.color.setHex(theme.fogHex);
}
this.audio.setWorldTheme(worldId);
}

private setPhase(next: GamePhaseState): void {
this.phase = next;
document.body.dataset.state = next;
document.body.dataset.flight = this.player.flightUnlocked
? 'unlocked'
: 'locked';
this.pushHud(true);
}

public startGame(): void {
this.audio.startAmbience();
this.loadWorld(1);
this.setPhase('playing');
this.snapGameplayCamera();
this.triggerStoryCue(WORLD_THEMES[this.worldId].introCueId);
}

public restartGame(): void {
this.audio.startAmbience();
this.loadWorld(this.worldId);
this.setPhase('playing');
this.snapGameplayCamera();
this.triggerStoryCue(WORLD_THEMES[this.worldId].introCueId);
}

public travelToNextWorld(): void {
const nextWorld: WorldId =
this.worldId === 1 ? 2 : this.worldId === 2 ? 3 : 1;
this.selectWorld(nextWorld);
}

public selectWorld(targetWorldId: WorldId): void {
this.audio.startAmbience();
this.loadWorld(targetWorldId);
this.setPhase('playing');
this.snapGameplayCamera();
this.triggerStoryCue(WORLD_THEMES[targetWorldId].introCueId);
}

public togglePause(): void {
if (this.phase === 'playing') {
this.keys.clear();
this.setPhase('paused');
} else if (this.phase === 'paused') {
this.keys.clear();
this.setPhase('playing');
}
}

public returnToTitle(): void {
this.keys.clear();
this.audio.stopStoryCue();
this.activeStoryCue = null;
this.activeQuiz = null;
this.loadWorld(1);
this.setPhase('title');
}

public toggleMute(): boolean {
const next = !this.audio.isMuted();
this.audio.setMuted(next);
this.pushHud(true);
return next;
}

public triggerStoryCue(cueId: string): void {
const cue = STORY_CUES[cueId];
if (!cue || cue.lines.length === 0) return;

const firstLine = cue.lines[0];
this.activeStoryCue = {
cueId: cue.id,
title: cue.title,
subtitle: cue.subtitle,
bibleVerse: cue.bibleVerse,
speaker: firstLine.speaker,
displayName: firstLine.displayName,
text: firstLine.text,
lineIndex: 0,
totalLines: cue.lines.length,
hasQuiz: Boolean(cue.quiz),
quizSolved: this.solvedQuizzes.has(cue.id),
};
this.storyCueDismissTimer = 14.0;
this.pushHud(true);

this.audio.playStoryCue(
cueId,
(lineIdx) => {
const line = cue.lines[lineIdx];
if (!line || !this.activeStoryCue || this.activeStoryCue.cueId !== cueId) {
return;
}
this.activeStoryCue = {
...this.activeStoryCue,
speaker: line.speaker,
displayName: line.displayName,
text: line.text,
lineIndex: lineIdx,
};
this.storyCueDismissTimer = 10.0;
this.pushHud(true);
},
() => {
this.storyCueDismissTimer = 5.5;
},
);
}

public dismissStoryCue(): void {
this.audio.stopStoryCue();
this.activeStoryCue = null;
this.pushHud(true);
}

public askWakaGuide(): void {
this.wakaTipToggle = !this.wakaTipToggle;
this.triggerStoryCue(
this.wakaTipToggle ? 'waka_funny_tip_1' : 'waka_funny_tip_2',
);
this.world.sparkles.emit(
this.macawRig.root.position.x,
this.macawRig.root.position.y,
this.macawRig.root.position.z,
20,
1.2,
1.4,
);
}

public interactWithNearbyNpc(): void {
if (!this.nearbyNpc) return;
const cueId = this.nearbyNpc.cueId;
this.triggerStoryCue(cueId);
const cue = STORY_CUES[cueId];
if (cue?.quiz && !this.solvedQuizzes.has(cueId)) {
this.activeQuiz = {
...cue.quiz,
cueId,
};
this.pushHud(true);
}
}

public openQuizForActiveCue(): void {
if (!this.activeStoryCue) return;
const cue = STORY_CUES[this.activeStoryCue.cueId];
if (!cue?.quiz) return;
this.activeQuiz = {
...cue.quiz,
cueId: cue.id,
};
this.pushHud(true);
}

public closeQuiz(): void {
this.activeQuiz = null;
this.pushHud(true);
}

public completeQuizChallenge(cueId: string): void {
this.solvedQuizzes.add(cueId);
this.activeQuiz = null;
if (this.activeStoryCue && this.activeStoryCue.cueId === cueId) {
this.activeStoryCue = {
...this.activeStoryCue,
quizSolved: true,
};
}
this.player.flightEnergy = 100;
this.audio.playTreasureChestOpen();
this.world.sparkles.emit(
this.player.x,
this.player.y + 1.2,
this.player.z,
36,
2.2,
2.0,
);
this.pushHud(true);
}
private loadWorld(targetWorldId: WorldId): void {
this.worldId = targetWorldId;
this.player = createInitialPlayerState();
// If jumping directly to World 2 or 3, preserve flight or let player earn it cleanly
if (targetWorldId > 1) {
this.player.flightUnlocked = true;
}
this.starsDef = createInitialMagicStars();
this.gemsDef = createSunGems(targetWorldId);
this.npcsDef = createIslandNpcs(targetWorldId);
this.cameraYaw = 0;
this.cameraPitch = 0.24;
this.unlockBannerTimer = 0;
this.prevYaw = this.player.yaw;
this.nearbyNpc = null;
this.greetedNpcs.clear();
this.activeQuiz = null;

this.applyWorldAtmosphere(targetWorldId);
this.world.rebuildForWorld(targetWorldId, this.gemsDef, this.npcsDef);

this.explorerRig.root.position.set(
this.player.x,
this.player.y,
this.player.z,
);
this.explorerRig.root.rotation.y = this.player.yaw;

this.macawRig.root.position.set(
this.player.x - 1.5,
this.player.y + 2.2,
this.player.z - 1.0,
);

for (const sv of this.world.starVisuals) {
sv.collected = false;
sv.group.visible = true;
}
for (const wr of this.world.windRingVisuals) {
wr.passed = false;
}
document.body.dataset.flight = this.player.flightUnlocked
? 'unlocked'
: 'locked';
}

private snapGameplayCamera(): void {
const dist = 6.2;
this.camera.position.set(
this.player.x + Math.sin(this.cameraYaw) * dist,
this.player.y + 3.0,
this.player.z + Math.cos(this.cameraYaw) * dist,
);
this._camTarget.set(this.player.x, this.player.y + 1.35, this.player.z - 1.5);
this.camera.lookAt(this._camTarget);
}

private positionTitleCamera(t: number): void {
const sway = Math.sin(t * 0.32) * 0.85;
this.camera.position.set(
this.player.x + 4.4 + sway,
this.player.y + 2.55,
this.player.z + 5.2,
);
this._camTarget.set(
this.player.x - 3.6,
this.player.y + 1.35,
this.player.z - 15.0,
);
this.camera.lookAt(this._camTarget);
this.explorerRig.root.rotation.y = 0.42 + Math.sin(t * 0.45) * 0.08;
}

private pushHud(force = false): void {
const now = performance.now();
if (!force && now - this.lastHudPush < 110) return;
this.lastHudPush = now;
const theme = WORLD_THEMES[this.worldId];

this.onHudUpdate({
phase: this.phase,
worldId: this.worldId,
worldName: theme.name,
worldSubtitle: theme.subtitle,
worldBibleVerse: theme.bibleVerse,
stars: this.player.starsCollected.length,
totalStars: TOTAL_STARS,
starsNeededForFlight: STARS_TO_UNLOCK_FLIGHT,
chestsCollected: [...this.player.gemsCollected],
chestsDefs: this.gemsDef,
totalChests: TOTAL_GEMS,
portalAwakened: isPortalAwakened(this.player),
flightUnlocked: this.player.flightUnlocked,
isFlying: this.player.isFlying,
flightEnergy: Math.round(this.player.flightEnergy),
elapsedTime: this.player.elapsedTime,
justUnlockedFlight: this.unlockBannerTimer > 0,
muted: this.audio.isMuted(),
nearbyNpc: this.nearbyNpc
? {
id: this.nearbyNpc.id,
name: this.nearbyNpc.name,
role: this.nearbyNpc.role,
cueId: this.nearbyNpc.cueId,
}
: null,
activeStoryCue: this.activeStoryCue,
activeQuiz: this.activeQuiz,
});
}

private handleKeyDown = (e: KeyboardEvent): void => {
const code = e.code;
if (
['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
code,
) &&
this.phase === 'playing'
) {
e.preventDefault();
}

if (this.phase === 'title') {
if (code === 'Enter' || code === 'Space') {
e.preventDefault();
this.startGame();
}
return;
}

if (code === 'KeyP' || code === 'Escape') {
if (this.activeQuiz) {
this.closeQuiz();
return;
}
if (this.phase === 'playing' || this.phase === 'paused') {
e.preventDefault();
this.togglePause();
}
return;
}

if (code === 'KeyM') {
this.toggleMute();
return;
}

if (code === 'KeyG' && this.phase === 'playing') {
this.askWakaGuide();
return;
}

if (code === 'KeyF' && this.phase === 'playing') {
this.interactWithNearbyNpc();
return;
}

if (code === 'KeyR' && this.phase === 'playing') {
this.restartGame();
return;
}

this.keys.add(code);
};

private handleKeyUp = (e: KeyboardEvent): void => {
this.keys.delete(e.code);
};

private handleBlur = (): void => {
this.keys.clear();
this.isDragging = false;
};

private handlePointerDown = (e: PointerEvent): void => {
if (this.phase !== 'playing') return;
this.isDragging = true;
this.lastPointerX = e.clientX;
this.lastPointerY = e.clientY;
this.audio.startAmbience();
};

private handlePointerMove = (e: PointerEvent): void => {
if (!this.isDragging || this.phase !== 'playing') return;
const dx = e.clientX - this.lastPointerX;
const dy = e.clientY - this.lastPointerY;
this.lastPointerX = e.clientX;
this.lastPointerY = e.clientY;

this.cameraYaw -= dx * 0.0055;
this.cameraPitch = THREE.MathUtils.clamp(
this.cameraPitch + dy * 0.004,
-0.12,
0.72,
);
};

private handlePointerUp = (): void => {
this.isDragging = false;
};

private handleResize = (): void => {
const width = this.container.clientWidth || window.innerWidth;
const height = this.container.clientHeight || window.innerHeight;
this.camera.aspect = width / height;
this.camera.updateProjectionMatrix();
this.renderer.setSize(width, height);
};

private bindEvents(): void {
window.addEventListener('keydown', this.handleKeyDown);
window.addEventListener('keyup', this.handleKeyUp);
window.addEventListener('blur', this.handleBlur);
window.addEventListener('resize', this.handleResize);
const canvas = this.renderer.domElement;
canvas.addEventListener('pointerdown', this.handlePointerDown);
window.addEventListener('pointermove', this.handlePointerMove);
window.addEventListener('pointerup', this.handlePointerUp);
}

private afterDraw(cb: () => void): void {
const gl = this.renderer.getContext() as WebGL2RenderingContext;
const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
gl.flush();
const poll = () => {
if (this.disposed) {
if (sync) gl.deleteSync(sync);
return;
}
const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
if (state === gl.UNSIGNALED) {
this.frameId = window.setTimeout(poll, 5);
} else {
if (sync) gl.deleteSync(sync);
this.frameId = window.setTimeout(cb, 80);
}
};
this.frameId = window.setTimeout(poll, 5);
}

private animateWorldDetails(t: number, dt: number): void {
this.oceanMat.uniforms.uTime.value = t;
this.world.portalMaterial.uniforms.uTime.value = t;
const awakened = isPortalAwakened(this.player) ? 1.0 : 0.35;
this.world.portalMaterial.uniforms.uAwakened.value = awakened;
this.world.waterfallMaterial.uniforms.uTime.value = t;
this.world.portalLight.intensity =
(isPortalAwakened(this.player) ? 8.2 : 3.2) + Math.sin(t * 4.2) * 1.4;

// Gentle ship bobbing & rolling in the turquoise cove
this.pirateShip.position.y =
PIRATE_SHIP_ORIGIN.y + Math.sin(t * 1.25) * 0.24;
this.pirateShip.rotation.z = Math.sin(t * 0.95) * 0.045;
this.pirateShip.rotation.x = Math.cos(t * 1.15) * 0.03;

// Sway palm/cedar/olive crowns gently
for (let i = 0; i < this.world.palmCrowns.length; i++) {
const crown = this.world.palmCrowns[i];
crown.rotation.z = Math.sin(t * 1.3 + i) * 0.045;
crown.rotation.x = Math.cos(t * 1.1 + i * 0.7) * 0.035;
}

// Drift sky clouds lazily
for (let i = 0; i < this.world.clouds.length; i++) {
this.world.clouds[i].position.x += dt * (0.35 + (i % 3) * 0.12);
if (this.world.clouds[i].position.x > 95) {
this.world.clouds[i].position.x = -95;
}
}

// Animate floating magic stars
for (const sv of this.world.starVisuals) {
if (sv.collected) continue;
sv.starMesh.rotation.y = t * 1.9 + sv.id;
sv.ringMesh.rotation.z = t * 1.4;
sv.group.position.y = sv.baseY + Math.sin(t * 2.5 + sv.id) * 0.18;
}

// Animate 3D Biblical Treasure Chests & Artifacts
for (const cv of this.world.chestVisuals) {
cv.artifactGroup.rotation.y = t * 1.6;
cv.ringMesh.rotation.z = t * 1.2;

if (cv.collected) {
cv.openProgress = Math.min(1, cv.openProgress + dt * 2.8);
cv.lidPivot.rotation.x = -0.35 - cv.openProgress * 1.05;
cv.artifactGroup.position.y =
0.88 + cv.openProgress * 0.95 + Math.sin(t * 3.0) * 0.12;
cv.artifactGroup.scale.setScalar(1.25 + cv.openProgress * 0.35);
} else {
cv.artifactGroup.position.y = 0.88 + Math.sin(t * 2.4) * 0.1;
}
}

// Animate Bouncy Mushrooms
for (const mv of this.world.mushroomVisuals) {
if (mv.bounceAnim > 0) {
mv.bounceAnim = Math.max(0, mv.bounceAnim - dt * 3.5);
const s = 1 + Math.sin(mv.bounceAnim * Math.PI * 3) * 0.28 * mv.bounceAnim;
mv.capGroup.scale.set(s, 1 / s, s);
} else {
mv.capGroup.scale.set(1, 1, 1);
}
}

// Animate Sky Wind Rings
for (const wr of this.world.windRingVisuals) {
wr.outerRing.rotation.z = t * 1.5 + wr.id;
wr.innerRing.rotation.x = Math.sin(t * 2.2 + wr.id) * 0.35;
wr.innerRing.rotation.y = t * 2.1;
}

// Animate NPCs waving & floating markers
for (const nv of this.world.npcVisuals) {
nv.rightArmPivot.rotation.z = -2.35 + Math.sin(t * 4.2 + nv.baseY) * 0.35;
nv.markerMesh.rotation.y = t * 2.4;
nv.markerMesh.position.y = 2.05 + Math.sin(t * 3.2) * 0.12;
}

// Animate Animals (Dolphins, Beach Crabs, Lambs, Doves)
for (const av of this.world.animalVisuals) {
const aTime = t * av.speed + av.phase;
if (av.kind === 'dolphin') {
const cycle = aTime % (Math.PI * 2);
const jumpY = Math.sin(cycle) * 2.4;
av.group.position.x = av.originX + Math.cos(aTime * 0.5) * av.radius;
av.group.position.z = av.originZ + Math.sin(aTime * 0.5) * av.radius;
av.group.position.y = Math.max(-0.8, jumpY - 0.3);
av.group.rotation.y = -aTime * 0.5;
av.group.rotation.x = -Math.cos(cycle) * 0.55;
} else if (av.kind === 'crab') {
av.group.position.x = av.originX + Math.sin(aTime) * av.radius;
av.group.rotation.z = Math.sin(aTime * 4) * 0.12;
} else if (av.kind === 'lamb') {
const walkX = av.originX + Math.cos(aTime * 0.6) * av.radius;
const walkZ = av.originZ + Math.sin(aTime * 0.6) * av.radius;
const gy = getIslandGroundHeight(walkX, walkZ);
av.group.position.set(walkX, gy + Math.abs(Math.sin(aTime * 3.2)) * 0.08, walkZ);
av.group.rotation.y = -aTime * 0.6 + Math.PI;
} else if (av.kind === 'bird') {
av.group.position.x = av.originX + Math.cos(aTime) * av.radius;
av.group.position.z = av.originZ + Math.sin(aTime) * av.radius;
av.group.position.y = av.originY + Math.sin(aTime * 2.1) * 0.55;
av.group.rotation.y = -aTime;
const flap = Math.sin(t * 11 + av.phase) * 0.55;
if (av.leftWingOrFin) av.leftWingOrFin.rotation.z = flap;
if (av.rightWingOrFin) av.rightWingOrFin.rotation.z = -flap;
}
}

// Waterfall mist sparkles
this.waterfallMistTimer -= dt;
if (this.waterfallMistTimer <= 0) {
this.waterfallMistTimer = 0.12;
this.world.sparkles.emit(
WATERFALL_POS.x + 0.4,
1.1,
WATERFALL_POS.z + 1.5,
2,
3.2,
1.4,
);
}
}

private tick = (): void => {
if (this.disposed) return;

const now = performance.now();
const rawDt = (now - this.lastTimestamp) / 1000;
this.lastTimestamp = now;
const maxStep = this.isSoftwareGl ? 0.12 : 0.05;
const frameDt = Math.min(Math.max(rawDt || 0.016, 0.001), maxStep);
const dt = clampDt(frameDt);

if (this.phase !== 'paused') {
this.totalTime += frameDt;
}

const t = this.totalTime;
this.animateWorldDetails(t, dt);

if (this.phase === 'title') {
this.positionTitleCamera(t);
updateExplorerPose(this.explorerRig, {
time: t,
dt,
speed: 0,
walkDistance: 0,
isFlying: false,
grounded: true,
verticalVel: 0,
turnRate: 0,
});
updateMacawCompanion(
this.macawRig,
this.player.x,
this.player.y,
this.player.z,
this.player.yaw,
false,
t,
dt,
);
} else if (this.phase === 'playing') {
if (this.keys.has('KeyQ')) this.cameraYaw += 1.9 * dt;
if (this.keys.has('KeyE')) this.cameraYaw -= 1.9 * dt;

if (this.storyCueDismissTimer > 0 && this.activeStoryCue) {
this.storyCueDismissTimer -= dt;
if (this.storyCueDismissTimer <= 0) {
this.activeStoryCue = null;
this.pushHud(true);
}
}

if (this.portalHintCooldown > 0) {
this.portalHintCooldown = Math.max(0, this.portalHintCooldown - dt);
}

const subSteps = frameDt > 0.055 ? 2 : 1;
const stepDt = frameDt / subSteps;
const inputSnap = {
forward: this.keys.has('KeyW') || this.keys.has('ArrowUp'),
backward: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
jumpOrAscend: this.keys.has('Space'),
descend: this.keys.has('ControlLeft') || this.keys.has('KeyC'),
sprint: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
cameraYaw: this.cameraYaw,
};

let events = stepPlayerSimulation(
this.player,
inputSnap,
this.starsDef,
stepDt,
getIslandGroundHeight,
this.gemsDef,
this.mushroomsDef,
this.windRingsDef,
);

if (subSteps === 2) {
const events2 = stepPlayerSimulation(
this.player,
inputSnap,
this.starsDef,
stepDt,
getIslandGroundHeight,
this.gemsDef,
this.mushroomsDef,
this.windRingsDef,
);
events = {
jumped: events.jumped || events2.jumped,
landed: events.landed || events2.landed,
startedFlying: events.startedFlying || events2.startedFlying,
collectedStars: [...events.collectedStars, ...events2.collectedStars],
collectedGems: [...events.collectedGems, ...events2.collectedGems],
unlockedFlightNow:
events.unlockedFlightNow || events2.unlockedFlightNow,
bouncedMushroom: events.bouncedMushroom || events2.bouncedMushroom,
passedWindRing: events.passedWindRing || events2.passedWindRing,
portalReadyNow: events.portalReadyNow || events2.portalReadyNow,
reachedPortal: events.reachedPortal || events2.reachedPortal,
};
}

// 1. Update star visuals & first star story cue
for (const id of events.collectedStars) {
const sv = this.world.starVisuals.find((s) => s.id === id);
if (sv) {
sv.collected = true;
sv.group.visible = false;
this.world.sparkles.emit(
sv.group.position.x,
sv.group.position.y,
sv.group.position.z,
26,
1.4,
1.6,
);
}
this.audio.playStarPickup(this.player.starsCollected.length);
if (this.player.starsCollected.length === 1) {
this.triggerStoryCue('first_star');
}
}

// 2. Flight unlock event
if (events.unlockedFlightNow) {
this.unlockBannerTimer = 4.5;
document.body.dataset.flight = 'unlocked';
this.audio.playFlightUnlock();
this.triggerStoryCue('flight_unlocked');
this.world.sparkles.emit(
this.player.x,
this.player.y + 0.9,
this.player.z,
42,
2.2,
2.1,
);
}
if (this.unlockBannerTimer > 0) {
this.unlockBannerTimer = Math.max(0, this.unlockBannerTimer - dt);
}

// 3. Bouncy mushroom bounce event
if (events.bouncedMushroom) {
this.audio.playMushroomBounce();
const mv = this.world.mushroomVisuals.find(
(m) => m.id === events.bouncedMushroom?.id,
);
if (mv) mv.bounceAnim = 1.0;
this.world.sparkles.emit(
events.bouncedMushroom.x,
events.bouncedMushroom.y + 1.2,
events.bouncedMushroom.z,
22,
1.5,
2.2,
);
}

// 4. Sky Wind Ring boost event
if (events.passedWindRing) {
this.audio.playWindRingBoost();
this.world.sparkles.emit(
events.passedWindRing.x,
events.passedWindRing.y,
events.passedWindRing.z,
28,
2.0,
1.6,
);
}

// 5. Biblical Treasure Chest collection + Audio Narration!
for (const gem of events.collectedGems) {
const cv = this.world.chestVisuals.find((c) => c.id === gem.id);
if (cv) {
cv.collected = true;
this.world.sparkles.emit(
gem.x,
gem.y + 0.6,
gem.z,
45,
2.4,
2.2,
);
}
this.audio.playTreasureChestOpen();
this.triggerStoryCue(gem.cueId);
}

// 6. Portal Awakened notification
if (events.portalReadyNow) {
this.audio.playFlightUnlock();
// Queue portal ready cue after current chest description or immediately if all collected
window.setTimeout(() => {
if (!this.disposed && this.phase === 'playing') {
this.triggerStoryCue('portal_ready');
}
}, 7200);
}

// 7. Check proximity to NPCs
const nearestNpc = findNearestNpc(
this.player.x,
this.player.y,
this.player.z,
this.npcsDef,
);
if (nearestNpc?.id !== this.nearbyNpc?.id) {
this.nearbyNpc = nearestNpc;
if (nearestNpc && !this.greetedNpcs.has(nearestNpc.id)) {
this.greetedNpcs.add(nearestNpc.id);
this.triggerStoryCue(nearestNpc.cueId);
}
this.pushHud(true);
}

// 8. Check if near locked Golden Portal
if (isNearLockedPortal(this.player) && this.portalHintCooldown <= 0) {
this.portalHintCooldown = 12.0;
this.triggerStoryCue('portal_locked_hint');
}

if (events.jumped) {
this.audio.playJump();
}
if (events.startedFlying) {
this.audio.playFlightUnlock();
}

const horizSpeed = Math.hypot(this.player.vx, this.player.vz);
if (this.player.grounded && horizSpeed > 1.5) {
this.audio.playFootstep();
}

// Golden magic sparkle trail while flying
this.sparkleCooldown -= dt;
if (this.player.isFlying && this.sparkleCooldown <= 0) {
this.sparkleCooldown = 0.035;
this.world.sparkles.emit(
this.player.x,
this.player.y + 0.65,
this.player.z,
4,
0.95,
-0.15,
);
}

// Sync explorer mesh & animations
this.explorerRig.root.position.set(
this.player.x,
this.player.y,
this.player.z,
);
this.explorerRig.root.rotation.y = this.player.yaw;

const turnRate = (this.player.yaw - this.prevYaw) / Math.max(dt, 0.001);
this.prevYaw = this.player.yaw;

updateExplorerPose(this.explorerRig, {
time: t,
dt,
speed: horizSpeed,
walkDistance: this.player.walkDistance,
isFlying: this.player.isFlying,
grounded: this.player.grounded,
verticalVel: this.player.vy,
turnRate,
});

// Update Scarlet Macaw companion (Waka)
updateMacawCompanion(
this.macawRig,
this.player.x,
this.player.y,
this.player.z,
this.player.yaw,
this.player.isFlying,
t,
dt,
);

// Update Third-Person Adventure Camera
const camDist = this.player.isFlying ? 7.6 : 6.0;
const camHeight = Math.sin(this.cameraPitch) * camDist + 1.45;
const horizDist = Math.cos(this.cameraPitch) * camDist;

this._camDesired.set(
this.player.x + Math.sin(this.cameraYaw) * horizDist,
this.player.y + camHeight,
this.player.z + Math.cos(this.cameraYaw) * horizDist,
);
const minCamGround =
getIslandGroundHeight(this._camDesired.x, this._camDesired.z) + 1.1;
if (this._camDesired.y < minCamGround) {
this._camDesired.y = minCamGround;
}

const camAlpha = 1 - Math.exp(-7.5 * dt);
this.camera.position.lerp(this._camDesired, camAlpha);

this._lookDesired.set(
this.player.x - Math.sin(this.cameraYaw) * 2.0,
this.player.y + (this.player.isFlying ? 1.2 : 1.3),
this.player.z - Math.cos(this.cameraYaw) * 2.0,
);
this._camTarget.lerp(this._lookDesired, camAlpha);
this.camera.lookAt(this._camTarget);

const targetFov = this.player.isFlying ? 61 : 54;
if (Math.abs(this.camera.fov - targetFov) > 0.05) {
this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-5 * dt));
this.camera.updateProjectionMatrix();
}

if (events.reachedPortal) {
this.audio.playPortalVictory();
this.world.sparkles.emit(
TEMPLE_PORTAL_POS.x,
TEMPLE_PORTAL_POS.y + 1.2,
TEMPLE_PORTAL_POS.z,
60,
3.0,
2.5,
);
this.setPhase('gameover');
}

this.pushHud(
events.collectedStars.length > 0 ||
events.collectedGems.length > 0 ||
events.unlockedFlightNow,
);
}

// Contact shadow tracks terrain under player
const groundUnderPlayer = Math.max(
0.04,
getIslandGroundHeight(this.player.x, this.player.z),
);
this.contactShadow.position.set(
this.player.x,
groundUnderPlayer + 0.035,
this.player.z,
);
const heightAboveGround = Math.max(0, this.player.y - groundUnderPlayer);
const shadowFade = THREE.MathUtils.clamp(1 - heightAboveGround / 8, 0.08, 1);
(this.contactShadow.material as THREE.MeshBasicMaterial).opacity =
0.52 * shadowFade;
const shadowScale = 1 + heightAboveGround * 0.06;
this.contactShadow.scale.setScalar(shadowScale);

this.world.sparkles.update(dt);

this.renderer.render(this.scene, this.camera);

if (this.isSoftwareGl) {
this.afterDraw(this.tick);
} else {
this.frameId = requestAnimationFrame(this.tick);
}
};

public dispose(): void {
this.disposed = true;
cancelAnimationFrame(this.frameId);
clearTimeout(this.frameId);

window.removeEventListener('keydown', this.handleKeyDown);
window.removeEventListener('keyup', this.handleKeyUp);
window.removeEventListener('blur', this.handleBlur);
window.removeEventListener('resize', this.handleResize);
window.removeEventListener('pointermove', this.handlePointerMove);
window.removeEventListener('pointerup', this.handlePointerUp);
this.renderer.domElement.removeEventListener(
'pointerdown',
this.handlePointerDown,
);

this.audio.dispose();
this.renderer.dispose();
if (this.renderer.domElement.parentElement === this.container) {
this.container.removeChild(this.renderer.domElement);
}
}
}