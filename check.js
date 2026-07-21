import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {FURNITURE_CONFIG} from './assets/js/config/furniture-config.js';

const root=process.cwd();
const failures=[];
const requireFile=file=>{if(!existsSync(join(root,file)))failures.push(`missing: ${file}`)};
const required=[
  'index.html','manifest.webmanifest','.nojekyll','README.md','CREDITS.md','THIRD_PARTY_NOTICES.md',
  'package.json','package-lock.json','assets/vendor/phaser-3.90.0.min.js','assets/js/main.js',
  'assets/js/scenes/BootScene.js','assets/js/scenes/CafeScene.js',
  'assets/js/systems/GridSystem.js','assets/js/systems/PlacementSystem.js',
  'assets/js/systems/OccupancySystem.js','assets/js/systems/CameraController.js',
  'assets/js/systems/SaveAdapter.js','assets/js/systems/ToastManager.js',
  'assets/js/systems/StartupController.js','tests/browser-smoke.test.js','tests/http.test.js'
];
required.forEach(requireFile);

const packageJson=JSON.parse(readFileSync('package.json','utf8'));
if(packageJson.version!=='0.54.0-alpha.1')failures.push('package version is not 0.54.0-alpha.1');
if(packageJson.dependencies?.phaser!=='3.90.0')failures.push('Phaser dependency is not exactly 3.90.0');
if(!packageJson.devDependencies?.['playwright-core'])failures.push('browser smoke dependency is missing');
const digest=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const phaserDigest='e92ddef111ba42e92d316979c732311757093688ea1810591cb7aa2858eba7a7';
if(existsSync('assets/vendor/phaser-3.90.0.min.js')&&digest('assets/vendor/phaser-3.90.0.min.js')!==phaserDigest)failures.push('local Phaser runtime hash does not match Phaser 3.90.0');

