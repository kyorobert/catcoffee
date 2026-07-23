import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,V0552_REDRAW_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';
import {summarizeFurnitureAssetValidation,validateFurnitureAssetRecord} from '../assets/js/core/furniture-asset-validator.js';
import {inspectRgbaPng} from './helpers/png.js';

const pngByPath={};
for(const id of V0552_REDRAW_FURNITURE_IDS){
  for(const path of Object.values(FURNITURE_VISUAL_CONFIG[id].texturePathByDirection)){
    const canonical=path.split('?')[0];
    pngByPath[canonical]=inspectRgbaPng(resolve(canonical.replace(/^\.\//,'')));
  }
}
const records=V0552_REDRAW_FURNITURE_IDS.map(id=>validateFurnitureAssetRecord({
  id,definition:FURNITURE_CONFIG[id],visual:FURNITURE_VISUAL_CONFIG[id],pngByPath
}));
const report=summarizeFurnitureAssetValidation(records);
assert.equal(report.valid,true,report.failed.map(record=>`${record.id}: ${record.errors.join(', ')}`).join('\n'));
assert.equal(Object.keys(pngByPath).length,100);
console.log('Furniture asset transparency passed: 100 RGBA PNGs, transparent corners, no white cards.');
