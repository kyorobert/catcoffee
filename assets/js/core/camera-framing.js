// Pure camera-framing maths for the Orthogonal room: fit the room CONTENT into the
// safe viewport, and clamp panning so the safe viewport never leaves the content
// (no large empty background). No engine, DOM, storage or actor identity — Node-testable.
//
// Conventions: content is a world-space rect {x, y, width, height}. The safe viewport is
// CSS px {width, height, ...} inside the canvas (see scene-viewport.js). Positioning is
// expressed as the camera CENTRE (the engine's world midpoint) rather than a scroll
// top-left, because the engine's scroll is not a plain world top-left; a centerOn(x, y)
// call reliably places world point (x, y) at the screen centre. The world size of the view is
// canvasWidth/zoom × canvasHeight/zoom.
//
// These centralise the numbers so nothing is hardcoded per device: every viewport
// derives its own zoom/centre from the same policy.
export const ORTHO_FRAMING = Object.freeze({
  marginCss: 10,          // breathing space around the room, CSS px per side
  toolbarReserveCss: 78,  // bottom band kept for the floating context toolbar
  maxInitialZoom: 0.9,    // never START more zoomed-in than this (keeps whole room in view)
  minZoomFloor: 0.18      // absolute lower guard so zoom never degenerates
});

// Fit zoom so `content` (+ CSS margins) fits inside the safe viewport. The tighter of
// the width/height ratios wins (a wide room on a tall phone becomes width-constrained).
export function computeFitZoom({contentWidth, contentHeight, safeWidth, safeHeight,
  marginCss = 0, maxZoom = Infinity, minZoom = 0} = {}) {
  const usableW = Math.max(1, safeWidth - 2 * marginCss);
  const usableH = Math.max(1, safeHeight - 2 * marginCss);
  const zx = usableW / Math.max(1, contentWidth);
  const zy = usableH / Math.max(1, contentHeight);
  let zoom = Math.min(zx, zy);
  if (Number.isFinite(maxZoom)) zoom = Math.min(zoom, maxZoom);
  zoom = Math.max(zoom, minZoom);
  return zoom;
}

// Clamp the camera CENTRE (world midpoint) so the visible view stays within `content`.
// When the view is larger than content on an axis, that axis centres on the content — so
// at fit zoom there is no pan into empty space, and zoomed-in panning stops at the room
// edge. viewWidth/viewHeight are the world size of the canvas (canvasWidth/zoom, etc.).
export function clampCenterToContent({centerX, centerY, viewWidth, viewHeight, content}) {
  const axis = (center, view, cMin, cLen) => view >= cLen
    ? cMin + cLen / 2
    : Math.min(Math.max(center, cMin + view / 2), cMin + cLen - view / 2);
  return {
    x: axis(centerX, viewWidth, content.x, content.width),
    y: axis(centerY, viewHeight, content.y, content.height)
  };
}

// Complete initial framing: the fit zoom plus the (content-clamped) camera centre that
// shows the whole room. `policy` overrides ORTHO_FRAMING fields.
export function computeInitialFraming({content, safe, canvasWidth, canvasHeight, maxZoom, policy = {}}) {
  const cfg = {...ORTHO_FRAMING, ...policy};
  const zoom = computeFitZoom({
    contentWidth: content.width, contentHeight: content.height,
    safeWidth: safe.width, safeHeight: safe.height,
    marginCss: cfg.marginCss,
    maxZoom: Number.isFinite(maxZoom) ? Math.min(maxZoom, cfg.maxInitialZoom) : cfg.maxInitialZoom,
    minZoom: cfg.minZoomFloor
  });
  const centre = clampCenterToContent({
    centerX: content.x + content.width / 2, centerY: content.y + content.height / 2,
    viewWidth: canvasWidth / zoom, viewHeight: canvasHeight / zoom, content
  });
  return {zoom, centerX: centre.x, centerY: centre.y, minZoom: zoom};
}
