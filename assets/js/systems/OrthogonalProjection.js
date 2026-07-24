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
  axisX: Object.freeze({x: 104, y: 0}),   // +1 gridX -> right 104px, no vertical drift
  axisY: Object.freeze({x: 0, y: 88})     // +1 gridY -> down 88px, no horizontal drift
});

export const ORTHOGONAL_ROOM_RENDER = Object.freeze({
  topWallHeight: 160,
  topWallLineWidth: 6,
  floorOutlineWidth: 4,
  sideEdgeLineWidth: 4,
  decoration: Object.freeze({windowFx: 0.3, boardFx: 0.7, heightFactor: 0.5, windowScale: 0.92, boardScale: 0.9})
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
