import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ORTHO_ROOM_ZONES as Z, zoneCells, rectContainsCell, rectContainsRect, rectsOverlap, rectInsideGrid,
  zoneAt, ORTHO_ZONE_KEYS}
  from '../assets/js/config/ortho-room-zones.js?v=0577e';
import {DEFAULT_ORTHOGONAL_ROOM_SKIN as ROOM_SKIN}
  from '../assets/js/config/ortho-room-skin.js?v=0577e';

// --- pure helpers behave ---
assert.deepEqual(zoneCells({x: 2, y: 3, w: 2, h: 2}), [
  {x: 2, y: 3}, {x: 3, y: 3}, {x: 2, y: 4}, {x: 3, y: 4}
]);
assert.equal(rectContainsCell({x: 1, y: 1, w: 2, h: 2}, 2, 2), true);
assert.equal(rectContainsCell({x: 1, y: 1, w: 2, h: 2}, 3, 2), false);
assert.equal(rectContainsRect({x: 0, y: 0, w: 4, h: 4}, {x: 1, y: 1, w: 2, h: 2}), true);
assert.equal(rectContainsRect({x: 0, y: 0, w: 4, h: 4}, {x: 3, y: 3, w: 2, h: 2}), false);
assert.equal(rectsOverlap({x: 0, y: 0, w: 2, h: 2}, {x: 1, y: 1, w: 2, h: 2}), true);
assert.equal(rectsOverlap({x: 0, y: 0, w: 2, h: 2}, {x: 2, y: 0, w: 2, h: 2}), false);
assert.equal(rectInsideGrid({x: 8, y: 6, w: 2, h: 2}), true);
assert.equal(rectInsideGrid({x: 9, y: 0, w: 2, h: 1}), false);
assert.equal(rectInsideGrid({x: 0, y: 0, w: 0, h: 1}), false);

// --- config is frozen data (no engine/actor logic to mutate at runtime) ---
assert.ok(Object.isFrozen(Z), 'ORTHO_ROOM_ZONES is frozen');
for (const key of Object.keys(Z)) assert.ok(Object.isFrozen(Z[key]), `${key} is frozen`);

// --- grid matches the room and every zone is legal inside it ---
assert.deepEqual(Z.grid, {cols: 10, rows: 8}, 'zones describe the 10x8 room');
const rectKeys = ['logicalEntranceZone', 'customerEntranceZone', 'staffWorkZone', 'serviceCounterLine',
  'customerServiceZone', 'seatingZone', 'catZone', 'mainAisle', 'coreGameplayBounds'];
for (const key of rectKeys) assert.ok(rectInsideGrid(Z[key]), `${key} fits inside the grid`);

// --- ARCH-0575A: logical entrance is 2 INTEGER cells (x7-8); the VISUAL door LEAF is SMALLER ---
assert.deepEqual(Z.logicalEntranceZone, {x: 7, y: 0, w: 2, h: 1}, 'logical entrance is the 2 cells x7-8 on the wall row');
assert.ok(Z.logicalEntranceZone.x + Z.logicalEntranceZone.w <= 9, 'entrance never reaches x9 (x9 stays wall)');
// visualDoorBounds is the drawn door leaf, in GRID-COORD space (cells 7-8 span 6.5..8.5, centre 7.5).
const vd = ROOM_SKIN.door.gridBounds;
assert.equal(vd.y, 0, 'visual door is on the back wall row');
assert.ok(vd.w < 2, `visual door leaf is NARROWER than the 2-cell slot (w=${vd.w})`);
assert.ok(vd.w >= 1.3 && vd.w <= 1.5, `visual door leaf is ~1.3-1.5 cells wide (w=${vd.w})`);
assert.ok(Math.abs((vd.x + vd.w / 2) - 7.5) < 1e-6, 'visual door leaf is centred in the x7-8 entrance (gridX 7.5)');
assert.ok(vd.x + vd.w <= 8.5, 'visual door stays within cells 7-8; x9 (gridX >= 8.5) is wall');
assert.ok(vd.x >= 6.5, 'visual door does not spill left of the entrance');

// --- single logical entry point + staging, both inside the door column ---
assert.deepEqual(Z.customerEntryPoint, {x: 8, y: 0}, 'single entry cell at x8 on the wall row');
assert.ok(rectContainsCell(Z.logicalEntranceZone, Z.customerEntryPoint.x, Z.customerEntryPoint.y), 'entry point sits within the logical entrance');
assert.deepEqual(Z.customerEntryStaging, {x: 8, y: 1}, 'staging is one cell in from the entry');
assert.ok(rectContainsCell(Z.mainAisle, Z.customerEntryStaging.x, Z.customerEntryStaging.y), 'staging sits in the main aisle');
assert.ok(rectContainsRect(Z.customerEntranceZone, Z.logicalEntranceZone), 'entrance zone contains the logical entrance');

