import type { VoiceSpeakerId } from './storyCues.ts';

export type GamePhaseState = 'title' | 'playing' | 'paused' | 'gameover';

export type WorldId = 1 | 2 | 3;

export type SunGemId = 'marina' | 'esmeralda' | 'celestial';

export type BiblicalArtifactType =
| 'menorah'
| 'bible'
| 'ark'
| 'oil_lamp'
| 'scroll_jar'
| 'cornerstone'
| 'manna'
| 'staff_harp'
| 'water_crown';

export interface Vec3 {
x: number;
y: number;
z: number;
}

export interface WorldThemeDef {
id: WorldId;
shortName: string;
name: string;
subtitle: string;
bibleVerse: string;
introCueId: string;
portalReadyCueId: string;
victoryCueId: string;
wakaTipCueIds: [string, string];
bounceCueId: string;
skyZenithHex: number;
skyMidHex: number;
skyHorizonHex: number;
sunGlowHex: number;
fogHex: number;
fogDensity: number;
hemiSkyHex: number;
hemiGroundHex: number;
hemiIntensity: number;
sunHex: number;
sunIntensity: number;
exposure: number;
}

export const WORLD_THEMES: Record<WorldId, WorldThemeDef> = {
1: {
id: 1,
shortName: 'Isla Tropical',
name: 'Mundo 1 · Isla del Portal Dorado',
subtitle: 'El Jardín de la Creación y la Luz',
bibleVerse:
'Génesis 1:31 · "Y vio Dios todo lo que había hecho, y era bueno en gran manera."',
introCueId: 'intro_island',
portalReadyCueId: 'portal_ready_w1',
victoryCueId: 'victory_w1',
wakaTipCueIds: ['w1_waka_tip_1', 'w1_waka_tip_2'],
bounceCueId: 'first_mushroom',
skyZenithHex: 0x1664b8,
skyMidHex: 0x45a3de,
skyHorizonHex: 0xa6dcf5,
sunGlowHex: 0xffdca0,
fogHex: 0xa6dcf5,
fogDensity: 0.0015,
hemiSkyHex: 0x88d2fa,
hemiGroundHex: 0x264a22,
hemiIntensity: 0.56,
sunHex: 0xffedc2,
sunIntensity: 1.55,
exposure: 0.94,
},
2: {
id: 2,
shortName: 'Caverna Subterránea',
name: 'Mundo 2 · Caverna Subterránea de Cristal',
subtitle: 'La Luz que Brilla en las Profundidades',
bibleVerse:
'Juan 1:5 · "La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella."',
introCueId: 'world2_intro',
portalReadyCueId: 'portal_ready_w2',
victoryCueId: 'victory_w2',
wakaTipCueIds: ['w2_waka_tip_1', 'w2_waka_tip_2'],
bounceCueId: 'w2_first_geyser',
skyZenithHex: 0x0b1026,
skyMidHex: 0x152245,
skyHorizonHex: 0x1e355c,
sunGlowHex: 0x62f2ff,
fogHex: 0x131b38,
fogDensity: 0.0042,
hemiSkyHex: 0x6ab7ff,
hemiGroundHex: 0x3b2a56,
hemiIntensity: 0.95,
sunHex: 0xffe4b3,
sunIntensity: 0.95,
exposure: 1.05,
},
3: {
id: 3,
shortName: 'Desierto Dorado',
name: 'Mundo 3 · Desierto Dorado y Oasis',
subtitle: 'La Travesía de la Fe, el Maná y el Agua Viva',
bibleVerse:
'Salmos 23:1-2 · "Jehová es mi pastor; nada me faltará. Junto a aguas de reposo me pastoreará."',
introCueId: 'world3_intro',
portalReadyCueId: 'portal_ready_w3',
victoryCueId: 'victory_w3',
wakaTipCueIds: ['w3_waka_tip_1', 'w3_waka_tip_2'],
bounceCueId: 'w3_first_whirlwind',
skyZenithHex: 0x24569c,
skyMidHex: 0xd98445,
skyHorizonHex: 0xffd79b,
sunGlowHex: 0xfff0b5,
fogHex: 0xf4c98d,
fogDensity: 0.0017,
hemiSkyHex: 0xffe5b8,
hemiGroundHex: 0x8f5626,
hemiIntensity: 0.64,
sunHex: 0xffdf99,
sunIntensity: 1.65,
exposure: 0.96,
},
};

export interface MagicStarDef {
id: number;
x: number;
y: number;
z: number;
isSkyStar: boolean;
}

export interface SunGemDef {
id: SunGemId;
name: string;
artifactType: BiblicalArtifactType;
bibleVerse: string;
shortMeaning: string;
colorHex: number;
x: number;
y: number;
z: number;
cueId: string;
}

export interface BouncyMushroomDef {
id: number;
x: number;
y: number;
z: number;
radius: number;
bounceVy: number;
capColor: number;
}

export interface WindRingDef {
id: number;
x: number;
y: number;
z: number;
radius: number;
}

export interface NpcDef {
id:
| 'captain'
| 'mateo'
| 'ixchel'
| 'noe'
| 'ester'
| 'samuel'
| 'miriam'
| 'david'
| 'caleb';
speakerId: VoiceSpeakerId;
name: string;
role: string;
x: number;
y: number;
z: number;
yaw: number;
cueId: string;
interactRadius: number;
}

export interface PlayerSimState {
x: number;
y: number;
z: number;
vx: number;
vy: number;
vz: number;
yaw: number;
grounded: boolean;
isFlying: boolean;
flightUnlocked: boolean;
flightEnergy: number; // 0..100
walkDistance: number;
starsCollected: number[];
gemsCollected: SunGemId[];
ringsPassed: number[];
elapsedTime: number;
won: boolean;
}

export interface InputSnapshot {
forward: boolean;
backward: boolean;
left: boolean;
right: boolean;
jumpOrAscend: boolean;
descend: boolean;
sprint: boolean;
cameraYaw: number;
analogX?: number;
analogY?: number;
}

export const WATER_LEVEL = 0;
export const STARS_TO_UNLOCK_FLIGHT = 4;
export const TOTAL_STARS = 10;
export const TOTAL_GEMS = 3;
export const TOTAL_WORLDS = 3;
export const WORLD_PLAY_RADIUS = 102;
export const TERRAIN_SIZE = 240;
export const PORTAL_TRIGGER_RADIUS = 3.5;

