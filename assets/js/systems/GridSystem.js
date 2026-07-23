import {SpatialGrid} from './SpatialGrid.js?v=0560a';
import {IsoProjection} from './IsoProjection.js?v=0560a';
import {FlatProjection} from './FlatProjection.js?v=0560a';
import {PROJECTION_MODE} from '../core/projection-mode.js?v=0560a';

// GridSystem is a compatibility Facade. It composes the projection-independent
// SpatialGrid with the active SceneProjection and keeps the full public API
// unchanged, so existing consumers keep calling `grid.*` without knowing about the
// split. Logical calls delegate to `spatialGrid`; screen-projection calls delegate
// to `projection`. The `spatialGrid` and `projection` references are exposed
// read-only. Single source of truth: roomConfig and furnitureConfig are shared by
// reference, so there is no second grid, mask or world-coordinate system.
//
// The optional third argument selects the projection. Omitting it (the legacy
// 2-arg call) keeps IsoProjection — the default and safe baseline. Passing
// `{mode: 'flat'}` swaps in FlatProjection on the SAME SpatialGrid. GridSystem
// never reads the URL itself; the assembly layer resolves the mode and passes it in.
export class GridSystem {
  constructor(roomConfig, furnitureConfig, options = {}) {
    this.room = roomConfig;
    this.floor = roomConfig.floor;
    this.furniture = furnitureConfig;
    this.spatialGrid = new SpatialGrid(roomConfig, furnitureConfig);
    this.projectionMode = options.mode === PROJECTION_MODE.FLAT ? PROJECTION_MODE.FLAT : PROJECTION_MODE.ISO;
    this.projection = this.projectionMode === PROJECTION_MODE.FLAT
      ? new FlatProjection(roomConfig, this.spatialGrid, furnitureConfig)
      : new IsoProjection(roomConfig, this.spatialGrid, furnitureConfig);
  }
  // --- SpatialGrid: projection-independent logical grid ---
  getFootprintSize(type, rotation = 0) { return this.spatialGrid.getFootprintSize(type, rotation); }
  getFootprintCells(type, x, y, rotation = 0) { return this.spatialGrid.getFootprintCells(type, x, y, rotation); }
  isInsideGrid(x, y) { return this.spatialGrid.isInsideGrid(x, y); }
  isPlaceableCell(x, y) { return this.spatialGrid.isPlaceableCell(x, y); }
  // --- SceneProjection: current 2:1 isometric screen projection ---
  gridToWorld(gridX, gridY) { return this.projection.gridToWorld(gridX, gridY); }
  worldToGrid(worldX, worldY) { return this.projection.worldToGrid(worldX, worldY); }
  snapWorldToGrid(worldX, worldY) { return this.projection.snapWorldToGrid(worldX, worldY); }
  getCellCenter(gridX, gridY) { return this.projection.getCellCenter(gridX, gridY); }
  getCellDiamond(gridX, gridY) { return this.projection.getCellDiamond(gridX, gridY); }
  getFootprintPolygon(type, x, y, rotation = 0) { return this.projection.getFootprintPolygon(type, x, y, rotation); }
  getAnchor(type, x, y, rotation = 0) { return this.projection.getAnchor(type, x, y, rotation); }
}
