// ARCH-0577M1: central Furniture Composition metadata (pure data).
//
// A compositionProfile describes how a furniture MAY visually connect to a
// logically-adjacent, direction-compatible neighbour. It NEVER affects logical
// footprint, x/y/r, Occupancy, Placement or Save. Furniture without a profile
// safely produces no composition adjustment. Furniture IDs live ONLY here, never
// inside the resolver, Scene, Entity or DragController.
//
// contactInsets are per texture-direction, in world pixels, measured from the
// logical cell bounding box to the furniture's visible (alpha) edge on each side
// (ARCH-0577L0 runtime measurements). They let the pure resolver compute the true
// visual gap between two neighbours without scanning pixels at runtime.

export const COMPOSITION_ROLE = Object.freeze({
  TABLE: 'table',
  SEAT: 'seat',
  SERVICE: 'service',
  DISPLAY: 'display',
  NONE: 'none'
});

// A seat pulls toward the table it faces; a later service unit pulls toward the
// previous unit in the approved band. These are the mover roles.
const SEAT_SOCKET = Object.freeze({
  allowedRoles: ['table'],
  targetGap: 4,
  maxOverlap: 6
});

// chair: 1x1, visible ~70x111 in an 88x120 cell (ARCH-0577L0). Symmetric insets.
const CHAIR_INSET = Object.freeze({left: 9, right: 9, top: 9, bottom: 0});

// Long tables (2x1 axis2). Horizontal = down-right, vertical = down-left.
// ART-0577M2 reauthors the two approved vertical tables to a grounded 84x224
// alpha silhouette inside the 88x240 logical footprint.  The directional
// contact insets below are measured from that formal output; they let all four
// adjacent seats stay below the 40px safety cap without moving logical cells.
const SOFTCUTE_INSETS = Object.freeze({
  'down-right': {left: 3, right: 3, top: 32, bottom: 0},   // horizontal 170x88 / 176x120
  'up-left': {left: 3, right: 3, top: 32, bottom: 0},
  'down-left': {left: 2, right: 3, top: 10, bottom: 7},    // vertical 84x224 / 88x240
  'up-right': {left: 2, right: 3, top: 10, bottom: 7}
});
const HARDCAFE_INSETS = Object.freeze({
  'down-right': {left: 3, right: 3, top: 33, bottom: 0},
  'up-left': {left: 3, right: 3, top: 33, bottom: 0},
  'down-left': {left: 2, right: 3, top: 10, bottom: 7},
  'up-right': {left: 2, right: 3, top: 10, bottom: 7}
});

// Service band (all r0 / down-right in Option C). Insets from ARCH-0577L0.
const SERVICE_SOCKET = Object.freeze({
  allowedRoles: ['service'],
  targetGap: 4,
  maxOverlap: 4
});

function tableProfile(insets) {
  return Object.freeze({
    role: COMPOSITION_ROLE.TABLE,
    compatibleRoles: ['seat'],
    contactInsets: insets,
    // Tables are anchors: seats move to them. A table declares seat sockets on all
    // four sides but is itself never the mover.
    sockets: Object.freeze({
      north: {allowedRoles: ['seat']}, south: {allowedRoles: ['seat']},
      west: {allowedRoles: ['seat']}, east: {allowedRoles: ['seat']}
    }),
    visualPull: {min: 0, preferred: 0, max: 0},
    overlap: {min: 0, preferred: 0, max: 0},
    // A north seat sits behind the table; a south seat in front. depthBias is added
    // to the seat, resolved by the seat's connection side (see resolver).
    depthBiasBySide: {north: -30, south: 30, west: 6, east: 6}
  });
}

