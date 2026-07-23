import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,V0552_REDRAW_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';
import {getPurchasableFurniture} from '../assets/js/core/furniture-catalog-selector.js';

const entries=getPurchasableFurniture({definitions:FURNITURE_CONFIG,visualConfig:FURNITURE_VISUAL_CONFIG});
assert.equal(entries.length,47);
for(const id of V0552_REDRAW_FURNITURE_IDS){
  const entry=entries.find(candidate=>candidate.id===id);
  assert.ok(entry,`${id}: not restored to store`);
  assert.ok(entry.visual.texturePathByDirection['down-right'].endsWith('.png?v=0552a'),`${id}: old store thumbnail`);
}
assert.ok(entries.every(entry=>!['prototype','retired'].includes(entry.visual.artStatus)));
console.log('Furniture store re-enable passed: 25 redraws restored, 47 catalog entries visible.');
