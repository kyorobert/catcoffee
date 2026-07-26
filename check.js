import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {APP_VERSION, BUILD_ID, SAVE_KEY} from './assets/js/config/build-info.js?v=0576b';
import {REQUIRED_DOM_IDS, REQUIRED_NESTED_SELECTORS} from './assets/js/ui/dom-contract.js?v=0576b';
import {FURNITURE_CONFIG} from './assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,PROTOTYPE_FURNITURE_IDS,V0552_REDRAW_FURNITURE_IDS} from './assets/js/config/furniture-visual-config.js?v=0576b';
import {getPurchasableFurniture} from './assets/js/core/furniture-catalog-selector.js?v=0576b';
import {validateFurnitureVisualConfig} from './assets/js/core/furniture-visual-validator.js?v=0576b';
import {summarizeFurnitureAssetValidation,validateFurnitureAssetRecord} from './assets/js/core/furniture-asset-validator.js?v=0576b';
import {CAT_CONFIG, CAT_PROFILES, FALLBACK_CAT} from './assets/js/config/cat-config.js';
import {ROOM_CONFIG} from './assets/js/config/room-config.js?v=0576b';
import {CURRENT_KEY, MIGRATION_COMPLETED_VERSION} from './assets/js/systems/SaveAdapter.js?v=0576b';
import {inspectRgbaPng} from './tests/helpers/png.js';

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
  'index.html', 'manifest.webmanifest', '.nojekyll', '.gitignore', '.gitattributes', 'README.md', 'CREDITS.md',
  'THIRD_PARTY_NOTICES.md', 'package.json', 'package-lock.json', 'assets/vendor/phaser-3.90.0.min.js',
  'assets/js/main.js', 'assets/js/config/build-info.js', 'assets/js/ui/dom-contract.js',
  'docs/ART_BIBLE.md', 'docs/FURNITURE_AUDIT.md', 'docs/PROTOTYPE_REDRAW_PLAN.md',
  'docs/PROTOTYPE_REDRAW_RESULT.md', 'docs/PROTOTYPE_REDRAW_CONTACT_SHEET.html',
  'docs/V0552_MANUAL_BROWSER_ACCEPTANCE.md',
  'docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_RESULT.md',
  'docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_ACCEPTANCE.md',
  'docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_COMPARISON.html',
  'docs/V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_RESULT.md',
  'docs/V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_ACCEPTANCE.md',
  'docs/V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_COMPARISON.html',
  'docs/evidence/v0576b/metrics.json',
  'docs/evidence/v0576b/mobile-390-ortho-existing-initial.png',
  'docs/evidence/v0576b/mobile-390-ortho-demo-initial.png',
  'docs/evidence/v0576b/mobile-390-toolbar-selected.png',
  'docs/evidence/v0576b/mobile-390-toolbar-cancel-after.png',
  'docs/evidence/v0576b/mobile-390-edge-placement-1x1.png',
  'docs/evidence/v0576b/mobile-390-edge-placement-1x2.png',
  'docs/evidence/v0576b/mobile-390-edge-placement-2x2.png',
  'docs/evidence/v0576b/mobile-390-new-entrance-blocked.png',
  'docs/evidence/v0576b/mobile-390-old-entrance-released.png',
  'docs/evidence/v0576b/mobile-390-zoomin-pan.png',
  'docs/evidence/v0576b/mobile-390-minzoom.png',
  'docs/evidence/v0576b/mobile-390-artdebug.png',
  'docs/evidence/v0576b/mobile-393-toolbar-cancel.png',
  'docs/evidence/v0576b/mobile-430-toolbar-cancel.png',
  'docs/evidence/v0576b/mobile-393-demo-initial.png',
  'docs/evidence/v0576b/mobile-430-demo-initial.png',
  'docs/evidence/v0576b/shell-0576a-before.png',
  'docs/evidence/v0576b/shell-0576b-after.png',
  'docs/evidence/v0576b/entrance-mask-0576a-before.png',
  'docs/evidence/v0576b/entrance-mask-0576b-after.png',
  'docs/evidence/v0576/metrics.json',
  'docs/evidence/v0576/after-390x844-ortho-demo.png',
  'docs/evidence/v0576/after-393x852-ortho-demo.png',
  'docs/evidence/v0576/after-430x932-ortho-demo.png',
  'docs/evidence/v0576/after-390x844-zoomin-pan.png',
  'docs/evidence/v0576/after-390x844-pan-left.png',
  'docs/evidence/v0576/after-390x844-pan-right.png',
  'docs/evidence/v0576/after-390x844-pan-top.png',
  'docs/evidence/v0576/after-390x844-pan-bottom.png',
  'assets/js/systems/FlatProjection.js', 'assets/js/core/projection-mode.js',
  'assets/js/config/flat-projection-presets.js',
  'assets/js/systems/OrthogonalProjection.js', 'assets/js/config/ortho-demo-layout.js',
  'assets/js/config/ortho-room-zones.js', 'assets/js/config/ortho-room-skin.js',
  'assets/js/core/scene-viewport.js', 'assets/js/core/camera-framing.js', 'assets/js/ui/viewport-metrics.js',
  'tests/projection-mode.test.js', 'tests/flat-projection.test.js', 'tests/flat-preset.test.js',
  'tests/ortho-projection.test.js', 'tests/ortho-demo-layout.test.js', 'tests/camera-framing.test.js',
  'tests/ortho-room-zones.test.js', 'tests/ortho-playable-area-skin.test.js',
  'assets/js/config/furniture-visual-config.js', 'assets/js/core/furniture-direction.js',
  'assets/js/core/furniture-catalog-selector.js', 'assets/js/core/furniture-visual-validator.js',
  'assets/js/core/furniture-display-state.js', 'assets/js/core/furniture-asset-validator.js',
  'assets/js/phaser/ArtDebugRenderer.js',
  'assets/js/systems/StartupController.js', 'assets/js/ui/UiBridge.js', 'assets/js/ui/CarePanel.js',
  'assets/js/ui/StorePanel.js', 'assets/js/systems/ToastManager.js',
  'tests/dom-contract.test.js', 'tests/build-consistency.test.js', 'tests/browser-smoke.test.js',
  'tests/core.test.js', 'tests/interaction-core.test.js', 'tests/cat-ai-simulation.test.js',
  'tests/furniture-drag.test.js', 'tests/care-interaction-core.test.js', 'tests/cat-animation.test.js',
  'tests/http.test.js', 'tests/furniture-visual-config.test.js',
  'tests/furniture-art-classification.test.js', 'tests/furniture-store-visibility.test.js',
  'tests/furniture-save-compatibility.test.js', 'tests/furniture-direction.test.js',
  'tests/prototype-redraw-plan.test.js', 'tests/helpers/png.js',
  'tests/prototype-furniture-redraw.test.js', 'tests/furniture-asset-transparency.test.js',
  'tests/furniture-texture-direction.test.js', 'tests/furniture-id-compatibility.test.js',
  'tests/furniture-footprint-regression.test.js', 'tests/furniture-store-reenable.test.js',
  'tests/furniture-save-redraw-compatibility.test.js',
  'tests/entrance-migration.test.js'
];
required.forEach(requireFile);

