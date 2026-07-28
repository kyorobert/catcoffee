// FIX-0577D: single pure resolver for orthogonal furniture rotation.
//
// Stored furniture x/y remains the top-left logical footprint cell. A non-square
// footprint cannot keep an exact geometric centre while staying on integer cells,
// so an edit session owns a temporary square rotation envelope. Every turn picks
// the nearest integer candidate to that fixed envelope centre. Equal-distance
// candidates use the same clockwise tie-break at every room position. This makes
// 2-step axis and 4-step cardinal cycles reversible without cumulative drift.
//
// This module is intentionally engine-agnostic: no engine APIs, DOM, browser globals,
// storage, occupancy mutation or save mutation.

export const ROTATION_POLICY = Object.freeze({
  FIXED: 'fixed',
  AXIS2: 'axis2',
  CARDINAL4: 'cardinal4'
});

// Explicit product decisions. These are not inferred from footprint dimensions.
// Unlisted legacy furniture retains its existing quarter-turn capability through
// the CARDINAL4 fallback, while known symmetric / axis-only pieces are declared.
export const ORTHOGONAL_ROTATION_POLICY_BY_TYPE = Object.freeze({
  // ART-0577 first batch (all twelve are explicit).
  counter: ROTATION_POLICY.CARDINAL4,
  coffeeMachine: ROTATION_POLICY.CARDINAL4,
  oven: ROTATION_POLICY.CARDINAL4,
  washStation: ROTATION_POLICY.CARDINAL4,
  dessert: ROTATION_POLICY.CARDINAL4,
  smartOrder: ROTATION_POLICY.CARDINAL4,
  pinkTableLong: ROTATION_POLICY.AXIS2,
  roundTable: ROTATION_POLICY.FIXED,
  chair: ROTATION_POLICY.CARDINAL4,
  creamSofa: ROTATION_POLICY.CARDINAL4,
  doubleCatTree: ROTATION_POLICY.CARDINAL4,
  scratchPost: ROTATION_POLICY.FIXED,

  // Existing non-square catalog pieces with only two meaningful axes.
  woodTable: ROTATION_POLICY.AXIS2,
  catBed: ROTATION_POLICY.AXIS2,
  creamPlaidRug: ROTATION_POLICY.AXIS2,
  starNightRug: ROTATION_POLICY.AXIS2,
  childrenPlayArea: ROTATION_POLICY.AXIS2
});

// Cardinal semantics are orthogonal-only and MUST NOT touch iso/flat mapping.
// r0 = South, r1 = West, r2 = North, r3 = East; r+1 is clockwise.
export const ORTHOGONAL_CARDINAL_DIRECTION_MAP = Object.freeze({
  0: 'south',
  1: 'west',
  2: 'north',
  3: 'east'
});

// The first art pass still reuses the existing four authored texture directions.
export const CARDINAL_TO_TEXTURE_DIRECTION = Object.freeze({
  south: 'down-right',
  west: 'down-left',
  north: 'up-left',
  east: 'up-right'
});

export const ROTATION_TIE_BREAK =
  'clockwise-envelope-edge-order';

export function normalizeRotation(rotation = 0) {
  const number = Number(rotation);
  return Number.isFinite(number) ? ((Math.trunc(number) % 4) + 4) % 4 : 0;
}

export function getOrthogonalRotationPolicy(type, definition = null) {
  if (ORTHOGONAL_ROTATION_POLICY_BY_TYPE[type]) {
    return ORTHOGONAL_ROTATION_POLICY_BY_TYPE[type];
  }
  return definition?.rotation === 'none'
    ? ROTATION_POLICY.FIXED
    : ROTATION_POLICY.CARDINAL4;
}

// axis2 legacy r2/r3 are visually equivalent to r0/r1. This conversion is used
// for display and candidate math only; loading an old save never rewrites r.
export function effectiveRotationForPolicy(rotation, policy) {
  const normalized = normalizeRotation(rotation);
  if (policy === ROTATION_POLICY.FIXED) return 0;
  if (policy === ROTATION_POLICY.AXIS2) return normalized % 2;
  return normalized;
}

export function nextRotationForPolicy(rotation, policy) {
  const effective = effectiveRotationForPolicy(rotation, policy);
  if (policy === ROTATION_POLICY.FIXED) return normalizeRotation(rotation);
  if (policy === ROTATION_POLICY.AXIS2) return effective === 0 ? 1 : 0;
  return normalizeRotation(effective + 1);
}

