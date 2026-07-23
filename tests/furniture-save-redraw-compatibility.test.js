import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,V0552_REDRAW_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';
import {CURRENT_KEY,SaveAdapter} from '../assets/js/systems/SaveAdapter.js';

class MemoryStorage{
  constructor(entries={}){this.data=new Map(Object.entries(entries))}
  getItem(key){return this.data.has(key)?this.data.get(key):null}
  setItem(key,value){this.data.set(key,String(value))}
  removeItem(key){this.data.delete(key)}
}

const items=V0552_REDRAW_FURNITURE_IDS.map((type,index)=>({id:`redraw-${index}`,type,x:index%10,y:index%8,r:index%4}));
const raw=JSON.stringify({coins:54321,reputation:234,xp:987,items,inventory:{coffeeMachine:3}});
const storage=new MemoryStorage({[CURRENT_KEY]:raw});
const adapter=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.deepEqual(adapter.state.items,items);
assert.equal(adapter.state.coins,54321);
assert.equal(adapter.state.inventory.coffeeMachine,3);
for(const item of adapter.state.items){
  const visual=FURNITURE_VISUAL_CONFIG[item.type];
  assert.ok(visual.textureByDirection[['down-right','down-left','up-right','up-left'][item.r]]);
}
adapter.save();
const reloaded=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.deepEqual(reloaded.state.items,items);
assert.equal(reloaded.state.coins,54321,'redraw reload charged coins');
console.log('Furniture save redraw compatibility passed: IDs, positions, rotations, inventory and coins retained.');
