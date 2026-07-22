import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,PROTOTYPE_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';
import {getDebugFurnitureCatalog,getPurchasableFurniture} from '../assets/js/core/furniture-catalog-selector.js';

const purchasable=getPurchasableFurniture({definitions:FURNITURE_CONFIG,visualConfig:FURNITURE_VISUAL_CONFIG});
assert.equal(purchasable.length,22);
assert.ok(purchasable.some(entry=>entry.visual.artStatus==='production'));
assert.ok(purchasable.some(entry=>entry.visual.artStatus==='redraw'));
assert.ok(purchasable.every(entry=>!['prototype','retired'].includes(entry.visual.artStatus)));
assert.ok(PROTOTYPE_FURNITURE_IDS.every(id=>!purchasable.some(entry=>entry.id===id)));
assert.equal(getDebugFurnitureCatalog({definitions:FURNITURE_CONFIG,visualConfig:FURNITURE_VISUAL_CONFIG}).length,47);
assert.ok(getDebugFurnitureCatalog({definitions:FURNITURE_CONFIG,visualConfig:FURNITURE_VISUAL_CONFIG}).some(entry=>entry.id==='coffeeMachine'));
assert.ok(getPurchasableFurniture({definitions:FURNITURE_CONFIG,visualConfig:FURNITURE_VISUAL_CONFIG,category:'地毯'}).every(entry=>entry.definition.cat==='地毯'));
console.log('Furniture store selector passed: Prototype/retired hidden, debug catalog complete.');

