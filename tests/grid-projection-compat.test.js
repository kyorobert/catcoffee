import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
// Import via the same `?v=0560a` specifier the runtime uses, so `instanceof`
// resolves against the same module instance GridSystem composes internally.
import {GridSystem} from '../assets/js/systems/GridSystem.js?v=0560a';
import {SpatialGrid} from '../assets/js/systems/SpatialGrid.js?v=0560a';
import {IsoProjection} from '../assets/js/systems/IsoProjection.js?v=0560a';

// Golden-master compatibility test for ARCH-0561-GRID-PROJECTION-SPLIT.
// The expected values below were captured from the CURRENT (pre-split) GridSystem
// before the refactor. After splitting GridSystem into SpatialGrid + IsoProjection,
// every output must remain bit-identical. Exact equality is used deliberately:
// the split preserves the identical arithmetic, so no tolerance is needed and a
// tolerance would risk hiding a one-cell or anchor shift.
const grid = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG);

// --- A. gridToWorld / worldToGrid / snapWorldToGrid / round-trip ---
const gridToWorldGolden = [
  [[0, 0], {x: 720, y: 300}], [[5, 4], {x: 784, y: 588}], [[9, 0], {x: 1296, y: 588}],
  [[0, 7], {x: 272, y: 524}], [[9, 7], {x: 848, y: 812}], [[3, 6], {x: 528, y: 588}],
  [[7, 2], {x: 1040, y: 588}], [[2, 5], {x: 528, y: 524}], [[8, 1], {x: 1168, y: 588}]
];
for (const [[x, y], expected] of gridToWorldGolden) {
  assert.deepStrictEqual(grid.gridToWorld(x, y), expected, `gridToWorld(${x},${y})`);
}

const worldToGridGolden = [
  [[720, 300], {x: 0, y: 0}],
  [[720.5, 300.25], {x: 0.0078125, y: 0}],
  [[-40, -10], {x: -10.78125, y: 1.09375}],
  [[1560, 1120], {x: 19.375, y: 6.25}],
  [[783.9, 331.1], {x: 0.9851562500000002, y: -0.013281249999999467}],
  [[656.1, 268.9], {x: -0.9851562500000002, y: 0.013281249999999467}],
  [[720, 364], {x: 1, y: 1}],
  [[848, 300], {x: 1, y: -1}]
];
for (const [[x, y], expected] of worldToGridGolden) {
  assert.deepStrictEqual(grid.worldToGrid(x, y), expected, `worldToGrid(${x},${y})`);
}

const snapGolden = [
  [[720, 300], {x: 0, y: 0}], [[720.5, 300.25], {x: 0, y: 0}], [[-40, -10], {x: -11, y: 1}],
  // Math.round of a tiny negative yields -0; this matches the pre-split GridSystem
  // exactly (the earlier JSON dump flattened -0 to 0). Kept as -0 to prove identity.
  [[1560, 1120], {x: 19, y: 6}], [[783.9, 331.1], {x: 1, y: -0}], [[656.1, 268.9], {x: -1, y: 0}],
  [[720, 364], {x: 1, y: 1}], [[848, 300], {x: 1, y: -1}]
];
for (const [[x, y], expected] of snapGolden) {
  assert.deepStrictEqual(grid.snapWorldToGrid(x, y), expected, `snapWorldToGrid(${x},${y})`);
}

// round-trip: gridToWorld then snap returns the same integer cell
for (const [[x, y]] of gridToWorldGolden) {
  const world = grid.gridToWorld(x, y);
  assert.deepStrictEqual(grid.snapWorldToGrid(world.x, world.y), {x, y}, `round-trip(${x},${y})`);
}

// --- B. cell geometry ---
assert.deepStrictEqual(grid.getCellCenter(0, 0), {x: 720, y: 300});
assert.deepStrictEqual(grid.getCellCenter(5, 4), {x: 784, y: 588});
assert.deepStrictEqual(grid.getCellCenter(9, 7), {x: 848, y: 812});

const cellDiamondGolden = [
  [[0, 0], [{x: 720, y: 268}, {x: 784, y: 300}, {x: 720, y: 332}, {x: 656, y: 300}]],
  [[5, 4], [{x: 784, y: 556}, {x: 848, y: 588}, {x: 784, y: 620}, {x: 720, y: 588}]],
  [[9, 7], [{x: 848, y: 780}, {x: 912, y: 812}, {x: 848, y: 844}, {x: 784, y: 812}]],
  [[2, 5], [{x: 528, y: 492}, {x: 592, y: 524}, {x: 528, y: 556}, {x: 464, y: 524}]]
];
for (const [[x, y], expected] of cellDiamondGolden) {
  assert.deepStrictEqual(grid.getCellDiamond(x, y), expected, `getCellDiamond(${x},${y}) vertices+order`);
}

