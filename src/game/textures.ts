import * as THREE from 'three';

function hash2d(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

export interface TexturePair {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
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

  // Base warm limestone
  ctx.fillStyle = '#9c8c6f';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

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
      const tone = 148 + Math.floor((jitter - 0.5) * 32);
      const warmG = tone - 10;
      const warmB = tone - 34;

      ctx.fillStyle = `rgb(${tone}, ${warmG}, ${warmB})`;
      ctx.fillRect(bx + 4, by + 4, colW - 8, rowH - 8);

      // Subtle beveled relief inner border
      ctx.strokeStyle = 'rgba(232, 214, 172, 0.28)';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx + 12, by + 12, colW - 24, rowH - 24);

      // Bump block face high, mortar dark
      bCtx.fillStyle = `rgb(${155 + Math.floor(jitter * 35)}, ${155 + Math.floor(jitter * 35)}, ${155 + Math.floor(jitter * 35)})`;
      bCtx.fillRect(bx + 4, by + 4, colW - 8, rowH - 8);
      bCtx.strokeStyle = '#383838';
      bCtx.lineWidth = 6;
      bCtx.strokeRect(bx + 2, by + 2, colW - 4, rowH - 4);
    }
  }

  // Organic weathering speckles and moss patches
  for (let i = 0; i < 900; i++) {
    const px = hash2d(i, 1.3) * size;
    const py = hash2d(i, 5.7) * size;
    const rad = 2 + hash2d(i, 9.1) * 9;
    const isMoss = hash2d(i, 12.4) > 0.72;
    ctx.fillStyle = isMoss
      ? `rgba(74, 118, 52, ${0.12 + hash2d(i, 3.3) * 0.22})`
      : `rgba(70, 58, 42, ${0.06 + hash2d(i, 2.2) * 0.1})`;
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();

    bCtx.fillStyle = `rgba(110, 110, 110, 0.14)`;
    bCtx.beginPath();
    bCtx.arc(px, py, rad * 0.8, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = maxAniso;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.anisotropy = maxAniso;

  return { map, bumpMap };
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

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 26);
  tex.anisotropy = maxAniso;
  return tex;
}

export function createWoodPlankTextures(maxAniso: number): TexturePair {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  ctx.fillStyle = '#6c4327';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const planks = 6;
  const h = size / planks;
  for (let p = 0; p < planks; p++) {
    const shade = 92 + Math.floor(hash2d(p, 3.1) * 26);
    ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.6)}, ${Math.floor(shade * 0.34)})`;
    ctx.fillRect(0, p * h + 2, size, h - 3);

    bCtx.fillStyle = '#a4a4a4';
    bCtx.fillRect(0, p * h + 2, size, h - 3);
    bCtx.fillStyle = '#303030';
    bCtx.fillRect(0, p * h, size, 3);

    // Wood grain streaks
    for (let g = 0; g < 16; g++) {
      const gy = p * h + 4 + hash2d(p * 20 + g, 7.1) * (h - 8);
      ctx.fillStyle = 'rgba(42, 24, 12, 0.22)';
      ctx.fillRect(0, gy, size, 1.5);
    }
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAniso;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAniso;

  return { map, bumpMap };
}

export function createSailFabricTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e5d4af';
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

  // Stylized skull & crossbones
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

  // Subtle 4-point star flare
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

  // Sclera
  ctx.fillStyle = '#fcfaf7';
  ctx.fillRect(0, 0, size, size);

  // Warm hazel-brown iris
  const cx = 64;
  const cy = 64;
  const irisGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 40);
  irisGrad.addColorStop(0, '#4e2e18');
  irisGrad.addColorStop(0.65, '#6b3e1e');
  irisGrad.addColorStop(1, '#2b180b');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#16110e';
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();

  // Pixar-style bright catchlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 12, cy - 12, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 12, cy + 10, 4.5, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
