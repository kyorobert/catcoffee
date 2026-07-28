// Pure-data DEMO composition for the orthogonal room prototype (ARCH-0570, re-zoned in
// ARCH-0573, DENSIFIED + clearly grouped in ARCH-0574). It only illustrates the intended
// service / seating / cat zoning so the product owner can judge the room WITHOUT the existing
// saved layout getting in the way. It is NEVER written to the save, never spends coins and
// never touches inventory — the scene builds display-only entities from it and restores the
// real save when demoLayout is off. Every entry uses an existing furniture id at a valid,
// non-overlapping cell; the logical save entrance cells (8,7)/(9,7) stay clear and the aisles
// stay walkable.
//
// The layout follows the ortho-room-zones partition (single source of spatial truth): the
// x1-6 columns hold the functional bands and x7-8 is the aisle. ARCH-0574 makes the reading
// unmistakable — a CONTINUOUS service band across the top, the counter bar dividing the work
// side (behind) from the customer side (front), two tightly GROUPED table sets on rugs, and a
// CONCENTRATED cat corner — while keeping deliberate walkable corridors (y1 back aisle, y3
// customer frontage, x3 & x6 gaps, x7-8 main aisle) so the flow entry -> order -> seating
// never crosses the work side. The prototype entry cell is ortho-room-zones'
// customerEntryPoint; this is a Demo/prototype visual + route only and does NOT change the
// logical save entrance.
import {ORTHO_ROOM_ZONES} from './ortho-room-zones.js?v=0577d';

export const ORTHO_DEMO_ENTRANCE = Object.freeze({...ORTHO_ROOM_ZONES.customerEntryPoint});

// A small running-cafe space (not a furniture showcase), densified for portrait readability
// (ARCH-0574, 23 items). Flow reads: enter top-right 2-cell door -> down the main aisle ->
// order at the continuous counter -> seat in one of two table groups -> cats concentrated
// in the front corner.
//   y0        CONTINUOUS equipment band across x1-6 (staffWorkZone back)
//   y1        the back aisle stays clear (walk-behind for the work side)
//   y2        the CONTINUOUS counter bar (serviceCounterLine) dividing work side / customer side
//   y3        the order/queue frontage (customerServiceZone) — an open corridor + one kiosk
//   y4-y5     two GROUPED table sets on rugs (seatingZone), x3 & x6 kept as corridors
//   y6-y7     a CONCENTRATED cat corner (catZone x1-4) + a lounge bench filling the corner
//   x7-x8     the main aisle (mainAisle) kept fully walkable, 2 cells wide
export const ORTHO_DEMO_LAYOUT = Object.freeze([
  // --- continuous back-wall equipment band (work side, behind the counter): x1-6 ---
  {type: 'coffeeMachine', x: 1, y: 0, r: 0},
  {type: 'oven', x: 2, y: 0, r: 0},
  {type: 'washStation', x: 3, y: 0, r: 0},    // 2x1 -> (3,0),(4,0)
  {type: 'dessert', x: 5, y: 0, r: 0},
  {type: 'bookshelf', x: 6, y: 0, r: 0},
  // --- continuous counter bar (divides the work side behind from the customer side front) ---
  {type: 'counter', x: 1, y: 2, r: 0},        // 2x1 -> (1,2),(2,2)
  {type: 'console', x: 3, y: 2, r: 0},        // 2x1 -> (3,2),(4,2)
  {type: 'counter', x: 5, y: 2, r: 0},        // 2x1 -> (5,2),(6,2)
  // --- customer order frontage (open queue corridor) with one self-order kiosk at the corner ---
  {type: 'smartOrder', x: 1, y: 3, r: 0},
  // --- seating group A (x1-2) on a rug; x3 stays a walkable corridor ---
  {type: 'rugStripe', x: 1, y: 4, r: 0},      // floorDecoration 2x2 -> (1-2,4-5)
  {type: 'woodTable', x: 1, y: 4, r: 0},      // 2x1 -> (1,4),(2,4)
  {type: 'chair', x: 1, y: 5, r: 0},
  {type: 'cushionChair', x: 2, y: 5, r: 0},
  // --- seating group B (x4-5) on a rug; x6 stays a walkable corridor ---
  {type: 'rugStripe', x: 4, y: 4, r: 0},      // floorDecoration 2x2 -> (4-5,4-5)
  {type: 'roundTable', x: 4, y: 4, r: 0},
  {type: 'chair', x: 5, y: 4, r: 0},
  {type: 'redChair', x: 5, y: 5, r: 0},
  {type: 'monsterPlant', x: 6, y: 4, r: 0},   // greenery accent between the group and the aisle
  // --- concentrated cat corner (x1-4) + a lounge bench filling the bottom-right ---
  {type: 'doubleCatTree', x: 1, y: 6, r: 0},  // 1x2 -> (1,6),(1,7)
  {type: 'catCastle', x: 2, y: 6, r: 0},      // 2x2 -> (2-3,6-7)
  {type: 'scratchPost', x: 4, y: 7, r: 0},
  {type: 'pawRug', x: 4, y: 6, r: 0},         // floorDecoration 2x2 -> (4-5,6-7)
  {type: 'creamSofa', x: 5, y: 7, r: 0}       // 2x1 -> (5,7),(6,7)
]);

// Deterministic ids so entities and tests can reference the demo furniture. Not saved.
export function buildOrthoDemoItems() {
  return ORTHO_DEMO_LAYOUT.map((entry, index) => ({
    id: `demo-${index}`, type: entry.type, x: entry.x, y: entry.y, r: entry.r || 0
  }));
}

// Pure URL flag: demoLayout=1 (only meaningful in orthogonal mode; the scene gates it).
export function isDemoLayoutRequested(search) {
  try {
    return new URLSearchParams(typeof search === 'string' ? search : '').get('demoLayout') === '1';
  } catch {
    return false;
  }
}
