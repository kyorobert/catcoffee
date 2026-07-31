// ARCH-0577L1: pure visual-placement contract for furniture rendering.
//
// Logical footprint remains the sole source for placement, occupancy and
// pathfinding. This module only resolves how an already-selected texture frame
// is drawn around that logical anchor. It never reads neighbours, engine state,
// browser state or save data, and it never mutates its inputs.

export const FURNITURE_VISUAL_PLACEMENT_MODE = Object.freeze({
  NATIVE: 'native',
  AUTHORED_BOUNDS: 'authored-bounds'
});

const CARDINAL_SIDES = Object.freeze(['north', 'east', 'south', 'west']);

function finite(value) {
  return Number.isFinite(Number(value));
}

function positive(value) {
  return finite(value) && Number(value) > 0;
}

function point(value, fallback = {x: 0, y: 0}) {
  return value && finite(value.x) && finite(value.y)
    ? {x: Number(value.x), y: Number(value.y)}
    : {...fallback};
}

function rect(value) {
  if (!value || !finite(value.x) || !finite(value.y)
    || !positive(value.width) || !positive(value.height)) return null;
  return {
    x: Number(value.x),
    y: Number(value.y),
    width: Number(value.width),
    height: Number(value.height)
  };
}

function frameSize(textureFrame) {
  return {
    width: positive(textureFrame?.width) ? Number(textureFrame.width) : 0,
    height: positive(textureFrame?.height) ? Number(textureFrame.height) : 0
  };
}

function directionalDefinition(visualPlacement, direction) {
  if (!visualPlacement || typeof visualPlacement !== 'object') return null;
  const {
    byDirection: _ignored,
    directions: _legacyIgnored,
    ...shared
  } = visualPlacement;
  const directional = visualPlacement.byDirection?.[direction]
    || visualPlacement.directions?.[direction]
    || null;
  return directional && typeof directional === 'object'
    ? {...shared, ...directional}
    : shared;
}

function validatePointField(errors, value, path) {
  if (value == null) return;
  if (!finite(value.x) || !finite(value.y)) {
    errors.push(`${path} must contain finite x/y`);
  }
}

function validateRectField(errors, value, path) {
  if (value == null) return;
  if (!rect(value)) errors.push(`${path} must contain finite x/y and positive width/height`);
}

function validateConnectionSockets(errors, sockets) {
  if (sockets == null) return;
  if (typeof sockets !== 'object' || Array.isArray(sockets)) {
    errors.push('connectionSockets must be an object');
    return;
  }
  for (const side of Object.keys(sockets)) {
    if (!CARDINAL_SIDES.includes(side)) {
      errors.push(`connectionSockets.${side} is not a cardinal side`);
      continue;
    }
    const values = Array.isArray(sockets[side]) ? sockets[side] : [sockets[side]];
    for (const [index, socket] of values.entries()) {
      validatePointField(
        errors,
        socket,
        `connectionSockets.${side}${values.length > 1 ? `[${index}]` : ''}`
      );
    }
  }
}

// Validator is exported so config/build tooling can reject malformed metadata
// without activating any connection behaviour.
export function validateFurnitureVisualPlacementDefinition(
  visualPlacement,
  {direction = null} = {}
) {
  if (visualPlacement == null) return {valid: true, errors: []};
  if (typeof visualPlacement !== 'object' || Array.isArray(visualPlacement)) {
    return {valid: false, errors: ['visualPlacement must be an object']};
  }
  const selected = directionalDefinition(visualPlacement, direction);
  const errors = [];
  const mode = selected?.mode ?? FURNITURE_VISUAL_PLACEMENT_MODE.NATIVE;
  if (!Object.values(FURNITURE_VISUAL_PLACEMENT_MODE).includes(mode)) {
    errors.push(`unsupported visualPlacement mode: ${String(mode)}`);
  }
  validatePointField(errors, selected?.origin, 'origin');
  if (selected?.origin && (
    Number(selected.origin.x) < 0 || Number(selected.origin.x) > 1
    || Number(selected.origin.y) < 0 || Number(selected.origin.y) > 1
  )) errors.push('origin x/y must be between 0 and 1');
  validatePointField(errors, selected?.groundOffset, 'groundOffset');
  validateRectField(errors, selected?.sourceAlphaBounds, 'sourceAlphaBounds');
  validateRectField(errors, selected?.targetVisualBounds, 'targetVisualBounds');
  if (selected?.allowedOverhang != null) {
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const value = selected.allowedOverhang?.[side];
      if (value != null && (!finite(value) || Number(value) < 0)) {
        errors.push(`allowedOverhang.${side} must be a non-negative number`);
      }
    }
  }
  validateConnectionSockets(errors, selected?.connectionSockets);
  if (mode === FURNITURE_VISUAL_PLACEMENT_MODE.AUTHORED_BOUNDS) {
    if (!rect(selected?.sourceAlphaBounds)) {
      errors.push('authored-bounds requires sourceAlphaBounds');
    }
    if (!rect(selected?.targetVisualBounds)) {
      errors.push('authored-bounds requires targetVisualBounds');
    }
  }
  return {valid: errors.length === 0, errors};
}