export const SPAWN_POS: Vec3 = { x: 0, y: 3.3, z: 48.0 };
export const TEMPLE_PORTAL_POS: Vec3 = { x: 0, y: 10.6, z: -62.5 };

export const CAVERN_SPAWN_POS: Vec3 = { x: 0, y: 4.3, z: 46.0 };
export const CAVERN_PORTAL_POS: Vec3 = { x: 0, y: 11.4, z: -60.0 };
export const CAVERN_WATER_LEVEL = -1.2;
export const CAVERN_MAX_FLIGHT_Y = 24.5;

export const DESERT_SPAWN_POS: Vec3 = { x: 0, y: 3.2, z: 48.0 };
export const DESERT_PORTAL_POS: Vec3 = { x: 0, y: 12.4, z: -62.0 };
export const DESERT_WATER_LEVEL = 0.65;
export const DESERT_MAX_FLIGHT_Y = 34.0;

export const PIRATE_SHIP_ORIGIN: Vec3 = { x: -35.0, y: 0.2, z: -15.5 };
export const WATERFALL_POS: Vec3 = { x: 31.0, y: 0, z: -19.5 };

export const BRIDGE_BOUNDS = {
minX: -2.9,
maxX: 2.9,
minZ: -1.5,
maxZ: 8.5,
deckY: 3.25,
};

export const CAVERN_BRIDGE_BOUNDS = {
minX: -3.6,
maxX: 3.6,
minZ: 5.5,
maxZ: 20.5,
deckY: 4.35,
};

export const STEPPING_PILLARS: Array<{
x: number;
z: number;
topY: number;
radius: number;
}> = [
{ x: -24.8, z: -8.2, topY: 1.55, radius: 1.45 },
{ x: -26.5, z: -12.0, topY: 1.95, radius: 1.4 },
{ x: -25.2, z: -15.6, topY: 2.35, radius: 1.4 },
{ x: -27.5, z: -19.5, topY: 2.75, radius: 1.75 },
];

export const CAVERN_STALAGMITE_PILLARS: Array<{
x: number;
z: number;
topY: number;
radius: number;
}> = [
{ x: -19.5, z: -6.5, topY: 2.1, radius: 1.7 },
{ x: -23.5, z: -11.0, topY: 2.9, radius: 1.65 },
{ x: -27.5, z: -15.2, topY: 3.7, radius: 1.65 },
{ x: -31.0, z: -19.6, topY: 4.5, radius: 1.7 },
{ x: -34.0, z: -24.0, topY: 5.3, radius: 2.3 },
];

export const DESERT_PYRAMID_CENTER = { x: -32.0, z: -16.0 };
export const DESERT_PYRAMID_TIERS = [
{ halfSize: 10.6, topY: 4.2 },
{ halfSize: 7.6, topY: 6.2 },
{ halfSize: 4.8, topY: 8.2 },
{ halfSize: 2.6, topY: 10.2 },
];

export const DESERT_OASIS_CENTER = { x: 28.0, z: -10.0 };

function smoothstep(edge0: number, edge1: number, x: number): number {
const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
return a + (b - a) * t;
}

// ============================================================================
// WORLD 1 TERRAIN: TROPICAL ISLAND
// ============================================================================
export function getTrailCenterX(z: number): number {
return Math.sin((50 - z) * 0.085) * 4.2 * smoothstep(-28, 48, z);
}

export function getNaturalTerrainHeight(x: number, z: number): number {
const angle = Math.atan2(z, x - 4);
const coastVariation =
1.0 +
0.15 * Math.sin(angle * 3.0 + 0.5) +
0.11 * Math.cos(angle * 5.0 - 0.7) +
0.06 * Math.sin(angle * 7.0);

const coveDx = (x + 33) / 21.5;
const coveDz = (z + 14) / 23.0;
const coveDist = Math.sqrt(coveDx * coveDx + coveDz * coveDz);
const coveCut = (1.0 - smoothstep(0.4, 1.12, coveDist)) * 7.6;

const streamCenterZ = 3.5 + Math.sin(x * 0.08) * 1.4;
const streamDist = Math.abs(z - streamCenterZ);
const streamMask =
(1.0 - smoothstep(1.8, 5.2, streamDist)) *
(1.0 - smoothstep(18, 36, Math.abs(x)));
const streamCut = streamMask * 2.75;

const rx = (x - 4.0) / (58.0 * coastVariation);
const rz = (z + 2.0) / (72.0 * coastVariation);
const radial = Math.sqrt(rx * rx + rz * rz);

const islandMask = 1.0 - smoothstep(0.64, 1.03, radial);
const oceanFloor = -3.4;
let h = lerp(oceanFloor, 2.5, islandMask);

const rollingHills =
(Math.sin(x * 0.065 + 0.4) * Math.cos(z * 0.055 - 0.3) * 1.45 +
Math.sin((x + z) * 0.11) * 0.55) *
islandMask;
h += rollingHills;

const bluffFactor = smoothstep(24, 42, z) * islandMask;
h += bluffFactor * 1.25;

const eastRidgeDist = Math.hypot((x - 33) / 20, (z + 22) / 22);
const eastRidgeMask = 1.0 - smoothstep(0.45, 1.05, eastRidgeDist);
h += eastRidgeMask * 9.8;

const shelfDist = Math.hypot(x - 31, z + 29);
const shelfMask = 1.0 - smoothstep(3.2, 6.8, shelfDist);
h = lerp(h, 11.2, shelfMask * 0.88);

const templePlateauMask =
(1.0 - smoothstep(13, 25, Math.abs(x))) * smoothstep(-34, -56, z);
h = Math.max(h, lerp(oceanFloor, 10.2, templePlateauMask));

h -= coveCut;
h -= streamCut;

if (z > -27 && z < 53) {
const trailX = getTrailCenterX(z);
const distFromTrail = Math.abs(x - trailX);
const trailBlend =
(1.0 - smoothstep(2.5, 5.8, distFromTrail)) * (1.0 - streamMask * 0.85);
const trailTargetH =
3.15 +
Math.sin((50 - z) * 0.09) * 0.35 +
smoothstep(22, -20, z) * 0.35;
h = lerp(h, trailTargetH, trailBlend * 0.9);
}

if (Math.abs(x) < 10.5 && z <= -30 && z >= -70) {
const lateralBlend = 1.0 - smoothstep(5.4, 9.8, Math.abs(x));
let templeH = 10.2;
if (z > -54.5) {
const t = smoothstep(-34.0, -54.5, z);
const steps = 14;
const quantized = Math.floor(t * steps) / steps;
const smoothRamp = lerp(t, quantized, 0.32);
templeH = lerp(2.7, 10.2, smoothRamp);
}
const zEntryBlend = smoothstep(-30, -35, z);
const zBackBlend = 1.0 - smoothstep(-66, -70, z);
h = lerp(h, templeH, lateralBlend * zEntryBlend * zBackBlend);
}

return h;
}

