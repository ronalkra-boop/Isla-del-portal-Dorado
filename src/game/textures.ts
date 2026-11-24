import * as THREE from 'three';

function hash2d(x: number, y: number): number {
const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
return n - Math.floor(n);
}

export interface TexturePair {
map: THREE.CanvasTexture;
bumpMap: THREE.CanvasTexture;
normalMap?: THREE.CanvasTexture;
roughnessMap?: THREE.CanvasTexture;
}

/**
* Converts a grayscale height canvas into a seamlessly wrapping tangent-space
* RGB normal texture using a 3x3 Sobel filter.
*/
export function heightCanvasToNormalTexture(
heightCanvas: HTMLCanvasElement,
strength: number,
maxAniso: number,
repeatX = 1,
repeatY = 1,
): THREE.CanvasTexture {
const w = heightCanvas.width;
const h = heightCanvas.height;
const hCtx = heightCanvas.getContext('2d')!;
const src = hCtx.getImageData(0, 0, w, h).data;

const normalCanvas = document.createElement('canvas');
normalCanvas.width = w;
normalCanvas.height = h;
const nCtx = normalCanvas.getContext('2d')!;
const out = nCtx.createImageData(w, h);
const dst = out.data;

const sample = (x: number, y: number): number => {
const wx = ((x % w) + w) % w;
const wy = ((y % h) + h) % h;
const idx = (wy * w + wx) * 4;
return (src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114) / 255;
};

for (let y = 0; y < h; y++) {
for (let x = 0; x < w; x++) {
const tl = sample(x - 1, y - 1);
const t = sample(x, y - 1);
const tr = sample(x + 1, y - 1);
const l = sample(x - 1, y);
const r = sample(x + 1, y);
const bl = sample(x - 1, y + 1);
const b = sample(x, y + 1);
const br = sample(x + 1, y + 1);

const dX = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
const dY = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
const nz = 1.0;
const invLen = 1 / Math.sqrt(dX * dX + dY * dY + nz * nz);

const nx = -dX * invLen;
const ny = -dY * invLen;
const nnz = nz * invLen;

const idx = (y * w + x) * 4;
dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
dst[idx + 2] = Math.round((nnz * 0.5 + 0.5) * 255);
dst[idx + 3] = 255;
}
}

nCtx.putImageData(out, 0, 0);

const normalMap = new THREE.CanvasTexture(normalCanvas);
normalMap.wrapS = THREE.RepeatWrapping;
normalMap.wrapT = THREE.RepeatWrapping;
normalMap.repeat.set(repeatX, repeatY);
normalMap.anisotropy = maxAniso;
return normalMap;
}

function finalizeRepeatTexture(
canvas: HTMLCanvasElement,
isColor: boolean,
maxAniso: number,
repeatX: number,
repeatY: number,
): THREE.CanvasTexture {
const tex = new THREE.CanvasTexture(canvas);
if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
tex.wrapS = THREE.RepeatWrapping;
tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(repeatX, repeatY);
tex.anisotropy = maxAniso;
return tex;
}

