// Pure-data DEMO composition for the orthogonal room prototype (ARCH-0570). It only
// illustrates the intended service / seating / cat zoning so the product owner can
// judge the room WITHOUT the existing saved layout getting in the way. It is NEVER
// written to the save, never spends coins and never touches inventory — the scene
// builds display-only entities from it and restores the real save when demoLayout is
// off. Every entry uses an existing furniture id at a valid, non-overlapping cell;
// the entrance cells (8,7)/(9,7) stay clear and the aisles stay walkable.
//
// Zones (portrait top -> bottom). Compact and grouped so the whole cafe reads at a
// glance (ARCH-0571 tightened this from a spread-out showcase to a small running cafe):
//   y0            service band: counter run + coffee/oven/order (work side behind, y1 is
//                 the queue/work aisle in front)
//   y3-y4         two clear table+chair groups on rugs, a central aisle between them
//   y6-y7         a single cat corner (front-left), away from the (8,7)/(9,7) entrance
//   the central columns and rows y1/y5 stay open as the main walkways.
export const ORTHO_DEMO_LAYOUT = Object.freeze([
  // --- service band (back / top): a continuous counter run ---
  {type: 'counter', x: 2, y: 0, r: 0},        // 2x1 -> (2,0),(3,0) — customer side faces y1
  {type: 'coffeeMachine', x: 4, y: 0, r: 0},
  {type: 'oven', x: 5, y: 0, r: 0},
  {type: 'smartOrder', x: 6, y: 0, r: 0},
  // --- left dining group: table + two seats on a rug ---
  {type: 'creamPlaidRug', x: 1, y: 3, r: 0},  // floorDecoration 3x2 under the left group
  {type: 'woodTable', x: 1, y: 3, r: 0},      // 2x1 -> (1,3),(2,3)
  {type: 'chair', x: 1, y: 4, r: 0},
  {type: 'cushionChair', x: 2, y: 4, r: 0},
  // --- right dining group: round table with a seat above and below on a rug ---
  {type: 'rugPink', x: 5, y: 3, r: 0},        // floorDecoration 2x2 under the right group
  {type: 'roundTable', x: 5, y: 3, r: 0},
  {type: 'chair', x: 5, y: 2, r: 0},
  {type: 'redChair', x: 5, y: 4, r: 0},
  // --- right-side greenery accent ---
  {type: 'monsterPlant', x: 8, y: 2, r: 0},
  // --- cat corner (front-left), clear of the entrance and main aisles ---
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