export function getIslandGroundHeight(x: number, z: number): number {
let h = getNaturalTerrainHeight(x, z);

if (
x >= BRIDGE_BOUNDS.minX &&
x <= BRIDGE_BOUNDS.maxX &&
z >= BRIDGE_BOUNDS.minZ &&
z <= BRIDGE_BOUNDS.maxZ
) {
const t =
(z - BRIDGE_BOUNDS.minZ) / (BRIDGE_BOUNDS.maxZ - BRIDGE_BOUNDS.minZ);
const arch = Math.sin(t * Math.PI) * 0.55;
h = Math.max(h, BRIDGE_BOUNDS.deckY + arch);
}

if (x >= -24.2 && x <= -13.5 && z >= -5.6 && z <= -2.4) {
h = Math.max(h, 1.55);
}

for (const p of STEPPING_PILLARS) {
const d = Math.hypot(x - p.x, z - p.z);
if (d <= p.radius) {
h = Math.max(h, p.topY);
}
}

return h;
}

// ============================================================================
// WORLD 2 TERRAIN: UNDERGROUND CRYSTAL CAVERN
// ============================================================================
export function getCavernTrailCenterX(z: number): number {
return Math.sin((46 - z) * 0.09) * 3.8 * smoothstep(-30, 46, z);
}

export function getCavernNaturalHeight(x: number, z: number): number {
// Base rugged subterranean floor
let h =
3.6 +
Math.sin(x * 0.08 + 0.5) * Math.cos(z * 0.07) * 1.15 +
Math.sin((x - z) * 0.14) * 0.45;

// Enclosed rising cavern perimeter walls beyond r > 62
const radial = Math.hypot(x, z * 0.92);
const wallFactor = smoothstep(56, 86, radial);
h += wallFactor * 22.0;

// Deep diagonal underground glowing river chasm around z = 13 + sin(x * 0.06) * 4.5
const riverZ = 13.0 + Math.sin(x * 0.06) * 4.5;
const riverDist = Math.abs(z - riverZ);
const riverMask = 1.0 - smoothstep(4.2, 8.8, riverDist);
h = lerp(h, -2.5, riverMask * 0.94);

// West Abyssal Crystal Lake (x around -27, z around -14)
const lakeDist = Math.hypot((x + 27) / 14.5, (z + 14) / 16.5);
const lakeMask = 1.0 - smoothstep(0.45, 1.08, lakeDist);
h = lerp(h, -2.6, lakeMask * 0.92);

// East High Crystal Gallery Balcony (x = 34, z = -22, shelf y = 13.4)
const galleryDist = Math.hypot(x - 34, z + 22);
const galleryShelf = 1.0 - smoothstep(4.8, 9.2, galleryDist);
h = lerp(h, 13.4, galleryShelf * 0.96);

// South Torch-Lit Entrance Grotto plateau (z = 36..54)
const southGrotto =
(1.0 - smoothstep(8, 16, Math.abs(x))) * smoothstep(30, 44, z);
h = lerp(h, 4.1, southGrotto * 0.9);

// Smooth central subterranean trail (excluding river bridge chasm)
if (z > -32 && z < 50) {
const tx = getCavernTrailCenterX(z);
const tDist = Math.abs(x - tx);
const tBlend =
(1.0 - smoothstep(2.6, 5.6, tDist)) * (1.0 - riverMask * 0.92);
h = lerp(h, 3.8, tBlend * 0.85);
}

// North Rock-Cut Underground Sanctuary Ramp & Plateau (z = -32..-68)
if (Math.abs(x) < 12.5 && z <= -30 && z >= -70) {
const latBlend = 1.0 - smoothstep(6.2, 11.2, Math.abs(x));
let sancH = 11.0;
if (z > -52.5) {
const t = smoothstep(-32.0, -52.5, z);
sancH = lerp(3.6, 11.0, t);
}
const zIn = smoothstep(-30, -34, z);
const zOut = 1.0 - smoothstep(-65, -70, z);
h = lerp(h, sancH, latBlend * zIn * zOut);
}

return h;
}

export function getCavernGroundHeight(x: number, z: number): number {
let h = getCavernNaturalHeight(x, z);

// Solid Crystal-Arch Stone Bridge over the underground river chasm
if (
x >= CAVERN_BRIDGE_BOUNDS.minX &&
x <= CAVERN_BRIDGE_BOUNDS.maxX &&
z >= CAVERN_BRIDGE_BOUNDS.minZ &&
z <= CAVERN_BRIDGE_BOUNDS.maxZ
) {
const t =
(z - CAVERN_BRIDGE_BOUNDS.minZ) /
(CAVERN_BRIDGE_BOUNDS.maxZ - CAVERN_BRIDGE_BOUNDS.minZ);
const arch = Math.sin(t * Math.PI) * 0.7;
h = Math.max(h, CAVERN_BRIDGE_BOUNDS.deckY + arch);
}

// Walkable Amethyst Stalagmite Parkour Columns in the West Crystal Lake
for (const p of CAVERN_STALAGMITE_PILLARS) {
const d = Math.hypot(x - p.x, z - p.z);
if (d <= p.radius) {
h = Math.max(h, p.topY);
}
}

return h;
}

// ============================================================================
// WORLD 3 TERRAIN: GOLDEN EXODUS DESERT & OASIS
// ============================================================================
export function getDesertCanyonCenterX(z: number): number {
return Math.sin((40 - z) * 0.075) * 4.8 * smoothstep(-32, 48, z);
}

