import {INPUT_MODE} from '../core/input-state.js?v=0577n';
import {computeSafeViewport} from '../core/scene-viewport.js?v=0577n';
import {computeInitialFraming, clampCenterToContent} from '../core/camera-framing.js?v=0577n';

export class CameraController {
  constructor(scene, roomConfig, {inputMode = null, isFurnitureDragging = () => false, onPinchStart = null, framing = null} = {}) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.room = roomConfig;
    this.inputMode = inputMode;
    this.isFurnitureDragging = isFurnitureDragging;
    this.onPinchStart = onPinchStart;
    // Optional projection-aware framing policy (Orthogonal only). When present the camera
    // fits the room CONTENT into the safe viewport and clamps panning to the content,
    // instead of the iso/flat cover-zoom over the whole world. iso/flat pass no framing
    // and keep their existing behaviour untouched.
    this.framing = framing;
    this.pointers = new Map();
    this.pan = null;
    this.pinch = null;
    this.initialized = false;
    this.enabled = true;
    this.bind();
    this.resize(scene.scale.gameSize);
  }

  getCoverZoom(width = this.camera.width, height = this.camera.height) {
    return Math.max(width / this.room.worldWidth, height / this.room.worldHeight);
  }

  resize(size) {
    if (this.framing) { this.applyFraming(size); return; }
    const center = this.initialized
      ? {x: this.camera.midPoint.x, y: this.camera.midPoint.y}
      : {x: this.room.worldWidth / 2, y: this.room.worldHeight / 2};
    this.minZoom = Math.max(this.room.camera.baseMinZoom, this.getCoverZoom(size.width, size.height));
    this.camera.setBounds(0, 0, this.room.worldWidth, this.room.worldHeight);
    this.camera.setZoom(Math.max(this.minZoom, Math.min(this.room.camera.maxZoom, this.camera.zoom || this.room.camera.defaultZoom)));
    this.camera.centerOn(center.x, center.y);
    this.initialized = true;
  }

  // Orthogonal framing: fit the room content into the safe viewport and centre it (boot /
  // not yet framed), or preserve the player's zoom and only re-clamp the centre on later
  // resizes. Positioning uses Phaser's centerOn (world midpoint), and Phaser world bounds
  // are removed so only our content clamp applies.
  applyFraming(size) {
    const canvasWidth = size?.width || this.camera.width;
    const canvasHeight = size?.height || this.camera.height;
    if (canvasWidth <= 0 || canvasHeight <= 0) return;
    const room = this.getRoomBounds();
    const core = this.getCoreBounds();
    const safe = computeSafeViewport({canvasWidth, canvasHeight, insets: this.framing.getSafeInsets()});
    const framed = computeInitialFraming({
      core, room, safe, canvasWidth, canvasHeight,
      maxZoom: this.room.camera.maxZoom, policy: this.framing.policy
    });
    this.minZoom = framed.minZoom;
    this.camera.removeBounds();
    if (!this.initialized) {
      this.camera.setZoom(framed.zoom);
      this.camera.centerOn(framed.centerX, framed.centerY);
      this.initialized = true;
    } else {
      this.camera.setZoom(Phaser.Math.Clamp(this.camera.zoom, this.minZoom, this.room.camera.maxZoom));
      this.clampToContent();
    }
  }

  // The full-bleed target for the first screen (core gameplay region). Panning/zoom-out is
  // clamped to the whole room instead (getRoomBounds), so the outer columns stay reachable.
  getCoreBounds() {
    return this.framing.getCoreBounds ? this.framing.getCoreBounds() : this.getRoomBounds();
  }

  getRoomBounds() {
    return this.framing.getRoomBounds ? this.framing.getRoomBounds() : this.framing.getContentBounds();
  }

  // The world point currently at the centre of the view. We derive it from the LIVE scrollX/Y
  // (Phaser's `centerOn(x,y)` sets scrollX = x - width/2), NOT from `camera.midPoint`, which is
  // only recomputed in preRender — reading it right after a manual scroll change yields a STALE
  // value and would snap the camera back, killing interactive panning (ARCH-0575 P0 fix).
  viewCentre() {
    const cam = this.camera;
    return {x: cam.scrollX + cam.width / 2, y: cam.scrollY + cam.height / 2};
  }

  // Clamp so the visible view stays inside the room. On an axis where the room (in projected
  // px at the current zoom) is LARGER than the view, panning is allowed up to the room edge; on
  // an axis where it is smaller, that axis locks to the room centre. Recomputed from the live
  // zoom + view centre every call (pan / pinch / wheel / resize).
  clampToContent() {
    if (!this.framing) return;
    const zoom = this.camera.zoom || 1;
    const view = this.viewCentre();
    const centre = clampCenterToContent({
      centerX: view.x, centerY: view.y,
      viewWidth: this.camera.width / zoom, viewHeight: this.camera.height / zoom,
      content: this.getRoomBounds()
    });
    this.camera.centerOn(centre.x, centre.y);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.pan = null;
      this.pinch = null;
    }
  }

  isEnabled() { return this.enabled; }

  bind() {
    const input = this.scene.input;
    this.handlePointerDown = (pointer, over = []) => {
      this.pointers.set(pointer.id, {x: pointer.x, y: pointer.y});
      this.inputMode?.trackPointer(pointer.id);
      if (this.pointers.size >= 2 && this.inputMode?.canStartPinch()) {
        this.onPinchStart?.();
        this.setEnabled(true);
        this.inputMode?.setMode(INPUT_MODE.PINCH_ZOOM, {pointerCount: this.pointers.size});
        this.beginPinch();
        return;
      }
      if (!this.enabled || this.isFurnitureDragging()) return;
      if (this.inputMode ? this.inputMode.canStartCameraPan(pointer, over) : !over.length) {
        this.pan = {id: pointer.id, x: pointer.x, y: pointer.y};
        this.inputMode?.setMode(INPUT_MODE.CAMERA_PAN, {pointerId: pointer.id});
      }
    };
    this.handlePointerMove = (pointer) => {
      if (!this.pointers.has(pointer.id)) return;
      this.pointers.set(pointer.id, {x: pointer.x, y: pointer.y});
      if (!this.enabled || this.isFurnitureDragging()) { this.pan = null; return; }
      if (this.pointers.size >= 2) { this.updatePinch(); return; }
      if (this.pan?.id === pointer.id) {
        const dx = pointer.x - this.pan.x;
        const dy = pointer.y - this.pan.y;
        this.camera.scrollX -= dx / this.camera.zoom;
        this.camera.scrollY -= dy / this.camera.zoom;
        this.pan.x = pointer.x;
        this.pan.y = pointer.y;
        if (this.framing) this.clampToContent();
      }
    };
    this.handlePointerFinish = (pointer) => {
      this.pointers.delete(pointer.id);
      this.inputMode?.releasePointer(pointer.id);
      if (this.pan?.id === pointer.id) this.pan = null;
      this.pinch = null;
      if (!this.pointers.size && !this.isFurnitureDragging()) this.inputMode?.releaseToStable();
    };
    this.handleGameOut = () => {
      this.pan = null;
      this.pinch = null;
      this.pointers.clear();
      if (!this.isFurnitureDragging()) this.inputMode?.reset();
    };
    this.handleWheel = (pointer, _objects, _dx, dy) => {
      if (!this.enabled || this.isFurnitureDragging()) return;
      const before = this.camera.getWorldPoint(pointer.x, pointer.y);
      this.setZoomAt(pointer.x, pointer.y, this.camera.zoom * Math.exp(-dy * .0015), before);
    };
    this.handleResize = size => this.resize(size);
    input.on('pointerdown', this.handlePointerDown);
    input.on('pointermove', this.handlePointerMove);
    input.on('pointerup', this.handlePointerFinish);
    input.on('pointerupoutside', this.handlePointerFinish);
    input.on('gameout', this.handleGameOut);
    input.on('wheel', this.handleWheel);
    this.scene.scale.on('resize', this.handleResize);
  }

  beginPinch() {
    const points = [...this.pointers.values()].slice(0, 2);
    if (points.length < 2) return;
    const center = {x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2};
    this.pinch = {
      distance: Phaser.Math.Distance.Between(points[0].x, points[0].y, points[1].x, points[1].y),
      zoom: this.camera.zoom,
      world: this.camera.getWorldPoint(center.x, center.y)
    };
    this.pan = null;
  }

  updatePinch() {
    const points = [...this.pointers.values()].slice(0, 2);
    if (!this.pinch || points.length < 2) { this.beginPinch(); return; }
    const center = {x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2};
    const distance = Phaser.Math.Distance.Between(points[0].x, points[0].y, points[1].x, points[1].y);
    this.setZoomAt(center.x, center.y, this.pinch.zoom * (distance / Math.max(1, this.pinch.distance)), this.pinch.world);
  }

  setZoomAt(screenX, screenY, nextZoom, worldBefore = this.camera.getWorldPoint(screenX, screenY)) {
    const zoom = Phaser.Math.Clamp(nextZoom, this.minZoom, this.room.camera.maxZoom);
    this.camera.setZoom(zoom);
    const after = this.camera.getWorldPoint(screenX, screenY);
    this.camera.scrollX += worldBefore.x - after.x;
    this.camera.scrollY += worldBefore.y - after.y;
    if (this.framing) this.clampToContent();
  }

  destroy() {
    const input = this.scene.input;
    input.off('pointerdown', this.handlePointerDown);
    input.off('pointermove', this.handlePointerMove);
    input.off('pointerup', this.handlePointerFinish);
    input.off('pointerupoutside', this.handlePointerFinish);
    input.off('gameout', this.handleGameOut);
    input.off('wheel', this.handleWheel);
    this.scene.scale.off('resize', this.handleResize);
    this.pointers.clear();
  }
}
