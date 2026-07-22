export class AmbientEffects {
  constructor(scene, {top, floor}) {
    this.scene = scene;
    this.objects = [];
    this.tweens = [];
    this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    this.createWindowGlow(top, floor);
    if (!this.reducedMotion) this.createDust(top);
  }

  createWindowGlow(top, floor) {
    const graphics = this.scene.add.graphics().setDepth(-930);
    graphics.fillStyle(0xffe5a6, 0.075);
    graphics.fillPoints([
      {x: top.x - 205, y: top.y - 95}, {x: top.x - 92, y: top.y - 56},
      {x: floor.originX - 20, y: floor.originY + 330}, {x: floor.originX - 280, y: floor.originY + 220}
    ], true);
    this.objects.push(graphics);
  }

  createDust(top) {
    for (let index = 0; index < 7; index++) {
      const mote = this.scene.add.circle(top.x - 175 + index * 34, top.y + 65 + (index % 3) * 38, 1.2, 0xffe5b5, 0.28)
        .setDepth(-925);
      this.objects.push(mote);
      this.tweens.push(this.scene.tweens.add({
        targets: mote, y: mote.y - 18, x: mote.x + (index % 2 ? 8 : -8), alpha: {from: 0.08, to: 0.32},
        duration: 3600 + index * 270, delay: index * 310, yoyo: true, repeat: -1, ease: 'Sine.InOut'
      }));
    }
  }

  destroy() {
    this.tweens.forEach(tween => tween.stop());
    this.objects.forEach(object => object.destroy());
    this.tweens.length = 0;
    this.objects.length = 0;
  }
}
