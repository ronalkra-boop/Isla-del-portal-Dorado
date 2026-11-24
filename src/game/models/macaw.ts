import * as THREE from 'three';
import { applyNintendoRimLight } from '../nintendoVisuals';

export interface MacawRig {
root: THREE.Group;
leftWingPivot: THREE.Group;
rightWingPivot: THREE.Group;
tailGroup: THREE.Group;
}

export function createScarletMacaw(): MacawRig {
const root = new THREE.Group();

const scarletMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0xde2929,
roughness: 0.52,
}),
{ colorHex: 0xffbf80, power: 2.4, strength: 0.36 },
);
const goldWingMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0xf7c92a,
roughness: 0.48,
}),
{ colorHex: 0xfff5b5, power: 2.4, strength: 0.32 },
);
const cobaltMat = applyNintendoRimLight(
new THREE.MeshStandardMaterial({
color: 0x206be0,
roughness: 0.46,
}),
{ colorHex: 0x99e0ff, power: 2.4, strength: 0.36 },
);
const cheekMat = new THREE.MeshStandardMaterial({
color: 0xfaf5ed,
roughness: 0.62,
});
const beakLightMat = new THREE.MeshPhysicalMaterial({
color: 0xf5e8cd,
roughness: 0.28,
clearcoat: 0.45,
});
const beakDarkMat = new THREE.MeshStandardMaterial({
color: 0x1d1c1b,
roughness: 0.35,
});
const eyeGlossMat = new THREE.MeshPhysicalMaterial({
color: 0x111010,
roughness: 0.08,
clearcoat: 1.0,
clearcoatRoughness: 0.04,
});
const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

// Torso
const torso = new THREE.Mesh(
new THREE.CapsuleGeometry(0.11, 0.22, 6, 12),
scarletMat,
);
torso.rotation.x = Math.PI * 0.42;
torso.castShadow = true;
root.add(torso);

// Head + Playful Scarlet Crown Crest
const head = new THREE.Mesh(
new THREE.SphereGeometry(0.095, 14, 12),
scarletMat,
);
head.position.set(0, 0.11, 0.16);
head.castShadow = true;
root.add(head);

for (let c = 0; c < 3; c++) {
const feather = new THREE.Mesh(
new THREE.ConeGeometry(0.022, 0.095 - c * 0.014, 6),
c === 1 ? goldWingMat : scarletMat,
);
feather.position.set(0, 0.215 - c * 0.015, 0.13 - c * 0.032);
feather.rotation.x = -0.35 - c * 0.18;
root.add(feather);
}

// White cheek patches + glossy clearcoat eyes with bright catchlights
for (const s of [-1, 1]) {
const cheek = new THREE.Mesh(
new THREE.SphereGeometry(0.045, 8, 8),
cheekMat,
);
cheek.scale.set(0.55, 0.8, 1.0);
cheek.position.set(s * 0.068, 0.11, 0.195);
root.add(cheek);

const eye = new THREE.Mesh(
new THREE.SphereGeometry(0.019, 10, 10),
eyeGlossMat,
);
eye.position.set(s * 0.072, 0.125, 0.205);
root.add(eye);

const glint = new THREE.Mesh(
new THREE.SphereGeometry(0.0055, 6, 6),
catchlightMat,
);
glint.position.set(s * 0.081, 0.132, 0.218);
root.add(glint);
}

// Curved Hooked Beak
const upperBeak = new THREE.Mesh(
new THREE.ConeGeometry(0.042, 0.11, 10),
beakLightMat,
);
upperBeak.rotation.x = Math.PI * 0.58;
upperBeak.position.set(0, 0.098, 0.275);
root.add(upperBeak);

const lowerBeak = new THREE.Mesh(
new THREE.ConeGeometry(0.028, 0.06, 8),
beakDarkMat,
);
lowerBeak.rotation.x = Math.PI * 0.38;
lowerBeak.position.set(0, 0.072, 0.245);
root.add(lowerBeak);

// Articulated Tri-Color Sculpted Feathered Wings (Scarlet + Gold + Cobalt)
function buildWingShape(span: number, rootChord: number, tipChord: number): THREE.Shape {
const s = new THREE.Shape();
s.moveTo(0, rootChord * 0.5);
s.quadraticCurveTo(span * 0.45, rootChord * 0.45, span, tipChord * 0.3);
s.lineTo(span * 0.95, -tipChord * 0.65);
s.quadraticCurveTo(span * 0.48, -rootChord * 0.55, 0, -rootChord * 0.45);
s.closePath();
return s;
}

