// Pure-data DEMO composition for ART-0577K. It illustrates the approved
// service-band option C, two independent table products and a compact cat
// zone using the real Grid/Occupancy/Placement/BFS path. It is NEVER written
// to the save, never spends coins and never touches inventory.
//
// The layout follows the ortho-room-zones partition (single source of spatial truth): the
// x1-6 columns hold the functional bands and x7-8 is the aisle. The selected
// option C reads left-to-right as counter -> coffee -> wash -> dessert on one
// continuous real-grid line. Two close seating islands intentionally have no
// concept-only rugs or screen-space blocks. Deliberate corridors (y1 back
// aisle, y3 customer frontage, x3 & x6 gaps, x7-8 main aisle) keep the flow
// entry -> order -> seating clear. The prototype entry cell is ortho-room-zones'
// customerEntryPoint; this is a Demo/prototype visual + route only and does NOT change the
// logical save entrance.
import {ORTHO_ROOM_ZONES} from './ortho-room-zones.js?v=0577n';

export const ORTHO_DEMO_ENTRANCE = Object.freeze({...ORTHO_ROOM_ZONES.customerEntryPoint});

// A small running-cafe space (not a contact sheet). Flow reads: enter the
// top-right door -> main aisle -> option-C service band -> one of two table
// products -> cat corner.
//   y0-y1     clear work-side circulation
//   y2        option C: counter -> coffee -> wash -> dessert across x1-6
//   y3        customer order frontage — open corridor + one kiosk
//   y4-y5     SoftCute and HardCafe seating islands; x3/x6 are corridors
//   y6-y7     a CONCENTRATED cat corner (catZone x1-4) + a lounge bench filling the corner
//   x7-x8     the main aisle (mainAisle) kept fully walkable, 2 cells wide
export const ORTHO_DEMO_LAYOUT = Object.freeze([
  // --- approved option C, one continuous service line: x1-6 ---
  {type: 'counter', x: 1, y: 2, r: 0},        // 2x1 -> (1,2),(2,2)
  {type: 'coffeeMachine', x: 3, y: 2, r: 0},
  {type: 'washStation', x: 4, y: 2, r: 0},    // 2x1 -> (4,2),(5,2)
  {type: 'dessert', x: 6, y: 2, r: 0},
  // --- customer order frontage (open queue corridor) with one self-order kiosk at the corner ---
  {type: 'smartOrder', x: 1, y: 3, r: 0},
  // --- SoftCute island (x1-2); x3 stays a walkable corridor ---
  {type: 'pinkTableLong', x: 1, y: 4, r: 0},
  {type: 'chair', x: 1, y: 5, r: 0},
  {type: 'chair', x: 2, y: 5, r: 2},
  // --- HardCafe island (x4-5); x6 stays a walkable corridor ---
  {type: 'pinkTableLongHardCafe', x: 4, y: 4, r: 0},
  {type: 'chair', x: 4, y: 5, r: 1},
  {type: 'chair', x: 5, y: 5, r: 3},
  {type: 'monsterPlant', x: 6, y: 4, r: 0},   // greenery accent between the group and the aisle
  // --- concentrated cat corner (x1-4) + a lounge bench filling the bottom-right ---
  {type: 'doubleCatTree', x: 1, y: 6, r: 0},  // 1x2 -> (1,6),(1,7)
  {type: 'catCastle', x: 2, y: 6, r: 0},      // 2x2 -> (2-3,6-7)
  {type: 'scratchPost', x: 4, y: 7, r: 0},
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
