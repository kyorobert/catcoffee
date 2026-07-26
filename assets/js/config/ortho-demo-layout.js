// Pure-data DEMO composition for the orthogonal room prototype (ARCH-0570, re-zoned in
// ARCH-0573). It only illustrates the intended service / seating / cat zoning so the
// product owner can judge the room WITHOUT the existing saved layout getting in the way.
// It is NEVER written to the save, never spends coins and never touches inventory — the
// scene builds display-only entities from it and restores the real save when demoLayout is
// off. Every entry uses an existing furniture id at a valid, non-overlapping cell; the
// logical save entrance cells (8,7)/(9,7) stay clear and the aisles stay walkable.
//
// The layout follows the ortho-room-zones semantics (single source of spatial truth):
// equipment sits along the back wall behind the counter, the counter bar divides the work
// side from the service side, and the 2-cell main aisle (x7-8) stays fully clear as the
// door -> service spine. The prototype entry cell is ortho-room-zones' customerEntryPoint;
// this is a Demo/prototype visual + route only and does NOT change the logical save entrance.
import {ORTHO_ROOM_ZONES} from './ortho-room-zones.js?v=0573a';

export const ORTHO_DEMO_ENTRANCE = Object.freeze({...ORTHO_ROOM_ZONES.customerEntryPoint});

// A small running-cafe space (not a furniture showcase), re-zoned for the portrait screen
// (ARCH-0573, 18 items). Flow reads: enter top-right 2-cell door -> down the clear main
// aisle -> order at the counter -> seat in the centre -> cats in the front-left corner.
//   y0        equipment along the back wall (staffWorkZone); the back aisle y1 stays clear
//   y2        the counter bar (serviceCounterLine) dividing the work side from the service side
//   y3        the order/queue frontage (customerServiceZone), left plant accent
//   y4-y5     two clear table+chair groups on rugs (seatingZone), central aisle open
//   y6-y7     a single cat corner front-left (catZone), clear of the door and aisles
//   x7-x8     the main aisle (mainAisle) kept fully walkable, 2 cells wide
export const ORTHO_DEMO_LAYOUT = Object.freeze([
  // --- back-wall equipment (work side, behind the counter) ---
  {type: 'coffeeMachine', x: 1, y: 0, r: 0},
  {type: 'oven', x: 2, y: 0, r: 0},
  {type: 'dessert', x: 3, y: 0, r: 0},
  {type: 'smartOrder', x: 5, y: 0, r: 0},
  // --- counter bar: divides the work side (behind) from the service side (front) ---
  {type: 'counter', x: 2, y: 2, r: 0},        // 2x1 -> (2,2),(3,2)
  {type: 'console', x: 4, y: 2, r: 0},        // 2x1 -> (4,2),(5,2)
  // --- front-left lobby plant, at the end of the order frontage ---
  {type: 'monsterPlant', x: 1, y: 3, r: 0},
  // --- left dining group: table + two seats on a rug ---
  {type: 'creamPlaidRug', x: 1, y: 4, r: 0},  // floorDecoration 3x2 -> (1-3,4-5)
  {type: 'woodTable', x: 1, y: 4, r: 0},      // 2x1 -> (1,4),(2,4)
  {type: 'chair', x: 1, y: 5, r: 0},
  {type: 'cushionChair', x: 2, y: 5, r: 0},
  // --- right dining group: round table with two seats on a rug ---
  {type: 'rugPink', x: 5, y: 4, r: 0},        // floorDecoration 2x2 -> (5,4),(6,4),(5,5),(6,5)
  {type: 'chair', x: 5, y: 4, r: 0},
  {type: 'roundTable', x: 6, y: 4, r: 0},
  {type: 'redChair', x: 6, y: 5, r: 0},
  // --- cat corner (front-left), clear of the door and main aisle ---
  {type: 'doubleCatTree', x: 1, y: 6, r: 0},  // 1x2 -> (1,6),(1,7)
  {type: 'catBed', x: 2, y: 6, r: 0},         // 2x1 -> (2,6),(3,6)
  {type: 'scratchPost', x: 3, y: 7, r: 0}
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
