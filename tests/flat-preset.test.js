import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
// Import via the same `?v=0577k` specifier the runtime uses so `instanceof` resolves
// against the same module instance GridSystem composes internally.
import {SpatialGrid} from '../assets/js/systems/SpatialGrid.js?v=0577k';
import {FlatProjection, FLAT_PROJECTION_PARAMS} from '../assets/js/systems/FlatProjection.js?v=0577k';
import {IsoProjection} from '../assets/js/systems/IsoProjection.js?v=0577k';
import {GridSystem} from '../assets/js/systems/GridSystem.js?v=0577k';
import {PROJECTION_MODE} from '../assets/js/core/projection-mode.js?v=0577k';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js?v=0577k';
import {PlacementSystem} from '../assets/js/systems/PlacementSystem.js?v=0577k';
import {
  FLAT_PRESETS, FLAT_PRESET_IDS, FLAT_PRESET_QUERY_KEY, DEFAULT_FLAT_PRESET_ID,
  resolveFlatPreset, getFlatPreset, flatPresetFromSearch
} from '../assets/js/config/flat-projection-presets.js?v=0577k';

const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const {cols, rows, worldWidth: W = ROOM_CONFIG.worldWidth} = ROOM_CONFIG.floor;
const worldW = ROOM_CONFIG.worldWidth, worldH = ROOM_CONFIG.worldHeight;
const spatial = new SpatialGrid(ROOM_CONFIG, FURNITURE_CONFIG);
const iso = new IsoProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG);

// --- A. Resolver: pure, safe fallback to `current` ---
assert.equal(FLAT_PRESET_QUERY_KEY, 'flatPreset');
assert.equal(DEFAULT_FLAT_PRESET_ID, 'current');
assert.deepEqual(Object.keys(FLAT_PRESETS).sort(), ['balanced', 'current', 'near-iso']);
const rawCases = [
  ['near-iso', 'near-iso'], ['balanced', 'balanced'], ['current', 'current'],
  ['', 'current'], [undefined, 'current'], [null, 'current'], ['abc', 'current'],
  ['NEAR-ISO', 'near-iso'], [' balanced ', 'balanced'], ['Current', 'current'],
  ['flat', 'current'], ['near', 'current'], [123, 'current'], [{}, 'current'], ['  ', 'current']
];
for (const [input, expected] of rawCases) {
  assert.equal(resolveFlatPreset(input), expected, `resolveFlatPreset(${JSON.stringify(input)})`);
}
const searchCases = [
  ['', 'current'], ['?flatPreset=near-iso', 'near-iso'], ['flatPreset=balanced', 'balanced'],
  ['?flatPreset=current', 'current'], ['?flatPreset=abc', 'current'], ['?flatPreset=', 'current'],
  ['?projection=flat&flatPreset=near-iso', 'near-iso'], ['?projection=flat&flatPreset=balanced', 'balanced'],
  ['?flatPreset=%20near-iso%20', 'near-iso'], ['?foo=bar', 'current'], [undefined, 'current'], [null, 'current']
];
for (const [search, expected] of searchCases) {
  assert.equal(flatPresetFromSearch(search), expected, `flatPresetFromSearch(${JSON.stringify(search)})`);
}
// getFlatPreset returns the object (never null) and falls back to current.
assert.equal(getFlatPreset('near-iso'), FLAT_PRESETS['near-iso']);
assert.equal(getFlatPreset('balanced'), FLAT_PRESETS['balanced']);
assert.equal(getFlatPreset('nonsense'), FLAT_PRESETS['current']);
assert.equal(getFlatPreset(undefined), FLAT_PRESETS['current']);

// --- B. Pinned preset bases (guards the chosen shallow-oblique spectrum) ---
// Preset C reuses the ARCH-0562 Flat params verbatim, by reference — the baseline.
assert.equal(FLAT_PRESETS.current.projection, FLAT_PROJECTION_PARAMS, 'Preset C is the ARCH-0562 Flat by reference');
assert.deepEqual(FLAT_PRESETS['near-iso'].projection.axisX, {x: 78, y: 22});
assert.deepEqual(FLAT_PRESETS['near-iso'].projection.axisY, {x: -37, y: 48});
assert.deepEqual(FLAT_PRESETS['balanced'].projection.axisX, {x: 93, y: 13});
assert.deepEqual(FLAT_PRESETS['balanced'].projection.axisY, {x: -10, y: 63});
assert.deepEqual(FLAT_PRESETS['current'].projection.axisX, {x: 112, y: 0});
assert.deepEqual(FLAT_PRESETS['current'].projection.axisY, {x: 26, y: 84});

