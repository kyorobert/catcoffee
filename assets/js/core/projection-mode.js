// Pure projection-mode resolver. No engine, DOM node, storage or save-layer
// access belongs here. The scene/assembly layer reads the URL and passes the
// raw value (or the whole search string) in; this module only normalises it.
export const PROJECTION_MODE = Object.freeze({
  ISO: 'iso',
  FLAT: 'flat'
});

export const PROJECTION_QUERY_KEY = 'projection';

// Any value that is not exactly `flat` (after trim + lowercase) resolves to iso,
// so empty, missing, mixed-case, padded and unknown values all fall back safely.
export function resolveProjectionMode(rawValue) {
  const normalized = typeof rawValue === 'string' ? rawValue.trim().toLowerCase() : '';
  if (normalized === PROJECTION_MODE.FLAT) return PROJECTION_MODE.FLAT;
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
