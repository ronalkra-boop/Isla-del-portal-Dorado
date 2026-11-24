import test from 'node:test';
import assert from 'node:assert/strict';
import {
BRIDGE_BOUNDS,
CAVERN_BRIDGE_BOUNDS,
CAVERN_PORTAL_POS,
CAVERN_SPAWN_POS,
CAVERN_STALAGMITE_PILLARS,
DESERT_OASIS_CENTER,
DESERT_PORTAL_POS,
DESERT_PYRAMID_CENTER,
DESERT_SPAWN_POS,
PLAYER_COLLISION_RADIUS,
SPAWN_POS,
STARS_TO_UNLOCK_FLIGHT,
TEMPLE_PORTAL_POS,
TOTAL_GEMS,
TOTAL_STARS,
TOTAL_WORLDS,
WORLD_THEMES,
checkGemCollection,
checkMushroomBounce,
checkPortalVictory,
checkStarCollection,
checkWindRingPass,
clampDt,
createBouncyMushrooms,
createInitialMagicStars,
createInitialPlayerState,
createIslandNpcs,
createSunGems,
createWindRings,
createWorldBouncePads,
createWorldStars,
findNearestNpc,
getCavernGroundHeight,
getDesertGroundHeight,
getIslandGroundHeight,
resolveSolidCollisions,
stepPlayerSimulation,
type InputSnapshot,
type SolidCollider,
type WorldId,
} from './phase1Logic.ts';
import { STORY_CUES, sanitizeSpokenText } from './storyCues.ts';

const idleInput: InputSnapshot = {
forward: false,
backward: false,
left: false,
right: false,
jumpOrAscend: false,
descend: false,
sprint: false,
cameraYaw: 0,
};

test('expanded spawn bluff, wooden bridge, and temple plateau are solid dry ground', () => {
const spawnH = getIslandGroundHeight(SPAWN_POS.x, SPAWN_POS.z);
const bridgeH = getIslandGroundHeight(
0,
(BRIDGE_BOUNDS.minZ + BRIDGE_BOUNDS.maxZ) / 2,
);
const templeH = getIslandGroundHeight(
TEMPLE_PORTAL_POS.x,
TEMPLE_PORTAL_POS.z,
);

assert.ok(spawnH > 2.5, `Expected dry spawn bluff > 2.5, got ${spawnH}`);
assert.ok(
bridgeH >= BRIDGE_BOUNDS.deckY,
`Expected wooden bridge >= ${BRIDGE_BOUNDS.deckY}, got ${bridgeH}`,
);
assert.ok(templeH > 9.5, `Expected temple plateau > 9.5, got ${templeH}`);
});

test('World 2 Underground Crystal Cavern has distinct subterranean topography', () => {
const spawnH = getCavernGroundHeight(CAVERN_SPAWN_POS.x, CAVERN_SPAWN_POS.z);
const bridgeH = getCavernGroundHeight(0, 13.0);
const riverBed = getCavernGroundHeight(-10.0, 11.5);
const galleryH = getCavernGroundHeight(34.0, -22.0);
const portalH = getCavernGroundHeight(CAVERN_PORTAL_POS.x, CAVERN_PORTAL_POS.z);
const outerWall = getCavernGroundHeight(78, 0);

assert.ok(spawnH > 3.5, `Cavern spawn should be solid ground, got ${spawnH}`);
assert.ok(bridgeH >= CAVERN_BRIDGE_BOUNDS.deckY, `Cavern bridge deck expected >= ${CAVERN_BRIDGE_BOUNDS.deckY}, got ${bridgeH}`);
assert.ok(riverBed < -1.2, `Cavern underground river should dip below -1.2, got ${riverBed}`);
assert.ok(galleryH > 12.5, `Cavern east crystal gallery expected > 12.5, got ${galleryH}`);
assert.ok(portalH > 10.5, `Cavern north sanctuary plateau expected > 10.5, got ${portalH}`);
assert.ok(outerWall > 15.0, `Cavern outer perimeter wall should rise steeply, got ${outerWall}`);

for (const pillar of CAVERN_STALAGMITE_PILLARS) {
assert.ok(
getCavernGroundHeight(pillar.x, pillar.z) >= pillar.topY,
`Cavern stalagmite pillar at (${pillar.x},${pillar.z}) must be walkable`,
);
}
});

