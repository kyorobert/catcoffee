import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_ART_STATUS,FURNITURE_VISUAL_CONFIG,PROTOTYPE_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';

const counts={production:0,redraw:0,prototype:0,retired:0};
let png=0,svg=0,whiteCards=0,textSvg=0;
for(const [id,definition] of Object.entries(FURNITURE_CONFIG)){
  const visual=FURNITURE_VISUAL_CONFIG[id];
  counts[visual.artStatus]++;
  if(definition.texture.endsWith('.png'))png++;
  if(definition.texture.endsWith('.svg')){
    svg++;
    const source=readFileSync(new URL(`../${definition.texture.replace('./','')}`,import.meta.url),'utf8');
    if(/<rect[^>]+width="150"[^>]+height="112"[^>]+rx="14"[^>]+fill="#fff/i.test(source))whiteCards++;
    if(/<text\b/i.test(source))textSvg++;
    assert.equal(visual.artStatus,FURNITURE_ART_STATUS.PROTOTYPE,`${id} SVG classification`);
    assert.equal(visual.storeVisible,false,`${id} prototype store`);
  }
}
assert.deepEqual({png,svg,whiteCards,textSvg},{png:22,svg:25,whiteCards:25,textSvg:24});
assert.deepEqual(counts,{production:18,redraw:4,prototype:25,retired:0});
assert.equal(PROTOTYPE_FURNITURE_IDS.length,25);
console.log('Furniture classification passed: 18 production, 4 redraw, 25 prototype, 0 retired.');