export function getDesertNaturalHeight(x: number, z: number): number {
// Rolling wind-swept golden sand dunes across entire playable basin (always dry > 1.5!)
let h =
2.8 +
Math.sin(x * 0.07 + z * 0.035) * 1.45 +
Math.cos(z * 0.08 - x * 0.02) * 0.95 +
Math.sin((x + z) * 0.14) * 0.35;

// Towering Red-Sandstone Canyon Mesas flanking the central arch trail (z = -10..24)
const zMesaMask =
smoothstep(-16, -2, z) * (1.0 - smoothstep(18, 30, z));
const leftMesa =
zMesaMask * smoothstep(-10, -20, x) * (1.0 - smoothstep(-34, -46, x));
const rightMesa =
zMesaMask * smoothstep(10, 19, x) * (1.0 - smoothstep(26, 36, x));
h += leftMesa * 8.4 + rightMesa * 7.8;

// East Red-Rock Cliffside Mesa Plateau (x = 36, z = -28, shelf y = 13.0)
const eastMesaDist = Math.hypot(x - 36, z + 28);
const eastMesaMask = 1.0 - smoothstep(5.0, 9.5, eastMesaDist);
h = lerp(h, 13.0, eastMesaMask * 0.96);

// Sunken Emerald Desert Oasis Basin (x = 28, z = -10)
const oasisDist = Math.hypot((x - 28) / 11.5, (z + 10) / 10.5);
const oasisMask = 1.0 - smoothstep(0.4, 1.05, oasisDist);
h = lerp(h, -0.35, oasisMask * 0.92);

// Flat Nomad Camp Basin around spawn (x in -14..14, z in 36..58)
const campMask =
(1.0 - smoothstep(10, 18, Math.abs(x))) * smoothstep(32, 44, z);
h = lerp(h, 3.05, campMask * 0.92);

// Smooth walkable central Sandstone Canyon Trail (z = -30..50)
if (z > -31 && z < 51) {
const cx = getDesertCanyonCenterX(z);
const cDist = Math.abs(x - cx);
const cBlend = 1.0 - smoothstep(3.2, 6.4, cDist);
h = lerp(h, 3.1, cBlend * 0.9);
}

// North Mount of Promise Ramp & Sanctuary Plateau (z = -34..-68)
if (Math.abs(x) < 13.0 && z <= -32 && z >= -70) {
const latBlend = 1.0 - smoothstep(6.8, 11.8, Math.abs(x));
let mountH = 12.0;
if (z > -54.5) {
const t = smoothstep(-34.0, -54.5, z);
mountH = lerp(3.1, 12.0, t);
}
const zIn = smoothstep(-32, -36, z);
const zOut = 1.0 - smoothstep(-66, -70, z);
h = lerp(h, mountH, latBlend * zIn * zOut);
}

return h;
}

export function getDesertGroundHeight(x: number, z: number): number {
let h = getDesertNaturalHeight(x, z);

// West Climbable Stepped Ancient Golden Pyramid (centered at -32, -16)
const dx = Math.abs(x - DESERT_PYRAMID_CENTER.x);
const dz = Math.abs(z - DESERT_PYRAMID_CENTER.z);
const maxD = Math.max(dx, dz);
for (const tier of DESERT_PYRAMID_TIERS) {
if (maxD <= tier.halfSize) {
h = Math.max(h, tier.topY);
}
}

return h;
}

// ============================================================================
// UNIFIED WORLD HELPERS
// ============================================================================
export function getWorldGroundHeight(
worldId: WorldId,
x: number,
z: number,
): number {
if (worldId === 2) return getCavernGroundHeight(x, z);
if (worldId === 3) return getDesertGroundHeight(x, z);
return getIslandGroundHeight(x, z);
}

export function getWorldSpawnPos(worldId: WorldId): Vec3 {
if (worldId === 2) return CAVERN_SPAWN_POS;
if (worldId === 3) return DESERT_SPAWN_POS;
return SPAWN_POS;
}

export function getWorldPortalPos(worldId: WorldId): Vec3 {
if (worldId === 2) return CAVERN_PORTAL_POS;
if (worldId === 3) return DESERT_PORTAL_POS;
return TEMPLE_PORTAL_POS;
}

export function getWorldWaterLevel(worldId: WorldId): number {
if (worldId === 2) return CAVERN_WATER_LEVEL;
if (worldId === 3) return DESERT_WATER_LEVEL;
return WATER_LEVEL;
}

export function getWorldMaxFlightY(worldId: WorldId): number {
if (worldId === 2) return CAVERN_MAX_FLIGHT_Y;
if (worldId === 3) return DESERT_MAX_FLIGHT_Y;
return 32;
}

export function createInitialMagicStars(): MagicStarDef[] {
return createWorldStars(1);
}

