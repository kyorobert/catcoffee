import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {SpatialGrid} from '../assets/js/systems/SpatialGrid.js?v=0560a';
import {IsoProjection} from '../assets/js/systems/IsoProjection.js?v=0560a';
import {FlatProjection, FLAT_PROJECTION_PARAMS} from '../assets/js/systems/FlatProjection.js?v=0560a';
import {GridSystem} from '../assets/js/systems/GridSystem.js?v=0560a';
import {PROJECTION_MODE} from '../assets/js/core/projection-mode.js?v=0560a';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js?v=0560a';
import {PlacementSystem} from '../assets/js/systems/PlacementSystem.js?v=0560a';

const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const spatial = new SpatialGrid(ROOM_CONFIG, FURNITURE_CONFIG);
const flat = new FlatProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG);
const iso = new IsoProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG);

// --- Pinned parameters (guards the chosen shallow-oblique basis) ---
assert.deepEqual(FLAT_PROJECTION_PARAMS.axisX, {x: 112, y: 0});
assert.deepEqual(FLAT_PROJECTION_PARAMS.axisY, {x: 26, y: 84});
assert.deepStrictEqual(flat.origin, {x: 185, y: 266}, 'origin derived to centre the floor on the world centre');
assert.equal(flat.determinant, 9408);
assert.notEqual(flat.determinant, 0, 'basis matrix must be invertible');
assert.deepStrictEqual(flat.gridToWorld(0, 0), {x: 185, y: 266});
assert.deepStrictEqual(flat.gridToWorld(9, 7), {x: 1375, y: 854});
assert.deepStrictEqual(flat.gridToWorld(5, 4), {x: 849, y: 602});

// --- B. round-trip: gridToWorld -> worldToGrid recovers the grid coord ---
const gridSamples = [
  [0, 0], [5, 4], [9, 7], [0, 7], [9, 0], [2.5, 3.5], [-1, -1], [12, 9], [4.25, 6.75], [7, 2]
];
for (const [gx, gy] of gridSamples) {
  const w = flat.gridToWorld(gx, gy);
  assert.ok(Number.isFinite(w.x) && Number.isFinite(w.y), `gridToWorld finite (${gx},${gy})`);
  const back = flat.worldToGrid(w.x, w.y);
  assert.ok(approx(back.x, gx) && approx(back.y, gy), `round-trip (${gx},${gy}) -> (${back.x},${back.y})`);
}
// worldToGrid of arbitrary/out-of-room/non-integer world points stays finite
for (const [wx, wy] of [[0, 0], [1560, 1120], [-80, -40], [733.7, 481.3], [900, 50]]) {
  const g = flat.worldToGrid(wx, wy);
  assert.ok(Number.isFinite(g.x) && Number.isFinite(g.y), `worldToGrid finite (${wx},${wy})`);
}
// snap of an exact cell centre returns that integer cell
for (const [gx, gy] of [[0, 0], [3, 6], [9, 7], [5, 2]]) {
  const w = flat.getCellCenter(gx, gy);
  assert.deepStrictEqual(flat.snapWorldToGrid(w.x, w.y), {x: gx, y: gy}, `snap(centre(${gx},${gy}))`);
}

// --- C. cell geometry: 4 vertices, consistent order, shared edges, in-bounds ---
assert.deepStrictEqual(flat.getCellCenter(4, 3), flat.gridToWorld(4, 3));
for (const [gx, gy] of [[0, 0], [4, 3], [9, 7]]) {
  const d = flat.getCellDiamond(gx, gy);
  assert.equal(d.length, 4, 'cell polygon has 4 vertices');
}
// horizontal adjacency: cell(x,y) vertex1 == cell(x+1,y) vertex0
for (const [gx, gy] of [[0, 0], [3, 5], [8, 7]]) {
  const a = flat.getCellDiamond(gx, gy);
  const right = flat.getCellDiamond(gx + 1, gy);
  assert.deepStrictEqual(a[1], right[0], `right edge shared (${gx},${gy})`);
  const down = flat.getCellDiamond(gx, gy + 1);
  assert.deepStrictEqual(a[3], down[0], `bottom-left vertex shared down (${gx},${gy})`);
  assert.deepStrictEqual(a[2], down[1], `bottom-right vertex shared down (${gx},${gy})`);
}
// every cell polygon lies inside the world bounds (no clipping / black bars from geometry)
for (let y = 0; y < ROOM_CONFIG.floor.rows; y++) for (let x = 0; x < ROOM_CONFIG.floor.cols; x++) {
  for (const p of flat.getCellDiamond(x, y)) {
    assert.ok(p.x >= 0 && p.x <= ROOM_CONFIG.worldWidth, `cell (${x},${y}) x in world bounds`);
    assert.ok(p.y >= 0 && p.y <= ROOM_CONFIG.worldHeight, `cell (${x},${y}) y in world bounds`);
  }
}

