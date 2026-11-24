import * as THREE from 'three';
import {
CAVERN_BRIDGE_BOUNDS,
CAVERN_PORTAL_POS,
CAVERN_STALAGMITE_PILLARS,
CAVERN_WATER_LEVEL,
getCavernGroundHeight,
getCavernTrailCenterX,
type BouncyMushroomDef,
type MagicStarDef,
type NpcDef,
type SunGemDef,
type WindRingDef,
} from '../phase1Logic';
import {
applyNintendoRimLight,
createAmbientMotesPool,
createCavernFloraAndMushrooms,
} from '../nintendoVisuals';
import {
createGodRayMaterial,
createPortalMaterial,
createStylizedWaterMaterial,
createWaterfallMaterial,
} from '../shaders';
import {
createCavernBasaltTextures,
createTempleStoneTextures,
createWoodPlankTextures,
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

interface CavernCreature {
kind: 'bat' | 'firefly' | 'cavefish' | 'owl';
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

function createCrystalCluster(
colorHex: number,
emissiveHex: number,
scale = 1.0,
seed = 1,
): THREE.Group {
const cluster = new THREE.Group();
const mat = applyNintendoRimLight(
new THREE.MeshPhysicalMaterial({
color: colorHex,
emissive: emissiveHex,
emissiveIntensity: 1.02,
roughness: 0.1,
metalness: 0.25,
clearcoat: 1.0,
clearcoatRoughness: 0.08,
flatShading: true,
}),
{ colorHex: 0xffffff, power: 2.3, strength: 0.42 },
);

const shardCount = 5;
for (let i = 0; i < shardCount; i++) {
const h = (1.3 + seededRand(seed + i * 3.1) * 1.6) * scale;
const r = (0.22 + seededRand(seed + i * 5.7) * 0.22) * scale;
const shard = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mat);
const angle = (i / shardCount) * Math.PI * 2 + seededRand(seed + i) * 0.4;
const tilt = i === 0 ? 0.05 : 0.28 + seededRand(seed + i * 2) * 0.35;
shard.position.set(
Math.cos(angle) * r * 0.85,
h * 0.42,
Math.sin(angle) * r * 0.85,
);
shard.rotation.z = -Math.cos(angle) * tilt;
shard.rotation.x = Math.sin(angle) * tilt;
shard.castShadow = true;
cluster.add(shard);
}
return cluster;
}

function createTorchBrazier(): { group: THREE.Group; flame: THREE.Mesh } {
const group = new THREE.Group();
const ironMat = new THREE.MeshStandardMaterial({
color: 0x383230,
roughness: 0.5,
metalness: 0.7,
});
const post = new THREE.Mesh(
new THREE.CylinderGeometry(0.11, 0.16, 1.35, 8),
ironMat,
);
post.position.y = 0.67;
group.add(post);

const bowl = new THREE.Mesh(
new THREE.CylinderGeometry(0.32, 0.16, 0.24, 10),
ironMat,
);
bowl.position.y = 1.4;
group.add(bowl);

const flame = new THREE.Mesh(
new THREE.ConeGeometry(0.22, 0.52, 8),
new THREE.MeshBasicMaterial({ color: 0xffc145 }),
);
flame.position.y = 1.72;
group.add(flame);

return { group, flame };
}

function buildCavernCreatures(worldGroup: THREE.Group): CavernCreature[] {
const creatures: CavernCreature[] = [];

// 1. Friendly Flapping Cave Bats gliding below the stalactite ceiling
const batMat = new THREE.MeshStandardMaterial({
color: 0x4b3c66,
roughness: 0.65,
});
const batEarMat = new THREE.MeshStandardMaterial({
color: 0xffa6c9,
roughness: 0.5,
});
for (let i = 0; i < 6; i++) {
const bg = new THREE.Group();
const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), batMat);
body.scale.set(0.9, 0.9, 1.3);
bg.add(body);
for (const s of [-0.1, 0.1]) {
const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 5), batEarMat);
ear.position.set(s, 0.22, 0.1);
bg.add(ear);
}
const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.28), batMat);
leftWing.position.set(-0.35, 0.04, 0);
bg.add(leftWing);
const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.28), batMat);
rightWing.position.set(0.35, 0.04, 0);
bg.add(rightWing);

