import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js?v=0577e';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js?v=0577e';
import {PlacementSystem} from '../assets/js/systems/PlacementSystem.js?v=0577e';
import {ORTHO_DEMO_LAYOUT, ORTHO_DEMO_ENTRANCE, buildOrthoDemoItems, isDemoLayoutRequested}
  from '../assets/js/config/ortho-demo-layout.js?v=0577e';
import {ORTHO_ROOM_ZONES as Z, rectContainsCell, zoneCells}
  from '../assets/js/config/ortho-room-zones.js?v=0577e';

const {cols, rows} = ROOM_CONFIG.floor;

// --- URL flag resolver (pure) ---
for (const [s, e] of [
  ['?demoLayout=1', true], ['?projection=ortho&demoLayout=1', true],
  ['', false], ['?demoLayout=0', false], ['?demoLayout=true', false],
  ['?projection=ortho', false], [undefined, false], [null, false], ['?foo=1', false]
]) assert.equal(isDemoLayoutRequested(s), e, `isDemoLayoutRequested(${JSON.stringify(s)})`);

// --- fixture shape: frozen data, deterministic display-only ids, existing furniture ---
assert.ok(Object.isFrozen(ORTHO_DEMO_LAYOUT), 'ORTHO_DEMO_LAYOUT is frozen');
const items = buildOrthoDemoItems();
assert.ok(items.length >= 20 && items.length <= 26, 'demo is a dense but readable cafe (ARCH-0574, ~20-26 items)');
assert.ok(items.length > 18, 'demo is denser than V0573 (18 items)');
assert.equal(items.length, ORTHO_DEMO_LAYOUT.length);
const ids = new Set(items.map(i => i.id));
assert.equal(ids.size, items.length, 'demo item ids are unique');
for (const it of items) {
  assert.match(it.id, /^demo-\d+$/, 'demo ids are display-only demo-N');
  assert.ok(FURNITURE_CONFIG[it.type], `demo furniture id exists: ${it.type}`);
  assert.ok(Number.isInteger(it.x) && Number.isInteger(it.y), 'integer grid coords');
}
// building twice yields equivalent-but-fresh objects (pure, no shared mutable state)
const again = buildOrthoDemoItems();
assert.notEqual(again, items);
assert.notEqual(again[0], items[0]);
assert.deepStrictEqual(again, items);

// --- zone membership: each item's origin cell sits in its intended zone ---
const equipment = ['coffeeMachine', 'oven', 'dessert', 'washStation', 'bookshelf'];
const counters = ['counter', 'console'];
const cats = ['catBed', 'doubleCatTree', 'scratchPost', 'catTent', 'catCastle'];
for (const it of items) {
  if (equipment.includes(it.type)) assert.ok(rectContainsCell(Z.staffWorkZone, it.x, it.y), `${it.type} in staffWorkZone`);
  if (counters.includes(it.type)) assert.ok(rectContainsCell(Z.serviceCounterLine, it.x, it.y), `${it.type} on serviceCounterLine`);
  if (cats.includes(it.type)) assert.ok(rectContainsCell(Z.catZone, it.x, it.y), `${it.type} in catZone`);
  if (it.type === 'smartOrder') assert.ok(rectContainsCell(Z.customerServiceZone, it.x, it.y), 'the order kiosk faces the customer service zone');
}
// A CONTINUOUS service band: the counter cells and the equipment cells each cover x1-6 with no gap.
const gridForBand = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'ortho'});
const cellsAt = row => new Set(items.flatMap(it => gridForBand.getFootprintCells(it.type, it.x, it.y, it.r)).filter(c => c.y === row).map(c => c.x));
const counterXs = cellsAt(2), equipmentXs = cellsAt(0);
for (let x = 1; x <= 6; x++) {
  assert.ok(equipmentXs.has(x), `continuous equipment band covers x${x} (no gap)`);
  assert.ok(counterXs.has(x), `continuous counter bar covers x${x} (no gap)`);
}
assert.ok(items.filter(i => cats.includes(i.type)).length >= 2, 'a concentrated cat cluster exists');
// No furniture inside the main aisle spine (kept clear for circulation).
for (const it of items) {
  const cells = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'ortho'}).getFootprintCells(it.type, it.x, it.y, it.r);
  assert.ok(cells.every(c => !rectContainsCell(Z.mainAisle, c.x, c.y)), `${it.type} does not sit in the main aisle`);
}

