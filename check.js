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
  'assets/js/core/input-state.js','assets/js/core/grid-pathfinder.js','assets/js/core/cat-behavior-core.js','assets/js/core/care-interaction-core.js',
  'assets/js/phaser/InputModeController.js','assets/js/phaser/FurnitureDragController.js','assets/js/phaser/CatBehaviorController.js','assets/js/phaser/CareInteractionController.js',
  'assets/js/scenes/BootScene.js','assets/js/scenes/CafeScene.js','assets/js/entities/FurnitureEntity.js','assets/js/entities/CatEntity.js',
  'assets/js/entities/CatReactionBubble.js','assets/js/entities/WallDecorationEntity.js','assets/js/ui/CarePanel.js',
  'assets/js/systems/GridSystem.js','assets/js/systems/PlacementSystem.js','assets/js/systems/OccupancySystem.js','assets/js/systems/CameraController.js',
  'assets/js/systems/SaveAdapter.js','tests/core.test.js','tests/interaction-core.test.js','tests/cat-ai-simulation.test.js',
  'tests/furniture-drag.test.js','tests/care-interaction-core.test.js','tests/cat-animation.test.js','tests/http.test.js','tests/browser-smoke.test.js',
  'assets/environment/wall-window.png','assets/environment/menu-board.png'
];
required.forEach(requireFile);

const packageJson=JSON.parse(readFileSync('package.json','utf8'));
if(packageJson.version!=='0.55.0-alpha')failures.push('package version is not 0.55.0-alpha');
if(packageJson.dependencies?.phaser!=='3.90.0')failures.push('Phaser dependency is not exactly 3.90.0');
const digest=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const protectedHashes={
  'assets/js/config/room-config.js':'e201e45bb8f1b4576966ab6a484a8b19ef2767ddc0bd4bdba6df3807d884e368',
  'assets/js/systems/GridSystem.js':'b8f1c48f10f9a30a7893a687e17b36ad8724dcb97856c31599478d3a3550f92f'
};
for(const [file,hash] of Object.entries(protectedHashes))if(existsSync(file)&&digest(file)!==hash)failures.push(`protected room geometry changed: ${file}`);
const phaserDigest='e92ddef111ba42e92d316979c732311757093688ea1810591cb7aa2858eba7a7';
if(existsSync('assets/vendor/phaser-3.90.0.min.js')&&digest('assets/vendor/phaser-3.90.0.min.js')!==phaserDigest)failures.push('local Phaser runtime hash does not match 3.90.0');