test('World 3 Golden Exodus Desert has distinct stepped pyramid, oasis, and mesas', () => {
const spawnH = getDesertGroundHeight(DESERT_SPAWN_POS.x, DESERT_SPAWN_POS.z);
const pyramidSummit = getDesertGroundHeight(
DESERT_PYRAMID_CENTER.x,
DESERT_PYRAMID_CENTER.z,
);
const oasisBasin = getDesertGroundHeight(
DESERT_OASIS_CENTER.x,
DESERT_OASIS_CENTER.z,
);
const eastMesa = getDesertGroundHeight(36.0, -28.0);
const portalH = getDesertGroundHeight(DESERT_PORTAL_POS.x, DESERT_PORTAL_POS.z);

assert.ok(spawnH > 2.5, `Desert camp should be dry ground, got ${spawnH}`);
assert.ok(pyramidSummit >= 10.2, `Pyramid summit should be >= 10.2, got ${pyramidSummit}`);
assert.ok(oasisBasin < 0.6, `Oasis lagoon should be depressed below water level 0.65, got ${oasisBasin}`);
assert.ok(eastMesa >= 12.5, `East mesa plateau expected >= 12.5, got ${eastMesa}`);
assert.ok(portalH > 11.5, `Mount of Promise portal plateau expected > 11.5, got ${portalH}`);

// Confirm World 1, World 2, and World 3 have genuinely different elevations at landmarks
assert.notEqual(
Math.round(getIslandGroundHeight(-32, -16)),
Math.round(getDesertGroundHeight(-32, -16)),
'World 1 cove vs World 3 pyramid summit should have completely different elevation',
);
});

test('clampDt prevents large simulation jumps on frame spikes', () => {
assert.equal(clampDt(0.5), 0.05);
assert.equal(clampDt(-1), 0);
assert.equal(clampDt(Number.NaN), 0);
assert.equal(clampDt(0.016), 0.016);
});

test('collecting 4 magic stars out of 10 unlocks flight power', () => {
const player = createInitialPlayerState(1);
const stars = createInitialMagicStars();

assert.equal(stars.length, TOTAL_STARS);
assert.equal(player.flightUnlocked, false);

for (let i = 0; i < STARS_TO_UNLOCK_FLIGHT; i++) {
player.x = stars[i].x;
player.y = stars[i].y - 0.85;
player.z = stars[i].z;
checkStarCollection(player, stars);
}

assert.equal(player.starsCollected.length, STARS_TO_UNLOCK_FLIGHT);
assert.equal(player.flightUnlocked, true);
});

test('walking forward moves Holy along the trail and accumulates walkDistance', () => {
const player = createInitialPlayerState(1);
const stars = createInitialMagicStars();
const startZ = player.z;

for (let i = 0; i < 30; i++) {
stepPlayerSimulation(
player,
{ ...idleInput, forward: true, cameraYaw: 0 },
stars,
0.016,
);
}

assert.ok(player.z < startZ - 1.5, 'Player should advance along -Z trail');
assert.ok(player.walkDistance > 1.5, 'Walk distance should accumulate');
assert.equal(player.isFlying, false);
});

test('pressing Space after unlocking flight lifts Holy into the sky', () => {
const player = createInitialPlayerState(1);
const stars = createInitialMagicStars();
player.flightUnlocked = true;

const events = stepPlayerSimulation(
player,
{ ...idleInput, jumpOrAscend: true },
stars,
0.016,
);

assert.equal(events.startedFlying, true);
assert.equal(player.isFlying, true);
assert.ok(player.vy > 0);
});