const ox = (seededRand(i * 7 + 1) - 0.5) * 44;
const oy = 13.5 + seededRand(i * 3 + 2) * 5.0;
const oz = (seededRand(i * 5 + 3) - 0.5) * 52;
bg.position.set(ox, oy, oz);
worldGroup.add(bg);
creatures.push({
kind: 'bat',
group: bg,
leftWing,
rightWing,
originX: ox,
originY: oy,
originZ: oz,
phase: i * 1.4,
radius: 5.5 + (i % 3) * 2.2,
speed: 1.15,
});
}

// 2. Glowing Giant Crystal Fireflies over the underground river & crystal lake
const fireflyMat = new THREE.MeshBasicMaterial({ color: 0x9eff80 });
const glowMat = new THREE.MeshBasicMaterial({
color: 0x56f7ff,
transparent: true,
opacity: 0.42,
});
for (let i = 0; i < 14; i++) {
const fg = new THREE.Group();
const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), fireflyMat);
fg.add(core);
const halo = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), glowMat);
fg.add(halo);

const ox = -36 + seededRand(i * 11 + 4) * 72;
const oz = -24 + seededRand(i * 17 + 8) * 52;
const oy = Math.max(CAVERN_WATER_LEVEL + 1.8, getCavernGroundHeight(ox, oz) + 1.6);
fg.position.set(ox, oy, oz);
worldGroup.add(fg);
creatures.push({
kind: 'firefly',
group: fg,
originX: ox,
originY: oy,
originZ: oz,
phase: i * 0.9,
radius: 1.8,
speed: 1.8,
});
}

// 3. Bioluminescent Cave Axolotls / Fish swimming in the West Crystal Lake
const fishMat = new THREE.MeshStandardMaterial({
color: 0x52fff0,
emissive: 0x19a3b8,
emissiveIntensity: 0.7,
roughness: 0.25,
});
for (let i = 0; i < 4; i++) {
const cg = new THREE.Group();
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 6, 10), fishMat);
torso.rotation.x = Math.PI / 2;
cg.add(torso);
const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 6), fishMat);
tail.rotation.x = Math.PI / 2;
tail.position.z = -0.42;
cg.add(tail);
const ox = -24 + (i % 2) * -6;
const oz = -10 - Math.floor(i / 2) * 8;
cg.position.set(ox, CAVERN_WATER_LEVEL + 0.08, oz);
worldGroup.add(cg);
creatures.push({
kind: 'cavefish',
group: cg,
originX: ox,
originY: CAVERN_WATER_LEVEL + 0.08,
originZ: oz,
phase: i * 1.6,
radius: 3.4,
speed: 1.25,
});
}

// 4. Gentle Cave Owls gliding under the skylight beams
const owlMat = new THREE.MeshStandardMaterial({ color: 0xf7f2e8, roughness: 0.6 });
for (let i = 0; i < 3; i++) {
const og = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.32, 6, 8), owlMat);
body.rotation.x = Math.PI / 2;
og.add(body);
const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.24), owlMat);
leftWing.position.set(-0.28, 0.04, 0);
og.add(leftWing);
const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.24), owlMat);
rightWing.position.set(0.28, 0.04, 0);
og.add(rightWing);
const ox = (i - 1) * 16;
const oy = 14.5 + i * 1.4;
const oz = -22 + i * 12;
og.position.set(ox, oy, oz);
worldGroup.add(og);
creatures.push({
kind: 'owl',
group: og,
leftWing,
rightWing,
originX: ox,
originY: oy,
originZ: oz,
phase: i * 2.1,
radius: 6.5,
speed: 0.85,
});
}

return creatures;
}

