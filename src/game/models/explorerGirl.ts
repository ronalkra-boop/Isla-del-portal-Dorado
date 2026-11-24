import * as THREE from 'three';
import { applyNintendoRimLight } from '../nintendoVisuals';
import { createClothFabricTextures, createEyeTexture } from '../textures';

export interface ExplorerRig {
root: THREE.Group;
bodyGroup: THREE.Group;
headPivot: THREE.Group;
leftBraidPivot: THREE.Group;
rightBraidPivot: THREE.Group;
leftArmPivot: THREE.Group;
rightArmPivot: THREE.Group;
leftLegPivot: THREE.Group;
rightLegPivot: THREE.Group;
scarfTailPivot: THREE.Group;
leftLid: THREE.Mesh;
rightLid: THREE.Mesh;
skirtMesh: THREE.Mesh;
flightAuraGlow: THREE.Mesh;
}

export function createExplorerGirl(): ExplorerRig {
const root = new THREE.Group();
const bodyGroup = new THREE.Group();
root.add(bodyGroup);

const clothTex = createClothFabricTextures(4);

// Calibrated Nintendo-style PBR materials with woven fabric normal relief & warm rim light
const skinMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0xf0bc96,
roughness: 0.6,
metalness: 0.02,
}),
{ colorHex: 0xffe4b8, power: 2.8, strength: 0.28 },
);
const cheekMat = new THREE.MeshStandardMaterial({
color: 0xe67c6e,
roughness: 0.72,
});
const hairMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0x381e12,
roughness: 0.66,
metalness: 0.06,
}),
{ colorHex: 0xffc68a, power: 3.0, strength: 0.26 },
);
const hairTieMat = new THREE.MeshStandardMaterial({
color: 0xc93b2b,
roughness: 0.6,
});
const hatMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0xcba872,
map: clothTex.map,
normalMap: clothTex.normalMap,
normalScale: new THREE.Vector2(0.42, 0.42),
roughness: 0.84,
metalness: 0.0,
}),
{ colorHex: 0xffe9b5, power: 2.6, strength: 0.28 },
);
const hatBandMat = new THREE.MeshStandardMaterial({
color: 0x422715,
roughness: 0.52,
});
const dressMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0xdecb9f,
map: clothTex.map,
normalMap: clothTex.normalMap,
normalScale: new THREE.Vector2(0.45, 0.45),
roughness: 0.82,
metalness: 0.0,
}),
{ colorHex: 0xfff0c8, power: 2.7, strength: 0.26 },
);
const scarfMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0xd93829,
map: clothTex.map,
normalMap: clothTex.normalMap,
normalScale: new THREE.Vector2(0.35, 0.35),
roughness: 0.7,
}),
{ colorHex: 0xffb380, power: 2.5, strength: 0.34 },
);
const beltLeatherMat = new THREE.MeshStandardMaterial({
color: 0x6b3e1f,
roughness: 0.45,
metalness: 0.08,
});
const bootLeatherMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0x7a4824,
roughness: 0.4,
metalness: 0.1,
}),
{ colorHex: 0xffd29e, power: 2.8, strength: 0.22 },
);
const soleMat = new THREE.MeshStandardMaterial({
color: 0x2b1b11,
roughness: 0.88,
});
const brassMat = new THREE.MeshPhysicalMaterial({
color: 0xebc052,
roughness: 0.22,
metalness: 0.88,
clearcoat: 0.65,
});
const packCanvasMat = new THREE.MeshStandardMaterial({
color: 0x84542e,
map: clothTex.map,
normalMap: clothTex.normalMap,
normalScale: new THREE.Vector2(0.5, 0.5),
roughness: 0.76,
});
const rollMat = new THREE.MeshStandardMaterial({
color: 0xc9a56e,
map: clothTex.map,
roughness: 0.86,
});

