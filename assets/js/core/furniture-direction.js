export const FURNITURE_DIRECTION = Object.freeze({
  DOWN_RIGHT:'down-right',
  DOWN_LEFT:'down-left',
  UP_RIGHT:'up-right',
  UP_LEFT:'up-left'
});

const ROTATION_DIRECTIONS = Object.freeze([
  FURNITURE_DIRECTION.DOWN_RIGHT,
  FURNITURE_DIRECTION.DOWN_LEFT,
  FURNITURE_DIRECTION.UP_RIGHT,
  FURNITURE_DIRECTION.UP_LEFT
]);

const MIRROR_SOURCE = Object.freeze({
  'down-left':'down-right',
  'up-left':'up-right'
});

export function rotationToDirection(rotation=0) {
  const number=Number(rotation);
  const normalized=Number.isFinite(number) ? ((Math.trunc(number)%4)+4)%4 : 0;
  return ROTATION_DIRECTIONS[normalized];
}

export function resolveFurnitureDirection(visual, direction) {
  const requested=ROTATION_DIRECTIONS.includes(direction) ? direction : FURNITURE_DIRECTION.DOWN_RIGHT;
  const textures=visual?.textureByDirection || {};
  const authored=new Set(visual?.authoredDirections || Object.keys(textures));
  if (authored.has(requested) && textures[requested]) {
    return {texture:textures[requested],flipX:false,requestedDirection:requested,resolvedDirection:requested,missingDirection:false,usedFallback:false};
  }
  const mirrorSource=MIRROR_SOURCE[requested];
  if (visual?.mirrorAllowed && mirrorSource && authored.has(mirrorSource) && textures[mirrorSource]) {
    return {texture:textures[mirrorSource],flipX:true,requestedDirection:requested,resolvedDirection:mirrorSource,missingDirection:true,usedFallback:true};
  }
  const fallbackDirection=visual?.fallbackDirection || FURNITURE_DIRECTION.DOWN_RIGHT;
  const fallback=visual?.fallbackTexture || textures[fallbackDirection] || Object.values(textures).find(Boolean) || null;
  return {texture:fallback,flipX:false,requestedDirection:requested,resolvedDirection:fallbackDirection,missingDirection:!authored.has(requested),usedFallback:true};
}

export function resolveDirectionalTexture(visual, direction) {
  return resolveFurnitureDirection(visual,direction).texture;
}

