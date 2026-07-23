import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {FURNITURE_DIRECTIONS,FURNITURE_VISUAL_CONFIG,V0552_REDRAW_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';
import {resolveFurnitureDirection} from '../assets/js/core/furniture-direction.js';

for(const id of V0552_REDRAW_FURNITURE_IDS){
  const visual=FURNITURE_VISUAL_CONFIG[id];
  assert.deepEqual(visual.authoredDirections,[...FURNITURE_DIRECTIONS],`${id}: authored directions`);
  assert.equal(visual.mirrorAllowed,false,`${id}: must use authored art`);
  assert.equal(new Set(Object.values(visual.textureByDirection)).size,4,`${id}: texture keys`);
  for(const direction of FURNITURE_DIRECTIONS){
    const resolved=resolveFurnitureDirection(visual,direction);
    assert.equal(resolved.resolvedDirection,direction,`${id}/${direction}`);
    assert.equal(resolved.usedFallback,false,`${id}/${direction}: fallback`);
    assert.equal(resolved.flipX,false,`${id}/${direction}: flip`);
    assert.ok(existsSync(visual.texturePathByDirection[direction].split('?')[0]),`${id}/${direction}: path`);
  }
}
console.log('Furniture texture direction passed: all 25 use four authored, non-mirrored directions.');
