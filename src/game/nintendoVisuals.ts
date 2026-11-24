import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { SolidCollider } from './phase1Logic';
import { createSparkleTexture } from './textures';

export interface RimLightOptions {
colorHex: number;
power?: number;
strength?: number;
}

export interface WorldEnvironmentHandle {
texture: THREE.Texture;
dispose: () => void;
}

export interface AmbientMotesPool {
points: THREE.Points;
update: (t: number, dt: number) => void;
}

function hashSeed(seed: number): number {
const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
return s - Math.floor(s);
}

/**
* Adds a clean Nintendo-style sunlit Fresnel rim glow onto MeshStandardMaterial or
* MeshPhysicalMaterial using tone-mapped & fog-aware outgoingLight modulation.
*/
export function applyNintendoRimLight<
T extends THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
>(mat: T, options: RimLightOptions): T {
const color = new THREE.Color(options.colorHex);
const power = options.power ?? 2.6;
const strength = options.strength ?? 0.34;
const prevCompile = mat.onBeforeCompile;
const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
const tag = `nintendo_rim_${color.getHexString()}_${power.toFixed(2)}_${strength.toFixed(2)}`;

mat.customProgramCacheKey = () => `${prevKey}|${tag}`;
mat.onBeforeCompile = (shader, renderer) => {
if (prevCompile) {
prevCompile.call(mat, shader, renderer);
}
shader.uniforms.uRimColor = { value: color };
shader.uniforms.uRimPower = { value: power };
shader.uniforms.uRimStrength = { value: strength };

shader.fragmentShader = shader.fragmentShader
.replace(
'#include <common>',
`#include <common>
uniform vec3 uRimColor;
uniform float uRimPower;
uniform float uRimStrength;`,
)
.replace(
'#include <opaque_fragment>',
`float nintendoRimDot = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
outgoingLight += uRimColor * (pow(nintendoRimDot, uRimPower) * uRimStrength);
#include <opaque_fragment>`,
);
};
mat.needsUpdate = true;
return mat;
}

/**
* Attaches GPU vertex wind sway (compatible with InstancedMesh & static meshes)
* before Three.js project_vertex.
*/
export function createWindSwayMaterial(
baseParams: THREE.MeshStandardMaterialParameters,
windTimeUniform: { value: number },
swayStrength = 1.0,
): THREE.MeshStandardMaterial {
const mat = new THREE.MeshStandardMaterial(baseParams);
const tag = `wind_sway_${swayStrength.toFixed(2)}`;
mat.customProgramCacheKey = () => tag;
mat.onBeforeCompile = (shader) => {
shader.uniforms.uWindTime = windTimeUniform;
shader.uniforms.uWindStrength = { value: swayStrength };

shader.vertexShader = shader.vertexShader
.replace(
'#include <common>',
`#include <common>
uniform float uWindTime;
uniform float uWindStrength;`,
)
.replace(
'#include <begin_vertex>',
`#include <begin_vertex>
float windTip = clamp(position.y, 0.0, 2.2);
float windBend = windTip * windTip;
#ifdef USE_INSTANCING
float wPhase = instanceMatrix[3][0] * 0.42 + instanceMatrix[3][2] * 0.36;
transformed.x += sin(uWindTime * 2.4 + wPhase) * 0.14 * uWindStrength * windBend;
transformed.z += cos(uWindTime * 1.85 + wPhase * 1.25) * 0.08 * uWindStrength * windBend;
#else
transformed.x += sin(uWindTime * 2.4 + position.x * 0.4) * 0.12 * uWindStrength * windBend;
#endif`,
);
};
return mat;
}

