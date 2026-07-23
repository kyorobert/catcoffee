import {FURNITURE_CONFIG} from '../config/furniture-config.js?v=0552a';
import {FURNITURE_DIRECTIONS,FURNITURE_VISUAL_CONFIG} from '../config/furniture-visual-config.js?v=0552a';
import {CAT_PROFILES, FALLBACK_CAT} from '../config/cat-config.js?v=0552a';
import {hasCompleteCatSheet, registerCatAnimations} from '../systems/CatAnimationSystem.js?v=0552a';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
    this.failures = [];
  }

  preload() {
    const startup = this.registry.get('startupController');
    startup?.setStatus('載入家具與貓咪素材…');
    this.load.on('progress', (value) => {
      startup?.setProgress(value * 0.72);
      this.game.events.emit('boot-progress', value * 0.72);
    });
    this.load.on('fileprogress', (file, value) => {
      this.game.events.emit('boot-file', {key: file.key, url: file.url, type: file.type, progress: value});
    });
    this.load.on('loaderror', (file) => {
      const failure = {
        key: file.key,
        url: file.url || file.src || '',
        type: file.type || 'unknown',
        error: file.error?.message || 'loaderror'
      };
      this.failures.push(failure);
      startup?.setFailedAssets(this.failures);
      this.game.events.emit('boot-load-error', failure);
    });
    this.load.on('complete', (_loader, totalComplete, totalFailed) => {
      this.registry.set('asset-load-summary', {totalComplete, totalFailed});
      this.game.events.emit('boot-progress', 0.74);
    });

    for (const [id, definition] of Object.entries(FURNITURE_CONFIG)) {
      const visual = FURNITURE_VISUAL_CONFIG[id];
      if (visual?.texturePathByDirection) {
        for (const direction of FURNITURE_DIRECTIONS) {
          this.load.image(visual.textureByDirection[direction], visual.texturePathByDirection[direction]);
        }
        continue;
      }
      const key = `furniture:${id}`;
      const path = new URL(definition.texture, location.href).pathname.toLowerCase();
      if (path.endsWith('.svg')) this.load.svg(key, definition.texture);
      else this.load.image(key, definition.texture);
    }

    this.load.spritesheet(FALLBACK_CAT.textureKey, FALLBACK_CAT.spriteSheet, {
      frameWidth: FALLBACK_CAT.frameWidth,
      frameHeight: FALLBACK_CAT.frameHeight
    });
    for (const profile of CAT_PROFILES) {
      this.load.spritesheet(profile.textureKey, profile.spriteSheet, {
        frameWidth: profile.frameWidth,
        frameHeight: profile.frameHeight
      });
    }
    this.load.image('environment:wall-window', './assets/environment/wall-window.png?v=0552a');
    this.load.image('environment:menu-board', './assets/environment/menu-board.png?v=0552a');
  }

  create() {
    const startup = this.registry.get('startupController');
    startup?.setStatus('驗證角色素材…');
    const furnitureFailures = this.ensureFurnitureTextures();
    const catFailures = this.validateCatTextures();
    const combined = [...this.failures, ...furnitureFailures, ...catFailures]
      .filter((entry, index, all) => all.findIndex(other => other.key === entry.key) === index);

    const failedFurnitureEntries = combined.filter(entry => entry.key.startsWith('furniture:'));
    const failedFurnitureIds = new Set(failedFurnitureEntries.map(entry => entry.key.split(':')[1]));
    this.registry.set('furniture-load-report', {
      total: Object.keys(FURNITURE_CONFIG).length,
      totalTextures: new Set(Object.values(FURNITURE_VISUAL_CONFIG).flatMap(visual => Object.values(visual.textureByDirection))).size,
      failed: failedFurnitureEntries,
      fallbackKeys: furnitureFailures.map(entry => entry.key),
      successful: Object.keys(FURNITURE_CONFIG).length - failedFurnitureIds.size
    });
    this.registry.set('cat-load-report', {
      total: CAT_PROFILES.length,
      failed: combined.filter(entry => entry.key.startsWith('cat:')),
      fallbackIds: catFailures.map(entry => entry.key.replace('cat:', '')),
      successful: CAT_PROFILES.length - catFailures.length
    });
    startup?.setFailedAssets(combined);

    if (furnitureFailures.length) {
      console.error('Furniture texture load failures:', furnitureFailures);
      this.game.events.emit('toast', {
        message: '部分家具素材載入失敗，已使用替代圖像',
        key: 'furniture-load-partial', priority: 2, duration: 4200
      });
    }
    if (catFailures.length) {
      console.error('Cat sprite sheet load failures:', catFailures);
      this.game.events.emit('toast', {
        message: '部分貓咪角色素材載入失敗，已使用替代圖像',
        key: 'cat-load-partial', priority: 1, duration: 4200
      });
    }

    registerCatAnimations(this, CAT_PROFILES);
    this.game.events.emit('boot-progress', 0.78);
    this.scene.start('CafeScene');
  }

  ensureFurnitureTextures() {
    const missing = [];
    for (const id of Object.keys(FURNITURE_CONFIG)) {
      const visual = FURNITURE_VISUAL_CONFIG[id];
      const records = visual?.texturePathByDirection
        ? FURNITURE_DIRECTIONS.map(direction => ({key:visual.textureByDirection[direction],url:visual.texturePathByDirection[direction]}))
        : [{key:`furniture:${id}`,url:FURNITURE_CONFIG[id].texture}];
      for (const record of records) {
        if (this.textures.exists(record.key)) continue;
        missing.push({id, ...record, type:'fallback', error:'texture-missing-after-load'});
        this.createFurnitureFallbackTexture(record.key);
      }
    }
    return missing;
  }

  validateCatTextures() {
    if (!hasCompleteCatSheet(this, FALLBACK_CAT.textureKey)) this.createEmergencyCatFallback();
    const failures = [];
    for (const profile of CAT_PROFILES) {
      if (hasCompleteCatSheet(this, profile.textureKey)) continue;
      failures.push({
        key: profile.textureKey,
        url: profile.spriteSheet,
        type: 'spritesheet-fallback',
        error: 'missing-or-invalid-64px-frames'
      });
    }
    return failures;
  }

  createFurnitureFallbackTexture(key) {
    const graphics = this.make.graphics({x: 0, y: 0, add: false});
    graphics.fillStyle(0x9c6951, 1).fillRoundedRect(4, 18, 88, 74, 10);
    graphics.lineStyle(4, 0xffe2b8, 1).strokeRoundedRect(4, 18, 88, 74, 10);
    graphics.lineStyle(5, 0x6f4638, 1).strokeLineShape(new Phaser.Geom.Line(22, 70, 74, 40));
    graphics.strokeLineShape(new Phaser.Geom.Line(22, 40, 74, 70));
    graphics.generateTexture(key, 96, 96);
    graphics.destroy();
  }

  createEmergencyCatFallback() {
    if (this.textures.exists(FALLBACK_CAT.textureKey)) this.textures.remove(FALLBACK_CAT.textureKey);
    const graphics = this.make.graphics({x: 0, y: 0, add: false});
    graphics.fillStyle(0x55453e, 1).fillTriangle(18, 28, 24, 9, 31, 27);
    graphics.fillTriangle(33, 27, 41, 9, 47, 28);
    graphics.fillStyle(0x9a8579, 1).fillCircle(32, 31, 16);
    graphics.fillRoundedRect(22, 39, 20, 20, 8);
    graphics.fillStyle(0x5d8b78, 1).fillCircle(27, 31, 2).fillCircle(37, 31, 2);
    graphics.generateTexture(FALLBACK_CAT.textureKey, 64, 64);
    graphics.destroy();
  }
}