const html=readFileSync('index.html','utf8');
if(/https?:\/\//i.test(html))failures.push('index.html contains an external URL');
if(/legacy/i.test(html))failures.push('index.html loads or references legacy');
if(!html.includes('./assets/vendor/phaser-3.90.0.min.js?v=0540a1'))failures.push('index.html does not load versioned local Phaser');
if(!html.includes('type="module" src="./assets/js/main.js?v=0540a1"'))failures.push('index.html does not load the versioned ES Module entry');
if(!html.includes('window.addEventListener(\'error\''))failures.push('early window error handler is missing');
if(!html.includes('window.addEventListener(\'unhandledrejection\''))failures.push('early unhandledrejection handler is missing');
if(!html.includes('data-boot-reload')||!html.includes('data-boot-clear')||!html.includes('data-state="loading"'))failures.push('bootOverlay error/retry UI is incomplete');
if(/(?:[A-Za-z]:\\|file:\/\/|localhost|127\.0\.0\.1)/i.test(html))failures.push('index.html contains a local absolute path');

const walk=directory=>readdirSync(directory).flatMap(name=>{
  const path=join(directory,name);
  return statSync(path).isDirectory()?walk(path):[path];
});
const formalJs=walk('assets/js').filter(file=>file.endsWith('.js'));
const joined=formalJs.map(file=>readFileSync(file,'utf8')).join('\n');
for(const forbidden of ['resizeWorld','world.style.left','world.style.top','world.style.transform']){
  if(joined.includes(forbidden))failures.push(`formal JavaScript contains forbidden legacy control: ${forbidden}`);
}
if(/pointermove[\s\S]{0,180}(?:toast\.show|emit\(['"]toast)/i.test(joined))failures.push('pointermove directly triggers a toast');
for(const name of ['GridSystem','PlacementSystem','OccupancySystem','CameraController','StartupController']){
  const matches=(joined.match(new RegExp(`class ${name}\\b`,'g'))||[]).length;
  if(matches!==1)failures.push(`${name} class count is ${matches}, expected 1`);
}
for(const file of formalJs){
  const parsed=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(parsed.status!==0)failures.push(`syntax: ${relative(root,file)}: ${parsed.stderr.trim()}`);
}

const configSource=readFileSync('assets/js/config/game-config.js','utf8');
if(!configSource.includes('type:Phaser.CANVAS'))failures.push('renderer is not forced to Phaser.CANVAS');
const timeout=Number(configSource.match(/loader:\{timeout:(\d+)/)?.[1]||0);
if(timeout<=0)failures.push('loader timeout is missing or zero');
if(!configSource.includes('maxRetries:1'))failures.push('loader maxRetries is not 1');
if(!configSource.includes('preBoot:game=>preBoot?.(game)')||!configSource.includes('postBoot:game=>postBoot?.(game)'))failures.push('preBoot/postBoot callbacks are not both preserved');

const bootSource=readFileSync('assets/js/scenes/BootScene.js','utf8');
for(const requiredToken of ["this.load.on('loaderror'","this.load.on('progress'","this.load.on('fileprogress'","this.load.on('complete'",'this.load.svg(','this.load.image(','createFallbackTexture']){
  if(!bootSource.includes(requiredToken))failures.push(`BootScene loader requirement missing: ${requiredToken}`);
}
const startupSource=readFileSync('assets/js/systems/StartupController.js','utf8');
for(const method of ['setStatus(','setProgress(','ready(','fail(','startTimeout(','clearTimeout('])if(!startupSource.includes(method))failures.push(`StartupController method missing: ${method}`);

const saveSource=readFileSync('assets/js/systems/SaveAdapter.js','utf8');
if(!saveSource.includes("CURRENT_KEY='catCafePhaserV0540'"))failures.push('CURRENT_KEY is not catCafePhaserV0540');
if(/setItem\(\s*['"]catCafeDecorV0/.test(saveSource))failures.push('formal SaveAdapter writes a legacy save key');
if(!saveSource.includes('migrationCompletedVersion')||!saveSource.includes('migrationArchive'))failures.push('one-time migration/archive controls are missing');

const gridSource=readFileSync('assets/js/systems/GridSystem.js','utf8');
if(!gridSource.includes('x:(polygon[2].x+polygon[3].x)/2')||!gridSource.includes('y:(polygon[2].y+polygon[3].y)/2'))failures.push('furniture anchor is not the footprint bottom-edge midpoint');
const mainSource=readFileSync('assets/js/main.js','utf8');
if(!/preBoot\(phaserGame\)\{[\s\S]*?new UiBridge\(phaserGame/.test(mainSource))failures.push('UiBridge is not registered inside preBoot');
if(!mainSource.includes('resizeGame();'))failures.push('initial resize is not triggered');

const placementSource=readFileSync('assets/js/systems/PlacementSystem.js','utf8');
if(!placementSource.includes("code:'chair-without-table'")||!placementSource.includes('warnings.push'))failures.push('chair/table relation is not a warning');
if(/blockingReason[^\n]+chair-without-table/.test(placementSource))failures.push('chair warning is used as a blockingReason');
for(const definition of Object.values(FURNITURE_CONFIG)){
  const path=definition.texture.replace(/^\.\//,'');
  if(!existsSync(path))failures.push(`missing furniture texture: ${path}`);
}
if(existsSync('assets/node_modules'))failures.push('node_modules exists inside deploy assets');
const credits=readFileSync('CREDITS.md','utf8');
if(!credits.includes('未使用其他商業遊戲截圖')||!credits.includes('Phaser 3.90.0'))failures.push('asset/licensing record is incomplete');

for(const [name,script] of [['core','./tests/core.test.js'],['HTTP','./tests/http.test.js'],['browser smoke','./tests/browser-smoke.test.js']]){
  const test=spawnSync(process.execPath,[script],{encoding:'utf8',timeout:name==='browser smoke'?180000:30000});
  if(test.status!==0)failures.push(`${name} tests failed: ${test.error?.message||test.stderr||test.stdout}`);
}

function zipEntries(zipPath){
  const data=readFileSync(zipPath);
  let eocd=-1;
  for(let offset=data.length-22;offset>=Math.max(0,data.length-65557);offset--)if(data.readUInt32LE(offset)===0x06054b50){eocd=offset;break}
  if(eocd<0)throw new Error('ZIP end-of-central-directory not found');
  const count=data.readUInt16LE(eocd+10);
  let offset=data.readUInt32LE(eocd+16);
  const names=[];
  for(let index=0;index<count;index++){
    if(data.readUInt32LE(offset)!==0x02014b50)throw new Error(`Invalid ZIP central entry ${index}`);
    const nameLength=data.readUInt16LE(offset+28),extraLength=data.readUInt16LE(offset+30),commentLength=data.readUInt16LE(offset+32);
    names.push(data.subarray(offset+46,offset+46+nameLength).toString('utf8'));
    offset+=46+nameLength+extraLength+commentLength;
  }
  return names;
}
const zipFlag=process.argv.indexOf('--zip');
if(zipFlag>=0){
  const zipPath=process.argv[zipFlag+1];
  if(!zipPath||!existsSync(zipPath))failures.push('ZIP path is missing');
  else try{
    const names=zipEntries(zipPath);
    if(names.some(name=>name.includes('\\')))failures.push('ZIP contains backslash path separators');
    const roots=['index.html','manifest.webmanifest','.nojekyll','README.md','CREDITS.md','THIRD_PARTY_NOTICES.md','check.js'];
    for(const file of roots)if(!names.includes(file))failures.push(`ZIP root missing ${file}`);
    if(names.some(name=>/(^|\/)(node_modules|legacy)(\/|$)/.test(name)))failures.push('ZIP contains node_modules or legacy');
  }catch(error){failures.push(`ZIP validation failed: ${error.message}`)}
}

if(failures.length){
  console.error('V0.54.0-alpha.1 checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log(`V0.54.0-alpha.1 checks passed: Canvas renderer, startup safety, browser smoke, ${formalJs.length} modules and ${Object.keys(FURNITURE_CONFIG).length} furniture assets.`);
