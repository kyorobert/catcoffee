// OrthogonalProjection is a true axis-aligned ("正交平面") screen projection. It
// shares the same interface as IsoProjection / FlatProjection so GridSystem can swap
// it in behind the Facade without changing any logical grid data. It reads
// SpatialGrid's logical results and the shared roomConfig/furnitureConfig, never
// mutates them, and stores no furniture, occupancy, placement or character state.
//
// Model: an invertible 2D basis, world = origin + gridX*axisX + gridY*axisY, with
//   axisX = {cellWidth, 0}   -> X moves ONLY left/right (columns are perfectly vertical)
//   axisY = {0, cellHeight}  -> Y moves ONLY up/down   (rows are perfectly horizontal)
// axisX.y and axisY.x are exactly 0: there is NO skew, NO shear, NO rotation and NO
// perspective scaling. Every cell is an upright rectangle, so the room reads as a
// flat, front-facing space that is legible on a portrait phone. This deliberately
// replaces the rejected 2:1 iso diamond and the rejected shallow-oblique Flat presets
// (see docs/decisions.md DEC-017); iso/flat remain available for regression only.
//
// cellWidth / cellHeight are the single source of truth for cell size (chosen for a
// 10x8 room, portrait readability and the existing 1560x1120 world bounds — see
// docs/V0570_ORTHOGONAL_ROOM_RESULT.md). The origin is DERIVED from the room so the
// logical floor centroid lands on the world centre; no per-viewport screen
// coordinates live here. ORTHOGONAL_ROOM_RENDER holds render-only framing metadata
// consumed by CafeScene.drawRoomOrtho (it changes no logical data).
export const ORTHOGONAL_PROJECTION_PARAMS = Object.freeze({
  id: 'ortho',
  displayName: '正交平面',
  // ARCH-0572: portrait full-bleed. Narrower + much taller cells so the 10x8 room fills
  // far more of a tall phone screen (fit-to-width stays width-constrained, so the taller
  // cells add on-screen height without shrinking the room), while columns stay exactly
  // vertical and rows exactly horizontal.
  axisX: Object.freeze({x: 88, y: 0}),    // +1 gridX -> right 88px, no vertical drift
  axisY: Object.freeze({x: 0, y: 120})    // +1 gridY -> down 120px, no horizontal drift
});

// Render-only framing metadata for CafeScene.drawRoomOrtho. `wallHeight` is the back wall
// standing above the floor (a service backdrop + entry door). ARCH-0573 separates two framing
// rectangles: the whole ROOM (floor + full wall, used for the Camera pan/zoom-out range) versus
// the first-screen CORE (gameplay columns + only a `coreTopStrip` of wall). ARCH-0574 SHORTENS
// the wall so the top reads as a tidy service backdrop rather than a big empty band, and adds
// `zoneFloor` tints so the business areas (counter / work side / service front / seating / cats
// / aisle) read at a glance. `doorHeight` is a shorter door that sits on the lower wall so it fits inside
// the core strip; the door CELLS come from ortho-room-zones (`visualDoorBounds` = 2 cells at
// x7-8, mat at `customerEntryPoint`) — a Demo/prototype visual + route only, the logical save
// entrance in room-config is unchanged.
export const ORTHOGONAL_ROOM_RENDER = Object.freeze({
  // ARCH-0575: because the door fixes the core width (x7-8), the portrait fit is width-limited,
  // so the room can only fill the tall screen if the back wall is a real, furnished height. The
  // wall is a proper cafe back wall (wainscot + wall art + menu board + door) that fills the top of
  // the frame instead of a thin empty band; the core strip carries most of it onto the first
  // screen so top/bottom void is small.
  wallHeight: 260,       // back wall (whole-room framing + pan range)
  doorHeight: 124,       // ARCH-0575A: a natural cafe-door height (~1 cell), not a 2-cell slab
  coreTopStrip: 220,     // wall strip above the floor kept in the first-screen core framing
  topWallLineWidth: 6,
  playAreaLineWidth: 2,  // ARCH-0575A: SUBTLE playable-grid edge, replaces the bold "card" outline
  bottomPad: 24,
  // ARCH-0575A: the VISUAL SHELL (wall + floor) is drawn this far BEYOND the logical 10x8 grid so
  // the room material reaches the safe-viewport edges (no "room card floating in backdrop"). These
  // are display-only world px; they add NO placeable cells and do not change the grid or framing.
  shell: Object.freeze({side: 84, top: 120, bottom: 132, floorFill: 0xe4bf90}),
  backdropFill: 0xbfa079, // warm ambient far beyond the shell (only seen when fully zoomed out)
  // ARCH-0575A prototype door: a real cafe door — warm wood leaf (not a black hole), a glass panel
  // with muntins, a brass handle and a frame. Layered so it reads clearly and is not a dark slab.
  door: Object.freeze({frame: 0x7a4f34, leaf: 0xcaa068, glass: 0xbcd6d2, glassEdge: 0x8fb3ad,
    handle: 0xd8b24a, panel: 0x9c774c, matFill: 0x9f765a}),
  // Wainscot panelling on the lower wall + a molding line — furnishes the taller backdrop.
  wainscot: Object.freeze({heightFactor: 0.4, fill: 0xc47f5f, molding: 0xecd2a6, moldingWidth: 5}),
  decoration: Object.freeze({windowFx: 0.24, boardFx: 0.52, heightFactor: 0.28, windowScale: 0.9, boardScale: 0.86}),
  // Per-zone floor tints (ARCH-0575): LOW-contrast warm hints, all light-valued so no zone reads
  // as a shadow or an unusable dark band. `outer` (the x0/x9 columns) is a NEUTRAL floor colour —
  // those cells are real, placeable floor, not a dead margin. `zoneAt()` provides the key and the
  // renderer falls back to `outer` for any unknown key.
  zoneFloor: Object.freeze({
    work: 0xd8b184, counter: 0xceac78, service: 0xf6dca8, seating: 0xe9c08d,
    cat: 0xedc2a0, aisle: 0xe9c79a, outer: 0xe7c295
  })
});