const packageJson = JSON.parse(read('package.json'));
if (packageJson.version !== '0.57.6-alpha') failures.push('package version must be 0.57.6-alpha');
if (packageJson.dependencies?.phaser !== '3.90.0') failures.push('Phaser must be locked to 3.90.0');
if (packageJson.scripts?.['check:deploy'] !== 'node ./check.js --deploy') failures.push('check:deploy script is inconsistent');
if (packageJson.scripts?.['check:dev'] !== 'node ./check.js --dev') failures.push('check:dev script is inconsistent');
if (JSON.stringify(packageJson.scripts).includes('skip-browser')) failures.push('ambiguous --skip-browser remains in package scripts');

if (APP_VERSION !== 'V0.57.6-alpha｜正交互動與入口清理版') failures.push('APP_VERSION is incorrect');
if (BUILD_ID !== '0576b') failures.push('BUILD_ID is incorrect');
if (SAVE_KEY !== 'catCafePhaserV0540') failures.push('SAVE_KEY changed');
if (CURRENT_KEY !== 'catCafePhaserV0540') failures.push('SaveAdapter CURRENT_KEY changed');
if (MIGRATION_COMPLETED_VERSION !== 5402) failures.push('migrationCompletedVersion must be 5402');
if (ROOM_CONFIG.floor.placeableMask.flat().filter(Boolean).length !== 78) failures.push('orthogonal placeable cell count must be 78');
if (ROOM_CONFIG.floor.placeableMask[0][7] !== false || ROOM_CONFIG.floor.placeableMask[0][8] !== false) failures.push('formal top entrance mask is missing');
if (ROOM_CONFIG.floor.placeableMask[7][8] !== true || ROOM_CONFIG.floor.placeableMask[7][9] !== true) failures.push('legacy bottom entrance cells were not released');

