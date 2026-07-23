import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';

const source=readFileSync(new URL('../assets/js/config/furniture-config.js',import.meta.url));
assert.equal(createHash('sha256').update(source).digest('hex'),'87a3bbcdf4cb9417c12f2eb4948b7e3ade15416e6c160475183aa51b3aab2de7');
assert.equal(Object.keys(FURNITURE_CONFIG).length,47);
assert.equal(new Set(Object.keys(FURNITURE_CONFIG)).size,47);
console.log('Furniture ID/value compatibility passed: V0.55.1 config byte hash unchanged.');