export class OrthogonalProjection {
  constructor(roomConfig, spatialGrid, furnitureConfig, params = ORTHOGONAL_PROJECTION_PARAMS) {
    this.room = roomConfig;
    this.floor = roomConfig.floor;
    this.spatialGrid = spatialGrid;
    this.furniture = furnitureConfig;
    this.id = params.id;
    this.mode = params.id;
    this.displayName = params.displayName;
    this.axisX = params.axisX;
    this.axisY = params.axisY;
    // Centre the logical floor (grid centroid) on the world centre.
    const gridCentroidX = (this.floor.cols - 1) / 2;
    const gridCentroidY = (this.floor.rows - 1) / 2;
    this.origin = Object.freeze({
      x: roomConfig.worldWidth / 2 - (gridCentroidX * this.axisX.x + gridCentroidY * this.axisY.x),
      y: roomConfig.worldHeight / 2 - (gridCentroidX * this.axisX.y + gridCentroidY * this.axisY.y)
    });
    // Determinant is cellWidth*cellHeight (guaranteed non-zero for a real room).
    this.determinant = this.axisX.x * this.axisY.y - this.axisY.x * this.axisX.y;
  }
  gridToWorld(gridX, gridY) {
    return {
      x: this.origin.x + gridX * this.axisX.x + gridY * this.axisY.x,
      y: this.origin.y + gridX * this.axisX.y + gridY * this.axisY.y
    };
  }
  worldToGrid(worldX, worldY) {
    const dx = worldX - this.origin.x;
    const dy = worldY - this.origin.y;
    const det = this.determinant;
    return {
      x: (this.axisY.y * dx - this.axisY.x * dy) / det,
      y: (-this.axisX.y * dx + this.axisX.x * dy) / det
    };
  }
  snapWorldToGrid(worldX, worldY) {
    const grid = this.worldToGrid(worldX, worldY);
    return {x: Math.round(grid.x), y: Math.round(grid.y)};
  }
  getCellCenter(gridX, gridY) { return this.gridToWorld(gridX, gridY); }
  // Returns the four corners of the cell RECTANGLE, in a stable sequence:
  // [top-left, top-right, bottom-right, bottom-left]. Never a diamond or parallelogram.
  getCellDiamond(gridX, gridY) {
    return [
      this.gridToWorld(gridX - 0.5, gridY - 0.5),
      this.gridToWorld(gridX + 0.5, gridY - 0.5),
      this.gridToWorld(gridX + 0.5, gridY + 0.5),
      this.gridToWorld(gridX - 0.5, gridY + 0.5)
    ];
  }
  getFootprintPolygon(type, x, y, rotation = 0) {
    const [width, height] = this.spatialGrid.getFootprintSize(type, rotation);
    const first = this.getCellDiamond(x, y);
    const topRight = this.getCellDiamond(x + width - 1, y);
    const bottomRight = this.getCellDiamond(x + width - 1, y + height - 1);
    const bottomLeft = this.getCellDiamond(x, y + height - 1);
    return [first[0], topRight[1], bottomRight[2], bottomLeft[3]];
  }
  getAnchor(type, x, y, rotation = 0) {
    const polygon = this.getFootprintPolygon(type, x, y, rotation);
    if (this.furniture[type]?.layer === 'floorDecoration') {
      return polygon.reduce((point, next) => ({x: point.x + next.x / 4, y: point.y + next.y / 4}), {x: 0, y: 0});
    }
    return {
      x: (polygon[2].x + polygon[3].x) / 2,
      y: (polygon[2].y + polygon[3].y) / 2
    };
  }
}
