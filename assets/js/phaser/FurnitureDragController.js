import {INPUT_MODE} from '../core/input-state.js?v=0560a';
import {DepthSystem} from '../systems/DepthSystem.js?v=0560a';
import {getFurnitureDisplayState} from '../core/furniture-display-state.js?v=0560a';

const DRAG_THRESHOLD_PX = 8;

export class FurnitureDragController {
  constructor(scene, {grid, occupancy, placement, saveAdapter, furnitureConfig, inputMode, cameraController, catBehaviorController} = {}) {
    this.scene = scene;
    this.grid = grid;
    this.occupancy = occupancy;
    this.placement = placement;
    this.saveAdapter = saveAdapter;
    this.furniture = furnitureConfig;
    this.inputMode = inputMode;
    this.cameraController = cameraController;
    this.catBehaviorController = catBehaviorController;
    this.armed = null;
    this.drag = null;
    this.ghost = null;
    this.lastPointer = null;
    this.lastValidation = null;
    this.scene.input.dragDistanceThreshold = DRAG_THRESHOLD_PX;
    this.bind();
  }

  bind() {
    const input = this.scene.input;
    this.handleDragStart = (pointer, gameObject) => this.onDragStart(pointer, gameObject);
    this.handleDrag = (pointer, gameObject) => this.onDrag(pointer, gameObject);
    this.handleDragEnd = (pointer, gameObject) => this.onDragEnd(pointer, gameObject);
    this.handlePointerDown = pointer => {
      if (this.drag?.isNew && this.drag.pointerId === null) {
        this.drag.pointerId = pointer.id;
        this.updateCandidateFromPointer(pointer);
      }
    };
    this.handlePointerMove = pointer => {
      if (this.drag?.isNew && pointer.id === this.drag.pointerId) this.updateCandidateFromPointer(pointer);
    };
    this.handlePointerUp = pointer => {
      if (this.drag?.isNew && pointer.id === this.drag.pointerId) this.finish();
      else if (!this.drag && this.armed?.pointerId === pointer.id) this.armed = null;
    };
    this.handleGameOut = () => this.cancel('gameout');
    this.handlePointerCancel = () => this.cancel('pointercancel');
    this.handleWindowBlur = () => this.cancel('window-blur');
    this.handleShutdown = () => this.destroy();
    input.on('dragstart', this.handleDragStart);
    input.on('drag', this.handleDrag);
    input.on('dragend', this.handleDragEnd);
    input.on('pointerdown', this.handlePointerDown);
    input.on('pointermove', this.handlePointerMove);
    input.on('pointerup', this.handlePointerUp);
    input.on('pointerupoutside', this.handlePointerUp);
    input.on('gameout', this.handleGameOut);
    this.scene.game.canvas.addEventListener('pointercancel', this.handlePointerCancel, {passive: true});
    window.addEventListener('blur', this.handleWindowBlur, {passive: true});
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);
  }

  onEntityPointerDown(pointer, itemId) {
    if (this.drag) return;
    const item = this.scene.state.items.find(entry => entry.id === itemId);
    const entity = this.scene.entities.get(itemId);
    if (!item || !entity || !this.inputMode.canStartFurnitureDrag(entity, pointer)) return;
    this.scene.selectItem(itemId);
    this.inputMode.setMode(INPUT_MODE.FURNITURE_SELECTED, {itemId});
    this.armed = {pointerId: pointer.id, itemId, screenX: pointer.x, screenY: pointer.y};
  }

  onDragStart(pointer, gameObject) {
    const itemId = gameObject?.item?.id;
    if (!itemId || this.drag || !this.armed || this.armed.itemId !== itemId) return;
    if (!this.inputMode.canStartFurnitureDrag(gameObject, pointer)) return;
    const item = this.scene.state.items.find(entry => entry.id === itemId);
    if (!item) return;
    const pointerWorld = this.pointerToWorld(pointer);
    this.occupancy.removeItem(itemId);
    this.drag = {
      pointerId: pointer.id, isNew: false, movingItemId: itemId,
      item, original: {...item}, candidate: {...item}, entity: gameObject,
      grabOffsetWorld: {x: gameObject.x - pointerWorld.x, y: gameObject.y - pointerWorld.y}
    };
    this.armed = null;
    this.inputMode.setMode(INPUT_MODE.FURNITURE_DRAG, {itemId, pointerId: pointer.id});
    this.cameraController.setEnabled(false);
    this.catBehaviorController.pause('furniture-drag');
    gameObject.setDragVisual('dragging');
    this.createGhost(this.drag.candidate, gameObject);
    this.updateCandidateFromPointer(pointer);
  }

  onDrag(pointer, gameObject) {
    if (!this.drag || this.drag.isNew || this.drag.entity !== gameObject || pointer.id !== this.drag.pointerId) return;
    this.updateCandidateFromPointer(pointer);
  }

  onDragEnd(pointer, gameObject) {
    if (!this.drag || this.drag.isNew || this.drag.entity !== gameObject || pointer.id !== this.drag.pointerId) return;
    this.finish();
  }

  startPlacement(type) {
    if (!this.furniture[type]) return false;
    this.cancel('new-placement-replaced');
    const available = this.findAvailablePlacement(type);
    const candidate = {id: `new-${Date.now().toString(36)}`, type, x: available.x, y: available.y, r: 0};
    this.drag = {pointerId: null, isNew: true, movingItemId: null, item: null, original: null, candidate, entity: null, grabOffsetWorld: {x: 0, y: 0}};
    this.inputMode.setMode(INPUT_MODE.FURNITURE_SELECTED, {itemId: candidate.id, isNew: true});
    this.inputMode.setMode(INPUT_MODE.FURNITURE_DRAG, {itemId: candidate.id, isNew: true});
    this.cameraController.setEnabled(false);
    this.catBehaviorController.pause('furniture-drag');
    this.createGhost(candidate, null);
    this.renderPlacementVisuals();
    this.scene.game.events.emit('selection-changed', {item: candidate, definition: this.furniture[type], placing: true});
    return true;
  }

  findAvailablePlacement(type) {
    for (let y = 0; y < this.grid.room.floor.rows; y++) {
      for (let x = 0; x < this.grid.room.floor.cols; x++) {
        if (this.validate({type, x, y, r: 0}).valid) return {x, y};
      }
    }
    return {x: 4, y: 4};
  }

  pointerToWorld(pointer) {
    const camera = this.scene.cameras.main;
    const isTouch = Boolean(pointer.wasTouch || pointer.pointerType === 'touch' || pointer.event?.pointerType === 'touch');
    const screenY = pointer.y - (isTouch ? 36 : 0);
    const world = isTouch ? camera.getWorldPoint(pointer.x, screenY) : pointer.positionToCamera(camera);
    this.lastPointer = {
      pointerId: pointer.id, screenX: pointer.x, screenY: pointer.y,
      adjustedScreenY: screenY, worldX: world.x, worldY: world.y
    };
    return world;
  }

  updateCandidateFromPointer(pointer) {
    if (!this.drag) return;
    const world = this.pointerToWorld(pointer);
    const item = this.drag.candidate;
    const desiredAnchor = {
      x: world.x + (this.drag.grabOffsetWorld?.x || 0),
      y: world.y + (this.drag.grabOffsetWorld?.y || 0)
    };
    const referenceCenter = this.grid.getCellCenter(0, 0);
    const referenceAnchor = this.grid.getAnchor(item.type, 0, 0, item.r || 0);
    const snapped = this.grid.snapWorldToGrid(
      desiredAnchor.x - (referenceAnchor.x - referenceCenter.x),
      desiredAnchor.y - (referenceAnchor.y - referenceCenter.y)
    );
    this.drag.candidate.x = snapped.x;
    this.drag.candidate.y = snapped.y;
    this.syncGhost();
    this.renderPlacementVisuals();
  }

  createGhost(item, sourceEntity) {
    this.ghost?.destroy();
    const definition = this.furniture[item.type];
    const display = getFurnitureDisplayState(item.type, item.r || 0, definition);
    const anchor = this.grid.getAnchor(item.type, item.x, item.y, item.r || 0);
    this.ghost = this.scene.add.image(anchor.x, anchor.y, display.texture)
      .setOrigin(sourceEntity?.originX ?? display.originX, sourceEntity?.originY ?? display.originY)
      .setAlpha(.64)
      .setDepth(DepthSystem.for('ghost', anchor.y));
    if (sourceEntity) this.ghost.setScale(sourceEntity.scaleX, sourceEntity.scaleY);
    else if(display.scale)this.ghost.setScale(display.scale);
    else {
      const targetWidth = Math.max(44, Math.min(180, definition.size || 96));
      if (this.ghost.width) this.ghost.setScale(targetWidth / this.ghost.width);
    }
    this.ghost.disableInteractive();
    this.syncGhost();
  }

  syncGhost() {
    if (!this.drag || !this.ghost) return;
    const item = this.drag.candidate;
    const display = getFurnitureDisplayState(item.type, item.r || 0, this.furniture[item.type]);
    const anchor = this.grid.getAnchor(item.type, item.x, item.y, item.r || 0);
    if(display.texture&&this.ghost.texture.key!==display.texture)this.ghost.setTexture(display.texture);
    this.ghost.setPosition(anchor.x, anchor.y)
      .setOrigin(display.originX,display.originY)
      .setFlipX(display.flipX)
      .setDepth(DepthSystem.for('ghost', anchor.y));
  }

  validate(item = this.drag?.candidate) {
    if (!item) return {valid: false, blockingReason: 'unplaceable-cell', message: '這裡不是可擺放區域', warnings: []};
    const base = this.placement.validatePlacement({
      type: item.type, x: item.x, y: item.y, rotation: item.r || 0,
      movingItemId: this.drag?.movingItemId || null
    });
    if (!base.valid) return base;
    const cells = this.grid.getFootprintCells(item.type, item.x, item.y, item.r || 0);
    if (this.furniture[item.type]?.layer !== 'floorDecoration' && this.catBehaviorController.isAnyCatInCells(cells)) {
      return {valid: false, blockingReason: 'character-occupied', message: '這裡有貓咪，請換個位置', warnings: base.warnings || []};
    }
    return base;
  }

  renderPlacementVisuals() {
    const graphics = this.scene.placementGraphics;
    graphics.clear();
    if (!this.drag) return;
    const item = this.drag.candidate;
    if (this.scene.state.placementHelper) {
      for (let y = item.y - 2; y <= item.y + 2; y++) for (let x = item.x - 2; x <= item.x + 2; x++) {
        if (!this.grid.isPlaceableCell(x, y)) continue;
        const diamond = this.grid.getCellDiamond(x, y);
        graphics.fillStyle(0xfff2c8, .10).fillPoints(diamond, true);
        graphics.lineStyle(1, 0xfff2c8, .28).strokePoints([...diamond, diamond[0]], false);
      }
    }
    const result = this.validate();
    this.lastValidation = result;
    const polygon = this.grid.getFootprintPolygon(item.type, item.x, item.y, item.r || 0);
    const color = result.valid ? 0x60be73 : 0xda5252;
    graphics.fillStyle(color, .25).fillPoints(polygon, true);
    graphics.lineStyle(2, color, .9).strokePoints([...polygon, polygon[0]], false);
    this.ghost?.setTint(result.valid ? 0xc9ffd1 : 0xffb3b3);
  }

  finish() {
    if (!this.drag) return false;
    const drag = this.drag;
    const result = this.validate();
    let layoutChanged = false;
    try {
      if (!result.valid) {
        if (!drag.isNew) this.occupancy.addItem(drag.item);
        this.scene.game.events.emit('toast', {
          message: this.friendlyMessage(result.blockingReason, result.message),
          key: `placement-${result.blockingReason}`, priority: 2, cooldown: 1200
        });
        return false;
      }
      if (drag.isNew) {
        const inventory = this.scene.state.inventory[drag.candidate.type] || 0;
        if (inventory > 0) this.scene.state.inventory[drag.candidate.type] = inventory - 1;
        else {
          const price = this.furniture[drag.candidate.type].price || 0;
          if (this.scene.state.coins < price) {
            this.scene.game.events.emit('toast', {message: '金幣不足，尚未購買這件家具', key: 'not-enough-coins', priority: 2});
            return false;
          }
          this.scene.state.coins -= price;
        }
        const item = {...drag.candidate, id: `i-${Date.now().toString(36)}`};
        this.scene.state.items.push(item);
        this.occupancy.addItem(item);
        this.scene.addFurnitureEntity(item);
        this.scene.selectItem(item.id);
      } else {
        Object.assign(drag.item, drag.candidate);
        this.occupancy.addItem(drag.item);
        drag.entity.setGridPosition(drag.item.x, drag.item.y, drag.item.r).setDragVisual('normal');
      }
      layoutChanged = true;
      this.saveAdapter.save();
      this.scene.emitState();
      return true;
    } catch (error) {
      if (!drag.isNew && !this.occupancy.items.has(drag.item.id)) this.occupancy.addItem(drag.item);
      console.error('Furniture drag commit failed', error);
      this.scene.game.events.emit('toast', {message: '家具移動失敗，已回復原位', key: 'placement-error', priority: 3, cooldown: 1200});
      return false;
    } finally {
      this.cleanup({layoutChanged});
    }
  }

  cancel(reason = 'cancel') {
    if (!this.drag) {
      this.armed = null;
      this.inputMode.releaseToStable();
      return;
    }
    const drag = this.drag;
    if (!drag.isNew && !this.occupancy.items.has(drag.item.id)) this.occupancy.addItem(drag.item);
    drag.entity?.setGridPosition(drag.original.x, drag.original.y, drag.original.r).setDragVisual('normal');
    this.cleanup({layoutChanged: false, reason});
  }

  cancelForPinch() { this.cancel('pinch-zoom'); }

  cleanup({layoutChanged = false} = {}) {
    const drag = this.drag;
    drag?.entity?.setDragVisual('normal');
    this.drag = null;
    this.armed = null;
    this.ghost?.destroy();
    this.ghost = null;
    this.scene.placementGraphics.clear();
    if (layoutChanged) this.catBehaviorController.onFurnitureLayoutChanged();
    this.catBehaviorController.resume('furniture-drag');
    this.cameraController.setEnabled(true);
    this.inputMode.releaseToStable();
  }

  rotateCandidate() {
    if (!this.drag) return false;
    this.drag.candidate.r = ((this.drag.candidate.r || 0) + 1) % 4;
    this.syncGhost();
    this.renderPlacementVisuals();
    return true;
  }

  isDragging() { return Boolean(this.drag); }

  friendlyMessage(reason, fallback) {
    return ({
      'out-of-bounds': '這裡不是可擺放區域',
      'unplaceable-cell': '這裡不是可擺放區域',
      overlap: '這個位置已有其他家具',
      'reserved-entrance': '這個位置是入口保留區',
      'invalid-wall-slot': '這件家具只能放在指定區域',
      'character-occupied': '這裡有貓咪，請換個位置'
    })[reason] || fallback || '這裡不能放置';
  }

  getDebugSnapshot() {
    const item = this.drag?.candidate;
    const cells = item ? this.grid.getFootprintCells(item.type, item.x, item.y, item.r || 0) : [];
    const failedCell = cells.find(cell => !this.grid.isInsideGrid(cell.x, cell.y) || !this.grid.isPlaceableCell(cell.x, cell.y) || this.occupancy.getOccupant(cell.x, cell.y));
    return {
      selectedItemId: this.scene.selectedId,
      movingItemId: this.drag?.movingItemId || null,
      furnitureType: item?.type || null,
      originalGrid: this.drag?.original ? {x: this.drag.original.x, y: this.drag.original.y} : null,
      candidateGrid: item ? {x: item.x, y: item.y} : null,
      rotation: item?.r || 0,
      footprintCells: cells,
      pointer: this.lastPointer,
      blockingReason: this.lastValidation?.blockingReason || null,
      failedCell: failedCell || null,
      placeableMask: failedCell && this.grid.isInsideGrid(failedCell.x, failedCell.y) ? this.grid.room.floor.placeableMask[failedCell.y][failedCell.x] : null,
      occupancyOwner: failedCell ? this.occupancy.getOccupant(failedCell.x, failedCell.y) : null
    };
  }

  update() {}

  destroy() {
    this.cancel('scene-shutdown');
    const input = this.scene.input;
    input.off('dragstart', this.handleDragStart);
    input.off('drag', this.handleDrag);
    input.off('dragend', this.handleDragEnd);
    input.off('pointerdown', this.handlePointerDown);
    input.off('pointermove', this.handlePointerMove);
    input.off('pointerup', this.handlePointerUp);
    input.off('pointerupoutside', this.handlePointerUp);
    input.off('gameout', this.handleGameOut);
    this.scene.game.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    window.removeEventListener('blur', this.handleWindowBlur);
  }
}
