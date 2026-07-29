import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {
  FURNITURE_DIRECTIONS,
  FURNITURE_VISUAL_CONFIG,
  getFurnitureVisualDefinition
} from '../assets/js/config/furniture-visual-config.js';
import {
  ORTHOGONAL_FIRST_BATCH_FURNITURE_IDS,
  ORTHOGONAL_CORE_FURNITURE_IDS,
  ORTHOGONAL_FURNITURE_VISUAL_OVERRIDES
} from '../assets/js/config/orthogonal-furniture-visuals.js';
import {
  getFurnitureDisplayState,
  getFurnitureVisualPosition
} from '../assets/js/core/furniture-display-state.js';
import {
  ROTATION_POLICY,
  getOrthogonalRotationPolicy,
  effectiveRotationForPolicy,
  createRotationEditSession,
  advanceRotationEditSession,
  resolveNextOrthogonalRotation,
  orthogonalRotationToCardinal,
  orthogonalRotationToTextureDirection
} from '../assets/js/core/orthogonal-furniture-rotation.js';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js';
import {decodeRgbaPng, inspectRgbaPng} from './helpers/png.js';

const expectedFirstBatchIds = [
  'counter', 'coffeeMachine', 'oven', 'washStation', 'dessert', 'smartOrder',
  'pinkTableLong', 'roundTable', 'chair', 'creamSofa',
  'doubleCatTree', 'scratchPost'
];
const expectedIds = [
  ...expectedFirstBatchIds,
  'pinkTableLongHardCafe'
];

assert.deepEqual(ORTHOGONAL_FIRST_BATCH_FURNITURE_IDS, expectedFirstBatchIds);
assert.deepEqual(ORTHOGONAL_CORE_FURNITURE_IDS, expectedIds);
assert.deepEqual(Object.keys(ORTHOGONAL_FURNITURE_VISUAL_OVERRIDES), expectedIds);

for (const id of expectedIds) {
  const definition = FURNITURE_CONFIG[id];
  const base = FURNITURE_VISUAL_CONFIG[id];
  const ortho = getFurnitureVisualDefinition(id, 'ortho');
  assert.ok(definition, `${id}: missing gameplay definition`);
  assert.ok(ortho, `${id}: missing orthogonal visual`);
  assert.equal(ortho.projection, 'ortho', `${id}: projection marker`);
  assert.equal(ortho.calibration, null, `${id}: V0577C retires the base-rotation pivot calibration`);
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
    assert.equal(
      display.displayRotation,
      effectiveRotationForPolicy(rotation,display.rotationPolicy),
      `${id}: policy-aware display rotation`
    );
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

// FIX-0577D contract: a formal state still draws on its actual gameplay anchor,
// while rotation candidates move through the shared minimum-displacement envelope.
const orthoGrid = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'ortho'});
for (const id of expectedIds) {
  const definition = FURNITURE_CONFIG[id];
  const policy=getOrthogonalRotationPolicy(id,definition);
  const positions = Array.from({length: 4}, (_, rotation) => {
    const display = getFurnitureDisplayState(id, rotation, definition, 'ortho');
    const visual = getFurnitureVisualPosition(orthoGrid, id, 3, 3, rotation, display);
    const gameplayAnchor = orthoGrid.getAnchor(
      id, 3, 3, effectiveRotationForPolicy(rotation,policy)
    );
    assert.deepEqual(
      visual, {x: gameplayAnchor.x, y: gameplayAnchor.y},
      `${id}: rotation ${rotation} visual must share the gameplay anchor (no fixed pivot)`
    );
    return visual;
  });
  if(policy===ROTATION_POLICY.FIXED){
    assert.ok(positions.every(position=>JSON.stringify(position)===JSON.stringify(positions[0])));
  }else if(policy===ROTATION_POLICY.AXIS2){
    assert.deepEqual(positions[2],positions[0],`${id}: legacy r2 visually equals r0`);
    assert.deepEqual(positions[3],positions[1],`${id}: legacy r3 visually equals r1`);
  }
  let session=createRotationEditSession({
    type:id,definition,x:3,y:3,rotation:0,policy
  });
  let current={x:3,y:3,r:0};
  const steps=policy===ROTATION_POLICY.FIXED?1:policy===ROTATION_POLICY.AXIS2?2:4;
  for(let index=0;index<steps;index++){
    const resolved=resolveNextOrthogonalRotation({
      grid:orthoGrid,type:id,definition,...current,rotation:current.r,
      policy,editSession:session
    });
    current={x:resolved.resolvedX,y:resolved.resolvedY,r:resolved.resolvedRotation};
    session=advanceRotationEditSession(session,resolved);
  }
  assert.deepEqual(current,{x:3,y:3,r:0},`${id}: policy cycle round-trip`);
}

