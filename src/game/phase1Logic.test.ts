import test from 'node:test';
import assert from 'node:assert/strict';
import {
BRIDGE_BOUNDS,
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
findNearestNpc,
getIslandGroundHeight,
stepPlayerSimulation,
type InputSnapshot,
type WorldId,
} from './phase1Logic.ts';
import { STORY_CUES } from './storyCues.ts';

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
const bridgeH = getIslandGroundHeight(0, (BRIDGE_BOUNDS.minZ + BRIDGE_BOUNDS.maxZ) / 2);
const templeH = getIslandGroundHeight(TEMPLE_PORTAL_POS.x, TEMPLE_PORTAL_POS.z);

assert.ok(spawnH > 2.5, `Expected dry spawn bluff > 2.5, got ${spawnH}`);
assert.ok(bridgeH >= BRIDGE_BOUNDS.deckY, `Expected wooden bridge >= ${BRIDGE_BOUNDS.deckY}, got ${bridgeH}`);
assert.ok(templeH > 9.5, `Expected temple plateau > 9.5, got ${templeH}`);
});

test('clampDt prevents large simulation jumps on frame spikes', () => {
assert.equal(clampDt(0.5), 0.05);
assert.equal(clampDt(-1), 0);
assert.equal(clampDt(Number.NaN), 0);
assert.equal(clampDt(0.016), 0.016);
});

test('collecting 4 magic stars out of 10 unlocks flight power', () => {
const player = createInitialPlayerState();
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

test('walking forward moves Oli along the trail and accumulates walkDistance', () => {
const player = createInitialPlayerState();
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

test('pressing Space after unlocking flight lifts Oli into the sky', () => {
const player = createInitialPlayerState();
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

test('bouncy mushrooms launch Oli upward and wind rings refill flight energy', () => {
const player = createInitialPlayerState();
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
const player = createInitialPlayerState();
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

test('all 3 playable worlds have distinct themes and 3 unique Biblical Treasure Chests with valid story cues', () => {
assert.equal(TOTAL_WORLDS, 3);
for (const w of [1, 2, 3] as WorldId[]) {
const theme = WORLD_THEMES[w];
assert.ok(theme);
assert.ok(STORY_CUES[theme.introCueId], `Missing intro cue ${theme.introCueId}`);
const chests = createSunGems(w);
assert.equal(chests.length, 3);
for (const c of chests) {
assert.ok(c.bibleVerse.length > 3);
assert.ok(c.shortMeaning.length > 10);
assert.ok(STORY_CUES[c.cueId], `Missing chest story cue ${c.cueId}`);
}
const npcs = createIslandNpcs(w);
for (const n of npcs) {
assert.ok(STORY_CUES[n.cueId], `Missing NPC story cue ${n.cueId}`);
}
}
});

test('three third-party NPCs are placed on dry island terrain with proximity detection', () => {
const npcs = createIslandNpcs();
assert.equal(npcs.length, 3);
for (const npc of npcs) {
assert.ok(npc.y > 1.0, `Expected NPC ${npc.name} above water, got ${npc.y}`);
}
const near = findNearestNpc(npcs[0].x + 1.0, npcs[0].y, npcs[0].z, npcs);
assert.equal(near?.id, npcs[0].id);
});