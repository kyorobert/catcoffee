// OrthogonalProjection is a true axis-aligned screen projection. It shares the
// same interface as IsoProjection / FlatProjection so GridSystem can swap it in
// behind the Facade without changing logical grid data.
//
// Model: world = origin + gridX*axisX + gridY*axisY, where:
//   axisX = {cellWidth, 0}  -> X moves only left/right
//   axisY = {0, cellHeight} -> Y moves only up/down
// There is no skew, shear, rotation or perspective scaling.
//
// This module is geometry-only. Room colour, wall, trim, shell, door and decor
// tokens live in config/ortho-room-skin.js (ARCH-0575C).
export const ORTHOGONAL_PROJECTION_PARAMS = Object.freeze({
  id: 'ortho',
  displayName: '正交平面',
  axisX: Object.freeze({x: 88, y: 0}),
  axisY: Object.freeze({x: 0, y: 120})
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
    const gridCentroidX = (this.floor.cols - 1) / 2;
    const gridCentroidY = (this.floor.rows - 1) / 2;
    this.origin = Object.freeze({
      x: roomConfig.worldWidth / 2 - (gridCentroidX * this.axisX.x + gridCentroidY * this.axisY.x),
      y: roomConfig.worldHeight / 2 - (gridCentroidX * this.axisX.y + gridCentroidY * this.axisY.y)
    });
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

  getCellCenter(gridX, gridY) {
    return this.gridToWorld(gridX, gridY);
  }

  // Four corners in the stable [top-left, top-right, bottom-right, bottom-left] sequence.
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
      return polygon.reduce(
        (point, next) => ({x: point.x + next.x / 4, y: point.y + next.y / 4}),
        {x: 0, y: 0}
      );
    }
    return {
      x: (polygon[2].x + polygon[3].x) / 2,
      y: (polygon[2].y + polygon[3].y) / 2
    };
  }
}