/**
* Generates a bright, palette-matched PMREM studio/sky environment map per world
* so metals, crystals, eyes, skin, and water catch lively Nintendo highlights.
*/
export function createWorldEnvironmentMap(
renderer: THREE.WebGLRenderer,
worldId: 1 | 2 | 3,
): WorldEnvironmentHandle {
const envScene = new THREE.Scene();

const configs: Record<
1 | 2 | 3,
{ top: number; horizon: number; ground: number; sun: number; accent: number }
> = {
1: {
top: 0x3b9eff,
horizon: 0xa6e8ff,
ground: 0x3f8f47,
sun: 0xffe4a8,
accent: 0x2ed4c8,
},
2: {
top: 0x26296b,
horizon: 0x4558b5,
ground: 0x1a2d4f,
sun: 0x70f5ff,
accent: 0xc878ff,
},
3: {
top: 0x5ba8eb,
horizon: 0xf7d8a3,
ground: 0xb87a3d,
sun: 0xffe7b3,
accent: 0xffa64d,
},
};

const c = configs[worldId];

const dome = new THREE.Mesh(
new THREE.SphereGeometry(20, 16, 12),
new THREE.MeshBasicMaterial({ color: c.horizon, side: THREE.BackSide }),
);
envScene.add(dome);

const skyCap = new THREE.Mesh(
new THREE.CircleGeometry(14, 16),
new THREE.MeshBasicMaterial({ color: c.top, side: THREE.DoubleSide }),
);
skyCap.rotation.x = Math.PI / 2;
skyCap.position.y = 10;
envScene.add(skyCap);

const groundBounce = new THREE.Mesh(
new THREE.CircleGeometry(16, 16),
new THREE.MeshBasicMaterial({ color: c.ground, side: THREE.DoubleSide }),
);
groundBounce.rotation.x = -Math.PI / 2;
groundBounce.position.y = -9;
envScene.add(groundBounce);

const sunPanel = new THREE.Mesh(
new THREE.PlaneGeometry(10, 10),
new THREE.MeshBasicMaterial({ color: c.sun, side: THREE.DoubleSide }),
);
sunPanel.position.set(8, 10, -8);
sunPanel.lookAt(0, 0, 0);
envScene.add(sunPanel);

const accentPanel = new THREE.Mesh(
new THREE.PlaneGeometry(10, 8),
new THREE.MeshBasicMaterial({ color: c.accent, side: THREE.DoubleSide }),
);
accentPanel.position.set(-10, 3, 9);
accentPanel.lookAt(0, 0, 0);
envScene.add(accentPanel);

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const target = pmrem.fromScene(envScene, 0.045);
pmrem.dispose();

envScene.traverse((obj) => {
if (obj instanceof THREE.Mesh) {
obj.geometry.dispose();
(obj.material as THREE.Material).dispose();
}
});

return {
texture: target.texture,
dispose: () => target.dispose(),
};
}

function buildGrassTuftGeometry(
bladeCount = 5,
bladeH = 0.72,
bladeW = 0.13,
): THREE.BufferGeometry {
const parts: THREE.BufferGeometry[] = [];
for (let i = 0; i < bladeCount; i++) {
const blade = new THREE.PlaneGeometry(bladeW, bladeH, 1, 3);
const pos = blade.attributes.position as THREE.BufferAttribute;
for (let v = 0; v < pos.count; v++) {
const lx = pos.getX(v);
const ly = pos.getY(v) + bladeH * 0.5;
const frac = Math.max(0, ly / bladeH);
const taper = 1.0 - frac * 0.85;
const bend = frac * frac * 0.18;
pos.setXYZ(v, lx * taper, ly, bend);
}
blade.computeVertexNormals();
const angle = (i / bladeCount) * Math.PI * 2 + (i % 2) * 0.25;
blade.rotateY(angle);
blade.translate(Math.cos(angle) * 0.08, 0, Math.sin(angle) * 0.08);
parts.push(blade);
}
return mergeGeometries(parts) || parts[0];
}

function buildFlowerBlossomGeometry(): THREE.BufferGeometry {
const petals: THREE.BufferGeometry[] = [];
const petalShape = new THREE.Shape();
petalShape.moveTo(0, 0);
petalShape.quadraticCurveTo(0.09, 0.08, 0, 0.22);
petalShape.quadraticCurveTo(-0.09, 0.08, 0, 0);

const basePetal = new THREE.ShapeGeometry(petalShape, 5);
basePetal.rotateX(-Math.PI * 0.36);

for (let i = 0; i < 5; i++) {
const p = basePetal.clone();
p.rotateY((i / 5) * Math.PI * 2);
p.translate(0, 0.42, 0);
petals.push(p);
}
const merged = mergeGeometries(petals) || basePetal;
merged.computeVertexNormals();
return merged;
}

/**
* Populates World 1 grassy hills & meadows with GPU wind-swaying grass tufts
* and 5-petal tropical wildflowers in just 3 draw calls.
*/
export function createTropicalGrassAndFlowers(
worldGroup: THREE.Group,
groundFn: (x: number, z: number) => number,
trailFn: (z: number) => number,
windUniform: { value: number },
): void {
const maxGrass = 640;
const grassGeo = buildGrassTuftGeometry(5, 0.78, 0.14);
const grassMat = createWindSwayMaterial(
{
color: 0xffffff,
roughness: 0.76,
side: THREE.DoubleSide,
},
windUniform,
1.15,
);
applyNintendoRimLight(grassMat, { colorHex: 0xd9ff85, power: 2.8, strength: 0.28 });

const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, maxGrass);
grassMesh.receiveShadow = true;

