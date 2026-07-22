import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,PROTOTYPE_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';
import {validateFurnitureVisualConfig} from '../assets/js/core/furniture-visual-validator.js';

const plan=readFileSync(new URL('../docs/PROTOTYPE_REDRAW_PLAN.md',import.meta.url),'utf8');
const report=validateFurnitureVisualConfig({
  definitions:FURNITURE_CONFIG,
  visualConfig:FURNITURE_VISUAL_CONFIG,
  prototypePlanIds:PROTOTYPE_FURNITURE_IDS,
  assetAudit:{
    whiteCardIds:Object.entries(FURNITURE_CONFIG).filter(([,d])=>d.texture.endsWith('.svg')).map(([id])=>id),
    textSvgIds:Object.entries(FURNITURE_CONFIG).filter(([,d])=>d.texture.endsWith('.svg')&&readFileSync(new URL(`../${d.texture.replace('./','')}`,import.meta.url),'utf8').includes('<text')).map(([id])=>id)
  }
});

assert.equal(Object.keys(FURNITURE_CONFIG).length,47);
assert.deepEqual(Object.keys(FURNITURE_VISUAL_CONFIG),Object.keys(FURNITURE_CONFIG));
assert.equal(report.valid,true,report.errors.join('\n'));
for(const [id,definition] of Object.entries(FURNITURE_CONFIG)){
  const visual=FURNITURE_VISUAL_CONFIG[id];
  assert.ok(visual.visualScale>0,`${id} scale`);
  assert.ok(visual.anchor.x>=0&&visual.anchor.x<=1&&visual.anchor.y>=0&&visual.anchor.y<=1,`${id} anchor`);
  assert.deepEqual([visual.footprint.width,visual.footprint.height],definition.foot,`${id} footprint`);
  assert.ok(Object.values(visual.textureByDirection).every(key=>key===`furniture:${id}`),`${id} texture key`);
  if(visual.artStatus==='prototype')assert.ok(plan.includes(`| ${id} |`),`${id} redraw plan`);
}
console.log(`Furniture visual config passed: ${report.summary.configured} configured, ${report.warnings.length} expected direction warnings.`);