export function createWorldStars(worldId: WorldId = 1): MagicStarDef[] {
if (worldId === 2) {
const z0 = 40.0;
const x0 = getCavernTrailCenterX(z0);
const z1 = 27.5;
const x1 = getCavernTrailCenterX(z1);
const z2 = 13.0; // Over the Crystal-Arch Bridge
const x2 = 0;
const z3 = -2.0;
const x3 = getCavernTrailCenterX(z3);

return [
{ id: 0, x: x0, y: getCavernGroundHeight(x0, z0) + 1.25, z: z0, isSkyStar: false },
{ id: 1, x: x1, y: getCavernGroundHeight(x1, z1) + 1.3, z: z1, isSkyStar: false },
{ id: 2, x: x2, y: getCavernGroundHeight(x2, z2) + 1.35, z: z2, isSkyStar: false },
{ id: 3, x: x3, y: getCavernGroundHeight(x3, z3) + 1.3, z: z3, isSkyStar: false },
{ id: 4, x: -23.5, y: 2.9 + 1.35, z: -11.0, isSkyStar: false },
{ id: 5, x: 24.5, y: getCavernGroundHeight(24.5, -14.0) + 1.9, z: -14.0, isSkyStar: false },
{ id: 6, x: 0, y: getCavernGroundHeight(0, -31.0) + 1.4, z: -31.0, isSkyStar: false },
{ id: 7, x: -4.5, y: 12.2, z: -14.0, isSkyStar: true },
{ id: 8, x: 4.5, y: 15.2, z: -28.0, isSkyStar: true },
{ id: 9, x: -2.0, y: 17.5, z: -41.0, isSkyStar: true },
];
}

if (worldId === 3) {
const z0 = 41.0;
const x0 = getDesertCanyonCenterX(z0);
const z1 = 27.0;
const x1 = getDesertCanyonCenterX(z1);
const z2 = 13.0;
const x2 = getDesertCanyonCenterX(z2);
const z3 = 6.0; // Right under the giant Natural Sandstone Arch!
const x3 = getDesertCanyonCenterX(z3);

return [
{ id: 0, x: x0, y: getDesertGroundHeight(x0, z0) + 1.25, z: z0, isSkyStar: false },
{ id: 1, x: x1, y: getDesertGroundHeight(x1, z1) + 1.3, z: z1, isSkyStar: false },
{ id: 2, x: x2, y: getDesertGroundHeight(x2, z2) + 1.3, z: z2, isSkyStar: false },
{ id: 3, x: x3, y: getDesertGroundHeight(x3, z3) + 1.35, z: z3, isSkyStar: false },
{ id: 4, x: -24.5, y: getDesertGroundHeight(-24.5, -16.0) + 1.4, z: -16.0, isSkyStar: false },
{ id: 5, x: 23.0, y: getDesertGroundHeight(23.0, -14.0) + 1.4, z: -14.0, isSkyStar: false },
{ id: 6, x: 0, y: getDesertGroundHeight(0, -32.0) + 1.4, z: -32.0, isSkyStar: false },
{ id: 7, x: -5.0, y: 13.0, z: -14.0, isSkyStar: true },
{ id: 8, x: 5.0, y: 16.0, z: -28.0, isSkyStar: true },
{ id: 9, x: 0.0, y: 18.6, z: -41.0, isSkyStar: true },
];
}

// World 1 (Tropical Island)
const star0Z = 42.0;
const star0X = getTrailCenterX(star0Z);
const star1Z = 27.5;
const star1X = getTrailCenterX(star1Z);
const star2Z = 14.5;
const star2X = getTrailCenterX(star2Z);
const star3Z = 3.5;
const star3X = 0;

return [
{ id: 0, x: star0X, y: getIslandGroundHeight(star0X, star0Z) + 1.25, z: star0Z, isSkyStar: false },
{ id: 1, x: star1X, y: getIslandGroundHeight(star1X, star1Z) + 1.3, z: star1Z, isSkyStar: false },
{ id: 2, x: star2X, y: getIslandGroundHeight(star2X, star2Z) + 1.3, z: star2Z, isSkyStar: false },
{ id: 3, x: star3X, y: getIslandGroundHeight(star3X, star3Z) + 1.35, z: star3Z, isSkyStar: false },
{ id: 4, x: -18.5, y: getIslandGroundHeight(-18.5, -4.0) + 1.3, z: -4.0, isSkyStar: false },
{ id: 5, x: 24.5, y: getIslandGroundHeight(24.5, -13.0) + 2.4, z: -13.0, isSkyStar: false },
{ id: 6, x: 0, y: getIslandGroundHeight(0, -31.0) + 1.4, z: -31.0, isSkyStar: false },
{ id: 7, x: -4.5, y: 10.5, z: -14.0, isSkyStar: true },
{ id: 8, x: 4.5, y: 13.6, z: -28.0, isSkyStar: true },
{ id: 9, x: -2.0, y: 16.0, z: -42.0, isSkyStar: true },
];
}

export function createSunGems(worldId: WorldId = 1): SunGemDef[] {
if (worldId === 2) {
return [
{
id: 'marina',
name: 'Lámpara de Aceite Antigua',
artifactType: 'oil_lamp',
bibleVerse: 'Mateo 25:4 · Juan 1:5',
shortMeaning: 'La luz de Jesús brilla incluso en las cuevas más oscuras.',
colorHex: 0x3bf0ff,
x: -34.0,
y: 6.45,
z: -24.0,
cueId: 'w2_gem_marina',
},
{
id: 'esmeralda',
name: 'Rollos Antiguos de las Cuevas',
artifactType: 'scroll_jar',
bibleVerse: 'Isaías 40:8',
shortMeaning: 'La Palabra de Dios guardada a salvo en vasijas permanece para siempre.',
colorHex: 0xb67aff,
x: 34.0,
y: 14.8,
z: -22.0,
cueId: 'w2_gem_esmeralda',
},
{
id: 'celestial',
name: 'Piedra Angular y Roca Firme',
artifactType: 'cornerstone',
bibleVerse: 'Mateo 7:24 · 1 Pedro 2:6',
shortMeaning: 'Cristo es la Roca Firme sobre la que edificamos nuestra vida.',
colorHex: 0xffd24c,
x: 0.0,
y: 18.2,
z: -47.0,
cueId: 'w2_gem_celestial',
},
];
}

if (worldId === 3) {
return [
{
id: 'marina',
name: 'Vasija Dorada del Maná',
artifactType: 'manna',
bibleVerse: 'Éxodo 16:15 · Juan 6:35',
shortMeaning: 'El pan del cielo que representa a Jesús, el Pan de Vida.',
colorHex: 0xffb347,
x: DESERT_PYRAMID_CENTER.x,
y: 11.4,
z: DESERT_PYRAMID_CENTER.z,
cueId: 'w3_gem_marina',
},
{
id: 'esmeralda',
name: 'Cayado del Buen Pastor y Arpa',
artifactType: 'staff_harp',
bibleVerse: 'Juan 10:11 · Salmos 150:3',
shortMeaning: 'Jesús cuida de sus ovejas y nos invita a cantarle con alegría.',
colorHex: 0x5ae68b,
x: 36.0,
y: 14.3,
z: -28.0,
cueId: 'w3_gem_esmeralda',
},
{
id: 'celestial',
name: 'Cántaro de Agua Viva y Corona',
artifactType: 'water_crown',
bibleVerse: 'Juan 4:14 · Santiago 1:12',
shortMeaning: 'El Agua Viva del Espíritu y la Corona de Vida prometida por Jesús.',
colorHex: 0xffe066,
x: 0.0,
y: 19.2,
z: -48.0,
cueId: 'w3_gem_celestial',
},
];
}

// World 1 (Tropical Island)
return [
{
id: 'marina',
name: 'Candelero de Oro (Menorá)',
artifactType: 'menorah',
bibleVerse: 'Éxodo 25:31 · Juan 8:12',
shortMeaning: 'El candelero de siete lámparas que apunta a Jesús, la Luz del Mundo.',
colorHex: 0x2de2e6,
x: -27.5,
y: 3.9,
z: -19.5,
cueId: 'gem_marina',
},
{
id: 'esmeralda',
name: 'Santa Biblia y Pergamino',
artifactType: 'bible',
bibleVerse: 'Salmos 119:105',
shortMeaning: 'La Palabra de Dios: lámpara a nuestros pies y lumbrera a nuestro camino.',
colorHex: 0x43eb7b,
x: 31.0,
y: 12.6,
z: -29.0,
cueId: 'gem_esmeralda',
},
{
id: 'celestial',
name: 'Arca y Tablas del Amor',
artifactType: 'ark',
bibleVerse: 'Éxodo 25:10 · Mateo 22:37-39',
shortMeaning: 'Los Mandamientos y el gran llamado de Jesús: amar a Dios y al prójimo.',
colorHex: 0xffd24c,
x: 0.0,
y: 17.5,
z: -51.5,
cueId: 'gem_celestial',
},
];
}

