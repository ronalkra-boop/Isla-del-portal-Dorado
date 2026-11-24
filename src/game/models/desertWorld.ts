import * as THREE from 'three';
import {
DESERT_OASIS_CENTER,
DESERT_PORTAL_POS,
DESERT_PYRAMID_CENTER,
DESERT_PYRAMID_TIERS,
DESERT_WATER_LEVEL,
TERRAIN_SIZE,
getDesertCanyonCenterX,
getDesertGroundHeight,
type BouncyMushroomDef,
type MagicStarDef,
type NpcDef,
type SunGemDef,
type WindRingDef,
} from '../phase1Logic';
import {
applyNintendoRimLight,
createAmbientMotesPool,
createDesertFloraAndCacti,
} from '../nintendoVisuals';
import {
createGodRayMaterial,
createPortalMaterial,
createStylizedWaterMaterial,
} from '../shaders';
import {
createClothFabricTextures,
createLeafFrondTextures,
createPalmBarkTextures,
createSandDuneTextures,
createTempleStoneTextures,
createWoodPlankTextures,
type TexturePair,
} from '../textures';
import {
animateSharedWorldEntities,
createBiblicalTreasureChest,
createFriendlyNpcMesh,
createSparklePool,
createStarVisuals,
createWindRingVisuals,
seededRand,
type MushroomVisual,
type WorldBuildResult,
} from './islandWorld';

interface DesertCreature {
kind: 'camel' | 'lamb' | 'eagle' | 'fox';
group: THREE.Group;
leftWing?: THREE.Object3D;
rightWing?: THREE.Object3D;
originX: number;
originY: number;
originZ: number;
phase: number;
radius: number;
speed: number;
}

function createNomadTent(
clothHex: number,
stripeHex: number,
clothTex: TexturePair,
): THREE.Group {
const tent = new THREE.Group();
const clothMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: clothHex,
map: clothTex.map,
normalMap: clothTex.normalMap,
normalScale: new THREE.Vector2(0.55, 0.55),
roughness: 0.85,
}),
{ colorHex: 0xffe4a8, power: 2.6, strength: 0.25 },
);
const stripeMat = new THREE.MeshStandardMaterial({
color: stripeHex,
map: clothTex.map,
roughness: 0.82,
});
const poleMat = new THREE.MeshStandardMaterial({ color: 0x5c381c, roughness: 0.8 });

const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.8, 6), clothMat);
canopy.position.y = 1.4;
canopy.castShadow = true;
canopy.receiveShadow = true;
tent.add(canopy);

const trim = new THREE.Mesh(new THREE.ConeGeometry(2.65, 0.55, 6, 1, true), stripeMat);
trim.position.y = 0.6;
tent.add(trim);

const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6), poleMat);
finial.position.y = 1.6;
tent.add(finial);

return tent;
}

function buildDesertCreatures(worldGroup: THREE.Group): DesertCreature[] {
const creatures: DesertCreature[] = [];

// 1. Sculpted 3D Dromedary Camels strolling in the desert dunes
const camelMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({ color: 0xcca062, roughness: 0.82 }),
{ colorHex: 0xffe8b0, power: 2.6, strength: 0.24 },
);
const saddleMat = new THREE.MeshStandardMaterial({ color: 0xb8352a, roughness: 0.8 });
(
[
[-14.5, 42.0, 0],
[15.0, 34.0, 2.2],
[-18.0, 8.0, 4.1],
] as Array<[number, number, number]>
).forEach(([cx, cz, phase]) => {
const cg = new THREE.Group();
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.95, 6, 10), camelMat);
torso.rotation.x = Math.PI / 2;
torso.position.y = 1.15;
torso.castShadow = true;
cg.add(torso);

const hump = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), camelMat);
hump.scale.set(0.85, 1.15, 0.95);
hump.position.set(0, 1.58, -0.05);
cg.add(hump);

const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 0.6), saddleMat);
saddle.position.set(0, 1.62, -0.05);
cg.add(saddle);

const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.85, 8), camelMat);
neck.rotation.x = -0.55;
neck.position.set(0, 1.55, 0.72);
cg.add(neck);

const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.44), camelMat);
head.position.set(0, 1.92, 0.98);
cg.add(head);

for (const lx of [-0.22, 0.22]) {
for (const lz of [-0.42, 0.42]) {
const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.95, 8), camelMat);
leg.position.set(lx, 0.48, lz);
leg.castShadow = true;
cg.add(leg);
}
}