const maxFlowers = 140;
const stemGeo = new THREE.CylinderGeometry(0.022, 0.03, 0.44, 5);
stemGeo.translate(0, 0.22, 0);
const stemMat = createWindSwayMaterial(
{ color: 0x2c8a36, roughness: 0.72 },
windUniform,
1.0,
);
const stemMesh = new THREE.InstancedMesh(stemGeo, stemMat, maxFlowers);

const blossomGeo = buildFlowerBlossomGeometry();
const blossomMat = createWindSwayMaterial(
{
color: 0xffffff,
emissive: 0x2a140c,
emissiveIntensity: 0.14,
roughness: 0.55,
side: THREE.DoubleSide,
},
windUniform,
1.0,
);
const blossomMesh = new THREE.InstancedMesh(blossomGeo, blossomMat, maxFlowers);

const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const flowerPalette = [0xff6b8b, 0xffd23f, 0xff934f, 0xfff8dc, 0xe879f9];

let gIdx = 0;
let fIdx = 0;
for (let i = 0; i < 1500 && gIdx < maxGrass; i++) {
const a = hashSeed(i * 4.17 + 1.3) * Math.PI * 2;
const r = 4.5 + Math.sqrt(hashSeed(i * 7.83 + 5.1)) * 52;
const x = Math.cos(a) * r + 1.5;
const z = Math.sin(a) * r - 4.0;

if (z > -29 && z < 52 && Math.abs(x - trailFn(z)) < 3.1) continue;
if (Math.abs(x) < 9.5 && z < -30 && z > -68) continue;

const y = groundFn(x, z);
if (y < 1.35) continue;

const slopeSample = Math.abs(groundFn(x + 0.8, z) - y) + Math.abs(groundFn(x, z + 0.8) - y);
if (slopeSample > 0.78) continue;

const sc = 0.78 + hashSeed(i * 2.91) * 0.75;
dummy.position.set(x, y - 0.04, z);
dummy.rotation.set(
(hashSeed(i + 3) - 0.5) * 0.12,
hashSeed(i + 9) * Math.PI * 2,
(hashSeed(i + 15) - 0.5) * 0.12,
);
dummy.scale.set(sc, sc * (0.85 + hashSeed(i + 21) * 0.45), sc);
dummy.updateMatrix();
grassMesh.setMatrixAt(gIdx, dummy.matrix);

tint.setHSL(
0.27 + (hashSeed(i + 31) - 0.5) * 0.06,
0.66 + hashSeed(i + 37) * 0.18,
0.28 + hashSeed(i + 41) * 0.16,
);
grassMesh.setColorAt(gIdx, tint);
gIdx++;

if (i % 6 === 0 && fIdx < maxFlowers) {
const fSc = 0.85 + hashSeed(i + 55) * 0.55;
dummy.position.set(x + 0.25, y - 0.02, z - 0.2);
dummy.rotation.set(0, hashSeed(i + 61) * Math.PI * 2, 0);
dummy.scale.setScalar(fSc);
dummy.updateMatrix();
stemMesh.setMatrixAt(fIdx, dummy.matrix);
blossomMesh.setMatrixAt(fIdx, dummy.matrix);
tint.setHex(flowerPalette[fIdx % flowerPalette.length]);
blossomMesh.setColorAt(fIdx, tint);
fIdx++;
}
}

grassMesh.count = gIdx;
if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
grassMesh.computeBoundingSphere();
worldGroup.add(grassMesh);

stemMesh.count = fIdx;
stemMesh.computeBoundingSphere();
worldGroup.add(stemMesh);

blossomMesh.count = fIdx;
if (blossomMesh.instanceColor) blossomMesh.instanceColor.needsUpdate = true;
blossomMesh.computeBoundingSphere();
worldGroup.add(blossomMesh);
}