export function createBouncyMushrooms(): BouncyMushroomDef[] {
return createWorldBouncePads(1);
}

export function createWorldBouncePads(worldId: WorldId = 1): BouncyMushroomDef[] {
if (worldId === 2) {
// Glowing Crystal Thermal Geysers leading up to the East Crystal Gallery (34, -22, y=13.4)
const spots: Array<{ x: number; z: number; bounceVy: number; capColor: number }> = [
{ x: 22.0, z: -6.0, bounceVy: 13.8, capColor: 0x3bf0ff },
{ x: 26.5, z: -10.5, bounceVy: 14.5, capColor: 0xb67aff },
{ x: 24.0, z: -16.5, bounceVy: 15.2, capColor: 0x3bf0ff },
{ x: 28.5, z: -21.0, bounceVy: 15.8, capColor: 0x52ffbb },
{ x: -14.0, z: 22.0, bounceVy: 12.8, capColor: 0xb67aff },
];
return spots.map((s, id) => ({
id,
x: s.x,
y: getCavernGroundHeight(s.x, s.z),
z: s.z,
radius: 1.7,
bounceVy: s.bounceVy,
capColor: s.capColor,
}));
}

if (worldId === 3) {
// Swirling Desert Whirlwind Updrafts leading up to East Red-Rock Mesa (36, -28, y=13.0)
const spots: Array<{ x: number; z: number; bounceVy: number; capColor: number }> = [
{ x: 20.5, z: -2.0, bounceVy: 13.8, capColor: 0xffc857 },
{ x: 24.5, z: -18.5, bounceVy: 14.6, capColor: 0xff9f43 },
{ x: 29.0, z: -22.5, bounceVy: 15.4, capColor: 0xffd24c },
{ x: 31.5, z: -26.0, bounceVy: 16.0, capColor: 0xffb142 },
{ x: -18.0, z: -6.0, bounceVy: 12.6, capColor: 0xffc857 },
];
return spots.map((s, id) => ({
id,
x: s.x,
y: getDesertGroundHeight(s.x, s.z),
z: s.z,
radius: 1.75,
bounceVy: s.bounceVy,
capColor: s.capColor,
}));
}

// World 1: Bouncy Jungle Mushrooms
const spots: Array<{ x: number; z: number; bounceVy: number; capColor: number }> = [
{ x: 24.0, z: -8.0, bounceVy: 13.8, capColor: 0xe8487a },
{ x: 27.6, z: -13.5, bounceVy: 14.4, capColor: 0xff7043 },
{ x: 24.4, z: -20.2, bounceVy: 15.0, capColor: 0xc94bd6 },
{ x: 27.8, z: -24.8, bounceVy: 15.8, capColor: 0xe8487a },
{ x: -13.5, z: 16.0, bounceVy: 12.6, capColor: 0xff7043 },
];

return spots.map((s, id) => ({
id,
x: s.x,
y: getNaturalTerrainHeight(s.x, s.z),
z: s.z,
radius: 1.55,
bounceVy: s.bounceVy,
capColor: s.capColor,
}));
}

export function createWindRings(): WindRingDef[] {
return createWorldWindRings(1);
}

export function createWorldWindRings(worldId: WorldId = 1): WindRingDef[] {
if (worldId === 2) {
return [
{ id: 0, x: -4.5, y: 12.2, z: -14.0, radius: 3.1 },
{ id: 1, x: 4.5, y: 15.2, z: -28.0, radius: 3.1 },
{ id: 2, x: -2.0, y: 17.5, z: -41.0, radius: 3.1 },
{ id: 3, x: 0.0, y: 18.2, z: -47.0, radius: 3.2 },
];
}

if (worldId === 3) {
return [
{ id: 0, x: -5.0, y: 13.0, z: -14.0, radius: 3.1 },
{ id: 1, x: 5.0, y: 16.0, z: -28.0, radius: 3.1 },
{ id: 2, x: 0.0, y: 18.6, z: -41.0, radius: 3.1 },
{ id: 3, x: 0.0, y: 19.2, z: -48.0, radius: 3.2 },
];
}

return [
{ id: 0, x: -4.5, y: 10.5, z: -14.0, radius: 3.0 },
{ id: 1, x: 4.5, y: 13.6, z: -28.0, radius: 3.0 },
{ id: 2, x: -2.0, y: 16.0, z: -42.0, radius: 3.0 },
{ id: 3, x: 0.0, y: 17.4, z: -49.5, radius: 3.1 },
];
}

export function createIslandNpcs(worldId: WorldId = 1): NpcDef[] {
if (worldId === 2) {
const defs: Array<Omit<NpcDef, 'y'>> = [
{
id: 'noe',
speakerId: 'MineroNoe',
name: 'Minero Noé',
role: 'Guardián de Antorchas',
x: -14.0,
z: -3.5,
yaw: 1.05,
cueId: 'npc_noe',
interactRadius: 5.4,
},
{
id: 'ester',
speakerId: 'Ester',
name: 'Arqueóloga Ester',
role: 'Buscadora de Rollos',
x: 16.5,
z: -3.0,
yaw: -0.9,
cueId: 'npc_ester',
interactRadius: 5.4,
},
{
id: 'samuel',
speakerId: 'Samuel',
name: 'Anciano Samuel',
role: 'Sabio del Santuario',
x: -5.2,
z: -31.5,
yaw: 0.45,
cueId: 'npc_samuel',
interactRadius: 5.6,
},
];
return defs.map((d) => ({
...d,
y: getCavernGroundHeight(d.x, d.z),
}));
}

if (worldId === 3) {
const defs: Array<Omit<NpcDef, 'y'>> = [
{
id: 'miriam',
speakerId: 'Miriam',
name: 'Guía Miriam',
role: 'Guía del Campamento',
x: -10.5,
z: 36.0,
yaw: 0.85,
cueId: 'npc_miriam',
interactRadius: 5.5,
},
{
id: 'david',
speakerId: 'David',
name: 'Pastor David',
role: 'Pastor del Oasis',
x: 17.5,
z: -5.5,
yaw: -0.95,
cueId: 'npc_david',
interactRadius: 5.5,
},
{
id: 'caleb',
speakerId: 'Caleb',
name: 'Anciano Caleb',
role: 'Guardián de Promesa',
x: -5.2,
z: -33.5,
yaw: 0.45,
cueId: 'npc_caleb',
interactRadius: 5.6,
},
];
return defs.map((d) => ({
...d,
y: getDesertGroundHeight(d.x, d.z),
}));
}

const defs: Array<Omit<NpcDef, 'y'>> = [
{
id: 'captain',
speakerId: 'CapitanCoral',
name: 'Capitán Coral',
role: 'Pirata Amigable',
x: -16.5,
z: -4.0,
yaw: 1.15,
cueId: 'npc_captain',
interactRadius: 5.2,
},
{
id: 'mateo',
speakerId: 'Mateo',
name: 'Explorador Mateo',
role: 'Guía de la Selva',
x: 19.5,
z: -5.5,
yaw: -0.9,
cueId: 'npc_mateo',
interactRadius: 5.2,
},
{
id: 'ixchel',
speakerId: 'Ixchel',
name: 'Sabia Ixchel',
role: 'Guardiana del Templo',
x: -4.6,
z: -33.8,
yaw: 0.45,
cueId: 'npc_ixchel',
interactRadius: 5.5,
},
];

return defs.map((d) => ({
...d,
y: getIslandGroundHeight(d.x, d.z),
}));
}