export const FURNITURE_COMPOSITION_PROFILES = Object.freeze({
  chair: Object.freeze({
    role: COMPOSITION_ROLE.SEAT,
    compatibleRoles: ['table'],
    contactInsets: Object.freeze({
      'down-right': CHAIR_INSET, 'down-left': CHAIR_INSET,
      'up-left': CHAIR_INSET, 'up-right': CHAIR_INSET
    }),
    // A seat connects on the side it faces (its cardinal direction). One socket per
    // side; each side may bind at most one table.
    sockets: Object.freeze({
      north: SEAT_SOCKET, south: SEAT_SOCKET, west: SEAT_SOCKET, east: SEAT_SOCKET
    }),
    // ARCH-0577M1 §7: production pull cap. A seat may pull at most 40px toward a
    // table. A larger requested pull (e.g. the ~117px an under-drawn vertical table
    // would need) is capped and flagged requiresAssetReauthoring for ART-0577M2 —
    // it is NEVER silently applied as a near-full-cell displacement.
    visualPull: {min: 0, preferred: 4, max: 40},
    overlap: {min: 0, preferred: 0, max: 6},
    depthBiasBySide: {north: 0, south: 0, west: 0, east: 0}
  }),
  pinkTableLong: tableProfile(SOFTCUTE_INSETS),
  pinkTableLongHardCafe: tableProfile(HARDCAFE_INSETS),
  counter: Object.freeze({
    role: COMPOSITION_ROLE.SERVICE,
    compatibleRoles: ['service'],
    contactInsets: Object.freeze({'down-right': {left: 5, right: 5, top: 38, bottom: 0}}),
    sockets: Object.freeze({east: SERVICE_SOCKET, west: SERVICE_SOCKET}),
    // counter is the band anchor: it never moves (pull 0), neighbours move to it.
    visualPull: {min: 0, preferred: 0, max: 0},
    overlap: {min: 0, preferred: 0, max: 0},
    depthBiasBySide: {north: 0, south: 0, west: 0, east: 0},
    bandAnchor: true,
    bandPredecessor: null
  }),
  coffeeMachine: Object.freeze({
    role: COMPOSITION_ROLE.SERVICE,
    compatibleRoles: ['service'],
    contactInsets: Object.freeze({'down-right': {left: -1, right: -2, top: 33, bottom: 0}}),
    sockets: Object.freeze({east: SERVICE_SOCKET, west: SERVICE_SOCKET}),
    visualPull: {min: 0, preferred: 4, max: 24},
    overlap: {min: 0, preferred: 0, max: 4},
    depthBiasBySide: {north: 0, south: 0, west: 0, east: 0},
    bandPredecessor: 'counter'
  }),
  washStation: Object.freeze({
    role: COMPOSITION_ROLE.SERVICE,
    compatibleRoles: ['service'],
    contactInsets: Object.freeze({'down-right': {left: 15, right: 15, top: -7, bottom: 0}}),
    sockets: Object.freeze({east: SERVICE_SOCKET, west: SERVICE_SOCKET}),
    visualPull: {min: 0, preferred: 4, max: 24},
    overlap: {min: 0, preferred: 0, max: 4},
    depthBiasBySide: {north: 0, south: 0, west: 0, east: 0},
    bandPredecessor: 'coffeeMachine'
  }),
  dessert: Object.freeze({
    role: COMPOSITION_ROLE.SERVICE,
    compatibleRoles: ['service'],
    contactInsets: Object.freeze({'down-right': {left: -3, right: -4, top: -25, bottom: 0}}),
    sockets: Object.freeze({east: SERVICE_SOCKET, west: SERVICE_SOCKET}),
    visualPull: {min: 0, preferred: 4, max: 24},
    overlap: {min: 0, preferred: 0, max: 4},
    depthBiasBySide: {north: 0, south: 0, west: 0, east: 0},
    bandPredecessor: 'washStation'
  })
});

export function getFurnitureCompositionProfile(type) {
  return FURNITURE_COMPOSITION_PROFILES[type] || null;
}

