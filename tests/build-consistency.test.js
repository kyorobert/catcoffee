import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {APP_VERSION, BUILD_ID, SAVE_KEY, BuildMismatchError, assertBuildConsistency} from '../assets/js/config/build-info.js?v=0551a';

const html = readFileSync('index.html', 'utf8');
assert.equal(BUILD_ID, '0551a');
assert.equal(SAVE_KEY, 'catCafePhaserV0540');
assert.equal(APP_VERSION, 'V0.55.1-alpha｜美術規格與素材清理版');
assert(html.includes('data-build-id="0551a"'));
assert(html.includes("window.__CAT_CAFE_HTML_BUILD_ID__ = '0551a'"));
assert(html.includes('./assets/vendor/phaser-3.90.0.min.js?v=0551a'));
assert(html.includes('./assets/js/main.js?v=0551a'));
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
  if (file.endsWith('.js')) {
    for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.{1,2}\/[^"']+\.js)(\?v=[^"']+)?["']/g)) {
      assert.equal(match[2], '?v=0551a', `${file} has an unversioned or inconsistent import: ${match[0]}`);
    }
  }
}

assert.equal(assertBuildConsistency('0551a'), true);
assert.throws(() => assertBuildConsistency('0550-old'), error => {
  assert(error instanceof BuildMismatchError);
  assert.equal(error.htmlBuildId, '0550-old');
  assert.equal(error.jsBuildId, '0551a');
  assert(error.message.includes('介面版本不一致'));
  return true;
});

const main = readFileSync('assets/js/main.js', 'utf8');
assert(main.indexOf('assertBuildConsistency') < main.indexOf('resolveDomContract(document)'));
assert(main.indexOf('resolveDomContract(document)') < main.indexOf('new SaveAdapter'));
assert(main.indexOf('new SaveAdapter') < main.indexOf('new Phaser.Game'));
assert(readFileSync('assets/js/config/cat-config.js', 'utf8').includes("CAT_ASSET_VERSION = '0551a'"));

console.log(`Build consistency tests passed: ${APP_VERSION}, Build ${BUILD_ID}.`);