// 1. Legs & Boots (pivot at hip y = 0.54, boots sit flush on y = 0)
function buildLeg(side: -1 | 1): THREE.Group {
const legPivot = new THREE.Group();
legPivot.position.set(side * 0.1, 0.54, 0);

const thigh = new THREE.Mesh(
new THREE.CapsuleGeometry(0.055, 0.18, 6, 12),
skinMat,
);
thigh.position.y = -0.15;
thigh.castShadow = true;
legPivot.add(thigh);

// Boot cuff & shaft
const bootShaft = new THREE.Mesh(
new THREE.CylinderGeometry(0.068, 0.06, 0.2, 12),
bootLeatherMat,
);
bootShaft.position.y = -0.37;
bootShaft.castShadow = true;
legPivot.add(bootShaft);

const bootCuff = new THREE.Mesh(
new THREE.TorusGeometry(0.066, 0.016, 8, 14),
beltLeatherMat,
);
bootCuff.rotation.x = Math.PI / 2;
bootCuff.position.y = -0.27;
legPivot.add(bootCuff);

// Boot foot + toe box
const foot = new THREE.Mesh(
new THREE.CapsuleGeometry(0.058, 0.09, 6, 12),
bootLeatherMat,
);
foot.rotation.x = Math.PI / 2;
foot.position.set(0, -0.485, 0.045);
foot.castShadow = true;
legPivot.add(foot);

// Dark rugged boot sole sitting at y = -0.54 (so local root y=0)
const sole = new THREE.Mesh(
new THREE.BoxGeometry(0.115, 0.032, 0.21),
soleMat,
);
sole.position.set(0, -0.524, 0.042);
legPivot.add(sole);

return legPivot;
}

const leftLegPivot = buildLeg(-1);
const rightLegPivot = buildLeg(1);
bodyGroup.add(leftLegPivot, rightLegPivot);

// 2. Dress Skirt (LatheGeometry pleated flare) + Bodice + Belt
const skirtPoints = [
new THREE.Vector2(0.14, 0.34),
new THREE.Vector2(0.28, 0.0),
new THREE.Vector2(0.26, -0.02),
new THREE.Vector2(0.13, 0.32),
];
const skirtGeo = new THREE.LatheGeometry(skirtPoints, 20);
const skirtMesh = new THREE.Mesh(skirtGeo, dressMat);
skirtMesh.position.y = 0.44;
skirtMesh.castShadow = true;
skirtMesh.receiveShadow = true;
bodyGroup.add(skirtMesh);

const bodice = new THREE.Mesh(
new THREE.CylinderGeometry(0.135, 0.145, 0.28, 16),
dressMat,
);
bodice.position.y = 0.91;
bodice.castShadow = true;
bodyGroup.add(bodice);

// Dress collar & front button placket
const collar = new THREE.Mesh(
new THREE.TorusGeometry(0.115, 0.026, 8, 16),
dressMat,
);
collar.rotation.x = Math.PI / 2;
collar.position.y = 1.045;
bodyGroup.add(collar);

for (let i = 0; i < 4; i++) {
const btn = new THREE.Mesh(
new THREE.CylinderGeometry(0.015, 0.015, 0.012, 10),
brassMat,
);
btn.rotation.x = Math.PI / 2;
btn.position.set(0, 0.99 - i * 0.068, 0.142);
bodyGroup.add(btn);
}

// Leather belt & brass buckle
const belt = new THREE.Mesh(
new THREE.CylinderGeometry(0.15, 0.154, 0.068, 18),
beltLeatherMat,
);
belt.position.y = 0.775;
belt.castShadow = true;
bodyGroup.add(belt);

const buckle = new THREE.Mesh(
new THREE.BoxGeometry(0.075, 0.078, 0.03),
brassMat,
);
buckle.position.set(0, 0.775, 0.15);
bodyGroup.add(buckle);

// Golden Explorer Compass Medallion at the right hip
const compassRing = new THREE.Mesh(
new THREE.CylinderGeometry(0.042, 0.042, 0.016, 14),
brassMat,
);
compassRing.rotation.z = Math.PI / 2;
compassRing.position.set(0.165, 0.72, 0.06);
bodyGroup.add(compassRing);

const compassDial = new THREE.Mesh(
new THREE.CylinderGeometry(0.028, 0.028, 0.02, 12),
new THREE.MeshStandardMaterial({
color: 0x35e6ff,
emissive: 0x0c7a9c,
emissiveIntensity: 0.7,
roughness: 0.2,
}),
);
compassDial.rotation.z = Math.PI / 2;
compassDial.position.set(0.167, 0.72, 0.06);
bodyGroup.add(compassDial);

// Crimson Adventurer Neck Scarf + fluttering trailing tail
const scarfCollar = new THREE.Mesh(
new THREE.TorusGeometry(0.12, 0.032, 8, 18),
scarfMat,
);
scarfCollar.rotation.x = Math.PI / 2 + 0.08;
scarfCollar.position.set(0, 1.06, 0.005);
bodyGroup.add(scarfCollar);

