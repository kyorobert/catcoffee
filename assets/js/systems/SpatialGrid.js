// SpatialGrid owns the projection-independent logical grid only: cell bounds,
// the placeable mask and footprint cell math. It is engine-agnostic and reads
// nothing about screen or world coordinates. Values are read by reference from
// the shared roomConfig, so there is no second copy of cols, rows or mask.
export class SpatialGrid {
  constructor(roomConfig, furnitureConfig) {
    this.room = roomConfig;
    this.floor = roomConfig.floor;
    this.furniture = furnitureConfig;
  }
  get cols() { return this.floor.cols; }
  get rows() { return this.floor.rows; }
  get placeableMask() { return this.floor.placeableMask; }
  getFootprintSize(type, rotation = 0) {
    const foot = this.furniture[type]?.foot || [1, 1];
    return Math.abs(rotation) % 2 ? [foot[1], foot[0]] : [foot[0], foot[1]];
  }
  getFootprintCells(type, x, y, rotation = 0) {
    const [width, height] = this.getFootprintSize(type, rotation);
    const cells = [];
    for (let gy = y; gy < y + height; gy++) for (let gx = x; gx < x + width; gx++) cells.push({x: gx, y: gy});
    return cells;
  }
  isInsideGrid(x, y) {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.floor.cols && y < this.floor.rows;
  }
  isPlaceableCell(x, y) {
    return this.isInsideGrid(x, y) && this.floor.placeableMask[y][x] === true;
  }
}