function buildWing(side: -1 | 1): THREE.Group {
const pivot = new THREE.Group();
pivot.position.set(side * 0.08, 0.075, 0.04);

const innerGeo = new THREE.ExtrudeGeometry(buildWingShape(0.28, 0.19, 0.16), {
depth: 0.022,
bevelEnabled: true,
bevelThickness: 0.006,
bevelSize: 0.005,
bevelSegments: 2,
});
innerGeo.rotateX(Math.PI / 2);
if (side === -1) innerGeo.scale(-1, 1, 1);
const inner = new THREE.Mesh(innerGeo, scarletMat);
inner.castShadow = true;
pivot.add(inner);

const midGeo = new THREE.ExtrudeGeometry(buildWingShape(0.22, 0.16, 0.13), {
depth: 0.018,
bevelEnabled: true,
bevelThickness: 0.004,
bevelSize: 0.004,
bevelSegments: 1,
});
midGeo.rotateX(Math.PI / 2);
if (side === -1) midGeo.scale(-1, 1, 1);
const midGold = new THREE.Mesh(midGeo, goldWingMat);
midGold.position.set(side * 0.25, -0.004, -0.02);
midGold.castShadow = true;
pivot.add(midGold);

const tipGeo = new THREE.ExtrudeGeometry(buildWingShape(0.26, 0.14, 0.04), {
depth: 0.014,
bevelEnabled: true,
bevelThickness: 0.003,
bevelSize: 0.003,
bevelSegments: 1,
});
tipGeo.rotateX(Math.PI / 2);
if (side === -1) tipGeo.scale(-1, 1, 1);
const tipBlue = new THREE.Mesh(tipGeo, cobaltMat);
tipBlue.position.set(side * 0.44, -0.008, -0.045);
tipBlue.rotation.y = side * -0.18;
tipBlue.castShadow = true;
pivot.add(tipBlue);

return pivot;
}

const leftWingPivot = buildWing(-1);
const rightWingPivot = buildWing(1);
root.add(leftWingPivot, rightWingPivot);

// Long Graduated Tail Feathers
const tailGroup = new THREE.Group();
tailGroup.position.set(0, -0.04, -0.15);

const mainTail = new THREE.Mesh(
new THREE.ConeGeometry(0.055, 0.56, 8),
scarletMat,
);
mainTail.rotation.x = -Math.PI * 0.45;
mainTail.position.set(0, -0.05, -0.26);
tailGroup.add(mainTail);

for (const s of [-1, 1]) {
const sideTail = new THREE.Mesh(
new THREE.ConeGeometry(0.036, 0.44, 6),
cobaltMat,
);
sideTail.rotation.x = -Math.PI * 0.46;
sideTail.rotation.z = s * 0.12;
sideTail.position.set(s * 0.045, -0.04, -0.2);
tailGroup.add(sideTail);
}
root.add(tailGroup);

return { root, leftWingPivot, rightWingPivot, tailGroup };
}

export function updateMacawCompanion(
macaw: MacawRig,
targetX: number,
targetY: number,
targetZ: number,
playerYaw: number,
isFlying: boolean,
time: number,
dt: number,
): void {
// Companion orbits slightly ahead-left or right of the explorer
const orbitOffsetAngle = playerYaw + (isFlying ? -0.95 : -1.25);
const dist = isFlying ? 2.1 : 1.75;
const hoverHeight = isFlying ? 1.55 : 2.15;

const desiredX =
targetX + Math.sin(orbitOffsetAngle) * dist + Math.cos(time * 1.1) * 0.35;
const desiredY =
targetY + hoverHeight + Math.sin(time * 2.6) * (isFlying ? 0.25 : 0.16);
const desiredZ =
targetZ + Math.cos(orbitOffsetAngle) * dist + Math.sin(time * 1.1) * 0.35;

const followAlpha = 1 - Math.exp(-4.8 * dt);
const prevX = macaw.root.position.x;
const prevZ = macaw.root.position.z;

macaw.root.position.x += (desiredX - macaw.root.position.x) * followAlpha;
macaw.root.position.y += (desiredY - macaw.root.position.y) * followAlpha;
macaw.root.position.z += (desiredZ - macaw.root.position.z) * followAlpha;

const moveDx = macaw.root.position.x - prevX;
const moveDz = macaw.root.position.z - prevZ;
const desiredYaw =
Math.hypot(moveDx, moveDz) > 0.005
? Math.atan2(moveDx, moveDz)
: playerYaw;

let diff = desiredYaw - macaw.root.rotation.y;
while (diff > Math.PI) diff -= Math.PI * 2;
while (diff < -Math.PI) diff += Math.PI * 2;
macaw.root.rotation.y += diff * (1 - Math.exp(-7 * dt));

const flapSpeed = isFlying ? 13.5 : 10.5;
const flapAmp = 0.62;
const flap = Math.sin(time * flapSpeed) * flapAmp;

macaw.leftWingPivot.rotation.z = flap;
macaw.rightWingPivot.rotation.z = -flap;
macaw.tailGroup.rotation.x = Math.sin(time * 4.2) * 0.12;
}