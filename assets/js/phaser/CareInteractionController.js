import {
  createCareSession, prepareCareSession, commitCareSession, cancelCareSession
} from '../core/care-interaction-core.js?v=0551a';
import {INPUT_MODE} from '../core/input-state.js?v=0551a';
import {CatReactionBubble} from '../entities/CatReactionBubble.js?v=0551a';

export class CareInteractionController {
  constructor(scene, {inputMode, cameraController, catBehaviorController, furnitureDragController, saveAdapter, profiles}) {
    this.scene = scene;
    this.inputMode = inputMode;
    this.cameraController = cameraController;
    this.catBehaviorController = catBehaviorController;
    this.furnitureDragController = furnitureDragController;
    this.saveAdapter = saveAdapter;
    this.profiles = new Map(profiles.map(profile => [profile.id, profile]));
    this.session = null;
    this.timer = null;
    this.bubble = null;
    this.destroyed = false;
    this.onWindowBlur = () => this.cancel('window-blur');
    this.onVisibility = () => { if (document.visibilityState === 'hidden') this.cancel('page-hidden'); };
    this.onPointerCancel = () => this.cancel('pointercancel');
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.scene.game.canvas?.addEventListener('pointercancel', this.onPointerCancel, {passive: true});
  }

  isActive() { return Boolean(this.session?.active); }

  start(catId, mode) {
    if (this.isActive()) return {started: false, reason: 'session-active'};
    if (this.furnitureDragController?.isDragging()) return this.fail('furniture-drag', '請先完成家具放置');
    const profile = this.profiles.get(catId);
    const sessionId = `care-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const prepared = prepareCareSession(
      createCareSession({sessionId, catId, mode, startedAt: Date.now()}),
      this.scene.state,
      profile,
      Math.random()
    );
    if (!prepared.validation.valid) return this.fail(prepared.validation.reason, prepared.validation.message, {catId, mode});

    this.session = {...prepared.session, active: true};
    this.inputMode.setMode(INPUT_MODE.CARE_INTERACTION, {catId, mode, sessionId});
    this.cameraController.setEnabled(false);
    this.catBehaviorController.pauseCat(catId, 'care-interaction');
    const entity = this.scene.catEntities.get(catId);
    if (this.session.result.action.animation === 'serve') entity?.playServe();
    else entity?.playHappy();
    this.bubble = new CatReactionBubble(this.scene, entity, this.session.result.reaction, {duration: 1650});
    const payload = this.toPayload();
    this.scene.game.events.emit('care-session-started', payload);
    this.scene.game.events.emit('cat-reaction', {catId, message: payload.result.reaction, sessionId});
    this.timer = this.scene.time.delayedCall(this.session.result.action.duration, () => this.complete());
    return {started: true, session: payload};
  }

  complete() {
    if (!this.isActive() || this.session.phase !== 'perform' || this.session.committed) return false;
    const committed = commitCareSession(this.session, this.scene.state, Date.now());
    if (!committed.applied) return false;
    this.session = {...committed.session, active: true};
    this.scene.state = committed.state;
    this.saveAdapter.state = committed.state;
    this.saveAdapter.save();
    this.scene.emitState();
    this.scene.catEntities.get(this.session.catId)?.playHappy();
    this.scene.game.events.emit('care-session-completed', this.toPayload());
    return true;
  }

  finish() {
    if (!this.session?.committed) return false;
    const payload = this.toPayload();
    this.cleanup('finished');
    this.scene.game.events.emit('care-session-finished', payload);
    return true;
  }

  cancel(reason = 'cancelled') {
    if (!this.isActive()) return false;
    if (this.session.committed) return this.finish();
    this.session = cancelCareSession(this.session, reason);
    const payload = this.toPayload();
    this.cleanup(reason);
    this.scene.game.events.emit('care-session-cancelled', payload);
    return true;
  }

  fail(reason, message, details = {}) {
    const payload = {reason, message, ...details};
    this.scene.game.events.emit('care-session-failed', payload);
    this.scene.game.events.emit('toast', {message, key: `care-${reason}`, priority: 2, cooldown: 1200});
    return {started: false, reason, message};
  }

  toPayload() {
    if (!this.session) return null;
    const {sessionId, catId, mode, phase, startedAt, completedAt, committed, result} = this.session;
    return {sessionId, catId, mode, phase, startedAt, completedAt, committed, result: result ? JSON.parse(JSON.stringify(result)) : null};
  }

  cleanup(reason) {
    const catId = this.session?.catId;
    this.timer?.remove(false);
    this.timer = null;
    this.bubble?.destroy();
    this.bubble = null;
    if (catId) this.catBehaviorController.resumeCat(catId, 'care-interaction');
    this.cameraController.setEnabled(true);
    this.inputMode.releaseToStable();
    if (this.session) this.session = {...this.session, active: false, cleanupReason: reason};
  }

  update() { this.bubble?.update(); }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancel('scene-shutdown');
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.scene.game.canvas?.removeEventListener('pointercancel', this.onPointerCancel);
  }
}