export function buildCavernWorld(
  starsDef: MagicStarDef[],
  maxAniso: number,
  gemsDef: SunGemDef[],
  bouncePadsDef: BouncyMushroomDef[],
  windRingsDef: WindRingDef[],
  npcsDef: NpcDef[],
  ): WorldBuildResult {
  const worldGroup = new THREE.Group();

  // 1. Sculpted Subterranean Basalt & Mineral Cavern Floor
  const terrainGeo = new THREE.PlaneGeometry(210, 210, 140, 140);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  posAttr.setY(i, getCavernGroundHeight(x, z));
  }
  terrainGeo.computeVertexNormals();
  const normAttr = terrainGeo.attributes.normal as THREE.BufferAttribute;

  const slateCol = new THREE.Color(0x2a2f4d);
  const deepBasaltCol = new THREE.Color(0x1b1e36);
  const mineralPathCol = new THREE.Color(0x52457a);
  const glowShoreCol = new THREE.Color(0x1d5f7a);
  const sanctuaryStoneCol = new THREE.Color(0x786552);
  const tmpCol = new THREE.Color();

  for (let i = 0; i < count; i++) {
  const x = posAttr.getX(i);
  const y = posAttr.getY(i);
  const z = posAttr.getZ(i);
  const ny = normAttr.getY(i);

  if (y < CAVERN_WATER_LEVEL + 0.9) {
  tmpCol.copy(glowShoreCol);
  } else if (ny < 0.78) {
  tmpCol.copy(deepBasaltCol).lerp(slateCol, 0.45);
  } else {
  const mix = THREE.MathUtils.clamp((y - 2.0) / 10.0, 0, 1);
  tmpCol.copy(slateCol).lerp(deepBasaltCol, mix * 0.4);

  if (z > -32 && z < 48) {
  const distTrail = Math.abs(x - getCavernTrailCenterX(z));
  const tMask = 1 - THREE.MathUtils.smoothstep(distTrail, 1.5, 4.0);
  tmpCol.lerp(mineralPathCol, tMask * 0.88);
  }

  if (Math.abs(x) < 10.5 && z < -30 && z > -68) {
  tmpCol.lerp(sanctuaryStoneCol, 0.85);
  }
  }

  colors[i * 3] = tmpCol.r;
  colors[i * 3 + 1] = tmpCol.g;
  colors[i * 3 + 2] = tmpCol.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const basaltTex = createCavernBasaltTextures(maxAniso);
  const terrainMesh = new THREE.Mesh(
  terrainGeo,
  applyNintendoRimLight(
  new THREE.MeshStandardMaterial({
  vertexColors: true,
  map: basaltTex.map,
  normalMap: basaltTex.normalMap,
  normalScale: new THREE.Vector2(1.0, 1.0),
  roughnessMap: basaltTex.roughnessMap,
  roughness: 0.84,
  metalness: 0.1,
  }),
  { colorHex: 0x62f2ff, power: 3.2, strength: 0.16 },
  ),
  );
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  // 2. Enclosed Subterranean Rock Dome Ceiling + Hanging Stalactites + Hanging Crystals + Volumetric Skylight Beams
  const domeGeo = new THREE.SphereGeometry(96, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.56);
  const dPos = domeGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < dPos.count; i++) {
  const vx = dPos.getX(i);
  const vy = dPos.getY(i);
  const vz = dPos.getZ(i);
  const bump =
  1 +
  0.07 * Math.sin(vx * 0.09 + vz * 0.07) +
  0.04 * Math.cos(vz * 0.14 - vx * 0.06);
  dPos.setXYZ(i, vx * bump, vy * 0.34 + 1.0, vz * bump);
  }
  domeGeo.computeVertexNormals();

  const ceilingMesh = new THREE.Mesh(
  domeGeo,
  new THREE.MeshStandardMaterial({
  color: 0x262b4d,
  normalMap: basaltTex.normalMap,
  normalScale: new THREE.Vector2(0.85, 0.85),
  roughness: 0.9,
  flatShading: true,
  side: THREE.BackSide,
  }),
  );
  ceilingMesh.position.y = 0;
  worldGroup.add(ceilingMesh);

  // Hanging Stalactites + Luminous Crystal Tips across the cavern roof
  const stalactiteMat = new THREE.MeshStandardMaterial({
  color: 0x3b416e,
  normalMap: basaltTex.normalMap,
  roughness: 0.8,
  flatShading: true,
  });
  const roofCrystalCyan = new THREE.MeshPhysicalMaterial({
  color: 0x52f7ff,
  emissive: 0x16a8c7,
  emissiveIntensity: 1.05,
  roughness: 0.12,
  clearcoat: 1.0,
  flatShading: true,
  });
  const roofCrystalViolet = new THREE.MeshPhysicalMaterial({
  color: 0xc978ff,
  emissive: 0x7a2cd6,
  emissiveIntensity: 1.0,
  roughness: 0.12,
  clearcoat: 1.0,
  flatShading: true,
  });
  for (let i = 0; i < 46; i++) {
  const a = seededRand(i * 3.7 + 2) * Math.PI * 2;
  const r = 8 + seededRand(i * 6.1 + 9) * 58;
  const sx = Math.cos(a) * r;
  const sz = Math.sin(a) * r - 4;
  const roofH = Math.sqrt(Math.max(100, 92 * 92 - sx * sx - sz * sz)) * 0.32 + 1.5;
  const len = 3.2 + seededRand(i * 9.3) * 5.2;
  const rad = 0.65 + seededRand(i * 4.4) * 1.15;

  const stal = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 6), stalactiteMat);
  stal.rotation.x = Math.PI;
  stal.position.set(sx, roofH - len * 0.42, sz);
  worldGroup.add(stal);

  if (i % 3 === 0) {
  const tip = new THREE.Mesh(
  new THREE.ConeGeometry(rad * 0.38, 1.85, 6),
  i % 2 === 0 ? roofCrystalCyan : roofCrystalViolet,
  );
  tip.rotation.x = Math.PI;
  tip.position.set(sx, roofH - len * 0.85, sz);
  worldGroup.add(tip);
  }
  }

  // Smooth Volumetric Fresnel Skylight Beams piercing the cavern roof
  const shaftMat = createGodRayMaterial(0x9cf4ff, 0.24);
  for (const [bx, bz, topR, botR] of [
  [0, 13, 3.4, 8.2],
  [34, -22, 3.0, 7.2],
  [0, -56, 4.0, 9.6],
  ] as Array<[number, number, number, number]>) {
  const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(topR, botR, 28, 18, 1, true),
  shaftMat,
  );
  beam.position.set(bx, 15.0, bz);
  worldGroup.add(beam);
  }

  // 3. Stylized Bioluminescent Underground River & West Crystal Lake (y = CAVERN_WATER_LEVEL = -1.2)
  const riverMat = createStylizedWaterMaterial({
  deepColorHex: 0x072b4d,
  shallowColorHex: 0x16c8e0,
  causticColorHex: 0x8afcff,
  foamColorHex: 0xc2f9ff,
  opacity: 0.9,
  flowSpeed: 0.9,
  emissiveBoost: 0.45,
  });
  const riverPlane = new THREE.Mesh(new THREE.PlaneGeometry(160, 160, 48, 48), riverMat);
  riverPlane.rotation.x = -Math.PI / 2;
  riverPlane.position.y = CAVERN_WATER_LEVEL;
  worldGroup.add(riverPlane);

  // 4. Crystal-Arch Stone Bridge over the glowing river chasm + Torch Braziers
  const stoneTex = createTempleStoneTextures(maxAniso);
  const cavernStoneMat = applyNintendoRimLight(
  new THREE.MeshStandardMaterial({
  color: 0x908ba8,
  map: stoneTex.map,
  normalMap: stoneTex.normalMap,
  normalScale: new THREE.Vector2(1.0, 1.0),
  roughnessMap: stoneTex.roughnessMap,
  roughness: 0.8,
  }),
  { colorHex: 0x8ae8ff, power: 3.0, strength: 0.2 },
  );
  const woodTex = createWoodPlankTextures(maxAniso);
  const chestWoodMat = new THREE.MeshStandardMaterial({
  color: 0xc28f5c,
  map: woodTex.map,
  normalMap: woodTex.normalMap,
  normalScale: new THREE.Vector2(0.85, 0.85),
  roughnessMap: woodTex.roughnessMap,
  roughness: 0.7,
  });

  const bridgeGroup = new THREE.Group();
  const segments = 16;
  for (let i = 0; i < segments; i++) {
  const t = i / (segments - 1);
  const pz =
  CAVERN_BRIDGE_BOUNDS.minZ +
  t * (CAVERN_BRIDGE_BOUNDS.maxZ - CAVERN_BRIDGE_BOUNDS.minZ);
  const arch = Math.sin(t * Math.PI) * 0.7;
  const slab = new THREE.Mesh(
  new THREE.BoxGeometry(7.0, 0.45, 1.05),
  cavernStoneMat,
  );
  slab.position.set(0, CAVERN_BRIDGE_BOUNDS.deckY + arch - 0.2, pz);
  slab.castShadow = true;
  slab.receiveShadow = true;
  bridgeGroup.add(slab);
  }
  const torchFlames: THREE.Mesh[] = [];
  for (const sx of [-3.2, 3.2]) {
  for (const sz of [CAVERN_BRIDGE_BOUNDS.minZ + 1, 13.0, CAVERN_BRIDGE_BOUNDS.maxZ - 1]) {
  const arch =
  Math.sin(
  ((sz - CAVERN_BRIDGE_BOUNDS.minZ) /
  (CAVERN_BRIDGE_BOUNDS.maxZ - CAVERN_BRIDGE_BOUNDS.minZ)) *
  Math.PI,
  ) * 0.7;
  const tb = createTorchBrazier();
  tb.group.position.set(sx, CAVERN_BRIDGE_BOUNDS.deckY + arch, sz);
  bridgeGroup.add(tb.group);
  torchFlames.push(tb.flame);
  }
  }
  const bridgeLight = new THREE.PointLight(0xffaa44, 5.5, 28, 1.6);
  bridgeLight.position.set(0, 7.5, 13.0);
  worldGroup.add(bridgeLight);
  worldGroup.add(bridgeGroup);

  // 5. Walkable Amethyst Stalagmite Columns across the West Crystal Lake
  const capRingMat = new THREE.MeshBasicMaterial({ color: 0xd19eff });
  for (const p of CAVERN_STALAGMITE_PILLARS) {
  const col = new THREE.Mesh(
  new THREE.CylinderGeometry(p.radius, p.radius * 1.25, p.topY + 3.2, 10),
  cavernStoneMat,
  );
  col.position.set(p.x, (p.topY - 3.2) * 0.5, p.z);
  col.castShadow = true;
  col.receiveShadow = true;
  worldGroup.add(col);

  const glowRing = new THREE.Mesh(
  new THREE.TorusGeometry(p.radius * 0.88, 0.08, 6, 20),
  capRingMat,
  );
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.set(p.x, p.topY + 0.04, p.z);
  worldGroup.add(glowRing);
  }

  // 6. Glowing Giant Crystal Clusters around the Cavern
  const crystalLocations: Array<[number, number, number, number, number]> = [
  [-12, 42, 0x3bf0ff, 0x138aa8, 1.3],
  [12, 38, 0xc26eff, 0x6b20ad, 1.4],
  [-14, 24, 0xc26eff, 0x6b20ad, 1.2],
  [15, 22, 0x3bf0ff, 0x138aa8, 1.5],
  [-38, -28, 0x3bf0ff, 0x138aa8, 1.8],
  [39, -25, 0xc26eff, 0x6b20ad, 1.9],
  [29, -18, 0x52ffbb, 0x129968, 1.4],
  [-22, -38, 0x3bf0ff, 0x138aa8, 1.7],
  [22, -38, 0xc26eff, 0x6b20ad, 1.7],
  [-46, 6, 0x52ffbb, 0x129968, 1.8],
  [46, 4, 0xffc857, 0xb86e00, 1.6],
  [-10, -56, 0xffc857, 0xb86e00, 1.5],
  [10, -56, 0x3bf0ff, 0x138aa8, 1.5],
  ];
  crystalLocations.forEach(([cx, cz, col, em, sc], idx) => {
  const cy = getCavernGroundHeight(cx, cz);
  const cluster = createCrystalCluster(col, em, sc, idx + 1);
  cluster.position.set(cx, cy - 0.15, cz);
  worldGroup.add(cluster);
  });

  // Ambient colored cave lights so everything is vivid and readable
  const lakeLight = new THREE.PointLight(0x38e2ff, 6.0, 36, 1.4);
  lakeLight.position.set(-26, 6.5, -15);
  worldGroup.add(lakeLight);

  const galleryLight = new THREE.PointLight(0xc278ff, 6.5, 36, 1.4);
  galleryLight.position.set(34, 17.0, -22);
  worldGroup.add(galleryLight);

  // 7. Subterranean Luminous Waterfall pouring into the East Chasm
  const waterfallMaterial = createWaterfallMaterial();
  const wfMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(5.2, 16.0, 1, 12),
  waterfallMaterial,
  );
  wfMesh.position.set(43.5, 8.2, -14.0);
  wfMesh.rotation.y = -0.7;
  worldGroup.add(wfMesh);

  // 8. North Petra-Style Rock-Cut Sanctuary & Second Golden Portal
  const sanctuaryMat = applyNintendoRimLight(
  new THREE.MeshStandardMaterial({
  color: 0xc99f72,
  map: stoneTex.map,
  normalMap: stoneTex.normalMap,
  normalScale: new THREE.Vector2(1.0, 1.0),
  roughnessMap: stoneTex.roughnessMap,
  roughness: 0.76,
  }),
  { colorHex: 0xffd58f, power: 2.8, strength: 0.22 },
  );
  const sancGroup = new THREE.Group();
  sancGroup.position.set(CAVERN_PORTAL_POS.x, 8.8, CAVERN_PORTAL_POS.z);

  // Carved cliff backdrop & pediment
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(16.5, 9.2, 4.2), sanctuaryMat);
  backWall.position.set(0, 4.2, -2.0);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  sancGroup.add(backWall);

  for (const sx of [-6.0, -3.2, 3.2, 6.0]) {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 6.4, 12), sanctuaryMat);
  col.position.set(sx, 3.2, 0.8);
  col.castShadow = true;
  sancGroup.add(col);
  }
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(14.5, 1.2, 2.4), sanctuaryMat);
  architrave.position.set(0, 6.8, 0.9);
  sancGroup.add(architrave);

  const pediment = new THREE.Mesh(new THREE.ConeGeometry(6.8, 2.4, 4), sanctuaryMat);
  pediment.rotation.y = Math.PI / 4;
  pediment.scale.set(1.2, 1.0, 0.35);
  pediment.position.set(0, 8.4, 0.9);
  sancGroup.add(pediment);

  for (const sx of [-4.5, 4.5]) {
  const tb = createTorchBrazier();
  tb.group.position.set(sx, 2.2, 2.5);
  sancGroup.add(tb.group);
  torchFlames.push(tb.flame);
  }

  const portalMaterial = createPortalMaterial();
  const portalPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.7), portalMaterial);
  portalPlane.position.set(0, 2.7, 1.15);
  sancGroup.add(portalPlane);

  const portalCore = new THREE.Mesh(
  new THREE.PlaneGeometry(2.8, 3.8),
  new THREE.MeshBasicMaterial({
  color: 0xffd25e,
  transparent: true,
  opacity: 0.78,
  side: THREE.DoubleSide,
  }),
  );
  portalCore.position.set(0, 2.7, 0.95);
  sancGroup.add(portalCore);

  const portalLight = new THREE.PointLight(0xffb83d, 8.0, 32, 1.4);
  portalLight.position.set(0, 3.0, 3.2);
  sancGroup.add(portalLight);
  worldGroup.add(sancGroup);

  // 9. Crystal Thermal Geyser Bounce Pads
  const mushroomVisuals: MushroomVisual[] = bouncePadsDef.map((m) => {
  const group = new THREE.Group();
  group.position.set(m.x, m.y, m.z);

  const baseRing = new THREE.Mesh(
  new THREE.CylinderGeometry(m.radius * 0.95, m.radius * 1.15, 0.45, 14),
  cavernStoneMat,
  );
  baseRing.position.y = 0.2;
  group.add(baseRing);

  const capGroup = new THREE.Group();
  capGroup.position.y = 0.45;
  const glowingPad = new THREE.Mesh(
  new THREE.CylinderGeometry(m.radius * 0.78, m.radius * 0.78, 0.28, 16),
  new THREE.MeshStandardMaterial({
  color: m.capColor,
  emissive: m.capColor,
  emissiveIntensity: 0.85,
  roughness: 0.2,
  }),
  );
  capGroup.add(glowingPad);

  const jet = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 0.9, 2.8, 12, 1, true),
  new THREE.MeshBasicMaterial({
  color: m.capColor,
  transparent: true,
  opacity: 0.34,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  }),
  );
  jet.position.y = 1.4;
  capGroup.add(jet);

  group.add(capGroup);
  worldGroup.add(group);
  return { id: m.id, group, capGroup, baseY: m.y, bounceAnim: 0 };
  });

  // 10. Bioluminescent Cavern Flora, Crystal Spores, Stars, Chests, Wind Rings & NPCs
  const windUniform = { value: 0 };
  createCavernFloraAndMushrooms(
  worldGroup,
  getCavernGroundHeight,
  getCavernTrailCenterX,
  CAVERN_WATER_LEVEL,
  windUniform,
  );

  const motes = createAmbientMotesPool({
  count: 210,
  boundsX: [-56, 56],
  boundsY: [0, 19.0],
  boundsZ: [-62, 54],
  primaryHex: 0x62f5ff,
  secondaryHex: 0xd696ff,
  size: 0.36,
  opacity: 0.82,
  speed: 0.6,
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
  0x62f2ff,
  0xffd54f,
  );
  const npcVisuals = npcsDef.map((n) => {
  const nv = createFriendlyNpcMesh(n);
  worldGroup.add(nv.group);
  return nv;
  });
  const creatures = buildCavernCreatures(worldGroup);

  const sparkles = createSparklePool(280);
  worldGroup.add(sparkles.points);

  function update(t: number, dt: number, portalAwakened: boolean): void {
  waterfallMaterial.uniforms.uTime.value = t;
  riverMat.uniforms.uTime.value = t;
  shaftMat.uniforms.uTime.value = t;
  windUniform.value = t;
  motes.update(t, dt);

  for (let i = 0; i < torchFlames.length; i++) {
  const f = torchFlames[i];
  const pulse = 0.85 + Math.sin(t * 14 + i * 1.9) * 0.2;
  f.scale.set(1, pulse, 1);
  }

  for (const mv of mushroomVisuals) {
  if (mv.bounceAnim > 0) {
  mv.bounceAnim = Math.max(0, mv.bounceAnim - dt * 3.5);
  const s = 1 + Math.sin(mv.bounceAnim * Math.PI * 3) * 0.32 * mv.bounceAnim;
  mv.capGroup.scale.set(s, 1.4, s);
  } else {
  mv.capGroup.scale.set(1, 1 + Math.sin(t * 4 + mv.id) * 0.08, 1);
  }
  }

  for (const c of creatures) {
  const aTime = t * c.speed + c.phase;
  if (c.kind === 'bat' || c.kind === 'owl') {
  c.group.position.x = c.originX + Math.cos(aTime) * c.radius;
  c.group.position.z = c.originZ + Math.sin(aTime) * c.radius;
  c.group.position.y = c.originY + Math.sin(aTime * 2.2) * 0.65;
  c.group.rotation.y = -aTime;
  const flap = Math.sin(t * (c.kind === 'bat' ? 14 : 9) + c.phase) * 0.58;
  if (c.leftWing) c.leftWing.rotation.z = flap;
  if (c.rightWing) c.rightWing.rotation.z = -flap;
  } else if (c.kind === 'firefly') {
  c.group.position.x = c.originX + Math.sin(aTime) * c.radius;
  c.group.position.y = c.originY + Math.sin(aTime * 1.6) * 0.55;
  c.group.position.z = c.originZ + Math.cos(aTime * 0.8) * c.radius;
  } else if (c.kind === 'cavefish') {
  c.group.position.x = c.originX + Math.cos(aTime) * c.radius;
  c.group.position.z = c.originZ + Math.sin(aTime) * c.radius;
  c.group.rotation.y = -aTime;
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