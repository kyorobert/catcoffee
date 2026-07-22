import {DepthSystem} from '../systems/DepthSystem.js?v=0550a1';
import {catAnimationKey, resolveCatTextureKey} from '../systems/CatAnimationSystem.js?v=0550a1';

const LOOPING_STATES = new Set(['idle', 'walk', 'sit', 'sleep']);

export class CatEntity {
  constructor(scene, catData, position, options = {}) {
    this.scene = scene;
    this.catData = catData;
    this.profile = catData;
    this.onSelect = options.onSelect || null;
    this.direction = 'down';
    this.state = 'idle';
    this.currentAnimation = null;
    this.moveTween = null;
    this.selected = false;
    this.duty = Boolean(options.duty);
    this.destroyed = false;
    this.worldX = position.x;
    this.worldY = position.y;
    this.visualOffsetY = 0;
    this.motionClock = Math.random() * 1000;

    const textureKey = resolveCatTextureKey(scene, catData);
    this.shadow = scene.add.ellipse(position.x, position.y - 1, 30, 10, 0x392820, 0.24).setOrigin(0.5);
    this.selectionRing = scene.add.ellipse(position.x, position.y - 2, 38, 15, 0xf8d978, 0.12)
      .setStrokeStyle(2, 0xffdc74, 0.95).setVisible(false);
    this.sprite = scene.add.sprite(position.x, position.y, textureKey, 0)
      .setOrigin(0.5, 1)
      .setScale(catData.scale || 1)
      .setInteractive({useHandCursor: true, pixelPerfect: false});
    this.nameLabel = scene.add.text(position.x, position.y - 61, catData.name || '貓咪', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', fontStyle: '700',
      color: '#4b3025', backgroundColor: '#fff4dfd9', padding: {x: 4, y: 2}
    }).setOrigin(0.5, 1).setVisible(false);
    this.statusLabel = scene.add.text(position.x + 20, position.y - 49, '值班', {
      fontFamily: 'system-ui, sans-serif', fontSize: '10px', fontStyle: '700', color: '#72b66d',
      stroke: '#fff4df', strokeThickness: 2
    }).setOrigin(0.5).setVisible(this.duty);

    this.handlePointerDown = pointer => {
      pointer.event?.stopPropagation?.();
      this.onSelect?.(this.catData.id, this);
    };
    this.sprite.on('pointerdown', this.handlePointerDown);
    this.setPosition(position.x, position.y);
    this.playIdle();
  }

  setState(nextState, direction = this.direction) {
    if (this.destroyed) return;
    const normalizedState = ['idle', 'walk', 'sit', 'sleep', 'happy', 'serve'].includes(nextState) ? nextState : 'idle';
    const normalizedDirection = direction === 'up' ? 'up' : 'down';
    const key = catAnimationKey(this.catData.id, normalizedState, normalizedDirection);
    const fallbackKey = catAnimationKey(this.catData.id, 'idle', normalizedDirection);
    const playableKey = this.scene.anims.exists(key) ? key : fallbackKey;
    this.direction = normalizedDirection;
    this.state = normalizedState;
    if (this.currentAnimation === playableKey && this.sprite.anims.isPlaying) return;
    this.currentAnimation = playableKey;
    this.sprite.play(playableKey, true);
    if (!LOOPING_STATES.has(normalizedState)) {
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!this.destroyed && this.state === normalizedState) this.playIdle();
      });
    }
  }

  playIdle(direction = this.direction) { this.setState('idle', direction); }
  playWalk(direction = this.direction) { this.setState('walk', direction); }
  playSit(direction = this.direction) { this.setState('sit', direction); }
  playSleep(direction = this.direction) { this.setState('sleep', direction); }
  playHappy(direction = this.direction) { this.setState('happy', direction); }
  playServe(direction = this.direction) { this.setState('serve', direction); }

  // Legacy scripted moves can opt into continuation so intermediate nodes do
  // not flash idle.  Autonomous BFS motion uses setPosition directly.
  moveTo(worldX, worldY, onComplete = null, {continuation = false} = {}) {
    if (this.destroyed) return;
    this.moveTween?.stop();
    const start = this.getWorldPosition();
    const dx = worldX - start.x;
    const dy = worldY - start.y;
    this.sprite.setFlipX(dx < 0);
    this.playWalk(dy < 0 ? 'up' : 'down');
    const distance = Math.hypot(dx, dy);
    const duration = Math.max(160, distance / Math.max(1, this.profile.moveSpeed || 52) * 1000);
    this.moveTween = this.scene.tweens.addCounter({
      from: 0, to: 1, duration, ease: 'Linear',
      onUpdate: tween => {
        const progress = tween.getValue();
        this.setPosition(start.x + dx * progress, start.y + dy * progress);
      },
      onComplete: () => {
        this.moveTween = null;
        this.setPosition(worldX, worldY);
        if (!continuation) this.playIdle();
        onComplete?.();
      }
    });
  }

  getWorldPosition() { return {x: this.worldX, y: this.worldY}; }

  setPosition(worldX, worldY) {
    this.worldX = worldX;
    this.worldY = worldY;
    this.applyVisualPositions();
    this.updateDepth();
  }

  updateVisual(time, delta = 0) {
    if (this.destroyed) return;
    this.motionClock += Math.max(0, delta);
    if (this.state === 'walk') {
      const stepPhase = this.motionClock / 105;
      this.visualOffsetY = Math.sin(stepPhase * Math.PI) * 1.35 - 0.35;
      const shadowPulse = 1 - Math.abs(Math.sin(stepPhase * Math.PI)) * 0.055;
      this.shadow.setScale(shadowPulse, 1 - (1 - shadowPulse) * 0.5);
    } else if (this.state === 'idle') {
      this.visualOffsetY = Math.sin((time + this.motionClock * 0.08) / 720) * 0.28;
      this.shadow.setScale(1, 1);
    } else {
      this.visualOffsetY = 0;
      this.shadow.setScale(1, 1);
    }
    this.applyVisualPositions();
  }

  applyVisualPositions() {
    this.sprite.setPosition(this.worldX, this.worldY + this.visualOffsetY);
    this.shadow.setPosition(this.worldX, this.worldY - 1);
    this.selectionRing.setPosition(this.worldX, this.worldY - 2);
    this.nameLabel.setPosition(this.worldX, this.worldY - 61);
    this.statusLabel.setPosition(this.worldX + 20, this.worldY - 49);
  }

  update(time = this.scene.time.now, delta = 0) {
    if (!this.destroyed) {
      this.updateVisual(time, delta);
      this.updateDepth();
    }
  }

  updateDepth() {
    const depth = DepthSystem.for('character', this.worldY);
    this.shadow.setDepth(depth - 2);
    this.selectionRing.setDepth(depth - 1);
    this.sprite.setDepth(depth);
    this.nameLabel.setDepth(depth + 1);
    this.statusLabel.setDepth(depth + 1);
  }

  setSelected(selected) {
    this.selected = Boolean(selected);
    this.selectionRing.setVisible(this.selected);
    this.nameLabel.setVisible(this.selected);
  }

  setDuty(duty) {
    this.duty = Boolean(duty);
    this.statusLabel.setVisible(this.duty);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.moveTween?.stop();
    this.sprite.off('pointerdown', this.handlePointerDown);
    this.sprite.destroy();
    this.shadow.destroy();
    this.selectionRing.destroy();
    this.nameLabel.destroy();
    this.statusLabel.destroy();
  }
}
