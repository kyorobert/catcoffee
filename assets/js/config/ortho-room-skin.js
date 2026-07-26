// Orthogonal room visual skin (ARCH-0575C).
//
// This module owns presentation tokens only. It never changes the logical grid,
// placeableMask, occupancy, placement, pathfinding or save data. In particular:
// - `floor.zoneFill` is used only for cells that GridSystem reports as placeable.
// - `floor.reserved` is used for logical cells that exist but are not placeable.
// - `shell` is fixed architecture outside the 10x8 grid. It must not read as floor.
//
// Keeping these tokens out of OrthogonalProjection lets future room themes swap
// colour, trim, door and decoration anchors without creating another projection.
const deepFreeze = value => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

export const DEFAULT_ORTHOGONAL_ROOM_SKIN = deepFreeze({
  id: 'warm-cafe-foundation',
  displayName: 'Warm Cafe Foundation',

  layout: {
    wallHeight: 260,
    coreTopStrip: 220,
    bottomPad: 24
  },

  backdrop: {
    fill: 0xbfa079
  },

  wall: {
    upperFill: 0xd99378,
    upperAccent: 0xa85f55,
    topLineWidth: 6,
    lower: {
      heightFactor: 0.4,
      fill: 0xc47f5f,
      molding: 0xecd2a6,
      moldingWidth: 5,
      panelLine: 0xa96351,
      panelWidth: 116
    }
  },

  floor: {
    // Real placeable cells remain light and readable. These tints are visual only.
    zoneFill: {
      work: 0xd8b184,
      counter: 0xceac78,
      service: 0xf6dca8,
      seating: 0xe9c08d,
      cat: 0xedc2a0,
      aisle: 0xe9c79a,
      outer: 0xe7c295
    },
    cellLine: 0xc48a62,
    cellLineAlpha: 0.22,
    parityLighten: 0.04,
    parityDarken: -0.06,
    playableBoundary: {
      width: 3,
      color: 0x76513f,
      alpha: 0.72,
      innerWidth: 1,
      innerColor: 0xf6ddb6,
      innerAlpha: 0.72
    },
    // Cells inside the formal top entrance zone get a shallow threshold treatment
    // instead of becoming dark, full-cell floor blocks.
    reserved: {
      role: 'entrance-threshold',
      fill: 0xe1bb8d,
      insetFill: 0xc99567,
      line: 0x76513f,
      alpha: 1,
      bandDepth: 16,
      bandInset: 4
    }
  },

  // Fixed architectural edging outside the grid. Left/right/bottom are deliberately
  // narrow: at the supported portrait fit zooms these tokens render at roughly 8–16
  // CSS px. The top extension remains large enough for the complete Room Skin wall.
  shell: {
    role: 'fixed-architecture',
    material: 'narrow-wood-trim',
    sideThicknessWorld: 24,
    topExtensionWorld: 120,
    bottomThicknessWorld: 26,
    fill: 0x8c674f,
    insetFill: 0xa77b5a,
    panelLine: 0x72503f,
    panelLineAlpha: 0.55,
    panelInset: 5,
    panelStep: 18,
    trimColor: 0x5f4437,
    trimThickness: 4,
    highlightColor: 0xd5ae7e,
    edgeHighlight: 1
  },

  door: {
    // Visual geometry is separate from logical entrance semantics.
    gridBounds: {x: 6.8, y: 0, w: 1.4, h: 1},
    height: 124,
    frame: 0x68452f,
    casing: 0x8b5d3d,
    leaf: 0xcaa068,
    glass: 0xbcd6d2,
    glassEdge: 0x789d99,
    handle: 0xd8b24a,
    panel: 0x9c774c,
    matFill: 0x7d5a46,
    framePad: 5,
    glassPad: 8,
    glassHeightFactor: 0.42,
    lintelHeight: 15,
    lintelExtension: 10,
    cafeSign: {
      fill: 0xf1d49b,
      accent: 0x8d5b3b,
      height: 18,
      widthFactor: 0.72,
      lineCount: 2
    }
  },

  decorAnchors: [
    {id: 'window', texture: 'environment:wall-window', fx: 0.24, heightFactor: 0.28, scale: 0.9},
    {id: 'menu-board', texture: 'environment:menu-board', fx: 0.52, heightFactor: 0.28, scale: 0.86}
  ]
});

export const ORTHOGONAL_ROOM_SKINS = deepFreeze({
  default: DEFAULT_ORTHOGONAL_ROOM_SKIN,
  'warm-cafe-foundation': DEFAULT_ORTHOGONAL_ROOM_SKIN
});

export function getOrthogonalRoomSkin(id = 'default') {
  return ORTHOGONAL_ROOM_SKINS[id] || DEFAULT_ORTHOGONAL_ROOM_SKIN;
}

// One shared appearance decision for room drawing and Node tests. The Scene supplies
// `placeable` from GridSystem, so the visual boundary can never invent its own mask.
export function getOrthogonalCellAppearance({
  placeable,
  zoneKey = 'outer',
  parity = 0,
  skin = DEFAULT_ORTHOGONAL_ROOM_SKIN
}) {
  if (!placeable) {
    return Object.freeze({
      kind: 'reserved',
      fill: skin.floor.reserved.fill,
      line: skin.floor.reserved.line,
      alpha: skin.floor.reserved.alpha,
      shadeFactor: 0
    });
  }
  return Object.freeze({
    kind: 'playable',
    fill: skin.floor.zoneFill[zoneKey] ?? skin.floor.zoneFill.outer,
    line: skin.floor.cellLine,
    alpha: 1,
    shadeFactor: parity ? skin.floor.parityDarken : skin.floor.parityLighten
  });
}
