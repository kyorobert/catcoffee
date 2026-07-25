import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveOverlayInsets, computeSafeViewport} from '../assets/js/core/scene-viewport.js?v=0572a';
import {computeFitZoom, clampCenterToContent, computeInitialFraming, ORTHO_FRAMING}
  from '../assets/js/core/camera-framing.js?v=0572a';

const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
// The orthogonal room content used at runtime (floor + full back wall), world px (ARCH-0572).
const content = {x: 340, y: -120, width: 880, height: 1184};

// --- A. Safe viewport: overlay insets + clamped usable rect (Node-testable, no DOM) ---
const canvas = {left: 0, top: 86, right: 390, bottom: 782}; // 390x696 canvas below the HUD
// HUD sits entirely ABOVE the canvas, bottom bar entirely BELOW → neither intrudes.
const hud = {left: 0, top: 0, right: 390, bottom: 86};
const bottomBar = {left: 0, top: 782, right: 390, bottom: 844};
assert.deepEqual(deriveOverlayInsets(canvas, [hud, bottomBar]), {top: 0, right: 0, bottom: 0, left: 0},
  'HUD/bottom bar do not overlap the canvas');
// A floating context toolbar covering the bottom of the canvas contributes a bottom inset.
const toolbar = {left: 20, top: 700, right: 370, bottom: 774};
assert.equal(deriveOverlayInsets(canvas, [toolbar]).bottom, 782 - 700, 'toolbar bottom inset = canvas.bottom - toolbar.top');
// A top-anchored overlay contributes a top inset.
assert.equal(deriveOverlayInsets(canvas, [{left: 0, top: 86, right: 390, bottom: 140}]).top, 140 - 86);

// computeSafeViewport: clamps, never inverts, respects minSize, offsets are the insets.
const safe = computeSafeViewport({canvasWidth: 390, canvasHeight: 696, insets: {bottom: 78}});
assert.deepEqual(safe, {width: 390, height: 618, offsetX: 0, offsetY: 0, centerX: 195, centerY: 309});
const degenerate = computeSafeViewport({canvasWidth: 100, canvasHeight: 100, insets: {top: 200, bottom: 200}});
assert.ok(degenerate.width >= 1 && degenerate.height >= 1 && degenerate.height <= 100, 'safe rect never inverts');
assert.deepEqual(computeSafeViewport({canvasWidth: 0, canvasHeight: 0}).width >= 1, true);

// --- B. Fit zoom: derived from bounds, per-viewport, width/height-constrained ---
const phone = computeSafeViewport({canvasWidth: 390, canvasHeight: 696, insets: {bottom: ORTHO_FRAMING.toolbarReserveCss}});
const desk = computeSafeViewport({canvasWidth: 1440, canvasHeight: 812, insets: {bottom: ORTHO_FRAMING.toolbarReserveCss}});
const zPhone = computeFitZoom({contentWidth: content.width, contentHeight: content.height, safeWidth: phone.width, safeHeight: phone.height, marginCss: ORTHO_FRAMING.marginCss, maxZoom: ORTHO_FRAMING.maxInitialZoom, minZoom: ORTHO_FRAMING.minZoomFloor});
const zDesk = computeFitZoom({contentWidth: content.width, contentHeight: content.height, safeWidth: desk.width, safeHeight: desk.height, marginCss: ORTHO_FRAMING.marginCss, maxZoom: ORTHO_FRAMING.maxInitialZoom, minZoom: ORTHO_FRAMING.minZoomFloor});
assert.ok(Number.isFinite(zPhone) && zPhone > 0);
assert.ok(Number.isFinite(zDesk) && zDesk > 0);
assert.notEqual(zPhone, zDesk, 'zoom is computed per viewport, not hardcoded');
// phone (tall, wide room) is width-constrained; desktop (wide) is height-constrained.
assert.ok(approx(zPhone, (phone.width - 2 * ORTHO_FRAMING.marginCss) / content.width, 1e-6), 'phone fit is width-constrained');
assert.ok(approx(zDesk, (desk.height - 2 * ORTHO_FRAMING.marginCss) / content.height, 1e-6), 'desktop fit is height-constrained');
// maxInitialZoom cap and minZoomFloor guard.
assert.equal(computeFitZoom({contentWidth: 50, contentHeight: 50, safeWidth: 4000, safeHeight: 4000, maxZoom: 0.9, minZoom: 0.18}), 0.9, 'capped by maxZoom');
assert.equal(computeFitZoom({contentWidth: 99999, contentHeight: 99999, safeWidth: 100, safeHeight: 100, maxZoom: 0.9, minZoom: 0.18}), 0.18, 'floored by minZoom');
// three phone sizes give three (increasing-with-width) fit zooms — nothing hardcoded per device.
const zByWidth = [390, 393, 430].map(w => computeFitZoom({contentWidth: content.width, contentHeight: content.height,
  safeWidth: computeSafeViewport({canvasWidth: w, canvasHeight: 700, insets: {bottom: 78}}).width, safeHeight: 622, marginCss: 10, maxZoom: 0.9, minZoom: 0.18}));
