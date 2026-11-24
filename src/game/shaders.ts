import * as THREE from 'three';

export interface StylizedWaterOptions {
deepColorHex: number;
shallowColorHex: number;
causticColorHex: number;
foamColorHex: number;
opacity?: number;
flowSpeed?: number;
emissiveBoost?: number;
}

export function createSkyDomeMaterial(): THREE.ShaderMaterial {
return new THREE.ShaderMaterial({
side: THREE.BackSide,
depthWrite: false,
uniforms: {
uTime: { value: 0 },
uSunDir: { value: new THREE.Vector3(0.45, 0.55, -0.7).normalize() },
uZenithColor: { value: new THREE.Color(0x1664b8) },
uMidSkyColor: { value: new THREE.Color(0x45a3de) },
uHorizonColor: { value: new THREE.Color(0xa6dcf5) },
uSunGlowColor: { value: new THREE.Color(0xffdca0) },
uCloudTint: { value: new THREE.Color(0xfffaf2) },
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
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uZenithColor;
uniform vec3 uMidSkyColor;
uniform vec3 uHorizonColor;
uniform vec3 uSunGlowColor;
uniform vec3 uCloudTint;
varying vec3 vWorldDir;

float hash(vec2 p) {
return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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

float fbm(vec2 p) {
float v = 0.0;
float a = 0.52;
mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
for (int i = 0; i < 4; i++) {
v += a * noise(p);
p = rot * p * 2.02;
a *= 0.5;
}
return v;
}

void main() {
vec3 dir = normalize(vWorldDir);
float h = clamp(dir.y, 0.0, 1.0);

vec3 sky = mix(uHorizonColor, uMidSkyColor, smoothstep(0.0, 0.36, h));
sky = mix(sky, uZenithColor, smoothstep(0.3, 0.88, h));

// Crisp sun disc + Rayleigh atmospheric scattering halo
vec3 sunD = normalize(uSunDir);
float sunDot = max(dot(dir, sunD), 0.0);
float sunHalo = pow(sunDot, 10.0) * 0.24 + pow(sunDot, 160.0) * 0.72;
sky += uSunGlowColor * sunHalo;

float horizonGlow = (1.0 - smoothstep(0.0, 0.24, h)) * pow(sunDot, 2.2) * 0.2;
sky = mix(sky, uSunGlowColor, horizonGlow);

// Drifting painterly Nintendo-style cumulus clouds
if (dir.y > 0.03) {
vec2 cloudUv = dir.xz / (dir.y + 0.22);
float c1 = fbm(cloudUv * 0.65 + vec2(uTime * 0.012, uTime * 0.006));
float c2 = fbm(cloudUv * 1.35 - vec2(uTime * 0.008, -uTime * 0.01));
float density = c1 * 0.72 + c2 * 0.28;
float cloudMask = smoothstep(0.51, 0.76, density)
* smoothstep(0.03, 0.2, h)
* (1.0 - smoothstep(0.75, 0.96, h));

vec3 cloudShadow = mix(uMidSkyColor, uCloudTint, 0.72);
vec3 cloudLit = mix(uCloudTint, uSunGlowColor, 0.34 * pow(sunDot, 2.0));
float lightBand = smoothstep(0.45, 0.82, c1 + 0.16 * pow(sunDot, 1.5));
vec3 cloudColor = mix(cloudShadow, cloudLit, lightBand);
sky = mix(sky, cloudColor, cloudMask * 0.84);
}

sky = clamp(sky, 0.0, 0.99);
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
float w3 = cos((pos.x * 0.88 + pos.z * 0.71) - uTime * 2.8) * 0.22;
float wave = (w1 + w2 + w3) * 0.23;
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

// Animated caustic ripple pattern + stylized emerald subsurface scattering
float n1 = noise(vWorldPos.xz * 0.28 + vec2(uTime * 0.35, -uTime * 0.22));
float n2 = noise(vWorldPos.xz * 0.56 - vec2(uTime * 0.25, uTime * 0.42));
float ripple = n1 * 0.6 + n2 * 0.4;
float causticNet = pow(1.0 - abs(n1 - n2) * 2.0, 3.0);

vec3 waterCol = mix(uDeepColor, uShallowColor, shallowMask * 0.86 + ripple * 0.14);
waterCol += vec3(0.45, 0.98, 0.92) * causticNet * shallowMask * 0.36;

// Subsurface glow on sunlit wave crests
float sssGlow = smoothstep(0.06, 0.32, vWaveCrest);
waterCol += vec3(0.08, 0.48, 0.52) * sssGlow * 0.45;

// Stylized normal from ripple gradient for crisp sunlight sparkle
vec3 nrm = normalize(vec3((n1 - 0.5) * 0.55, 1.0, (n2 - 0.5) * 0.55));
vec3 viewDir = normalize(cameraPosition - vWorldPos);
vec3 halfDir = normalize(normalize(uSunDir) + viewDir);
float spec = pow(max(dot(nrm, halfDir), 0.0), 84.0);
waterCol += vec3(1.0, 0.96, 0.84) * spec * 1.05;

// Fresnel sky reflection
float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
waterCol = mix(waterCol, vec3(0.68, 0.93, 1.0), fresnel * 0.46);

// Animated coastal surf rings & wave crest foam
float shoreRing = sin(distFromIsland * 34.0 - uTime * 2.7 + ripple * 3.4);
float coastalFoam = smoothstep(0.54, 0.91, shoreRing) * (1.0 - smoothstep(0.84, 1.24, distFromIsland));
float crestFoam = smoothstep(0.24, 0.36, vWaveCrest + ripple * 0.14);
float foam = clamp(coastalFoam * 0.78 + crestFoam * 0.48, 0.0, 1.0);

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
/**
 * * Stylized Nintendo water shader for World 2 Cavern River/Lake & World 3 Desert Oasis:
 * ripples gently in vertex space, projects glowing animated FBM caustics & Fresnel sky sheen.
 */
 export function createStylizedWaterMaterial(
 options: StylizedWaterOptions,
 ): THREE.ShaderMaterial {
 return new THREE.ShaderMaterial({
 transparent: true,
 uniforms: {
 uTime: { value: 0 },
 uDeepColor: { value: new THREE.Color(options.deepColorHex) },
 uShallowColor: { value: new THREE.Color(options.shallowColorHex) },
 uCausticColor: { value: new THREE.Color(options.causticColorHex) },
 uFoamColor: { value: new THREE.Color(options.foamColorHex) },
 uOpacity: { value: options.opacity ?? 0.9 },
 uFlowSpeed: { value: options.flowSpeed ?? 0.85 },
 uEmissiveBoost: { value: options.emissiveBoost ?? 0.3 },
 },
 vertexShader: `
 uniform float uTime;
 uniform float uFlowSpeed;
 varying vec3 vWorldPos;
 varying float vRipple;

 void main() {
 vec4 worldBase = modelMatrix * vec4(position, 1.0);
 float t = uTime * uFlowSpeed;
 float w = sin(worldBase.x * 0.55 + t * 1.9) * cos(worldBase.z * 0.52 - t * 1.5);
 worldBase.y += w * 0.06;
 vRipple = w;
 vWorldPos = worldBase.xyz;
 gl_Position = projectionMatrix * viewMatrix * worldBase;
 }
 `,
 fragmentShader: `
 uniform float uTime;
 uniform vec3 uDeepColor;
 uniform vec3 uShallowColor;
 uniform vec3 uCausticColor;
 uniform vec3 uFoamColor;
 uniform float uOpacity;
 uniform float uFlowSpeed;
 uniform float uEmissiveBoost;

 varying vec3 vWorldPos;
 varying float vRipple;

 float hash(vec2 p) {
 return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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
 float t = uTime * uFlowSpeed;
 float n1 = noise(vWorldPos.xz * 0.55 + vec2(t * 0.45, -t * 0.32));
 float n2 = noise(vWorldPos.xz * 0.85 - vec2(t * 0.35, t * 0.52));
 float caustic = pow(1.0 - abs(n1 - n2) * 2.1, 3.0);

 vec3 col = mix(uDeepColor, uShallowColor, 0.38 + 0.42 * (n1 * 0.6 + n2 * 0.4));
 col += uCausticColor * caustic * (0.45 + uEmissiveBoost);

 vec3 nrm = normalize(vec3((n1 - 0.5) * 0.5, 1.0, (n2 - 0.5) * 0.5));
 vec3 viewDir = normalize(cameraPosition - vWorldPos);
 vec3 lightDir = normalize(vec3(0.35, 0.85, -0.45));
 float spec = pow(max(dot(nrm, normalize(lightDir + viewDir)), 0.0), 64.0);
 col += vec3(1.0, 0.98, 0.9) * spec * 0.85;

 float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
 col = mix(col, uFoamColor, fresnel * 0.35 + smoothstep(0.74, 0.96, caustic) * 0.28);

 gl_FragColor = vec4(col, uOpacity);
 }
 `,
 });
 }

 /**
 * Soft volumetric-style Fresnel god-ray material that fades cleanly on top, bottom,
 * and grazing silhouette edges so sunbeams never look like hard geometric cones.
 */
 export function createGodRayMaterial(
 colorHex = 0xfff0c2,
 opacity = 0.22,
 ): THREE.ShaderMaterial {
 return new THREE.ShaderMaterial({
 transparent: true,
 depthWrite: false,
 side: THREE.DoubleSide,
 blending: THREE.AdditiveBlending,
 uniforms: {
 uTime: { value: 0 },
 uColor: { value: new THREE.Color(colorHex) },
 uOpacity: { value: opacity },
 },
 vertexShader: `
 varying vec2 vUv;
 varying vec3 vViewNormal;
 varying vec3 vViewDir;

 void main() {
 vUv = uv;
 vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
 vViewNormal = normalize(normalMatrix * normal);
 vViewDir = normalize(-mvPos.xyz);
 gl_Position = projectionMatrix * mvPos;
 }
 `,
 fragmentShader: `
 uniform float uTime;
 uniform vec3 uColor;
 uniform float uOpacity;
 varying vec2 vUv;
 varying vec3 vViewNormal;
 varying vec3 vViewDir;

 void main() {
 float edgeSoft = pow(abs(dot(normalize(vViewNormal), normalize(vViewDir))), 1.75);
 float verticalFade = smoothstep(0.0, 0.26, vUv.y) * (1.0 - smoothstep(0.72, 1.0, vUv.y));
 float shimmer = 0.72 + 0.28 * sin(vUv.x * 18.85 + uTime * 0.65);
 float alpha = uOpacity * edgeSoft * verticalFade * shimmer;
 gl_FragColor = vec4(uColor * (0.95 + 0.35 * shimmer), alpha);
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

 float swirl = sin(a * 5.0 - uTime * 2.6 + r * 8.5) * 0.5 + 0.5;
 float pulse = sin(r * 11.0 - uTime * 3.6) * 0.5 + 0.5;
 float sparkle = pow(max(0.0, sin(a * 9.0 + uTime * 4.2) * cos(r * 16.0 - uTime * 5.0)), 4.0);
 float radial = 1.0 - smoothstep(0.14, 0.98, r);

 vec3 col = mix(uOuterColor, uInnerColor, radial * 0.8 + swirl * 0.25);
 col *= (0.45 + 1.0 * uAwakened) + pulse * 0.5 * uAwakened;
 col += vec3(1.0, 0.97, 0.82) * sparkle * 0.75 * uAwakened;
 float alpha = radial * (0.36 + 0.46 * uAwakened + 0.22 * swirl);
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
 vec2 flowUv = vec2(vUv.x * 5.2, vUv.y * 2.8 + uTime * 1.95);
 float n1 = noise(flowUv);
 float n2 = noise(flowUv * 2.3 + vec2(1.7, uTime * 1.15));
 float turb = n1 * 0.6 + n2 * 0.4;

 float foam = smoothstep(0.44, 0.84, turb);
 vec3 deepWater = vec3(0.13, 0.64, 0.84);
 vec3 foamWater = vec3(0.93, 0.99, 1.0);
 vec3 water = mix(deepWater, foamWater, foam * 0.88);

 // Top lip crest & bottom plunge splash
 float topCrest = smoothstep(0.84, 0.98, vUv.y);
 float bottomSplash = 1.0 - smoothstep(0.0, 0.26, vUv.y);
 water = mix(water, foamWater, clamp(topCrest * 0.68 + bottomSplash * 0.85, 0.0, 1.0));

 float edgeFade = smoothstep(0.0, 0.16, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));
 float alpha = (0.78 + foam * 0.2) * edgeFade;
 gl_FragColor = vec4(water, alpha);
 }
 `,
 });
 }
 