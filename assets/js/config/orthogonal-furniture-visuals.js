// ART-0577: projection-specific visual metadata for the first orthogonal
// furniture pass. This file owns art selection only. It must never contain or
// override footprints, prices, placement rules, sockets, layers, save fields,
// occupancy, inventory or migration data.

export const ORTHOGONAL_FURNITURE_ASSET_VERSION = '0577b';

export const ORTHOGONAL_CORE_FURNITURE_IDS = Object.freeze([
  'counter',
  'coffeeMachine',
  'oven',
  'washStation',
  'dessert',
  'smartOrder',
  'pinkTableLong',
  'roundTable',
  'chair',
  'creamSofa',
  'doubleCatTree',
  'scratchPost'
]);

export const ORTHOGONAL_FURNITURE_DIRECTIONS = Object.freeze([
  'down-right',
  'down-left',
  'up-right',
  'up-left'
]);

const ZERO_NUDGE_BY_DIRECTION = Object.freeze(Object.fromEntries(
  ORTHOGONAL_FURNITURE_DIRECTIONS.map(direction => [
    direction,
    Object.freeze({x: 0, y: 0})
  ])
));

function createOverride(id) {
  const textureByDirection = Object.fromEntries(
    ORTHOGONAL_FURNITURE_DIRECTIONS.map(direction => [
      direction,
      `furniture:ortho:${id}:${direction}`
    ])
  );
  const texturePathByDirection = Object.fromEntries(
    ORTHOGONAL_FURNITURE_DIRECTIONS.map(direction => [
      direction,
      `./assets/furniture/orthogonal/${id}/${id}-${direction}.png?v=${ORTHOGONAL_FURNITURE_ASSET_VERSION}`
    ])
  );

  return Object.freeze({
    projection: 'ortho',
    visualScale: 1,
    anchor: Object.freeze({x: 0.5, y: 1}),
    // V0577B: rotate artwork around the original placement pivot. Grid and
    // footprint rules still rotate normally; only the rendered bottom-center
    // stays visually stable when a non-square footprint changes orientation.
    calibration: Object.freeze({
      rotationAnchor: 'base-rotation',
      baseRotation: 0,
      perDirectionNudge: ZERO_NUDGE_BY_DIRECTION
    }),
    textureByDirection: Object.freeze(textureByDirection),
    texturePathByDirection: Object.freeze(texturePathByDirection),
    fallbackTexture: textureByDirection['down-right'],
    fallbackDirection: 'down-right',
    authoredDirections: ORTHOGONAL_FURNITURE_DIRECTIONS,
    mirrorAllowed: false,
    sourceFormat: 'png',
    notes: 'ART-0577 original four-view orthogonal PNG override; gameplay metadata remains in the base furniture definition.'
  });
}

export const ORTHOGONAL_FURNITURE_VISUAL_OVERRIDES = Object.freeze(
  Object.fromEntries(
    ORTHOGONAL_CORE_FURNITURE_IDS.map(id => [id, createOverride(id)])
  )
);

export function getOrthogonalFurnitureVisualOverride(id) {
  return ORTHOGONAL_FURNITURE_VISUAL_OVERRIDES[id] || null;
}
