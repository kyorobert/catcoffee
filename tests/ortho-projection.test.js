import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
// Import via the same `?v=0575a` specifier the runtime uses so `instanceof` resolves
// against the same module instance GridSystem composes internally.
import {SpatialGrid} from '../assets/js/systems/SpatialGrid.js?v=0575a';
import {IsoProjection} from '../assets/js/systems/IsoProjection.js?v=0575a';
import {OrthogonalProjection, ORTHOGONAL_PROJECTION_PARAMS, ORTHOGONAL_ROOM_RENDER}
  from '../assets/js/systems/OrthogonalProjection.js?v=0575a';
import {ORTHO_ZONE_KEYS} from '../assets/js/config/ortho-room-zones.js?v=0575a';
import {GridSystem} from '../assets/js/systems/GridSystem.js?v=0575a';
import {PROJECTION_MODE} from '../assets/js/core/projection-mode.js?v=0575a';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js?v=0575a';
import {PlacementSystem} from '../assets/js/systems/PlacementSystem.js?v=0575a';

const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const {cols, rows} = ROOM_CONFIG.floor;
const worldW = ROOM_CONFIG.worldWidth, worldH = ROOM_CONFIG.worldHeight;
const spatial = new SpatialGrid(ROOM_CONFIG, FURNITURE_CONFIG);
const ortho = new OrthogonalProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG);
const iso = new IsoProjection(ROOM_CONFIG, spatial, FURNITURE_CONFIG);

// --- B. Axis-aligned basis: NO skew / shear / rotation, invertible, finite ---
assert.equal(ORTHOGONAL_PROJECTION_PARAMS.id, 'ortho');
assert.equal(ortho.axisX.y, 0, 'axisX.y must be exactly 0 (columns perfectly vertical)');
assert.equal(ortho.axisY.x, 0, 'axisY.x must be exactly 0 (rows perfectly horizontal)');
assert.deepEqual(ortho.axisX, {x: 88, y: 0});
assert.deepEqual(ortho.axisY, {x: 0, y: 120});
assert.equal(ortho.determinant, 88 * 120);
assert.notEqual(ortho.determinant, 0, 'basis must be invertible');
assert.deepStrictEqual(ortho.origin, {x: 384, y: 140}, 'origin derived to centre the floor');
assert.deepStrictEqual(ortho.gridToWorld(0, 0), {x: 384, y: 140});
assert.deepStrictEqual(ortho.gridToWorld(9, 7), {x: 1176, y: 980});
assert.deepStrictEqual(ortho.gridToWorld(4.5, 3.5), {x: worldW / 2, y: worldH / 2}, 'floor centroid → world centre');
// invertibility + finiteness at origin, centre, edges, corners and OUTSIDE the room
const probePts = [[0, 0], [4.5, 3.5], [9, 0], [0, 7], [9, 7], [2.5, 3.5], [-2, -2], [12, 10], [5, 0], [0, 4]];
for (const [gx, gy] of probePts) {
  const w = ortho.gridToWorld(gx, gy);
  assert.ok(Number.isFinite(w.x) && Number.isFinite(w.y), `gridToWorld finite (${gx},${gy})`);
  const b = ortho.worldToGrid(w.x, w.y);
  assert.ok(approx(b.x, gx) && approx(b.y, gy), `round-trip (${gx},${gy})`);
}
for (const [wx, wy] of [[0, 0], [worldW, worldH], [-50, -50], [733.3, 481.7], [900, 40]]) {
  const g = ortho.worldToGrid(wx, wy);
  assert.ok(Number.isFinite(g.x) && Number.isFinite(g.y), `worldToGrid finite (${wx},${wy})`);
}
// snap of an exact cell centre returns that integer cell
for (const [gx, gy] of [[0, 0], [3, 6], [9, 7], [5, 2]]) {
  const w = ortho.getCellCenter(gx, gy);
  assert.deepStrictEqual(ortho.snapWorldToGrid(w.x, w.y), {x: gx, y: gy});
}