const protectedHashes = {
  'assets/js/config/furniture-config.js': '87a3bbcdf4cb9417c12f2eb4948b7e3ade15416e6c160475183aa51b3aab2de7',
  'assets/js/config/room-config.js': '26673a7301d91d6a63e93e72fbbb8128d7288c27af88c1095414fd26ea6538c8',
  'assets/js/systems/GridSystem.js': 'c0256e1910939fec67839722b2153da6c419956531ac5edd9b6be15f1e53337b',
  'assets/js/systems/SpatialGrid.js': '548a9418a3d921a025a2d35bf8b38f130320dcc7980c7cbde999c2ab91f22583',
  'assets/js/systems/IsoProjection.js': '7b24bdc46630ae043d34bb5b5c3090f662407a512d8e14de0b3599c9545f3a9a',
  'assets/js/systems/FlatProjection.js': '6afcb2ee4a4e05fc9aaf7cb4cd89799465f17a9743e6ba69ae98bceb9e79ac94',
  'assets/js/systems/OrthogonalProjection.js': 'd24de09f55841b7f18ef29de1dd16c5c92a1cb8a89ca4b0ef2c73bff7eea41f6',
  'assets/js/config/ortho-room-zones.js': '350b8a4de7d43c419cf795ffe7cb579b694e254339c905380e75c63e8ba3d7ee',
  'assets/js/core/projection-mode.js': 'ec491ed4dd148942d7520b9b36dcc5c94dc07d69f2ec714d36f0f03499a2ad91',
  'assets/js/config/flat-projection-presets.js': '3ecd24806306d0dba1cbf749aeb9e8ddf4dc5824fa8bf198c5a2908adff40257',
  'assets/js/core/scene-viewport.js': '7835d2b5af146561bc5eabc0563df7d71a25e3c4d585b63f59fa672b8a6f6495',
  'assets/js/core/camera-framing.js': '01530af6e7db0c4234ae92076c4889837999c45e996ada08bcfa4561c6b7ea0c',
  'assets/js/ui/viewport-metrics.js': '2bfe390e3e12813c45a172bd81260af56adaf5d714197cba9cc09127e3c27e45',
  'assets/js/systems/CameraController.js': '3a4caacc90e40cae03a2de54bd8b0a3e39c5f27f5e1f4e16e143dc94b13aac22',
  'assets/js/systems/SaveAdapter.js': '524e807b986f11adddba207772cfcc2b7d12304ffa6f3a43783a8f4335879fbf',
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
if (!html.includes('data-build-id="0576b"')) failures.push('HTML Build ID is missing');
if (!html.includes("window.__CAT_CAFE_HTML_BUILD_ID__ = '0576b'")) failures.push('early HTML Build ID is missing');
if (!html.includes('./assets/vendor/phaser-3.90.0.min.js?v=0576b')) failures.push('versioned local Phaser path is missing');
if (!html.includes('./assets/js/main.js?v=0576b')) failures.push('versioned entry module is missing');
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
  if (source.includes('?v=0552a')) failures.push(`${relative(root, file)} contains obsolete module query v=0552a`);
  if (source.includes('?v=0560a')) failures.push(`${relative(root, file)} contains obsolete module query v=0560a`);
  if (source.includes('?v=0561a')) failures.push(`${relative(root, file)} contains obsolete module query v=0561a`);
  if (source.includes('?v=0570a')) failures.push(`${relative(root, file)} contains obsolete module query v=0570a`);
  if (source.includes('?v=0571a')) failures.push(`${relative(root, file)} contains obsolete module query v=0571a`);
  if (source.includes('?v=0572a')) failures.push(`${relative(root, file)} contains obsolete module query v=0572a`);
  if (source.includes('?v=0573a')) failures.push(`${relative(root, file)} contains obsolete module query v=0573a`);
  if (source.includes('?v=0574a')) failures.push(`${relative(root, file)} contains obsolete module query v=0574a`);
  if (source.includes('?v=0575a')) failures.push(`${relative(root, file)} contains obsolete module query v=0575a`);
  if (source.includes('?v=0575b')) failures.push(`${relative(root, file)} contains obsolete module query v=0575b`);
  if (source.includes('?v=0576a')) failures.push(`${relative(root, file)} contains obsolete module query v=0576a`);
  for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.{1,2}\/[^"']+\.js)(\?v=[^"']+)?["']/g)) {
    if (match[2] !== '?v=0576b') failures.push(`${relative(root, file)} has inconsistent module query: ${match[0]}`);
  }
}