const cy = getDesertGroundHeight(cx, cz);
cg.position.set(cx, cy, cz);
worldGroup.add(cg);
creatures.push({
kind: 'camel',
group: cg,
originX: cx,
originY: cy,
originZ: cz,
phase,
radius: 3.4,
speed: 0.45,
});
});

// 2. Peaceful Grazing Desert Lambs around the Emerald Oasis
const woolMat = new THREE.MeshStandardMaterial({ color: 0xfcf8ef, roughness: 0.9 });
const faceMat = new THREE.MeshStandardMaterial({ color: 0x3b2d26, roughness: 0.7 });
(
[
[18.5, -3.5],
[21.0, -14.5],
[25.5, -2.5],
[33.5, -4.0],
[19.5, -10.0],
] as Array<[number, number]>
).forEach(([lx, lz], idx) => {
const lg = new THREE.Group();
const wool = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), woolMat);
wool.scale.set(1.0, 0.9, 1.35);
wool.position.y = 0.46;
wool.castShadow = true;
lg.add(wool);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), faceMat);
head.position.set(0, 0.64, 0.44);
lg.add(head);
for (const sx of [-0.15, 0.15]) {
for (const sz of [-0.24, 0.24]) {
const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.36, 8), faceMat);
leg.position.set(sx, 0.18, sz);
lg.add(leg);
}
}
const ly = getDesertGroundHeight(lx, lz);
lg.position.set(lx, ly, lz);
worldGroup.add(lg);
creatures.push({
kind: 'lamb',
group: lg,
originX: lx,
originY: ly,
originZ: lz,
phase: idx * 1.4,
radius: 1.5,
speed: 0.85,
});
});

// 3. Soaring Golden Desert Eagles circling above the Red Canyon & Pyramid
const eagleMat = new THREE.MeshStandardMaterial({ color: 0x6e4422, roughness: 0.6 });
const eagleHeadMat = new THREE.MeshStandardMaterial({ color: 0xf5ecd8, roughness: 0.5 });
(
[
[0, 19.5, 6.0, 11.0],
[-28, 17.5, -16.0, 9.5],
[28, 18.0, -22.0, 10.0],
[0, 21.0, -45.0, 12.0],
] as Array<[number, number, number, number]>
).forEach(([ex, ey, ez, rad], idx) => {
const eg = new THREE.Group();
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.45, 6, 8), eagleMat);
torso.rotation.x = Math.PI / 2;
eg.add(torso);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eagleHeadMat);
head.position.set(0, 0.06, 0.32);
eg.add(head);
const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.04, 0.32), eagleMat);
leftWing.position.set(-0.46, 0.04, 0);
eg.add(leftWing);
const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.04, 0.32), eagleMat);
rightWing.position.set(0.46, 0.04, 0);
eg.add(rightWing);
eg.position.set(ex, ey, ez);
worldGroup.add(eg);
creatures.push({
kind: 'eagle',
group: eg,
leftWing,
rightWing,
originX: ex,
originY: ey,
originZ: ez,
phase: idx * 1.7,
radius: rad,
speed: 0.65,
});
});

// 4. Cute Desert Foxes (Fennec) trotting across the dunes
const foxMat = new THREE.MeshStandardMaterial({ color: 0xe6a15c, roughness: 0.75 });
(
[
[11, 22],
[-11, 20],
[8, -28],
] as Array<[number, number]>
).forEach(([fx, fz], idx) => {
const fg = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.36, 6, 8), foxMat);
body.rotation.x = Math.PI / 2;
body.position.y = 0.26;
fg.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), foxMat);
head.position.set(0, 0.38, 0.25);
fg.add(head);
for (const s of [-0.08, 0.08]) {
const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), foxMat);
ear.position.set(s, 0.56, 0.22);
fg.add(ear);
}
const fy = getDesertGroundHeight(fx, fz);
fg.position.set(fx, fy, fz);
worldGroup.add(fg);
creatures.push({
kind: 'fox',
group: fg,
originX: fx,
originY: fy,
originZ: fz,
phase: idx * 2.1,
radius: 2.2,
speed: 1.4,
});
});

return creatures;
}