export function createInitialPlayerState(worldId: WorldId = 1): PlayerSimState {
const spawn = getWorldSpawnPos(worldId);
const spawnGround = getWorldGroundHeight(worldId, spawn.x, spawn.z);
return {
x: spawn.x,
y: spawnGround,
z: spawn.z,
vx: 0,
vy: 0,
vz: 0,
yaw: Math.PI,
grounded: true,
isFlying: false,
flightUnlocked: worldId > 1,
flightEnergy: 100,
walkDistance: 0,
starsCollected: [],
gemsCollected: [],
ringsPassed: [],
elapsedTime: 0,
won: false,
};
}

export function clampDt(rawDt: number): number {
if (!Number.isFinite(rawDt) || rawDt <= 0) return 0;
return Math.min(rawDt, 0.05);
}

export function checkStarCollection(
player: PlayerSimState,
stars: MagicStarDef[],
pickupRadius = 2.35,
): number[] {
const newlyCollected: number[] = [];
const playerCenterY = player.y + 0.85;
for (const star of stars) {
if (player.starsCollected.includes(star.id)) continue;
const dx = player.x - star.x;
const dy = playerCenterY - star.y;
const dz = player.z - star.z;
if (dx * dx + dy * dy + dz * dz <= pickupRadius * pickupRadius) {
player.starsCollected.push(star.id);
newlyCollected.push(star.id);
}
}
if (
!player.flightUnlocked &&
player.starsCollected.length >= STARS_TO_UNLOCK_FLIGHT
) {
player.flightUnlocked = true;
player.flightEnergy = 100;
}
return newlyCollected;
}

export function checkGemCollection(
player: PlayerSimState,
gems: SunGemDef[],
pickupRadius = 2.8,
): SunGemDef[] {
const collected: SunGemDef[] = [];
const playerCenterY = player.y + 0.9;
for (const gem of gems) {
if (player.gemsCollected.includes(gem.id)) continue;
const dx = player.x - gem.x;
const dy = playerCenterY - gem.y;
const dz = player.z - gem.z;
if (dx * dx + dy * dy + dz * dz <= pickupRadius * pickupRadius) {
player.gemsCollected.push(gem.id);
collected.push(gem);
}
}
return collected;
}

export function checkMushroomBounce(
player: PlayerSimState,
mushrooms: BouncyMushroomDef[],
): BouncyMushroomDef | null {
if (player.vy > 4.0) return null;
for (const m of mushrooms) {
const distXZ = Math.hypot(player.x - m.x, player.z - m.z);
const dy = player.y - m.y;
if (distXZ <= m.radius && dy >= -0.3 && dy <= 1.8) {
player.vy = m.bounceVy;
player.grounded = false;
return m;
}
}
return null;
}

export function checkWindRingPass(
player: PlayerSimState,
rings: WindRingDef[],
): WindRingDef | null {
const playerCenterY = player.y + 0.9;
for (const ring of rings) {
if (player.ringsPassed.includes(ring.id)) continue;
const dist = Math.hypot(
player.x - ring.x,
playerCenterY - ring.y,
player.z - ring.z,
);
if (dist <= ring.radius) {
player.ringsPassed.push(ring.id);
player.flightEnergy = 100;
player.vy = Math.max(player.vy, 3.2);
return ring;
}
}
return null;
}

export function findNearestNpc(
playerX: number,
playerY: number,
playerZ: number,
npcs: NpcDef[],
): NpcDef | null {
let best: NpcDef | null = null;
let bestDistSq = Infinity;
for (const npc of npcs) {
const dx = playerX - npc.x;
const dy = playerY - npc.y;
const dz = playerZ - npc.z;
const dSq = dx * dx + dy * dy + dz * dz;
if (dSq <= npc.interactRadius * npc.interactRadius && dSq < bestDistSq) {
bestDistSq = dSq;
best = npc;
}
}
return best;
}

export function isPortalAwakened(player: PlayerSimState): boolean {
return player.gemsCollected.length >= TOTAL_GEMS;
}

export function checkPortalVictory(
player: PlayerSimState,
portalPos: Vec3 = TEMPLE_PORTAL_POS,
): boolean {
if (player.won) return true;
if (!isPortalAwakened(player)) return false;
const dx = player.x - portalPos.x;
const dy = player.y + 0.8 - portalPos.y;
const dz = player.z - portalPos.z;
const distSq = dx * dx + dy * dy + dz * dz;
if (distSq <= PORTAL_TRIGGER_RADIUS * PORTAL_TRIGGER_RADIUS) {
player.won = true;
return true;
}
return false;
}

export function isNearLockedPortal(
player: PlayerSimState,
portalPos: Vec3 = TEMPLE_PORTAL_POS,
): boolean {
if (isPortalAwakened(player)) return false;
const dx = player.x - portalPos.x;
const dy = player.y + 0.8 - portalPos.y;
const dz = player.z - portalPos.z;
return dx * dx + dy * dy + dz * dz <= (PORTAL_TRIGGER_RADIUS + 1.8) ** 2;
}

