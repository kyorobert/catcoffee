import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {extname,normalize,resolve} from 'node:path';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';

const root=process.cwd();
const candidates=[
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
];
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('No installed Chrome or Edge executable was found');

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const relativePath=pathname==='/'?'index.html':pathname.split('/').filter(Boolean).join('/');
  const file=resolve(root,normalize(relativePath));
  if(!file.startsWith(resolve(root))||!existsSync(file)||!statSync(file).isFile()){
    response.writeHead(404);response.end('Not found');return;
  }
  response.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  response.end(readFileSync(file));
});
await new Promise(resolveListen=>server.listen(0,'127.0.0.1',resolveListen));
const origin=`http://127.0.0.1:${server.address().port}`;

const legacySave={coins:73421,reputation:912,xp:456,items:[{id:'legacy-chair',type:'chair',x:3,y:3,r:1}]};
const viewports=[{width:390,height:844},{width:430,height:932},{width:1366,height:768}];
const scenarios=[{name:'fresh',legacy:null},{name:'legacy',legacy:legacySave}];
const results=[];
let browser;
try{
  browser=await chromium.launch({executablePath,headless:true});
  for(const scenario of scenarios)for(const viewport of viewports){
    const context=await browser.newContext({viewport});
    await context.addInitScript(({legacy})=>{
      localStorage.clear();
      if(legacy)localStorage.setItem('catCafeDecorV049',JSON.stringify(legacy));
      window.__SMOKE_UNHANDLED__=[];
      window.addEventListener('unhandledrejection',event=>window.__SMOKE_UNHANDLED__.push(String(event.reason?.message||event.reason)));
    },{legacy:scenario.legacy});
    const page=await context.newPage();
    const pageErrors=[],failedRequests=[],httpErrors=[],consoleFatal=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('requestfailed',request=>failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText||''}`));
    page.on('response',response=>{if(response.status()>=400)httpErrors.push(`${response.status()} ${response.url()}`)});
    page.on('console',message=>{if(message.type()==='error')consoleFatal.push(message.text())});
    const response=await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:20000});
    if(response?.status()!==200)throw new Error(`${scenario.name} ${viewport.width}x${viewport.height}: HTTP ${response?.status()}`);
    await page.waitForFunction(()=>{
      const game=window.__CAT_CAFE_GAME__;
      const scene=game?.scene?.getScene('CafeScene');
      return document.body.dataset.gameReady==='1'&&scene?.sys?.isActive()&&document.getElementById('bootOverlay')?.classList.contains('hidden');
    },null,{timeout:20000});
    const state=await page.evaluate(expectedKeys=>{
      const game=window.__CAT_CAFE_GAME__;
      const canvas=document.querySelector('#phaserGame canvas');
      const report=game.registry.get('furniture-load-report');
      return {
        phaser:Boolean(window.Phaser),canvasCount:document.querySelectorAll('#phaserGame canvas').length,
        canvasWidth:canvas?.width||0,canvasHeight:canvas?.height||0,
        game:Boolean(game),sceneActive:game.scene.getScene('CafeScene')?.sys?.isActive()||false,
        overlayHidden:document.getElementById('bootOverlay')?.classList.contains('hidden')||false,
        rendererType:game.renderer.type,canvasRenderer:game.renderer.type===Phaser.CANVAS,
        missingTextures:expectedKeys.filter(key=>!game.textures.exists(key)),
        loadReport:report,hudState:document.body.dataset.hudState,
        unhandled:window.__SMOKE_UNHANDLED__,legacyRaw:localStorage.getItem('catCafeDecorV049'),
        newRaw:localStorage.getItem('catCafePhaserV0540')
      };
    },Object.keys(FURNITURE_CONFIG).map(id=>`furniture:${id}`));
    const problems=[];
    if(!state.phaser||!state.game)problems.push('Phaser global or game missing');
    if(state.canvasCount!==1||state.canvasWidth<=0||state.canvasHeight<=0)problems.push(`invalid canvas ${state.canvasCount} ${state.canvasWidth}x${state.canvasHeight}`);
    if(!state.sceneActive||!state.overlayHidden)problems.push('CafeScene inactive or overlay visible');
    if(!state.canvasRenderer)problems.push(`renderer is not Canvas (${state.rendererType})`);
    if(state.missingTextures.length)problems.push(`missing textures: ${state.missingTextures.join(',')}`);
    if(state.hudState!=='received')problems.push('HUD did not receive state-changed');
    if(pageErrors.length||failedRequests.length||httpErrors.length||state.unhandled.length||consoleFatal.length){
      problems.push(JSON.stringify({pageErrors,failedRequests,httpErrors,unhandled:state.unhandled,consoleFatal}));
    }
    if(scenario.legacy){
      if(state.legacyRaw!==JSON.stringify(scenario.legacy))problems.push('legacy save was modified');
      if(!state.newRaw)problems.push('new Phaser save was not created');
    }
    results.push({scenario:scenario.name,viewport:`${viewport.width}x${viewport.height}`,...state,pageErrors,failedRequests,httpErrors,consoleFatal,problems});
    await context.close();
    if(problems.length)throw new Error(`${scenario.name} ${viewport.width}x${viewport.height}: ${problems.join('; ')}`);
  }
}finally{
  await browser?.close();
  await new Promise(resolveClose=>server.close(resolveClose));
}

console.log(JSON.stringify({browser:executablePath,results},null,2));
console.log('Browser smoke passed: 3 viewports × fresh and legacy localStorage.');
