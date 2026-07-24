// Pure projection-mode resolver. No engine, DOM node, storage or save-layer
// access belongs here. The scene/assembly layer reads the URL and passes the
// raw value (or the whole search string) in; this module only normalises it.
export const PROJECTION_MODE = Object.freeze({
  ISO: 'iso',
  FLAT: 'flat',
  ORTHO: 'ortho'
});

export const PROJECTION_QUERY_KEY = 'projection';

// Default is iso. `flat` opts into the (rejected, regression-only) shallow-oblique
// Flat; `ortho` and its alias `orthogonal` opt into the axis-aligned Orthogonal
// prototype. Any other value (empty, missing, mixed-case, padded, unknown) falls back
// safely to iso.
export function resolveProjectionMode(rawValue) {
  const normalized = typeof rawValue === 'string' ? rawValue.trim().toLowerCase() : '';
  if (normalized === PROJECTION_MODE.FLAT) return PROJECTION_MODE.FLAT;
  if (normalized === PROJECTION_MODE.ORTHO || normalized === 'orthogonal') return PROJECTION_MODE.ORTHO;
  if (normalized === PROJECTION_MODE.ISO) return PROJECTION_MODE.ISO;
  return PROJECTION_MODE.ISO;
}

// Isolated URL parsing kept pure (string in → mode out) so it is Node-testable.
export function projectionModeFromSearch(search) {
  let raw = null;
  try {
    raw = new URLSearchParams(typeof search === 'string' ? search : '').get(PROJECTION_QUERY_KEY);
  } catch {
    raw = null;
  }
  return resolveProjectionMode(raw);
}
