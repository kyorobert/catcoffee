import {deriveOverlayInsets} from '../core/scene-viewport.js?v=0577d';

// Centralised DOM adapter that measures which on-canvas overlays cover the game canvas,
// so the CameraController never queries multiple DOM selectors itself. It reads live
// getBoundingClientRect()s (never hardcoded device/toolbar heights) for the HUD, bottom
// bar and floating context toolbar, keeps only the ones currently visible, and returns
// CSS-px edge insets via the pure scene-viewport helper. A configurable bottom reserve
// keeps space for the context toolbar even while it is hidden, so a later furniture
// selection never hides a bottom item and the camera never has to jump.
const OVERLAY_IDS = ['gameHud', 'gameBottomBar', 'selectionBar'];

export class ViewportMetrics {
  constructor(doc = typeof document !== 'undefined' ? document : null) {
    this.doc = doc;
  }
  isVisible(element) {
    if (!element || element.classList.contains('hidden')) return false;
    if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) return false;
    return true;
  }
  getInsets(canvasElement, {toolbarReserve = 0} = {}) {
    const empty = {top: 0, right: 0, bottom: Math.max(0, toolbarReserve), left: 0};
    if (!canvasElement?.getBoundingClientRect || !this.doc) return empty;
    const canvasRect = canvasElement.getBoundingClientRect();
    const overlays = OVERLAY_IDS
      .map(id => this.doc.getElementById?.(id))
      .filter(element => this.isVisible(element))
      .map(element => element.getBoundingClientRect());
    const insets = deriveOverlayInsets(canvasRect, overlays);
    // The context toolbar is hidden at boot, so keep a reserve for it regardless.
    insets.bottom = Math.max(insets.bottom, toolbarReserve);
    return insets;
  }
}
