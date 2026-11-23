import * as THREE from 'three';

export function createSkyDomeMaterial(): THREE.ShaderMaterial {
return new THREE.ShaderMaterial({
side: THREE.BackSide,
depthWrite: false,
uniforms: {
uSunDir: { value: new THREE.Vector3(0.45, 0.55, -0.7).normalize() },
uZenithColor: { value: new THREE.Color(0x1664b8) },
uMidSkyColor: { value: new THREE.Color(0x45a3de) },
uHorizonColor: { value: new THREE.Color(0xa6dcf5) },
uSunGlowColor: { value: new THREE.Color(0xffdca0) },
},
vertexShader: `
varying vec3 vWorldDir;
void main() {
vec4 worldPos = modelMatrix * vec4(position, 1.0);
vWorldDir = normalize(position);
gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,
fragmentShader: `
uniform vec3 uSunDir;
uniform vec3 uZenithColor;
uniform vec3 uMidSkyColor;
uniform vec3 uHorizonColor;
uniform vec3 uSunGlowColor;
varying vec3 vWorldDir;

void main() {
vec3 dir = normalize(vWorldDir);
float h = clamp(dir.y, 0.0, 1.0);

vec3 sky = mix(uHorizonColor, uMidSkyColor, smoothstep(0.0, 0.36, h));
sky = mix(sky, uZenithColor, smoothstep(0.3, 0.88, h));

// Crisp sun disc + gentle warm halo without overexposing the horizon
float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
float sunHalo = pow(sunDot, 10.0) * 0.22 + pow(sunDot, 140.0) * 0.55;
sky += uSunGlowColor * sunHalo;

float horizonGlow = (1.0 - smoothstep(0.0, 0.22, h)) * pow(sunDot, 2.5) * 0.16;
sky = mix(sky, uSunGlowColor, horizonGlow);
sky = clamp(sky, 0.0, 0.98);

gl_FragColor = vec4(sky, 1.0);
}
`,
});
}

export function createOceanMaterial(): THREE.ShaderMaterial {
return new THREE.ShaderMaterial({
transparent: true,
uniforms: {
uTime: { value: 0 },
uSunDir: { value: new THREE.Vector3(0.45, 0.55, -0.7).normalize() },
uDeepColor: { value: new THREE.Color(0x0a6289) },
uShallowColor: { value: new THREE.Color(0x21bdb8) },
uFoamColor: { value: new THREE.Color(0xeef9fc) },
uFogColor: { value: new THREE.Color(0xa6dcf5) },
uFogNear: { value: 85.0 },
uFogFar: { value: 260.0 },
},
vertexShader: `
uniform float uTime;
varying vec3 vWorldPos;
varying float vWaveCrest;

void main() {
vec3 pos = position;
float w1 = sin(pos.x * 0.22 + uTime * 1.45) * cos(pos.z * 0.19 + uTime * 1.15);
float w2 = sin((pos.x * 0.52 - pos.z * 0.43) + uTime * 2.15) * 0.45;
float wave = (w1 + w2) * 0.22;
pos.y += wave;
vWaveCrest = wave;

vec4 worldPos = modelMatrix * vec4(pos, 1.0);
vWorldPos = worldPos.xyz;
gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,
fragmentShader: `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vWorldPos;
varying float vWaveCrest;

float hash(vec2 p) {
return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
vec2 i = floor(p);
vec2 f = fract(p);
vec2 u = f * f * (3.0 - 2.0 * f);
return mix(
mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
u.y
);
}

void main() {
float distFromIsland = length((vWorldPos.xz - vec2(4.0, -2.0)) / vec2(58.0, 72.0));
float shallowMask = 1.0 - smoothstep(0.65, 1.38, distFromIsland);

// Animated caustic ripple pattern
float n1 = noise(vWorldPos.xz * 0.28 + vec2(uTime * 0.35, -uTime * 0.22));
float n2 = noise(vWorldPos.xz * 0.56 - vec2(uTime * 0.25, uTime * 0.42));
float ripple = n1 * 0.6 + n2 * 0.4;

vec3 waterCol = mix(uDeepColor, uShallowColor, shallowMask * 0.85 + ripple * 0.15);

// Stylized normal from ripple gradient for crisp sunlight sparkle
vec3 nrm = normalize(vec3((n1 - 0.5) * 0.48, 1.0, (n2 - 0.5) * 0.48));
vec3 viewDir = normalize(cameraPosition - vWorldPos);
vec3 halfDir = normalize(normalize(uSunDir) + viewDir);
float spec = pow(max(dot(nrm, halfDir), 0.0), 72.0);
waterCol += vec3(1.0, 0.96, 0.84) * spec * 0.85;

// Fresnel sky reflection
float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
waterCol = mix(waterCol, vec3(0.65, 0.91, 1.0), fresnel * 0.42);

// Animated coastal surf rings & wave crest foam
float shoreRing = sin(distFromIsland * 32.0 - uTime * 2.6 + ripple * 3.0);
float coastalFoam = smoothstep(0.55, 0.92, shoreRing) * (1.0 - smoothstep(0.85, 1.24, distFromIsland));
float crestFoam = smoothstep(0.24, 0.35, vWaveCrest + ripple * 0.14);
float foam = clamp(coastalFoam * 0.72 + crestFoam * 0.45, 0.0, 1.0);

vec3 finalColor = mix(waterCol, uFoamColor, foam);

// Distance horizon fog
float camDist = length(cameraPosition - vWorldPos);
float fogFactor = smoothstep(uFogNear, uFogFar, camDist);
finalColor = mix(finalColor, uFogColor, fogFactor);

gl_FragColor = vec4(finalColor, 0.94);
}
`,
});
}

export function createPortalMaterial(): THREE.ShaderMaterial {
return new THREE.ShaderMaterial({
transparent: true,
depthWrite: false,
side: THREE.DoubleSide,
blending: THREE.AdditiveBlending,
uniforms: {
uTime: { value: 0 },
uAwakened: { value: 1.0 },
uInnerColor: { value: new THREE.Color(0xfff8d2) },
uOuterColor: { value: new THREE.Color(0xff9b1f) },
},
vertexShader: `
varying vec2 vUv;
void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
fragmentShader: `
uniform float uTime;
uniform float uAwakened;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
varying vec2 vUv;

void main() {
vec2 p = vUv * 2.0 - 1.0;
float r = length(p);
float a = atan(p.y, p.x);

float swirl = sin(a * 5.0 - uTime * 2.4 + r * 8.0) * 0.5 + 0.5;
float pulse = sin(r * 11.0 - uTime * 3.4) * 0.5 + 0.5;
float radial = 1.0 - smoothstep(0.15, 0.98, r);

vec3 col = mix(uOuterColor, uInnerColor, radial * 0.8 + swirl * 0.25);
col *= (0.45 + 0.95 * uAwakened) + pulse * 0.45 * uAwakened;
float alpha = radial * (0.35 + 0.45 * uAwakened + 0.20 * swirl);
gl_FragColor = vec4(col, alpha);
}
`,
});
}

export function createWaterfallMaterial(): THREE.ShaderMaterial {
return new THREE.ShaderMaterial({
transparent: true,
depthWrite: false,
side: THREE.DoubleSide,
uniforms: {
uTime: { value: 0 },
},
vertexShader: `
varying vec2 vUv;
void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
fragmentShader: `
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
vec2 i = floor(p);
vec2 f = fract(p);
vec2 u = f * f * (3.0 - 2.0 * f);
return mix(
mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
u.y
);
}

void main() {
vec2 flowUv = vec2(vUv.x * 5.0, vUv.y * 2.8 + uTime * 1.85);
float n1 = noise(flowUv);
float n2 = noise(flowUv * 2.3 + vec2(1.7, uTime * 1.1));
float turb = n1 * 0.6 + n2 * 0.4;

float foam = smoothstep(0.46, 0.85, turb);
vec3 deepWater = vec3(0.14, 0.62, 0.82);
vec3 foamWater = vec3(0.92, 0.98, 1.0);
vec3 water = mix(deepWater, foamWater, foam * 0.85);

// Top lip crest & bottom plunge splash
float topCrest = smoothstep(0.84, 0.98, vUv.y);
float bottomSplash = 1.0 - smoothstep(0.0, 0.25, vUv.y);
water = mix(water, foamWater, clamp(topCrest * 0.65 + bottomSplash * 0.82, 0.0, 1.0));

float edgeFade = smoothstep(0.0, 0.16, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));
float alpha = (0.78 + foam * 0.18) * edgeFade;
gl_FragColor = vec4(water, alpha);
}
`,
});
}