function nativePlacement({
  textureFrame,
  visualDefinition,
  selected,
  fallbackReason = null
}) {
  const frame = frameSize(textureFrame);
  const origin = point(
    selected?.origin,
    point(visualDefinition?.origin || visualDefinition?.anchor, {x: 0.5, y: 1})
  );
  const configuredScaleX = visualDefinition?.nativeScaleX
    ?? visualDefinition?.visualScaleX
    ?? visualDefinition?.nativeScale
    ?? visualDefinition?.visualScale;
  const configuredScaleY = visualDefinition?.nativeScaleY
    ?? visualDefinition?.visualScaleY
    ?? visualDefinition?.nativeScale
    ?? visualDefinition?.visualScale;
  const targetWidth = positive(visualDefinition?.nativeTargetWidth)
    ? Number(visualDefinition.nativeTargetWidth)
    : 96;
  const scaleX = positive(configuredScaleX)
    ? Number(configuredScaleX)
    : frame.width > 0 ? targetWidth / frame.width : 1;
  const scaleY = positive(configuredScaleY)
    ? Number(configuredScaleY)
    : positive(configuredScaleX)
      ? Number(configuredScaleX)
      : frame.width > 0 ? targetWidth / frame.width : 1;
  const ground = point(selected?.groundOffset);
  return {
    originX: origin.x,
    originY: origin.y,
    offsetX: 0,
    offsetY: 0,
    scaleX,
    scaleY,
    displayWidth: frame.width * Math.abs(scaleX),
    displayHeight: frame.height * Math.abs(scaleY),
    groundOffsetX: ground.x,
    groundOffsetY: ground.y,
    mode: FURNITURE_VISUAL_PLACEMENT_MODE.NATIVE,
    fallbackReason,
    allowedOverhang: selected?.allowedOverhang
      ? {...selected.allowedOverhang}
      : null,
    connectionSockets: selected?.connectionSockets
      ? structuredClone(selected.connectionSockets)
      : null
  };
}

// targetVisualBounds uses world-pixel offsets relative to logicalBounds.x/y.
// sourceAlphaBounds uses texture-frame pixels. The returned offset is relative
// to the existing logical anchor; groundOffset remains explicit and is applied
// by the common display adapter after the authored-bounds alignment.
export function resolveFurnitureVisualPlacement({
  projectionMode = 'iso',
  type = '',
  direction = '',
  logicalFootprint = null,
  logicalBounds = null,
  textureFrame = null,
  visualDefinition = null
} = {}) {
  const visualPlacement = visualDefinition?.visualPlacement || null;
  const selected = directionalDefinition(visualPlacement, direction);
  const validation = validateFurnitureVisualPlacementDefinition(
    visualPlacement,
    {direction}
  );
  const native = reason => nativePlacement({
    textureFrame,
    visualDefinition,
    selected,
    fallbackReason: reason
  });

  if (!validation.valid) return native('invalid-metadata');
  if (projectionMode !== 'ortho'
    || !selected
    || (selected.mode ?? FURNITURE_VISUAL_PLACEMENT_MODE.NATIVE)
      !== FURNITURE_VISUAL_PLACEMENT_MODE.AUTHORED_BOUNDS) {
    return native(null);
  }

  const frame = frameSize(textureFrame);
  const source = rect(selected.sourceAlphaBounds);
  const target = rect(selected.targetVisualBounds);
  const bounds = rect(logicalBounds);
  if (!frame.width || !frame.height || !source || !target || !bounds) {
    return native('incomplete-authored-bounds-input');
  }
  if (source.x < 0 || source.y < 0
    || source.x + source.width > frame.width
    || source.y + source.height > frame.height) {
    return native('source-alpha-bounds-outside-frame');
  }

  const origin = point(
    selected.origin,
    point(visualDefinition?.origin || visualDefinition?.anchor, {x: 0.5, y: 1})
  );
  const ground = point(selected.groundOffset);
  const anchorX = finite(logicalBounds?.anchorX)
    ? Number(logicalBounds.anchorX)
    : bounds.x + bounds.width / 2;
  const anchorY = finite(logicalBounds?.anchorY)
    ? Number(logicalBounds.anchorY)
    : bounds.y + bounds.height;
  const scaleX = target.width / source.width;
  const scaleY = target.height / source.height;
  const targetWorldX = bounds.x + target.x;
  const targetWorldY = bounds.y + target.y;
  const offsetX = targetWorldX - anchorX
    - (source.x - origin.x * frame.width) * scaleX;
  const offsetY = targetWorldY - anchorY
    - (source.y - origin.y * frame.height) * scaleY;

  return {
    originX: origin.x,
    originY: origin.y,
    offsetX,
    offsetY,
    scaleX,
    scaleY,
    displayWidth: frame.width * Math.abs(scaleX),
    displayHeight: frame.height * Math.abs(scaleY),
    groundOffsetX: ground.x,
    groundOffsetY: ground.y,
    mode: FURNITURE_VISUAL_PLACEMENT_MODE.AUTHORED_BOUNDS,
    fallbackReason: null,
    type,
    direction,
    logicalFootprint: logicalFootprint
      ? {width: Number(logicalFootprint.width), height: Number(logicalFootprint.height)}
      : null,
    allowedOverhang: selected.allowedOverhang
      ? {...selected.allowedOverhang}
      : null,
    connectionSockets: selected.connectionSockets
      ? structuredClone(selected.connectionSockets)
      : null
  };
}
