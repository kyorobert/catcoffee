import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js';
import {PlacementSystem} from '../assets/js/systems/PlacementSystem.js';
import {SaveAdapter,CURRENT_KEY,LEGACY_BACKUP_KEY,MIGRATION_COMPLETED_VERSION} from '../assets/js/systems/SaveAdapter.js';

const grid=new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG);
for(let y=0;y<ROOM_CONFIG.floor.rows;y++)for(let x=0;x<ROOM_CONFIG.floor.cols;x++){
  const world=grid.gridToWorld(x,y);
  const roundTrip=grid.snapWorldToGrid(world.x,world.y);
  assert.deepEqual(roundTrip,{x,y},'grid/world round-trip');
}
assert.deepEqual(grid.getFootprintSize('woodTable',0),[2,1]);
assert.deepEqual(grid.getFootprintSize('woodTable',1),[1,2]);
assert.equal(grid.isPlaceableCell(0,0),true);
assert.equal(grid.isPlaceableCell(9,7),false);
assert.equal(grid.isInsideGrid(10,0),false);

for(const [type,x,y,rotation] of [['plant',4,3,0],['woodTable',2,2,0],['woodTable',2,2,1]]){
  const polygon=grid.getFootprintPolygon(type,x,y,rotation);
  const expected={x:(polygon[2].x+polygon[3].x)/2,y:(polygon[2].y+polygon[3].y)/2};
  assert.deepEqual(grid.getAnchor(type,x,y,rotation),expected,`${type} anchor uses the footprint bottom-edge midpoint`);
}
const furnitureEntitySource=readFileSync(new URL('../assets/js/entities/FurnitureEntity.js',import.meta.url),'utf8');
const cafeSceneSource=readFileSync(new URL('../assets/js/scenes/CafeScene.js',import.meta.url),'utf8');
assert.match(furnitureEntitySource,/grid\.getAnchor\(/,'formal furniture uses GridSystem.getAnchor');
assert.match(cafeSceneSource,/this\.grid\.getAnchor\(/,'ghost uses GridSystem.getAnchor');

const rug={id:'rug',type:'rugPink',x:2,y:2,r:0};
const table={id:'table',type:'woodTable',x:2,y:2,r:0};
const occupancy=new OccupancySystem(grid,FURNITURE_CONFIG);
occupancy.build([rug]);
assert.equal(occupancy.canOccupy(grid.getFootprintCells(table.type,table.x,table.y,0),{layer:'floorObject'}).valid,true,'rug does not block furniture');
occupancy.addItem(table);
assert.equal(occupancy.canOccupy(grid.getFootprintCells('plant',2,2,0),{layer:'floorObject'}).reason,'overlap');
occupancy.removeItem('table');
assert.equal(occupancy.canOccupy(grid.getFootprintCells('plant',2,2,0),{layer:'floorObject'}).valid,true,'moving item origin is released');
occupancy.addItem({id:'wall',type:'photoBackdrop',x:0,y:3,r:0});
assert.equal(occupancy.canOccupy(grid.getFootprintCells('plant',0,3,0),{layer:'floorObject'}).valid,true,'wall object does not pollute floor occupancy');

occupancy.build([]);
const placement=new PlacementSystem(grid,occupancy,FURNITURE_CONFIG);
assert.equal(placement.validatePlacement({type:'plant',x:4,y:4,rotation:0}).valid,true);
assert.equal(placement.validatePlacement({type:'plant',x:9,y:7,rotation:0}).blockingReason,'reserved-entrance');
occupancy.addItem({id:'plant-a',type:'plant',x:4,y:4,r:0});
assert.equal(placement.validatePlacement({type:'plant',x:4,y:4,rotation:0}).blockingReason,'overlap');
const chairResult=placement.validatePlacement({type:'chair',x:1,y:1,rotation:0});
assert.equal(chairResult.valid,true,'chair without table remains placeable');
assert.equal(chairResult.blockingReason,null);
assert.equal(chairResult.warnings[0]?.code,'chair-without-table');

class MemoryStorage{
  constructor(entries={}){this.values=new Map(Object.entries(entries))}
  getItem(key){return this.values.get(key)??null}
  setItem(key,value){this.values.set(key,String(value))}
  removeItem(key){this.values.delete(key)}
}
const unknownItem={id:'legacy-unknown',type:'futureFurniture',x:8,y:1,r:0};
const invalidItem={id:'legacy-invalid',type:'plant',x:9,y:7,r:0};
const legacy={coins:777,reputation:333,xp:99,items:[{id:'legacy-chair',type:'chair',x:3,y:2,r:1},unknownItem,invalidItem]};
const legacyRaw=JSON.stringify(legacy);
const storage=new MemoryStorage({catCafeDecorV049:legacyRaw});
const adapter=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.equal(adapter.state.coins,777);
assert.equal(adapter.state.items[0].x,3);
assert.equal(adapter.state.items[0].r,1);
assert.equal(adapter.state.migrationCompletedVersion,0);
assert.deepEqual(adapter.state.unmappedLegacyItems,[unknownItem],'unknown legacy furniture is preserved instead of deleted');
assert.ok(storage.getItem(LEGACY_BACKUP_KEY),'legacy raw save is backed up');
assert.equal(storage.getItem('catCafeDecorV049'),legacyRaw,'legacy key is never overwritten');
assert.ok(storage.getItem(CURRENT_KEY),'new Phaser save key is created');

adapter.migrateIfNeeded(grid);
assert.equal(adapter.state.migrationCompletedVersion,MIGRATION_COMPLETED_VERSION);
assert.equal(adapter.state.inventory.plant,1,'invalid furniture is moved to inventory once');
assert.equal(adapter.state.migrationArchive.find(entry=>entry.item?.id===invalidItem.id)?.reason,'reserved-cell');
const warningCount=adapter.state.migrationWarnings.length;
adapter.migrateIfNeeded(grid);
assert.equal(adapter.state.inventory.plant,1,'repeat Scene creation does not duplicate inventory');
assert.equal(adapter.state.migrationWarnings.length,warningCount,'migration warnings are not duplicated');

storage.setItem('catCafeDecorV049',JSON.stringify({...legacy,coins:12}));
const reloaded=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.equal(reloaded.state.coins,777,'new key has priority after migration');
reloaded.clearCurrent();
assert.equal(storage.getItem(CURRENT_KEY),null);
assert.notEqual(storage.getItem('catCafeDecorV049'),null,'clearing new cache preserves legacy save');
const remigrated=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.equal(remigrated.state.coins,12,'clearing new key permits a fresh legacy migration');

console.log('Core tests passed: Grid anchors, Occupancy, Placement and safe SaveAdapter migration.');