// --- C. footprint logic (size, cells, inside, placeable) ---
const footSizeGolden = [
  [['roundTable', 0], [1, 1]], [['woodTable', 0], [2, 1]], [['woodTable', 1], [1, 2]],
  [['woodTable', 2], [2, 1]], [['woodTable', 3], [1, 2]], [['doubleCatTree', 0], [1, 2]],
  [['doubleCatTree', 1], [2, 1]], [['rugPink', 0], [2, 2]], [['creamPlaidRug', 0], [3, 2]],
  [['creamPlaidRug', 1], [2, 3]]
];
for (const [[type, r], expected] of footSizeGolden) {
  assert.deepStrictEqual(grid.getFootprintSize(type, r), expected, `getFootprintSize(${type},${r})`);
}

const footCellsGolden = [
  [['roundTable', 3, 4, 0], [{x: 3, y: 4}]],
  [['woodTable', 2, 4, 0], [{x: 2, y: 4}, {x: 3, y: 4}]],
  [['woodTable', 2, 4, 1], [{x: 2, y: 4}, {x: 2, y: 5}]],
  [['doubleCatTree', 1, 6, 0], [{x: 1, y: 6}, {x: 1, y: 7}]],
  [['rugPink', 6, 5, 0], [{x: 6, y: 5}, {x: 7, y: 5}, {x: 6, y: 6}, {x: 7, y: 6}]],
  [['creamPlaidRug', 2, 4, 0], [{x: 2, y: 4}, {x: 3, y: 4}, {x: 4, y: 4}, {x: 2, y: 5}, {x: 3, y: 5}, {x: 4, y: 5}]],
  [['catCastle', 5, 2, 0], [{x: 5, y: 2}, {x: 6, y: 2}, {x: 5, y: 3}, {x: 6, y: 3}]]
];
for (const [[type, x, y, r], expected] of footCellsGolden) {
  assert.deepStrictEqual(grid.getFootprintCells(type, x, y, r), expected, `getFootprintCells(${type},${x},${y},${r}) cells+order`);
}

const insideGolden = [
  [[0, 0], true, true], [[9, 7], true, false], [[10, 0], false, false], [[0, 8], false, false],
  [[-1, 0], false, false], [[5, 4], true, true], [[8, 7], true, false], [[9, 0], true, true]
];
for (const [[x, y], inside, placeable] of insideGolden) {
  assert.strictEqual(grid.isInsideGrid(x, y), inside, `isInsideGrid(${x},${y})`);
  assert.strictEqual(grid.isPlaceableCell(x, y), placeable, `isPlaceableCell(${x},${y})`);
}

// --- D. footprint polygon projection ---
const footPolyGolden = [
  [['roundTable', 3, 4, 0], [{x: 656, y: 492}, {x: 720, y: 524}, {x: 656, y: 556}, {x: 592, y: 524}]],
  [['woodTable', 2, 4, 0], [{x: 592, y: 460}, {x: 720, y: 524}, {x: 656, y: 556}, {x: 528, y: 492}]],
  [['woodTable', 2, 4, 1], [{x: 592, y: 460}, {x: 656, y: 492}, {x: 528, y: 556}, {x: 464, y: 524}]],
  [['doubleCatTree', 1, 6, 0], [{x: 400, y: 492}, {x: 464, y: 524}, {x: 336, y: 588}, {x: 272, y: 556}]],
  [['rugPink', 6, 5, 0], [{x: 784, y: 620}, {x: 912, y: 684}, {x: 784, y: 748}, {x: 656, y: 684}]],
  [['creamPlaidRug', 2, 4, 0], [{x: 592, y: 460}, {x: 784, y: 556}, {x: 656, y: 620}, {x: 464, y: 524}]],
  [['catCastle', 5, 2, 0], [{x: 912, y: 492}, {x: 1040, y: 556}, {x: 912, y: 620}, {x: 784, y: 556}]]
];
for (const [[type, x, y, r], expected] of footPolyGolden) {
  assert.deepStrictEqual(grid.getFootprintPolygon(type, x, y, r), expected, `getFootprintPolygon(${type},${x},${y},${r})`);
}