const scarfTailPivot = new THREE.Group();
scarfTailPivot.position.set(0.055, 1.055, -0.1);
const scarfTail = new THREE.Mesh(
new THREE.ConeGeometry(0.052, 0.26, 6),
scarfMat,
);
scarfTail.scale.set(1.25, 1.0, 0.35);
scarfTail.rotation.x = -Math.PI * 0.72;
scarfTail.position.set(0, -0.06, -0.11);
scarfTail.castShadow = true;
scarfTailPivot.add(scarfTail);
bodyGroup.add(scarfTailPivot);

// 3. Explorer Backpack
const packGroup = new THREE.Group();
packGroup.position.set(0, 0.89, -0.175);
const packMain = new THREE.Mesh(
new THREE.BoxGeometry(0.24, 0.26, 0.14),
packCanvasMat,
);
packMain.castShadow = true;
packGroup.add(packMain);

const packFlap = new THREE.Mesh(
new THREE.BoxGeometry(0.25, 0.09, 0.155),
beltLeatherMat,
);
packFlap.position.set(0, 0.095, -0.005);
packGroup.add(packFlap);

const bedroll = new THREE.Mesh(
new THREE.CylinderGeometry(0.052, 0.052, 0.26, 12),
rollMat,
);
bedroll.rotation.z = Math.PI / 2;
bedroll.position.set(0, 0.175, 0.01);
packGroup.add(bedroll);

for (const s of [-0.075, 0.075]) {
const strap = new THREE.Mesh(
new THREE.BoxGeometry(0.034, 0.28, 0.19),
beltLeatherMat,
);
strap.position.set(s, 0.01, 0.12);
packGroup.add(strap);
}
bodyGroup.add(packGroup);

// 4. Articulated Arms with Puff Sleeves
function buildArm(side: -1 | 1): THREE.Group {
const armPivot = new THREE.Group();
armPivot.position.set(side * 0.175, 1.0, 0);

const puff = new THREE.Mesh(
new THREE.SphereGeometry(0.068, 12, 10),
dressMat,
);
puff.scale.set(1.0, 1.08, 1.0);
puff.castShadow = true;
armPivot.add(puff);

const forearm = new THREE.Mesh(
new THREE.CapsuleGeometry(0.04, 0.23, 6, 10),
skinMat,
);
forearm.position.set(side * 0.02, -0.165, 0);
forearm.castShadow = true;
armPivot.add(forearm);

const hand = new THREE.Mesh(
new THREE.SphereGeometry(0.046, 10, 10),
skinMat,
);
hand.position.set(side * 0.024, -0.31, 0.01);
armPivot.add(hand);

return armPivot;
}

const leftArmPivot = buildArm(-1);
const rightArmPivot = buildArm(1);
bodyGroup.add(leftArmPivot, rightArmPivot);

// 5. Expressive Stylized Head, Face, Braided Pigtails & Safari Hat
const headPivot = new THREE.Group();
headPivot.position.set(0, 1.08, 0);
bodyGroup.add(headPivot);

const neck = new THREE.Mesh(
new THREE.CylinderGeometry(0.055, 0.062, 0.08, 10),
skinMat,
);
neck.position.y = 0.02;
headPivot.add(neck);

const head = new THREE.Mesh(
new THREE.SphereGeometry(0.185, 22, 18),
skinMat,
);
head.scale.set(1.0, 1.04, 0.96);
head.position.y = 0.21;
head.castShadow = true;
headPivot.add(head);

// Ears
for (const s of [-1, 1]) {
const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat);
ear.position.set(s * 0.175, 0.2, -0.01);
headPivot.add(ear);
}

// Stylized Glossy Clearcoat Eyes + Sculpted Upper Eyelash Arches + Animated Blink Lids
const eyeTex = createEyeTexture();
const eyeMat = new THREE.MeshPhysicalMaterial({
map: eyeTex,
roughness: 0.14,
metalness: 0.04,
clearcoat: 1.0,
clearcoatRoughness: 0.06,
});
const eyelids: THREE.Mesh[] = [];
for (const s of [-1, 1]) {
const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 14), eyeMat);
eye.scale.set(0.96, 1.12, 0.68);
eye.position.set(s * 0.068, 0.225, 0.156);
eye.rotation.y = s * 0.18;
headPivot.add(eye);

