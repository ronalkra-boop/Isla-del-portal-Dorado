import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AdventureAudio } from './audio';
import { buildCavernWorld } from './models/cavernWorld';
import { buildDesertWorld } from './models/desertWorld';
import { createExplorerGirl, updateExplorerPose } from './models/explorerGirl';
import { buildIslandWorld, type WorldBuildResult } from './models/islandWorld';
import { createScarletMacaw, updateMacawCompanion } from './models/macaw';
import { createPirateShip } from './models/pirateShip';
import {
createWorldEnvironmentMap,
type WorldEnvironmentHandle,
} from './nintendoVisuals';
import {
PIRATE_SHIP_ORIGIN,
STARS_TO_UNLOCK_FLIGHT,
TOTAL_GEMS,
TOTAL_STARS,
WORLD_THEMES,
clampDt,
createInitialPlayerState,
createIslandNpcs,
createSunGems,
createWorldBouncePads,
createWorldStars,
createWorldWindRings,
findNearestNpc,
getWorldGroundHeight,
getWorldMaxFlightY,
getWorldPortalPos,
getWorldWaterLevel,
isNearLockedPortal,
isPortalAwakened,
stepPlayerSimulation,
type BouncyMushroomDef,
type GamePhaseState,
type MagicStarDef,
type NpcDef,
type PlayerSimState,
type SolidCollider,
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

export interface VirtualControlState {
analogX: number;
analogY: number;
jumpOrAscend: boolean;
descend: boolean;
}

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

export type GraphicsQuality = 'ultra' | 'fast';

export interface HudSnapshot {
phase: GamePhaseState;
graphicsQuality: GraphicsQuality;
worldId: WorldId;
worldShortName: string;
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
musicEnabled: boolean;
nearbyNpc: {
id: NpcDef['id'];
speakerId: VoiceSpeakerId;
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
private composer: EffectComposer | null = null;
private bloomPass: UnrealBloomPass | null = null;
private envHandle: WorldEnvironmentHandle | null = null;
private scene: THREE.Scene;
private camera: THREE.PerspectiveCamera;
private hemiLight: THREE.HemisphereLight;
private sunLight: THREE.DirectionalLight;
private maxAniso: number;
private isSoftwareGl: boolean;
private graphicsQuality: GraphicsQuality;
private audio = new AdventureAudio();

private phase: GamePhaseState = 'title';
private worldId: WorldId = 1;
private player: PlayerSimState = createInitialPlayerState(1);
private starsDef: MagicStarDef[] = createWorldStars(1);
private gemsDef: SunGemDef[] = createSunGems(1);
private bouncePadsDef: BouncyMushroomDef[] = createWorldBouncePads(1);
private windRingsDef: WindRingDef[] = createWorldWindRings(1);
private npcsDef: NpcDef[] = createIslandNpcs(1);

private explorerRig: ReturnType<typeof createExplorerGirl>;
private macawRig: ReturnType<typeof createScarletMacaw>;
private pirateShip: THREE.Group;
private skyDome: THREE.Mesh;
private oceanMesh: THREE.Mesh;
private skyMat: THREE.ShaderMaterial;
private oceanMat: THREE.ShaderMaterial;
private world!: WorldBuildResult;
private contactShadow: THREE.Mesh;

private keys = new Set<string>();
private virtualInput: VirtualControlState = {
analogX: 0,
analogY: 0,
jumpOrAscend: false,
descend: false,
};
private cameraYaw = 0;
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
private portalHintCooldown = 0;
private heardBounceCue = false;
private heardWindRingCue = false;
private wakaTipIndex = 0;

private nearbyNpc: NpcDef | null = null;
private greetedNpcs = new Set<string>();
private solvedQuizzes = new Set<string>();
private activeStoryCue: ActiveStoryBanner | null = null;
private activeQuiz: (BiblicalQuizChallenge & { cueId: string }) | null = null;
private pendingCueQueue: string[] = [];
private storyCueDismissTimer = 0;

private readonly _camTarget = new THREE.Vector3();
private readonly _camDesired = new THREE.Vector3();
private readonly _lookDesired = new THREE.Vector3();
private readonly _sunOffset = new THREE.Vector3(24, 38, -28);
private activeColliders: SolidCollider[] = [];

private getTargetPixelRatio(): number {
if (this.isSoftwareGl) return 1;
const cap = this.graphicsQuality === 'ultra' ? 1.75 : 1.25;
return Math.min(window.devicePixelRatio || 1, cap);
}

private disposeWorldGroup(group: THREE.Group | undefined): void {
if (!group) return;
group.traverse((obj) => {
if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
obj.geometry?.dispose();
const mat = obj.material;
if (Array.isArray(mat)) {
mat.forEach((m) => m?.dispose());
} else if (mat) {
mat.dispose();
}
}
});
}

constructor(
container: HTMLElement,
onHudUpdate: (snapshot: HudSnapshot) => void,
autostart: boolean,
) {
this.container = container;
this.onHudUpdate = onHudUpdate;
this.isSoftwareGl = detectSoftwareGl();
this.graphicsQuality = this.isSoftwareGl ? 'fast' : 'ultra';

const width = container.clientWidth || window.innerWidth;
const height = container.clientHeight || window.innerHeight;

this.renderer = new THREE.WebGLRenderer({
antialias: !this.isSoftwareGl,
powerPreference: 'high-performance',
});
this.renderer.setSize(width, height);
this.renderer.setPixelRatio(this.getTargetPixelRatio());
this.renderer.outputColorSpace = THREE.SRGBColorSpace;
this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
this.renderer.toneMappingExposure = 0.96;
this.renderer.shadowMap.enabled = !this.isSoftwareGl;
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
this.renderer.domElement.style.display = 'block';
this.renderer.domElement.style.width = '100%';
this.renderer.domElement.style.height = '100%';
this.renderer.domElement.style.touchAction = 'none';
container.appendChild(this.renderer.domElement);

this.scene = new THREE.Scene();
this.scene.fog = new THREE.FogExp2(0xa6dcf5, 0.0015);
this.scene.environmentIntensity = 0.42;

this.camera = new THREE.PerspectiveCamera(54, width / height, 0.15, 420);

this.hemiLight = new THREE.HemisphereLight(0x88d2fa, 0x264a22, 0.58);
this.scene.add(this.hemiLight);

this.sunLight = new THREE.DirectionalLight(0xffedc2, 1.6);
this.sunLight.position.copy(this._sunOffset);
this.sunLight.castShadow = !this.isSoftwareGl;
const shadowSize = this.graphicsQuality === 'ultra' ? 2048 : 1024;
this.sunLight.shadow.mapSize.width = shadowSize;
this.sunLight.shadow.mapSize.height = shadowSize;
this.sunLight.shadow.camera.near = 5;
this.sunLight.shadow.camera.far = 140;
const d = 34;
this.sunLight.shadow.camera.left = -d;
this.sunLight.shadow.camera.right = d;
this.sunLight.shadow.camera.top = d;
this.sunLight.shadow.camera.bottom = -d;
this.sunLight.shadow.bias = -0.00035;
this.sunLight.shadow.normalBias = 0.018;
this.scene.add(this.sunLight);
this.scene.add(this.sunLight.target);

if (!this.isSoftwareGl) {
const pr = this.getTargetPixelRatio();
const rt = new THREE.WebGLRenderTarget(
Math.max(1, Math.floor(width * pr)),
Math.max(1, Math.floor(height * pr)),
{
type: THREE.HalfFloatType,
samples: this.renderer.capabilities.isWebGL2 ? 4 : 0,
},
);
this.composer = new EffectComposer(this.renderer, rt);
this.composer.setPixelRatio(pr);
this.composer.setSize(width, height);
this.composer.addPass(new RenderPass(this.scene, this.camera));
this.bloomPass = new UnrealBloomPass(
new THREE.Vector2(width, height),
0.3,
0.5,
0.86,
);
this.composer.addPass(this.bloomPass);
this.composer.addPass(new OutputPass());
}

const rimLight = new THREE.DirectionalLight(0xffcb7d, 0.32);
rimLight.position.set(-28, 18, 32);
this.scene.add(rimLight);

this.skyMat = createSkyDomeMaterial();
this.skyDome = new THREE.Mesh(
new THREE.SphereGeometry(280, 28, 18),
this.skyMat,
);
this.scene.add(this.skyDome);

this.oceanMat = createOceanMaterial();
this.oceanMesh = new THREE.Mesh(
new THREE.PlaneGeometry(520, 520, 96, 96),
this.oceanMat,
);
this.oceanMesh.rotation.x = -Math.PI / 2;
this.oceanMesh.position.y = 0;
this.scene.add(this.oceanMesh);

this.maxAniso = this.renderer.capabilities.getMaxAnisotropy();

// Pirate Ship (shown only in World 1 Tropical Cove)
this.pirateShip = createPirateShip(this.maxAniso);
this.pirateShip.position.set(
PIRATE_SHIP_ORIGIN.x,
PIRATE_SHIP_ORIGIN.y,
PIRATE_SHIP_ORIGIN.z,
);
this.pirateShip.rotation.y = 0.72;
this.scene.add(this.pirateShip);

// Explorer Girl Protagonist (Holy)
this.explorerRig = createExplorerGirl();
this.scene.add(this.explorerRig.root);

// Soft Contact Shadow Disc under Holy
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
this.scene.add(this.macawRig.root);

// Build initial World 1
this.loadWorld(1);

if (!this.isSoftwareGl) {
this.renderer.compile(this.scene, this.camera);
}

this.bindEvents();

if (typeof window !== 'undefined') {
fetch('/api/health')
.then((r) => {
const ct = r.headers.get('content-type') || '';
return r.ok && ct.includes('application/json') ? r.json() : null;
})
.then((data: { ttsConfigured?: boolean } | null) => {
if (data && typeof data.ttsConfigured === 'boolean') {
this.audio.setServerTtsAvailable(data.ttsConfigured);
}
})
.catch(() => {});
}

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
this.skyMat.uniforms.uCloudTint.value.setHex(
worldId === 3 ? 0xfff0d4 : 0xfffaf2,
);

this.hemiLight.color.setHex(theme.hemiSkyHex);
this.hemiLight.groundColor.setHex(theme.hemiGroundHex);
this.hemiLight.intensity = theme.hemiIntensity;

this.sunLight.color.setHex(theme.sunHex);
this.sunLight.intensity = theme.sunIntensity;
this.renderer.toneMappingExposure = theme.exposure;

this.scene.fog = new THREE.FogExp2(theme.fogHex, theme.fogDensity);

// Generate bright Nintendo world-matched PMREM reflections
this.envHandle?.dispose();
this.envHandle = createWorldEnvironmentMap(this.renderer, worldId);
this.scene.environment = this.envHandle.texture;
this.scene.environmentIntensity = worldId === 2 ? 0.46 : 0.42;

if (this.bloomPass) {
if (worldId === 2) {
this.bloomPass.strength = 0.44;
this.bloomPass.threshold = 0.76;
this.bloomPass.radius = 0.58;
} else if (worldId === 3) {
this.bloomPass.strength = 0.34;
this.bloomPass.threshold = 0.84;
this.bloomPass.radius = 0.48;
} else {
this.bloomPass.strength = 0.3;
this.bloomPass.threshold = 0.86;
this.bloomPass.radius = 0.5;
}
}

// Show/hide world-specific backdrop meshes
this.oceanMesh.visible = worldId === 1;
this.pirateShip.visible = worldId === 1;
this.skyDome.visible = worldId !== 2; // World 2 is inside its own enclosed 3D Cavern Dome!

this.audio.setWorldTheme(worldId);
}

private buildSceneForWorld(worldId: WorldId): WorldBuildResult {
if (worldId === 2) {
return buildCavernWorld(
this.starsDef,
this.maxAniso,
this.gemsDef,
this.bouncePadsDef,
this.windRingsDef,
this.npcsDef,
);
}
if (worldId === 3) {
return buildDesertWorld(
this.starsDef,
this.maxAniso,
this.gemsDef,
this.bouncePadsDef,
this.windRingsDef,
this.npcsDef,
);
}
return buildIslandWorld(
this.starsDef,
this.maxAniso,
this.gemsDef,
this.bouncePadsDef,
this.windRingsDef,
this.npcsDef,
);
}

private loadWorld(targetWorldId: WorldId): void {
if (this.world?.worldGroup) {
this.scene.remove(this.world.worldGroup);
this.disposeWorldGroup(this.world.worldGroup);
}

this.worldId = targetWorldId;
this.player = createInitialPlayerState(targetWorldId);
this.starsDef = createWorldStars(targetWorldId);
this.gemsDef = createSunGems(targetWorldId);
this.bouncePadsDef = createWorldBouncePads(targetWorldId);
this.windRingsDef = createWorldWindRings(targetWorldId);
this.npcsDef = createIslandNpcs(targetWorldId);

this.cameraYaw = 0;
this.cameraPitch = 0.24;
this.unlockBannerTimer = 0;
this.prevYaw = this.player.yaw;
this.nearbyNpc = null;
this.greetedNpcs.clear();
this.pendingCueQueue = [];
this.activeQuiz = null;
this.heardBounceCue = false;
this.heardWindRingCue = false;

this.applyWorldAtmosphere(targetWorldId);
this.world = this.buildSceneForWorld(targetWorldId);
this.scene.add(this.world.worldGroup);

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

document.body.dataset.flight = this.player.flightUnlocked
? 'unlocked'
: 'locked';
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
this.triggerStoryCue(WORLD_THEMES[1].introCueId);
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
this.resetVirtualInput();
this.setPhase('paused');
} else if (this.phase === 'paused') {
this.keys.clear();
this.resetVirtualInput();
this.setPhase('playing');
}
}

public returnToTitle(): void {
this.keys.clear();
this.resetVirtualInput();
this.audio.stopStoryCue();
this.pendingCueQueue = [];
this.activeStoryCue = null;
this.activeQuiz = null;
this.loadWorld(1);
this.setPhase('title');
this.positionTitleCamera(this.totalTime);
}

public toggleMute(): boolean {
const next = !this.audio.isMuted();
this.audio.setMuted(next);
this.pushHud(true);
return next;
}

public toggleMusic(): boolean {
const next = !this.audio.isMusicEnabled();
this.audio.setMusicEnabled(next);
this.pushHud(true);
return next;
}

public setTouchKey(code: string, pressed: boolean): void {
this.audio.startAmbience();
if (pressed) {
if (code === 'KeyF') {
this.interactWithNearbyNpc();
return;
}
this.keys.add(code);
} else {
this.keys.delete(code);
}
}

public setVirtualInput(partial: Partial<VirtualControlState>): void {
this.audio.startAmbience();
Object.assign(this.virtualInput, partial);
}

private resetVirtualInput(): void {
this.virtualInput.analogX = 0;
this.virtualInput.analogY = 0;
this.virtualInput.jumpOrAscend = false;
this.virtualInput.descend = false;
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
this.storyCueDismissTimer = 15.0;
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
if (this.pendingCueQueue.length > 0 && !this.disposed && this.phase === 'playing') {
const nextCue = this.pendingCueQueue.shift()!;
this.triggerStoryCue(nextCue);
} else {
this.storyCueDismissTimer = 5.0;
}
},
);
}

