import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {
  FURNITURE_VISUAL_CONFIG,
  getFurnitureVisualDefinition
} from '../assets/js/config/furniture-visual-config.js?v=0577k';
import {
  getPurchasableFurniture
} from '../assets/js/core/furniture-catalog-selector.js?v=0577k';
import {
  getFurnitureDisplayState
} from '../assets/js/core/furniture-display-state.js?v=0577k';
import {
  ROTATION_POLICY,
  getOrthogonalRotationPolicy
} from '../assets/js/core/orthogonal-furniture-rotation.js?v=0577k';
import {
  ORTHO_DEMO_LAYOUT
} from '../assets/js/config/ortho-demo-layout.js?v=0577k';
import {
  CURRENT_KEY,
  MIGRATION_COMPLETED_VERSION,
  SaveAdapter
} from '../assets/js/systems/SaveAdapter.js?v=0577k';

const SOFT = 'pinkTableLong';
const HARD = 'pinkTableLongHardCafe';

class MemoryStorage {
  constructor(entries={}) { this.data=new Map(Object.entries(entries)); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key,value) { this.data.set(key,String(value)); }
  removeItem(key) { this.data.delete(key); }
}

assert.equal(Object.keys(FURNITURE_CONFIG).length,48);
assert.ok(FURNITURE_CONFIG[SOFT]);
assert.ok(FURNITURE_CONFIG[HARD]);
assert.notStrictEqual(FURNITURE_CONFIG[SOFT],FURNITURE_CONFIG[HARD]);
assert.deepEqual(FURNITURE_CONFIG[HARD].foot,FURNITURE_CONFIG[SOFT].foot);
assert.equal(FURNITURE_CONFIG[HARD].price,FURNITURE_CONFIG[SOFT].price);
assert.equal(FURNITURE_CONFIG[HARD].layer,FURNITURE_CONFIG[SOFT].layer);
assert.equal(FURNITURE_CONFIG[HARD].rotation,FURNITURE_CONFIG[SOFT].rotation);
assert.equal(
  getOrthogonalRotationPolicy(HARD,FURNITURE_CONFIG[HARD]),
  ROTATION_POLICY.AXIS2
);

const catalog=getPurchasableFurniture({
  definitions:FURNITURE_CONFIG,
  visualConfig:FURNITURE_VISUAL_CONFIG
});
assert.equal(catalog.length,48);
assert.ok(catalog.some(entry=>entry.id===SOFT));
assert.ok(catalog.some(entry=>entry.id===HARD));
assert.notEqual(
  catalog.findIndex(entry=>entry.id===SOFT),
  catalog.findIndex(entry=>entry.id===HARD)
);

for(const id of [SOFT,HARD]){
  const definition=FURNITURE_CONFIG[id];
  const horizontal=getFurnitureDisplayState(id,0,definition,'ortho');
  const vertical=getFurnitureDisplayState(id,1,definition,'ortho');
  assert.notEqual(horizontal.texture,vertical.texture,`${id} axis texture`);
  assert.equal(horizontal.usedFallback,false);
  assert.equal(vertical.usedFallback,false);
  assert.strictEqual(
    getFurnitureVisualDefinition(id,'iso'),
    FURNITURE_VISUAL_CONFIG[id],
    `${id} iso remains base visual`
  );
  assert.strictEqual(
    getFurnitureVisualDefinition(id,'flat'),
    FURNITURE_VISUAL_CONFIG[id],
    `${id} flat remains base visual`
  );
}
assert.notEqual(
  getFurnitureDisplayState(
    SOFT,0,FURNITURE_CONFIG[SOFT],'ortho'
  ).texture,
  getFurnitureDisplayState(
    HARD,0,FURNITURE_CONFIG[HARD],'ortho'
  ).texture,
  'SoftCute and HardCafe must not share their formal orthogonal texture'
);

const serviceIds=['counter','coffeeMachine','washStation','dessert'];
assert.deepEqual(
  ORTHO_DEMO_LAYOUT
    .filter(item=>serviceIds.includes(item.type))
    .sort((left,right)=>left.x-right.x)
    .map(item=>item.type),
  serviceIds,
  'selected service option C is counter -> coffee -> wash -> dessert'
);
assert.ok(ORTHO_DEMO_LAYOUT.some(item=>item.type===SOFT));
assert.ok(ORTHO_DEMO_LAYOUT.some(item=>item.type===HARD));
assert.ok(!ORTHO_DEMO_LAYOUT.some(item=>/rug/i.test(item.type)));

const currentState={
  sceneSchemaVersion:5401,
  migrationCompletedVersion:5402,
  coins:4321,
  inventory:{[SOFT]:2},
  items:[{id:'soft-existing',type:SOFT,x:2,y:4,r:1}]
};
const currentRaw=JSON.stringify(currentState);
const storage=new MemoryStorage({[CURRENT_KEY]:currentRaw});
const adapter=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.equal(storage.getItem(CURRENT_KEY),currentRaw,'loading rewrote the old current save');
assert.deepEqual(adapter.state.items,currentState.items,'existing SoftCute item changed');
assert.equal(adapter.state.inventory[HARD],undefined,'legacy player received HardCafe automatically');
assert.equal(adapter.state.sceneSchemaVersion,5401);
assert.equal(adapter.state.migrationCompletedVersion,MIGRATION_COMPLETED_VERSION);

adapter.state.items.push({id:'hard-new',type:HARD,x:4,y:4,r:0});
adapter.state.inventory[HARD]=1;
adapter.save();
const reloaded=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.deepEqual(
  reloaded.state.items.find(item=>item.id==='hard-new'),
  {id:'hard-new',type:HARD,x:4,y:4,r:0}
);
assert.equal(reloaded.state.inventory[HARD],1);
assert.equal(reloaded.state.items.find(item=>item.id==='soft-existing').r,1);
assert.equal(CURRENT_KEY,'catCafePhaserV0540');
assert.equal(MIGRATION_COMPLETED_VERSION,5402);

console.log(
  'ART-0577K formal integration passed: independent dual tables, selector/Store, '+
  'option-C Runtime fixture, old-save preservation and new-product reload.'
);
