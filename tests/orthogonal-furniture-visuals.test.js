import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {
  FURNITURE_DIRECTIONS,
  FURNITURE_VISUAL_CONFIG,
  getFurnitureVisualDefinition
} from '../assets/js/config/furniture-visual-config.js';
import {
  ORTHOGONAL_CORE_FURNITURE_IDS,
  ORTHOGONAL_FURNITURE_VISUAL_OVERRIDES
} from '../assets/js/config/orthogonal-furniture-visuals.js';
import {
  getFurnitureDisplayState,
  getFurnitureVisualPosition
} from '../assets/js/core/furniture-display-state.js';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js';
import {decodeRgbaPng, inspectRgbaPng} from './helpers/png.js';

const expectedIds = [
  'counter', 'coffeeMachine', 'oven', 'washStation', 'dessert', 'smartOrder',
  'pinkTableLong', 'roundTable', 'chair', 'creamSofa',
  'doubleCatTree', 'scratchPost'
];

assert.deepEqual(ORTHOGONAL_CORE_FURNITURE_IDS, expectedIds);
assert.deepEqual(Object.keys(ORTHOGONAL_FURNITURE_VISUAL_OVERRIDES), expectedIds);

for (const id of expectedIds) {
  const definition = FURNITURE_CONFIG[id];
  const base = FURNITURE_VISUAL_CONFIG[id];
  const ortho = getFurnitureVisualDefinition(id, 'ortho');
  assert.ok(definition, `${id}: missing gameplay definition`);
  assert.ok(ortho, `${id}: missing orthogonal visual`);
  assert.equal(ortho.projection, 'ortho', `${id}: projection marker`);
  assert.equal(ortho.calibration?.rotationAnchor, 'base-rotation', `${id}: rotation pivot calibration`);
  assert.deepEqual(ortho.footprint, base.footprint, `${id}: footprint changed`);
  assert.equal(ortho.stationType, base.stationType, `${id}: station type changed`);
  assert.deepEqual(ortho.interactionSockets, base.interactionSockets, `${id}: sockets changed`);
  assert.equal(ortho.walkBlocking, base.walkBlocking, `${id}: walk blocking changed`);
  assert.deepEqual(ortho.authoredDirections, FURNITURE_DIRECTIONS, `${id}: directions`);
  assert.equal(ortho.mirrorAllowed, false, `${id}: authored art must not mirror`);
  assert.equal(new Set(Object.values(ortho.textureByDirection)).size, 4, `${id}: unique textures`);

  for (let rotation = 0; rotation < 4; rotation += 1) {
    const display = getFurnitureDisplayState(id, rotation, definition, 'ortho');
    assert.ok(display.texture.startsWith(`furniture:ortho:${id}:`), `${id}: ortho texture`);
    assert.equal(display.usedFallback, false, `${id}: rotation ${rotation} fallback`);
    assert.equal(display.flipX, false, `${id}: rotation ${rotation} flip`);
  }

  for (const direction of FURNITURE_DIRECTIONS) {
    const path = ortho.texturePathByDirection[direction].split('?')[0];
    assert.ok(existsSync(path), `${id}/${direction}: missing ${path}`);
    const png = inspectRgbaPng(path);
    assert.ok(png.visiblePixels > 200, `${id}/${direction}: empty PNG`);
    assert.ok(png.cornerAlpha.every(alpha => alpha === 0), `${id}/${direction}: opaque corner`);
    assert.ok(png.width >= 90 && png.height >= 120, `${id}/${direction}: runtime canvas too small`);
  }
}

const orthoGrid = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'ortho'});
for (const id of expectedIds) {
  const definition = FURNITURE_CONFIG[id];
  const positions = Array.from({length: 4}, (_, rotation) => {
    const display = getFurnitureDisplayState(id, rotation, definition, 'ortho');
    return getFurnitureVisualPosition(orthoGrid, id, 3, 3, rotation, display);
  });
  for (const position of positions.slice(1)) {
    assert.deepEqual(position, positions[0], `${id}: rotation changed visual pivot`);
  }
}

for (const id of ['pinkTableLong', 'counter', 'chair', 'dessert']) {
  const definition = FURNITURE_CONFIG[id];
  const textures = [];
  for (let rotation = 0; rotation < 4; rotation += 1) {
    const display = getFurnitureDisplayState(id, rotation, definition, 'ortho');
    textures.push(display.texture);
  }
  assert.equal(new Set(textures).size, 4, `${id}: rotate must select four authored textures`);
}

const chairFrames = Object.fromEntries(FURNITURE_DIRECTIONS.map(direction => [
  direction,
  decodeRgbaPng(`./assets/furniture/orthogonal/chair/chair-${direction}.png`)
]));
function silhouetteDistance(first, second) {
  assert.equal(first.width, second.width);
  assert.equal(first.height, second.height);
  let changed = 0;
  for (let offset = 3; offset < first.rgba.length; offset += 4) {
    if ((first.rgba[offset] > 16) !== (second.rgba[offset] > 16)) changed += 1;
  }
  return changed;
}
assert.ok(
  silhouetteDistance(chairFrames['down-right'], chairFrames['down-left']) > 500,
  'chair: down-left/right must be genuinely distinct side silhouettes'
);
assert.ok(
  silhouetteDistance(chairFrames['up-right'], chairFrames['up-left']) > 500,
  'chair: up-left/right must be genuinely distinct side silhouettes'
);
assert.ok(
  silhouetteDistance(chairFrames['down-right'], chairFrames['up-right']) > 700,
  'chair: front/back silhouettes must be distinct'
);

for (const id of Object.keys(FURNITURE_CONFIG)) {
  const base = FURNITURE_VISUAL_CONFIG[id];
  assert.strictEqual(getFurnitureVisualDefinition(id), base, `${id}: default changed`);
  assert.strictEqual(getFurnitureVisualDefinition(id, 'iso'), base, `${id}: iso changed`);
  assert.strictEqual(getFurnitureVisualDefinition(id, 'flat'), base, `${id}: flat changed`);
  assert.strictEqual(getFurnitureVisualDefinition(id, 'invalid'), base, `${id}: invalid fallback changed`);
}

console.log('Orthogonal furniture visuals passed: 12 IDs, 48 transparent authored directions, visual-only override, iso/flat fallback preserved.');