public dismissStoryCue(): void {
this.audio.stopStoryCue();
this.pendingCueQueue = [];
this.activeStoryCue = null;
this.pushHud(true);
}

public askWakaGuide(): void {
const tips = WORLD_THEMES[this.worldId].wakaTipCueIds;
this.wakaTipIndex = (this.wakaTipIndex + 1) % tips.length;
this.pendingCueQueue = [];
this.triggerStoryCue(tips[this.wakaTipIndex]);
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
const cue = STORY_CUES[cueId];
if (cue?.quiz && !this.solvedQuizzes.has(cueId)) {
this.pendingCueQueue = [];
this.activeQuiz = {
...cue.quiz,
cueId,
};
this.audio.speakDynamicLine(cue.quiz.npcSpeaker, cue.quiz.question);
this.pushHud(true);
} else {
this.triggerStoryCue(cueId);
}
}

public openQuizForActiveCue(): void {
if (!this.activeStoryCue) return;
const cue = STORY_CUES[this.activeStoryCue.cueId];
if (!cue?.quiz) return;
this.pendingCueQueue = [];
this.activeQuiz = {
...cue.quiz,
cueId: cue.id,
};
this.audio.speakDynamicLine(cue.quiz.npcSpeaker, cue.quiz.question);
this.pushHud(true);
}

