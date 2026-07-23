import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROJECTION_MODE, PROJECTION_QUERY_KEY, resolveProjectionMode, projectionModeFromSearch}
  from '../assets/js/core/projection-mode.js';

// E. Projection mode resolver: default iso, opt-in flat, safe fallback.
assert.equal(PROJECTION_MODE.ISO, 'iso');
assert.equal(PROJECTION_MODE.FLAT, 'flat');
assert.equal(PROJECTION_QUERY_KEY, 'projection');

// resolveProjectionMode(rawValue)
const rawCases = [
  [undefined, 'iso'], [null, 'iso'], ['', 'iso'], ['iso', 'iso'], ['flat', 'flat'],
  ['abc', 'iso'], ['FLAT', 'flat'], [' flat ', 'flat'], ['ISO', 'iso'], ['  ', 'iso'],
  ['Flat', 'flat'], ['flatten', 'iso'], [123, 'iso'], [{}, 'iso'], ['iso ', 'iso']
];
for (const [input, expected] of rawCases) {
  assert.equal(resolveProjectionMode(input), expected, `resolveProjectionMode(${JSON.stringify(input)})`);
}

// projectionModeFromSearch(search)
const searchCases = [
  ['', 'iso'], ['?projection=flat', 'flat'], ['projection=flat', 'flat'], ['?projection=iso', 'iso'],
  ['?projection=abc', 'iso'], ['?projection=', 'iso'], ['?foo=bar', 'iso'],
  ['?projection=flat&artDebug=1', 'flat'], ['?artDebug=1&projection=FLAT', 'flat'],
  ['?projection=%20flat%20', 'flat'], [undefined, 'iso'], [null, 'iso']
];
for (const [search, expected] of searchCases) {
  assert.equal(projectionModeFromSearch(search), expected, `projectionModeFromSearch(${JSON.stringify(search)})`);
}

// Purity: no engine, DOM node or storage access in the resolver source.
const source = readFileSync(new URL('../assets/js/core/projection-mode.js', import.meta.url), 'utf8');
for (const banned of ['Phaser', 'document', 'localStorage', 'SaveAdapter']) {
  assert.ok(!new RegExp(`\\b${banned}\\b`).test(source), `projection-mode must not reference ${banned}`);
}
// `window` must not be referenced (URL parsing is passed in as a string).
assert.ok(!/\bwindow\b/.test(source), 'projection-mode must not read window');

console.log('Projection mode resolver: default iso, ?projection=flat opts in, invalid/empty/non-string fall back to iso; resolver stays pure.');