/**
* Populates World 2 crystal caverns with glowing subterranean moss tufts
* and clusters of bioluminescent fairy mushrooms along riverbanks and terraces.
*/
export function createCavernFloraAndMushrooms(
worldGroup: THREE.Group,
groundFn: (x: number, z: number) => number,
trailFn: (z: number) => number,
waterLevel: number,
windUniform: { value: number },
): void {
const maxMoss = 240;
const mossGeo = buildGrassTuftGeometry(4, 0.56, 0.13);
const mossMat = createWindSwayMaterial(
{
color: 0xffffff,
emissive: 0x1a7885,
emissiveIntensity: 0.42,
roughness: 0.52,
side: THREE.DoubleSide,
},
windUniform,
0.45,
);
const mossMesh = new THREE.InstancedMesh(mossGeo, mossMat, maxMoss);

const maxShrooms = 95;
const stemGeo = new THREE.CylinderGeometry(0.055, 0.085, 0.38, 7);
stemGeo.translate(0, 0.19, 0);
const stemMat = new THREE.MeshStandardMaterial({
color: 0xdff5ff,
emissive: 0x224c66,
emissiveIntensity: 0.35,
roughness: 0.45,
});
const capGeo = new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58);
capGeo.scale(1, 0.72, 1);
capGeo.translate(0, 0.36, 0);
const capMat = new THREE.MeshStandardMaterial({
color: 0xffffff,
emissive: 0x3ef0ff,
emissiveIntensity: 0.75,
roughness: 0.25,
});
const stemMesh = new THREE.InstancedMesh(stemGeo, stemMat, maxShrooms);
const capMesh = new THREE.InstancedMesh(capGeo, capMat, maxShrooms);

const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const capColors = [0x48f5ff, 0xc97eff, 0x5dffb8, 0xffd166];

let mIdx = 0;
let sIdx = 0;
for (let i = 0; i < 820 && mIdx < maxMoss; i++) {
const a = hashSeed(i * 3.31 + 2.7) * Math.PI * 2;
const r = 5 + Math.sqrt(hashSeed(i * 5.91 + 1.9)) * 46;
const x = Math.cos(a) * r;
const z = Math.sin(a) * r - 4;
if (z > -32 && z < 48 && Math.abs(x - trailFn(z)) < 3.4) continue;
if (Math.abs(x) < 10.5 && z < -30 && z > -68) continue;

const y = groundFn(x, z);
if (y < waterLevel + 0.45) continue;

const sc = 0.7 + hashSeed(i + 12) * 0.75;
dummy.position.set(x, y - 0.03, z);
dummy.rotation.set(0, hashSeed(i + 7) * Math.PI * 2, 0);
dummy.scale.setScalar(sc);
dummy.updateMatrix();
mossMesh.setMatrixAt(mIdx, dummy.matrix);
tint.setHSL(0.49 + hashSeed(i + 19) * 0.22, 0.72, 0.38);
mossMesh.setColorAt(mIdx, tint);
mIdx++;

if (i % 5 === 0 && sIdx < maxShrooms) {
const ssc = 0.75 + hashSeed(i + 44) * 0.9;
dummy.position.set(x + 0.2, y - 0.02, z + 0.2);
dummy.rotation.set(
(hashSeed(i + 3) - 0.5) * 0.2,
hashSeed(i + 8) * Math.PI * 2,
(hashSeed(i + 11) - 0.5) * 0.2,
);
dummy.scale.setScalar(ssc);
dummy.updateMatrix();
stemMesh.setMatrixAt(sIdx, dummy.matrix);
capMesh.setMatrixAt(sIdx, dummy.matrix);
tint.setHex(capColors[sIdx % capColors.length]);
capMesh.setColorAt(sIdx, tint);
sIdx++;
}
}

mossMesh.count = mIdx;
if (mossMesh.instanceColor) mossMesh.instanceColor.needsUpdate = true;
mossMesh.computeBoundingSphere();
worldGroup.add(mossMesh);

stemMesh.count = sIdx;
stemMesh.computeBoundingSphere();
worldGroup.add(stemMesh);

capMesh.count = sIdx;
if (capMesh.instanceColor) capMesh.instanceColor.needsUpdate = true;
capMesh.computeBoundingSphere();
worldGroup.add(capMesh);
}

function buildSaguaroGeometry(): THREE.BufferGeometry {
const trunk = new THREE.CapsuleGeometry(0.28, 1.85, 6, 10);
trunk.translate(0, 1.15, 0);

const armL1 = new THREE.CapsuleGeometry(0.18, 0.55, 5, 8);
armL1.rotateZ(Math.PI * 0.35);
armL1.translate(-0.42, 1.25, 0);
const armL2 = new THREE.CapsuleGeometry(0.18, 0.65, 5, 8);
armL2.translate(-0.62, 1.65, 0);

const armR1 = new THREE.CapsuleGeometry(0.17, 0.48, 5, 8);
armR1.rotateZ(-Math.PI * 0.34);
armR1.translate(0.4, 1.48, 0);
const armR2 = new THREE.CapsuleGeometry(0.17, 0.52, 5, 8);
armR2.translate(0.58, 1.8, 0);

return mergeGeometries([trunk, armL1, armL2, armR1, armR2]) || trunk;
}