export interface StepEvents {
jumped: boolean;
landed: boolean;
startedFlying: boolean;
collectedStars: number[];
collectedGems: SunGemDef[];
unlockedFlightNow: boolean;
bouncedMushroom: BouncyMushroomDef | null;
passedWindRing: WindRingDef | null;
portalReadyNow: boolean;
reachedPortal: boolean;
}

export function stepPlayerSimulation(
player: PlayerSimState,
input: InputSnapshot,
stars: MagicStarDef[],
rawDt: number,
groundHeightFn: (x: number, z: number) => number = getIslandGroundHeight,
gems: SunGemDef[] = [],
mushrooms: BouncyMushroomDef[] = [],
windRings: WindRingDef[] = [],
portalPos: Vec3 = TEMPLE_PORTAL_POS,
waterLevel: number = WATER_LEVEL,
maxFlightY = 32,
): StepEvents {
const dt = clampDt(rawDt);
const events: StepEvents = {
jumped: false,
landed: false,
startedFlying: false,
collectedStars: [],
collectedGems: [],
unlockedFlightNow: false,
bouncedMushroom: null,
passedWindRing: null,
portalReadyNow: false,
reachedPortal: false,
};

if (dt === 0 || player.won) return events;

player.elapsedTime += dt;

let moveForward = 0;
if (input.forward) moveForward += 1;
if (input.backward) moveForward -= 1;
if (typeof input.analogY === 'number' && Math.abs(input.analogY) > 0.05) {
moveForward += input.analogY;
}

let moveStrafe = 0;
if (input.right) moveStrafe += 1;
if (input.left) moveStrafe -= 1;
if (typeof input.analogX === 'number' && Math.abs(input.analogX) > 0.05) {
moveStrafe += input.analogX;
}

const moveMag = Math.min(1, Math.hypot(moveForward, moveStrafe));
const hasMoveInput = moveMag > 0.05;

const fwdX = -Math.sin(input.cameraYaw);
const fwdZ = -Math.cos(input.cameraYaw);
const rightX = Math.cos(input.cameraYaw);
const rightZ = -Math.sin(input.cameraYaw);

let wishX = fwdX * moveForward + rightX * moveStrafe;
let wishZ = fwdZ * moveForward + rightZ * moveStrafe;
const wishLen = Math.hypot(wishX, wishZ);
if (wishLen > 1e-4) {
wishX /= wishLen;
wishZ /= wishLen;
}

const wasFlightUnlocked = player.flightUnlocked;
const wasPortalReady = isPortalAwakened(player);

if (player.flightUnlocked) {
if (input.jumpOrAscend && player.flightEnergy > 5) {
if (!player.isFlying) {
player.isFlying = true;
player.grounded = false;
player.vy = Math.max(player.vy, 6.2);
events.startedFlying = true;
}
}
}

const walkSpeed = input.sprint ? 11.4 : 8.4;
const flySpeed = input.sprint ? 16.8 : 13.0;
const targetSpeed =
(player.isFlying ? flySpeed : walkSpeed) *
(hasMoveInput ? Math.max(0.35, moveMag) : 1);

const accel = player.isFlying ? 7.5 : player.grounded ? 14.0 : 6.5;
const targetVx = hasMoveInput ? wishX * targetSpeed : 0;
const targetVz = hasMoveInput ? wishZ * targetSpeed : 0;

const dampAlpha = 1 - Math.exp(-accel * dt);
player.vx += (targetVx - player.vx) * dampAlpha;
player.vz += (targetVz - player.vz) * dampAlpha;

if (hasMoveInput) {
const targetYaw = Math.atan2(wishX, wishZ);
let diff = targetYaw - player.yaw;
while (diff > Math.PI) diff -= Math.PI * 2;
while (diff < -Math.PI) diff += Math.PI * 2;
player.yaw += diff * (1 - Math.exp(-12 * dt));
}

if (player.isFlying) {
let targetVy = 0.25 * Math.sin(player.elapsedTime * 2.2);
if (input.jumpOrAscend && player.flightEnergy > 0) {
targetVy = 6.6;
player.flightEnergy = Math.max(0, player.flightEnergy - 7.5 * dt);
} else if (input.descend) {
targetVy = -7.2;
} else {
player.flightEnergy = Math.min(100, player.flightEnergy + 5.5 * dt);
}

if (player.flightEnergy <= 0.1) {
targetVy = -4.2;
}
player.vy += (targetVy - player.vy) * (1 - Math.exp(-6.0 * dt));
} else {
if (player.grounded && input.jumpOrAscend) {
player.vy = 8.8;
player.grounded = false;
events.jumped = true;
}
player.vy -= 21.0 * dt;
player.flightEnergy = Math.min(100, player.flightEnergy + 30 * dt);
}

const prevX = player.x;
const prevZ = player.z;
player.x += player.vx * dt;
player.y += player.vy * dt;
player.z += player.vz * dt;

const maxRadius = groundHeightFn === getCavernGroundHeight ? 62 : WORLD_PLAY_RADIUS;
const distFromCenter = Math.hypot(player.x, player.z);
if (distFromCenter > maxRadius) {
const scale = maxRadius / distFromCenter;
player.x *= scale;
player.z *= scale;
}

if (player.y > maxFlightY) {
player.y = maxFlightY;
if (player.vy > 0) player.vy = 0;
}

const groundH = groundHeightFn(player.x, player.z);
const floorLimit = Math.max(groundH, waterLevel + 0.12);

if (player.y <= floorLimit) {
const wasAirborne = !player.grounded;
player.y = floorLimit;
if (player.vy < -2.0 && wasAirborne) {
events.landed = true;
}
player.vy = 0;
player.grounded = true;
if (player.isFlying && !input.jumpOrAscend) {
player.isFlying = false;
}
} else if (player.y > floorLimit + 0.18) {
player.grounded = false;
}

if (!player.isFlying && groundH < waterLevel + 0.05) {
player.y = Math.max(player.y, waterLevel + 0.12);
}

if (player.grounded) {
player.walkDistance += Math.hypot(player.x - prevX, player.z - prevZ);
}

events.bouncedMushroom = checkMushroomBounce(player, mushrooms);
events.passedWindRing = checkWindRingPass(player, windRings);
events.collectedStars = checkStarCollection(player, stars);
events.collectedGems = checkGemCollection(player, gems);
events.unlockedFlightNow = !wasFlightUnlocked && player.flightUnlocked;
events.portalReadyNow = !wasPortalReady && isPortalAwakened(player);
events.reachedPortal = checkPortalVictory(player, portalPos);

return events;
}