test('bouncy mushrooms launch Holy upward and wind rings refill flight energy', () => {
const player = createInitialPlayerState(1);
const mushrooms = createBouncyMushrooms();
const rings = createWindRings();

player.x = mushrooms[0].x;
player.y = mushrooms[0].y + 0.2;
player.z = mushrooms[0].z;
player.vy = -1.0;

const bounced = checkMushroomBounce(player, mushrooms);
assert.ok(bounced !== null);
assert.equal(player.vy, mushrooms[0].bounceVy);
assert.equal(player.grounded, false);

player.flightEnergy = 20;
player.x = rings[0].x;
player.y = rings[0].y - 0.9;
player.z = rings[0].z;
const passed = checkWindRingPass(player, rings);
assert.ok(passed !== null);
assert.equal(player.flightEnergy, 100);
});

test('golden portal stays sealed until all 3 Biblical Treasure Chests are collected', () => {
const player = createInitialPlayerState(1);
const gems = createSunGems(1);
assert.equal(gems.length, TOTAL_GEMS);

player.x = TEMPLE_PORTAL_POS.x;
player.y = TEMPLE_PORTAL_POS.y - 0.8;
player.z = TEMPLE_PORTAL_POS.z;

assert.equal(checkPortalVictory(player), false);

for (const gem of gems) {
player.x = gem.x;
player.y = gem.y - 0.9;
player.z = gem.z;
checkGemCollection(player, gems);
}
assert.equal(player.gemsCollected.length, TOTAL_GEMS);

player.x = TEMPLE_PORTAL_POS.x;
player.y = TEMPLE_PORTAL_POS.y - 0.8;
player.z = TEMPLE_PORTAL_POS.z;
assert.equal(checkPortalVictory(player), true);
assert.equal(player.won, true);
});

test('all 3 playable worlds have distinct themes, 10 stars, 5 bounce pads, 3 NPCs, and 3 unique Biblical Treasure Chests with valid cues', () => {
assert.equal(TOTAL_WORLDS, 3);
for (const w of [1, 2, 3] as WorldId[]) {
const theme = WORLD_THEMES[w];
assert.ok(theme);
assert.ok(STORY_CUES[theme.introCueId], `Missing intro cue ${theme.introCueId}`);
assert.ok(STORY_CUES[theme.portalReadyCueId], `Missing portalReady cue ${theme.portalReadyCueId}`);
assert.ok(STORY_CUES[theme.victoryCueId], `Missing victory cue ${theme.victoryCueId}`);
assert.ok(STORY_CUES[theme.bounceCueId], `Missing bounce cue ${theme.bounceCueId}`);
for (const tipId of theme.wakaTipCueIds) {
assert.ok(STORY_CUES[tipId], `Missing Waka tip cue ${tipId}`);
}

assert.equal(createWorldStars(w).length, TOTAL_STARS);
assert.equal(createWorldBouncePads(w).length, 5);

const chests = createSunGems(w);
assert.equal(chests.length, 3);
for (const c of chests) {
assert.ok(c.bibleVerse.length > 3);
assert.ok(c.shortMeaning.length > 10);
assert.ok(STORY_CUES[c.cueId], `Missing chest story cue ${c.cueId}`);
}

const npcs = createIslandNpcs(w);
assert.equal(npcs.length, 3);
for (const n of npcs) {
assert.ok(n.y > 0.5, `Expected NPC ${n.name} on dry ground in world ${w}, got ${n.y}`);
assert.ok(STORY_CUES[n.cueId], `Missing NPC story cue ${n.cueId}`);
}
}
});

test('three third-party NPCs have proximity detection', () => {
const npcs = createIslandNpcs(1);
const near = findNearestNpc(npcs[0].x + 1.0, npcs[0].y, npcs[0].z, npcs);
assert.equal(near?.id, npcs[0].id);
});