const joined = formalJs.map(file => readFileSync(file, 'utf8')).join('\n');
for (const token of ['resizeWorld', 'world.style.left', 'world.style.top', 'world.style.transform']) if (joined.includes(token)) failures.push(`legacy scene control remains: ${token}`);
if (joined.includes('https://unpkg') || joined.includes('https://cdn.jsdelivr')) failures.push('runtime code depends on a CDN');
if (/node_modules[\\/]+phaser/i.test(joined)) failures.push('runtime code loads Phaser from node_modules');

const roomSkinSource = read('assets/js/config/ortho-room-skin.js');
for (const token of [
  'DEFAULT_ORTHOGONAL_ROOM_SKIN','getOrthogonalCellAppearance','fixed-architecture',
  'zoneFill','playableBoundary','gridBounds','decorAnchors',
  'sideThicknessWorld','bottomThicknessWorld','topExtensionWorld','trimThickness','edgeHighlight'
]) if (!roomSkinSource.includes(token)) failures.push(`Room Skin foundation missing ${token}`);
for (const banned of ['Phaser','document','localStorage','SaveAdapter']) {
  if (new RegExp(`\\b${banned}\\b`).test(roomSkinSource)) failures.push(`Room Skin uses banned token ${banned}`);
}
if (/\bwindow\s*[.\[]/.test(roomSkinSource)) failures.push('Room Skin accesses browser window');
const orthoProjectionSource = read('assets/js/systems/OrthogonalProjection.js');
for (const token of ['zoneFill','decorAnchors','cafeSign','panelInset']) {
  if (orthoProjectionSource.includes(token)) failures.push(`OrthogonalProjection still owns Room Skin token ${token}`);
}
const cafeSceneSource = read('assets/js/scenes/CafeScene.js');
for (const token of ['DEFAULT_ORTHOGONAL_ROOM_SKIN','getOrthogonalCellAppearance','this.grid.isPlaceableCell']) {
  if (!cafeSceneSource.includes(token)) failures.push(`CafeScene Room Skin integration missing ${token}`);
}
for (const token of ["this.selectItem(null)",'this.cameraController?.setEnabled(true)','this.inputMode?.releaseToStable()']) {
  if (!cafeSceneSource.includes(token)) failures.push(`context toolbar cleanup missing ${token}`);
}
const hudCss=read('assets/css/hud.css');
const mobileCss=read('assets/css/mobile.css');
if (!hudCss.includes('min-width:44px')||!hudCss.includes('min-height:44px')) failures.push('context toolbar lacks 44px hit targets');
if (!mobileCss.includes('minmax(44px,1fr)')) failures.push('mobile toolbar does not preserve 44px button columns');
const zonesSource=read('assets/js/config/ortho-room-zones.js');
const roomConfigSource=read('assets/js/config/room-config.js');
for(const token of ['ORTHO_ENTRANCE_CELLS','buildOrthogonalPlaceableMask'])if(!zonesSource.includes(token))failures.push(`entrance zone source missing ${token}`);
if(!roomConfigSource.includes('buildOrthogonalPlaceableMask'))failures.push('room config does not derive its mask from entrance zone metadata');
const dragSource = read('assets/js/phaser/FurnitureDragController.js');
for (const token of ['evaluateCandidate(','lastPlacementEvaluation','candidateSignature(']) {
  if (!dragSource.includes(token)) failures.push(`placement preview/commit unification missing ${token}`);
}

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
if (!saveSource.includes('MIGRATION_COMPLETED_VERSION=5402')) failures.push('SaveAdapter migration gate is not 5402');
if (!saveSource.includes("'entrance-relocated'")) failures.push('SaveAdapter entrance relocation archive is missing');
if (!saveSource.includes('this.readOnly')) failures.push('SaveAdapter demo read-only guard is missing');
if (/setItem\(\s*['"]catCafeDecorV0/.test(saveSource)) failures.push('legacy save key is written');
if (/artStatus|storeVisible|FURNITURE_VISUAL_CONFIG/.test(saveSource)) failures.push('SaveAdapter filters instances through visual status');

const prototypePlan = read('docs/PROTOTYPE_REDRAW_PLAN.md');
const redrawResult = read('docs/PROTOTYPE_REDRAW_RESULT.md');
const auditDocument = read('docs/FURNITURE_AUDIT.md');
const visualSource = read('assets/js/config/furniture-visual-config.js');
const furnitureEntitySource = read('assets/js/entities/FurnitureEntity.js');
const storePanelSource = read('assets/js/ui/StorePanel.js');
const initialItemsSource = saveSource.match(/const initialItems=\[([\s\S]*?)\];/)?.[1] || '';
const assetHashes = new Map();
const whiteCardIds = [];
const textSvgIds = [];
let pngFurnitureCount = 0;
let svgFurnitureCount = 0;
for (const [id, definition] of Object.entries(FURNITURE_CONFIG)) {
  const asset = definition.texture.split('?')[0].replace(/^\.\//, '');
  requireFile(asset);
  if (!existsSync(asset)) continue;
  const hash = digest(asset);
  if (!assetHashes.has(hash)) assetHashes.set(hash, []);
  assetHashes.get(hash).push(id);
  if (asset.endsWith('.png')) pngFurnitureCount++;
  if (asset.endsWith('.svg')) {
    svgFurnitureCount++;
    const source = read(asset);
    if (/<rect[^>]+width=["']150["'][^>]+height=["']112["'][^>]+rx=["']14["'][^>]+fill=["']#fff/i.test(source)) whiteCardIds.push(id);
    if (/<text\b/i.test(source)) textSvgIds.push(id);
  }
}
if (Object.keys(FURNITURE_CONFIG).length !== 47) failures.push('furniture inventory count changed');
if (pngFurnitureCount !== 22 || svgFurnitureCount !== 25) failures.push(`furniture format count changed: PNG ${pngFurnitureCount}, SVG ${svgFurnitureCount}`);
if (whiteCardIds.length !== 25 || textSvgIds.length !== 24) failures.push(`SVG audit mismatch: white cards ${whiteCardIds.length}, text SVG ${textSvgIds.length}`);
if ([...assetHashes.values()].some(ids => ids.length > 1)) failures.push('duplicate furniture asset content detected');
if (PROTOTYPE_FURNITURE_IDS.length !== 25) failures.push('Prototype count must match audited 25');
if (V0552_REDRAW_FURNITURE_IDS.length !== 25) failures.push('V0.55.2 redraw count must be 25');

const visualValidation = validateFurnitureVisualConfig({
  definitions:FURNITURE_CONFIG,
  visualConfig:FURNITURE_VISUAL_CONFIG,
  prototypePlanIds:PROTOTYPE_FURNITURE_IDS,
  assetAudit:{whiteCardIds,textSvgIds}
});
if (!visualValidation.valid) failures.push(`furniture visual validation: ${visualValidation.errors.join('; ')}`);
for (const [id, definition] of Object.entries(FURNITURE_CONFIG)) {
  const visual = FURNITURE_VISUAL_CONFIG[id];
  if (!visual) continue;
  if (visual.footprint.width !== definition.foot[0] || visual.footprint.height !== definition.foot[1]) failures.push(`${id} footprint changed in visual config`);
  if (visual.artStatus === 'prototype') failures.push(`${id} remains Prototype`);
  if (PROTOTYPE_FURNITURE_IDS.includes(id) && !prototypePlan.includes(`| ${id} |`)) failures.push(`${id} absent from redraw plan`);
}
if (!prototypePlan.includes('Prototype remaining: 0')) failures.push('redraw plan does not report Prototype remaining: 0');
if (!redrawResult.includes('Prototype remaining: 0')) failures.push('redraw result does not report Prototype remaining: 0');
const purchasable = getPurchasableFurniture({definitions:FURNITURE_CONFIG,visualConfig:FURNITURE_VISUAL_CONFIG});
if (purchasable.some(entry => ['prototype','retired'].includes(entry.visual.artStatus))) failures.push('normal store selector exposes Prototype/retired');
if (purchasable.length !== 47) failures.push(`normal store count must be 47, found ${purchasable.length}`);
if (!storePanelSource.includes('getPurchasableFurniture')) failures.push('StorePanel does not use the formal catalog selector');
if (PROTOTYPE_FURNITURE_IDS.some(id => storePanelSource.includes(`'${id}'`) || storePanelSource.includes(`"${id}"`))) failures.push('StorePanel hardcodes Prototype IDs');
for (const token of ['getFurnitureDisplayState','display.scale','display.originX','display.texture']) if (!furnitureEntitySource.includes(token)) failures.push(`FurnitureEntity visual integration missing ${token}`);
if (!/else\s*\{[\s\S]*definition\.size/.test(furnitureEntitySource)) failures.push('FurnitureEntity size is not isolated to fallback');
if (!visualSource.includes('interactionSockets') || !visualSource.includes('stationType') || !visualSource.includes('walkBlocking')) failures.push('future furniture interaction metadata is missing');
for (const id of Object.keys(FURNITURE_CONFIG)) if (!auditDocument.includes(`| ${id} |`)) failures.push(`${id} absent from furniture audit`);
for (const token of ['tileWidth | 128','tileHeight | 64','2:1','Prototype']) if (!read('docs/ART_BIBLE.md').includes(token)) failures.push(`Art Bible missing ${token}`);

for (const file of [
  'assets/js/config/furniture-visual-config.js','assets/js/core/furniture-direction.js',
  'assets/js/core/furniture-catalog-selector.js','assets/js/core/furniture-visual-validator.js',
  'assets/js/core/furniture-display-state.js','assets/js/core/furniture-asset-validator.js'
]) {
  const source = read(file);
  for (const banned of ['Phaser','document','window','localStorage']) if (new RegExp(`\\b${banned}\\b`).test(source)) failures.push(`${file} uses banned pure-core token ${banned}`);
}
if (!read('assets/js/phaser/ArtDebugRenderer.js').includes("get('artDebug')==='1'")) failures.push('artDebug query gate is missing');
if (!read('assets/js/phaser/ArtDebugRenderer.js').includes('this.graphics.clear()')) failures.push('Art Debug does not reuse Graphics');

const pngByPath = {};
for (const id of V0552_REDRAW_FURNITURE_IDS) {
  const visual = FURNITURE_VISUAL_CONFIG[id];
  if (!['production','redraw'].includes(visual?.artStatus)) failures.push(`${id} was not upgraded`);
  if (visual?.storeVisible !== true) failures.push(`${id} was not restored to store`);
  if (visual?.sourceFormat !== 'png') failures.push(`${id} runtime format is not PNG`);
  for (const path of Object.values(visual?.texturePathByDirection || {})) {
    const canonical = path.split('?')[0];
    requireFile(canonical.replace(/^\.\//,''));
    if (!existsSync(canonical)) continue;
    try { pngByPath[canonical] = inspectRgbaPng(canonical); }
    catch (error) { failures.push(`${id} PNG decode: ${error.message}`); }
  }
}
const assetRecords = V0552_REDRAW_FURNITURE_IDS.map(id => validateFurnitureAssetRecord({
  id, definition:FURNITURE_CONFIG[id], visual:FURNITURE_VISUAL_CONFIG[id], pngByPath
}));
const assetReport = summarizeFurnitureAssetValidation(assetRecords);
if (!assetReport.valid) failures.push(`furniture asset validation: ${assetReport.failed.map(record=>`${record.id}(${record.errors.join(',')})`).join('; ')}`);
if (Object.keys(pngByPath).length !== 100) failures.push(`expected 100 redraw PNGs, found ${Object.keys(pngByPath).length}`);

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
if (!read('assets/js/config/cat-config.js').includes("CAT_ASSET_VERSION = '0576b'")) failures.push('cat asset version is not 0576b');
if (!read('assets/js/config/furniture-visual-config.js').includes("FURNITURE_REDRAW_ASSET_VERSION = '0576b'")) failures.push('furniture redraw asset version is not 0576b');
for (const definition of Object.values(FURNITURE_CONFIG)) requireFile(definition.texture.split('?')[0].replace(/^\.\//, ''));

const gitignore = read('.gitignore');
for (const token of ['node_modules/', 'legacy/', '*_backup*/', '*.zip', '.DS_Store', 'Thumbs.db']) if (!gitignore.includes(token)) failures.push(`.gitignore missing ${token}`);

const tests = [
  ['DOM contract', './tests/dom-contract.test.js'], ['build consistency', './tests/build-consistency.test.js'],
  ['core', './tests/core.test.js'], ['portable interaction', './tests/interaction-core.test.js'],
  ['grid/projection split compatibility', './tests/grid-projection-compat.test.js'],
  ['projection mode resolver', './tests/projection-mode.test.js'],
  ['flat projection', './tests/flat-projection.test.js'],
  ['flat projection presets', './tests/flat-preset.test.js'],
  ['orthogonal projection', './tests/ortho-projection.test.js'],
  ['orthogonal room zones', './tests/ortho-room-zones.test.js'],
  ['orthogonal playable area / Room Skin', './tests/ortho-playable-area-skin.test.js'],
  ['entrance migration 5402', './tests/entrance-migration.test.js'],
  ['orthogonal demo layout', './tests/ortho-demo-layout.test.js'],
  ['camera framing', './tests/camera-framing.test.js'],
  ['cat AI simulation', './tests/cat-ai-simulation.test.js'], ['furniture drag', './tests/furniture-drag.test.js'],
  ['care interaction', './tests/care-interaction-core.test.js'], ['cat animation', './tests/cat-animation.test.js'],
  ['HTTP', './tests/http.test.js'],
  ['furniture visual config', './tests/furniture-visual-config.test.js'],
  ['furniture art classification', './tests/furniture-art-classification.test.js'],
  ['furniture store visibility', './tests/furniture-store-visibility.test.js'],
  ['furniture save compatibility', './tests/furniture-save-compatibility.test.js'],
  ['furniture direction', './tests/furniture-direction.test.js'],
  ['prototype redraw plan', './tests/prototype-redraw-plan.test.js'],
  ['prototype furniture redraw', './tests/prototype-furniture-redraw.test.js'],
  ['furniture asset transparency', './tests/furniture-asset-transparency.test.js'],
  ['furniture texture direction', './tests/furniture-texture-direction.test.js'],
  ['furniture ID compatibility', './tests/furniture-id-compatibility.test.js'],
  ['furniture footprint regression', './tests/furniture-footprint-regression.test.js'],
  ['furniture store re-enable', './tests/furniture-store-reenable.test.js'],
  ['furniture save redraw compatibility', './tests/furniture-save-redraw-compatibility.test.js']
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
    for (const file of ['index.html', 'manifest.webmanifest', '.nojekyll', '.gitattributes', 'README.md', 'CREDITS.md', 'THIRD_PARTY_NOTICES.md', 'check.js', 'package.json', 'package-lock.json']) if (!names.includes(file)) failures.push(`ZIP root missing ${file}`);
    if (names.some(name => /(^|\/)(node_modules|legacy|tools)(\/|$)/.test(name))) failures.push('ZIP contains node_modules, legacy or tools');
    if (names.some(name => /(^|\/)(\.git)(\/|$)|\.zip$/i.test(name))) failures.push('ZIP contains .git or another ZIP');
    for (const file of [
      'docs/ART_BIBLE.md','docs/FURNITURE_AUDIT.md','docs/PROTOTYPE_REDRAW_PLAN.md',
      'docs/PROTOTYPE_REDRAW_RESULT.md','docs/PROTOTYPE_REDRAW_CONTACT_SHEET.html',
      'docs/V0552_MANUAL_BROWSER_ACCEPTANCE.md',
      'docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_RESULT.md',
      'docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_ACCEPTANCE.md',
      'docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_COMPARISON.html',
      'docs/evidence/v0576/metrics.json'
    ]) if (!names.includes(file)) failures.push(`ZIP missing ${file}`);
    for (const id of PROTOTYPE_FURNITURE_IDS) {
      for (const path of Object.values(FURNITURE_VISUAL_CONFIG[id].texturePathByDirection || {})) {
        const asset=path.split('?')[0].replace(/^\.\//,'');
        if (!names.includes(asset)) failures.push(`ZIP missing redraw asset ${asset}`);
      }
    }
  } catch (error) { failures.push(`ZIP validation failed: ${error.message}`); }
}

if (failures.length) {
  console.error(`${APP_VERSION} ${mode} checks failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`${APP_VERSION} ${mode} checks passed: Build ${BUILD_ID}, ${REQUIRED_DOM_IDS.length} DOM IDs, 13 nested selectors, ${formalJs.length} JavaScript modules${mode === 'dev' ? ', browser smoke' : ''}.`);