export function rotationSequenceForPolicy(policy) {
  if (policy === ROTATION_POLICY.FIXED) return Object.freeze([0]);
  if (policy === ROTATION_POLICY.AXIS2) return Object.freeze([0, 1]);
  return Object.freeze([0, 1, 2, 3]);
}

export function orthogonalRotationToCardinal(rotation = 0) {
  return ORTHOGONAL_CARDINAL_DIRECTION_MAP[normalizeRotation(rotation)];
}

export function cardinalToTextureDirection(cardinal) {
  return CARDINAL_TO_TEXTURE_DIRECTION[cardinal]
    || CARDINAL_TO_TEXTURE_DIRECTION.south;
}

export function orthogonalRotationToTextureDirection(rotation = 0) {
  return cardinalToTextureDirection(orthogonalRotationToCardinal(rotation));
}

function baseFootprint(definition) {
  const foot = Array.isArray(definition?.foot) ? definition.foot : [1, 1];
  return {
    width: Math.max(1, Math.trunc(Number(foot[0]) || 1)),
    height: Math.max(1, Math.trunc(Number(foot[1]) || 1))
  };
}

export function footprintSizeForRotation(definition, rotation = 0) {
  const base = baseFootprint(definition);
  return normalizeRotation(rotation) % 2
    ? {width: base.height, height: base.width}
    : base;
}

// The preferred offset is the bounding box produced by rotating the original
// footprint clockwise inside a fixed max(width,height) square envelope.
export function clockwiseEnvelopeOffset(definition, rotation = 0) {
  const {width, height} = baseFootprint(definition);
  const size = Math.max(width, height);
  switch (normalizeRotation(rotation)) {
    case 1: return {x: size - height, y: 0};
    case 2: return {x: size - width, y: size - height};
    case 3: return {x: 0, y: size - width};
    default: return {x: 0, y: 0};
  }
}

function uniqueNumbers(values) {
  return [...new Set(values.filter(Number.isFinite))];
}

// Enumerate only the integer positions nearest to the fixed envelope centre.
// Legality is deliberately NOT considered here: the resolver never searches a
// farther empty cell to force a rotation to succeed.
export function minimumDisplacementCandidates({
  envelope,
  definition,
  rotation
}) {
  const effectiveRotation = normalizeRotation(rotation);
  const footprint = footprintSizeForRotation(definition, effectiveRotation);
  const centerX = envelope.originX + envelope.width / 2;
  const centerY = envelope.originY + envelope.height / 2;
  const idealX = centerX - footprint.width / 2;
  const idealY = centerY - footprint.height / 2;
  const xs = uniqueNumbers([Math.floor(idealX), Math.ceil(idealX)]);
  const ys = uniqueNumbers([Math.floor(idealY), Math.ceil(idealY)]);
  const preferredOffset = clockwiseEnvelopeOffset(definition, effectiveRotation);
  const preferred = {
    x: envelope.originX + preferredOffset.x,
    y: envelope.originY + preferredOffset.y
  };
  return xs.flatMap(x => ys.map(y => {
    const candidateCenterX = x + footprint.width / 2;
    const candidateCenterY = y + footprint.height / 2;
    const dx = candidateCenterX - centerX;
    const dy = candidateCenterY - centerY;
    return {
      x,
      y,
      distanceSquared: dx * dx + dy * dy,
      tieBreakRank: x === preferred.x && y === preferred.y ? 0 : 1,
      preferred: x === preferred.x && y === preferred.y
    };
  })).sort((a, b) =>
    a.distanceSquared - b.distanceSquared
    || a.tieBreakRank - b.tieBreakRank
    || a.y - b.y
    || a.x - b.x
  );
}

export function createRotationEditSession({
  type,
  definition,
  x,
  y,
  rotation = 0,
  policy = getOrthogonalRotationPolicy(type, definition),
  original = null
}) {
  const effectiveRotation = effectiveRotationForPolicy(rotation, policy);
  const {width, height} = baseFootprint(definition);
  const envelopeSize = Math.max(width, height);
  const offset = clockwiseEnvelopeOffset(definition, effectiveRotation);
  const originalState = original
    ? {x: original.x, y: original.y, r: normalizeRotation(original.r)}
    : {x, y, r: normalizeRotation(rotation)};
  return {
    type,
    policy,
    original: originalState,
    current: {x, y, r: normalizeRotation(rotation)},
    envelope: {
      originX: x - offset.x,
      originY: y - offset.y,
      width: envelopeSize,
      height: envelopeSize
    },
    currentFootprintOffset: offset,
    rotationSequence: [...rotationSequenceForPolicy(policy)],
    tieBreak: ROTATION_TIE_BREAK
  };
}