const html=readFileSync('index.html','utf8');
if(/https?:\/\//i.test(html))failures.push('index.html contains an external URL');
if(/legacy/i.test(html))failures.push('index.html loads or references legacy');
if(!html.includes('./assets/vendor/phaser-3.90.0.min.js?v=0550a'))failures.push('versioned local Phaser path is missing');
if(!html.includes('type="module" src="./assets/js/main.js?v=0550a"'))failures.push('v0550a entry module is missing');
if(!html.includes('V0.55.0-alpha｜貓咪生命感與沉浸式照顧互動第一階段'))failures.push('visible version text is missing');
if(/(?:[A-Za-z]:\\|file:\/\/|localhost|127\.0\.0\.1)/i.test(html))failures.push('index.html contains a local absolute path');

const walk=directory=>readdirSync(directory).flatMap(name=>{
  const path=join(directory,name);
  return statSync(path).isDirectory()?walk(path):[path];
});
const formalJs=walk('assets/js').filter(file=>file.endsWith('.js'));
for(const file of formalJs){
  const parsed=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(parsed.status!==0)failures.push(`syntax: ${relative(root,file)}: ${parsed.stderr.trim()}`);
}
const joined=formalJs.map(file=>readFileSync(file,'utf8')).join('\n');
for(const forbidden of ['resizeWorld','world.style.left','world.style.top','world.style.transform'])if(joined.includes(forbidden))failures.push(`formal code contains legacy control: ${forbidden}`);

const pureCore=['assets/js/core/input-state.js','assets/js/core/grid-pathfinder.js','assets/js/core/cat-behavior-core.js','assets/js/core/care-interaction-core.js'];
for(const file of pureCore){
  const source=readFileSync(file,'utf8');
  for(const forbidden of ['Phaser','document','window','localStorage'])if(source.includes(forbidden))failures.push(`${file} depends on ${forbidden}`);
}
const furnitureEntity=readFileSync('assets/js/entities/FurnitureEntity.js','utf8');
if(!furnitureEntity.includes('setInteractive(')||!furnitureEntity.includes('setDraggable(this)'))failures.push('FurnitureEntity is not interactive and draggable');
const dragSource=readFileSync('assets/js/phaser/FurnitureDragController.js','utf8');
for(const token of ["input.on('dragstart'","input.on('drag'","input.on('dragend'","addEventListener('pointercancel'",'pointer.positionToCamera(camera)','this.occupancy.removeItem(itemId)','movingItemId: this.drag?.movingItemId','this.cameraController.setEnabled(false)','this.cameraController.setEnabled(true)',"this.catBehaviorController.pause('furniture-drag')","this.catBehaviorController.resume('furniture-drag')"]){
  if(!dragSource.includes(token))failures.push(`FurnitureDragController missing: ${token}`);
}
if(/handlePointerMove[\s\S]{0,600}(?:save\(|emit\(['"]toast)/.test(dragSource))failures.push('pointermove directly saves or emits a toast');
const sceneSource=readFileSync('assets/js/scenes/CafeScene.js','utf8');
if(!sceneSource.includes('this.furnitureDragController?.update(time,delta)')||!sceneSource.includes('this.catBehaviorController?.update(time,delta)'))failures.push('CafeScene.update does not run drag and cat controllers');
if(!sceneSource.includes('this.careInteractionController?.update(time,delta)'))failures.push('CafeScene.update does not run care controller');
if(/fillStyle\(0x8bd0dc|fillRoundedRect\(top\.x\+82/.test(sceneSource))failures.push('placeholder wall rectangles remain active');
const occupancySource=readFileSync('assets/js/systems/OccupancySystem.js','utf8');
if(!occupancySource.includes('getWalkabilitySnapshot()')||!occupancySource.includes("this.layers.get('floorObject').keys()")||occupancySource.match(/getWalkabilitySnapshot\(\)[\s\S]{0,250}floorDecoration/))failures.push('walkability snapshot is missing or rugs block cats');
const catController=readFileSync('assets/js/phaser/CatBehaviorController.js','utf8');
for(const token of ['findPath(','getWalkabilitySnapshot()','speed * Math.max(0, delta) / 1000','onFurnitureLayoutChanged()'])if(!catController.includes(token))failures.push(`CatBehaviorController missing: ${token}`);
const saveSource=readFileSync('assets/js/systems/SaveAdapter.js','utf8');
if(!saveSource.includes("CURRENT_KEY='catCafePhaserV0540'"))failures.push('save key changed unexpectedly');
if(/setItem\(\s*['"]catCafeDecorV0/.test(saveSource))failures.push('legacy save key is written');
if(joined.includes('v=0542a'))failures.push('formal modules mix obsolete v0542a cache queries');
const careSource=readFileSync('assets/js/core/care-interaction-core.js','utf8');
for(const token of ['createCareSession','prepareCareSession','commitCareSession','cancelCareSession'])if(!careSource.includes(token))failures.push(`care core missing ${token}`);
const careController=readFileSync('assets/js/phaser/CareInteractionController.js','utf8');
for(const token of ["pauseCat(catId, 'care-interaction')","resumeCat(catId, 'care-interaction')",'commitCareSession(','cameraController.setEnabled(false)','cameraController.setEnabled(true)'])if(!careController.includes(token))failures.push(`care controller missing ${token}`);

function pngSize(file){
  const data=readFileSync(file);const signature=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
  if(!signature.every((byte,index)=>data[index]===byte))throw new Error('invalid PNG signature');
  return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
}
for(const profile of [...CAT_PROFILES,FALLBACK_CAT]){
  const file=profile.spriteSheet.split('?')[0].replace(/^\.\//,'');requireFile(file);
  if(existsSync(file)){const size=pngSize(file);if(size.width%profile.frameWidth||size.height%profile.frameHeight)failures.push(`${profile.id} frame dimensions do not divide the sheet`)}
}
if(Object.keys(CAT_CONFIG).join(',')!=='bean,coal,snow,latte,hana')failures.push('cat IDs changed');
if(Object.keys(CAT_ANIMATION_LAYOUT).length!==6)failures.push('cat animation layout changed unexpectedly');
for(const definition of Object.values(FURNITURE_CONFIG)){const path=definition.texture.replace(/^\.\//,'');if(!existsSync(path))failures.push(`missing furniture texture: ${path}`)}

const gitignore=readFileSync('.gitignore','utf8');
for(const token of ['node_modules/','legacy/','*_backup*/','*.zip','.DS_Store','Thumbs.db'])if(!gitignore.includes(token))failures.push(`.gitignore missing ${token}`);
const skipBrowser=process.argv.includes('--skip-browser');
const tests=[
  ['core','./tests/core.test.js'],['portable interaction','./tests/interaction-core.test.js'],
  ['cat AI simulation','./tests/cat-ai-simulation.test.js'],['furniture drag','./tests/furniture-drag.test.js'],
  ['care interaction','./tests/care-interaction-core.test.js'],['cat animation','./tests/cat-animation.test.js'],['HTTP','./tests/http.test.js']
];
if(!skipBrowser)tests.push(['browser smoke','./tests/browser-smoke.test.js']);
else console.warn('Browser smoke skipped by explicit --skip-browser; this is not a full deployment pass.');
for(const [name,script] of tests){
  const test=spawnSync(process.execPath,[script],{encoding:'utf8',timeout:name==='browser smoke'?300000:60000});
  if(test.status!==0)failures.push(`${name} tests failed: ${test.error?.message||test.stderr||test.stdout}`);
}

function zipEntries(zipPath){
  const data=readFileSync(zipPath);let eocd=-1;
  for(let offset=data.length-22;offset>=Math.max(0,data.length-65557);offset--)if(data.readUInt32LE(offset)===0x06054b50){eocd=offset;break}
  if(eocd<0)throw new Error('ZIP end-of-central-directory not found');
  const count=data.readUInt16LE(eocd+10);let offset=data.readUInt32LE(eocd+16);const names=[];
  for(let index=0;index<count;index++){
    if(data.readUInt32LE(offset)!==0x02014b50)throw new Error(`Invalid ZIP central entry ${index}`);
    const nameLength=data.readUInt16LE(offset+28),extraLength=data.readUInt16LE(offset+30),commentLength=data.readUInt16LE(offset+32);
    names.push(data.subarray(offset+46,offset+46+nameLength).toString('utf8'));offset+=46+nameLength+extraLength+commentLength;
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
    for(const file of ['index.html','manifest.webmanifest','.nojekyll','README.md','CREDITS.md','THIRD_PARTY_NOTICES.md','check.js','package.json','package-lock.json'])if(!names.includes(file))failures.push(`ZIP root missing ${file}`);
    if(names.some(name=>/(^|\/)(node_modules|legacy|tools)(\/|$)/.test(name)))failures.push('ZIP contains node_modules, legacy or tools');
  }catch(error){failures.push(`ZIP validation failed: ${error.message}`)}
}

if(failures.length){console.error('V0.55.0-alpha checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`V0.55.0-alpha ${skipBrowser?'static checks':'checks'} passed: care rules, animation assets, portable core, drag lifecycle, 60-second cat AI, ${formalJs.length} modules${skipBrowser?' (browser smoke not run)':' and browser smoke'}.`);
