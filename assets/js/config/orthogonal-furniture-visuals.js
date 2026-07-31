// ART-0577: projection-specific visual metadata for the first orthogonal
// furniture pass. This file owns art selection only. It must never contain or
// override footprints, prices, placement rules, sockets, layers, save fields,
// occupancy, inventory or migration data.

export const ORTHOGONAL_FURNITURE_ASSET_VERSION = '0577n';

export const ORTHOGONAL_FIRST_BATCH_FURNITURE_IDS = Object.freeze([
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

// ART-0577K adds one independently purchasable approved product without
// reclassifying or mutating the original twelve-item first batch.
export const ORTHOGONAL_CORE_FURNITURE_IDS = Object.freeze([
  ...ORTHOGONAL_FIRST_BATCH_FURNITURE_IDS,
  'pinkTableLongHardCafe'
]);

export const ORTHOGONAL_FURNITURE_DIRECTIONS = Object.freeze([
  'down-right',
  'down-left',
  'up-right',
  'up-left'
]);

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
    // ARCH-0577L1 reserves a centralized visual-placement contract without
    // changing any approved 0577k PNG. Null means exact native display parity.
    visualPlacement: null,
    // V0577C: the fixed base-rotation pivot from V0577B is retired. The single
    // orthogonal-furniture-rotation resolver now anchors the sprite on the same
    // actual-rotation footprint the Occupancy/Placement box uses, so a
    // non-square 90-degree turn moves the artwork honestly instead of pinning
    // it. No per-direction visual nudge or calibration override remains here.
    calibration: null,
    textureByDirection: Object.freeze(textureByDirection),
    texturePathByDirection: Object.freeze(texturePathByDirection),
    fallbackTexture: textureByDirection['down-right'],
    fallbackDirection: 'down-right',
    authoredDirections: ORTHOGONAL_FURNITURE_DIRECTIONS,
    mirrorAllowed: false,
    sourceFormat: 'png',
    notes: [
      'ART-0577 projection-specific orthogonal PNG override.',
      'ART-0577K integrates the approved SoftCute table, independent HardCafe',
      'table, chair, counter and dessert formal art. Gameplay metadata remains',
      'owned by the base furniture definition.'
    ].join(' ')
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
