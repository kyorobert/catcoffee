import {findPath} from '../core/grid-pathfinder.js?v=0551a';
import {
  CAT_STATE, createCatBehaviorState, shouldLeaveIdle, chooseCatTarget,
  beginWalking, finishPath, pauseBehavior, resumeBehavior, markLayoutChanged, randomDelay
} from '../core/cat-behavior-core.js?v=0551a';

const key = (x, y) => `${x},${y}`;

export class CatBehaviorController {
  constructor(scene, {grid, occupancy, entities, profiles, saveAdapter, random = Math.random} = {}) {
    this.scene = scene;
    this.grid = grid;
    this.occupancy = occupancy;
    this.entities = entities;
    this.profiles = new Map(profiles.map(profile => [profile.id, profile]));
    this.saveAdapter = saveAdapter;
    this.random = random;
    this.behaviors = new Map();
    this.pausedReasons = new Set();
    this.pausedCats = new Map();
    this.lastPositionSaveAt = -Infinity;
    this.allCells = [];
    for (let y = 0; y < this.grid.room.floor.rows; y++) {
      for (let x = 0; x < this.grid.room.floor.cols; x++) this.allCells.push({x, y});
    }
    this.initialize();
  }

  initialize() {
    this.scene.state.catPositions ||= {};
    const occupied = this.occupancy.getWalkabilitySnapshot();
    const claimed = new Set();
    for (const [id, entity] of this.entities) {
      const profile = this.profiles.get(id);
      const saved = this.scene.state.catPositions[id];
      const preferred = saved && Number.isInteger(saved.gridX) && Number.isInteger(saved.gridY)
        ? {x: saved.gridX, y: saved.gridY}
        : {x: profile.initialCell.x, y: profile.initialCell.y};
      const start = this.findNearestWalkable(preferred, occupied, claimed);
      claimed.add(key(start.x, start.y));
      const behavior = createCatBehaviorState({id, gridX: start.x, gridY: start.y}, {now: this.scene.time.now, random: this.random});
      this.behaviors.set(id, behavior);
      entity.setPosition(this.grid.getCellCenter(start.x, start.y).x, this.grid.getCellCenter(start.x, start.y).y);
      entity.playIdle();
      this.persistLogicalPosition(id, start.x, start.y, this.scene.time.now, false);
    }
  }

  findNearestWalkable(origin, blocked, claimed = new Set()) {
    const candidates = this.allCells
      .filter(cell => this.isWalkableCell(cell.x, cell.y, blocked) && !claimed.has(key(cell.x, cell.y)))
      .sort((a, b) => (Math.abs(a.x - origin.x) + Math.abs(a.y - origin.y)) - (Math.abs(b.x - origin.x) + Math.abs(b.y - origin.y)));
    return candidates[0] || {x: 0, y: 0};
  }

  isWalkableCell(x, y, blocked = this.occupancy.getWalkabilitySnapshot()) {
    return this.grid.isInsideGrid(x, y) && this.grid.isPlaceableCell(x, y) && !blocked.has(key(x, y));
  }

  update(time, delta) {
    if (this.pausedReasons.size) return;
    const blocked = this.occupancy.getWalkabilitySnapshot();
    for (const [id, entity] of this.entities) {
      let behavior = this.behaviors.get(id);
      if (!behavior) continue;
      entity.updateVisual?.(time, delta);
      if (this.pausedCats.get(id)?.size) continue;
      if (behavior.needsRepath) behavior = this.repathBehavior(behavior, blocked, time);
      if (behavior.state === CAT_STATE.WALKING) behavior = this.advanceWalking(entity, behavior, blocked, time, delta);
      else if (shouldLeaveIdle(behavior, time)) behavior = this.chooseNextAction(entity, behavior, blocked, time);
      this.behaviors.set(id, behavior);
    }
  }

