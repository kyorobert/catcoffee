import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG} from '../assets/js/config/furniture-visual-config.js';

for(const [id,definition] of Object.entries(FURNITURE_CONFIG)){
  const visual=FURNITURE_VISUAL_CONFIG[id];
  assert.deepEqual([visual.footprint.width,visual.footprint.height],definition.foot,`${id}: footprint`);
  assert.ok(visual.stationType,`${id}: stationType`);
  assert.ok(Array.isArray(visual.interactionSockets),`${id}: sockets`);
  assert.equal(typeof visual.walkBlocking,'boolean',`${id}: walkBlocking`);
}
console.log('Furniture footprint regression passed: all 47 gameplay footprints and visual metadata agree.');
