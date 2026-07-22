import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {extname,normalize,resolve} from 'node:path';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {CAT_PROFILES,CAT_ANIMATION_LAYOUT,FALLBACK_CAT} from '../assets/js/config/cat-config.js';

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
const viewports=[{width:390,height:844},{width:393,height:852},{width:430,height:932},{width:844,height:390},{width:1024,height:768},{width:1366,height:768},{width:1440,height:900}];
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
    const state=await page.evaluate(({expectedFurnitureKeys,expectedCatKeys,catIds,states})=>{
      const game=window.__CAT_CAFE_GAME__;
      const canvas=document.querySelector('#phaserGame canvas');
      const scene=game.scene.getScene('CafeScene');
      const report=game.registry.get('furniture-load-report');
      const catReport=game.registry.get('cat-load-report');
      const animationStates={};
      for(const [id,entity] of scene.catEntities){
        animationStates[id]={};
        for(const state of states){entity.setState(state,'down');animationStates[id][state]=entity.sprite.anims.currentAnim?.key||null;}
        entity.playIdle();
      }
      scene.selectCat('bean');
      return {
        phaser:Boolean(window.Phaser),canvasCount:document.querySelectorAll('#phaserGame canvas').length,
        canvasWidth:canvas?.width||0,canvasHeight:canvas?.height||0,
        game:Boolean(game),sceneActive:scene?.sys?.isActive()||false,
        overlayHidden:document.getElementById('bootOverlay')?.classList.contains('hidden')||false,
        rendererType:game.renderer.type,canvasRenderer:game.renderer.type===Phaser.CANVAS,
        missingTextures:expectedFurnitureKeys.filter(key=>!game.textures.exists(key)),
        missingCatTextures:expectedCatKeys.filter(key=>!game.textures.exists(key)),
        missingAnimations:catIds.flatMap(id=>states.flatMap(state=>['down','up'].map(direction=>`cat:${id}:${state}-${direction}`))).filter(key=>!game.anims.exists(key)),
        catCount:scene.catEntities.size,
        interactionReady:Boolean(scene.inputMode&&scene.furnitureDragController&&scene.catBehaviorController),
        inputMode:scene.inputMode?.getMode(),cameraEnabled:scene.cameraController?.isEnabled(),
        catOrigins:[...scene.catEntities.values()].map(entity=>({id:entity.catData.id,x:entity.sprite.originX,y:entity.sprite.originY,depthBias:entity.sprite.depth-entity.sprite.y,selected:entity.selected})),
        animationStates,
        loadReport:report,catReport,hudState:document.body.dataset.hudState,
        unhandled:window.__SMOKE_UNHANDLED__,legacyRaw:localStorage.getItem('catCafeDecorV049'),
        newRaw:localStorage.getItem('catCafePhaserV0540')
      };
    },{
      expectedFurnitureKeys:Object.keys(FURNITURE_CONFIG).map(id=>`furniture:${id}`),
      expectedCatKeys:[...CAT_PROFILES.map(cat=>cat.textureKey),FALLBACK_CAT.textureKey],
      catIds:CAT_PROFILES.map(cat=>cat.id),states:Object.keys(CAT_ANIMATION_LAYOUT)
    });
    const problems=[];
    if(!state.phaser||!state.game)problems.push('Phaser global or game missing');
    if(state.canvasCount!==1||state.canvasWidth<=0||state.canvasHeight<=0)problems.push(`invalid canvas ${state.canvasCount} ${state.canvasWidth}x${state.canvasHeight}`);
    if(!state.sceneActive||!state.overlayHidden)problems.push('CafeScene inactive or overlay visible');
    if(!state.canvasRenderer)problems.push(`renderer is not Canvas (${state.rendererType})`);
    if(state.missingTextures.length)problems.push(`missing textures: ${state.missingTextures.join(',')}`);
    if(state.missingCatTextures.length)problems.push(`missing cat textures: ${state.missingCatTextures.join(',')}`);
    if(state.missingAnimations.length)problems.push(`missing cat animations: ${state.missingAnimations.join(',')}`);
    if(state.catCount<3)problems.push(`only ${state.catCount} cats are active`);
    if(!state.interactionReady)problems.push('interaction controllers are missing');
    if(!state.cameraEnabled)problems.push('camera starts disabled');
    if(state.catOrigins.some(cat=>cat.x!==0.5||cat.y!==1))problems.push(`invalid cat origins: ${JSON.stringify(state.catOrigins)}`);
    if(!state.catOrigins.find(cat=>cat.id==='bean')?.selected)problems.push('cat selection did not update');
    if(Object.values(state.animationStates).some(value=>Object.values(value).some(key=>!key)))problems.push('a cat state has no playable animation');
    if(state.hudState!=='received')problems.push('HUD did not receive state-changed');
    if(pageErrors.length||failedRequests.length||httpErrors.length||state.unhandled.length||consoleFatal.length){
      problems.push(JSON.stringify({pageErrors,failedRequests,httpErrors,unhandled:state.unhandled,consoleFatal}));
    }
    if(scenario.legacy){
      if(state.legacyRaw!==JSON.stringify(scenario.legacy))problems.push('legacy save was modified');
      if(!state.newRaw)problems.push('new Phaser save was not created');
    }
    if(scenario.name==='fresh'&&viewport.width===390){
      const dragPlan=await page.evaluate(()=>{
        const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
        const canvas=document.querySelector('#phaserGame canvas');
        const rect=canvas.getBoundingClientRect();
        const camera=scene.cameras.main;
        const toScreen=point=>({x:rect.left+(point.x-camera.worldView.x)*camera.zoom,y:rect.top+(point.y-camera.worldView.y)*camera.zoom});
        for(const [id,entity] of scene.entities){
          const item=scene.state.items.find(entry=>entry.id===id);
          if(!item||scene.furnitureDragController.furniture[item.type]?.layer!=='floorObject')continue;
          for(let y=0;y<scene.grid.room.floor.rows;y++)for(let x=0;x<scene.grid.room.floor.cols;x++){
            const result=scene.placement.validatePlacement({type:item.type,x,y,rotation:item.r||0,movingItemId:item.id});
            const cells=scene.grid.getFootprintCells(item.type,x,y,item.r||0);
            if(!result.valid||scene.catBehaviorController.isAnyCatInCells(cells)||(x===item.x&&y===item.y))continue;
            const targetAnchor=scene.grid.getAnchor(item.type,x,y,item.r||0);
            return {
              id,targetGrid:{x,y},
              start:toScreen({x:entity.x,y:entity.y-entity.displayHeight*.45}),
              target:toScreen({x:targetAnchor.x,y:targetAnchor.y-entity.displayHeight*.45}),
              camera:{x:camera.scrollX,y:camera.scrollY}
            };
          }
        }
        return null;
      });
      if(!dragPlan)problems.push('no legal furniture drag plan found');
      else{
        await page.mouse.move(dragPlan.start.x,dragPlan.start.y);
        await page.mouse.down();
        await page.mouse.move(dragPlan.target.x,dragPlan.target.y,{steps:12});
        await page.mouse.up();
        await page.waitForTimeout(250);
        const dragResult=await page.evaluate(plan=>{
          const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
          const item=scene.state.items.find(entry=>entry.id===plan.id);
          const camera=scene.cameras.main;
          return {
            item:{x:item.x,y:item.y},camera:{x:camera.scrollX,y:camera.scrollY},
            cameraEnabled:scene.cameraController.isEnabled(),aiPaused:scene.catBehaviorController.getDebugSnapshot().paused,
            saved:JSON.parse(localStorage.getItem('catCafePhaserV0540')).items.some(entry=>entry.id===plan.id&&entry.x===plan.targetGrid.x&&entry.y===plan.targetGrid.y)
          };
        },dragPlan);
        if(dragResult.item.x!==dragPlan.targetGrid.x||dragResult.item.y!==dragPlan.targetGrid.y)problems.push(`furniture drag landed at ${JSON.stringify(dragResult.item)} instead of ${JSON.stringify(dragPlan.targetGrid)}`);
        if(Math.abs(dragResult.camera.x-dragPlan.camera.x)>.01||Math.abs(dragResult.camera.y-dragPlan.camera.y)>.01)problems.push('camera moved during furniture drag');
        if(!dragResult.cameraEnabled||dragResult.aiPaused)problems.push('camera or cat AI did not recover after furniture drag');
        if(!dragResult.saved)problems.push('successful furniture drag was not saved');
      }
      const catsBefore=await page.evaluate(()=>[...window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').catEntities].map(([id,entity])=>[id,entity.sprite.x,entity.sprite.y]));
      await page.waitForTimeout(7000);
      const catsAfter=await page.evaluate(()=>[...window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').catEntities].map(([id,entity])=>[id,entity.sprite.x,entity.sprite.y]));
      if(!catsAfter.some((entry,index)=>Math.hypot(entry[1]-catsBefore[index][1],entry[2]-catsBefore[index][2])>1))problems.push('no cat moved during the 7-second browser observation');

      const careBefore=await page.evaluate(()=>{
        const state=window.gameController.getState();
        return {energy:state.energy,satiety:state.catStats.bean.satiety,care:state.tasks.care||0};
      });
      await page.click('#careBtn');
      await page.click('[data-care-cat="bean"]');
      await page.click('[data-care-action="feed"]');
      await page.waitForSelector('#carePanel[data-phase="perform"]');
      await page.waitForSelector('#carePanel[data-phase="result"]',{timeout:5000});
      const careAfter=await page.evaluate(()=>{
        const state=window.gameController.getState();
        const panel=document.getElementById('carePanel');
        const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
        return {
          energy:state.energy,satiety:state.catStats.bean.satiety,care:state.tasks.care||0,
          phase:panel.dataset.phase,committed:scene.careInteractionController.session?.committed,
          cameraEnabled:scene.cameraController.isEnabled(),catPaused:scene.catBehaviorController.isCatPaused('bean')
        };
      });
      if(careAfter.energy!==careBefore.energy-1||careAfter.satiety!==Math.min(100,careBefore.satiety+14)||careAfter.care!==careBefore.care+1)problems.push(`care result mismatch: ${JSON.stringify({careBefore,careAfter})}`);
      if(careAfter.phase!=='result'||!careAfter.committed||careAfter.cameraEnabled||!careAfter.catPaused)problems.push('care perform/result input lock is invalid');
      await page.click('[data-care-finish]');
      const careCleanup=await page.evaluate(()=>{
        const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
        return {hidden:document.getElementById('carePanel').classList.contains('hidden'),cameraEnabled:scene.cameraController.isEnabled(),catPaused:scene.catBehaviorController.isCatPaused('bean')};
      });
      if(!careCleanup.hidden||!careCleanup.cameraEnabled||careCleanup.catPaused)problems.push(`care cleanup failed: ${JSON.stringify(careCleanup)}`);
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
console.log('Browser smoke passed: seven viewports, fresh/legacy saves, furniture drag, cat motion and one complete care interaction.');