const projA = new FlatProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG, FLAT_PRESETS['near-iso'].projection);
const projB = new FlatProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG, FLAT_PRESETS['balanced'].projection);
const projC = new FlatProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG, FLAT_PRESETS['current'].projection);

// determinants non-zero and monotonically increasing iso < A < B < C (progressively flatter).
assert.equal(projA.determinant, 4558);
assert.equal(projB.determinant, 5989);
assert.equal(projC.determinant, 9408);
for (const proj of [projA, projB, projC]) assert.notEqual(proj.determinant, 0, 'basis must be invertible');
assert.ok(4096 < projA.determinant && projA.determinant < projB.determinant && projB.determinant < projC.determinant,
  'determinant spectrum iso<A<B<C');

// derived origins + a few exact projected points (captured from the validated bases).
assert.deepStrictEqual(projA.origin, {x: 558.5, y: 293});
assert.deepStrictEqual(projB.origin, {x: 396.5, y: 281});
assert.deepStrictEqual(projC.origin, {x: 185, y: 266});
assert.deepStrictEqual(projA.gridToWorld(0, 0), {x: 558.5, y: 293});
assert.deepStrictEqual(projA.gridToWorld(9, 7), {x: 1001.5, y: 827});
assert.deepStrictEqual(projB.gridToWorld(0, 0), {x: 396.5, y: 281});
assert.deepStrictEqual(projB.gridToWorld(9, 7), {x: 1163.5, y: 839});

// --- C. Every preset: floor centroid centres on the world centre (fair camera framing) ---
const centroidX = (cols - 1) / 2, centroidY = (rows - 1) / 2;
for (const proj of [projA, projB, projC]) {
  const c = proj.gridToWorld(centroidX, centroidY);
  assert.ok(approx(c.x, worldW / 2) && approx(c.y, worldH / 2), 'grid centroid maps to world centre');
}

// --- D. Every preset: cells in-bounds, round-trip stable, footprint projection-independent ---
for (const proj of [projA, projB, projC]) {
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    for (const p of proj.getCellDiamond(x, y)) {
      assert.ok(p.x >= 0 && p.x <= worldW, `cell (${x},${y}) x in world bounds`);
      assert.ok(p.y >= 0 && p.y <= worldH, `cell (${x},${y}) y in world bounds`);
    }
    const w = proj.gridToWorld(x, y);
    const back = proj.worldToGrid(w.x, w.y);
    assert.ok(approx(back.x, x) && approx(back.y, y), `round-trip (${x},${y})`);
    assert.deepStrictEqual(proj.snapWorldToGrid(w.x, w.y), {x, y}, `snap(centre(${x},${y}))`);
  }
}
const footCases = [
  ['roundTable', 3, 4, 0], ['woodTable', 2, 4, 1], ['doubleCatTree', 1, 6, 0],
  ['rugPink', 6, 5, 0], ['creamPlaidRug', 2, 4, 0], ['catCastle', 5, 2, 0], ['windowHammock', 0, 3, 0]
];
for (const proj of [projA, projB, projC]) {
  for (const [type, x, y, r] of footCases) {
    assert.deepStrictEqual(
      proj.spatialGrid.getFootprintCells(type, x, y, r),
      iso.spatialGrid.getFootprintCells(type, x, y, r),
      `footprint cells projection-independent (${type})`
    );
    assert.equal(proj.getFootprintPolygon(type, x, y, r).length, 4);
  }
  // all 48 furniture project to finite anchors/polygons in every preset (no NaN on load).
  for (const type of Object.keys(FURNITURE_CONFIG)) for (let r = 0; r < 4; r++) {
    const anchor = proj.getAnchor(type, 4, 3, r);
    assert.ok(Number.isFinite(anchor.x) && Number.isFinite(anchor.y), `anchor finite (${type} r${r})`);
  }
}