export function createTempleStoneTextures(maxAniso: number): TexturePair {
const size = 512;
const colorCanvas = document.createElement('canvas');
colorCanvas.width = size;
colorCanvas.height = size;
const ctx = colorCanvas.getContext('2d')!;

const bumpCanvas = document.createElement('canvas');
bumpCanvas.width = size;
bumpCanvas.height = size;
const bCtx = bumpCanvas.getContext('2d')!;

const roughCanvas = document.createElement('canvas');
roughCanvas.width = size;
roughCanvas.height = size;
const rCtx = roughCanvas.getContext('2d')!;

// Base warm carved mortar bed
ctx.fillStyle = '#8b7b5f';
ctx.fillRect(0, 0, size, size);
bCtx.fillStyle = '#3d3d3d';
bCtx.fillRect(0, 0, size, size);
rCtx.fillStyle = '#f2f2f2';
rCtx.fillRect(0, 0, size, size);

const rows = 4;
const rowH = size / rows;
for (let r = 0; r < rows; r++) {
const cols = r % 2 === 0 ? 3 : 4;
const colW = size / cols;
const offset = r % 2 === 0 ? 0 : colW * 0.5;

for (let c = -1; c <= cols; c++) {
const bx = c * colW + offset;
const by = r * rowH;
const jitter = hash2d(c + 13, r + 7);
const tone = 160 + Math.floor((jitter - 0.5) * 30);
const warmG = tone - 11;
const warmB = tone - 34;

// Bevel block face
ctx.fillStyle = `rgb(${tone}, ${warmG}, ${warmB})`;
ctx.fillRect(bx + 4, by + 4, colW - 8, rowH - 8);

// Sunlit upper lip + carved Mayan inner cartouche relief
ctx.fillStyle = 'rgba(248, 232, 194, 0.24)';
ctx.fillRect(bx + 5, by + 5, colW - 10, 5);
ctx.strokeStyle = 'rgba(232, 212, 166, 0.34)';
ctx.lineWidth = 3;
ctx.strokeRect(bx + 14, by + 14, colW - 28, rowH - 28);
ctx.strokeStyle = 'rgba(72, 58, 40, 0.28)';
ctx.lineWidth = 2;
ctx.strokeRect(bx + 17, by + 17, colW - 34, rowH - 34);

// Stylized Mesoamerican step-fret notch in alternating stones
if ((c + r) % 2 === 0 && colW > 110) {
ctx.strokeStyle = 'rgba(92, 74, 48, 0.25)';
ctx.lineWidth = 2;
ctx.strokeRect(bx + colW * 0.35, by + rowH * 0.32, colW * 0.3, rowH * 0.36);
}

// Height map: raised block, carved inset, deep mortar groove
const hBase = 168 + Math.floor(jitter * 36);
bCtx.fillStyle = `rgb(${hBase}, ${hBase}, ${hBase})`;
bCtx.fillRect(bx + 4, by + 4, colW - 8, rowH - 8);
bCtx.strokeStyle = '#d8d8d8';
bCtx.lineWidth = 4;
bCtx.strokeRect(bx + 13, by + 13, colW - 26, rowH - 26);
bCtx.strokeStyle = '#323232';
bCtx.lineWidth = 6;
bCtx.strokeRect(bx + 2, by + 2, colW - 4, rowH - 4);

// Roughness map: smoother sun-polished stone centers (~165), matte edges (~235)
const rTone = 162 + Math.floor(jitter * 24);
rCtx.fillStyle = `rgb(${rTone}, ${rTone}, ${rTone})`;
rCtx.fillRect(bx + 8, by + 8, colW - 16, rowH - 16);
}
}

// Organic weathering speckles, cracks & moss veins
for (let i = 0; i < 1100; i++) {
const px = hash2d(i, 1.3) * size;
const py = hash2d(i, 5.7) * size;
const rad = 1.8 + hash2d(i, 9.1) * 8.5;
const isMoss = hash2d(i, 12.4) > 0.74;
ctx.fillStyle = isMoss
? `rgba(74, 124, 52, ${0.14 + hash2d(i, 3.3) * 0.22})`
: `rgba(68, 56, 40, ${0.06 + hash2d(i, 2.2) * 0.1})`;
ctx.beginPath();
ctx.arc(px, py, rad, 0, Math.PI * 2);
ctx.fill();

bCtx.fillStyle = `rgba(110, 110, 110, 0.14)`;
bCtx.beginPath();
bCtx.arc(px, py, rad * 0.8, 0, Math.PI * 2);
bCtx.fill();

if (isMoss) {
rCtx.fillStyle = 'rgba(245, 245, 245, 0.35)';
rCtx.beginPath();
rCtx.arc(px, py, rad, 0, Math.PI * 2);
rCtx.fill();
}
}

const map = finalizeRepeatTexture(colorCanvas, true, maxAniso, 2, 2);
const bumpMap = finalizeRepeatTexture(bumpCanvas, false, maxAniso, 2, 2);
const normalMap = heightCanvasToNormalTexture(bumpCanvas, 2.2, maxAniso, 2, 2);
const roughnessMap = finalizeRepeatTexture(roughCanvas, false, maxAniso, 2, 2);

return { map, bumpMap, normalMap, roughnessMap };
}

