import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
BRIDGE_BOUNDS,
STEPPING_PILLARS,
TEMPLE_PORTAL_POS,
TERRAIN_SIZE,
WATERFALL_POS,
WORLD_THEMES,
getIslandGroundHeight,
getTrailCenterX,
type BiblicalArtifactType,
type BouncyMushroomDef,
type MagicStarDef,
type NpcDef,
type SunGemDef,
type SunGemId,
type WindRingDef,
type WorldId,
} from '../phase1Logic';
import {
createPortalMaterial,
createWaterfallMaterial,
} from '../shaders';
import {
createSparkleTexture,
createTempleStoneTextures,
createTerrainDetailBump,
createWoodPlankTextures,
} from '../textures';

export interface StarVisual {
id: number;
group: THREE.Group;
starMesh: THREE.Mesh;
ringMesh: THREE.Mesh;
beamMesh: THREE.Mesh;
baseY: number;
collected: boolean;
}

export interface BiblicalChestVisual {
id: SunGemId;
def: SunGemDef;
group: THREE.Group;
lidPivot: THREE.Group;
artifactGroup: THREE.Group;
ringMesh: THREE.Mesh;
beamMesh: THREE.Mesh;
baseY: number;
collected: boolean;
openProgress: number;
}

export interface MushroomVisual {
id: number;
group: THREE.Group;
capGroup: THREE.Group;
baseY: number;
bounceAnim: number;
}

export interface WindRingVisual {
id: number;
group: THREE.Group;
outerRing: THREE.Mesh;
innerRing: THREE.Mesh;
passed: boolean;
}

export interface NpcVisual {
id: NpcDef['id'];
def: NpcDef;
group: THREE.Group;
rightArmPivot: THREE.Group;
markerMesh: THREE.Mesh;
baseY: number;
}

export interface AnimalVisual {
kind: 'dolphin' | 'crab' | 'bird' | 'lamb';
group: THREE.Group;
leftWingOrFin?: THREE.Object3D;
rightWingOrFin?: THREE.Object3D;
originX: number;
originY: number;
originZ: number;
phase: number;
radius: number;
speed: number;
}

export interface SparkleParticlePool {
points: THREE.Points;
emit: (x: number, y: number, z: number, count: number, spread: number, speedY: number) => void;
update: (dt: number) => void;
}

export interface IslandWorldResult {
worldGroup: THREE.Group;
terrainMesh: THREE.Mesh;
portalMaterial: THREE.ShaderMaterial;
waterfallMaterial: THREE.ShaderMaterial;
portalLight: THREE.PointLight;
starVisuals: StarVisual[];
chestVisuals: BiblicalChestVisual[];
mushroomVisuals: MushroomVisual[];
windRingVisuals: WindRingVisual[];
npcVisuals: NpcVisual[];
animalVisuals: AnimalVisual[];
palmCrowns: THREE.Group[];
clouds: THREE.Group[];
sparkles: SparkleParticlePool;
rebuildForWorld: (worldId: WorldId, gemsDef: SunGemDef[], npcsDef: NpcDef[]) => void;
}

function seededRand(seed: number): number {
const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
return s - Math.floor(s);
}

function createStarShape(outerR = 0.52, innerR = 0.23, points = 5): THREE.Shape {
const shape = new THREE.Shape();
for (let i = 0; i < points * 2; i++) {
const r = i % 2 === 0 ? outerR : innerR;
const angle = (i * Math.PI) / points - Math.PI / 2;
const x = Math.cos(angle) * r;
const y = Math.sin(angle) * r;
if (i === 0) shape.moveTo(x, y);
else shape.lineTo(x, y);
}
shape.closePath();
return shape;
}

function createSparklePool(maxParticles: number): SparkleParticlePool {
const positions = new Float32Array(maxParticles * 3);
const colors = new Float32Array(maxParticles * 3);
const velocities = new Float32Array(maxParticles * 3);
const ages = new Float32Array(maxParticles);
const lifetimes = new Float32Array(maxParticles);

for (let i = 0; i < maxParticles; i++) {
ages[i] = 999;
lifetimes[i] = 1;
positions[i * 3 + 1] = -999;
}

const geo = new THREE.BufferGeometry();
const posAttr = new THREE.BufferAttribute(positions, 3);
posAttr.setUsage(THREE.DynamicDrawUsage);
const colAttr = new THREE.BufferAttribute(colors, 3);
colAttr.setUsage(THREE.DynamicDrawUsage);

geo.setAttribute('position', posAttr);
geo.setAttribute('color', colAttr);

const mat = new THREE.PointsMaterial({
size: 0.34,
map: createSparkleTexture(),
vertexColors: true,
transparent: true,
opacity: 0.95,
blending: THREE.AdditiveBlending,
depthWrite: false,
sizeAttenuation: true,
});

const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
let cursor = 0;

function emit(
x: number,
y: number,
z: number,
count: number,
spread: number,
speedY: number,
): void {
for (let i = 0; i < count; i++) {
const idx = cursor;
cursor = (cursor + 1) % maxParticles;

const i3 = idx * 3;
positions[i3] = x + (Math.random() - 0.5) * spread;
positions[i3 + 1] = y + (Math.random() - 0.5) * spread * 0.7;
positions[i3 + 2] = z + (Math.random() - 0.5) * spread;

velocities[i3] = (Math.random() - 0.5) * 1.4;
velocities[i3 + 1] = speedY + Math.random() * 0.9;
velocities[i3 + 2] = (Math.random() - 0.5) * 1.4;

ages[idx] = 0;
lifetimes[idx] = 0.65 + Math.random() * 0.7;

const warm = 0.75 + Math.random() * 0.25;
colors[i3] = 1.0;
colors[i3 + 1] = 0.85 * warm + 0.15;
colors[i3 + 2] = 0.35 + Math.random() * 0.45;
}
}

function update(dt: number): void {
for (let i = 0; i < maxParticles; i++) {
const i3 = i * 3;
if (ages[i] >= lifetimes[i]) {
positions[i3 + 1] = -999;
continue;
}
ages[i] += dt;
const lifeRatio = 1 - Math.min(1, ages[i] / lifetimes[i]);

positions[i3] += velocities[i3] * dt;
positions[i3 + 1] += velocities[i3 + 1] * dt;
positions[i3 + 2] += velocities[i3 + 2] * dt;

velocities[i3] *= 0.98;
velocities[i3 + 1] *= 0.98;
velocities[i3 + 2] *= 0.98;

colors[i3] = lifeRatio;
colors[i3 + 1] = 0.85 * lifeRatio;
colors[i3 + 2] = 0.35 * lifeRatio;
}
posAttr.needsUpdate = true;
colAttr.needsUpdate = true;
}

return { points, emit, update };
}