export function rebaseRotationEditSession(session, {
  definition,
  x,
  y,
  rotation
}) {
  return createRotationEditSession({
    type: session.type,
    definition,
    x,
    y,
    rotation,
    policy: session.policy,
    original: session.original
  });
}

export function advanceRotationEditSession(session, resolved) {
  return {
    ...session,
    current: {
      x: resolved.resolvedX,
      y: resolved.resolvedY,
      r: resolved.resolvedRotation
    },
    currentFootprintOffset: {...resolved.footprintOffset}
  };
}

// Pure resolver. With no editSession it describes the supplied formal state.
// With an editSession it resolves the requested direction inside that session's
// fixed envelope and returns the one candidate all consumers must use.
export function resolveOrthogonalRotationPlacement({
  grid,
  type,
  definition = grid?.furniture?.[type] || null,
  x,
  y,
  rotation = 0,
  policy = getOrthogonalRotationPolicy(type, definition),
  editSession = null
}) {
  const requestedRotation = normalizeRotation(rotation);
  const effectiveRotation =
    effectiveRotationForPolicy(requestedRotation, policy);
  let resolvedX = x;
  let resolvedY = y;
  let chosen = null;

  if (editSession) {
    chosen = minimumDisplacementCandidates({
      envelope: editSession.envelope,
      definition,
      rotation: effectiveRotation
    })[0];
    resolvedX = chosen.x;
    resolvedY = chosen.y;
  }

  const footprint = footprintSizeForRotation(definition, effectiveRotation);
  const footprintCells =
    grid.getFootprintCells(type, resolvedX, resolvedY, effectiveRotation);
  const footprintPolygon =
    grid.getFootprintPolygon(type, resolvedX, resolvedY, effectiveRotation);
  const visualPosition =
    grid.getAnchor(type, resolvedX, resolvedY, effectiveRotation);
  const cardinalDirection =
    orthogonalRotationToCardinal(effectiveRotation);
  const textureDirection =
    cardinalToTextureDirection(cardinalDirection);
  const current = editSession?.current || {x, y, r: requestedRotation};
  const footprintOffset = editSession
    ? {
        x: resolvedX - editSession.envelope.originX,
        y: resolvedY - editSession.envelope.originY
      }
    : {x: 0, y: 0};
  const movementDelta = {
    x: resolvedX - current.x,
    y: resolvedY - current.y
  };
  const logicalPivot = {
    x: resolvedX + (footprint.width - 1) / 2,
    y: resolvedY + (footprint.height - 1) / 2
  };

  return {
    resolvedX,
    resolvedY,
    resolvedRotation: policy === ROTATION_POLICY.FIXED
      ? normalizeRotation(current.r)
      : requestedRotation,
    effectiveRotation,
    rotationPolicy: policy,
    footprint,
    footprintOffset,
    footprintCells,
    footprintPolygon,
    logicalOrigin: {x: resolvedX, y: resolvedY},
    logicalPivot,
    visualPosition: {x: visualPosition.x, y: visualPosition.y},
    visualPivot: {x: visualPosition.x, y: visualPosition.y},
    cardinalDirection,
    textureDirection,
    movementDelta,
    minimumDistanceSquared: chosen?.distanceSquared || 0,
    tieBreak: editSession?.tieBreak || ROTATION_TIE_BREAK,
    envelopeContext: editSession
      ? {
          originX: editSession.envelope.originX,
          originY: editSession.envelope.originY,
          width: editSession.envelope.width,
          height: editSession.envelope.height,
          original: {...editSession.original},
          current: {...editSession.current},
          sequence: [...editSession.rotationSequence],
          tieBreak: editSession.tieBreak
        }
      : null,
    signature:
      `${type}:${resolvedX}:${resolvedY}:${requestedRotation}:${policy}`,
    validityInput: {
      type,
      x: resolvedX,
      y: resolvedY,
      rotation: effectiveRotation
    },
    safelyRepresentable: Number.isInteger(resolvedX)
      && Number.isInteger(resolvedY)
  };
}

export function resolveNextOrthogonalRotation({
  grid,
  type,
  definition = grid?.furniture?.[type] || null,
  x,
  y,
  rotation = 0,
  policy = getOrthogonalRotationPolicy(type, definition),
  editSession
}) {
  const targetRotation = nextRotationForPolicy(rotation, policy);
  return resolveOrthogonalRotationPlacement({
    grid,
    type,
    definition,
    x,
    y,
    rotation: targetRotation,
    policy,
    editSession
  });
}
