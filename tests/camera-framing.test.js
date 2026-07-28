import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveOverlayInsets, computeSafeViewport} from '../assets/js/core/scene-viewport.js?v=0577e';
import {computeFitZoom, clampCenterToContent, computeInitialFraming, ORTHO_FRAMING}
  from '../assets/js/core/camera-framing.js?v=0577e';

const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
// The orthogonal room content used at runtime (floor + back wall), world px (ARCH-0575 wall 260).
const content = {x: 340, y: -180, width: 880, height: 1244};

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

// --- D. Core full-bleed vs whole-room pan range (ARCH-0573, wall shortened in ARCH-0574) ---
// room = floor + back wall (155) + outer x0/x9 margins; core = gameplay columns x1-8 + a short
// wall strip (118). Projected values from the 10x8 room at cellWidth 88 / cellHeight 120.
const room = {x: 340, y: -180, width: 880, height: 1244};
const core = {x: 428, y: -140, width: 704, height: 1204};
for (const [cw, ch] of [[390, 696], [393, 704], [430, 784]]) {
  const s = computeSafeViewport({canvasWidth: cw, canvasHeight: ch, insets: {bottom: 78}});
  const f = computeInitialFraming({core, room, safe: s, canvasWidth: cw, canvasHeight: ch, maxZoom: 1.65, policy: {}});
  const roomFit = computeFitZoom({contentWidth: room.width, contentHeight: room.height, safeWidth: s.width, safeHeight: s.height,
    marginCss: ORTHO_FRAMING.marginCss, maxZoom: ORTHO_FRAMING.maxInitialZoom, minZoom: ORTHO_FRAMING.minZoomFloor});
  // the first screen full-bleeds the CORE: it fills >= 90% of the safe viewport height.
  const coreFillH = core.height * f.zoom / s.height;
  assert.ok(coreFillH >= 0.9, `core fills >=90% of safe height (${cw}x${ch}: ${(coreFillH * 100).toFixed(0)}%)`);
  // core full-bleed uses a larger zoom than a whole-room contain-fit → far less vertical
  // margin than V0572 (which fit the entire room).
  assert.ok(f.zoom > roomFit, `core zoom beats whole-room fit → less margin than V0572 (${cw})`);
  // the outer room columns crop a little (<=10% per side) and stay reachable by panning.
  const roomOnScreenW = room.width * f.zoom;
  const crop = Math.max(0, (roomOnScreenW - cw) / 2 / roomOnScreenW);
  assert.ok(crop > 0 && crop <= 0.10, `room side crop within (0, 10%] (${cw}: ${(crop * 100).toFixed(1)}%)`);
  // the zoom-out floor reveals the WHOLE room (minZoom = room fit, below the core-fit start).
  assert.ok(approx(f.minZoom, roomFit), `minZoom == whole-room fit (${cw})`);
  assert.ok(f.minZoom < f.zoom, `player can zoom out below the core-fit initial (${cw})`);
  // the initial centre is the CORE centre on X (clamped within the room), so the core is centred.
  assert.ok(approx(f.centerX, core.x + core.width / 2, 1), `initial framing centres on the core (${cw})`);
}
// with only a single `content` (no core/room split) behaviour is unchanged: minZoom == fit zoom.
{
  const s = computeSafeViewport({canvasWidth: 390, canvasHeight: 696, insets: {bottom: 78}});
  const f = computeInitialFraming({content: room, safe: s, canvasWidth: 390, canvasHeight: 696, maxZoom: 1.65});
  assert.equal(f.minZoom, f.zoom, 'single-content path keeps minZoom == fit zoom (back-compat)');
}

// --- E. Zoom-in leaves a real pan range on both axes (ARCH-0575) ---
// When the view (canvas/zoom) is SMALLER than the room, the clamp must allow a non-zero range of
// centres on that axis (so the player can pan), and only lock-centre when the view is larger.
{
  const canvasW = 390, canvasH = 696, zoomIn = 1.3;
  const vw = canvasW / zoomIn, vh = canvasH / zoomIn;      // view smaller than the room on both axes
  assert.ok(vw < room.width && vh < room.height, 'zoomed-in view is smaller than the room');
  const cMinX = clampCenterToContent({centerX: -1e6, centerY: 0, viewWidth: vw, viewHeight: vh, content: room}).x;
  const cMaxX = clampCenterToContent({centerX: 1e6, centerY: 0, viewWidth: vw, viewHeight: vh, content: room}).x;
  const cMinY = clampCenterToContent({centerX: 0, centerY: -1e6, viewWidth: vw, viewHeight: vh, content: room}).y;
  const cMaxY = clampCenterToContent({centerX: 0, centerY: 1e6, viewWidth: vw, viewHeight: vh, content: room}).y;
  assert.ok(cMaxX - cMinX > 1, `X pan range > 0 when zoomed in (${(cMaxX - cMinX).toFixed(0)} world px)`);
  assert.ok(cMaxY - cMinY > 1, `Y pan range > 0 when zoomed in (${(cMaxY - cMinY).toFixed(0)} world px)`);
  // an axis where the view is LARGER than the room locks to the room centre (no pan there).
  const big = clampCenterToContent({centerX: 1e6, centerY: 0, viewWidth: room.width * 3, viewHeight: vh, content: room});
  assert.equal(big.x, room.x + room.width / 2, 'axis with view > room locks to centre');
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
