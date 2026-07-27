import {SpatialGrid} from './SpatialGrid.js?v=0577a';
import {IsoProjection} from './IsoProjection.js?v=0577a';
import {FlatProjection} from './FlatProjection.js?v=0577a';
import {OrthogonalProjection} from './OrthogonalProjection.js?v=0577a';
import {PROJECTION_MODE} from '../core/projection-mode.js?v=0577a';
import {getFlatPreset} from '../config/flat-projection-presets.js?v=0577a';

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
// `{mode: 'flat'}` swaps in FlatProjection on the SAME SpatialGrid. `options.flatPreset`
// (an already-resolved preset id string) picks which Flat composition preset to use;
// it is only consulted in flat mode and defaults to the ARCH-0562 baseline. GridSystem
// never reads the URL itself; the assembly layer resolves the mode/preset and passes
// them in. In flat mode `this.flatPreset` holds the resolved preset (render metadata
// included) for the scene; in iso mode it is null.
export class GridSystem {
  constructor(roomConfig, furnitureConfig, options = {}) {
    this.room = roomConfig;
    this.floor = roomConfig.floor;
    this.furniture = furnitureConfig;
    this.spatialGrid = new SpatialGrid(roomConfig, furnitureConfig);
    this.flatPreset = null;
    if (options.mode === PROJECTION_MODE.FLAT) {
      this.projectionMode = PROJECTION_MODE.FLAT;
      this.flatPreset = getFlatPreset(options.flatPreset);
      this.projection = new FlatProjection(roomConfig, this.spatialGrid, furnitureConfig, this.flatPreset.projection);
    } else if (options.mode === PROJECTION_MODE.ORTHO) {
      this.projectionMode = PROJECTION_MODE.ORTHO;
      this.projection = new OrthogonalProjection(roomConfig, this.spatialGrid, furnitureConfig);
    } else {
      this.projectionMode = PROJECTION_MODE.ISO;
      this.projection = new IsoProjection(roomConfig, this.spatialGrid, furnitureConfig);
    }
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