  chooseNextAction(entity, behavior, blocked, time) {
    const reserved = this.getReservedCatCells(behavior.id);
    const target = chooseCatTarget({
      origin: {x: behavior.gridX, y: behavior.gridY}, candidates: this.allCells,
      isWalkable: (x, y) => this.isWalkableCell(x, y, blocked), reservedCells: reserved, random: this.random
    });
    if (!target) {
      entity.playIdle();
      return {...behavior, state: CAT_STATE.IDLE, nextDecisionAt: time + randomDelay(this.random, 1800, 3500)};
    }
    const path = this.findPathFor(behavior, target, blocked, reserved);
    if (path.length < 2) {
      entity.playIdle();
      return {...behavior, state: CAT_STATE.IDLE, nextDecisionAt: time + randomDelay(this.random, 1800, 3500)};
    }
    const next = beginWalking(behavior, target, path);
    this.applyWalkDirection(entity, next);
    return next;
  }

  findPathFor(behavior, target, blocked, reserved = new Set()) {
    return findPath({
      start: {x: behavior.gridX, y: behavior.gridY}, goal: target,
      cols: this.grid.room.floor.cols, rows: this.grid.room.floor.rows,
      isWalkable: (x, y) => this.isWalkableCell(x, y, blocked) && (!reserved.has(key(x, y)) || (x === target.x && y === target.y))
    });
  }

  repathBehavior(behavior, blocked, time) {
    if (behavior.targetGridX === null || behavior.targetGridY === null) {
      return {...behavior, state: CAT_STATE.IDLE, needsRepath: false, nextDecisionAt: time + randomDelay(this.random, 900, 2200)};
    }
    const target = {x: behavior.targetGridX, y: behavior.targetGridY};
    const reserved = this.getReservedCatCells(behavior.id);
    const path = this.findPathFor(behavior, target, blocked, reserved);
    if (path.length < 2) return {...behavior, state: CAT_STATE.IDLE, targetGridX: null, targetGridY: null, path: [], pathIndex: 0, needsRepath: false, nextDecisionAt: time + randomDelay(this.random, 900, 2200)};
    return beginWalking(behavior, target, path);
  }

  advanceWalking(entity, behavior, blocked, time, delta) {
    const nextCell = behavior.path[behavior.pathIndex];
    if (!nextCell || !this.isWalkableCell(nextCell.x, nextCell.y, blocked)) return this.repathBehavior({...behavior, needsRepath: true}, blocked, time);
    const target = this.grid.getCellCenter(nextCell.x, nextCell.y);
    const position = entity.getWorldPosition?.() || {x: entity.sprite.x, y: entity.sprite.y};
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const distance = Math.hypot(dx, dy);
    const speed = Math.max(35, Math.min(55, this.profiles.get(behavior.id)?.moveSpeed || 48));
    const step = speed * Math.max(0, delta) / 1000;
    if (distance <= Math.max(1.25, step)) {
      entity.setPosition(target.x, target.y);
      const arrived = {...behavior, gridX: nextCell.x, gridY: nextCell.y, pathIndex: behavior.pathIndex + 1, blockedSince: null};
      this.persistLogicalPosition(behavior.id, nextCell.x, nextCell.y, time, true);
      if (arrived.pathIndex >= arrived.path.length) {
        const finished = finishPath(arrived, time, this.random);
        this.applyRestAnimation(entity, finished.state);
        return finished;
      }
      this.applyWalkDirection(entity, arrived);
      return arrived;
    }
    entity.sprite.setFlipX(dx < 0);
    entity.playWalk(dy < 0 ? 'up' : 'down');
    entity.setPosition(position.x + dx / distance * step, position.y + dy / distance * step);
    return behavior;
  }

  applyWalkDirection(entity, behavior) {
    const nextCell = behavior.path[behavior.pathIndex];
    if (!nextCell) return;
    const target = this.grid.getCellCenter(nextCell.x, nextCell.y);
    const position = entity.getWorldPosition?.() || {x: entity.sprite.x, y: entity.sprite.y};
    entity.sprite.setFlipX(target.x < position.x);
    entity.playWalk(target.y < position.y ? 'up' : 'down');
  }