// --- cells are upright RECTANGLES with a fixed [TL,TR,BR,BL] order, sharing edges ---
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
  const [TL, TR, BR, BL] = ortho.getCellDiamond(x, y);
  assert.equal(TL.y, TR.y, `top edge horizontal (${x},${y})`);
  assert.equal(BL.y, BR.y, `bottom edge horizontal (${x},${y})`);
  assert.equal(TL.x, BL.x, `left edge vertical (${x},${y})`);
  assert.equal(TR.x, BR.x, `right edge vertical (${x},${y})`);
  assert.ok(TL.x < TR.x && TL.y < BL.y, `positive rectangle (${x},${y})`);
  for (const p of [TL, TR, BR, BL]) {
    assert.ok(p.x >= 0 && p.x <= worldW, `cell x in world bounds (${x},${y})`);
    assert.ok(p.y >= 0 && p.y <= worldH, `cell y in world bounds (${x},${y})`);
  }
}
for (const [x, y] of [[0, 0], [3, 5], [8, 6]]) {
  const a = ortho.getCellDiamond(x, y);
  const right = ortho.getCellDiamond(x + 1, y);
  const down = ortho.getCellDiamond(x, y + 1);
  assert.deepStrictEqual(a[1], right[0], `right edge shared (${x},${y})`);
  assert.deepStrictEqual(a[3], down[0], `bottom edge shared (${x},${y})`);
  assert.deepStrictEqual(a[2], down[1], `bottom-right shared (${x},${y})`);
}
// Room outer frame is a clean rectangle inside the world.
assert.deepStrictEqual(ortho.getCellDiamond(0, 0)[0], {x: 340, y: 80});
assert.deepStrictEqual(ortho.getCellDiamond(cols - 1, rows - 1)[2], {x: 1220, y: 1040});
assert.ok(minX >= 0 || true); // (bounds already asserted per-cell)
assert.ok(ORTHOGONAL_ROOM_RENDER.wallHeight > 0 && ORTHOGONAL_ROOM_RENDER.door?.fill, 'render metadata present (wall + door surface)');
// ARCH-0573: the door sits on the LOWER wall and fits inside the full-bleed core strip.
assert.ok(ORTHOGONAL_ROOM_RENDER.doorHeight > 0 && ORTHOGONAL_ROOM_RENDER.doorHeight <= ORTHOGONAL_ROOM_RENDER.coreTopStrip,
  'door height fits within the core top strip');
assert.ok(ORTHOGONAL_ROOM_RENDER.coreTopStrip > 0 && ORTHOGONAL_ROOM_RENDER.coreTopStrip < ORTHOGONAL_ROOM_RENDER.wallHeight,
  'core top strip is a partial slice of the full wall (outer wall crops on the first screen)');

// --- C. Footprint: logical cells identical to iso; polygon is an axis-aligned rect ---
const footCases = [
  ['roundTable', 3, 4, 0], ['woodTable', 2, 4, 0], ['woodTable', 2, 4, 1], ['doubleCatTree', 1, 6, 0],
  ['rugPink', 6, 5, 0], ['creamPlaidRug', 2, 4, 0], ['catCastle', 5, 2, 0], ['windowHammock', 0, 3, 0]
];
for (const [type, x, y, r] of footCases) {
  for (let rot = 0; rot < 4; rot++) {
    assert.deepStrictEqual(
      ortho.spatialGrid.getFootprintCells(type, x, y, rot),
      iso.spatialGrid.getFootprintCells(type, x, y, rot),
      `footprint cells projection-independent (${type} r${rot})`
    );
  }
  const poly = ortho.getFootprintPolygon(type, x, y, r);
  assert.equal(poly.length, 4);
  assert.equal(poly[0].y, poly[1].y, `foot top horizontal (${type})`);
  assert.equal(poly[2].y, poly[3].y, `foot bottom horizontal (${type})`);
  assert.equal(poly[0].x, poly[3].x, `foot left vertical (${type})`);
  assert.equal(poly[1].x, poly[2].x, `foot right vertical (${type})`);
}
// anchor rules: floorObject/wallObject = front-bottom-edge midpoint; floorDecoration = centroid.
assert.deepStrictEqual(ortho.getAnchor('woodTable', 2, 4, 0), {x: 604, y: 680}, 'floorObject foot anchor (bottom-centre of the 2-wide footprint)');
{
  const poly = ortho.getFootprintPolygon('woodTable', 2, 4, 0);
  assert.deepStrictEqual(ortho.getAnchor('woodTable', 2, 4, 0),
    {x: (poly[2].x + poly[3].x) / 2, y: (poly[2].y + poly[3].y) / 2}, 'anchor is bottom-edge midpoint');
}
assert.deepStrictEqual(ortho.getAnchor('rugPink', 6, 5, 0), ortho.getCellCenter(6.5, 5.5), 'floorDecoration centre anchor');
// all 47 furniture project to finite anchors/polygons in every rotation (no NaN on load)
for (const type of Object.keys(FURNITURE_CONFIG)) for (let r = 0; r < 4; r++) {
  const a = ortho.getAnchor(type, 4, 3, r);
  assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y), `anchor finite (${type} r${r})`);
  assert.ok(ortho.getFootprintPolygon(type, 4, 3, r).every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
}

