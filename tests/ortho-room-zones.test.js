import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ORTHO_ROOM_ZONES as Z, zoneCells, rectContainsCell, rectContainsRect, rectsOverlap, rectInsideGrid}
  from '../assets/js/config/ortho-room-zones.js?v=0573a';

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
const rectKeys = ['visualDoorBounds', 'customerEntranceZone', 'staffWorkZone', 'serviceCounterLine',
  'customerServiceZone', 'seatingZone', 'catZone', 'mainAisle', 'coreGameplayBounds'];
for (const key of rectKeys) assert.ok(rectInsideGrid(Z[key]), `${key} fits inside the grid`);

// --- 2-cell visual door at the top-right, not flush to the edge; x9 stays wall ---
assert.equal(Z.visualDoorBounds.w, 2, 'visual door is 2 cells wide');
assert.equal(Z.visualDoorBounds.h, 1, 'visual door is on the wall row');
assert.equal(Z.visualDoorBounds.y, 0, 'visual door is on the back wall (y0)');
assert.ok(Z.visualDoorBounds.x + Z.visualDoorBounds.w <= 9, 'door never reaches x9 (x9 stays wall)');
assert.deepEqual(Z.visualDoorBounds, {x: 7, y: 0, w: 2, h: 1}, 'door occupies x7-8');

// --- single logical entry point + staging, both inside the door column ---
assert.deepEqual(Z.customerEntryPoint, {x: 8, y: 0}, 'single entry cell at x8 on the wall row');
assert.ok(rectContainsCell(Z.visualDoorBounds, Z.customerEntryPoint.x, Z.customerEntryPoint.y), 'entry point sits within the door');
assert.deepEqual(Z.customerEntryStaging, {x: 8, y: 1}, 'staging is one cell in from the entry');
assert.ok(rectContainsCell(Z.mainAisle, Z.customerEntryStaging.x, Z.customerEntryStaging.y), 'staging sits in the main aisle');
assert.ok(rectContainsRect(Z.customerEntranceZone, Z.visualDoorBounds), 'entrance zone contains the visual door');

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
for (const key of ['visualDoorBounds', 'serviceCounterLine', 'customerServiceZone', 'seatingZone', 'catZone', 'mainAisle']) {
  assert.ok(rectContainsRect(Z.coreGameplayBounds, Z[key]), `coreGameplayBounds contains ${key}`);
}
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

console.log('Ortho room zones: 2-cell door at x7-8 (x9 wall), single entry x8 + staging, three non-overlapping service layers, >=2-cell main aisle, core contains all key zones yet crops the outer margins; pure Node-testable grid data.');