const lid = new THREE.Mesh(
new THREE.SphereGeometry(0.041, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
skinMat,
);
lid.scale.set(0.98, 1.1, 0.74);
lid.position.set(s * 0.068, 0.227, 0.157);
lid.rotation.y = s * 0.18;
lid.rotation.x = -0.95;
headPivot.add(lid);
eyelids.push(lid);

// Upper eyelash arch for Pixar-style expressive eyes
const lash = new THREE.Mesh(
new THREE.TorusGeometry(0.036, 0.007, 6, 12, Math.PI * 0.9),
hairMat,
);
lash.position.set(s * 0.068, 0.232, 0.168);
lash.rotation.y = s * 0.18;
lash.rotation.z = Math.PI * 0.05;
headPivot.add(lash);

const brow = new THREE.Mesh(
new THREE.CapsuleGeometry(0.009, 0.04, 4, 6),
hairMat,
);
brow.rotation.z = Math.PI / 2 - s * 0.14;
brow.position.set(s * 0.072, 0.282, 0.162);
headPivot.add(brow);
}
const [leftLid, rightLid] = eyelids;

// Cute sculpted nose & rosy cheeks
const nose = new THREE.Mesh(
new THREE.SphereGeometry(0.021, 10, 10),
skinMat,
);
nose.scale.set(1.0, 0.88, 1.1);
nose.position.set(0, 0.19, 0.184);
headPivot.add(nose);

for (const s of [-1, 1]) {
const cheek = new THREE.Mesh(
new THREE.SphereGeometry(0.032, 10, 8),
cheekMat,
);
cheek.scale.set(1.2, 0.75, 0.4);
cheek.position.set(s * 0.105, 0.175, 0.146);
headPivot.add(cheek);
}

// Warm smile
const smile = new THREE.Mesh(
new THREE.TorusGeometry(0.036, 0.0085, 6, 12, Math.PI * 0.78),
new THREE.MeshStandardMaterial({ color: 0xb9534b, roughness: 0.5 }),
);
smile.rotation.z = Math.PI + Math.PI * 0.11;
smile.position.set(0, 0.153, 0.17);
headPivot.add(smile);

