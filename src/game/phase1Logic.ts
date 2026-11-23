export type GamePhaseState = 'title' | 'playing' | 'paused' | 'gameover';

export type WorldId = 1 | 2 | 3;

export type SunGemId = 'marina' | 'esmeralda' | 'celestial';

export type BiblicalArtifactType =
| 'menorah'
| 'bible'
| 'ark'
| 'jar'
| 'staff'
| 'manna'
| 'shield'
| 'harp'
| 'crown';

export interface Vec3 {
x: number;
y: number;
z: number;
}

export interface WorldThemeDef {
id: WorldId;
name: string;
subtitle: string;
bibleVerse: string;
introCueId: string;
skyZenithHex: number;
skyMidHex: number;
skyHorizonHex: number;
sunGlowHex: number;
waterDeepHex: number;
waterShallowHex: number;
waterFoamHex: number;
fogHex: number;
sandHex: number;
trailHex: number;
grassHex: number;
lushHex: number;
cliffHex: number;
foliageHex: number;
trunkHex: number;
}

export const WORLD_THEMES: Record<WorldId, WorldThemeDef> = {
1: {
id: 1,
name: 'Mundo 1 · Isla del Portal Dorado',
subtitle: 'El Jardín de la Creación y la Luz',
bibleVerse: 'Génesis 1:31 · "Y vio Dios todo lo que había hecho, y era bueno en gran manera."',
introCueId: 'intro_island',
skyZenithHex: 0x1664b8,
skyMidHex: 0x45a3de,
skyHorizonHex: 0xa6dcf5,
sunGlowHex: 0xffdca0,
waterDeepHex: 0x0a6289,
waterShallowHex: 0x21bdb8,
waterFoamHex: 0xeef9fc,
fogHex: 0xa6dcf5,
sandHex: 0xdab779,
trailHex: 0xa67c4e,
grassHex: 0x2a8234,
lushHex: 0x1a5b26,
cliffHex: 0x5a4d3f,
foliageHex: 0x267d30,
trunkHex: 0x6e4a2b,
},
2: {
id: 2,
name: 'Mundo 2 · Valle de los Cedros',
subtitle: 'El Oasis del Buen Pastor y el Río de Agua Viva',
bibleVerse: 'Salmos 23:1-2 · "Jehová es mi pastor; nada me faltará. Junto a aguas de reposo me pastoreará."',
introCueId: 'world2_intro',
skyZenithHex: 0x2c4b8e,
skyMidHex: 0xd67c49,
skyHorizonHex: 0xfad29d,
sunGlowHex: 0xffe49e,
waterDeepHex: 0x0c7489,
waterShallowHex: 0x38d6c4,
waterFoamHex: 0xf5fffd,
fogHex: 0xf4cfa0,
sandHex: 0xe6b875,
trailHex: 0xb87642,
grassHex: 0x5c9436,
lushHex: 0x3b6e23,
cliffHex: 0x8f5638,
foliageHex: 0x3f823d,
trunkHex: 0x5a3820,
},
3: {
id: 3,
name: 'Mundo 3 · Ciudadela Celestial de Sión',
subtitle: 'El Reino de la Alabanza, la Fe y la Luz Eterna',
bibleVerse: 'Salmos 150:6 · "Todo lo que respira alabe a Jehová."',
introCueId: 'world3_intro',
skyZenithHex: 0x293275,
skyMidHex: 0x6378c7,
skyHorizonHex: 0xffe6b8,
sunGlowHex: 0xfff3c4,
waterDeepHex: 0x3976b8,
waterShallowHex: 0x7fd8f7,
waterFoamHex: 0xffffff,
fogHex: 0xffe9c7,
sandHex: 0xf2e3c2,
trailHex: 0xd9b86c,
grassHex: 0x429e6d,
lushHex: 0x2b7553,
cliffHex: 0x8a8499,
foliageHex: 0xd9a830,
trunkHex: 0x8c7355,
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
id: 'captain' | 'mateo' | 'ixchel';
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
}

export const WATER_LEVEL = 0;
export const STARS_TO_UNLOCK_FLIGHT = 4;
export const TOTAL_STARS = 10;
export const TOTAL_GEMS = 3;
export const TOTAL_WORLDS = 3;
export const WORLD_PLAY_RADIUS = 102;
export const TERRAIN_SIZE = 240;
export const PORTAL_TRIGGER_RADIUS = 3.4;

export const SPAWN_POS: Vec3 = {
x: 0,
y: 3.3,
z: 48.0,
};

export const TEMPLE_PORTAL_POS: Vec3 = {
x: 0,
y: 10.6,
z: -62.5,
};

export const PIRATE_SHIP_ORIGIN: Vec3 = {
x: -35.0,
y: 0.2,
z: -15.5,
};

export const WATERFALL_POS: Vec3 = {
x: 31.0,
y: 0,
z: -19.5,
};

export const BRIDGE_BOUNDS = {
minX: -2.9,
maxX: 2.9,
minZ: -1.5,
maxZ: 8.5,
deckY: 3.25,
};

export const STEPPING_PILLARS: Array<{ x: number; z: number; topY: number; radius: number }> = [
{ x: -24.8, z: -8.2, topY: 1.55, radius: 1.45 },
{ x: -26.5, z: -12.0, topY: 1.95, radius: 1.4 },
{ x: -25.2, z: -15.6, topY: 2.35, radius: 1.4 },
{ x: -27.5, z: -19.5, topY: 2.75, radius: 1.75 },
];

function smoothstep(edge0: number, edge1: number, x: number): number {
const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
return a + (b - a) * t;
}

/**
* Center X of the curved jungle trail from spawn (z=50) to temple approach (z=-26).
*/
export function getTrailCenterX(z: number): number {
return Math.sin((50 - z) * 0.085) * 4.2 * smoothstep(-28, 48, z);
}

/**
* Base natural island elevation without artificial piers/bridges/pillars.
*/
export function getNaturalTerrainHeight(x: number, z: number): number {
const angle = Math.atan2(z, x - 4);
const coastVariation =
1.0 +
0.15 * Math.sin(angle * 3.0 + 0.5) +
0.11 * Math.cos(angle * 5.0 - 0.7) +
0.06 * Math.sin(angle * 7.0);

// Scenic western turquoise cove where the pirate ship floats
const coveDx = (x + 33) / 21.5;
const coveDz = (z + 14) / 23.0;
const coveDist = Math.sqrt(coveDx * coveDx + coveDz * coveDz);
const coveCut = (1.0 - smoothstep(0.4, 1.12, coveDist)) * 7.6;

// Gentle turquoise stream channel crossing under the wooden bridge around z = 3.5
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

// Rolling tropical hills
const rollingHills =
(Math.sin(x * 0.065 + 0.4) * Math.cos(z * 0.055 - 0.3) * 1.45 +
Math.sin((x + z) * 0.11) * 0.55) *
islandMask;
h += rollingHills;

// Raised southern explorer bluff around spawn (z = 32..56)
const bluffFactor = smoothstep(24, 42, z) * islandMask;
h += bluffFactor * 1.25;

// Eastern waterfall cliff ridge & mushroom terrace (x = 18..48, z = -40..-6)
const eastRidgeDist = Math.hypot((x - 33) / 20, (z + 22) / 22);
const eastRidgeMask = 1.0 - smoothstep(0.45, 1.05, eastRidgeDist);
h += eastRidgeMask * 9.8;

// Mushroom terrace shelf at (x: 31, z: -29) for Emerald Biblical Chest
const shelfDist = Math.hypot(x - 31, z + 29);
const shelfMask = 1.0 - smoothstep(3.2, 6.8, shelfDist);
h = lerp(h, 11.2, shelfMask * 0.88);

// Northern Grand Temple plateau (x around 0, z = -48..-74)
const templePlateauMask =
(1.0 - smoothstep(13, 25, Math.abs(x))) * smoothstep(-34, -56, z);
h = Math.max(h, lerp(oceanFloor, 10.2, templePlateauMask));

// Apply cove & stream cuts
h -= coveCut;
h -= streamCut;

// Smooth walkable coastal trail from z=52 down to z=-26 (excluding bridge gap)
if (z > -27 && z < 53) {
const trailX = getTrailCenterX(z);
const distFromTrail = Math.abs(x - trailX);
const trailBlend = (1.0 - smoothstep(2.5, 5.8, distFromTrail)) * (1.0 - streamMask * 0.85);
const trailTargetH =
3.15 +
Math.sin((50 - z) * 0.09) * 0.35 +
smoothstep(22, -20, z) * 0.35;
h = lerp(h, trailTargetH, trailBlend * 0.9);
}

// Grand ancient temple steps & courtyard (x in -9..9, z in -32..-68)
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
/**
 * * Collidable ground height including wooden bridge, pirate pier, and stone stepping pillars.
 */
 export function getIslandGroundHeight(x: number, z: number): number {
 let h = getNaturalTerrainHeight(x, z);

 // Walkable wooden bridge across the central lagoon stream
 if (
 x >= BRIDGE_BOUNDS.minX &&
 x <= BRIDGE_BOUNDS.maxX &&
 z >= BRIDGE_BOUNDS.minZ &&
 z <= BRIDGE_BOUNDS.maxZ
 ) {
 const t = (z - BRIDGE_BOUNDS.minZ) / (BRIDGE_BOUNDS.maxZ - BRIDGE_BOUNDS.minZ);
 const arch = Math.sin(t * Math.PI) * 0.55;
 h = Math.max(h, BRIDGE_BOUNDS.deckY + arch);
 }

 // Walkable wooden pirate dock in the western cove
 if (x >= -24.2 && x <= -13.5 && z >= -5.6 && z <= -2.4) {
 h = Math.max(h, 1.55);
 }

 // Walkable stone stepping pillars in the western cove leading to the First Biblical Chest
 for (const p of STEPPING_PILLARS) {
 const d = Math.hypot(x - p.x, z - p.z);
 if (d <= p.radius) {
 h = Math.max(h, p.topY);
 }
 }

 return h;
 }

 export function createInitialMagicStars(): MagicStarDef[] {
 const star0Z = 42.0;
 const star0X = getTrailCenterX(star0Z);

 const star1Z = 27.5;
 const star1X = getTrailCenterX(star1Z);

 const star2Z = 14.5;
 const star2X = getTrailCenterX(star2Z);

 const star3Z = 3.5; // Right over the wooden canyon bridge!
 const star3X = 0;

 return [
 // 4 introductory trail & bridge stars to unlock Flight Mode
 {
 id: 0,
 x: star0X,
 y: getIslandGroundHeight(star0X, star0Z) + 1.25,
 z: star0Z,
 isSkyStar: false,
 },
 {
 id: 1,
 x: star1X,
 y: getIslandGroundHeight(star1X, star1Z) + 1.3,
 z: star1Z,
 isSkyStar: false,
 },
 {
 id: 2,
 x: star2X,
 y: getIslandGroundHeight(star2X, star2Z) + 1.3,
 z: star2Z,
 isSkyStar: false,
 },
 {
 id: 3,
 x: star3X,
 y: getIslandGroundHeight(star3X, star3Z) + 1.35,
 z: star3Z,
 isSkyStar: false,
 },
 // Adventure zone ground/parkour stars
 {
 id: 4,
 x: -18.5,
 y: getIslandGroundHeight(-18.5, -4.0) + 1.3,
 z: -4.0,
 isSkyStar: false,
 },
 {
 id: 5,
 x: 24.5,
 y: getIslandGroundHeight(24.5, -13.0) + 2.4,
 z: -13.0,
 isSkyStar: false,
 },
 {
 id: 6,
 x: 0,
 y: getIslandGroundHeight(0, -31.0) + 1.4,
 z: -31.0,
 isSkyStar: false,
 },
 // Sky flight stars inside the Wind Ring arc
 {
 id: 7,
 x: -4.5,
 y: 10.5,
 z: -14.0,
 isSkyStar: true,
 },
 {
 id: 8,
 x: 4.5,
 y: 13.6,
 z: -28.0,
 isSkyStar: true,
 },
 {
 id: 9,
 x: -2.0,
 y: 16.0,
 z: -42.0,
 isSkyStar: true,
 },
 ];
 }

 /**
 * Creates the 3 Biblical Treasure Chests for the specified world (1, 2, or 3).
 */
 export function createSunGems(worldId: WorldId = 1): SunGemDef[] {
 if (worldId === 2) {
 return [
 {
 id: 'marina',
 name: 'Cántaro de Agua Viva',
 artifactType: 'jar',
 bibleVerse: 'Juan 4:14',
 shortMeaning: 'El Agua Viva de Jesús que refresca el corazón y da paz eterna.',
 colorHex: 0x38e2d4,
 x: -27.5,
 y: 3.9,
 z: -19.5,
 cueId: 'w2_gem_marina',
 },
 {
 id: 'esmeralda',
 name: 'Cayado del Buen Pastor',
 artifactType: 'staff',
 bibleVerse: 'Salmos 23:4 · Juan 10:11',
 shortMeaning: 'La vara con que Jesús, nuestro Buen Pastor, nos guía y protege.',
 colorHex: 0x76e85a,
 x: 31.0,
 y: 12.6,
 z: -29.0,
 cueId: 'w2_gem_esmeralda',
 },
 {
 id: 'celestial',
 name: 'Vasija Dorada del Maná',
 artifactType: 'manna',
 bibleVerse: 'Éxodo 16:15 · Juan 6:35',
 shortMeaning: 'El pan del cielo que representa a Jesús, el Pan de Vida.',
 colorHex: 0xffd24c,
 x: 0.0,
 y: 17.5,
 z: -51.5,
 cueId: 'w2_gem_celestial',
 },
 ];
 }

 if (worldId === 3) {
 return [
 {
 id: 'marina',
 name: 'Escudo de la Fe',
 artifactType: 'shield',
 bibleVerse: 'Efesios 6:16',
 shortMeaning: 'Parte de la Armadura de Dios para confiar siempre en Jesús.',
 colorHex: 0x5cc8ff,
 x: -27.5,
 y: 3.9,
 z: -19.5,
 cueId: 'w3_gem_marina',
 },
 {
 id: 'esmeralda',
 name: 'Arpa de Alabanza de David',
 artifactType: 'harp',
 bibleVerse: 'Salmos 150:3',
 shortMeaning: 'El arpa con que David cantaba salmos de gratitud y alegría a Dios.',
 colorHex: 0xff94d2,
 x: 31.0,
 y: 12.6,
 z: -29.0,
 cueId: 'w3_gem_esmeralda',
 },
 {
 id: 'celestial',
 name: 'Perla y Corona de Vida',
 artifactType: 'crown',
 bibleVerse: 'Mateo 13:45-46 · Santiago 1:12',
 shortMeaning: 'El Reino de los Cielos y la promesa de vida eterna en Jesús.',
 colorHex: 0xffe066,
 x: 0.0,
 y: 17.5,
 z: -51.5,
 cueId: 'w3_gem_celestial',
 },
 ];
 }

 // World 1 (Default): Isla del Portal Dorado
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
 return [
 { id: 0, x: -4.5, y: 10.5, z: -14.0, radius: 3.0 },
 { id: 1, x: 4.5, y: 13.6, z: -28.0, radius: 3.0 },
 { id: 2, x: -2.0, y: 16.0, z: -42.0, radius: 3.0 },
 { id: 3, x: 0.0, y: 17.4, z: -49.5, radius: 3.1 },
 ];
 }

 export function createIslandNpcs(worldId: WorldId = 1): NpcDef[] {
 const rolePrefix =
 worldId === 1
 ? ''
 : worldId === 2
 ? ' del Oasis'
 : ' de Sión';

 const defs: Array<Omit<NpcDef, 'y'>> = [
 {
 id: 'captain',
 name: 'Capitán Coral',
 role: `Guardián del Mar${rolePrefix}`,
 x: -16.5,
 z: -4.0,
 yaw: 1.15,
 cueId: 'npc_captain',
 interactRadius: 5.2,
 },
 {
 id: 'mateo',
 name: 'Explorador Mateo',
 role: `Guía de la Creación${rolePrefix}`,
 x: 19.5,
 z: -5.5,
 yaw: -0.9,
 cueId: 'npc_mateo',
 interactRadius: 5.2,
 },
 {
 id: 'ixchel',
 name: 'Sabia Ixchel',
 role: `Guardiana del Santuario${rolePrefix}`,
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
 export function createInitialPlayerState(): PlayerSimState {
  const spawnGround = getIslandGroundHeight(SPAWN_POS.x, SPAWN_POS.z);
  return {
  x: SPAWN_POS.x,
  y: spawnGround,
  z: SPAWN_POS.z,
  vx: 0,
  vy: 0,
  vz: 0,
  yaw: Math.PI, // Facing -Z toward the island vista
  grounded: true,
  isFlying: false,
  flightUnlocked: false,
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

  export function checkPortalVictory(player: PlayerSimState): boolean {
  if (player.won) return true;
  if (!isPortalAwakened(player)) return false;
  const dx = player.x - TEMPLE_PORTAL_POS.x;
  const dy = player.y + 0.8 - TEMPLE_PORTAL_POS.y;
  const dz = player.z - TEMPLE_PORTAL_POS.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  if (distSq <= PORTAL_TRIGGER_RADIUS * PORTAL_TRIGGER_RADIUS) {
  player.won = true;
  return true;
  }
  return false;
  }

  export function isNearLockedPortal(player: PlayerSimState): boolean {
  if (isPortalAwakened(player)) return false;
  const dx = player.x - TEMPLE_PORTAL_POS.x;
  const dy = player.y + 0.8 - TEMPLE_PORTAL_POS.y;
  const dz = player.z - TEMPLE_PORTAL_POS.z;
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

  let moveStrafe = 0;
  if (input.right) moveStrafe += 1;
  if (input.left) moveStrafe -= 1;

  const hasMoveInput = moveForward !== 0 || moveStrafe !== 0;

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
  const targetSpeed = player.isFlying ? flySpeed : walkSpeed;

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

  // Keep player within expanded tropical bay boundary
  const distFromCenter = Math.hypot(player.x, player.z);
  if (distFromCenter > WORLD_PLAY_RADIUS) {
  const scale = WORLD_PLAY_RADIUS / distFromCenter;
  player.x *= scale;
  player.z *= scale;
  }

  if (player.y > 32) {
  player.y = 32;
  if (player.vy > 0) player.vy = 0;
  }

  const groundH = groundHeightFn(player.x, player.z);
  const floorLimit = Math.max(groundH, WATER_LEVEL + 0.12);

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

  if (!player.isFlying && groundH < WATER_LEVEL + 0.05) {
  player.y = Math.max(player.y, WATER_LEVEL + 0.12);
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
  events.reachedPortal = checkPortalVictory(player);

  return events;
  }
 