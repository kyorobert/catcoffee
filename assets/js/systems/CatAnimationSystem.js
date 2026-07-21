import {CAT_ANIMATION_LAYOUT, FALLBACK_CAT} from '../config/cat-config.js?v=0541a';

const DIRECTIONS = Object.freeze(['down', 'up']);
const FRAMES_PER_DIRECTION = 4;
const FRAMES_PER_ROW = 8;

export function catAnimationKey(catId, state, direction = 'down') {
  return `cat:${catId}:${state}-${direction}`;
}

export function resolveCatTextureKey(scene, profile) {
  return hasCompleteCatSheet(scene, profile.textureKey) ? profile.textureKey : FALLBACK_CAT.textureKey;
}

export function registerCatAnimations(scene, profiles) {
  for (const profile of profiles) {
    const textureKey = resolveCatTextureKey(scene, profile);
    for (const [state, layout] of Object.entries(CAT_ANIMATION_LAYOUT)) {
      for (const direction of DIRECTIONS) {
        const key = catAnimationKey(profile.id, state, direction);
        if (scene.anims.exists(key)) continue;
        const directionOffset = direction === 'up' ? FRAMES_PER_DIRECTION : 0;
        const start = layout.row * FRAMES_PER_ROW + directionOffset;
        const complete = hasCompleteCatSheet(scene, textureKey);
        scene.anims.create({
          key,
          frames: complete
            ? scene.anims.generateFrameNumbers(textureKey, {start, end: start + FRAMES_PER_DIRECTION - 1})
            : [{key: textureKey, frame: 0}],
          frameRate: layout.frameRate,
          repeat: layout.repeat,
          skipMissedFrames: true
        });
      }
    }
  }
}

export function hasCompleteCatSheet(scene, textureKey) {
  const texture = scene.textures.get(textureKey);
  return Boolean(texture?.key !== '__MISSING' && texture.frameTotal >= 49);
}