// --- three service layers are stacked and do NOT overlap; work side is behind the counter ---
assert.equal(Z.staffWorkZone.y + Z.staffWorkZone.h, Z.serviceCounterLine.y, 'counter sits directly in front of the work side');
assert.equal(Z.serviceCounterLine.y + Z.serviceCounterLine.h, Z.customerServiceZone.y, 'the service frontage sits directly in front of the counter');
assert.ok(!rectsOverlap(Z.staffWorkZone, Z.customerServiceZone), 'work side and service frontage never overlap');
assert.ok(!rectsOverlap(Z.staffWorkZone, Z.serviceCounterLine), 'work side and counter line never overlap');
assert.ok(!rectsOverlap(Z.serviceCounterLine, Z.customerServiceZone), 'counter line and service frontage never overlap');

// --- the main aisle is a >=2-cell vertical spine linking the door row to the service rows ---
assert.ok(Z.mainAisle.w >= 2, 'main aisle is at least 2 cells wide');
assert.ok(Z.mainAisle.y <= 1 && Z.mainAisle.y + Z.mainAisle.h >= 6, 'main aisle spans door row down to the seating rows');

// --- the first-screen core contains every key zone but excludes the outer x0/x9 margins ---
for (const key of ['serviceCounterLine', 'customerServiceZone', 'seatingZone', 'catZone', 'mainAisle']) {
  assert.ok(rectContainsRect(Z.coreGameplayBounds, Z[key]), `coreGameplayBounds contains ${key}`);
}
assert.ok(rectContainsRect(Z.coreGameplayBounds, vd), 'coreGameplayBounds contains the skin-owned visual door');
assert.ok(!rectContainsCell(Z.coreGameplayBounds, 0, 0), 'core excludes the outer x0 margin');
assert.ok(!rectContainsCell(Z.coreGameplayBounds, 9, 0), 'core excludes the outer x9 margin/wall');
assert.ok(Z.coreGameplayBounds.w < Z.grid.cols, 'core is narrower than the full room (outer columns crop)');

// --- purity: pure grid-cell data, no world pixels, no engine/DOM/storage/save ---
const source = readFileSync(new URL('../assets/js/config/ortho-room-zones.js', import.meta.url), 'utf8');
for (const banned of ['Phaser', 'document', 'window', 'localStorage', 'SaveAdapter', 'gridToWorld', 'worldWidth', 'cellWidth']) {
  assert.ok(!new RegExp(`\\b${banned}\\b`).test(source), `zones module must not reference ${banned} (no world pixels / engine)`);
}
// NOTE: the actor-identity regex is intentionally NOT applied here — zone names such as
// staffWorkZone / customerServiceZone / customerEntryPoint are legitimate spatial semantics,
// not per-actor logic. This module holds no cashier / serving / AI behaviour.

// --- zoneAt (ARCH-0574): the x1-6 bands partition cleanly, x7-8 is the aisle, x0/x9 outer ---
const {cols, rows} = Z.grid;
const counts = {};
for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
  const z = zoneAt(x, y);
  assert.ok(ORTHO_ZONE_KEYS.includes(z), `zoneAt(${x},${y}) → known key, got ${z}`);
  counts[z] = (counts[z] || 0) + 1;
}
// every CORE cell (x1-8, y0-7) is a non-outer zone; the aisle owns x7-8; x0/x9 are outer.
for (let y = 0; y < rows; y++) {
  assert.equal(zoneAt(0, y), 'outer', `x0 is outer (y${y})`);
  assert.equal(zoneAt(9, y), 'outer', `x9 is outer (y${y})`);
  for (let x = 7; x <= 8; x++) assert.equal(zoneAt(x, y), 'aisle', `x${x} is aisle (y${y})`);
  for (let x = 1; x <= 6; x++) assert.notEqual(zoneAt(x, y), 'outer', `core band cell (${x},${y}) is a real zone`);
}
// the row bands map to the intended functions on x1-6.
for (let x = 1; x <= 6; x++) {
  assert.equal(zoneAt(x, 0), 'work'); assert.equal(zoneAt(x, 1), 'work');
  assert.equal(zoneAt(x, 2), 'counter');
  assert.equal(zoneAt(x, 3), 'service');
  assert.equal(zoneAt(x, 4), 'seating'); assert.equal(zoneAt(x, 5), 'seating');
  assert.equal(zoneAt(x, 6), 'cat'); assert.equal(zoneAt(x, 7), 'cat');
}
// zoneAt agrees with the underlying rects on x1-6 (single source of truth).
for (const [key, rectName] of [['work', 'staffWorkZone'], ['counter', 'serviceCounterLine'],
  ['service', 'customerServiceZone'], ['seating', 'seatingZone'], ['cat', 'catZone']]) {
  for (const c of zoneCells(Z[rectName])) if (c.x <= 6) assert.equal(zoneAt(c.x, c.y), key, `${rectName} cell → ${key}`);
}
assert.deepEqual(counts, {work: 12, counter: 6, service: 6, seating: 12, cat: 12, aisle: 16, outer: 16},
  'clean partition: 64 core cells across work/counter/service/seating/cat/aisle, 16 outer');

console.log('Ortho room zones: 2-cell logical entrance x7-8 (x9 wall), Skin-owned ~1.4-cell visual door centred in it, single entry x8 + staging, three non-overlapping service layers, >=2-cell main aisle, clean zoneAt partition; pure Node-testable grid data.');