/**
* Populates World 3 with swaying emerald/golden oasis reeds around the spring
* and sculpted multi-arm cacti across sunny desert dunes.
*/
export function createDesertFloraAndCacti(
worldGroup: THREE.Group,
groundFn: (x: number, z: number) => number,
canyonFn: (z: number) => number,
oasisCenter: { x: number; z: number },
pyramidCenter: { x: number; z: number },
windUniform: { value: number },
): SolidCollider[] {
const maxReeds = 260;
const reedGeo = buildGrassTuftGeometry(5, 0.92, 0.14);
const reedMat = createWindSwayMaterial(
{ color: 0xffffff, roughness: 0.72, side: THREE.DoubleSide },
windUniform,
1.1,
);
applyNintendoRimLight(reedMat, { colorHex: 0xffe48f, power: 2.6, strength: 0.3 });
const reedMesh = new THREE.InstancedMesh(reedGeo, reedMat, maxReeds);

const cactusCount = 44;
const cactusGeo = buildSaguaroGeometry();
const cactusMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({ color: 0x3b8c42, roughness: 0.78 }),
{ colorHex: 0xd6ff96, power: 2.5, strength: 0.32 },
);
const cactusMesh = new THREE.InstancedMesh(cactusGeo, cactusMat, cactusCount);
cactusMesh.castShadow = true;
cactusMesh.receiveShadow = true;

const bloomGeo = new THREE.SphereGeometry(0.14, 7, 7);
bloomGeo.translate(0, 2.38, 0);
const bloomMat = new THREE.MeshStandardMaterial({
color: 0xff6f8e,
emissive: 0xaa2e45,
emissiveIntensity: 0.35,
roughness: 0.5,
});
const bloomMesh = new THREE.InstancedMesh(bloomGeo, bloomMat, cactusCount);

const dummy = new THREE.Object3D();
const tint = new THREE.Color();

// Ring of lush reeds around the Oasis lagoon + sunny trailside grass clumps
let rIdx = 0;
for (let i = 0; i < 420 && rIdx < maxReeds; i++) {
const aroundOasis = i < 200;
let rx: number;
let rz: number;
if (aroundOasis) {
const ang = hashSeed(i * 2.13 + 3.1) * Math.PI * 2;
const rad = 8.4 + hashSeed(i * 4.71 + 7.4) * 6.8;
rx = oasisCenter.x + Math.cos(ang) * rad;
rz = oasisCenter.z + Math.sin(ang) * rad;
} else {
rx = (hashSeed(i * 3.7) - 0.5) * 90;
rz = -26 + hashSeed(i * 6.1) * 76;
if (Math.abs(rx - canyonFn(rz)) < 4.5) continue;
}

const ry = groundFn(rx, rz);
if (ry < 0.7 || ry > 7.5) continue;

const sc = 0.8 + hashSeed(i + 15) * 0.75;
dummy.position.set(rx, ry - 0.05, rz);
dummy.rotation.set(0, hashSeed(i + 29) * Math.PI * 2, 0);
dummy.scale.setScalar(sc);
dummy.updateMatrix();
reedMesh.setMatrixAt(rIdx, dummy.matrix);
tint.setHSL(
aroundOasis ? 0.25 + hashSeed(i + 41) * 0.07 : 0.14 + hashSeed(i + 41) * 0.06,
0.58,
aroundOasis ? 0.34 : 0.44,
);
reedMesh.setColorAt(rIdx, tint);
rIdx++;
}
reedMesh.count = rIdx;
if (reedMesh.instanceColor) reedMesh.instanceColor.needsUpdate = true;
reedMesh.computeBoundingSphere();
worldGroup.add(reedMesh);

