import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {APP_VERSION, BUILD_ID, SAVE_KEY, BuildMismatchError, assertBuildConsistency} from '../assets/js/config/build-info.js?v=0577d';

const html = readFileSync('index.html', 'utf8');
const browserSmoke = readFileSync('tests/browser-smoke.test.js', 'utf8');
assert.equal(BUILD_ID, '0577d');
assert.equal(SAVE_KEY, 'catCafePhaserV0540');
assert.equal(APP_VERSION, 'V0.57.7-alpha｜家具旋轉體驗重構版');
assert(html.includes('data-build-id="0577d"'));
assert(html.includes("window.__CAT_CAFE_HTML_BUILD_ID__ = '0577d'"));
assert(html.includes('./assets/vendor/phaser-3.90.0.min.js?v=0577d'));
assert(html.includes('./assets/js/main.js?v=0577d'));
assert(!browserSmoke.includes("'0577c'"), 'browser smoke retains a stale Build ID');
assert(!/https?:\/\//i.test(html), 'runtime HTML must not use a CDN');
assert(!/file:\/\//i.test(html));
assert(!html.includes('data-boot-clear'));
assert(!html.includes("localStorage.removeItem('catCafePhaserV0540')"));

const walk = directory => readdirSync(directory).flatMap(name => {
  const path = join(directory, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const runtimeFiles = ['index.html', 'manifest.webmanifest', ...walk('assets/js').filter(file => file.endsWith('.js'))];
for (const file of runtimeFiles) {
  const source = readFileSync(file, 'utf8');
  assert(!/\?v=0550a(?:["'&#\s]|$)/.test(source), `${file} contains obsolete exact query v=0550a`);
  assert(!source.includes('?v=0542a'), `${file} contains obsolete v0542a`);
  assert(!source.includes('?v=0552a'), `${file} contains obsolete module query v=0552a`);
  assert(!source.includes('?v=0575b'), `${file} contains obsolete module query v=0575b`);
  assert(!source.includes('?v=0576a'), `${file} contains obsolete module query v=0576a`);
  assert(!source.includes('?v=0576b'), `${file} contains obsolete module query v=0576b`);
  if (file.endsWith('.js')) {
    for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.{1,2}\/[^"']+\.js)(\?v=[^"']+)?["']/g)) {
      assert.equal(match[2], '?v=0577d', `${file} has an unversioned or inconsistent import: ${match[0]}`);
    }
  }
}

assert.equal(assertBuildConsistency('0577d'), true);
assert.throws(() => assertBuildConsistency('0550-old'), error => {
  assert(error instanceof BuildMismatchError);
  assert.equal(error.htmlBuildId, '0550-old');
  assert.equal(error.jsBuildId, '0577d');
  assert(error.message.includes('介面版本不一致'));
  return true;
});

const main = readFileSync('assets/js/main.js', 'utf8');
assert(main.indexOf('assertBuildConsistency') < main.indexOf('resolveDomContract(document)'));
assert(main.indexOf('resolveDomContract(document)') < main.indexOf('new SaveAdapter'));
assert(main.indexOf('new SaveAdapter') < main.indexOf('new Phaser.Game'));
assert(readFileSync('assets/js/config/cat-config.js', 'utf8').includes("CAT_ASSET_VERSION = '0577a'"));
assert(readFileSync('assets/js/config/furniture-visual-config.js', 'utf8').includes("FURNITURE_REDRAW_ASSET_VERSION = '0577a'"));

console.log(`Build consistency tests passed: ${APP_VERSION}, Build ${BUILD_ID}.`);
