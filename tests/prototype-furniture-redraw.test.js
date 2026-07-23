import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,V0552_REDRAW_BATCHES,V0552_REDRAW_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';

assert.equal(V0552_REDRAW_FURNITURE_IDS.length,25);
assert.deepEqual(Object.fromEntries(Object.entries(V0552_REDRAW_BATCHES).map(([key,ids])=>[key,ids.length])),{P0:10,P1:9,P2:6});
assert.equal(new Set(Object.values(V0552_REDRAW_BATCHES).flat()).size,25);
for(const id of V0552_REDRAW_FURNITURE_IDS){
  assert.ok(FURNITURE_CONFIG[id],`${id}: missing gameplay definition`);
  const visual=FURNITURE_VISUAL_CONFIG[id];
  assert.ok(['production','redraw'].includes(visual.artStatus),`${id}: ${visual.artStatus}`);
  assert.equal(visual.storeVisible,true,`${id}: store hidden`);
  assert.equal(visual.sourceFormat,'png',`${id}: runtime format`);
  assert.equal(visual.texturePathByDirection!==null,true,`${id}: directional paths`);
}
assert.equal(Object.values(FURNITURE_VISUAL_CONFIG).filter(visual=>visual.artStatus==='prototype').length,0);
console.log('Prototype furniture redraw passed: 25 upgraded, 0 Prototype remaining.');