// --- E. GridSystem selection + data identical across iso and ortho over ONE SpatialGrid ---
const gIso = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG);                        // legacy 2-arg → iso
const gOrtho = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: PROJECTION_MODE.ORTHO});
const gOrthoAlias = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'ortho'});
assert.equal(gIso.projectionMode, 'iso');
assert.equal(gOrtho.projectionMode, 'ortho');
assert.equal(gOrtho.flatPreset, null, 'ortho carries no flat preset');
assert.ok(gOrtho.projection instanceof OrthogonalProjection, 'ortho GridSystem uses OrthogonalProjection');
assert.ok(!(gIso.projection instanceof OrthogonalProjection));
assert.equal(gOrtho.spatialGrid, gOrtho.projection.spatialGrid, 'ortho reuses the same SpatialGrid');
assert.equal(gOrtho.spatialGrid.placeableMask, ROOM_CONFIG.floor.placeableMask, 'no duplicate mask');
assert.equal(gOrtho.room, ROOM_CONFIG, 'ortho does not clone roomConfig');
assert.deepStrictEqual(gOrtho.gridToWorld(9, 7), ortho.gridToWorld(9, 7), 'facade delegates to ortho');
assert.notDeepStrictEqual(gOrtho.gridToWorld(9, 7), gIso.gridToWorld(9, 7), 'ortho differs from iso visually');

const items = [
  {id: 'a', type: 'roundTable', x: 3, y: 4, r: 0},
  {id: 'b', type: 'woodTable', x: 5, y: 2, r: 0},
  {id: 'c', type: 'rugPink', x: 6, y: 5, r: 0}
];
const probe = grid => {
  const occ = new OccupancySystem(grid, FURNITURE_CONFIG);
  occ.build(items);
  const place = new PlacementSystem(grid, occ, FURNITURE_CONFIG);
  return {
    walk: [...occ.getWalkabilitySnapshot()].sort(),
    inside: [[0, 0], [9, 7], [8, 7], [10, 0], [5, 4]].map(([x, y]) => grid.isInsideGrid(x, y)),
    placeable: [[0, 0], [9, 7], [8, 7], [5, 4]].map(([x, y]) => grid.isPlaceableCell(x, y)),
    footCells: footCases.map(([type, x, y, r]) => grid.getFootprintCells(type, x, y, r)),
    place34: place.validatePlacement({type: 'chair', x: 3, y: 4, rotation: 0, movingItemId: null}).blockingReason,
    placeOut: place.validatePlacement({type: 'chair', x: 9, y: 9, rotation: 0}).blockingReason
  };
};
assert.deepStrictEqual(probe(gOrtho), probe(gIso), 'Occupancy/Placement/footprint logical results identical iso vs ortho');
assert.deepStrictEqual(probe(gOrthoAlias), probe(gOrtho), 'alias and ortho behave identically');

// --- F. Zone floor palette (ARCH-0575): centralised, every zone keyed, NO dark bands ---
// The x0/x9 columns are painted with the `outer` tint; it (and every tint) must be a LIGHT
// floor colour so the room edges never read as a shadow / unusable dark bar.
const zf = ORTHOGONAL_ROOM_RENDER.zoneFloor;
const lum = hex => 0.299 * ((hex >> 16) & 255) + 0.587 * ((hex >> 8) & 255) + 0.114 * (hex & 255);
for (const key of ORTHO_ZONE_KEYS) {
  assert.equal(typeof zf[key], 'number', `zoneFloor has a colour for every zone key: ${key}`);
  assert.ok(lum(zf[key]) > 150, `zone '${key}' floor is a LIGHT tint (lum ${lum(zf[key]).toFixed(0)} > 150), not a dark band`);
}
// outer (x0/x9) and aisle must be NEUTRAL — close to each other and to the seating floor, so the
// outer columns blend with the room instead of forming a vertical colour wall.
assert.ok(Math.abs(lum(zf.outer) - lum(zf.aisle)) < 25, 'outer and aisle tints are close (neutral, no vertical wall)');
assert.ok(Math.abs(lum(zf.outer) - lum(zf.seating)) < 30, 'outer blends with the room floor');
assert.ok(ORTHOGONAL_ROOM_RENDER.backdropFill > 0 && lum(ORTHOGONAL_ROOM_RENDER.backdropFill) > 110,
  'the beyond-room backdrop is a warm ambient, not a stark dark mat');

// --- Purity: no engine/DOM/storage, no actor identity ---
const source = readFileSync(new URL('../assets/js/systems/OrthogonalProjection.js', import.meta.url), 'utf8');
for (const banned of ['Phaser', 'document', 'window', 'localStorage', 'SaveAdapter']) {
  assert.ok(!new RegExp(`\\b${banned}\\b`).test(source), `OrthogonalProjection must not reference ${banned}`);
}
assert.ok(!/\b(manager|staff|employee|worker|customer|order)\b/i.test(source), 'must not encode actor identity');

console.log('OrthogonalProjection: perfectly axis-aligned (axisX.y=0, axisY.x=0), invertible, upright rectangular cells sharing H/V edges within world bounds; footprint/Occupancy/Placement identical to iso; GridSystem selects ortho (and its alias) over one SpatialGrid.');
