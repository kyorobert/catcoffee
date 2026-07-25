// Pure "safe viewport" maths. Given the game canvas size and the on-canvas overlay
// rectangles (context toolbar, and — defensively — the HUD / bottom bar even though
// the flex layout already keeps them off the canvas), it returns the usable rectangle
// the scene camera should frame content into. No engine, DOM, storage or actor
// identity lives here, so it is fully Node-testable. All inputs/outputs are CSS px.
//
// The scene canvas (#gameViewport) already sits between the HUD row and the bottom bar
// row and already absorbs the top/bottom CSS safe-area insets via their padding, so on
// a phone those edges usually contribute 0 here. The one overlay that really covers the
// canvas is the floating `.selection-bar` context toolbar; a configurable bottom
// reserve keeps space for it even while it is hidden, so a later selection never hides
// a bottom-row item and the camera never has to jump.

function overlaps(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// Insets (top/bottom, CSS px) that horizontal overlay bars eat out of the canvas. Each
// overlapping overlay is attributed to the nearer horizontal edge (top or bottom) — so a
// context toolbar floating a few px above the canvas bottom still reserves from the
// bottom — and reserves the strip from that edge to the overlay's far side. Overlays that
// do not overlap the canvas (HUD above / bottom bar below, in their own layout rows)
// contribute nothing. left/right stay 0 for full-width bars; callers add CSS safe-area
// left/right separately if ever needed.
export function deriveOverlayInsets(canvasRect, overlayRects = []) {
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  const ch = canvasRect.bottom - canvasRect.top;
  for (const overlay of overlayRects) {
    if (!overlay || !overlaps(canvasRect, overlay)) continue;
    const gapTop = overlay.top - canvasRect.top;
    const gapBottom = canvasRect.bottom - overlay.bottom;
    if (gapTop <= gapBottom) {
      inset.top = Math.max(inset.top, Math.min(ch, overlay.bottom - canvasRect.top));
    } else {
      inset.bottom = Math.max(inset.bottom, Math.min(ch, canvasRect.bottom - overlay.top));
    }
  }
  return inset;
}

// Usable rectangle inside the canvas after removing insets. offsetX/offsetY are the
// top-left of the safe rect within the canvas; centerX/centerY are its centre. width
// and height never drop below minSize and never invert, even with absurd insets.
export function computeSafeViewport({canvasWidth, canvasHeight, insets = {}, minSize = 1} = {}) {
  const cw = Math.max(0, Number(canvasWidth) || 0);
  const ch = Math.max(0, Number(canvasHeight) || 0);
  const top = Math.max(0, Number(insets.top) || 0);
  const right = Math.max(0, Number(insets.right) || 0);
  const bottom = Math.max(0, Number(insets.bottom) || 0);
  const left = Math.max(0, Number(insets.left) || 0);
  const width = Math.max(minSize, cw - left - right);
  const height = Math.max(minSize, ch - top - bottom);
  return {
    width, height, offsetX: left, offsetY: top,
    centerX: left + width / 2, centerY: top + height / 2
  };
}