export function buildDesertWorld(
  starsDef: MagicStarDef[],
  maxAniso: number,
  gemsDef: SunGemDef[],
  bouncePadsDef: BouncyMushroomDef[],
  windRingsDef: WindRingDef[],
  npcsDef: NpcDef[],
  ): WorldBuildResult {
  const worldGroup = new THREE.Group();

  // 1. Vast Rippled Golden Sand Horizon Skirt + Sculpted 240x240 Dune & Red-Mesa Terrain (ZERO Ocean!)
  const sandTex = createSandDuneTextures(maxAniso);
  const horizonSandMat = new THREE.MeshStandardMaterial({
  color: 0xe6b86e,
  map: sandTex.map,
  normalMap: sandTex.normalMap,
  normalScale: new THREE.Vector2(1.05, 1.05),
  roughnessMap: sandTex.roughnessMap,
  roughness: 0.88,
  });
  const horizonSand = new THREE.Mesh(
  new THREE.PlaneGeometry(720, 720),
  horizonSandMat,
  );
  horizonSand.rotation.x = -Math.PI / 2;
  horizonSand.position.y = 1.65;
  horizonSand.receiveShadow = true;
  worldGroup.add(horizonSand);

  const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 148, 148);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  posAttr.setY(i, getDesertGroundHeight(x, z));
  }
  terrainGeo.computeVertexNormals();
  const normAttr = terrainGeo.attributes.normal as THREE.BufferAttribute;

  const goldSandCol = new THREE.Color(0xe6b973);
  const deepDuneCol = new THREE.Color(0xc98b49);
  const canyonTrailCol = new THREE.Color(0xb86f3d);
  const redMesaCol = new THREE.Color(0x9e4b2e);
  const oasisGrassCol = new THREE.Color(0x459e40);
  const limestoneCol = new THREE.Color(0xdfd3b4);
  const tmpCol = new THREE.Color();

  for (let i = 0; i < count; i++) {
  const x = posAttr.getX(i);
  const y = posAttr.getY(i);
  const z = posAttr.getZ(i);
  const ny = normAttr.getY(i);

  const oasisDist = Math.hypot(
  (x - DESERT_OASIS_CENTER.x) / 14.5,
  (z - DESERT_OASIS_CENTER.z) / 13.5,
  );
  const oasisGrassMask = (1 - THREE.MathUtils.smoothstep(oasisDist, 0.52, 1.05)) * (y > 0.5 ? 1 : 0);

  if (ny < 0.78 || y > 7.5) {
  tmpCol.copy(redMesaCol).lerp(deepDuneCol, 0.28);
  } else {
  const waveMix = 0.5 + 0.5 * Math.sin(x * 0.08 + z * 0.05);
  tmpCol.copy(goldSandCol).lerp(deepDuneCol, waveMix * 0.42);
  }

  if (oasisGrassMask > 0.02) {
  tmpCol.lerp(oasisGrassCol, oasisGrassMask * 0.92);
  }

  if (z > -30 && z < 50) {
  const cDist = Math.abs(x - getDesertCanyonCenterX(z));
  const cMask = 1 - THREE.MathUtils.smoothstep(cDist, 1.8, 4.4);
  tmpCol.lerp(canyonTrailCol, cMask * 0.78);
  }

  if (Math.abs(x) < 11.5 && z < -32 && z > -70) {
  tmpCol.lerp(limestoneCol, 0.85);
  }

  colors[i * 3] = tmpCol.r;
  colors[i * 3 + 1] = tmpCol.g;
  colors[i * 3 + 2] = tmpCol.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const terrainMesh = new THREE.Mesh(
  terrainGeo,
  applyNintendoRimLight(
  new THREE.MeshStandardMaterial({
  vertexColors: true,
  map: sandTex.map,
  normalMap: sandTex.normalMap,
  normalScale: new THREE.Vector2(1.0, 1.0),
  roughnessMap: sandTex.roughnessMap,
  roughness: 0.88,
  }),
  { colorHex: 0xffe4a8, power: 3.4, strength: 0.16 },
  ),
  );
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  // 2. Stylized Shimmering Emerald Oasis Spring Water Lagoon (ONLY inside the Oasis!)
  const oasisWaterMat = createStylizedWaterMaterial({
  deepColorHex: 0x0b7380,
  shallowColorHex: 0x2de0cb,
  causticColorHex: 0xd9fff6,
  foamColorHex: 0xf4fffd,
  opacity: 0.92,
  flowSpeed: 0.72,
  emissiveBoost: 0.24,
  });
  const oasisWater = new THREE.Mesh(
  new THREE.CircleGeometry(10.6, 40),
  oasisWaterMat,
  );
  oasisWater.rotation.x = -Math.PI / 2;
  oasisWater.position.set(DESERT_OASIS_CENTER.x, DESERT_WATER_LEVEL, DESERT_OASIS_CENTER.z);
  worldGroup.add(oasisWater);

  // 3. West Climbable Stepped Ancient Golden Pyramid + Golden Cornices + Obelisks
  const stoneTex = createTempleStoneTextures(maxAniso);
  const sandstoneMat = applyNintendoRimLight(
  new THREE.MeshStandardMaterial({
  color: 0xe0bb7b,
  map: stoneTex.map,
  normalMap: stoneTex.normalMap,
  normalScale: new THREE.Vector2(1.0, 1.0),
  roughnessMap: stoneTex.roughnessMap,
  roughness: 0.84,
  }),
  { colorHex: 0xffe9b5, power: 3.0, strength: 0.18 },
  );
  const redRockMat = applyNintendoRimLight(
  new THREE.MeshStandardMaterial({
  color: 0xb05436,
  normalMap: stoneTex.normalMap,
  normalScale: new THREE.Vector2(1.1, 1.1),
  roughness: 0.88,
  flatShading: true,
  }),
  { colorHex: 0xffc68f, power: 3.0, strength: 0.2 },
  );
  const woodTex = createWoodPlankTextures(maxAniso);
  const chestWoodMat = new THREE.MeshStandardMaterial({
  color: 0xdfb17d,
  map: woodTex.map,
  normalMap: woodTex.normalMap,
  normalScale: new THREE.Vector2(0.85, 0.85),
  roughnessMap: woodTex.roughnessMap,
  roughness: 0.76,
  });
  const goldTrimMat = new THREE.MeshPhysicalMaterial({
  color: 0xffcf40,
  roughness: 0.22,
  metalness: 0.88,
  clearcoat: 0.62,
  });

  const pyramidGroup = new THREE.Group();
  pyramidGroup.position.set(DESERT_PYRAMID_CENTER.x, 0, DESERT_PYRAMID_CENTER.z);
  let prevTop = 1.6;
  for (const tier of DESERT_PYRAMID_TIERS) {
  const h = tier.topY - prevTop;
  const box = new THREE.Mesh(
  new THREE.BoxGeometry(tier.halfSize * 2, h, tier.halfSize * 2),
  sandstoneMat,
  );
  box.position.y = prevTop + h * 0.5;
  box.castShadow = true;
  box.receiveShadow = true;
  pyramidGroup.add(box);

  const trim = new THREE.Mesh(
  new THREE.BoxGeometry(tier.halfSize * 2 + 0.16, 0.14, tier.halfSize * 2 + 0.16),
  goldTrimMat,
  );
  trim.position.y = tier.topY - 0.08;
  pyramidGroup.add(trim);
  prevTop = tier.topY;
  }
  worldGroup.add(pyramidGroup);

  // Ancient Sandstone Obelisks flanking the Pyramid & Trail
  for (const [ox, oz] of [
  [-19, -11],
  [-19, -21],
  [-7.5, -28],
  [7.5, -28],
  ] as Array<[number, number]>) {
  const oy = getDesertGroundHeight(ox, oz);
  const obelisk = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.58, 5.2, 4), sandstoneMat);
  shaft.rotation.y = Math.PI / 4;
  shaft.position.y = 2.6;
  shaft.castShadow = true;
  obelisk.add(shaft);
  const tip = new THREE.Mesh(
  new THREE.ConeGeometry(0.45, 0.9, 4),
  new THREE.MeshStandardMaterial({ color: 0xffcf40, roughness: 0.3, metalness: 0.7 }),
  );
  tip.rotation.y = Math.PI / 4;
  tip.position.y = 5.65;
  obelisk.add(tip);
  obelisk.position.set(ox, oy - 0.1, oz);
  worldGroup.add(obelisk);
  }

  // 4. Colossal Natural Red-Sandstone Canyon Arch at z = 6
  const archGroup = new THREE.Group();
  archGroup.position.set(getDesertCanyonCenterX(6.0), 0, 6.0);
  const archGeo = new THREE.TorusGeometry(9.5, 2.2, 10, 24, Math.PI);
  const archMesh = new THREE.Mesh(archGeo, redRockMat);
  archMesh.position.y = 1.8;
  archMesh.castShadow = true;
  archMesh.receiveShadow = true;
  archGroup.add(archMesh);
  worldGroup.add(archGroup);

  // 5. South Nomad Tent Camp, Woven Camp Carpet, Supply Crates & Glowing Campfire (around z = 48)
  const clothTex = createClothFabricTextures(maxAniso);
  const tentSpecs: Array<[number, number, number, number, number]> = [
  [-9.5, 47.0, 0.5, 0xc94234, 0xf2c94c],
  [9.5, 45.5, -0.6, 0x1d7a8c, 0xf7e4ba],
  [-12.5, 38.5, 0.9, 0xd97a26, 0xfff3d1],
  ];
  for (const [tx, tz, ry, c1, c2] of tentSpecs) {
  const t = createNomadTent(c1, c2, clothTex);
  t.position.set(tx, getDesertGroundHeight(tx, tz) - 0.1, tz);
  t.rotation.y = ry;
  worldGroup.add(t);
  }

  for (const [cx, cz, cr] of [
  [-6.5, 45.0, 0.4],
  [7.2, 47.2, -0.3],
  ] as Array<[number, number, number]>) {
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.95), chestWoodMat);
  crate.position.set(cx, getDesertGroundHeight(cx, cz) + 0.4, cz);
  crate.rotation.y = cr;
  crate.castShadow = true;
  worldGroup.add(crate);
  }

  // Glowing Nomad Campfire near Spawn
  const fireX = 5.2;
  const fireZ = 45.5;
  const fireY = getDesertGroundHeight(fireX, fireZ);
  const campfireFlame = new THREE.Mesh(
  new THREE.ConeGeometry(0.32, 0.72, 8),
  new THREE.MeshBasicMaterial({ color: 0xffa62b }),
  );
  campfireFlame.position.set(fireX, fireY + 0.42, fireZ);
  worldGroup.add(campfireFlame);
  const fireLight = new THREE.PointLight(0xff9933, 4.5, 18, 1.5);
  fireLight.position.set(fireX, fireY + 1.2, fireZ);
  worldGroup.add(fireLight);

  // 6. Oasis Date Palm Trees (with Nintendo bark/leaf normal relief & clusters of golden dates!)
  const palmBarkTex = createPalmBarkTextures(maxAniso);
  const palmTrunkMat = new THREE.MeshStandardMaterial({
  color: 0xd9c2a8,
  map: palmBarkTex.map,
  normalMap: palmBarkTex.normalMap,
  normalScale: new THREE.Vector2(0.85, 0.85),
  roughness: 0.88,
  });
  const leafFrondTex = createLeafFrondTextures(maxAniso);
  const palmFrondMat = applyNintendoRimLight(
  new THREE.MeshStandardMaterial({
  color: 0xd9f5c8,
  map: leafFrondTex.map,
  normalMap: leafFrondTex.normalMap,
  normalScale: new THREE.Vector2(0.75, 0.75),
  roughness: 0.62,
  side: THREE.DoubleSide,
  }),
  { colorHex: 0xffe885, power: 2.5, strength: 0.28 },
  );
  const datePalmCrowns: THREE.Group[] = [];
  const frondShape = new THREE.Shape();
  frondShape.moveTo(0, 0);
  frondShape.quadraticCurveTo(1.2, 0.38, 2.75, -0.45);
  frondShape.quadraticCurveTo(1.45, -0.02, 0, -0.08);
  frondShape.closePath();
  const frondGeo = new THREE.ExtrudeGeometry(frondShape, {
  depth: 0.3,
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.05,
  bevelSegments: 1,
  });
  frondGeo.translate(0, 0, -0.15);

  function addDatePalm(x: number, z: number, scale: number, leanYaw: number): void {
  const gy = getDesertGroundHeight(x, z);
  const tree = new THREE.Group();
  tree.position.set(x, gy - 0.15, z);
  tree.scale.setScalar(scale);

  let curY = 0;
  let curOff = 0;
  const dx = Math.cos(leanYaw);
  const dz = Math.sin(leanYaw);
  for (let i = 0; i < 5; i++) {
  const seg = new THREE.Mesh(
  new THREE.CylinderGeometry(0.2 - i * 0.025, 0.23 - i * 0.025, 1.05, 8),
  palmTrunkMat,
  );
  curOff += 0.12 * (i * 0.45);
  seg.position.set(dx * curOff, curY + 0.52, dz * curOff);
  seg.rotation.z = -dx * 0.06 * i;
  seg.rotation.x = dz * 0.06 * i;
  seg.castShadow = true;
  curY += 0.98;
  tree.add(seg);
  }

  const crown = new THREE.Group();
  crown.position.set(dx * curOff, curY, dz * curOff);
  for (let f = 0; f < 8; f++) {
  const p = new THREE.Group();
  p.rotation.y = (f / 8) * Math.PI * 2;
  const blade = new THREE.Mesh(frondGeo, palmFrondMat);
  blade.rotation.z = 0.2 + (f % 2) * 0.14;
  blade.castShadow = true;
  p.add(blade);
  crown.add(p);
  }
  for (let c = 0; c < 3; c++) {
  const dates = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 8, 8),
  new THREE.MeshStandardMaterial({ color: 0xd98218, roughness: 0.6 }),
  );
  const ca = (c / 3) * Math.PI * 2;
  dates.position.set(Math.cos(ca) * 0.22, -0.18, Math.sin(ca) * 0.22);
  crown.add(dates);
  }
  tree.add(crown);
  datePalmCrowns.push(crown);
  worldGroup.add(tree);
  }

  (
  [
  [18.5, -13.0, 1.15],
  [21.0, -4.0, 1.2],
  [35.5, -5.0, 1.18],
  [36.5, -15.5, 1.12],
  [26.5, -18.5, 1.22],
  [28.5, -1.5, 1.08],
  [17.5, -17.0, 1.05],
  [33.0, -18.0, 1.15],
  ] as Array<[number, number, number]>
  ).forEach(([px, pz, sc], idx) => {
  addDatePalm(px, pz, sc, seededRand(idx + 11) * Math.PI * 2);
  });

  // 7. Instanced Red-Sandstone Desert Boulders
  const boulders = new THREE.InstancedMesh(
  new THREE.DodecahedronGeometry(1.0, 1),
  redRockMat,
  46,
  );
  boulders.castShadow = true;
  boulders.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let bIdx = 0;
  for (let i = 0; i < 95 && bIdx < 46; i++) {
  const a = seededRand(i * 3.3 + 5) * Math.PI * 2;
  const r = 12 + seededRand(i * 5.9 + 2) * 48;
  const rx = Math.cos(a) * r;
  const rz = Math.sin(a) * r;
  if (Math.abs(rx - getDesertCanyonCenterX(rz)) < 6.0 && rz > -30 && rz < 50) continue;
  if (Math.hypot(rx - DESERT_PYRAMID_CENTER.x, rz - DESERT_PYRAMID_CENTER.z) < 13) continue;
  if (Math.hypot(rx - DESERT_OASIS_CENTER.x, rz - DESERT_OASIS_CENTER.z) < 12) continue;
  if (Math.abs(rx) < 10 && rz < -30) continue;

  const ry = getDesertGroundHeight(rx, rz);
  const sx = 0.8 + seededRand(i * 7.1) * 1.6;
  const sy = 0.55 + seededRand(i * 2.3) * 1.1;
  const sz = 0.8 + seededRand(i * 9.4) * 1.6;
  dummy.position.set(rx, ry + sy * 0.25, rz);
  dummy.rotation.set(seededRand(i) * 0.4, seededRand(i + 11) * Math.PI * 2, seededRand(i + 23) * 0.4);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  boulders.setMatrixAt(bIdx++, dummy.matrix);
  }
  boulders.count = bIdx;
  boulders.computeBoundingSphere();
  worldGroup.add(boulders);

  // 8. North Mount of Promise White-Limestone Sanctuary & Third Golden Portal
  const whiteStoneMat = applyNintendoRimLight(
  new THREE.MeshStandardMaterial({
  color: 0xf4e8ce,
  map: stoneTex.map,
  normalMap: stoneTex.normalMap,
  normalScale: new THREE.Vector2(0.95, 0.95),
  roughnessMap: stoneTex.roughnessMap,
  roughness: 0.7,
  }),
  { colorHex: 0xfff0c2, power: 2.8, strength: 0.24 },
  );

  const mountGroup = new THREE.Group();
  mountGroup.position.set(DESERT_PORTAL_POS.x, 9.6, DESERT_PORTAL_POS.z);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(17.5, 2.8, 10.5), whiteStoneMat);
  plinth.position.set(0, 1.0, -1.5);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  mountGroup.add(plinth);

  for (const sx of [-5.8, -2.9, 2.9, 5.8]) {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.68, 6.0, 14), whiteStoneMat);
  col.position.set(sx, 5.2, 1.0);
  col.castShadow = true;
  mountGroup.add(col);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.4), goldTrimMat);
  cap.position.set(sx, 8.2, 1.0);
  mountGroup.add(cap);
  }

  const crownLintel = new THREE.Mesh(new THREE.BoxGeometry(14.5, 1.25, 2.4), whiteStoneMat);
  crownLintel.position.set(0, 8.85, 1.0);
  crownLintel.castShadow = true;
  mountGroup.add(crownLintel);

  const portalMaterial = createPortalMaterial();
  const portalPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.7), portalMaterial);
  portalPlane.position.set(0, 4.6, 1.15);
  mountGroup.add(portalPlane);

  const portalCore = new THREE.Mesh(
  new THREE.PlaneGeometry(2.8, 3.8),
  new THREE.MeshBasicMaterial({
  color: 0xffd25e,
  transparent: true,
  opacity: 0.78,
  side: THREE.DoubleSide,
  }),
  );
  portalCore.position.set(0, 4.6, 0.95);
  mountGroup.add(portalCore);

  const portalLight = new THREE.PointLight(0xffb83d, 8.2, 32, 1.4);
  portalLight.position.set(0, 4.8, 3.0);
  mountGroup.add(portalLight);
  worldGroup.add(mountGroup);

  // Warm Golden Sunbeams over the Red Canyon Arch, Oasis Lagoon & Mount of Promise
  const sunBeamMat = createGodRayMaterial(0xffe19c, 0.16);
  for (const [bx, by, bz, tr, br, bh] of [
  [getDesertCanyonCenterX(6.0), 15.0, 6.0, 3.2, 8.2, 24],
  [DESERT_OASIS_CENTER.x, 14.5, DESERT_OASIS_CENTER.z, 3.5, 8.8, 25],
  [DESERT_PORTAL_POS.x, 21.0, DESERT_PORTAL_POS.z + 5.0, 3.8, 9.5, 26],
  ] as Array<[number, number, number, number, number, number]>) {
  const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(tr, br, bh, 18, 1, true),
  sunBeamMat,
  );
  beam.position.set(bx, by, bz);
  beam.rotation.z = 0.14;
  worldGroup.add(beam);
  }

  // 9. Animated Desert Whirlwind Updraft Bounce Pads
  const mushroomVisuals: MushroomVisual[] = bouncePadsDef.map((m) => {
  const group = new THREE.Group();
  group.position.set(m.x, m.y, m.z);

  const capGroup = new THREE.Group();
  const funnel = new THREE.Mesh(
  new THREE.ConeGeometry(m.radius * 0.92, 3.2, 16, 1, true),
  new THREE.MeshBasicMaterial({
  color: m.capColor,
  transparent: true,
  opacity: 0.36,
  side: THREE.DoubleSide,
  depthWrite: false,
  }),
  );
  funnel.rotation.x = Math.PI;
  funnel.position.y = 1.6;
  capGroup.add(funnel);

  const swirlRing = new THREE.Mesh(
  new THREE.TorusGeometry(m.radius * 0.8, 0.1, 8, 24),
  new THREE.MeshBasicMaterial({
  color: 0xffe082,
  transparent: true,
  opacity: 0.8,
  }),
  );
  swirlRing.rotation.x = Math.PI / 2;
  swirlRing.position.y = 0.25;
  capGroup.add(swirlRing);

  group.add(capGroup);
  worldGroup.add(group);
  return { id: m.id, group, capGroup, baseY: m.y, bounceAnim: 0 };
  });

  // 10. Instanced Oasis Reeds, Cacti, Sand Motes, Stars, Chests, Sun-Gold Flight Rings, NPCs & Creatures
  const windUniform = { value: 0 };
  createDesertFloraAndCacti(
  worldGroup,
  getDesertGroundHeight,
  getDesertCanyonCenterX,
  DESERT_OASIS_CENTER,
  DESERT_PYRAMID_CENTER,
  windUniform,
  );

  const motes = createAmbientMotesPool({
  count: 170,
  boundsX: [-60, 60],
  boundsY: [1.5, 22.0],
  boundsZ: [-64, 56],
  primaryHex: 0xffe49e,
  secondaryHex: 0xffb85c,
  size: 0.34,
  opacity: 0.7,
  speed: 0.95,
  });
  worldGroup.add(motes.points);

  const starVisuals = createStarVisuals(worldGroup, starsDef);
  const chestVisuals = gemsDef.map((g) => {
  const cv = createBiblicalTreasureChest(g, chestWoodMat);
  worldGroup.add(cv.group);
  return cv;
  });
  const windRingVisuals = createWindRingVisuals(
  worldGroup,
  windRingsDef,
  0xffb347,
  0xfff3b0,
  );
  const npcVisuals = npcsDef.map((n) => {
  const nv = createFriendlyNpcMesh(n);
  worldGroup.add(nv.group);
  return nv;
  });
  const creatures = buildDesertCreatures(worldGroup);

  const sparkles = createSparklePool(280);
  worldGroup.add(sparkles.points);

  function update(t: number, dt: number, portalAwakened: boolean): void {
  campfireFlame.scale.set(1, 0.85 + Math.sin(t * 16) * 0.2, 1);
  oasisWaterMat.uniforms.uTime.value = t;
  sunBeamMat.uniforms.uTime.value = t;
  windUniform.value = t;
  motes.update(t, dt);

  for (let i = 0; i < datePalmCrowns.length; i++) {
  datePalmCrowns[i].rotation.z = Math.sin(t * 1.4 + i) * 0.05;
  }

  for (const mv of mushroomVisuals) {
  mv.capGroup.rotation.y += dt * 4.5;
  if (mv.bounceAnim > 0) {
  mv.bounceAnim = Math.max(0, mv.bounceAnim - dt * 3.5);
  const s = 1 + Math.sin(mv.bounceAnim * Math.PI * 3) * 0.3 * mv.bounceAnim;
  mv.capGroup.scale.set(s, 1.3, s);
  } else {
  mv.capGroup.scale.set(1, 1, 1);
  }
  }

  for (const c of creatures) {
  const aTime = t * c.speed + c.phase;
  if (c.kind === 'camel') {
  const cx = c.originX + Math.cos(aTime) * c.radius;
  const cz = c.originZ + Math.sin(aTime) * c.radius;
  c.group.position.set(cx, getDesertGroundHeight(cx, cz), cz);
  c.group.rotation.y = -aTime;
  } else if (c.kind === 'lamb') {
  const lx = c.originX + Math.cos(aTime * 0.6) * c.radius;
  const lz = c.originZ + Math.sin(aTime * 0.6) * c.radius;
  c.group.position.set(
  lx,
  getDesertGroundHeight(lx, lz) + Math.abs(Math.sin(aTime * 3.0)) * 0.08,
  lz,
  );
  c.group.rotation.y = -aTime * 0.6 + Math.PI;
  } else if (c.kind === 'eagle') {
  c.group.position.x = c.originX + Math.cos(aTime) * c.radius;
  c.group.position.z = c.originZ + Math.sin(aTime) * c.radius;
  c.group.position.y = c.originY + Math.sin(aTime * 1.8) * 0.8;
  c.group.rotation.y = -aTime;
  const flap = Math.sin(t * 7 + c.phase) * 0.35;
  if (c.leftWing) c.leftWing.rotation.z = flap;
  if (c.rightWing) c.rightWing.rotation.z = -flap;
  } else if (c.kind === 'fox') {
  const fx = c.originX + Math.sin(aTime) * c.radius;
  const fz = c.originZ + Math.cos(aTime * 0.8) * c.radius;
  c.group.position.set(
  fx,
  getDesertGroundHeight(fx, fz) + Math.abs(Math.sin(aTime * 4.5)) * 0.14,
  fz,
  );
  c.group.rotation.y = aTime;
  }
  }

  animateSharedWorldEntities(
  t,
  dt,
  starVisuals,
  chestVisuals,
  windRingVisuals,
  npcVisuals,
  portalMaterial,
  portalCore,
  portalLight,
  portalAwakened,
  );
  sparkles.update(dt);
  }

  return {
  worldGroup,
  portalMaterial,
  portalCore,
  portalLight,
  starVisuals,
  chestVisuals,
  mushroomVisuals,
  windRingVisuals,
  npcVisuals,
  sparkles,
  update,
  };
  }
