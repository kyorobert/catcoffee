import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {FURNITURE_CONFIG} from './assets/js/config/furniture-config.js';
import {CAT_CONFIG,CAT_PROFILES,CAT_ANIMATION_LAYOUT,FALLBACK_CAT} from './assets/js/config/cat-config.js';

const root=process.cwd();
const failures=[];
const requireFile=file=>{if(!existsSync(join(root,file)))failures.push(`missing: ${file}`)};
const required=[
  'index.html','manifest.webmanifest','.nojekyll','.gitignore','README.md','CREDITS.md','THIRD_PARTY_NOTICES.md',
  'package.json','package-lock.json','assets/vendor/phaser-3.90.0.min.js','assets/js/main.js',
  'assets/js/config/cat-config.js','assets/js/entities/CatEntity.js','assets/js/systems/CatAnimationSystem.js',
  'assets/js/scenes/BootScene.js','assets/js/scenes/CafeScene.js','assets/js/systems/GridSystem.js',
  'assets/js/systems/PlacementSystem.js','assets/js/systems/OccupancySystem.js','assets/js/systems/CameraController.js',
  'assets/js/systems/SaveAdapter.js','assets/js/systems/ToastManager.js','assets/js/systems/StartupController.js',
  'tests/core.test.js','tests/browser-smoke.test.js','tests/http.test.js'
];
required.forEach(requireFile);

const packageJson=JSON.parse(readFileSync('package.json','utf8'));
if(packageJson.version!=='0.54.1-alpha')failures.push('package version is not 0.54.1-alpha');
if(packageJson.dependencies?.phaser!=='3.90.0')failures.push('Phaser dependency is not exactly 3.90.0');
if(!packageJson.devDependencies?.['playwright-core'])failures.push('browser smoke dependency is missing');
const digest=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const phaserDigest='e92ddef111ba42e92d316979c732311757093688ea1810591cb7aa2858eba7a7';
if(existsSync('assets/vendor/phaser-3.90.0.min.js')&&digest('assets/vendor/phaser-3.90.0.min.js')!==phaserDigest)failures.push('local Phaser runtime hash does not match Phaser 3.90.0');