// --- D. footprint: logical cells identical to iso; polygon order; anchor rules ---
const footCases = [
  ['roundTable', 3, 4, 0], ['woodTable', 2, 4, 0], ['woodTable', 2, 4, 1], ['doubleCatTree', 1, 6, 0],
  ['rugPink', 6, 5, 0], ['creamPlaidRug', 2, 4, 0], ['catCastle', 5, 2, 0], ['windowHammock', 0, 3, 0]
];
for (const [type, x, y, r] of footCases) {
  // logical footprint cells must be projection-independent (same as iso)
  assert.deepStrictEqual(
    flat.spatialGrid.getFootprintCells(type, x, y, r),
    iso.spatialGrid.getFootprintCells(type, x, y, r),
    `footprint cells projection-independent (${type})`
  );
  const poly = flat.getFootprintPolygon(type, x, y, r);
  assert.equal(poly.length, 4, `footprint polygon has 4 vertices (${type})`);
  for (const p of poly) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `polygon finite (${type})`);
}
// anchor: floorObject/wallObject use the front-bottom edge midpoint; floorDecoration uses the centroid.
assert.deepStrictEqual(flat.getAnchor('woodTable', 2, 4, 0), {x: 582, y: 644}, 'floorObject foot anchor');
assert.deepStrictEqual(flat.getAnchor('rugPink', 6, 5, 0), {x: 1056, y: 728}, 'floorDecoration centre anchor');
{
  const poly = flat.getFootprintPolygon('woodTable', 2, 4, 0);
  const foot = {x: (poly[2].x + poly[3].x) / 2, y: (poly[2].y + poly[3].y) / 2};
  assert.deepStrictEqual(flat.getAnchor('woodTable', 2, 4, 0), foot, 'foot anchor is polygon bottom-edge midpoint');
}

// --- F. GridSystem projection selection ---
const gIso = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG);                       // legacy 2-arg → iso
const gIso2 = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'iso'});
const gFlat = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: PROJECTION_MODE.FLAT});
const gBogus = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'nonsense'}); // invalid → iso
assert.equal(gIso.projectionMode, 'iso');
assert.equal(gIso2.projectionMode, 'iso');
assert.equal(gBogus.projectionMode, 'iso');
assert.equal(gFlat.projectionMode, 'flat');
assert.ok(gFlat.projection instanceof FlatProjection, 'flat GridSystem uses FlatProjection');
assert.ok(!(gIso.projection instanceof FlatProjection), 'iso GridSystem does not use FlatProjection');
assert.equal(gFlat.spatialGrid, gFlat.projection.spatialGrid, 'flat projection reuses the same SpatialGrid');
assert.equal(gFlat.room, ROOM_CONFIG, 'flat GridSystem does not clone roomConfig');
assert.equal(gFlat.spatialGrid.placeableMask, ROOM_CONFIG.floor.placeableMask, 'no duplicate mask in flat mode');
// Facade methods delegate to the active projection.
assert.deepStrictEqual(gFlat.gridToWorld(5, 4), flat.gridToWorld(5, 4), 'facade delegates to flat projection');
assert.deepStrictEqual(gIso.gridToWorld(5, 4), iso.gridToWorld(5, 4), 'facade delegates to iso projection');

// --- G. integration: logical results identical across projections; furniture safe ---
for (const [type, x, y, r] of footCases) {
  assert.deepStrictEqual(gFlat.getFootprintCells(type, x, y, r), gIso.getFootprintCells(type, x, y, r), `cells iso==flat (${type})`);
}
for (const [x, y] of [[0, 0], [9, 7], [8, 7], [5, 4], [10, 0]]) {
  assert.equal(gFlat.isInsideGrid(x, y), gIso.isInsideGrid(x, y), `isInsideGrid iso==flat (${x},${y})`);
  assert.equal(gFlat.isPlaceableCell(x, y), gIso.isPlaceableCell(x, y), `isPlaceableCell iso==flat (${x},${y})`);
}
// All 47 furniture project to finite world coords in flat mode (no NaN/crash on load).
for (const type of Object.keys(FURNITURE_CONFIG)) {
  for (let r = 0; r < 4; r++) {
    const anchor = gFlat.getAnchor(type, 4, 3, r);
    assert.ok(Number.isFinite(anchor.x) && Number.isFinite(anchor.y), `flat anchor finite (${type} r${r})`);
    const poly = gFlat.getFootprintPolygon(type, 4, 3, r);
    assert.ok(poly.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)), `flat polygon finite (${type} r${r})`);
  }
}
// Occupancy + Placement produce identical logical outcomes regardless of projection.
const items = [
  {id: 'a', type: 'roundTable', x: 3, y: 4, r: 0},
  {id: 'b', type: 'woodTable', x: 5, y: 2, r: 0},
  {id: 'c', type: 'rugPink', x: 6, y: 5, r: 0}
];
for (const grid of [gIso, gFlat]) {
  const occ = new OccupancySystem(grid, FURNITURE_CONFIG);
  occ.build(items);
  const place = new PlacementSystem(grid, occ, FURNITURE_CONFIG);
  grid.__probe = {
    walk: [...occ.getWalkabilitySnapshot()].sort(),
    place34: place.validatePlacement({type: 'chair', x: 3, y: 4, rotation: 0, movingItemId: null}).blockingReason,
    placeOut: place.validatePlacement({type: 'chair', x: 9, y: 9, rotation: 0}).blockingReason
  };
}
assert.deepStrictEqual(gFlat.__probe, gIso.__probe, 'Occupancy/Placement logical results identical across projections');

// --- Purity: FlatProjection carries no engine/DOM/storage or actor identity ---
const flatSource = readFileSync(new URL('../assets/js/systems/FlatProjection.js', import.meta.url), 'utf8');
for (const banned of ['Phaser', 'document', 'window', 'localStorage']) {
  assert.ok(!new RegExp(`\\b${banned}\\b`).test(flatSource), `FlatProjection must not reference ${banned}`);
}
assert.ok(!/\b(manager|staff|employee|worker|customer|order)\b/i.test(flatSource), 'FlatProjection must not encode actor identity');

console.log('FlatProjection: invertible shallow-oblique basis, round-trip stable, cells contiguous & in-bounds, footprint/anchor rules preserved; GridSystem selects iso by default and flat on request over one SpatialGrid; Occupancy/Placement projection-independent.');
