// IsoProjection owns the current 2:1 isometric screen projection: the mapping
// between logical grid cells and world coordinates, cell diamonds, footprint
// polygons and anchors. It reads SpatialGrid's logical results and the shared
// roomConfig/furnitureConfig, but never mutates them and never stores furniture,
// occupancy, placement or character state. A future shallow top-down projection
// variant can be swapped in behind the same interface, in a separate module and
// a later approved task, without changing any logical grid data.
export class IsoProjection {
  constructor(roomConfig, spatialGrid, furnitureConfig) {
    this.room = roomConfig;
    this.floor = roomConfig.floor;
    this.spatialGrid = spatialGrid;
    this.furniture = furnitureConfig;
  }
  gridToWorld(gridX, gridY) {
    const {originX, originY, tileWidth, tileHeight} = this.floor;
    return {x: originX + (gridX - gridY) * tileWidth / 2, y: originY + (gridX + gridY) * tileHeight / 2};
  }
  worldToGrid(worldX, worldY) {
    const {originX, originY, tileWidth, tileHeight} = this.floor;
    const a = (worldX - originX) / (tileWidth / 2);
    const b = (worldY - originY) / (tileHeight / 2);
    return {x: (a + b) / 2, y: (b - a) / 2};
  }
  snapWorldToGrid(worldX, worldY) {
    const grid = this.worldToGrid(worldX, worldY);
    return {x: Math.round(grid.x), y: Math.round(grid.y)};
  }
  getCellCenter(gridX, gridY) { return this.gridToWorld(gridX, gridY); }
  getCellDiamond(gridX, gridY) {
    const c = this.gridToWorld(gridX, gridY);
    const hw = this.floor.tileWidth / 2, hh = this.floor.tileHeight / 2;
    return [
      {x: c.x, y: c.y - hh},
      {x: c.x + hw, y: c.y},
      {x: c.x, y: c.y + hh},
      {x: c.x - hw, y: c.y}
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