test('all story cue dialogue texts and quizzes are pure spoken Spanish without stage tags or prefixes', () => {
for (const [cueId, cue] of Object.entries(STORY_CUES)) {
for (const line of cue.lines) {
assert.ok(
!/<[^>]+>/.test(line.text),
`Cue ${cueId} contains XML/stage tag in spoken text: ${line.text}`,
);
assert.ok(
!/^(Waka|Holy|Oli|CapitanCoral|Mateo|Ixchel|MineroNoe|Ester|Samuel|David|Miriam|Caleb)\s*:/i.test(line.text),
`Cue ${cueId} contains speaker prefix in spoken text: ${line.text}`,
);
assert.equal(sanitizeSpokenText(line.text), line.text.trim());
assert.ok(line.style.length > 20, `Cue ${cueId} should have acting style metadata`);
}
if (cue.quiz) {
assert.ok(cue.quiz.question.length > 10);
assert.ok(cue.quiz.wakaHint.length > 10);
assert.ok(cue.quiz.wrongReply.length > 10);
assert.ok(cue.quiz.rewardMessage.length > 10);
}
}
});

test('solid rock/tree collisions push Holy outward and allow flying cleanly over obstacles', () => {
const player = createInitialPlayerState(1);
const stars = createInitialMagicStars();
const baseY = getIslandGroundHeight(player.x, player.z - 2.4);
const rock: SolidCollider = {
x: player.x,
z: player.z - 2.4,
radius: 0.9,
minY: baseY - 0.3,
maxY: baseY + 1.4,
kind: 'rock',
};

for (let i = 0; i < 40; i++) {
stepPlayerSimulation(
player,
{ ...idleInput, forward: true, cameraYaw: 0 },
stars,
0.016,
getIslandGroundHeight,
[],
[],
[],
TEMPLE_PORTAL_POS,
0,
32,
[rock],
);
}

const distXZ = Math.hypot(player.x - rock.x, player.z - rock.z);
assert.ok(
distXZ >= PLAYER_COLLISION_RADIUS + rock.radius - 1e-4,
`Expected Holy to be stopped outside solid rock radius (${PLAYER_COLLISION_RADIUS + rock.radius}), got ${distXZ}`,
);

// Flying high above maxY clears the rock without horizontal pushback
const flyingPlayer = createInitialPlayerState(1);
flyingPlayer.x = rock.x;
flyingPlayer.z = rock.z;
flyingPlayer.y = rock.maxY + 0.5;
assert.equal(resolveSolidCollisions(flyingPlayer, [rock]), false);
});

test('dynamic moving animal collider blocks walk-through and tracks animal motion', () => {
const player = createInitialPlayerState(1);
const animal: SolidCollider = {
x: player.x,
z: player.z - 0.5,
radius: 0.75,
minY: player.y - 0.2,
maxY: player.y + 1.2,
kind: 'animal',
};

const hit1 = resolveSolidCollisions(player, [animal]);
assert.equal(hit1, true);
assert.ok(Math.hypot(player.x - animal.x, player.z - animal.z) >= PLAYER_COLLISION_RADIUS + animal.radius - 1e-4);

animal.x += 5.0;
assert.equal(resolveSolidCollisions(player, [animal]), false);
});

test('all STORY_CUES consistently address Holy (with H) and never Oli', () => {
for (const [cueId, cue] of Object.entries(STORY_CUES)) {
for (const line of cue.lines) {
assert.notEqual(line.speaker, 'Oli', `Cue ${cueId} still uses speaker Oli`);
assert.ok(!/\bOli\b/.test(line.displayName), `Cue ${cueId} displayName still mentions Oli`);
assert.ok(!/\bOli\b/.test(line.text), `Cue ${cueId} dialogue text still mentions Oli: ${line.text}`);
}
if (cue.quiz) {
assert.ok(!/\bOli\b/.test(cue.quiz.question));
assert.ok(!/\bOli\b/.test(cue.quiz.wakaHint));
assert.ok(!/\bOli\b/.test(cue.quiz.wrongReply));
assert.ok(!/\bOli\b/.test(cue.quiz.rewardMessage));
}
}
});