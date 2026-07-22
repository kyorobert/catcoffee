export class WallDecorationEntity {
  constructor(scene, {texture, x, y, scale = 1, depth = -940}) {
    this.image = scene.add.image(x, y, texture)
      .setOrigin(0.5, 0.5)
      .setScale(scale)
      .setDepth(depth);
  }

  destroy() { this.image?.destroy(); }
}