public speakQuizHint(): void {
if (!this.activeQuiz) return;
this.audio.speakDynamicLine('Waka', this.activeQuiz.wakaHint);
}

public speakQuizWrongAnswer(): void {
if (!this.activeQuiz) return;
this.audio.speakDynamicLine('Waka', this.activeQuiz.wrongReply);
}

public closeQuiz(): void {
this.audio.stopStoryCue();
this.activeQuiz = null;
this.pushHud(true);
}

public completeQuizChallenge(cueId: string): void {
this.solvedQuizzes.add(cueId);
const quizReward = this.activeQuiz?.rewardMessage;
this.activeQuiz = null;
if (this.activeStoryCue && this.activeStoryCue.cueId === cueId) {
this.activeStoryCue = {
...this.activeStoryCue,
quizSolved: true,
};
}
this.player.flightEnergy = 100;
this.audio.playTreasureChestOpen();
if (quizReward) {
this.audio.speakDynamicLine('Holy', quizReward);
}
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

private snapGameplayCamera(): void {
const dist = 6.2;
this.camera.position.set(
this.player.x + Math.sin(this.cameraYaw) * dist,
this.player.y + 3.0,
this.player.z + Math.cos(this.cameraYaw) * dist,
);
this._camTarget.set(
this.player.x,
this.player.y + 1.35,
this.player.z - 1.5,
);
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

public toggleGraphicsQuality(): void {
if (this.isSoftwareGl) return;
this.graphicsQuality = this.graphicsQuality === 'ultra' ? 'fast' : 'ultra';
const pr = this.getTargetPixelRatio();
this.renderer.setPixelRatio(pr);
if (this.composer) {
this.composer.setPixelRatio(pr);
}
const shadowSize = this.graphicsQuality === 'ultra' ? 2048 : 1024;
if (this.sunLight.shadow.mapSize.width !== shadowSize) {
this.sunLight.shadow.mapSize.width = shadowSize;
this.sunLight.shadow.mapSize.height = shadowSize;
this.sunLight.shadow.map?.dispose();
this.sunLight.shadow.map = null;
}
this.pushHud(true);
}

public pushHud(force = false): void {
const now = performance.now();
if (!force && now - this.lastHudPush < 110) return;
this.lastHudPush = now;
const theme = WORLD_THEMES[this.worldId];

this.onHudUpdate({
phase: this.phase,
graphicsQuality: this.graphicsQuality,
worldId: this.worldId,
worldShortName: theme.shortName,
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
musicEnabled: this.audio.isMusicEnabled(),
nearbyNpc: this.nearbyNpc
? {
id: this.nearbyNpc.id,
speakerId: this.nearbyNpc.speakerId,
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
this.resetVirtualInput();
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
if (this.composer) {
this.composer.setSize(width, height);
}
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
this.skyMat.uniforms.uTime.value = t;

if (this.worldId === 1) {
this.oceanMat.uniforms.uTime.value = t;
this.pirateShip.position.y =
PIRATE_SHIP_ORIGIN.y + Math.sin(t * 1.25) * 0.24;
this.pirateShip.rotation.z = Math.sin(t * 0.95) * 0.045;
this.pirateShip.rotation.x = Math.cos(t * 1.15) * 0.03;
}

this.world.update(t, dt, isPortalAwakened(this.player));

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

const groundFn = (x: number, z: number) =>
getWorldGroundHeight(this.worldId, x, z);
const portalPos = getWorldPortalPos(this.worldId);
const waterLevel = getWorldWaterLevel(this.worldId);
const maxFlightY = getWorldMaxFlightY(this.worldId);

const subSteps = frameDt > 0.055 ? 2 : 1;
const stepDt = frameDt / subSteps;
const inputSnap = {
forward: this.keys.has('KeyW') || this.keys.has('ArrowUp'),
backward: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
jumpOrAscend: this.keys.has('Space') || this.virtualInput.jumpOrAscend,
descend:
this.keys.has('ControlLeft') ||
this.keys.has('KeyC') ||
this.virtualInput.descend,
sprint: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
cameraYaw: this.cameraYaw,
analogX: this.virtualInput.analogX,
analogY: this.virtualInput.analogY,
};

this.activeColliders.length = 0;
this.activeColliders.push(
...this.world.staticColliders,
...this.world.dynamicColliders,
);

let events = stepPlayerSimulation(
this.player,
inputSnap,
this.starsDef,
stepDt,
groundFn,
this.gemsDef,
this.bouncePadsDef,
this.windRingsDef,
portalPos,
waterLevel,
maxFlightY,
this.activeColliders,
);

if (subSteps === 2) {
const events2 = stepPlayerSimulation(
this.player,
inputSnap,
this.starsDef,
stepDt,
groundFn,
this.gemsDef,
this.bouncePadsDef,
this.windRingsDef,
portalPos,
waterLevel,
maxFlightY,
this.activeColliders,
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
if (
this.worldId === 1 &&
this.player.starsCollected.length === 1 &&
!this.activeStoryCue
) {
this.triggerStoryCue('first_star');
}
}

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
if (!this.heardBounceCue && !this.activeStoryCue) {
this.heardBounceCue = true;
this.triggerStoryCue(WORLD_THEMES[this.worldId].bounceCueId);
}
}

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
if (!this.heardWindRingCue && !this.activeStoryCue) {
this.heardWindRingCue = true;
this.triggerStoryCue('first_wind_ring');
}
}

for (const gem of events.collectedGems) {
const cv = this.world.chestVisuals.find((c) => c.id === gem.id);
if (cv) {
cv.collected = true;
this.world.sparkles.emit(gem.x, gem.y + 0.6, gem.z, 45, 2.4, 2.2);
}
this.audio.playTreasureChestOpen();
this.triggerStoryCue(gem.cueId);
}

if (events.portalReadyNow) {
this.audio.playFlightUnlock();
this.pendingCueQueue.push(WORLD_THEMES[this.worldId].portalReadyCueId);
}

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

if (
isNearLockedPortal(this.player, portalPos) &&
this.portalHintCooldown <= 0
) {
this.portalHintCooldown = 12.0;
this.triggerStoryCue('portal_locked_hint');
}

if (events.jumped) this.audio.playJump();
if (events.startedFlying) this.audio.playFlightUnlock();

const horizSpeed = Math.hypot(this.player.vx, this.player.vz);
if (this.player.grounded && horizSpeed > 1.5) {
this.audio.playFootstep();
}

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

const camDist = this.player.isFlying ? 7.6 : 6.0;
const camHeight = Math.sin(this.cameraPitch) * camDist + 1.45;
const horizDist = Math.cos(this.cameraPitch) * camDist;

this._camDesired.set(
this.player.x + Math.sin(this.cameraYaw) * horizDist,
this.player.y + camHeight,
this.player.z + Math.cos(this.cameraYaw) * horizDist,
);
const minCamGround =
groundFn(this._camDesired.x, this._camDesired.z) + 1.1;
if (this._camDesired.y < minCamGround) {
this._camDesired.y = minCamGround;
}
// Keep camera safely under the World 2 subterranean stalactite ceiling!
if (this.worldId === 2 && this._camDesired.y > maxFlightY - 1.2) {
this._camDesired.y = maxFlightY - 1.2;
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
portalPos.x,
portalPos.y + 1.2,
portalPos.z,
60,
3.0,
2.5,
);
this.pendingCueQueue = [];
this.triggerStoryCue(WORLD_THEMES[this.worldId].victoryCueId);
this.setPhase('gameover');
}

this.pushHud(
events.collectedStars.length > 0 ||
events.collectedGems.length > 0 ||
events.unlockedFlightNow,
);
}

const groundUnderPlayer = Math.max(
getWorldWaterLevel(this.worldId) + 0.04,
getWorldGroundHeight(this.worldId, this.player.x, this.player.z),
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
this.contactShadow.scale.setScalar(1 + heightAboveGround * 0.06);

// Follow Holy cleanly with texel-snapped directional shadow frustum across large worlds
const shadowSize = this.sunLight.shadow.mapSize.width || 1024;
const texelStep = 68 / shadowSize;
const snapX = Math.round(this.player.x / texelStep) * texelStep;
const snapZ = Math.round(this.player.z / texelStep) * texelStep;
this.sunLight.target.position.set(snapX, this.player.y, snapZ);
this.sunLight.position.set(
snapX + this._sunOffset.x,
this.player.y + this._sunOffset.y,
snapZ + this._sunOffset.z,
);

if (!this.isSoftwareGl && this.graphicsQuality === 'ultra' && this.composer) {
this.composer.render();
} else {
this.renderer.render(this.scene, this.camera);
}

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

this.disposeWorldGroup(this.world?.worldGroup);
this.envHandle?.dispose();
this.composer?.dispose();
this.audio.dispose();
this.renderer.dispose();
if (this.renderer.domElement.parentElement === this.container) {
this.container.removeChild(this.renderer.domElement);
}
}
}