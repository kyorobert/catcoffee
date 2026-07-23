// FlatProjection is a shallow-oblique ("淺俯視") screen projection Prototype that
// shares the same interface as IsoProjection, so GridSystem can swap it in behind
// the Facade without changing any logical grid data. It reads SpatialGrid's logical
// results and the shared roomConfig/furnitureConfig, never mutates them, and stores
// no furniture, occupancy, placement or character state.
//
// Model: an invertible 2D basis. world = origin + gridX*axisX + gridY*axisY.
// Columns run mostly horizontal; rows recede downward with a mild rightward slant,
// giving a flatter, narrower floor than the 2:1 iso diamond so a 10x8 room reads on
// a portrait phone. It stays oblique (front/back and left/right remain distinct) and
// is deliberately NOT an orthographic bird's-eye view.
//
// All tunable numbers live in one frozen block; the origin is DERIVED from the room
// so the floor centres on the world centre (no scattered magic numbers).
export const FLAT_PROJECTION_PARAMS = Object.freeze({
  id: 'flat',
  displayName: '淺俯視原型',
  axisX: Object.freeze({x: 112, y: 0}),   // +1 gridX → right 112px (clean left-right)
  axisY: Object.freeze({x: 26, y: 84})    // +1 gridY → down 84px, right 26px (shallow slant)
});

export class FlatProjection {
  constructor(roomConfig, spatialGrid, furnitureConfig, params = FLAT_PROJECTION_PARAMS) {
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
    // Precomputed inverse-basis determinant for worldToGrid (guaranteed non-zero).
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