export function createTerrainDetailBump(maxAniso: number): THREE.CanvasTexture {
const size = 256;
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d')!;

ctx.fillStyle = '#808080';
ctx.fillRect(0, 0, size, size);

for (let i = 0; i < 2400; i++) {
const x = hash2d(i, 1.7) * size;
const y = hash2d(i, 4.9) * size;
const r = 1 + hash2d(i, 8.2) * 4.5;
const v = 90 + Math.floor(hash2d(i, 2.9) * 85);
ctx.fillStyle = `rgba(${v},${v},${v},0.32)`;
ctx.beginPath();
ctx.arc(x, y, r, 0, Math.PI * 2);
ctx.fill();
}

return finalizeRepeatTexture(canvas, false, maxAniso, 26, 26);
}

export function createWoodPlankTextures(maxAniso: number): TexturePair {
const size = 512;
const cCanvas = document.createElement('canvas');
cCanvas.width = size;
cCanvas.height = size;
const ctx = cCanvas.getContext('2d')!;

const bCanvas = document.createElement('canvas');
bCanvas.width = size;
bCanvas.height = size;
const bCtx = bCanvas.getContext('2d')!;

const rCanvas = document.createElement('canvas');
rCanvas.width = size;
rCanvas.height = size;
const rCtx = rCanvas.getContext('2d')!;

ctx.fillStyle = '#734829';
ctx.fillRect(0, 0, size, size);
bCtx.fillStyle = '#808080';
bCtx.fillRect(0, 0, size, size);
rCtx.fillStyle = '#c8c8c8';
rCtx.fillRect(0, 0, size, size);

const planks = 6;
const h = size / planks;
for (let p = 0; p < planks; p++) {
const shade = 104 + Math.floor(hash2d(p, 3.1) * 32);
const py = p * h;
ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.62)}, ${Math.floor(shade * 0.35)})`;
ctx.fillRect(0, py + 3, size, h - 5);

// Warm bevel highlight along plank top edge
ctx.fillStyle = 'rgba(235, 192, 138, 0.16)';
ctx.fillRect(0, py + 4, size, 4);

bCtx.fillStyle = '#b4b4b4';
bCtx.fillRect(0, py + 3, size, h - 5);
bCtx.fillStyle = '#262626';
bCtx.fillRect(0, py, size, 4);

rCtx.fillStyle = '#b8b8b8';
rCtx.fillRect(0, py + 4, size, h - 7);
rCtx.fillStyle = '#eeeeee';
rCtx.fillRect(0, py, size, 4);

// Rich wood grain streaks + subtle knots
for (let g = 0; g < 22; g++) {
const gy = py + 6 + hash2d(p * 20 + g, 7.1) * (h - 12);
ctx.fillStyle = g % 3 === 0 ? 'rgba(42, 22, 10, 0.25)' : 'rgba(218, 166, 108, 0.12)';
ctx.fillRect(0, gy, size, 2);
bCtx.fillStyle = 'rgba(130, 130, 130, 0.24)';
bCtx.fillRect(0, gy, size, 1.8);
}

// Painterly wood knot + dark iron nail heads at beam ends
const kx = 64 + hash2d(p, 19.7) * (size - 128);
const ky = py + h * 0.5;
ctx.strokeStyle = 'rgba(48, 26, 12, 0.28)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.ellipse(kx, ky, 14, 6, 0, 0, Math.PI * 2);
ctx.stroke();

for (const nx of [22, size - 22, size * 0.5]) {
ctx.fillStyle = '#2d2622';
ctx.beginPath();
ctx.arc(nx, py + h * 0.28, 3.6, 0, Math.PI * 2);
ctx.arc(nx, py + h * 0.72, 3.6, 0, Math.PI * 2);
ctx.fill();

bCtx.fillStyle = '#ececec';
bCtx.beginPath();
bCtx.arc(nx, py + h * 0.28, 3.6, 0, Math.PI * 2);
bCtx.arc(nx, py + h * 0.72, 3.6, 0, Math.PI * 2);
bCtx.fill();

rCtx.fillStyle = '#686868';
rCtx.beginPath();
rCtx.arc(nx, py + h * 0.28, 4.0, 0, Math.PI * 2);
rCtx.arc(nx, py + h * 0.72, 4.0, 0, Math.PI * 2);
rCtx.fill();
}
}

const map = finalizeRepeatTexture(cCanvas, true, maxAniso, 1, 1);
const bumpMap = finalizeRepeatTexture(bCanvas, false, maxAniso, 1, 1);
const normalMap = heightCanvasToNormalTexture(bCanvas, 2.1, maxAniso, 1, 1);
const roughnessMap = finalizeRepeatTexture(rCanvas, false, maxAniso, 1, 1);

return { map, bumpMap, normalMap, roughnessMap };
}
/**
 * * World 1 Nintendo painterly stylized grass & trail micro-detail (high-value neutral
 * albedo so terrain vertexColors tint meadows/beaches cleanly with rich tactile depth).
 */
 export function createGrassTerrainTextures(maxAniso: number): TexturePair {
 const size = 512;
 const cCanvas = document.createElement('canvas');
 cCanvas.width = size;
 cCanvas.height = size;
 const ctx = cCanvas.getContext('2d')!;

 const bCanvas = document.createElement('canvas');
 bCanvas.width = size;
 bCanvas.height = size;
 const bCtx = bCanvas.getContext('2d')!;

 const rCanvas = document.createElement('canvas');
 rCanvas.width = size;
 rCanvas.height = size;
 const rCtx = rCanvas.getContext('2d')!;

 ctx.fillStyle = '#eff2ea';
 ctx.fillRect(0, 0, size, size);
 bCtx.fillStyle = '#808080';
 bCtx.fillRect(0, 0, size, size);
 rCtx.fillStyle = '#d6d6d6';
 rCtx.fillRect(0, 0, size, size);

 // Soft painterly patches (seamless wrap)
 for (let i = 0; i < 240; i++) {
 const px = hash2d(i, 2.3) * size;
 const py = hash2d(i, 6.7) * size;
 const rad = 14 + hash2d(i, 9.5) * 28;
 const shade = 226 + Math.floor(hash2d(i, 4.1) * 26);
 for (const ox of [-size, 0, size]) {
 for (const oy of [-size, 0, size]) {
 if (px + ox < -rad || px + ox > size + rad || py + oy < -rad || py + oy > size + rad) continue;
 ctx.fillStyle = `rgba(${shade}, ${Math.min(255, shade + 4)}, ${shade - 4}, 0.22)`;
 ctx.beginPath();
 ctx.arc(px + ox, py + oy, rad, 0, Math.PI * 2);
 ctx.fill();
 }
 }
 }

 // Stylized directional tuft strokes + relief
 for (let i = 0; i < 2200; i++) {
 const gx = hash2d(i, 1.1) * size;
 const gy = hash2d(i, 3.7) * size;
 const len = 5 + hash2d(i, 5.9) * 10;
 const tilt = (hash2d(i, 7.3) - 0.5) * 6;
 const light = hash2d(i, 8.9) > 0.45;
 for (const ox of [-size, 0, size]) {
 for (const oy of [-size, 0, size]) {
 const x = gx + ox;
 const y = gy + oy;
 if (x < -12 || x > size + 12 || y < -12 || y > size + 12) continue;
 ctx.strokeStyle = light ? 'rgba(255, 255, 245, 0.36)' : 'rgba(182, 192, 174, 0.28)';
 ctx.lineWidth = 2.0;
 ctx.beginPath();
 ctx.moveTo(x, y);
 ctx.quadraticCurveTo(x + tilt * 0.5, y - len * 0.5, x + tilt, y - len);
 ctx.stroke();

 bCtx.strokeStyle = light ? 'rgba(205, 205, 205, 0.42)' : 'rgba(92, 92, 92, 0.35)';
 bCtx.lineWidth = 2.2;
 bCtx.beginPath();
 bCtx.moveTo(x, y);
 bCtx.lineTo(x + tilt, y - len);
 bCtx.stroke();
 }
 }
 }

 const repeat = 22;
 return {
 map: finalizeRepeatTexture(cCanvas, true, maxAniso, repeat, repeat),
 bumpMap: finalizeRepeatTexture(bCanvas, false, maxAniso, repeat, repeat),
 normalMap: heightCanvasToNormalTexture(bCanvas, 2.0, maxAniso, repeat, repeat),
 roughnessMap: finalizeRepeatTexture(rCanvas, false, maxAniso, repeat, repeat),
 };
 }

 /**
 * World 3 stylized Tostarena-like wind-carved sand dune ripples with subtle sheen
 * along wave crests and neutral warm-bright base for vertex color gradients.
 */
 export function createSandDuneTextures(maxAniso: number): TexturePair {
 const size = 512;
 const cCanvas = document.createElement('canvas');
 cCanvas.width = size;
 cCanvas.height = size;
 const ctx = cCanvas.getContext('2d')!;
 const cImg = ctx.createImageData(size, size);

 const bCanvas = document.createElement('canvas');
 bCanvas.width = size;
 bCanvas.height = size;
 const bCtx = bCanvas.getContext('2d')!;
 const bImg = bCtx.createImageData(size, size);

 const rCanvas = document.createElement('canvas');
 rCanvas.width = size;
 rCanvas.height = size;
 const rCtx = rCanvas.getContext('2d')!;
 const rImg = rCtx.createImageData(size, size);

 const twoPi = Math.PI * 2;
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const u = x / size;
 const v = y / size;
 // Seamless periodic diagonal dune ripples + secondary wind curl
 const phase = (u * 7 + v * 5) * twoPi + Math.sin((u * 2 - v * 3) * twoPi) * 0.85;
 const ridge = 0.5 + 0.5 * Math.sin(phase);
 const sharp = Math.pow(ridge, 1.55);
 const grain = (hash2d(x * 0.7, y * 0.7) - 0.5) * 0.14;

 const heightVal = Math.max(0, Math.min(1, sharp * 0.82 + 0.14 + grain));
 const idx = (y * size + x) * 4;

 // High-value neutral cream so dune vertexColors stay sunny & warm
 const cTone = Math.round(224 + sharp * 28 + grain * 18);
 cImg.data[idx] = Math.min(255, cTone + 4);
 cImg.data[idx + 1] = Math.min(255, cTone);
 cImg.data[idx + 2] = Math.max(0, cTone - 8);
 cImg.data[idx + 3] = 255;

 const bTone = Math.round(heightVal * 255);
 bImg.data[idx] = bTone;
 bImg.data[idx + 1] = bTone;
 bImg.data[idx + 2] = bTone;
 bImg.data[idx + 3] = 255;

 // Sun-kissed crests slightly smoother (shimmer) than troughs
 const rTone = Math.round(238 - sharp * 48);
 rImg.data[idx] = rTone;
 rImg.data[idx + 1] = rTone;
 rImg.data[idx + 2] = rTone;
 rImg.data[idx + 3] = 255;
 }
 }

 ctx.putImageData(cImg, 0, 0);
 bCtx.putImageData(bImg, 0, 0);
 rCtx.putImageData(rImg, 0, 0);

 const repeat = 24;
 return {
 map: finalizeRepeatTexture(cCanvas, true, maxAniso, repeat, repeat),
 bumpMap: finalizeRepeatTexture(bCanvas, false, maxAniso, repeat, repeat),
 normalMap: heightCanvasToNormalTexture(bCanvas, 2.8, maxAniso, repeat, repeat),
 roughnessMap: finalizeRepeatTexture(rCanvas, false, maxAniso, repeat, repeat),
 };
 }

 /**
 * World 2 stratified subterranean basalt & wet crystalline mineral seams.
 */
 export function createCavernBasaltTextures(maxAniso: number): TexturePair {
 const size = 512;
 const cCanvas = document.createElement('canvas');
 cCanvas.width = size;
 cCanvas.height = size;
 const ctx = cCanvas.getContext('2d')!;

 const bCanvas = document.createElement('canvas');
 bCanvas.width = size;
 bCanvas.height = size;
 const bCtx = bCanvas.getContext('2d')!;

 const rCanvas = document.createElement('canvas');
 rCanvas.width = size;
 rCanvas.height = size;
 const rCtx = rCanvas.getContext('2d')!;

 ctx.fillStyle = '#e5e2f2';
 ctx.fillRect(0, 0, size, size);
 bCtx.fillStyle = '#767676';
 bCtx.fillRect(0, 0, size, size);
 rCtx.fillStyle = '#d4d4d4';
 rCtx.fillRect(0, 0, size, size);

 // Faceted basalt slabs + mineral seams
 for (let i = 0; i < 190; i++) {
 const px = hash2d(i, 2.1) * size;
 const py = hash2d(i, 7.9) * size;
 const w = 22 + hash2d(i, 3.3) * 46;
 const h = 14 + hash2d(i, 5.5) * 34;
 const angle = hash2d(i, 8.8) * Math.PI;
 const cTone = 204 + Math.floor(hash2d(i, 1.4) * 42);
 const hTone = 128 + Math.floor(hash2d(i, 6.2) * 95);
 const rTone = 145 + Math.floor(hash2d(i, 9.7) * 75);

 for (const ox of [-size, 0, size]) {
 for (const oy of [-size, 0, size]) {
 const cx = px + ox;
 const cy = py + oy;
 if (cx < -w || cx > size + w || cy < -h || cy > size + h) continue;

 ctx.save();
 ctx.translate(cx, cy);
 ctx.rotate(angle);
 ctx.fillStyle = `rgba(${cTone}, ${cTone - 2}, ${Math.min(255, cTone + 10)}, 0.48)`;
 ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
 ctx.strokeStyle = 'rgba(130, 124, 168, 0.35)';
 ctx.lineWidth = 2;
 ctx.strokeRect(-w * 0.5, -h * 0.5, w, h);
 ctx.restore();

 bCtx.save();
 bCtx.translate(cx, cy);
 bCtx.rotate(angle);
 bCtx.fillStyle = `rgb(${hTone}, ${hTone}, ${hTone})`;
 bCtx.fillRect(-w * 0.5, -h * 0.5, w, h);
 bCtx.strokeStyle = '#363636';
 bCtx.lineWidth = 3;
 bCtx.strokeRect(-w * 0.5, -h * 0.5, w, h);
 bCtx.restore();

 rCtx.save();
 rCtx.translate(cx, cy);
 rCtx.rotate(angle);
 rCtx.fillStyle = `rgb(${rTone}, ${rTone}, ${rTone})`;
 rCtx.fillRect(-w * 0.5, -h * 0.5, w, h);
 rCtx.restore();
 }
 }
 }

 // Subtle crystalline amethyst/cyan mineral glint streaks (low roughness)
 for (let i = 0; i < 65; i++) {
 const x1 = hash2d(i, 11.2) * size;
 const y1 = hash2d(i, 14.7) * size;
 const dx = (hash2d(i, 16.3) - 0.5) * 48;
 const dy = (hash2d(i, 19.1) - 0.5) * 48;
 const cyan = i % 2 === 0;
 ctx.strokeStyle = cyan ? 'rgba(160, 245, 255, 0.42)' : 'rgba(220, 178, 255, 0.42)';
 ctx.lineWidth = 2.2;
 ctx.beginPath();
 ctx.moveTo(x1, y1);
 ctx.lineTo(x1 + dx, y1 + dy);
 ctx.stroke();

 rCtx.strokeStyle = '#5c5c5c';
 rCtx.lineWidth = 3;
 rCtx.beginPath();
 rCtx.moveTo(x1, y1);
 rCtx.lineTo(x1 + dx, y1 + dy);
 rCtx.stroke();
 }

 const repeat = 18;
 return {
 map: finalizeRepeatTexture(cCanvas, true, maxAniso, repeat, repeat),
 bumpMap: finalizeRepeatTexture(bCanvas, false, maxAniso, repeat, repeat),
 normalMap: heightCanvasToNormalTexture(bCanvas, 2.5, maxAniso, repeat, repeat),
 roughnessMap: finalizeRepeatTexture(rCanvas, false, maxAniso, repeat, repeat),
 };
 }
 export function createPalmBarkTextures(maxAniso: number): TexturePair {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  ctx.fillStyle = '#745032';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#7f7f7f';
  bCtx.fillRect(0, 0, size, size);

  const rings = 10;
  const ringH = size / rings;
  for (let r = 0; r < rings; r++) {
  const y = r * ringH;
  const shade = 104 + Math.floor(hash2d(r, 4.4) * 26);
  ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.68)}, ${Math.floor(shade * 0.42)})`;
  ctx.fillRect(0, y + 3, size, ringH - 4);
  ctx.fillStyle = 'rgba(42, 24, 12, 0.36)';
  ctx.fillRect(0, y, size, 3);

  bCtx.fillStyle = '#b0b0b0';
  bCtx.fillRect(0, y + 4, size, ringH - 6);
  bCtx.fillStyle = '#383838';
  bCtx.fillRect(0, y, size, 4);

  for (let f = 0; f < 18; f++) {
  const fx = hash2d(r * 31 + f, 2.8) * size;
  ctx.fillStyle = 'rgba(220, 178, 128, 0.16)';
  ctx.fillRect(fx, y + 5, 10 + hash2d(f, r) * 14, 2);
  }
  }

  return {
  map: finalizeRepeatTexture(cCanvas, true, maxAniso, 1, 2),
  bumpMap: finalizeRepeatTexture(bCanvas, false, maxAniso, 1, 2),
  normalMap: heightCanvasToNormalTexture(bCanvas, 2.2, maxAniso, 1, 2),
  };
  }

  export function createLeafFrondTextures(maxAniso: number): TexturePair {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#2a7d31');
  grad.addColorStop(0.55, '#3b9b39');
  grad.addColorStop(1, '#78c448');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#909090';
  bCtx.fillRect(0, 0, size, size);

  // Central golden-green midrib + chevron leaflet veins
  ctx.strokeStyle = 'rgba(184, 232, 112, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.5);
  ctx.lineTo(size, size * 0.5);
  ctx.stroke();

  bCtx.strokeStyle = '#d4d4d4';
  bCtx.lineWidth = 4;
  bCtx.beginPath();
  bCtx.moveTo(0, size * 0.5);
  bCtx.lineTo(size, size * 0.5);
  bCtx.stroke();

  for (let i = 1; i <= 14; i++) {
  const x = (i / 15) * size;
  ctx.strokeStyle = i % 2 === 0 ? 'rgba(26, 86, 30, 0.35)' : 'rgba(170, 224, 96, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, size * 0.5);
  ctx.lineTo(x + 28, 12);
  ctx.moveTo(x, size * 0.5);
  ctx.lineTo(x + 28, size - 12);
  ctx.stroke();

  bCtx.strokeStyle = i % 2 === 0 ? '#5e5e5e' : '#b8b8b8';
  bCtx.lineWidth = 2;
  bCtx.beginPath();
  bCtx.moveTo(x, size * 0.5);
  bCtx.lineTo(x + 28, 12);
  bCtx.moveTo(x, size * 0.5);
  bCtx.lineTo(x + 28, size - 12);
  bCtx.stroke();
  }

  return {
  map: finalizeRepeatTexture(cCanvas, true, maxAniso, 1, 1),
  bumpMap: finalizeRepeatTexture(bCanvas, false, maxAniso, 1, 1),
  normalMap: heightCanvasToNormalTexture(bCanvas, 1.8, maxAniso, 1, 1),
  };
  }

  export function createClothFabricTextures(maxAniso: number): TexturePair {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  ctx.fillStyle = '#f5f2eb';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const step = 8;
  for (let y = 0; y < size; y += step) {
  for (let x = 0; x < size; x += step) {
  const warp = ((x + y) / step) % 2 === 0;
  ctx.fillStyle = warp ? 'rgba(255, 255, 255, 0.35)' : 'rgba(218, 210, 196, 0.35)';
  ctx.fillRect(x, y, step - 1, step - 1);

  bCtx.fillStyle = warp ? '#a6a6a6' : '#646464';
  bCtx.fillRect(x, y, step - 1, step - 1);
  }
  }

  // Subtle dashed seam line
  ctx.strokeStyle = 'rgba(182, 168, 148, 0.45)';
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.25);
  ctx.lineTo(size, size * 0.25);
  ctx.stroke();

  return {
  map: finalizeRepeatTexture(cCanvas, true, maxAniso, 3, 3),
  bumpMap: finalizeRepeatTexture(bCanvas, false, maxAniso, 3, 3),
  normalMap: heightCanvasToNormalTexture(bCanvas, 1.5, maxAniso, 3, 3),
  };
  }

  export function createSailFabricTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ead9b5';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(138, 110, 74, 0.45)';
  ctx.lineWidth = 3;
  for (let i = 1; i < 4; i++) {
  const y = (size / 4) * i;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(size, y);
  ctx.stroke();
  }
  for (let i = 1; i < 5; i++) {
  const x = (size / 5) * i;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, size);
  ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
  }

  export function createPirateFlagTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 256;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#191d24';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#f6f2e9';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(82, 108);
  ctx.lineTo(174, 58);
  ctx.moveTo(82, 58);
  ctx.lineTo(174, 108);
  ctx.stroke();

  ctx.fillStyle = '#f6f2e9';
  ctx.beginPath();
  ctx.arc(128, 72, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(114, 88, 28, 16);

  ctx.fillStyle = '#191d24';
  ctx.beginPath();
  ctx.arc(118, 72, 6, 0, Math.PI * 2);
  ctx.arc(138, 72, 6, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
  }

  export function createSparkleTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.48);
  grad.addColorStop(0, 'rgba(255, 255, 240, 1)');
  grad.addColorStop(0.25, 'rgba(255, 224, 118, 0.92)');
  grad.addColorStop(0.6, 'rgba(255, 178, 52, 0.35)');
  grad.addColorStop(1, 'rgba(255, 160, 40, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(255, 255, 250, 0.95)';
  ctx.beginPath();
  ctx.moveTo(cx, 14);
  ctx.quadraticCurveTo(cx + 6, cy - 6, size - 14, cy);
  ctx.quadraticCurveTo(cx + 6, cy + 6, cx, size - 14);
  ctx.quadraticCurveTo(cx - 6, cy + 6, 14, cy);
  ctx.quadraticCurveTo(cx - 6, cy - 6, cx, 14);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
  }

  export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(18, 28, 22, 0.52)');
  grad.addColorStop(0.55, 'rgba(18, 28, 22, 0.22)');
  grad.addColorStop(1, 'rgba(18, 28, 22, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
  }

  export function createEyeTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fcfaf7';
  ctx.fillRect(0, 0, size, size);

  const cx = 64;
  const cy = 64;
  const irisGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 40);
  irisGrad.addColorStop(0, '#5a351b');
  irisGrad.addColorStop(0.62, '#7d4a23');
  irisGrad.addColorStop(1, '#261408');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fill();

  // Warm amber inner iris gleam for lively animated eyes
  ctx.strokeStyle = 'rgba(232, 168, 86, 0.42)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy + 6, 26, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.fillStyle = '#14100d';
  ctx.beginPath();
  ctx.arc(cx, cy, 19, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 12, cy - 12, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 12, cy + 10, 4.5, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
  }
 