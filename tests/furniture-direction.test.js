import assert from 'node:assert/strict';
import {FURNITURE_VISUAL_CONFIG} from '../assets/js/config/furniture-visual-config.js';
import {resolveDirectionalTexture,resolveFurnitureDirection,rotationToDirection} from '../assets/js/core/furniture-direction.js';

assert.deepEqual([0,1,2,3].map(rotationToDirection),['down-right','down-left','up-right','up-left']);
assert.equal(rotationToDirection(4),'down-right');
assert.equal(rotationToDirection(-1),'up-left');
assert.equal(rotationToDirection(Number.NaN),'down-right');
for(const visual of Object.values(FURNITURE_VISUAL_CONFIG))for(const direction of ['down-right','down-left','up-right','up-left'])assert.ok(resolveDirectionalTexture(visual,direction));

const mirrorVisual={mirrorAllowed:true,authoredDirections:['down-right'],textureByDirection:{'down-right':'furniture:test'},fallbackTexture:'furniture:test'};
assert.equal(resolveFurnitureDirection(mirrorVisual,'down-left').flipX,true);
const noMirror={...mirrorVisual,mirrorAllowed:false};
assert.equal(resolveFurnitureDirection(noMirror,'down-left').flipX,false);
assert.equal(resolveFurnitureDirection(noMirror,'down-left').texture,'furniture:test');
assert.equal(resolveFurnitureDirection(noMirror,'not-a-direction').requestedDirection,'down-right');
console.log('Furniture direction passed: rotation mapping and safe fallback verified.');

