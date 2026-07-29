import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';

const originalCatalog=Object.fromEntries(
  Object.entries(FURNITURE_CONFIG)
    .filter(([id])=>id!=='pinkTableLongHardCafe')
);
assert.equal(
  createHash('sha256').update(JSON.stringify(originalCatalog)).digest('hex'),
  '190698e6a42f1f294133a977b80eb9fde22b18c595ddb8579f4021eaf63f6810',
  'the original 47 ID/value contracts changed'
);
assert.equal(Object.keys(originalCatalog).length,47);
assert.equal(Object.keys(FURNITURE_CONFIG).length,48);
assert.equal(new Set(Object.keys(FURNITURE_CONFIG)).size,48);
assert.ok(FURNITURE_CONFIG.pinkTableLongHardCafe,'approved independent product missing');
console.log('Furniture ID/value compatibility passed: original 47 semantic contracts unchanged, one approved HardCafe product added.');
