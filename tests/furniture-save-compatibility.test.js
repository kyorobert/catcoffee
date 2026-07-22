import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {PROTOTYPE_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';
import {CURRENT_KEY,LEGACY_BACKUP_KEY,SaveAdapter} from '../assets/js/systems/SaveAdapter.js';

class MemoryStorage{
  constructor(entries={}){this.data=new Map(Object.entries(entries))}
  getItem(key){return this.data.has(key)?this.data.get(key):null}
  setItem(key,value){this.data.set(key,String(value))}
  removeItem(key){this.data.delete(key)}
}

const prototypeItem={id:'legacy-prototype-1',type:'coffeeMachine',x:4,y:4,r:1};
const legacyRaw=JSON.stringify({coins:777,reputation:88,xp:99,items:[prototypeItem],inventory:{coffeeMachine:2}});
const storage=new MemoryStorage({catCafeDecorV049:legacyRaw});
const adapter=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.equal(storage.getItem('catCafeDecorV049'),legacyRaw,'legacy raw changed');
assert.equal(storage.getItem(LEGACY_BACKUP_KEY),legacyRaw,'legacy backup missing');
assert.ok(storage.getItem(CURRENT_KEY),'new save missing');
assert.deepEqual(adapter.state.items[0],prototypeItem,'prototype item changed during load');
assert.equal(adapter.state.coins,777);

// Store visibility never controls instance lifecycle: normal item operations keep
// the original ID/type and never charge coins again.
adapter.state.items[0].x=5;adapter.state.items[0].y=3;adapter.state.items[0].r=2;adapter.save();
const reloaded=new SaveAdapter(FURNITURE_CONFIG,storage);
assert.deepEqual(reloaded.state.items[0],{...prototypeItem,x:5,y:3,r:2});
const beforeCoins=reloaded.state.coins;
const [stored]=reloaded.state.items.splice(0,1);
reloaded.state.inventory[stored.type]=(reloaded.state.inventory[stored.type]||0)+1;
assert.equal(reloaded.state.coins,beforeCoins,'storing charged coins');
assert.equal(stored.id,prototypeItem.id);
assert.ok(PROTOTYPE_FURNITURE_IDS.includes(stored.type));

const sellItem={...prototypeItem,id:'legacy-prototype-sell'};
reloaded.state.items.push(sellItem);
const sellIndex=reloaded.state.items.findIndex(item=>item.id===sellItem.id);
const [sold]=reloaded.state.items.splice(sellIndex,1);
reloaded.state.coins+=Math.floor(FURNITURE_CONFIG[sold.type].price*.5);
assert.equal(sold.id,'legacy-prototype-sell');
assert.equal(reloaded.state.coins,beforeCoins+Math.floor(FURNITURE_CONFIG.coffeeMachine.price*.5),'Prototype sale result changed');

const fresh=new SaveAdapter(FURNITURE_CONFIG,new MemoryStorage());
assert.ok(fresh.state.items.every(item=>!PROTOTYPE_FURNITURE_IDS.includes(item.type)),'new game contains prototype');
console.log('Furniture save compatibility passed: legacy Prototype retained and new seed clean.');
