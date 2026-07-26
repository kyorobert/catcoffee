import assert from 'node:assert/strict';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js';
import {
  CURRENT_KEY,
  MIGRATION_COMPLETED_VERSION,
  SaveAdapter
} from '../assets/js/systems/SaveAdapter.js';

class MemoryStorage {
  constructor(entries={}) {
    this.values=new Map(Object.entries(entries));
    this.writes=[];
  }
  getItem(key){return this.values.get(key)??null}
  setItem(key,value){this.writes.push({key,value:String(value)});this.values.set(key,String(value))}
  removeItem(key){this.writes.push({key,remove:true});this.values.delete(key)}
}

const makeState=items=>({
  sceneSchemaVersion:5401,
  migrationCompletedVersion:5401,
  coins:777,
  inventory:{chair:2,doubleCatTree:1,catCastle:0},
  migrationWarnings:[],
  migrationArchive:[],
  items
});
const migrate=(items,{mode='ortho'}={})=>{
  const storage=new MemoryStorage({[CURRENT_KEY]:JSON.stringify(makeState(items))});
  const adapter=new SaveAdapter(FURNITURE_CONFIG,storage);
  const grid=new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG,{mode});
  const result=adapter.migrateIfNeeded(grid);
  return {storage,adapter,grid,result};
};

assert.equal(MIGRATION_COMPLETED_VERSION,5402);
assert.deepEqual(ROOM_CONFIG.entrance.cells,[{x:7,y:0},{x:8,y:0}]);
assert.equal(ROOM_CONFIG.floor.placeableMask[0][7],false);
assert.equal(ROOM_CONFIG.floor.placeableMask[0][8],false);
assert.equal(ROOM_CONFIG.floor.placeableMask[7][8],true);
assert.equal(ROOM_CONFIG.floor.placeableMask[7][9],true);

const conflictItems=[
  {id:'one',type:'chair',x:7,y:0,r:0},
  {id:'tall',type:'doubleCatTree',x:8,y:0,r:0},
  {id:'wide',type:'catCastle',x:6,y:0,r:0},
  {id:'safe',type:'chair',x:9,y:7,r:0}
];
const {adapter,result}=migrate(conflictItems);
assert.equal(result.performed,true);
assert.equal(result.fromVersion,5401);
assert.equal(result.toVersion,5402);
assert.equal(result.entranceConflictCount,3);
assert.deepEqual(adapter.state.items.map(item=>item.id),['safe'],'old bottom entrance is released and preserved');
assert.equal(adapter.state.inventory.chair,3,'1x1 conflict enters inventory exactly once');
assert.equal(adapter.state.inventory.doubleCatTree,2,'1x2 conflict enters inventory exactly once');
assert.equal(adapter.state.inventory.catCastle,1,'2x2 conflict enters inventory exactly once');

for(const original of conflictItems.slice(0,3)){
  const archived=adapter.state.migrationArchive.find(entry=>entry.item?.id===original.id);
  assert.ok(archived,`${original.id} is archived`);
  assert.equal(archived.reason,'entrance-relocated');
  assert.equal(archived.migrationVersion,5402);
  assert.deepEqual(archived.item,original,'archive preserves id/type/x/y/r');
}
assert.equal(adapter.state.migrationWarnings.filter(warning=>warning.reason==='entrance-relocated').length,3);

const inventoryAfter=structuredClone(adapter.state.inventory);
const archiveAfter=structuredClone(adapter.state.migrationArchive);
const warningAfter=structuredClone(adapter.state.migrationWarnings);
const second=adapter.migrateIfNeeded(new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG,{mode:'ortho'}));
assert.equal(second.performed,false);
assert.deepEqual(adapter.state.inventory,inventoryAfter,'repeated migration cannot duplicate inventory');
assert.deepEqual(adapter.state.migrationArchive,archiveAfter,'repeated migration cannot duplicate archive');
assert.deepEqual(adapter.state.migrationWarnings,warningAfter,'repeated migration cannot duplicate warnings');

const iso=migrate([{id:'iso-conflict',type:'chair',x:8,y:0,r:0}],{mode:'iso'});
assert.equal(iso.result.entranceConflictCount,1,'migration uses logical cells, independent of projection');
assert.equal(iso.adapter.state.items.length,0);

const demoStorage=new MemoryStorage({[CURRENT_KEY]:JSON.stringify(makeState([
  {id:'demo-conflict',type:'chair',x:7,y:0,r:0}
]))});
const demoAdapter=new SaveAdapter(FURNITURE_CONFIG,demoStorage,{readOnly:true});
const demoResult=demoAdapter.migrateIfNeeded(new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG,{mode:'ortho'}));
demoAdapter.save();
demoAdapter.clearCurrent();
assert.equal(demoResult.performed,false);
assert.equal(demoStorage.writes.length,0,'read-only demo neither migrates nor writes the save');
assert.equal(JSON.parse(demoStorage.getItem(CURRENT_KEY)).migrationCompletedVersion,5401);

console.log('Entrance migration 5402: top-zone reservation, released bottom cells, 1x1/1x2/2x2 archive-to-inventory, idempotency, projection independence and demo read-only passed.');