assert.ok(zByWidth[0] < zByWidth[1] && zByWidth[1] < zByWidth[2], 'wider phone → larger width-constrained fit');

// --- C. Initial framing centres content; clamp keeps view in content / centres small content ---
for (const [cw, ch] of [[390, 696], [393, 704], [430, 784], [1440, 812]]) {
  const s = computeSafeViewport({canvasWidth: cw, canvasHeight: ch, insets: {bottom: 78}});
  const f = computeInitialFraming({content, safe: s, canvasWidth: cw, canvasHeight: ch, maxZoom: 1.65, policy: {}});
  assert.ok(Number.isFinite(f.zoom) && f.zoom > 0, `zoom finite ${cw}x${ch}`);
  assert.equal(f.minZoom, f.zoom);
  // at fit zoom the room fits, so the camera centre is exactly the content centre.
  assert.ok(approx(f.centerX, content.x + content.width / 2) && approx(f.centerY, content.y + content.height / 2),
    `initial framing centres content ${cw}x${ch}`);
  // the whole room is within the view on both axes (no cropping at fit zoom).
  assert.ok(cw / f.zoom >= content.width - 1e-6, `room width fits ${cw}`);
  assert.ok(ch / f.zoom >= content.height - 1e-6, `room height fits ${ch}`);
}
// clampCenterToContent: content smaller than view → centre; larger → clamp to edges.
assert.deepEqual(clampCenterToContent({centerX: 9999, centerY: -9999, viewWidth: 3000, viewHeight: 3000, content}),
  {x: content.x + content.width / 2, y: content.y + content.height / 2}, 'view bigger than content → centre');
{
  const vw = 400, vh = 300; // view smaller than content on both axes
  const c = clampCenterToContent({centerX: -9999, centerY: -9999, viewWidth: vw, viewHeight: vh, content});
  assert.equal(c.x, content.x + vw / 2, 'left clamp');
  assert.equal(c.y, content.y + vh / 2, 'top clamp');
  const c2 = clampCenterToContent({centerX: 9999, centerY: 9999, viewWidth: vw, viewHeight: vh, content});
  assert.equal(c2.x, content.x + content.width - vw / 2, 'right clamp');
  assert.equal(c2.y, content.y + content.height - vh / 2, 'bottom clamp');
  // an interior centre is left unchanged (free panning inside the room).
  const inside = clampCenterToContent({centerX: 780, centerY: 496, viewWidth: vw, viewHeight: vh, content});
  assert.deepEqual(inside, {x: 780, y: 496}, 'interior centre unchanged');
}

// --- Purity: the framing/viewport helpers carry no engine/DOM/storage/actor identity ---
for (const file of ['../assets/js/core/scene-viewport.js', '../assets/js/core/camera-framing.js']) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  for (const banned of ['Phaser', 'document', 'window', 'localStorage', 'SaveAdapter']) {
    assert.ok(!new RegExp(`\\b${banned}\\b`).test(source), `${file} must not reference ${banned}`);
  }
  assert.ok(!/\b(manager|staff|employee|worker|customer)\b/i.test(source), `${file} must not encode actor identity`);
}

console.log('Camera framing: safe viewport subtracts only intersecting overlays & never inverts; fit zoom is per-viewport (width- or height-constrained, capped/floored); initial framing centres the whole room; centre clamp keeps the view inside the room and centres small content.');
