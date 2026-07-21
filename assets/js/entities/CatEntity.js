import {DepthSystem} from '../systems/DepthSystem.js?v=0541a';
import {catAnimationKey, resolveCatTextureKey} from '../systems/CatAnimationSystem.js?v=0541a';

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

    const textureKey = resolveCatTextureKey(scene, catData);
    this.shadow = scene.add.ellipse(position.x, position.y - 1, 30, 10, 0x392820, 0.24)
      .setOrigin(0.5, 0.5);
    this.selectionRing = scene.add.ellipse(position.x, position.y - 2, 38, 15, 0xf8d978, 0.12)
      .setStrokeStyle(2, 0xffdc74, 0.95)
      .setVisible(false);
    this.sprite = scene.add.sprite(position.x, position.y, textureKey, 0)
      .setOrigin(0.5, 1)
      .setScale(catData.scale || 1)
      .setInteractive({useHandCursor: true, pixelPerfect: false});
    this.nameLabel = scene.add.text(position.x, position.y - 61, catData.name || '貓咪', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', fontStyle: '700',
      color: '#4b3025', backgroundColor: '#fff4dfd9', padding: {x: 4, y: 2}
    }).setOrigin(0.5, 1).setVisible(false);
    this.statusLabel = scene.add.text(position.x + 20, position.y - 49, '●', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#72b66d',
      stroke: '#fff4df', strokeThickness: 2
    }).setOrigin(0.5).setVisible(this.duty);

    this.handlePointerDown = (pointer) => {
      pointer.event?.stopPropagation?.();
      this.onSelect?.(this.catData.id, this);
    };
    this.sprite.on('pointerdown', this.handlePointerDown);
    this.setPosition(position.x, position.y);
    this.playIdle();
  }

  setState(nextState, direction = this.direction) {
    if (this.destroyed) return;
    const normalizedState = ['idle', 'walk', 'sit', 'sleep', 'happy', 'serve'].includes(nextState)
      ? nextState : 'idle';
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

  moveTo(worldX, worldY, onComplete = null) {
    if (this.destroyed) return;
    this.moveTween?.stop();
    const dx = worldX - this.sprite.x;
    const dy = worldY - this.sprite.y;
    const facingUp = dy < 0;
    this.sprite.setFlipX(dx < 0);
    this.playWalk(facingUp ? 'up' : 'down');
    const distance = Math.hypot(dx, dy);
    const duration = Math.max(160, distance / Math.max(1, this.profile.moveSpeed || 52) * 1000);
    const targets = [this.sprite, this.shadow, this.selectionRing, this.nameLabel, this.statusLabel];
    const startX = this.sprite.x;
    const startY = this.sprite.y;
    const offsets = targets.map(object => ({object, x: object.x - startX, y: object.y - startY}));
    this.moveTween = this.scene.tweens.addCounter({
      from: 0, to: 1, duration, ease: 'Linear',
      onUpdate: (tween) => {
        const progress = tween.getValue();
        for (const entry of offsets) {
          entry.object.setPosition(
            startX + entry.x + dx * progress,
            startY + entry.y + dy * progress
          );
        }
        this.updateDepth();
      },
      onComplete: () => {
        this.moveTween = null;
        this.setPosition(worldX, worldY);
        this.playIdle();
        onComplete?.();
      }
    });
  }

  setPosition(worldX, worldY) {
    this.sprite.setPosition(worldX, worldY);
    this.shadow.setPosition(worldX, worldY - 1);
    this.selectionRing.setPosition(worldX, worldY - 2);
    this.nameLabel.setPosition(worldX, worldY - 61);
    this.statusLabel.setPosition(worldX + 20, worldY - 49);
    this.updateDepth();
  }

  update() {
    if (!this.destroyed) this.updateDepth();
  }

  updateDepth() {
    const depth = DepthSystem.for('character', this.sprite.y);
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