// --- E. GridSystem preset selection over ONE SpatialGrid ---
const gIso = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG);
const gA = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: PROJECTION_MODE.FLAT, flatPreset: 'near-iso'});
const gB = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: PROJECTION_MODE.FLAT, flatPreset: 'balanced'});
const gC = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: PROJECTION_MODE.FLAT, flatPreset: 'current'});
const gDefault = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: PROJECTION_MODE.FLAT}); // no preset → current
const gBogus = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: PROJECTION_MODE.FLAT, flatPreset: 'nope'});
assert.equal(gIso.flatPreset, null, 'iso mode carries no flat preset');
assert.equal(gA.flatPreset.id, 'near-iso');
assert.equal(gB.flatPreset.id, 'balanced');
assert.equal(gC.flatPreset.id, 'current');
assert.equal(gDefault.flatPreset.id, 'current', 'flat with no preset falls back to current (ARCH-0562 URL unchanged)');
assert.equal(gBogus.flatPreset.id, 'current', 'unknown preset falls back to current');
for (const g of [gA, gB, gC]) {
  assert.ok(g.projection instanceof FlatProjection, `${g.flatPreset.id} uses FlatProjection`);
  assert.equal(g.spatialGrid, g.projection.spatialGrid, 'preset reuses the same SpatialGrid');
  assert.equal(g.spatialGrid.placeableMask, ROOM_CONFIG.floor.placeableMask, 'no duplicate mask');
}
// The chosen preset actually drives the projection.
assert.deepStrictEqual(gA.gridToWorld(9, 7), projA.gridToWorld(9, 7));
assert.deepStrictEqual(gB.gridToWorld(9, 7), projB.gridToWorld(9, 7));
assert.deepStrictEqual(gC.gridToWorld(9, 7), projC.gridToWorld(9, 7));
assert.notDeepStrictEqual(gA.gridToWorld(9, 7), gC.gridToWorld(9, 7), 'presets differ visually');

// --- F. Logical results identical across every preset AND iso (Occupancy/Placement) ---
const items = [
  {id: 'a', type: 'roundTable', x: 3, y: 4, r: 0},
  {id: 'b', type: 'woodTable', x: 5, y: 2, r: 0},
  {id: 'c', type: 'rugPink', x: 6, y: 5, r: 0}
];
const probes = [gIso, gA, gB, gC].map(grid => {
  const occ = new OccupancySystem(grid, FURNITURE_CONFIG);
  occ.build(items);
  const place = new PlacementSystem(grid, occ, FURNITURE_CONFIG);
  return {
    walk: [...occ.getWalkabilitySnapshot()].sort(),
    inside: [[0, 0], [9, 7], [8, 7], [10, 0]].map(([x, y]) => grid.isInsideGrid(x, y)),
    placeable: [[0, 0], [9, 7], [8, 7]].map(([x, y]) => grid.isPlaceableCell(x, y)),
    place34: place.validatePlacement({type: 'chair', x: 3, y: 4, rotation: 0, movingItemId: null}).blockingReason,
    footCells: footCases.map(([type, x, y, r]) => grid.getFootprintCells(type, x, y, r))
  };
});
for (let i = 1; i < probes.length; i++) {
  assert.deepStrictEqual(probes[i], probes[0], 'logical results identical across iso and all flat presets');
}

// --- G. Purity: no engine/DOM/storage/save layer, no actor identity ---
const source = readFileSync(new URL('../assets/js/config/flat-projection-presets.js', import.meta.url), 'utf8');
for (const banned of ['Phaser', 'document', 'window', 'localStorage', 'SaveAdapter']) {
  assert.ok(!new RegExp(`\\b${banned}\\b`).test(source), `flat-projection-presets must not reference ${banned}`);
}
assert.ok(!/\b(manager|staff|employee|worker|customer|order)\b/i.test(source), 'presets must not encode actor identity');

console.log('Flat presets: resolver defaults to current & stays pure; three invertible in-bounds bases (iso<A<B<C), all centred on the world centre; footprint/Occupancy/Placement identical across iso and every preset; GridSystem selects the requested preset over one SpatialGrid.');