for (const id of ['counter', 'chair', 'dessert']) {
  const definition = FURNITURE_CONFIG[id];
  const textures = [];
  for (let rotation = 0; rotation < 4; rotation += 1) {
    const display = getFurnitureDisplayState(id, rotation, definition, 'ortho');
    textures.push(display.texture);
  }
  assert.equal(new Set(textures).size, 4, `${id}: rotate must select four authored textures`);
}
for (const id of ['pinkTableLong', 'pinkTableLongHardCafe']) {
  const definition=FURNITURE_CONFIG[id];
  const textures=[0,1,2,3].map(rotation=>
    getFurnitureDisplayState(id,rotation,definition,'ortho').texture
  );
  assert.equal(new Set(textures).size,2,`${id} axis2 uses two visual axes`);
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

function visiblePixelDistance(first, second) {
  assert.equal(first.width, second.width);
  assert.equal(first.height, second.height);
  let changed = 0;
  for (let offset = 0; offset < first.rgba.length; offset += 4) {
    const firstVisible = first.rgba[offset + 3] > 16;
    const secondVisible = second.rgba[offset + 3] > 16;
    if (firstVisible !== secondVisible) {
      changed += 1;
      continue;
    }
    if (!firstVisible) continue;
    const difference =
      Math.abs(first.rgba[offset] - second.rgba[offset])
      + Math.abs(first.rgba[offset + 1] - second.rgba[offset + 1])
      + Math.abs(first.rgba[offset + 2] - second.rgba[offset + 2]);
    if (difference > 36) changed += 1;
  }
  return changed;
}
function visibleBounds(frame) {
  let minX = frame.width;
  let minY = frame.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const alpha = frame.rgba[(y * frame.width + x) * 4 + 3];
      if (alpha <= 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return {
    width: maxX >= minX ? maxX - minX + 1 : 0,
    height: maxY >= minY ? maxY - minY + 1 : 0
  };
}

// ART-0577E: the cardinal contract is visible art, not merely direction labels.
assert.deepEqual(
  [0, 1, 2, 3].map(rotation => ({
    cardinal: orthogonalRotationToCardinal(rotation),
    texture: orthogonalRotationToTextureDirection(rotation)
  })),
  [
    {cardinal: 'south', texture: 'down-right'},
    {cardinal: 'west', texture: 'down-left'},
    {cardinal: 'north', texture: 'up-left'},
    {cardinal: 'east', texture: 'up-right'}
  ],
  'cardinal rotation is a perceptible clockwise quarter-turn'
);

const phaseOneFrames = Object.fromEntries(
  ['pinkTableLong', 'pinkTableLongHardCafe', 'chair', 'counter', 'dessert'].map(id => [
    id,
    Object.fromEntries(FURNITURE_DIRECTIONS.map(direction => [
      direction,
      decodeRgbaPng(
        `./assets/furniture/orthogonal/${id}/${id}-${direction}.png`
      )
    ]))
  ])
);

for (const id of ['pinkTableLong', 'pinkTableLongHardCafe']) {
  const horizontalTable = visibleBounds(phaseOneFrames[id]['down-right']);
  const verticalTable = visibleBounds(phaseOneFrames[id]['down-left']);
  assert.ok(
    horizontalTable.width >= verticalTable.width * 2.2,
    `${id} axis2 must visibly switch wide horizontal -> narrow vertical`
  );
  assert.ok(
    horizontalTable.width >= 160 && verticalTable.width <= 75,
    `${id} tabletop dominates each authored axis`
  );
  assert.ok(
    verticalTable.height >= 118,
    `${id} vertical axis remains a full-length 1x2 table rather than a small table`
  );
}
assert.equal(
  getFurnitureDisplayState(
    'pinkTableLong', 0, FURNITURE_CONFIG.pinkTableLong, 'ortho'
  ).texture,
  'furniture:ortho:pinkTableLong:down-right'
);
assert.equal(
  getFurnitureDisplayState(
    'pinkTableLong', 1, FURNITURE_CONFIG.pinkTableLong, 'ortho'
  ).texture,
  'furniture:ortho:pinkTableLong:down-left'
);
assert.equal(
  getFurnitureDisplayState(
    'pinkTableLongHardCafe', 0,
    FURNITURE_CONFIG.pinkTableLongHardCafe, 'ortho'
  ).texture,
  'furniture:ortho:pinkTableLongHardCafe:down-right'
);
assert.equal(
  getFurnitureDisplayState(
    'pinkTableLongHardCafe', 1,
    FURNITURE_CONFIG.pinkTableLongHardCafe, 'ortho'
  ).texture,
  'furniture:ortho:pinkTableLongHardCafe:down-left'
);

// The approved tables are independent products.  The new HardCafe ID has the
// same gameplay envelope and price, but never replaces or migrates SoftCute.
assert.notEqual(
  FURNITURE_CONFIG.pinkTableLongHardCafe,
  FURNITURE_CONFIG.pinkTableLong
);
assert.deepEqual(
  FURNITURE_CONFIG.pinkTableLongHardCafe.foot,
  FURNITURE_CONFIG.pinkTableLong.foot
);
assert.equal(
  FURNITURE_CONFIG.pinkTableLongHardCafe.price,
  FURNITURE_CONFIG.pinkTableLong.price
);
assert.equal(
  FURNITURE_CONFIG.pinkTableLongHardCafe.texture,
  FURNITURE_CONFIG.pinkTableLong.texture,
  'iso/flat use the documented safe base fallback'
);

for (const id of ['counter', 'dessert']) {
  const frames = phaseOneFrames[id];
  const front = visibleBounds(frames['down-right']);
  const right = visibleBounds(frames['down-left']);
  const back = visibleBounds(frames['up-left']);
  const left = visibleBounds(frames['up-right']);
  assert.ok(front.width > right.width * 1.45, `${id}: front must read wider than side`);
  assert.ok(back.width > left.width * 1.45, `${id}: back must read wider than side`);
  assert.ok(
    silhouetteDistance(frames['down-right'], frames['up-left']) > 600,
    `${id}: customer/display front and staff/service back must differ`
  );
  assert.ok(
    visiblePixelDistance(frames['down-left'], frames['up-right']) > 700,
    `${id}: west/east side views must have separately authored functional faces`
  );
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

console.log('Orthogonal furniture visuals passed: original 12 IDs intact, 1 independent HardCafe product, 52 transparent authored directions, visual-only override, iso/flat fallback preserved.');