  applyRestAnimation(entity, state) {
    if (state === CAT_STATE.SITTING) entity.playSit();
    else if (state === CAT_STATE.SLEEPING) entity.playSleep();
    else entity.playIdle();
  }

  getReservedCatCells(exceptId = null) {
    const reserved = new Set();
    for (const [id, behavior] of this.behaviors) {
      if (id === exceptId) continue;
      reserved.add(key(behavior.gridX, behavior.gridY));
      if (behavior.targetGridX !== null) reserved.add(key(behavior.targetGridX, behavior.targetGridY));
    }
    return reserved;
  }

  getCharacterCells() {
    const cells = new Set();
    for (const entity of this.entities.values()) {
      const position = entity.getWorldPosition?.() || {x: entity.sprite.x, y: entity.sprite.y};
      const cell = this.grid.snapWorldToGrid(position.x, position.y);
      cells.add(key(cell.x, cell.y));
    }
    return cells;
  }

  isAnyCatInCells(cells) {
    const characterCells = this.getCharacterCells();
    return cells.some(cell => characterCells.has(key(cell.x, cell.y)));
  }

  pause(reason = 'manual') {
    this.pausedReasons.add(reason);
    for (const [id, entity] of this.entities) {
      this.behaviors.set(id, pauseBehavior(this.behaviors.get(id)));
      entity.playIdle();
    }
  }

  resume(reason = 'manual') {
    this.pausedReasons.delete(reason);
    if (this.pausedReasons.size) return;
    for (const [id, entity] of this.entities) {
      const behavior = resumeBehavior(this.behaviors.get(id), this.scene.time.now, this.random);
      this.behaviors.set(id, behavior);
      if (behavior.state === CAT_STATE.WALKING) this.applyWalkDirection(entity, behavior);
      else entity.playIdle();
    }
  }

  pauseCat(catId, reason = 'manual') {
    if (!this.behaviors.has(catId)) return false;
    const reasons = this.pausedCats.get(catId) || new Set();
    reasons.add(reason);
    this.pausedCats.set(catId, reasons);
    this.behaviors.set(catId, pauseBehavior(this.behaviors.get(catId)));
    return true;
  }

  resumeCat(catId, reason = 'manual') {
    const reasons = this.pausedCats.get(catId);
    if (!reasons) return false;
    reasons.delete(reason);
    if (reasons.size) return true;
    this.pausedCats.delete(catId);
    const behavior = resumeBehavior(this.behaviors.get(catId), this.scene.time.now, this.random);
    this.behaviors.set(catId, behavior);
    const entity = this.entities.get(catId);
    if (behavior.state === CAT_STATE.WALKING) this.applyWalkDirection(entity, behavior);
    else entity?.playIdle();
    return true;
  }

  isCatPaused(catId) { return Boolean(this.pausedCats.get(catId)?.size); }

  onFurnitureLayoutChanged() {
    for (const [id, behavior] of this.behaviors) this.behaviors.set(id, markLayoutChanged(behavior));
  }

  persistLogicalPosition(id, gridX, gridY, time, allowSave) {
    this.scene.state.catPositions[id] = {id, gridX, gridY};
    if (allowSave && time - this.lastPositionSaveAt >= 15000) {
      this.lastPositionSaveAt = time;
      this.saveAdapter.save();
    }
  }

  getDebugSnapshot() {
    return {
      paused: this.pausedReasons.size > 0,
      pauseReasons: [...this.pausedReasons],
      pausedCats: Object.fromEntries([...this.pausedCats].map(([id, reasons]) => [id, [...reasons]])),
      reservedCatCells: [...this.getReservedCatCells()],
      cats: [...this.behaviors.values()].map(state => ({...state, pathLength: state.path.length}))
    };
  }

  destroy() {
    this.pausedReasons.clear();
    this.pausedCats.clear();
    this.behaviors.clear();
  }
}