// --- E. anchors across layers, sizes and rotations ---
const anchorGolden = [
  [['roundTable', 3, 4, 0], {x: 624, y: 540}],       // floorObject 1x1
  [['woodTable', 2, 4, 0], {x: 592, y: 524}],        // floorObject 2x1 r0
  [['woodTable', 2, 4, 1], {x: 496, y: 540}],        // r1
  [['woodTable', 2, 4, 2], {x: 592, y: 524}],        // r2 == r0
  [['woodTable', 2, 4, 3], {x: 496, y: 540}],        // r3 == r1
  [['doubleCatTree', 1, 6, 0], {x: 304, y: 572}],    // floorObject 1x2
  [['rugPink', 6, 5, 0], {x: 784, y: 684}],          // floorDecoration center
  [['rugStripe', 3, 4, 0], {x: 656, y: 556}],        // floorDecoration center
  [['creamPlaidRug', 2, 4, 0], {x: 624, y: 540}],    // floorDecoration 3x2 center
  [['windowHammock', 0, 3, 0], {x: 496, y: 412}],    // wallObject (bottom-mid rule)
  [['photoBackdrop', 0, 1, 0], {x: 656, y: 364}],    // wallObject
  [['childrenPlayArea', 4, 3, 0], {x: 752, y: 604}], // floorObject 3x2
  [['catCastle', 5, 2, 0], {x: 848, y: 588}]         // floorObject 2x2
];
for (const [[type, x, y, r], expected] of anchorGolden) {
  assert.deepStrictEqual(grid.getAnchor(type, x, y, r), expected, `getAnchor(${type},${x},${y},${r}) layer=${FURNITURE_CONFIG[type].layer}`);
}

// --- F. Facade structure and single source of truth ---
assert.ok(grid.spatialGrid instanceof SpatialGrid, 'GridSystem exposes a SpatialGrid');
assert.ok(grid.projection instanceof IsoProjection, 'GridSystem exposes an IsoProjection');
assert.strictEqual(grid.spatialGrid, grid.projection.spatialGrid, 'projection reuses the same SpatialGrid instance');
assert.strictEqual(grid.room, ROOM_CONFIG, 'GridSystem does not clone roomConfig');
assert.strictEqual(grid.floor, ROOM_CONFIG.floor, 'GridSystem shares roomConfig.floor by reference');
assert.strictEqual(grid.spatialGrid.floor, ROOM_CONFIG.floor, 'SpatialGrid shares roomConfig.floor by reference');
assert.strictEqual(grid.projection.floor, ROOM_CONFIG.floor, 'IsoProjection shares roomConfig.floor by reference');
assert.strictEqual(grid.spatialGrid.placeableMask, ROOM_CONFIG.floor.placeableMask, 'no duplicate placeable mask');
assert.strictEqual(grid.spatialGrid.cols, ROOM_CONFIG.floor.cols, 'cols read from single source');
assert.strictEqual(grid.spatialGrid.rows, ROOM_CONFIG.floor.rows, 'rows read from single source');

// Public API preserved for existing consumers (they call grid.* unchanged).
for (const method of ['gridToWorld', 'worldToGrid', 'snapWorldToGrid', 'getCellCenter', 'getCellDiamond',
  'getFootprintSize', 'getFootprintCells', 'getFootprintPolygon', 'getAnchor', 'isInsideGrid', 'isPlaceableCell']) {
  assert.strictEqual(typeof grid[method], 'function', `GridSystem.${method} preserved`);
}

// Responsibility split: logic lives on SpatialGrid, projection lives on IsoProjection.
const spatial = new SpatialGrid(ROOM_CONFIG, FURNITURE_CONFIG);
for (const method of ['getFootprintSize', 'getFootprintCells', 'isInsideGrid', 'isPlaceableCell']) {
  assert.strictEqual(typeof spatial[method], 'function', `SpatialGrid.${method} present`);
}
for (const projectionMethod of ['gridToWorld', 'worldToGrid', 'getCellDiamond', 'getAnchor', 'getFootprintPolygon']) {
  assert.strictEqual(spatial[projectionMethod], undefined, `SpatialGrid must not own projection method ${projectionMethod}`);
}
const projection = new IsoProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG);
for (const method of ['gridToWorld', 'worldToGrid', 'snapWorldToGrid', 'getCellCenter', 'getCellDiamond', 'getFootprintPolygon', 'getAnchor']) {
  assert.strictEqual(typeof projection[method], 'function', `IsoProjection.${method} present`);
}

// Purity: the split modules must not depend on the engine, DOM or storage,
// and must not encode any manager/staff/worker identity.
const bannedTokens = /\b(Phaser|document|window|localStorage)\b/;
const identityTokens = /\b(manager|staff|employee|worker|customer|order)\b/i;
for (const file of ['../assets/js/systems/SpatialGrid.js', '../assets/js/systems/IsoProjection.js']) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  assert.ok(!bannedTokens.test(source), `${file} must stay engine/DOM/storage-free`);
  assert.ok(!identityTokens.test(source), `${file} must not encode any actor identity`);
}

console.log('Grid/Projection split compatibility: gridToWorld/worldToGrid/snap/diamond/footprint/anchor identical; SpatialGrid+IsoProjection responsibilities separated; single source of truth preserved.');
