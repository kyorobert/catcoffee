import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROTOTYPE_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js';

const plan=readFileSync(new URL('../docs/PROTOTYPE_REDRAW_PLAN.md',import.meta.url),'utf8');
for(const id of PROTOTYPE_FURNITURE_IDS)assert.ok(plan.includes(`| ${id} |`),`${id} absent from plan`);
const rows=plan.split('\n').filter(line=>/^\| P[012] \|/.test(line));
assert.equal(rows.length,25);
assert.equal(rows.filter(line=>line.startsWith('| P0 |')).length,10);
assert.equal(rows.filter(line=>line.startsWith('| P1 |')).length,9);
assert.equal(rows.filter(line=>line.startsWith('| P2 |')).length,6);
for(const row of rows){
  const cells=row.split('|').map(cell=>cell.trim()).filter(Boolean);
  assert.ok(cells.length>=10,'brief row incomplete');
  assert.ok(cells[6].length>8,'future art brief too short');
}
console.log('Prototype redraw plan passed: 25 complete briefs (P0 10 / P1 9 / P2 6).');

