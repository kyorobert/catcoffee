import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js?v=0570a';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js?v=0570a';
import {PlacementSystem} from '../assets/js/systems/PlacementSystem.js?v=0570a';
import {ORTHO_DEMO_LAYOUT, buildOrthoDemoItems, isDemoLayoutRequested}
  from '../assets/js/config/ortho-demo-layout.js?v=0570a';

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
assert.ok(items.length >= 12, 'demo has a meaningful number of items');
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
  assert.equal(occ.getOccupant(cell.x, cell.y, 'floorObject'), null, `entrance (${cell.x},${cell.y}) clear of furniture`);
}

// --- reachability: entrance connects to counter-front and seating; aisles not blocked ---
const blocked = occ.getWalkabilitySnapshot(); // floorObject + reserved cells
const walkable = (x, y) => x >= 0 && x < cols && y >= 0 && y < rows && !blocked.has(`${x},${y}`);
function reachFrom(sx, sy) {
  const seen = new Set([`${sx},${sy}`]); const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (walkable(nx, ny) && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); q.push([nx, ny]); }
    }
  }
  return seen;
}
// a walkable cell adjacent to the (reserved) entrance
assert.ok(walkable(7, 7) || walkable(8, 6) || walkable(9, 6), 'entrance has a walkable neighbour');
const reach = reachFrom(7, 7);
for (const k of ['3,1', '4,1']) assert.ok(reach.has(k), `counter front reachable from entrance: ${k}`);
for (const k of ['2,4', '4,5', '5,4', '7,4']) assert.ok(reach.has(k), `seating approach reachable from entrance: ${k}`);
assert.ok(reach.size >= 30, 'a large connected walkable area (aisles not choked)');

// --- Purity: no engine/DOM/storage/save, no actor identity ---
const source = readFileSync(new URL('../assets/js/config/ortho-demo-layout.js', import.meta.url), 'utf8');
for (const banned of ['Phaser', 'document', 'window', 'localStorage', 'SaveAdapter']) {
  assert.ok(!new RegExp(`\\b${banned}\\b`).test(source), `ortho-demo-layout must not reference ${banned}`);
}
assert.ok(!/\b(manager|staff|employee|worker)\b/i.test(source), 'demo layout must not encode actor identity');

console.log(`Ortho demo layout: ${items.length} valid non-overlapping items from existing furniture ids, entrance clear & reachable to counter/seating, pure display-only fixture (never saved).`);
