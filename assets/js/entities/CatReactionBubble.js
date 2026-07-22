export class CatReactionBubble {
  constructor(scene, catEntity, message, {duration = 1500} = {}) {
    this.scene = scene;
    this.catEntity = catEntity;
    this.destroyed = false;
    this.label = scene.add.text(0, 0, message, {
      fontFamily: 'system-ui, sans-serif', fontSize: '12px', fontStyle: '700',
      color: '#513527', backgroundColor: '#fff8e9ee', padding: {x: 7, y: 5},
      stroke: '#fff8e9', strokeThickness: 1
    }).setOrigin(0.5, 1).setDepth(21000).setAlpha(0);
    this.update();
    scene.tweens.add({targets: this.label, alpha: 1, y: this.label.y - 3, duration: 160, ease: 'Back.Out'});
    this.timer = scene.time.delayedCall(duration, () => this.destroy());
  }

  update() {
    if (this.destroyed || !this.catEntity) return;
    const position = this.catEntity.getWorldPosition();
    this.label.setPosition(position.x, position.y - 58);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.timer?.remove(false);
    this.label?.destroy();
    this.catEntity = null;
  }
}