const html=readFileSync('index.html','utf8');
if(/https?:\/\//i.test(html))failures.push('index.html contains an external URL');
if(/legacy/i.test(html))failures.push('index.html loads or references legacy');
if(!html.includes('./assets/vendor/phaser-3.90.0.min.js?v=0541a'))failures.push('index.html does not load versioned local Phaser');
if(!html.includes('type="module" src="./assets/js/main.js?v=0541a"'))failures.push('index.html does not load the v0541a ES Module entry');
if(!html.includes("window.addEventListener('error'"))failures.push('early window error handler is missing');
if(!html.includes("window.addEventListener('unhandledrejection'"))failures.push('early unhandledrejection handler is missing');
if(!html.includes('V0.54.1-alpha｜貓咪角色視覺與動畫重建版'))failures.push('visible version label is missing');
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
for(const name of ['GridSystem','PlacementSystem','OccupancySystem','CameraController','StartupController','CatEntity']){
  const matches=(joined.match(new RegExp(`class ${name}\\b`,'g'))||[]).length;
  if(matches!==1)failures.push(`${name} class count is ${matches}, expected 1`);
}
for(const file of formalJs){
  const parsed=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(parsed.status!==0)failures.push(`syntax: ${relative(root,file)}: ${parsed.stderr.trim()}`);
}

const catEntity=readFileSync('assets/js/entities/CatEntity.js','utf8');
if(!catEntity.includes('scene.add.sprite('))failures.push('CatEntity does not create a Phaser Sprite');
if(!catEntity.includes('.setOrigin(0.5, 1)'))failures.push('CatEntity does not use the shared foot origin');
for(const forbidden of ['localStorage','GridSystem','CameraController'])if(catEntity.includes(forbidden))failures.push(`CatEntity contains forbidden dependency: ${forbidden}`);
if(/const\s+body\s*=\s*scene\.add\.ellipse|scene\.add\.circle\([^;]*profile\.color/.test(catEntity))failures.push('legacy ellipse/circle cat renderer is still active');

const catAnimations=readFileSync('assets/js/systems/CatAnimationSystem.js','utf8');
if(!catAnimations.includes('scene.anims.exists(key)'))failures.push('cat animations are not guarded against duplicate registration');
if(!catAnimations.includes('cat:${catId}:${state}-${direction}'))failures.push('cat animation keys are not ID scoped');
const boot=readFileSync('assets/js/scenes/BootScene.js','utf8');
if(!boot.includes('this.load.spritesheet('))failures.push('BootScene does not load cat Sprite Sheets');
if(!boot.includes('registerCatAnimations('))failures.push('BootScene does not register cat animations');
if(!boot.includes('cat-load-report'))failures.push('BootScene cat fallback report is missing');

function pngSize(file){
  const data=readFileSync(file);
  const signature=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
  if(!signature.every((byte,index)=>data[index]===byte))throw new Error('invalid PNG signature');
  return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
}
const catIds=Object.keys(CAT_CONFIG);
if(catIds.join(',')!=='bean,coal,snow,latte,hana')failures.push(`unexpected cat IDs: ${catIds.join(',')}`);
const catAssets=[...CAT_PROFILES,FALLBACK_CAT];
for(const profile of catAssets){
  const file=profile.spriteSheet.split('?')[0].replace(/^\.\//,'');
  requireFile(file);
  if(!existsSync(file))continue;
  try{
    const {width,height}=pngSize(file);
    if(width%profile.frameWidth||height%profile.frameHeight)failures.push(`${profile.id} sheet is not divisible by its frame size`);
    if(width!==512||height!==384)failures.push(`${profile.id} sheet is ${width}x${height}, expected 512x384`);
  }catch(error){failures.push(`${profile.id} Sprite Sheet: ${error.message}`)}
  if(profile.id!=='fallback'){
    const portrait=profile.portrait.split('?')[0].replace(/^\.\//,'');
    requireFile(portrait);
    if(existsSync(portrait))try{pngSize(portrait)}catch(error){failures.push(`${profile.id} portrait: ${error.message}`)}
  }
}
const expectedKeys=new Set();
for(const id of catIds)for(const state of Object.keys(CAT_ANIMATION_LAYOUT))for(const direction of ['down','up']){
  const key=`cat:${id}:${state}-${direction}`;
  if(expectedKeys.has(key))failures.push(`duplicate animation key: ${key}`);
  expectedKeys.add(key);
}

const gitignore=readFileSync('.gitignore','utf8');
for(const token of ['node_modules/','legacy/','*_backup*/','*.zip','.DS_Store','Thumbs.db'])if(!gitignore.includes(token))failures.push(`.gitignore missing ${token}`);
const credits=readFileSync('CREDITS.md','utf8');
if(!credits.includes('本專案原創製作')||!credits.includes('未加入未授權商業遊戲素材'))failures.push('cat asset authorship/licensing record is incomplete');
const saveSource=readFileSync('assets/js/systems/SaveAdapter.js','utf8');
if(!saveSource.includes("CURRENT_KEY='catCafePhaserV0540'"))failures.push('save key changed unexpectedly');

for(const definition of Object.values(FURNITURE_CONFIG)){
  const path=definition.texture.replace(/^\.\//,'');
  if(!existsSync(path))failures.push(`missing furniture texture: ${path}`);
}

const skipBrowser=process.argv.includes('--skip-browser');
const testScripts=[['core','./tests/core.test.js'],['HTTP','./tests/http.test.js']];
if(!skipBrowser)testScripts.push(['browser smoke','./tests/browser-smoke.test.js']);
else console.warn('Browser smoke skipped by explicit --skip-browser; this is not a full deployment pass.');
for(const [name,script] of testScripts){
  const test=spawnSync(process.execPath,[script],{encoding:'utf8',timeout:name==='browser smoke'?240000:30000});
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
    const roots=['index.html','manifest.webmanifest','.nojekyll','README.md','CREDITS.md','THIRD_PARTY_NOTICES.md','check.js','package.json','package-lock.json'];
    for(const file of roots)if(!names.includes(file))failures.push(`ZIP root missing ${file}`);
    if(names.some(name=>/(^|\/)(node_modules|legacy|tools)(\/|$)/.test(name)))failures.push('ZIP contains node_modules, legacy or tools');
  }catch(error){failures.push(`ZIP validation failed: ${error.message}`)}
}

if(failures.length){
  console.error('V0.54.1-alpha checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log(`V0.54.1-alpha ${skipBrowser?'static checks':'checks'} passed: ${catIds.length} cat IDs, ${expectedKeys.size} animations and ${formalJs.length} modules${skipBrowser?' (browser smoke not run)':' with browser smoke'}.`);