// Hair cap + temple framing locks + bangs
const hairCap = new THREE.Mesh(
new THREE.SphereGeometry(0.196, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
hairMat,
);
hairCap.position.set(0, 0.222, -0.015);
hairCap.rotation.x = -0.18;
headPivot.add(hairCap);

// Side temple locks framing the cheeks
for (const s of [-1, 1]) {
const sideLock = new THREE.Mesh(
new THREE.CapsuleGeometry(0.034, 0.11, 6, 8),
hairMat,
);
sideLock.position.set(s * 0.152, 0.21, 0.055);
sideLock.rotation.z = s * 0.18;
sideLock.rotation.x = -0.12;
headPivot.add(sideLock);
}

// Parted bangs across forehead
for (let i = -2; i <= 2; i++) {
const bang = new THREE.Mesh(
new THREE.ConeGeometry(0.038, 0.088, 8),
hairMat,
);
bang.rotation.x = Math.PI - 0.35;
bang.rotation.z = i * 0.18;
bang.position.set(i * 0.042, 0.315, 0.146 - Math.abs(i) * 0.014);
headPivot.add(bang);
}

// Segmented Braided Pigtails
function buildBraid(side: -1 | 1): THREE.Group {
const pivot = new THREE.Group();
pivot.position.set(side * 0.165, 0.21, -0.05);

const segments = 5;
for (let i = 0; i < segments; i++) {
const radius = 0.042 - i * 0.0048;
const knot = new THREE.Mesh(
new THREE.SphereGeometry(radius, 10, 8),
hairMat,
);
knot.scale.set(1.0, 1.25, 0.9);
knot.position.set(side * 0.015 * i, -i * 0.058, -i * 0.014);
knot.castShadow = true;
pivot.add(knot);
}

const tie = new THREE.Mesh(
new THREE.TorusGeometry(0.025, 0.008, 6, 12),
hairTieMat,
);
tie.rotation.x = Math.PI / 2;
tie.position.set(side * 0.06, -0.26, -0.06);
pivot.add(tie);

const tailTip = new THREE.Mesh(
new THREE.ConeGeometry(0.028, 0.065, 8),
hairMat,
);
tailTip.rotation.x = Math.PI;
tailTip.position.set(side * 0.068, -0.305, -0.065);
pivot.add(tailTip);

return pivot;
}

const leftBraidPivot = buildBraid(-1);
const rightBraidPivot = buildBraid(1);
headPivot.add(leftBraidPivot, rightBraidPivot);

// Safari / Pith Explorer Hat
const hatGroup = new THREE.Group();
hatGroup.position.set(0, 0.335, -0.01);
hatGroup.rotation.x = -0.1;

const brim = new THREE.Mesh(
new THREE.CylinderGeometry(0.32, 0.34, 0.026, 24),
hatMat,
);
brim.scale.set(0.95, 1, 1.08);
brim.castShadow = true;
hatGroup.add(brim);

const crown = new THREE.Mesh(
new THREE.SphereGeometry(0.205, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
hatMat,
);
crown.scale.set(0.95, 0.85, 1.04);
crown.castShadow = true;
hatGroup.add(crown);

const hatBand = new THREE.Mesh(
new THREE.CylinderGeometry(0.204, 0.21, 0.038, 22),
hatBandMat,
);
hatBand.position.y = 0.024;
hatBand.scale.set(0.95, 1, 1.04);
hatGroup.add(hatBand);

const hatPin = new THREE.Mesh(
new THREE.SphereGeometry(0.018, 8, 8),
brassMat,
);
hatPin.position.set(0, 0.165, 0);
hatGroup.add(hatPin);

headPivot.add(hatGroup);

// Soft golden aura sphere shown softly around her while flying
const flightAuraGlow = new THREE.Mesh(
new THREE.SphereGeometry(0.85, 16, 12),
new THREE.MeshBasicMaterial({
color: 0xffd76b,
transparent: true,
opacity: 0,
blending: THREE.AdditiveBlending,
depthWrite: false,
}),
);
flightAuraGlow.position.y = 0.82;
bodyGroup.add(flightAuraGlow);

return {
root,
bodyGroup,
headPivot,
leftBraidPivot,
rightBraidPivot,
leftArmPivot,
rightArmPivot,
leftLegPivot,
rightLegPivot,
scarfTailPivot,
leftLid,
rightLid,
skirtMesh,
flightAuraGlow,
};
}

export function updateExplorerPose(
rig: ExplorerRig,
params: {
time: number;
dt: number;
speed: number;
walkDistance: number;
isFlying: boolean;
grounded: boolean;
verticalVel: number;
turnRate: number;
},
): void {
const { time, dt, speed, walkDistance, isFlying, grounded, verticalVel, turnRate } =
params;
const damp = 1 - Math.exp(-12 * dt);

// Expressive Nintendo-style periodic eye blink every ~3.8s
const blinkCycle = time % 3.8;
const blinkAmt =
blinkCycle > 3.64
? Math.sin(((blinkCycle - 3.64) / 0.16) * Math.PI)
: 0;
const lidPitch = -0.98 + blinkAmt * 1.18;
rig.leftLid.rotation.x = lidPitch;
rig.rightLid.rotation.x = lidPitch;

// Dynamic neck scarf flutter
const scarfLift = isFlying ? 0.42 : THREE.MathUtils.clamp(speed / 7.0, 0, 0.34);
const scarfWave = Math.sin(time * (isFlying ? 11 : 7)) * (isFlying ? 0.16 : 0.08);
rig.scarfTailPivot.rotation.x += (scarfLift + scarfWave - rig.scarfTailPivot.rotation.x) * damp;
rig.scarfTailPivot.rotation.y += (Math.cos(time * 5.2) * 0.14 - rig.scarfTailPivot.rotation.y) * damp;

if (isFlying) {
// Graceful flying pose matching the video: pitched gently forward, arms outstretched wide!
const glideRoll = THREE.MathUtils.clamp(-turnRate * 0.35, -0.32, 0.32);
const glidePitch = 0.28 + Math.sin(time * 2.8) * 0.04;

rig.bodyGroup.rotation.x += (glidePitch - rig.bodyGroup.rotation.x) * damp;
rig.bodyGroup.rotation.z += (glideRoll - rig.bodyGroup.rotation.z) * damp;
rig.bodyGroup.position.y +=
(Math.sin(time * 3.1) * 0.06 - rig.bodyGroup.position.y) * damp;

// Outstretched arms gently floating
const flap = Math.sin(time * 3.8) * 0.09;
rig.leftArmPivot.rotation.z += (-1.38 + flap - rig.leftArmPivot.rotation.z) * damp;
rig.rightArmPivot.rotation.z += (1.38 - flap - rig.rightArmPivot.rotation.z) * damp;
rig.leftArmPivot.rotation.x += (-0.18 - rig.leftArmPivot.rotation.x) * damp;
rig.rightArmPivot.rotation.x += (-0.18 - rig.rightArmPivot.rotation.x) * damp;

// Legs trailing smoothly behind with slight playful kick
const kick = Math.sin(time * 4.5) * 0.14;
rig.leftLegPivot.rotation.x += (0.35 + kick - rig.leftLegPivot.rotation.x) * damp;
rig.rightLegPivot.rotation.x += (0.48 - kick - rig.rightLegPivot.rotation.x) * damp;

// Head looks up happily toward the sky / temple ahead
rig.headPivot.rotation.x += (-0.24 - rig.headPivot.rotation.x) * damp;

// Braids stream back in the breeze
rig.leftBraidPivot.rotation.x += (0.55 + Math.sin(time * 6) * 0.1 - rig.leftBraidPivot.rotation.x) * damp;
rig.rightBraidPivot.rotation.x += (0.55 - Math.sin(time * 6) * 0.1 - rig.rightBraidPivot.rotation.x) * damp;
rig.leftBraidPivot.rotation.z += (-0.28 - rig.leftBraidPivot.rotation.z) * damp;
rig.rightBraidPivot.rotation.z += (0.28 - rig.rightBraidPivot.rotation.z) * damp;

// Subtle golden magic aura
const mat = rig.flightAuraGlow.material as THREE.MeshBasicMaterial;
mat.opacity += (0.14 - mat.opacity) * damp;
} else {
// Walking / jumping / idle on the island
rig.bodyGroup.rotation.x += (0 - rig.bodyGroup.rotation.x) * damp;
rig.bodyGroup.rotation.z += (0 - rig.bodyGroup.rotation.z) * damp;

const moveFactor = THREE.MathUtils.clamp(speed / 5.5, 0, 1);
const gaitPhase = walkDistance * 3.1;

if (!grounded) {
// Mid-jump pose
rig.leftArmPivot.rotation.z += (-0.75 - rig.leftArmPivot.rotation.z) * damp;
rig.rightArmPivot.rotation.z += (0.75 - rig.rightArmPivot.rotation.z) * damp;
rig.leftLegPivot.rotation.x += (0.38 - rig.leftLegPivot.rotation.x) * damp;
rig.rightLegPivot.rotation.x += (-0.28 - rig.rightLegPivot.rotation.x) * damp;
const stretchY = THREE.MathUtils.clamp(1 + verticalVel * 0.012, 0.9, 1.12);
rig.bodyGroup.scale.y += (stretchY - rig.bodyGroup.scale.y) * damp;
} else {
rig.bodyGroup.scale.y += (1 - rig.bodyGroup.scale.y) * damp;

const legSwing = Math.sin(gaitPhase) * 0.62 * moveFactor;
const armSwing = Math.sin(gaitPhase) * 0.55 * moveFactor;
const idleBreath = Math.sin(time * 2.2) * 0.025 * (1 - moveFactor);

rig.leftLegPivot.rotation.x += (legSwing - rig.leftLegPivot.rotation.x) * damp;
rig.rightLegPivot.rotation.x += (-legSwing - rig.rightLegPivot.rotation.x) * damp;

rig.leftArmPivot.rotation.x += (-armSwing - rig.leftArmPivot.rotation.x) * damp;
rig.rightArmPivot.rotation.x += (armSwing - rig.rightArmPivot.rotation.x) * damp;
rig.leftArmPivot.rotation.z += (-0.16 - idleBreath - rig.leftArmPivot.rotation.z) * damp;
rig.rightArmPivot.rotation.z += (0.16 + idleBreath - rig.rightArmPivot.rotation.z) * damp;

const walkBob = Math.abs(Math.sin(gaitPhase)) * 0.055 * moveFactor;
rig.bodyGroup.position.y += (walkBob - rig.bodyGroup.position.y) * damp;
}

rig.headPivot.rotation.x += (Math.sin(time * 1.8) * 0.03 - rig.headPivot.rotation.x) * damp;
const braidSway = Math.sin(gaitPhase * 0.5) * 0.08 * moveFactor;
rig.leftBraidPivot.rotation.x += (0.12 + moveFactor * 0.25 - rig.leftBraidPivot.rotation.x) * damp;
rig.rightBraidPivot.rotation.x += (0.12 + moveFactor * 0.25 - rig.rightBraidPivot.rotation.x) * damp;
rig.leftBraidPivot.rotation.z += (-0.08 + braidSway - rig.leftBraidPivot.rotation.z) * damp;
rig.rightBraidPivot.rotation.z += (0.08 + braidSway - rig.rightBraidPivot.rotation.z) * damp;

const mat = rig.flightAuraGlow.material as THREE.MeshBasicMaterial;
mat.opacity += (0 - mat.opacity) * damp;
}
}