function createCarvedGuardianHead(stoneMat: THREE.Material, mossMat: THREE.Material): THREE.Group {
const head = new THREE.Group();

const block = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.85, 1.35), stoneMat);
block.position.y = 0.92;
block.castShadow = true;
block.receiveShadow = true;
head.add(block);

const brow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.42), stoneMat);
brow.position.set(0, 1.48, 0.05);
brow.castShadow = true;
head.add(brow);

const crown = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.38, 1.15), mossMat);
crown.position.set(0, 1.98, 0);
head.add(crown);

for (const s of [-0.34, 0.34]) {
const eyeSocket = new THREE.Mesh(
new THREE.CylinderGeometry(0.16, 0.16, 0.14, 10),
stoneMat,
);
eyeSocket.rotation.x = Math.PI / 2;
eyeSocket.position.set(s, 1.14, 0.68);
head.add(eyeSocket);
}

const nose = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, 0.24), stoneMat);
nose.position.set(0, 0.92, 0.72);
head.add(nose);

const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.14), stoneMat);
mouth.position.set(0, 0.5, 0.67);
head.add(mouth);

return head;
}
/**
 * * Sculpted 3D Biblical Artifact inside/above each Treasure Chest!
 */
 function createBiblicalArtifactMesh(artifactType: BiblicalArtifactType): THREE.Group {
 const g = new THREE.Group();

 const goldMat = new THREE.MeshStandardMaterial({
 color: 0xffd54f,
 emissive: 0xd98200,
 emissiveIntensity: 0.45,
 roughness: 0.22,
 metalness: 0.85,
 });
 const flameMat = new THREE.MeshBasicMaterial({
 color: 0xfff3b0,
 });
 const leatherMat = new THREE.MeshStandardMaterial({
 color: 0x6d2c1b,
 roughness: 0.55,
 });
 const pageMat = new THREE.MeshStandardMaterial({
 color: 0xfff8e7,
 roughness: 0.75,
 });
 const crystalMat = new THREE.MeshStandardMaterial({
 color: 0x38e2d4,
 emissive: 0x1ba89c,
 emissiveIntensity: 0.5,
 roughness: 0.18,
 });

 if (artifactType === 'menorah') {
 // 7-Branch Golden Lampstand (El Candelero de Oro / Menorá)
 const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.12, 14), goldMat);
 g.add(base);
 const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.78, 12), goldMat);
 stem.position.y = 0.42;
 g.add(stem);

 // 3 pairs of curved semi-circular branches
 for (const r of [0.22, 0.36, 0.5]) {
 const branch = new THREE.Mesh(
 new THREE.TorusGeometry(r, 0.036, 8, 20, Math.PI),
 goldMat,
 );
 branch.rotation.z = Math.PI;
 branch.position.y = 0.78;
 g.add(branch);
 }

 // 7 glowing oil lamp flames across the top
 const xs = [-0.5, -0.36, -0.22, 0, 0.22, 0.36, 0.5];
 for (const lx of xs) {
 const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.07, 8), goldMat);
 cup.position.set(lx, 0.81, 0);
 g.add(cup);
 const flame = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.13, 8), flameMat);
 flame.position.set(lx, 0.9, 0);
 g.add(flame);
 }
 } else if (artifactType === 'bible') {
 // Open Holy Bible with Golden Cross & Scroll
 for (const s of [-1, 1]) {
 const cover = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.56), leatherMat);
 cover.position.set(s * 0.2, 0.25, 0);
 cover.rotation.z = s * -0.18;
 g.add(cover);

 const page = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 0.51), pageMat);
 page.position.set(s * 0.19, 0.29, 0);
 page.rotation.z = s * -0.18;
 g.add(page);
 }
 // Floating Golden Cross above the open Bible
 const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.06), goldMat);
 vBar.position.set(0, 0.62, 0);
 g.add(vBar);
 const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), goldMat);
 hBar.position.set(0, 0.68, 0);
 g.add(hBar);
 } else if (artifactType === 'ark') {
 // Golden Ark of the Covenant & Stone Tablets of Love
 const arkBox = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.44), goldMat);
 arkBox.position.y = 0.25;
 g.add(arkBox);
 // Twin stone tablets with rounded tops above the mercy seat
 for (const s of [-0.15, 0.15]) {
 const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.07), crystalMat);
 tablet.position.set(s, 0.62, 0);
 g.add(tablet);
 }
 } else if (artifactType === 'jar') {
 // Jar of Living Water (Cántaro de Agua Viva)
 const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), goldMat);
 body.scale.set(1, 1.25, 1);
 body.position.y = 0.35;
 g.add(body);
 const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.22, 12), goldMat);
 neck.position.y = 0.68;
 g.add(neck);
 const waterDrop = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), crystalMat);
 waterDrop.position.y = 0.94;
 g.add(waterDrop);
 } else if (artifactType === 'staff') {
 // Shepherd's Staff (Cayado del Buen Pastor)
 const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.85, 10), goldMat);
 pole.position.y = 0.44;
 g.add(pole);
 const crook = new THREE.Mesh(
 new THREE.TorusGeometry(0.18, 0.045, 8, 18, Math.PI * 1.35),
 goldMat,
 );
 crook.position.set(0.14, 0.85, 0);
 g.add(crook);
 } else if (artifactType === 'manna') {
 // Golden Vessel of Manna from Heaven
 const chalice = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 0.42, 14), goldMat);
 chalice.position.y = 0.34;
 g.add(chalice);
 const bread = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), flameMat);
 bread.scale.set(1.1, 0.75, 1.1);
 bread.position.y = 0.58;
 g.add(bread);
 } else if (artifactType === 'shield') {
 // Shield of Faith with Cross
 const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.1, 6), crystalMat);
 shield.rotation.x = Math.PI / 2;
 shield.position.y = 0.48;
 g.add(shield);
 const vCross = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.13), goldMat);
 vCross.position.y = 0.48;
 g.add(vCross);
 const hCross = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.09, 0.13), goldMat);
 hCross.position.y = 0.54;
 g.add(hCross);
 } else if (artifactType === 'harp') {
 // David's Golden Harp
 const frame = new THREE.Mesh(
 new THREE.TorusGeometry(0.32, 0.05, 8, 20, Math.PI * 1.35),
 goldMat,
 );
 frame.position.y = 0.46;
 g.add(frame);
 for (let s = -2; s <= 2; s++) {
 const str = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.48, 6), flameMat);
 str.position.set(s * 0.075, 0.46, 0);
 g.add(str);
 }
 } else {
 // Crown of Life & Pearl of Great Price
 const crownRing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.24, 12), goldMat);
 crownRing.position.y = 0.32;
 g.add(crownRing);
 const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), flameMat);
 pearl.position.y = 0.62;
 g.add(pearl);
 }

 return g;
 }

 function createBiblicalTreasureChest(
 def: SunGemDef,
 woodMat: THREE.Material,
 ): BiblicalChestVisual {
 const group = new THREE.Group();
 group.position.set(def.x, def.y - 0.65, def.z);

 const goldTrimMat = new THREE.MeshStandardMaterial({
 color: 0xffcf40,
 emissive: 0xb86e00,
 emissiveIntensity: 0.35,
 roughness: 0.25,
 metalness: 0.85,
 });

 // Chest Base Box
 const baseBox = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.68, 0.86), woodMat);
 baseBox.position.y = 0.34;
 baseBox.castShadow = true;
 baseBox.receiveShadow = true;
 group.add(baseBox);

 // Golden straps & front lock plate
 for (const sx of [-0.42, 0.42]) {
 const strap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.7, 0.9), goldTrimMat);
 strap.position.set(sx, 0.34, 0);
 group.add(strap);
 }
 const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.08), goldTrimMat);
 lockPlate.position.set(0, 0.52, 0.44);
 group.add(lockPlate);

 // Hinged Chest Lid Pivot (partially open even before pickup so the golden glow shines out!)
 const lidPivot = new THREE.Group();
 lidPivot.position.set(0, 0.68, -0.42);
 lidPivot.rotation.x = -0.35;

 const lidVault = new THREE.Mesh(
 new THREE.CylinderGeometry(0.43, 0.43, 1.25, 12, 1, false, 0, Math.PI),
 woodMat,
 );
 lidVault.rotation.z = Math.PI / 2;
 lidVault.position.set(0, 0, 0.42);
 lidVault.castShadow = true;
 lidPivot.add(lidVault);

 for (const sx of [-0.42, 0.42]) {
 const lidStrap = new THREE.Mesh(
 new THREE.CylinderGeometry(0.45, 0.45, 0.11, 12, 1, false, 0, Math.PI),
 goldTrimMat,
 );
 lidStrap.rotation.z = Math.PI / 2;
 lidStrap.position.set(sx, 0, 0.42);
 lidPivot.add(lidStrap);
 }
 group.add(lidPivot);

 // 3D Biblical Artifact floating above the chest
 const artifactGroup = createBiblicalArtifactMesh(def.artifactType);
 artifactGroup.position.set(0, 0.88, 0);
 artifactGroup.scale.setScalar(1.25);
 group.add(artifactGroup);

 const ringMesh = new THREE.Mesh(
 new THREE.TorusGeometry(1.25, 0.048, 8, 28),
 new THREE.MeshBasicMaterial({
 color: def.colorHex,
 transparent: true,
 opacity: 0.82,
 side: THREE.DoubleSide,
 }),
 );
 ringMesh.rotation.x = Math.PI * 0.5;
 ringMesh.position.y = 0.25;
 group.add(ringMesh);

 const beamMesh = new THREE.Mesh(
 new THREE.CylinderGeometry(0.42, 0.95, 6.5, 14, 1, true),
 new THREE.MeshBasicMaterial({
 color: def.colorHex,
 transparent: true,
 opacity: 0.16,
 blending: THREE.AdditiveBlending,
 depthWrite: false,
 side: THREE.DoubleSide,
 }),
 );
 beamMesh.position.y = 3.2;
 group.add(beamMesh);

 return {
 id: def.id,
 def,
 group,
 lidPivot,
 artifactGroup,
 ringMesh,
 beamMesh,
 baseY: def.y - 0.65,
 collected: false,
 openProgress: 0,
 };
 }

 function createFriendlyNpcMesh(def: NpcDef): NpcVisual {
 const group = new THREE.Group();
 group.position.set(def.x, def.y, def.z);
 group.rotation.y = def.yaw;

 const skinMat = new THREE.MeshStandardMaterial({ color: 0xe8b48a, roughness: 0.65 });
 const robeColor =
 def.id === 'captain'
 ? 0xb8292f
 : def.id === 'mateo'
 ? 0x2a7b4c
 : 0xf2e3b6;
 const trimColor =
 def.id === 'captain'
 ? 0xffcf40
 : def.id === 'mateo'
 ? 0xd98a36
 : 0x38b6c4;

 const tunicMat = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.78 });
 const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.45 });
 const bootMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.7 });

 // Boots & Legs
 for (const s of [-0.12, 0.12]) {
 const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.55, 10), bootMat);
 leg.position.set(s, 0.275, 0);
 leg.castShadow = true;
 group.add(leg);
 }

 // Torso / Robe
 const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.72, 14), tunicMat);
 torso.position.y = 0.82;
 torso.castShadow = true;
 group.add(torso);

 const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.09, 14), trimMat);
 belt.position.y = 0.72;
 group.add(belt);

 // Head
 const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), skinMat);
 head.position.y = 1.38;
 head.castShadow = true;
 group.add(head);

 // Role Hat / Crown
 if (def.id === 'captain') {
 const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.12, 3), bootMat);
 hat.position.y = 1.56;
 group.add(hat);
 } else if (def.id === 'mateo') {
 const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 16), trimMat);
 hat.position.y = 1.54;
 group.add(hat);
 } else {
 const circlet = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 8, 18), trimMat);
 circlet.rotation.x = Math.PI / 2;
 circlet.position.y = 1.5;
 group.add(circlet);
 }

 // Left arm & waving Right arm
 const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.32, 6, 8), tunicMat);
 leftArm.position.set(-0.26, 0.92, 0);
 leftArm.rotation.z = 0.22;
 group.add(leftArm);

 const rightArmPivot = new THREE.Group();
 rightArmPivot.position.set(0.24, 1.08, 0);
 const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.32, 6, 8), tunicMat);
 rightArm.position.set(0.06, 0.14, 0);
 rightArmPivot.add(rightArm);
 group.add(rightArmPivot);

 // Floating Golden Interaction Jewel above NPC head
 const markerMesh = new THREE.Mesh(
 new THREE.OctahedronGeometry(0.22, 0),
 new THREE.MeshStandardMaterial({
 color: 0xffe066,
 emissive: 0xff9d00,
 emissiveIntensity: 0.75,
 roughness: 0.2,
 }),
 );
 markerMesh.position.y = 2.05;
 group.add(markerMesh);

 return {
 id: def.id,
 def,
 group,
 rightArmPivot,
 markerMesh,
 baseY: def.y,
 };
 }
 function buildIslandAnimals(worldGroup: THREE.Group): AnimalVisual[] {
  const animals: AnimalVisual[] = [];

  // 1. Jumping Turquoise Bay Dolphins
  const dolphinMat = new THREE.MeshStandardMaterial({
  color: 0x4ba3d9,
  roughness: 0.32,
  metalness: 0.1,
  });
  const dolphinSpots: Array<[number, number, number]> = [
  [-46, -24, 0],
  [-22, -38, 2.1],
  [42, 18, 4.2],
  ];
  for (const [dx, dz, phase] of dolphinSpots) {
  const dg = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 1.05, 8, 12), dolphinMat);
  body.rotation.x = Math.PI / 2;
  dg.add(body);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 6), dolphinMat);
  fin.position.set(0, 0.32, -0.1);
  fin.rotation.x = -0.35;
  dg.add(fin);
  dg.position.set(dx, -0.2, dz);
  worldGroup.add(dg);
  animals.push({
  kind: 'dolphin',
  group: dg,
  originX: dx,
  originY: -0.2,
  originZ: dz,
  phase,
  radius: 4.5,
  speed: 1.5,
  });
  }

  // 2. Scurrying Red Beach Crabs
  const crabMat = new THREE.MeshStandardMaterial({ color: 0xe63b2e, roughness: 0.55 });
  const crabSpots: Array<[number, number]> = [
  [-16, -1.8],
  [-19, 3.2],
  [12, 34],
  [-8, 38],
  ];
  crabSpots.forEach(([cx, cz], idx) => {
  const cg = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), crabMat);
  shell.scale.set(1.3, 0.55, 1.0);
  shell.position.y = 0.16;
  cg.add(shell);
  const cy = getIslandGroundHeight(cx, cz);
  cg.position.set(cx, cy, cz);
  worldGroup.add(cg);
  animals.push({
  kind: 'crab',
  group: cg,
  originX: cx,
  originY: cy,
  originZ: cz,
  phase: idx * 1.7,
  radius: 1.6,
  speed: 2.8,
  });
  });

  // 3. Grazing White Lambs / Sheep on the Meadows (Biblical Good Shepherd theme!)
  const woolMat = new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.9 });
  const lambFaceMat = new THREE.MeshStandardMaterial({ color: 0x3b2d26, roughness: 0.7 });
  const lambSpots: Array<[number, number]> = [
  [-9.5, 28.0],
  [8.5, 24.5],
  [-11.0, 11.0],
  [12.5, -14.0],
  [-8.5, -26.5],
  ];
  lambSpots.forEach(([lx, lz], idx) => {
  const lg = new THREE.Group();
  const wool = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), woolMat);
  wool.scale.set(1.0, 0.9, 1.35);
  wool.position.y = 0.46;
  wool.castShadow = true;
  lg.add(wool);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), lambFaceMat);
  head.position.set(0, 0.64, 0.44);
  lg.add(head);

  const crownWool = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), woolMat);
  crownWool.position.set(0, 0.78, 0.4);
  lg.add(crownWool);

  for (const sx of [-0.15, 0.15]) {
  for (const sz of [-0.24, 0.24]) {
  const leg = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.045, 0.36, 8),
  lambFaceMat,
  );
  leg.position.set(sx, 0.18, sz);
  lg.add(leg);
  }
  }

  const ly = getIslandGroundHeight(lx, lz);
  lg.position.set(lx, ly, lz);
  worldGroup.add(lg);
  animals.push({
  kind: 'lamb',
  group: lg,
  originX: lx,
  originY: ly,
  originZ: lz,
  phase: idx * 1.3,
  radius: 1.4,
  speed: 0.85,
  });
  });

  // 4. Soaring Doves / Tropical Birds around the Waterfall & Temple
  const doveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.4 });
  const birdSpots: Array<[number, number, number, number]> = [
  [26, 13.5, -18, 6.5],
  [-18, 11.0, -14, 7.0],
  [0, 16.5, -46, 8.0],
  [8, 9.5, 16, 6.0],
  ];
  birdSpots.forEach(([bx, by, bz, rad], idx) => {
  const bg = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.28, 6, 8), doveMat);
  torso.rotation.x = Math.PI / 2;
  bg.add(torso);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.z = 0.25;
  bg.add(beak);

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.22), doveMat);
  leftWing.position.set(-0.24, 0.04, 0);
  bg.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.22), doveMat);
  rightWing.position.set(0.24, 0.04, 0);
  bg.add(rightWing);

  bg.position.set(bx, by, bz);
  worldGroup.add(bg);
  animals.push({
  kind: 'bird',
  group: bg,
  leftWingOrFin: leftWing,
  rightWingOrFin: rightWing,
  originX: bx,
  originY: by,
  originZ: bz,
  phase: idx * 1.6,
  radius: rad,
  speed: 0.95,
  });
  });

  return animals;
  }

  export function buildIslandWorld(
  starsDef: MagicStarDef[],
  maxAniso: number,
  gemsDef: SunGemDef[] = [],
  mushroomsDef: BouncyMushroomDef[] = [],
  windRingsDef: WindRingDef[] = [],
  npcsDef: NpcDef[] = [],
  ): IslandWorldResult {
  const worldGroup = new THREE.Group();

  // 1. Sculpted Expanded 240x240 Vertex-Colored Island Terrain + Micro-Relief Bump
  const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 148, 148);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  const y = getIslandGroundHeight(x, z);
  posAttr.setY(i, y);
  }
  terrainGeo.computeVertexNormals();
  const normAttr = terrainGeo.attributes.normal as THREE.BufferAttribute;
  const colorAttr = new THREE.BufferAttribute(colors, 3);
  terrainGeo.setAttribute('color', colorAttr);

  const frondMat = new THREE.MeshStandardMaterial({
  color: 0x267d30,
  roughness: 0.65,
  side: THREE.DoubleSide,
  });
  const trunkMat = new THREE.MeshStandardMaterial({
  color: 0x6e4a2b,
  roughness: 0.9,
  });

  function applyTerrainTheme(worldId: WorldId): void {
  const theme = WORLD_THEMES[worldId];
  const sandCol = new THREE.Color(theme.sandHex);
  const trailCol = new THREE.Color(theme.trailHex);
  const grassCol = new THREE.Color(theme.grassHex);
  const lushCol = new THREE.Color(theme.lushHex);
  const cliffCol = new THREE.Color(theme.cliffHex);
  const tmpCol = new THREE.Color();

  for (let i = 0; i < count; i++) {
  const x = posAttr.getX(i);
  const y = posAttr.getY(i);
  const z = posAttr.getZ(i);
  const ny = normAttr.getY(i);
  const hillMix = THREE.MathUtils.clamp((y - 2.0) / 8.0, 0, 1);

  if (y < 0.85) {
  tmpCol.copy(sandCol);
  } else if (ny < 0.82) {
  tmpCol.copy(cliffCol).lerp(lushCol, Math.max(0, (ny - 0.55) * 1.3));
  } else {
  tmpCol.copy(grassCol).lerp(lushCol, hillMix * 0.65);

  if (z > -28 && z < 52) {
  const distTrail = Math.abs(x - getTrailCenterX(z));
  const trailMask = 1 - THREE.MathUtils.smoothstep(distTrail, 1.5, 3.6);
  tmpCol.lerp(trailCol, trailMask * 0.92);
  }

  if (Math.abs(x) < 9.5 && z < -30 && z > -70) {
  tmpCol.lerp(new THREE.Color(0x9a896d), 0.76);
  }
  }

  colors[i * 3] = tmpCol.r;
  colors[i * 3 + 1] = tmpCol.g;
  colors[i * 3 + 2] = tmpCol.b;
  }
  colorAttr.needsUpdate = true;
  frondMat.color.setHex(theme.foliageHex);
  trunkMat.color.setHex(theme.trunkHex);
  }

  applyTerrainTheme(1);

  const terrainMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  bumpMap: createTerrainDetailBump(maxAniso),
  bumpScale: 0.16,
  roughness: 0.9,
  metalness: 0.02,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  // 2. Wooden Canyon Bridge, Pirate Cove Pier & Stone Stepping Pillars
  const woodTex = createWoodPlankTextures(maxAniso);
  const woodMat = new THREE.MeshStandardMaterial({
  color: 0xd9a875,
  map: woodTex.map,
  bumpMap: woodTex.bumpMap,
  bumpScale: 0.04,
  roughness: 0.78,
  });

  // Arched Wooden Bridge across stream (z = -1.5..8.5)
  const bridgeGroup = new THREE.Group();
  const plankCount = 14;
  for (let p = 0; p < plankCount; p++) {
  const t = p / (plankCount - 1);
  const pz = BRIDGE_BOUNDS.minZ + t * (BRIDGE_BOUNDS.maxZ - BRIDGE_BOUNDS.minZ);
  const arch = Math.sin(t * Math.PI) * 0.55;
  const plank = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 0.62), woodMat);
  plank.position.set(0, BRIDGE_BOUNDS.deckY + arch - 0.1, pz);
  plank.castShadow = true;
  plank.receiveShadow = true;
  bridgeGroup.add(plank);
  }
  // Bridge posts
  for (const sx of [-2.65, 2.65]) {
  for (const sz of [BRIDGE_BOUNDS.minZ, 3.5, BRIDGE_BOUNDS.maxZ]) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.4, 8), woodMat);
  post.position.set(sx, BRIDGE_BOUNDS.deckY + 0.3, sz);
  post.castShadow = true;
  bridgeGroup.add(post);
  }
  }
  worldGroup.add(bridgeGroup);

  // Pirate Cove Wooden Dock
  const dockMesh = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.32, 3.2), woodMat);
  dockMesh.position.set(-18.8, 1.42, -4.0);
  dockMesh.castShadow = true;
  dockMesh.receiveShadow = true;
  worldGroup.add(dockMesh);

  // Stone Stepping Pillars in the Bay
  const stoneTex = createTempleStoneTextures(maxAniso);
  const templeStoneMat = new THREE.MeshStandardMaterial({
  color: 0xd9ccb2,
  map: stoneTex.map,
  bumpMap: stoneTex.bumpMap,
  bumpScale: 0.09,
  roughness: 0.86,
  metalness: 0.04,
  });
  const templeMossMat = new THREE.MeshStandardMaterial({
  color: 0x2c632b,
  roughness: 0.9,
  });

  for (const p of STEPPING_PILLARS) {
  const pillarMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(p.radius, p.radius * 1.12, p.topY + 2.5, 16),
  templeStoneMat,
  );
  pillarMesh.position.set(p.x, (p.topY - 2.5) * 0.5, p.z);
  pillarMesh.castShadow = true;
  pillarMesh.receiveShadow = true;
  worldGroup.add(pillarMesh);
  }

  // 3. Ancient Grand Sanctuary Temple & Glowing Golden Portal at TEMPLE_PORTAL_POS (z = -62.5)
  const templeGroup = new THREE.Group();
  templeGroup.position.set(TEMPLE_PORTAL_POS.x, 8.4, TEMPLE_PORTAL_POS.z);

  const tierWidths = [16.5, 13.0, 9.4, 5.8];
  const tierHeights = [1.9, 2.2, 2.2, 2.6];
  let accY = 0;
  for (let i = 0; i < tierWidths.length; i++) {
  const w = tierWidths[i];
  const h = tierHeights[i];
  const tier = new THREE.Mesh(
  new THREE.BoxGeometry(w, h, 8.8 - i * 1.1),
  templeStoneMat,
  );
  tier.position.set(0, accY + h * 0.5 - 0.5, -2.6 - i * 0.35);
  tier.castShadow = true;
  tier.receiveShadow = true;
  templeGroup.add(tier);
  accY += h;
  }

  for (const sx of [-2.5, 2.5]) {
  const pillar = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 5.2, 1.85),
  templeStoneMat,
  );
  pillar.position.set(sx, 2.25, 1.3);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  templeGroup.add(pillar);
  }
  const lintel = new THREE.Mesh(
  new THREE.BoxGeometry(7.4, 1.38, 2.25),
  templeStoneMat,
  );
  lintel.position.set(0, 5.2, 1.3);
  lintel.castShadow = true;
  templeGroup.add(lintel);

  const lintelMoss = new THREE.Mesh(
  new THREE.BoxGeometry(5.8, 0.34, 2.35),
  templeMossMat,
  );
  lintelMoss.position.set(0, 5.95, 1.3);
  templeGroup.add(lintelMoss);

  const portalMaterial = createPortalMaterial();
  const portalPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(3.7, 4.6),
  portalMaterial,
  );
  portalPlane.position.set(0, 2.2, 1.15);
  templeGroup.add(portalPlane);

  const portalCore = new THREE.Mesh(
  new THREE.PlaneGeometry(2.7, 3.7),
  new THREE.MeshBasicMaterial({
  color: 0xffd25e,
  transparent: true,
  opacity: 0.78,
  side: THREE.DoubleSide,
  }),
  );
  portalCore.position.set(0, 2.2, 0.95);
  templeGroup.add(portalCore);

  const portalLight = new THREE.PointLight(0xffb83d, 7.5, 28, 1.5);
  portalLight.position.set(0, 2.4, 2.8);
  templeGroup.add(portalLight);

  // Carved Stone Steps leading up from z = -34 to z = -55
  for (let s = 0; s < 15; s++) {
  const stepZ = -34.5 - s * 1.38;
  const stepY = getIslandGroundHeight(0, stepZ);
  const stepMesh = new THREE.Mesh(
  new THREE.BoxGeometry(8.2, 0.7, 1.45),
  templeStoneMat,
  );
  stepMesh.position.set(0, stepY - 0.12, stepZ);
  stepMesh.receiveShadow = true;
  stepMesh.castShadow = true;
  worldGroup.add(stepMesh);
  }

  for (const sx of [-5.2, 5.2]) {
  const guardian = createCarvedGuardianHead(templeStoneMat, templeMossMat);
  const gz = -34.0;
  const gy = getIslandGroundHeight(sx, gz);
  guardian.position.set(sx, gy - 0.15, gz);
  guardian.rotation.y = sx < 0 ? 0.25 : -0.25;
  worldGroup.add(guardian);
  }

  worldGroup.add(templeGroup);

  // 4. Cliff-Framed Cascading Jungle Waterfall on the Eastern Ridge (WATERFALL_POS)
  const cliffRockMat = new THREE.MeshStandardMaterial({
  color: 0x5c5143,
  bumpMap: stoneTex.bumpMap,
  bumpScale: 0.1,
  roughness: 0.9,
  flatShading: true,
  });

  const wfGroup = new THREE.Group();
  wfGroup.position.set(WATERFALL_POS.x, 0, WATERFALL_POS.z);
  wfGroup.rotation.y = -0.35;

  const cliffBlocks: Array<[number, number, number, number, number, number]> = [
  [-3.4, 6.2, -0.6, 2.6, 11.5, 3.2],
  [3.4, 6.2, -0.6, 2.6, 11.5, 3.2],
  [0, 11.4, -0.8, 8.6, 2.4, 3.6],
  [0, 5.5, -1.3, 6.4, 11.0, 1.8],
  ];
  for (const [bx, by, bz, bw, bh, bd] of cliffBlocks) {
  const cMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), cliffRockMat);
  cMesh.position.set(bx, by, bz);
  cMesh.scale.set(bw, bh, bd);
  cMesh.castShadow = true;
  cMesh.receiveShadow = true;
  wfGroup.add(cMesh);
  }

  const waterfallMaterial = createWaterfallMaterial();
  const waterfallMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(5.0, 11.2, 1, 12),
  waterfallMaterial,
  );
  waterfallMesh.position.set(0, 5.8, 0.35);
  waterfallMesh.rotation.x = 0.12;
  wfGroup.add(waterfallMesh);

  const splashPool = new THREE.Mesh(
  new THREE.CircleGeometry(4.4, 20),
  new THREE.MeshBasicMaterial({
  color: 0xcff8ff,
  transparent: true,
  opacity: 0.58,
  depthWrite: false,
  }),
  );
  splashPool.rotation.x = -Math.PI / 2;
  splashPool.position.set(0, 0.28, 1.7);
  wfGroup.add(splashPool);

  worldGroup.add(wfGroup);

  // 5. Giant Bouncy Mushrooms leading up the Waterfall Ridge
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xf7eedc, roughness: 0.75 });
  const spotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const mushroomVisuals: MushroomVisual[] = mushroomsDef.map((m) => {
  const group = new THREE.Group();
  group.position.set(m.x, m.y, m.z);

  const stem = new THREE.Mesh(
  new THREE.CylinderGeometry(0.36, 0.52, 1.25, 12),
  stemMat,
  );
  stem.position.y = 0.62;
  stem.castShadow = true;
  group.add(stem);

  const capGroup = new THREE.Group();
  capGroup.position.y = 1.25;
  const capMat = new THREE.MeshStandardMaterial({
  color: m.capColor,
  roughness: 0.45,
  });
  const cap = new THREE.Mesh(
  new THREE.SphereGeometry(m.radius, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
  capMat,
  );
  cap.scale.set(1.0, 0.68, 1.0);
  cap.castShadow = true;
  capGroup.add(cap);

  for (let s = 0; s < 6; s++) {
  const a = (s / 6) * Math.PI * 2;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), spotMat);
  dot.position.set(Math.cos(a) * (m.radius * 0.58), 0.42, Math.sin(a) * (m.radius * 0.58));
  capGroup.add(dot);
  }

  group.add(capGroup);
  worldGroup.add(group);
  return {
  id: m.id,
  group,
  capGroup,
  baseY: m.y,
  bounceAnim: 0,
  };
  });

  // 6. Sky Wind Rings
  const windRingVisuals: WindRingVisual[] = windRingsDef.map((r) => {
  const group = new THREE.Group();
  group.position.set(r.x, r.y, r.z);

  const outerRing = new THREE.Mesh(
  new THREE.TorusGeometry(r.radius * 0.85, 0.14, 10, 32),
  new THREE.MeshStandardMaterial({
  color: 0xffd54f,
  emissive: 0xff9800,
  emissiveIntensity: 0.65,
  roughness: 0.2,
  }),
  );
  group.add(outerRing);

  const innerRing = new THREE.Mesh(
  new THREE.TorusGeometry(r.radius * 0.68, 0.06, 8, 28),
  new THREE.MeshBasicMaterial({
  color: 0x6ef7ff,
  transparent: true,
  opacity: 0.78,
  }),
  );
  group.add(innerRing);

  worldGroup.add(group);
  return {
  id: r.id,
  group,
  outerRing,
  innerRing,
  passed: false,
  };
  });

  // 7. Composite Palm / Cedar / Olive Trees Across the Enlarged Island
  const palmCrowns: THREE.Group[] = [];
  const frondShape = new THREE.Shape();
  frondShape.moveTo(0, 0);
  frondShape.quadraticCurveTo(1.2, 0.38, 2.85, -0.45);
  frondShape.quadraticCurveTo(1.45, -0.02, 0, -0.08);
  frondShape.closePath();

  const frondGeo = new THREE.ExtrudeGeometry(frondShape, {
  depth: 0.34,
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.06,
  bevelSegments: 1,
  });
  frondGeo.translate(0, 0, -0.17);

  function addPalmTree(x: number, z: number, scale: number, leanYaw: number): void {
  const groundY = getIslandGroundHeight(x, z);
  if (groundY < 0.7) return;

  const tree = new THREE.Group();
  tree.position.set(x, groundY - 0.15, z);
  tree.scale.setScalar(scale);

  const segs = 5;
  let curY = 0;
  let curOff = 0;
  const dirX = Math.cos(leanYaw);
  const dirZ = Math.sin(leanYaw);

  for (let i = 0; i < segs; i++) {
  const segH = 1.05;
  const rBot = 0.24 - i * 0.028;
  const rTop = 0.21 - i * 0.028;
  const seg = new THREE.Mesh(
  new THREE.CylinderGeometry(rTop, rBot, segH, 8),
  trunkMat,
  );
  curOff += 0.14 * (i * 0.45);
  seg.position.set(dirX * curOff, curY + segH * 0.5, dirZ * curOff);
  seg.rotation.z = -dirX * (0.07 * i);
  seg.rotation.x = dirZ * (0.07 * i);
  seg.castShadow = true;
  curY += segH * 0.94;
  tree.add(seg);
  }

  const crown = new THREE.Group();
  crown.position.set(dirX * curOff, curY, dirZ * curOff);

  const frondCount = 8;
  for (let f = 0; f < frondCount; f++) {
  const angle = (f / frondCount) * Math.PI * 2;
  const frondPivot = new THREE.Group();
  frondPivot.rotation.y = angle;

  const frondBlade = new THREE.Mesh(frondGeo, frondMat);
  frondBlade.rotation.z = 0.18 + (f % 2) * 0.14;
  frondBlade.castShadow = true;
  frondPivot.add(frondBlade);
  crown.add(frondPivot);
  }

  for (let c = 0; c < 3; c++) {
  const coco = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 8, 8),
  new THREE.MeshStandardMaterial({ color: 0x523117, roughness: 0.72 }),
  );
  const ca = (c / 3) * Math.PI * 2;
  coco.position.set(Math.cos(ca) * 0.22, -0.15, Math.sin(ca) * 0.22);
  crown.add(coco);
  }

  tree.add(crown);
  palmCrowns.push(crown);
  worldGroup.add(tree);
  }

  const palmSpots: Array<[number, number, number]> = [
  [-7.5, 42.0, 1.15],
  [8.2, 39.5, 1.12],
  [-14.0, 29.0, 1.2],
  [13.5, 27.5, 1.18],
  [-8.2, 16.5, 1.05],
  [9.4, 14.0, 1.22],
  [-11.6, 5.2, 1.08],
  [13.2, 2.5, 1.15],
  [17.4, -7.5, 1.25],
  [-14.8, -11.5, 1.05],
  [-12.5, -24.5, 1.18],
  [12.8, -25.0, 1.14],
  [-15.2, -38.5, 1.25],
  [15.4, -38.0, 1.22],
  [25.0, 10.0, 1.18],
  [-22.0, 14.0, 1.1],
  ];
  palmSpots.forEach(([px, pz, sc], idx) => {
  addPalmTree(px, pz, sc, seededRand(idx + 1) * Math.PI * 2);
  });

  // 8. Instanced Mossy Basalt Rocks & Tropical Fern Bushes Across Expanded Terrain
  const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const rockMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  bumpMap: stoneTex.bumpMap,
  bumpScale: 0.08,
  roughness: 0.92,
  flatShading: true,
  });
  const rockCount = 56;
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rocks.castShadow = true;
  rocks.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let rockIdx = 0;

  for (let i = 0; i < 110 && rockIdx < rockCount; i++) {
  const a = seededRand(i * 3.1 + 4) * Math.PI * 2;
  const r = 10 + seededRand(i * 5.7 + 2) * 46;
  const rx = Math.cos(a) * r + 2;
  const rz = Math.sin(a) * r - 4;

  if (rz > -28 && rz < 50 && Math.abs(rx - getTrailCenterX(rz)) < 4.5) continue;
  if (Math.abs(rx) < 8.5 && rz < -28 && rz > -68) continue;

  const ry = getIslandGroundHeight(rx, rz);
  if (ry < 0.4) continue;

  const sx = 0.65 + seededRand(i * 7.1) * 1.45;
  const sy = 0.45 + seededRand(i * 2.3) * 0.95;
  const sz = 0.65 + seededRand(i * 9.4) * 1.4;

  dummy.position.set(rx, ry + sy * 0.24, rz);
  dummy.rotation.set(
  seededRand(i) * 0.5,
  seededRand(i + 11) * Math.PI * 2,
  seededRand(i + 23) * 0.5,
  );
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  rocks.setMatrixAt(rockIdx, dummy.matrix);

  const shade = 0.18 + seededRand(i + 41) * 0.1;
  tint.setRGB(shade, shade * 0.92, shade * 0.78);
  rocks.setColorAt(rockIdx, tint);
  rockIdx++;
  }
  rocks.count = rockIdx;
  rocks.computeBoundingSphere();
  worldGroup.add(rocks);

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.22, 0.45, 0.02, 1.15);
  leafShape.quadraticCurveTo(-0.22, 0.45, 0, 0);
  const singleLeafBase = new THREE.ExtrudeGeometry(leafShape, {
  depth: 0.03,
  bevelEnabled: false,
  });
  singleLeafBase.rotateX(Math.PI * 0.34);

  const leafParts: THREE.BufferGeometry[] = [];
  for (let l = 0; l < 7; l++) {
  const g = singleLeafBase.clone();
  g.rotateY((l / 7) * Math.PI * 2);
  leafParts.push(g);
  }
  const fernGeo = mergeGeometries(leafParts) || singleLeafBase;

  const fernMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.72,
  side: THREE.DoubleSide,
  });
  const fernCount = 85;
  const ferns = new THREE.InstancedMesh(fernGeo, fernMat, fernCount);
  ferns.castShadow = true;
  ferns.receiveShadow = true;

  let fernIdx = 0;
  for (let i = 0; i < 160 && fernIdx < fernCount; i++) {
  const a = seededRand(i * 4.3 + 9) * Math.PI * 2;
  const r = 6 + seededRand(i * 6.2 + 5) * 44;
  const fx = Math.cos(a) * r + 2;
  const fz = Math.sin(a) * r - 4;

  if (fz > -28 && fz < 50 && Math.abs(fx - getTrailCenterX(fz)) < 3.6) continue;
  if (Math.abs(fx) < 7.5 && fz < -28 && fz > -68) continue;

  const fy = getIslandGroundHeight(fx, fz);
  if (fy < 1.2) continue;

  const sc = 0.75 + seededRand(i * 1.9) * 0.9;
  dummy.position.set(fx, fy - 0.05, fz);
  dummy.rotation.set(
  (seededRand(i + 5) - 0.5) * 0.18,
  seededRand(i + 3) * Math.PI,
  (seededRand(i + 8) - 0.5) * 0.18,
  );
  dummy.scale.set(sc, sc * 0.95, sc);
  dummy.updateMatrix();
  ferns.setMatrixAt(fernIdx, dummy.matrix);

  tint.setHSL(
  0.3 + (seededRand(i + 19) - 0.5) * 0.05,
  0.66,
  0.17 + seededRand(i + 29) * 0.1,
  );
  ferns.setColorAt(fernIdx, tint);
  fernIdx++;
  }
  ferns.count = fernIdx;
  ferns.computeBoundingSphere();
  worldGroup.add(ferns);

  // 9. Stylized Fluffy Clouds
  const cloudMat = new THREE.MeshStandardMaterial({
  color: 0xeef3f8,
  roughness: 0.96,
  emissive: 0xffe8c4,
  emissiveIntensity: 0.04,
  });
  const clouds: THREE.Group[] = [];
  const cloudSpots: Array<[number, number, number, number]> = [
  [-46, 30, -68, 1.45],
  [22, 35, -82, 1.7],
  [58, 28, -36, 1.35],
  [-58, 26, 18, 1.3],
  [38, 31, 42, 1.4],
  ];
  for (const [cx, cy, cz, cs] of cloudSpots) {
  const cg = new THREE.Group();
  cg.position.set(cx, cy, cz);
  cg.scale.setScalar(cs);
  const puffs: Array<[number, number, number, number]> = [
  [0, 0, 0, 3.2],
  [-2.8, -0.4, 0.4, 2.3],
  [2.9, -0.3, -0.3, 2.5],
  [1.1, 1.1, 0.2, 2.2],
  [-1.3, 0.9, -0.3, 2.0],
  ];
  for (const [px, py, pz, pr] of puffs) {
  const puff = new THREE.Mesh(new THREE.SphereGeometry(pr, 12, 10), cloudMat);
  puff.position.set(px, py, pz);
  cg.add(puff);
  }
  clouds.push(cg);
  worldGroup.add(cg);
  }

  // 10. Collectible Beveled Golden Magic Stars
  const starGeo = new THREE.ExtrudeGeometry(createStarShape(0.62, 0.27, 5), {
  depth: 0.18,
  bevelEnabled: true,
  bevelThickness: 0.08,
  bevelSize: 0.06,
  bevelSegments: 2,
  });
  starGeo.center();

  const starMat = new THREE.MeshStandardMaterial({
  color: 0xffc928,
  emissive: 0xe67e00,
  emissiveIntensity: 0.55,
  roughness: 0.24,
  metalness: 0.72,
  });
  const ringMat = new THREE.MeshBasicMaterial({
  color: 0xffe066,
  transparent: true,
  opacity: 0.72,
  side: THREE.DoubleSide,
  });
  const beamMat = new THREE.MeshBasicMaterial({
  color: 0xffd552,
  transparent: true,
  opacity: 0.036,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  });

  const starVisuals: StarVisual[] = starsDef.map((s) => {
  const group = new THREE.Group();
  group.position.set(s.x, s.y, s.z);

  const starMesh = new THREE.Mesh(starGeo, starMat);
  starMesh.castShadow = true;
  group.add(starMesh);

  const ringMesh = new THREE.Mesh(
  new THREE.TorusGeometry(0.92, 0.036, 8, 28),
  ringMat,
  );
  ringMesh.rotation.x = Math.PI * 0.36;
  group.add(ringMesh);

  const beamMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.65, 3.6, 12, 1, true),
  beamMat,
  );
  beamMesh.position.y = 0.5;
  group.add(beamMesh);

  worldGroup.add(group);
  return {
  id: s.id,
  group,
  starMesh,
  ringMesh,
  beamMesh,
  baseY: s.y,
  collected: false,
  };
  });

  // 11. 3D Biblical Treasure Chests & Artifacts
  const chestContainer = new THREE.Group();
  worldGroup.add(chestContainer);
  const chestVisuals: BiblicalChestVisual[] = [];

  // 12. 3D Friendly Ally NPCs
  const npcContainer = new THREE.Group();
  worldGroup.add(npcContainer);
  const npcVisuals: NpcVisual[] = [];

  function populateDynamicWorldEntities(
  nextGems: SunGemDef[],
  nextNpcs: NpcDef[],
  ): void {
  // Clear old chests & NPCs
  while (chestContainer.children.length > 0) {
  chestContainer.remove(chestContainer.children[0]);
  }
  chestVisuals.length = 0;

  for (const gDef of nextGems) {
  const cv = createBiblicalTreasureChest(gDef, woodMat);
  chestContainer.add(cv.group);
  chestVisuals.push(cv);
  }

  while (npcContainer.children.length > 0) {
  npcContainer.remove(npcContainer.children[0]);
  }
  npcVisuals.length = 0;

  for (const nDef of nextNpcs) {
  const nv = createFriendlyNpcMesh(nDef);
  npcContainer.add(nv.group);
  npcVisuals.push(nv);
  }
  }

  populateDynamicWorldEntities(gemsDef, npcsDef);

  // 13. Animated 3D Animals (Dolphins, Beach Crabs, Lambs, Doves)
  const animalVisuals = buildIslandAnimals(worldGroup);

  // 14. Pooled Golden Sparkle Particles
  const sparkles = createSparklePool(280);
  worldGroup.add(sparkles.points);

  function rebuildForWorld(
  worldId: WorldId,
  nextGems: SunGemDef[],
  nextNpcs: NpcDef[],
  ): void {
  applyTerrainTheme(worldId);
  populateDynamicWorldEntities(nextGems, nextNpcs);
  }

  return {
  worldGroup,
  terrainMesh,
  portalMaterial,
  waterfallMaterial,
  portalLight,
  starVisuals,
  chestVisuals,
  mushroomVisuals,
  windRingVisuals,
  npcVisuals,
  animalVisuals,
  palmCrowns,
  clouds,
  sparkles,
  rebuildForWorld,
  };
  }
 