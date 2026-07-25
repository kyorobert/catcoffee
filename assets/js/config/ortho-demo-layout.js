// Pure-data DEMO composition for the orthogonal room prototype (ARCH-0570). It only
// illustrates the intended service / seating / cat zoning so the product owner can
// judge the room WITHOUT the existing saved layout getting in the way. It is NEVER
// written to the save, never spends coins and never touches inventory — the scene
// builds display-only entities from it and restores the real save when demoLayout is
// off. Every entry uses an existing furniture id at a valid, non-overlapping cell;
// the entrance cells (8,7)/(9,7) stay clear and the aisles stay walkable.
//
// Customer entrance door corner for the Orthogonal prototype (top-right). Matches
// ORTHOGONAL_ROOM_RENDER.entrance.cell; this is a Demo/prototype visual + route only and
// does NOT change the logical save entrance (room-config keeps (8,7)/(9,7) reserved).
export const ORTHO_DEMO_ENTRANCE = Object.freeze({x: 9, y: 0});

// A small running-cafe space (not a furniture showcase), zoned for the portrait screen
// (ARCH-0572). Flow reads: enter top-right door -> order at the top counter -> seat in the
// centre -> cats in the front-left corner.
//   y0            service/counter band along the back wall (work side behind, y1 is the
//                 order/queue aisle in front); the top-right column stays clear for the door
//   y3-y5         two clear table+chair groups on rugs, with open central/side aisles
//   y6-y7         a single cat corner (front-left), clear of the door and main aisles
export const ORTHO_DEMO_LAYOUT = Object.freeze([
  // --- service / counter band (back, top): a continuous run near the top-right door ---
  {type: 'coffeeMachine', x: 1, y: 0, r: 0},
  {type: 'oven', x: 2, y: 0, r: 0},
  {type: 'counter', x: 3, y: 0, r: 0},        // 2x1 -> (3,0),(4,0) — customer side faces y1
  {type: 'dessert', x: 5, y: 0, r: 0},
  {type: 'smartOrder', x: 6, y: 0, r: 0},
  // --- left dining group: table + two seats on a rug ---
  {type: 'creamPlaidRug', x: 1, y: 3, r: 0},  // floorDecoration 3x2 under the left group
  {type: 'woodTable', x: 1, y: 3, r: 0},      // 2x1 -> (1,3),(2,3)
  {type: 'chair', x: 1, y: 4, r: 0},
  {type: 'cushionChair', x: 2, y: 4, r: 0},
  // --- right dining group: round table with a seat above and below on a rug ---
  {type: 'rugPink', x: 5, y: 4, r: 0},        // floorDecoration 2x2 -> (5,4),(6,4),(5,5),(6,5)
  {type: 'roundTable', x: 6, y: 4, r: 0},
  {type: 'chair', x: 6, y: 3, r: 0},
  {type: 'redChair', x: 6, y: 5, r: 0},
  // --- right-side greenery accent ---
  {type: 'monsterPlant', x: 8, y: 4, r: 0},
  // --- cat corner (front-left), clear of the door and main aisles ---
  {type: 'doubleCatTree', x: 0, y: 6, r: 0},  // 1x2 -> (0,6),(0,7)
  {type: 'catBed', x: 1, y: 6, r: 0},         // 2x1 -> (1,6),(2,6)
  {type: 'scratchPost', x: 3, y: 6, r: 0}
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