// --- placement validity: every item places, nothing overlaps, entrance stays clear ---
const grid = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'ortho'});
const occ = new OccupancySystem(grid, FURNITURE_CONFIG);
occ.build(items);
const place = new PlacementSystem(grid, occ, FURNITURE_CONFIG);
for (const it of items) {
  const r = place.validatePlacement({type: it.type, x: it.x, y: it.y, rotation: it.r, movingItemId: it.id});
  assert.ok(r.valid, `demo item places validly: ${it.type}@(${it.x},${it.y}) → ${r.blockingReason}`);
  const cells = grid.getFootprintCells(it.type, it.x, it.y, it.r);
  assert.ok(cells.every(c => grid.isInsideGrid(c.x, c.y)), `${it.type} inside grid`);
}
for (const cell of ROOM_CONFIG.entrance.cells) {
  assert.equal(occ.getOccupant(cell.x, cell.y, 'floorObject'), null, `logical save entrance (${cell.x},${cell.y}) clear of furniture`);
}

// --- reachability + zoning integrity ---
const blocked = occ.getWalkabilitySnapshot(); // floorObject + reserved cells
const walkable = (x, y) => x >= 0 && x < cols && y >= 0 && y < rows && !blocked.has(`${x},${y}`);
function reachFrom(sx, sy, wall = () => false) {
  const seen = new Set([`${sx},${sy}`]); const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (walkable(nx, ny) && !wall(nx, ny) && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); q.push([nx, ny]); }
    }
  }
  return seen;
}
// The demo prototype entry is ortho-room-zones' single logical entry point (2-cell door at x7-8).
assert.deepEqual(ORTHO_DEMO_ENTRANCE, {x: 8, y: 0}, 'demo entry point matches customerEntryPoint (x8)');
assert.equal(walkable(ORTHO_DEMO_ENTRANCE.x, ORTHO_DEMO_ENTRANCE.y),false,'door threshold is formally reserved');
assert.ok(walkable(Z.customerEntryStaging.x, Z.customerEntryStaging.y), 'entry staging cell is walkable');
const reach = reachFrom(Z.customerEntryStaging.x, Z.customerEntryStaging.y);
for (const k of ['4,3', '5,3', '7,3']) assert.ok(reach.has(k), `service frontage reachable from entry: ${k}`);
for (const k of ['3,4', '3,5', '4,5']) assert.ok(reach.has(k), `seating approach reachable from entry: ${k}`);
for (const k of ['4,6', '5,6']) assert.ok(reach.has(k), `cat area reachable from entry: ${k}`);
assert.ok(reach.size >= 40, 'a large connected walkable area (aisles not a one-cell maze)');

// Main aisle (door -> service spine) is fully walkable and ~2 cells wide.
const aisleCells = zoneCells(Z.mainAisle);
assert.ok(aisleCells.every(c => walkable(c.x, c.y)), 'the entire main aisle stays walkable (2 cells wide)');
assert.equal(Z.mainAisle.w, 2, 'main aisle is 2 cells wide');

// Circulation stays out of the work side: a customer route that never enters staffWorkZone
// can still reach the service frontage, seating and cats.
const inStaff = (x, y) => rectContainsCell(Z.staffWorkZone, x, y);
const custReach = reachFrom(Z.customerEntryStaging.x, Z.customerEntryStaging.y, inStaff);
for (const k of ['4,3', '3,5', '4,6']) assert.ok(custReach.has(k), `service route avoids the work side yet reaches: ${k}`);

// The work side is internally continuous (a connected walk-behind, not accidental gaps).
const workCells = zoneCells(Z.staffWorkZone).filter(c => walkable(c.x, c.y));
assert.ok(workCells.length >= 4, 'the work side has room to move');
const workReach = reachFrom(workCells[0].x, workCells[0].y, (x, y) => !inStaff(x, y));
assert.equal(workReach.size, workCells.length, 'the work side is one connected walkable region');

// --- Purity: no engine/DOM/storage/save, no actor identity ---
const source = readFileSync(new URL('../assets/js/config/ortho-demo-layout.js', import.meta.url), 'utf8');
for (const banned of ['Phaser', 'document', 'window', 'localStorage', 'SaveAdapter']) {
  assert.ok(!new RegExp(`\\b${banned}\\b`).test(source), `ortho-demo-layout must not reference ${banned}`);
}
assert.ok(!/\b(manager|staff|employee|worker)\b/i.test(source), 'demo layout must not encode actor identity');

console.log(`Ortho demo layout: ${items.length} valid non-overlapping items zoned by ortho-room-zones (equipment/counter/seating/cats), 2-cell main aisle clear, entry -> service/seating/cats reachable without crossing the work side, work side continuous, pure display-only fixture (never saved).`);
