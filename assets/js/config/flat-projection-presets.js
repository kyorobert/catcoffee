// Central configuration for the three Flat (淺俯視) composition presets compared in
// ARCH-0563. All three share ONE FlatProjection implementation; only these frozen
// parameter blocks change. Nothing here reads the engine, DOM, storage or the save
// layer, and no preset encodes any actor identity — it is pure data plus a pure
// resolver so it can be unit tested in Node.
//
// Each preset carries:
//   - projection: the invertible 2D basis passed straight to FlatProjection
//     (world = origin + gridX*axisX + gridY*axisY; origin is DERIVED by
//     FlatProjection so the logical floor centroid lands on the world centre —
//     no magic screen coordinates live here).
//   - room: render-only framing metadata consumed by CafeScene.drawRoomFlat
//     (back-wall height, optional side wall, outline widths, wall-decoration
//     placement). These change ONLY the flat background rendering; they never
//     touch cols/rows, placeableMask, entrance cells, furniture x/y/r, Occupancy
//     or Pathfinding.
//
// The bases are an interpolation between the current 2:1 iso basis and the current
// Flat basis (Preset C). `near-iso` sits close to iso (more room depth, gentler
// flattening); `balanced` sits in the middle (flatter floor, back wall still clear);
// `current` reuses the ARCH-0562 Flat values verbatim as the comparison baseline.
import {FLAT_PROJECTION_PARAMS} from '../systems/FlatProjection.js?v=0577k';

export const FLAT_PRESET_QUERY_KEY = 'flatPreset';

export const FLAT_PRESET_IDS = Object.freeze({
  NEAR_ISO: 'near-iso',
  BALANCED: 'balanced',
  CURRENT: 'current'
});

// projection=flat with no (or an unknown/empty) flatPreset keeps the ARCH-0562
// Flat Prototype, so the existing `?projection=flat` URL never changes meaning.
export const DEFAULT_FLAT_PRESET_ID = FLAT_PRESET_IDS.CURRENT;

// --- Preset A｜Near Iso: closest to iso, only slightly flatter, strongest room feel ---
const NEAR_ISO = Object.freeze({
  id: FLAT_PRESET_IDS.NEAR_ISO,
  displayName: '近等角 Near Iso',
  projection: Object.freeze({
    id: 'flat',
    displayName: '近等角 Near Iso',
    axisX: Object.freeze({x: 78, y: 22}),
    axisY: Object.freeze({x: -37, y: 48})
  }),
  room: Object.freeze({
    backWallHeight: 206,
    sideWall: true,
    backWallTopWidth: 6,
    floorOutlineWidth: 4,
    decoration: Object.freeze({heightFactor: 0.5, windowFx: 0.27, boardFx: 0.73, windowScale: 0.86, boardScale: 0.84})
  })
});

// --- Preset B｜Balanced Shallow: between iso and current Flat, flatter yet room-like ---
const BALANCED = Object.freeze({
  id: FLAT_PRESET_IDS.BALANCED,
  displayName: '折衷淺俯視 Balanced',
  projection: Object.freeze({
    id: 'flat',
    displayName: '折衷淺俯視 Balanced',
    axisX: Object.freeze({x: 93, y: 13}),
    axisY: Object.freeze({x: -10, y: 63})
  }),
  room: Object.freeze({
    backWallHeight: 190,
    sideWall: true,
    backWallTopWidth: 6,
    floorOutlineWidth: 4,
    decoration: Object.freeze({heightFactor: 0.5, windowFx: 0.27, boardFx: 0.73, windowScale: 0.84, boardScale: 0.82})
  })
});

// --- Preset C｜Current Flat: the ARCH-0562 Flat verbatim (baseline, do not retune) ---
// projection reuses FLAT_PROJECTION_PARAMS by reference, and the room metadata
// reproduces the original drawRoomFlat constants exactly, so this preset is
// byte-for-byte the ARCH-0562 Flat Prototype.
const CURRENT = Object.freeze({
  id: FLAT_PRESET_IDS.CURRENT,
  displayName: '現行 Flat Current',
  projection: FLAT_PROJECTION_PARAMS,
  room: Object.freeze({
    backWallHeight: 176,
    sideWall: false,
    backWallTopWidth: 6,
    floorOutlineWidth: 4,
    decoration: Object.freeze({heightFactor: 0.52, windowFx: 0.28, boardFx: 0.72, windowScale: 0.82, boardScale: 0.8})
  })
});

export const FLAT_PRESETS = Object.freeze({
  [FLAT_PRESET_IDS.NEAR_ISO]: NEAR_ISO,
  [FLAT_PRESET_IDS.BALANCED]: BALANCED,
  [FLAT_PRESET_IDS.CURRENT]: CURRENT
});

// Any value that is not exactly one of the known ids (after trim + lowercase)
// resolves to `current`, so empty, missing, mixed-case, padded and unknown values
// all fall back to the ARCH-0562 baseline.
export function resolveFlatPreset(rawValue) {
  const normalized = typeof rawValue === 'string' ? rawValue.trim().toLowerCase() : '';
  if (normalized === FLAT_PRESET_IDS.NEAR_ISO) return FLAT_PRESET_IDS.NEAR_ISO;
  if (normalized === FLAT_PRESET_IDS.BALANCED) return FLAT_PRESET_IDS.BALANCED;
  if (normalized === FLAT_PRESET_IDS.CURRENT) return FLAT_PRESET_IDS.CURRENT;
  return DEFAULT_FLAT_PRESET_ID;
}

// Resolve straight to the preset object (never null); used by GridSystem, which is
// handed an already-resolved id string and therefore never reads the URL itself.
export function getFlatPreset(rawValue) {
  return FLAT_PRESETS[resolveFlatPreset(rawValue)];
}

// Isolated URL parsing kept pure (string in → id out) so it is Node-testable.
export function flatPresetFromSearch(search) {
  let raw = null;
  try {
    raw = new URLSearchParams(typeof search === 'string' ? search : '').get(FLAT_PRESET_QUERY_KEY);
  } catch {
    raw = null;
  }
  return resolveFlatPreset(raw);
}
