import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {APP_VERSION, BUILD_ID, SAVE_KEY} from './assets/js/config/build-info.js?v=0550a1';
import {REQUIRED_DOM_IDS, REQUIRED_NESTED_SELECTORS} from './assets/js/ui/dom-contract.js?v=0550a1';
import {FURNITURE_CONFIG} from './assets/js/config/furniture-config.js';
import {CAT_CONFIG, CAT_PROFILES, FALLBACK_CAT} from './assets/js/config/cat-config.js';

const root = process.cwd();
const mode = process.argv.includes('--dev') ? 'dev' : 'deploy';
const failures = [];
const requireFile = file => { if (!existsSync(join(root, file))) failures.push(`missing: ${file}`); };
const read = file => readFileSync(join(root, file), 'utf8');
const digest = file => createHash('sha256').update(readFileSync(join(root, file))).digest('hex');
const walk = directory => readdirSync(directory).flatMap(name => {
  const path = join(directory, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

const required = [
  'index.html', 'manifest.webmanifest', '.nojekyll', '.gitignore', 'README.md', 'CREDITS.md',
  'THIRD_PARTY_NOTICES.md', 'package.json', 'package-lock.json', 'assets/vendor/phaser-3.90.0.min.js',
  'assets/js/main.js', 'assets/js/config/build-info.js', 'assets/js/ui/dom-contract.js',
  'assets/js/systems/StartupController.js', 'assets/js/ui/UiBridge.js', 'assets/js/ui/CarePanel.js',
  'assets/js/ui/StorePanel.js', 'assets/js/systems/ToastManager.js',
  'tests/dom-contract.test.js', 'tests/build-consistency.test.js', 'tests/browser-smoke.test.js',
  'tests/core.test.js', 'tests/interaction-core.test.js', 'tests/cat-ai-simulation.test.js',
  'tests/furniture-drag.test.js', 'tests/care-interaction-core.test.js', 'tests/cat-animation.test.js',
  'tests/http.test.js'
];
required.forEach(requireFile);

const packageJson = JSON.parse(read('package.json'));
if (packageJson.version !== '0.55.0-alpha.1') failures.push('package version must be 0.55.0-alpha.1');
if (packageJson.dependencies?.phaser !== '3.90.0') failures.push('Phaser must be locked to 3.90.0');
if (packageJson.scripts?.['check:deploy'] !== 'node ./check.js --deploy') failures.push('check:deploy script is inconsistent');
if (packageJson.scripts?.['check:dev'] !== 'node ./check.js --dev') failures.push('check:dev script is inconsistent');
if (JSON.stringify(packageJson.scripts).includes('skip-browser')) failures.push('ambiguous --skip-browser remains in package scripts');

if (APP_VERSION !== 'V0.55.0-alpha.1｜桌面啟動與版本一致性修正版') failures.push('APP_VERSION is incorrect');
if (BUILD_ID !== '0550a1') failures.push('BUILD_ID is incorrect');
if (SAVE_KEY !== 'catCafePhaserV0540') failures.push('SAVE_KEY changed');

const protectedHashes = {
  'assets/js/config/room-config.js': 'e201e45bb8f1b4576966ab6a484a8b19ef2767ddc0bd4bdba6df3807d884e368',
  'assets/js/systems/GridSystem.js': 'b8f1c48f10f9a30a7893a687e17b36ad8724dcb97856c31599478d3a3550f92f',
  'assets/js/systems/OccupancySystem.js': 'c185588cbcba29ec46ec9d173c781faf0fe8bd69f56218ec9bee19992e25c511',
  'assets/js/systems/PlacementSystem.js': 'fecfccaa2178f7e88f6b044bc3e6964db8cda549137c42008ef18ffe6bae37f6',
  'assets/js/core/grid-pathfinder.js': '846a4e6685ae0065da57ce94eb16bfb85fde64700302b2630e55aa451f4b7416',
  'assets/js/core/cat-behavior-core.js': '0c3253e7f7e6b96aa0315f63ea06f00ff7cd3cfeb50454b27c5e6cc9dd04cfda',
  'assets/js/core/care-interaction-core.js': '032d90c272d3ddbde00a36bd40d52603e16cacc3b9535e2bb7d26a960fb042f2',
  'assets/vendor/phaser-3.90.0.min.js': 'e92ddef111ba42e92d316979c732311757093688ea1810591cb7aa2858eba7a7'
};
for (const [file, hash] of Object.entries(protectedHashes)) {
  if (existsSync(file) && digest(file) !== hash) failures.push(`protected core changed: ${file}`);
}

const html = read('index.html');
if (!html.includes('data-build-id="0550a1"')) failures.push('HTML Build ID is missing');
if (!html.includes("window.__CAT_CAFE_HTML_BUILD_ID__ = '0550a1'")) failures.push('early HTML Build ID is missing');
if (!html.includes('./assets/vendor/phaser-3.90.0.min.js?v=0550a1')) failures.push('versioned local Phaser path is missing');
if (!html.includes('./assets/js/main.js?v=0550a1')) failures.push('versioned entry module is missing');
if (!html.includes('window.addEventListener(\'error\'')) failures.push('early window error handler is missing');
if (!html.includes('window.addEventListener(\'unhandledrejection\'')) failures.push('early unhandledrejection handler is missing');
if (!html.includes('data-boot-refresh')) failures.push('cache refresh button is missing');
if (!html.includes('data-boot-diagnostics')) failures.push('boot diagnostics UI is missing');
if (html.includes('data-boot-clear')) failures.push('dangerous data-boot-clear remains');
if (/localStorage\.removeItem/.test(html)) failures.push('boot flow deletes localStorage');
if (/https?:\/\//i.test(html)) failures.push('index.html contains a CDN/external URL');
if (/(?:[A-Za-z]:\\|file:\/\/|localhost|127\.0\.0\.1)/i.test(html)) failures.push('index.html contains a local-only path');

for (const id of REQUIRED_DOM_IDS) if (!new RegExp(`id=["']${id}["']`).test(html)) failures.push(`HTML missing #${id}`);
for (const [parent, selectors] of Object.entries(REQUIRED_NESTED_SELECTORS)) {
  for (const selector of Object.values(selectors)) if (!html.includes(selector.slice(1, -1))) failures.push(`HTML missing ${parent} ${selector}`);
}

const formalJs = walk('assets/js').filter(file => file.endsWith('.js'));
for (const file of formalJs) {
  const parsed = spawnSync(process.execPath, ['--check', file], {encoding: 'utf8'});
  if (parsed.status !== 0) failures.push(`syntax: ${relative(root, file)}: ${parsed.stderr.trim()}`);
  const source = readFileSync(file, 'utf8');
  if (/\?v=0550a(?:["'&#\s]|$)/.test(source)) failures.push(`${relative(root, file)} contains obsolete exact v=0550a`);
  if (source.includes('?v=0542a')) failures.push(`${relative(root, file)} contains obsolete v0542a`);
  for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.{1,2}\/[^"']+\.js)(\?v=[^"']+)?["']/g)) {
    if (match[2] !== '?v=0550a1') failures.push(`${relative(root, file)} has inconsistent module query: ${match[0]}`);
  }
}

const joined = formalJs.map(file => readFileSync(file, 'utf8')).join('\n');
for (const token of ['resizeWorld', 'world.style.left', 'world.style.top', 'world.style.transform']) if (joined.includes(token)) failures.push(`legacy scene control remains: ${token}`);
if (joined.includes('https://unpkg') || joined.includes('https://cdn.jsdelivr')) failures.push('runtime code depends on a CDN');
if (/node_modules[\\/]+phaser/i.test(joined)) failures.push('runtime code loads Phaser from node_modules');

const uiBridge = read('assets/js/ui/UiBridge.js');
if (!uiBridge.includes('this.dom = dom')) failures.push('UiBridge does not receive the DOM contract');
if (uiBridge.includes('getElementById(')) failures.push('UiBridge still queries DOM IDs directly');
for (const token of ['AbortController', 'destroy()', 'this.abortController.abort()']) if (!uiBridge.includes(token)) failures.push(`UiBridge lifecycle missing ${token}`);
for (const file of ['assets/js/ui/CarePanel.js', 'assets/js/ui/StorePanel.js', 'assets/js/systems/ToastManager.js']) {
  if (!read(file).includes('instanceof Element')) failures.push(`${file} does not validate its Element`);
}

const startup = read('assets/js/systems/StartupController.js');
for (const token of ['APP_VERSION', 'BUILD_ID', 'SAVE_KEY', 'startTimeout(', 'fail(error, context', 'data-boot-diagnostics']) if (!startup.includes(token)) failures.push(`StartupController missing ${token}`);
if (startup.includes('localStorage')) failures.push('StartupController must not mutate localStorage');
const main = read('assets/js/main.js');
if (!(main.indexOf('assertBuildConsistency') < main.indexOf('resolveDomContract(document)')
  && main.indexOf('resolveDomContract(document)') < main.indexOf('new SaveAdapter')
  && main.indexOf('new SaveAdapter') < main.indexOf('new Phaser.Game'))) failures.push('bootstrap validation order is incorrect');

const saveSource = read('assets/js/systems/SaveAdapter.js');
if (!saveSource.includes("CURRENT_KEY='catCafePhaserV0540'")) failures.push('SaveAdapter current key changed');
if (/setItem\(\s*['"]catCafeDecorV0/.test(saveSource)) failures.push('legacy save key is written');

function pngSize(file) {
  const data = readFileSync(file);
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((byte, index) => data[index] === byte)) throw new Error('invalid PNG signature');
  return {width: data.readUInt32BE(16), height: data.readUInt32BE(20)};
}
for (const profile of [...CAT_PROFILES, FALLBACK_CAT]) {
  const file = profile.spriteSheet.split('?')[0].replace(/^\.\//, '');
  requireFile(file);
  if (existsSync(file)) {
    const size = pngSize(file);
    if (size.width % profile.frameWidth || size.height % profile.frameHeight) failures.push(`${profile.id} frame dimensions do not divide the sheet`);
  }
}
if (Object.keys(CAT_CONFIG).join(',') !== 'bean,coal,snow,latte,hana') failures.push('cat IDs changed');
if (!read('assets/js/config/cat-config.js').includes("CAT_ASSET_VERSION = '0550a1'")) failures.push('cat asset version is not 0550a1');
for (const definition of Object.values(FURNITURE_CONFIG)) requireFile(definition.texture.split('?')[0].replace(/^\.\//, ''));

const gitignore = read('.gitignore');
for (const token of ['node_modules/', 'legacy/', '*_backup*/', '*.zip', '.DS_Store', 'Thumbs.db']) if (!gitignore.includes(token)) failures.push(`.gitignore missing ${token}`);

const tests = [
  ['DOM contract', './tests/dom-contract.test.js'], ['build consistency', './tests/build-consistency.test.js'],
  ['core', './tests/core.test.js'], ['portable interaction', './tests/interaction-core.test.js'],
  ['cat AI simulation', './tests/cat-ai-simulation.test.js'], ['furniture drag', './tests/furniture-drag.test.js'],
  ['care interaction', './tests/care-interaction-core.test.js'], ['cat animation', './tests/cat-animation.test.js'],
  ['HTTP', './tests/http.test.js']
];
if (mode === 'dev') tests.push(['browser smoke', './tests/browser-smoke.test.js']);
for (const [name, script] of tests) {
  const test = spawnSync(process.execPath, [script], {encoding: 'utf8', timeout: name === 'browser smoke' ? 300000 : 90000});
  if (test.status !== 0) failures.push(`${name} tests failed: ${test.error?.message || test.stderr || test.stdout}`);
}

function zipEntries(zipPath) {
  const data = readFileSync(zipPath);
  let eocd = -1;
  for (let offset = data.length - 22; offset >= Math.max(0, data.length - 65557); offset--) {
    if (data.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error('ZIP end-of-central-directory not found');
  const count = data.readUInt16LE(eocd + 10);
  let offset = data.readUInt32LE(eocd + 16);
  const names = [];
  for (let index = 0; index < count; index++) {
    if (data.readUInt32LE(offset) !== 0x02014b50) throw new Error(`invalid ZIP central entry ${index}`);
    const nameLength = data.readUInt16LE(offset + 28);
    const extraLength = data.readUInt16LE(offset + 30);
    const commentLength = data.readUInt16LE(offset + 32);
    names.push(data.subarray(offset + 46, offset + 46 + nameLength).toString('utf8'));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

const zipFlag = process.argv.indexOf('--zip');
if (zipFlag >= 0) {
  const zipPath = process.argv[zipFlag + 1];
  if (!zipPath || !existsSync(zipPath)) failures.push('ZIP path is missing');
  else try {
    const names = zipEntries(zipPath);
    if (names.some(name => name.includes('\\'))) failures.push('ZIP contains backslash separators');
    for (const file of ['index.html', 'manifest.webmanifest', '.nojekyll', 'README.md', 'CREDITS.md', 'THIRD_PARTY_NOTICES.md', 'check.js', 'package.json', 'package-lock.json']) if (!names.includes(file)) failures.push(`ZIP root missing ${file}`);
    if (names.some(name => /(^|\/)(node_modules|legacy|tools)(\/|$)/.test(name))) failures.push('ZIP contains node_modules, legacy or tools');
    if (names.some(name => /(^|\/)(\.git)(\/|$)|\.zip$/i.test(name))) failures.push('ZIP contains .git or another ZIP');
  } catch (error) { failures.push(`ZIP validation failed: ${error.message}`); }
}

if (failures.length) {
  console.error(`${APP_VERSION} ${mode} checks failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`${APP_VERSION} ${mode} checks passed: Build ${BUILD_ID}, ${REQUIRED_DOM_IDS.length} DOM IDs, 13 nested selectors, ${formalJs.length} JavaScript modules${mode === 'dev' ? ', browser smoke' : ''}.`);
