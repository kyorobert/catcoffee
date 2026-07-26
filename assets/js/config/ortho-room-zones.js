// Orthogonal-room spatial ZONE semantics (ARCH-0573). Pure grid-cell data + pure helpers
// — no world pixels, no engine/DOM, no actor identity — so it is fully Node-testable and
// can be projected to world bounds by any projection. This is SCENE SPATIAL SEMANTICS for
// the prototype (where the door / counter / seating / cats / aisle are and which region the
// first screen should full-bleed). It is NOT StationRegistry and NOT CustomerFlowSystem;
// no cashier / cooking / serving / AI logic lives here. It never touches the save: the
// logical save entrance in room-config ((8,7)/(9,7)) is unchanged.
//
// Rectangles are {x, y, w, h} in grid cells (x/y top-left inclusive, w/h in cells). The
// customer door is a 2-cell VISUAL door on the top wall at the right; x9 stays wall so the
// door never sits flush against the room edge. Visual door width (2 cells) is separate from
// the single logical entry point and staging cell (Pathfinding needs only one entry).
export const ORTHO_ROOM_ZONES = Object.freeze({
  grid: Object.freeze({cols: 10, rows: 8}),

  // --- customer entrance (top-right, not flush to the edge) ---
  visualDoorBounds: Object.freeze({x: 7, y: 0, w: 2, h: 1}),   // 2-cell door on the wall; x9 = wall
  customerEntranceZone: Object.freeze({x: 7, y: 0, w: 2, h: 2}),
  customerEntryPoint: Object.freeze({x: 8, y: 0}),             // single logical entry cell
  customerEntryStaging: Object.freeze({x: 8, y: 1}),           // where a customer stands after entering

  // --- service (three layers): equipment(y0)+staff aisle(y1) BEHIND the counter(y2);
  //     customers order/queue in FRONT at y3. Staff never share the customer side. ---
  staffWorkZone: Object.freeze({x: 1, y: 0, w: 6, h: 2}),      // continuous walk-behind for staff
  serviceCounterLine: Object.freeze({x: 1, y: 2, w: 6, h: 1}), // the counter bar (divides staff/customer)
  customerServiceZone: Object.freeze({x: 1, y: 3, w: 7, h: 1}),// order / cashier / pickup / queue frontage

  // --- seating + cats ---
  seatingZone: Object.freeze({x: 1, y: 4, w: 8, h: 2}),        // main table groups (y4-5)
  catZone: Object.freeze({x: 1, y: 6, w: 4, h: 2}),            // cats front-left (y6-7)

  // --- circulation: the right-side vertical spine (door -> service/seating) is >= 2 cells wide ---
  mainAisle: Object.freeze({x: 7, y: 1, w: 2, h: 6}),

  // --- first-screen full-bleed target: gameplay columns/rows only. Excludes the outer x0 & x9
  //     margins (decorative / wall) and the tall decorative upper wall (a door strip is added by
  //     the projection helper). It contains the door, counter, seating, aisle and cat zones. ---
  coreGameplayBounds: Object.freeze({x: 1, y: 0, w: 8, h: 8})
});

// --- pure helpers ---
export function zoneCells(rect) {
  const cells = [];
  for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) cells.push({x, y});
  return cells;
}
export function rectContainsCell(rect, x, y) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}
export function rectContainsRect(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
}
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
export function rectInsideGrid(rect, {cols, rows} = ORTHO_ROOM_ZONES.grid) {
  return rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= cols && rect.y + rect.h <= rows && rect.w > 0 && rect.h > 0;
}