let cIdx = 0;
const cactiColliders: SolidCollider[] = [];
for (let i = 0; i < 160 && cIdx < cactusCount; i++) {
const ang = hashSeed(i * 3.91 + 4.4) * Math.PI * 2;
const rad = 11 + hashSeed(i * 6.43 + 1.8) * 44;
const cx = Math.cos(ang) * rad;
const cz = Math.sin(ang) * rad;

if (cz > -32 && cz < 52 && Math.abs(cx - canyonFn(cz)) < 5.2) continue;
if (Math.hypot(cx - oasisCenter.x, cz - oasisCenter.z) < 13.5) continue;
if (Math.hypot(cx - pyramidCenter.x, cz - pyramidCenter.z) < 13.0) continue;
if (Math.abs(cx) < 11.5 && cz < -30) continue;

const cy = groundFn(cx, cz);
if (cy < 1.2 || cy > 7.8) continue;

const sc = 0.78 + hashSeed(i + 77) * 0.68;
dummy.position.set(cx, cy - 0.08, cz);
dummy.rotation.set(0, hashSeed(i + 83) * Math.PI * 2, 0);
dummy.scale.setScalar(sc);
dummy.updateMatrix();
cactusMesh.setMatrixAt(cIdx, dummy.matrix);
bloomMesh.setMatrixAt(cIdx, dummy.matrix);
cactiColliders.push({
x: cx,
z: cz,
radius: 0.58 * sc,
minY: cy - 0.4,
maxY: cy + 2.4 * sc,
kind: 'cactus',
});
cIdx++;
}
cactusMesh.count = cIdx;
cactusMesh.computeBoundingSphere();
worldGroup.add(cactusMesh);

bloomMesh.count = cIdx;
bloomMesh.computeBoundingSphere();
worldGroup.add(bloomMesh);
return cactiColliders;
}

/**
* Ambient world-wide drifting motes (golden pollen, glowing cave spores, or sunlit desert dust)
* rendered with 1 additive Points draw call for Nintendo cinematic depth.
*/
export function createAmbientMotesPool(options: {
count: number;
boundsX: [number, number];
boundsY: [number, number];
boundsZ: [number, number];
primaryHex: number;
secondaryHex: number;
size?: number;
opacity?: number;
speed?: number;
}): AmbientMotesPool {
const {
count,
boundsX,
boundsY,
boundsZ,
primaryHex,
secondaryHex,
size = 0.32,
opacity = 0.75,
speed = 0.8,
} = options;

const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const phases = new Float32Array(count);

const c1 = new THREE.Color(primaryHex);
const c2 = new THREE.Color(secondaryHex);
const tmp = new THREE.Color();

for (let i = 0; i < count; i++) {
const i3 = i * 3;
positions[i3] = boundsX[0] + hashSeed(i * 2.3 + 1) * (boundsX[1] - boundsX[0]);
positions[i3 + 1] = boundsY[0] + hashSeed(i * 4.7 + 3) * (boundsY[1] - boundsY[0]);
positions[i3 + 2] = boundsZ[0] + hashSeed(i * 6.1 + 5) * (boundsZ[1] - boundsZ[0]);
phases[i] = hashSeed(i * 9.3 + 7) * Math.PI * 2;

tmp.copy(i % 3 === 0 ? c2 : c1);
colors[i3] = tmp.r;
colors[i3 + 1] = tmp.g;
colors[i3 + 2] = tmp.b;
}

const geo = new THREE.BufferGeometry();
const posAttr = new THREE.BufferAttribute(positions, 3);
posAttr.setUsage(THREE.DynamicDrawUsage);
geo.setAttribute('position', posAttr);
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.PointsMaterial({
size,
map: createSparkleTexture(),
vertexColors: true,
transparent: true,
opacity,
blending: THREE.AdditiveBlending,
depthWrite: false,
sizeAttenuation: true,
});

const points = new THREE.Points(geo, mat);
points.frustumCulled = false;

const update = (t: number, dt: number): void => {
for (let i = 0; i < count; i++) {
const i3 = i * 3;
const p = phases[i];
positions[i3] += Math.sin(t * 0.7 + p) * dt * 0.45 * speed;
positions[i3 + 1] += (Math.cos(t * 0.9 + p * 1.3) * 0.35 + 0.16) * dt * speed;
positions[i3 + 2] += Math.cos(t * 0.65 + p * 0.7) * dt * 0.4 * speed;

if (positions[i3 + 1] > boundsY[1]) positions[i3 + 1] = boundsY[0];
if (positions[i3] > boundsX[1]) positions[i3] = boundsX[0];
if (positions[i3] < boundsX[0]) positions[i3] = boundsX[1];
if (positions[i3 + 2] > boundsZ[1]) positions[i3 + 2] = boundsZ[0];
if (positions[i3 + 2] < boundsZ[0]) positions[i3 + 2] = boundsZ[1];
}
posAttr.needsUpdate = true;
};

return { points, update };
}