// ARCH-0577M1 §10: pure validator. Rejects malformed metadata without activating
// any behaviour. No engine, DOM, browser-global or storage access. A furniture with
// no profile is valid (it safely falls back to native, no composition).
const VALID_ROLES = new Set(Object.values(COMPOSITION_ROLE));
const CARDINAL = ['north', 'east', 'south', 'west'];
const INSET_KEYS = ['left', 'right', 'top', 'bottom'];
const fin = v => Number.isFinite(Number(v));

export function validateFurnitureCompositionProfile(profile, {type = ''} = {}) {
  const errors = [];
  if (profile == null) return {valid: true, errors};
  if (typeof profile !== 'object' || Array.isArray(profile)) {
    return {valid: false, errors: [`${type}: profile must be an object`]};
  }
  if (!VALID_ROLES.has(profile.role)) errors.push(`${type}: invalid role ${String(profile.role)}`);
  if (profile.compatibleRoles != null && !Array.isArray(profile.compatibleRoles)) {
    errors.push(`${type}: compatibleRoles must be an array`);
  }
  if (profile.sockets != null) {
    if (typeof profile.sockets !== 'object') errors.push(`${type}: sockets must be an object`);
    else for (const side of Object.keys(profile.sockets)) {
      if (!CARDINAL.includes(side)) errors.push(`${type}: socket side ${side} is not cardinal`);
      const allowed = profile.sockets[side]?.allowedRoles;
      if (allowed != null && !Array.isArray(allowed)) errors.push(`${type}: sockets.${side}.allowedRoles must be an array`);
      const tg = profile.sockets[side]?.targetGap;
      if (tg != null && !fin(tg)) errors.push(`${type}: sockets.${side}.targetGap must be finite`);
    }
  }
  for (const key of ['visualPull', 'overlap']) {
    const range = profile[key];
    if (range == null) continue;
    for (const f of ['min', 'preferred', 'max']) {
      if (range[f] != null && !fin(range[f])) errors.push(`${type}: ${key}.${f} must be finite`);
    }
    if (fin(range.max) && Number(range.max) < 0) errors.push(`${type}: ${key}.max must be >= 0`);
    if (fin(range.min) && fin(range.max) && Number(range.min) > Number(range.max)) {
      errors.push(`${type}: ${key}.min must be <= max`);
    }
  }
  if (profile.contactInsets != null) {
    if (typeof profile.contactInsets !== 'object') errors.push(`${type}: contactInsets must be an object`);
    else for (const [dir, inset] of Object.entries(profile.contactInsets)) {
      for (const k of INSET_KEYS) {
        if (inset?.[k] != null && !fin(inset[k])) errors.push(`${type}: contactInsets.${dir}.${k} must be finite`);
      }
    }
  }
  if (profile.depthBiasBySide != null) {
    for (const side of CARDINAL) {
      const v = profile.depthBiasBySide[side];
      if (v != null && !fin(v)) errors.push(`${type}: depthBiasBySide.${side} must be finite`);
    }
  }
  return {valid: errors.length === 0, errors};
}

// Validate the whole approved service chain: no duplicate roles in the ordered
// band, and every declared predecessor exists and precedes the unit.
export function validateServiceBand() {
  const errors = [];
  const seen = new Set();
  SERVICE_BAND_ORDER.forEach((type, index) => {
    if (seen.has(type)) errors.push(`service band has duplicate ${type}`);
    seen.add(type);
    const pred = FURNITURE_COMPOSITION_PROFILES[type]?.bandPredecessor;
    if (index === 0) {
      if (pred != null) errors.push(`band anchor ${type} must have null predecessor`);
    } else {
      if (pred !== SERVICE_BAND_ORDER[index - 1]) {
        errors.push(`${type} predecessor must be ${SERVICE_BAND_ORDER[index - 1]}, got ${pred}`);
      }
    }
  });
  return {valid: errors.length === 0, errors};
}

// The approved service band order; a service unit pulls toward the unit before it.
export const SERVICE_BAND_ORDER = Object.freeze([
  'counter', 'coffeeMachine', 'washStation', 'dessert'
]);
