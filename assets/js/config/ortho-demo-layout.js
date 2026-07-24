// Pure-data DEMO composition for the orthogonal room prototype (ARCH-0570). It only
// illustrates the intended service / seating / cat zoning so the product owner can
// judge the room WITHOUT the existing saved layout getting in the way. It is NEVER
// written to the save, never spends coins and never touches inventory — the scene
// builds display-only entities from it and restores the real save when demoLayout is
// off. Every entry uses an existing furniture id at a valid, non-overlapping cell;
// the entrance cells (8,7)/(9,7) stay clear and the aisles stay walkable.
//
// Zones (portrait top -> bottom):
//   y0            service: coffee machine, oven, counter, order, dessert, wash
//   y2-y5         seating: table+chair clusters, a shared long table, sofas, bench
//   y6-y7         cats: tent, cat bed, cat tree, scratch post
//   rugs (floorDecoration) sit UNDER the seating clusters; plants trim the sides.
export const ORTHO_DEMO_LAYOUT = Object.freeze([
  // --- service band (back / top) ---
  {type: 'coffeeMachine', x: 1, y: 0, r: 0},
  {type: 'oven', x: 2, y: 0, r: 0},
  {type: 'counter', x: 3, y: 0, r: 0},        // 2x1 -> (3,0),(4,0)
  {type: 'smartOrder', x: 5, y: 0, r: 0},
  {type: 'dessert', x: 6, y: 0, r: 0},
  {type: 'washStation', x: 7, y: 0, r: 0},    // 2x1 -> (7,0),(8,0)
  // --- seating (centre) ---
  {type: 'creamPlaidRug', x: 1, y: 2, r: 0},  // floorDecoration 3x2 under the left cluster
  {type: 'rugPink', x: 5, y: 2, r: 0},        // floorDecoration 2x2 under the right cluster
  {type: 'chair', x: 1, y: 2, r: 0},
  {type: 'pinkTableLong', x: 3, y: 2, r: 0},  // 2x1 shared long table -> (3,2),(4,2)
  {type: 'chair', x: 6, y: 2, r: 0},
  {type: 'vasePlant', x: 0, y: 3, r: 0},
  {type: 'roundTable', x: 2, y: 3, r: 0},
  {type: 'pinkTable', x: 6, y: 3, r: 0},
  {type: 'plant', x: 9, y: 3, r: 0},
  {type: 'redChair', x: 1, y: 4, r: 0},
  {type: 'cushionChair', x: 6, y: 4, r: 0},
  {type: 'sofa', x: 1, y: 5, r: 0},           // 2x1 -> (1,5),(2,5)
  {type: 'wallBench', x: 5, y: 5, r: 0},      // 2x1 -> (5,5),(6,5)
  // --- cat zone (front / bottom) ---
  {type: 'catTent', x: 0, y: 6, r: 0},
  {type: 'catBed', x: 1, y: 6, r: 0},         // 2x1 -> (1,6),(2,6)
  {type: 'doubleCatTree', x: 4, y: 6, r: 0},  // 1x2 -> (4,6),(4,7)
  {type: 'scratchPost', x: 6, y: 6, r: 0}
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
