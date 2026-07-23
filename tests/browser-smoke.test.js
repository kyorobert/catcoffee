import {chromium} from 'playwright-core';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {extname,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,PROTOTYPE_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js?v=0552a';
import {CAT_PROFILES,CAT_ANIMATION_LAYOUT,FALLBACK_CAT} from '../assets/js/config/cat-config.js';

const root=process.cwd();
const candidates=[
  {name:'chrome',path:'C:/Program Files/Google/Chrome/Application/chrome.exe'},
  {name:'chrome',path:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'},
  {name:'edge',path:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'},
  {name:'edge',path:'C:/Program Files/Microsoft/Edge/Application/msedge.exe'}
];
const available=[...new Map(candidates.filter(item=>existsSync(item.path)).map(item=>[item.name,item])).values()];
if(!available.length)throw new Error('No installed Chrome or Edge executable was found');
if(!process.env.CAT_CAFE_BROWSER_TARGET&&available.length>1){
  for(const target of available){
    const run=spawnSync(process.execPath,[fileURLToPath(import.meta.url)],{
      cwd:root,encoding:'utf8',timeout:360000,env:{...process.env,CAT_CAFE_BROWSER_TARGET:target.name}
    });
    if(run.status!==0)throw new Error(`${target.name} browser smoke failed:\n${run.stderr||run.stdout}`);
    console.log(run.stdout.trim());
  }
  process.exit(0);
}
const selected=available.find(item=>item.name===process.env.CAT_CAFE_BROWSER_TARGET)||available[0];
const executablePath=selected.path;

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer((request,response)=>{
  const requestUrl=new URL(request.url,'http://127.0.0.1');
  const pathname=decodeURIComponent(requestUrl.pathname);
  const relativePath=pathname==='/'?'index.html':pathname.split('/').filter(Boolean).join('/');
  const file=resolve(root,normalize(relativePath));
  if(!file.startsWith(resolve(root))||!existsSync(file)||!statSync(file).isFile()){
    response.writeHead(404);response.end('Not found');return;
  }
  response.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  if(relativePath==='index.html'&&requestUrl.searchParams.get('fixture')==='missing-care'){
    response.end(readFileSync(file,'utf8').replace('id="careBtn"','id="careBtn-missing"'));return;
  }
  if(relativePath==='index.html'&&requestUrl.searchParams.get('fixture')==='build-mismatch'){
    response.end(readFileSync(file,'utf8').replace('data-build-id="0552a"','data-build-id="0550-old"'));return;
  }
  response.end(readFileSync(file));
});
await new Promise(resolveListen=>server.listen(0,'127.0.0.1',resolveListen));
const origin=`http://127.0.0.1:${server.address().port}`;

const legacySave={coins:73421,reputation:912,xp:456,items:[{id:'legacy-chair',type:'chair',x:3,y:3,r:1}]};
const viewports=[{width:390,height:844},{width:393,height:852},{width:430,height:932},{width:844,height:390},{width:1024,height:768},{width:1366,height:768},{width:1440,height:900},{width:1650,height:930}];
const scenarios=[{name:'fresh',legacy:null},{name:'legacy',legacy:legacySave}];
const results=[];
let browser;
try{
  browser=await chromium.launch({executablePath,headless:true});
  for(const fixture of [
    {name:'missing-care',expected:'#careBtn'},
    {name:'build-mismatch',expected:'介面版本不一致'}
  ]){
    const context=await browser.newContext({viewport:{width:1366,height:768}});
    const preserved='{"coins":98765,"sentinel":"keep-me"}';
    await context.addInitScript(value=>localStorage.setItem('catCafePhaserV0540',value),preserved);
    const page=await context.newPage();
    await page.goto(`${origin}/?fixture=${fixture.name}`,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>document.getElementById('bootOverlay')?.dataset.state==='error',null,{timeout:20000});
    const failure=await page.evaluate(()=>({
      error:document.querySelector('[data-boot-error]')?.textContent||'',
      diagnostics:document.querySelector('[data-boot-diagnostics]')?.textContent||'',
      gameCreated:Boolean(window.__CAT_CAFE_GAME__),
      save:localStorage.getItem('catCafePhaserV0540')
    }));
    if(failure.gameCreated)throw new Error(`${fixture.name}: Phaser.Game was created before startup validation`);
    if(!(failure.error+failure.diagnostics).includes(fixture.expected))throw new Error(`${fixture.name}: expected ${fixture.expected}, got ${failure.error}`);
    if(failure.save!==preserved)throw new Error(`${fixture.name}: current save was modified`);
    await context.close();
  }
  for(const scenario of scenarios)for(const viewport of viewports){
    const context=await browser.newContext({viewport});
     await context.addInitScript(({legacy})=>{
       if(!sessionStorage.getItem('__catCafeSmokeInitialized')){
         localStorage.clear();
         if(legacy)localStorage.setItem('catCafeDecorV049',JSON.stringify(legacy));
         sessionStorage.setItem('__catCafeSmokeInitialized','1');
       }
      window.__SMOKE_UNHANDLED__=[];
      window.addEventListener('unhandledrejection',event=>window.__SMOKE_UNHANDLED__.push(String(event.reason?.message||event.reason)));
    },{legacy:scenario.legacy});
    const page=await context.newPage();
    const pageErrors=[],failedRequests=[],httpErrors=[],consoleFatal=[],loadedUrls=[];
    page.on('request',request=>loadedUrls.push(request.url()));
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
        htmlBuildId:document.documentElement.dataset.buildId,jsBuildId:window.__CAT_CAFE_JS_BUILD_ID__,
        gameReady:document.body.dataset.gameReady,
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
        artDebugEnabled:scene.artDebug?.enabled||false,
        catOrigins:[...scene.catEntities.values()].map(entity=>({id:entity.catData.id,x:entity.sprite.originX,y:entity.sprite.originY,depthBias:entity.sprite.depth-entity.sprite.y,selected:entity.selected})),
        animationStates,
        loadReport:report,catReport,hudState:document.body.dataset.hudState,
        unhandled:window.__SMOKE_UNHANDLED__,legacyRaw:localStorage.getItem('catCafeDecorV049'),
        newRaw:localStorage.getItem('catCafePhaserV0540')
      };
    },{
       expectedFurnitureKeys:[...new Set(Object.values(FURNITURE_VISUAL_CONFIG).flatMap(visual=>Object.values(visual.textureByDirection)))],
      expectedCatKeys:[...CAT_PROFILES.map(cat=>cat.textureKey),FALLBACK_CAT.textureKey],
      catIds:CAT_PROFILES.map(cat=>cat.id),states:Object.keys(CAT_ANIMATION_LAYOUT)
    });
    const problems=[];
    if(!state.phaser||!state.game)problems.push('Phaser global or game missing');
    if(state.htmlBuildId!=='0552a'||state.jsBuildId!=='0552a')problems.push(`build mismatch ${state.htmlBuildId}/${state.jsBuildId}`);
    if(state.gameReady!=='1')problems.push(`gameReady is ${state.gameReady}`);
    if(loadedUrls.some(url=>/\?v=0550a(?:$|[&#])/.test(url)||url.includes('?v=0542a')))problems.push('obsolete runtime cache query loaded');
    if(state.canvasCount!==1||state.canvasWidth<=0||state.canvasHeight<=0)problems.push(`invalid canvas ${state.canvasCount} ${state.canvasWidth}x${state.canvasHeight}`);
    if(!state.sceneActive||!state.overlayHidden)problems.push('CafeScene inactive or overlay visible');
    if(!state.canvasRenderer)problems.push(`renderer is not Canvas (${state.rendererType})`);
    if(state.missingTextures.length)problems.push(`missing textures: ${state.missingTextures.join(',')}`);
    if(state.missingCatTextures.length)problems.push(`missing cat textures: ${state.missingCatTextures.join(',')}`);
    if(state.missingAnimations.length)problems.push(`missing cat animations: ${state.missingAnimations.join(',')}`);
    if(state.catCount<3)problems.push(`only ${state.catCount} cats are active`);
    if(!state.interactionReady)problems.push('interaction controllers are missing');
    if(!state.cameraEnabled)problems.push('camera starts disabled');
    if(state.artDebugEnabled)problems.push('Art Debug is active on the normal URL');
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
      await page.click('#openStoreBtn');
      const storeIds=await page.locator('.store-card[data-id]').evaluateAll(cards=>cards.map(card=>card.dataset.id));
       if(storeIds.length!==47)problems.push(`normal store contains ${storeIds.length} items instead of 47`);
       if(PROTOTYPE_FURNITURE_IDS.some(id=>!storeIds.includes(id)))problems.push('a V0.55.2 redraw is missing from the store');
       const redrawThumbnails=await page.locator(PROTOTYPE_FURNITURE_IDS.map(id=>`.store-card[data-id="${id}"] img`).join(',')).evaluateAll(images=>images.map(image=>({src:image.getAttribute('src'),width:image.naturalWidth,height:image.naturalHeight})));
       if(redrawThumbnails.length!==25||redrawThumbnails.some(image=>!image.src?.includes('/redrawn/')||!image.src.endsWith('.png?v=0552a')||image.width<=0||image.height<=0))problems.push(`invalid redraw store thumbnails: ${JSON.stringify(redrawThumbnails)}`);
       const redrawBefore=await page.evaluate(()=>({coins:window.gameController.getState().coins,count:window.gameController.getState().items.length}));
       await page.click('.store-card[data-id="squareCafeTable"]');
       await page.waitForTimeout(100);
       const placementStart=await page.evaluate(()=>{const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');return {mode:scene.inputMode.getMode(),drag:scene.furnitureDragController.drag,hasGhost:Boolean(scene.furnitureDragController.ghost),panelHidden:document.getElementById('storePanel').classList.contains('hidden')}});
       if(!placementStart.hasGhost)throw new Error(`redraw placement did not start: ${JSON.stringify(placementStart)}`);
       const clickPlacementGhost=async()=>{
         const point=await page.evaluate(()=>{
           const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
           const ghost=scene.furnitureDragController.ghost;const camera=scene.cameras.main;const rect=document.querySelector('#phaserGame canvas').getBoundingClientRect();
           return {x:rect.left+(ghost.x-camera.worldView.x)*camera.zoom,y:rect.top+(ghost.y-camera.worldView.y)*camera.zoom};
         });
         await page.mouse.click(point.x,point.y);
         await page.waitForTimeout(200);
       };
       await clickPlacementGhost();
       await page.click('#rotateBtn');
       await page.waitForTimeout(100);
       const placedRedraw=await page.evaluate(()=>{
         const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');const items=scene.state.items.filter(item=>item.type==='squareCafeTable');const item=items.at(-1);
         return {item,texture:item?scene.entities.get(item.id)?.texture?.key:null,coins:scene.state.coins,saved:JSON.parse(localStorage.getItem('catCafePhaserV0540')||'null')?.items?.some(candidate=>candidate.id===item?.id)};
       });
       if(!placedRedraw.item||placedRedraw.item.r!==1||placedRedraw.texture!=='furniture:squareCafeTable:down-left'||!placedRedraw.saved||placedRedraw.coins!==redrawBefore.coins-FURNITURE_CONFIG.squareCafeTable.price)problems.push(`redraw purchase/place/rotate failed: ${JSON.stringify({redrawBefore,placedRedraw})}`);
       await page.reload({waitUntil:'domcontentloaded'});
       await page.waitForFunction(()=>document.body.dataset.gameReady==='1'&&document.getElementById('bootOverlay')?.classList.contains('hidden'),null,{timeout:20000});
       const reloadedRedraw=await page.evaluate(id=>{const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');const item=scene.state.items.find(candidate=>candidate.id===id);return {item,texture:item?scene.entities.get(id)?.texture?.key:null,raw:localStorage.getItem('catCafePhaserV0540'),archive:scene.state.migrationArchive,warnings:scene.state.migrationWarnings}},placedRedraw.item?.id);
       if(!reloadedRedraw.item)throw new Error(`redraw reload item missing: ${JSON.stringify({placedRedraw,reloadedRedraw})}`);
       if(reloadedRedraw.item.x!==placedRedraw.item.x||reloadedRedraw.item.y!==placedRedraw.item.y||reloadedRedraw.item.r!==1||reloadedRedraw.texture!=='furniture:squareCafeTable:down-left')problems.push(`redraw reload failed: ${JSON.stringify(reloadedRedraw)}`);
       await page.evaluate(id=>window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').selectItem(id),placedRedraw.item?.id);
       const selectedRedraw=await page.evaluate(()=>({hidden:document.getElementById('selectionBar').classList.contains('hidden'),selected:window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').selectedId}));
       if(selectedRedraw.hidden)throw new Error(`redraw selection UI hidden: ${JSON.stringify({selectedRedraw,placedRedraw})}`);
       await page.click('#storeBtn');
       const storedRedraw=await page.evaluate(id=>{const state=window.gameController.getState();return {exists:state.items.some(item=>item.id===id),inventory:state.inventory.squareCafeTable||0,coins:state.coins}},placedRedraw.item?.id);
       if(storedRedraw.exists||storedRedraw.inventory<1||storedRedraw.coins!==placedRedraw.coins)problems.push(`redraw storage failed: ${JSON.stringify(storedRedraw)}`);
       await page.click('#openStoreBtn');
       await page.click('.store-card[data-id="squareCafeTable"]');
       await clickPlacementGhost();
       const replacedRedraw=await page.evaluate(()=>{const state=window.gameController.getState();return {count:state.items.filter(item=>item.type==='squareCafeTable').length,inventory:state.inventory.squareCafeTable||0,coins:state.coins}});
       if(replacedRedraw.count<1||replacedRedraw.inventory!==storedRedraw.inventory-1||replacedRedraw.coins!==storedRedraw.coins)problems.push(`redraw inventory replacement failed: ${JSON.stringify(replacedRedraw)}`);
       const dragPlan=await page.evaluate(()=>{
        const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
        const canvas=document.querySelector('#phaserGame canvas');
        const rect=canvas.getBoundingClientRect();
        const camera=scene.cameras.main;
        const toScreen=point=>({x:rect.left+(point.x-camera.worldView.x)*camera.zoom,y:rect.top+(point.y-camera.worldView.y)*camera.zoom});
        for(const [id,entity] of [...scene.entities].sort((left,right)=>right[1].depth-left[1].depth)){
          const item=scene.state.items.find(entry=>entry.id===id);
          if(!item||scene.furnitureDragController.furniture[item.type]?.layer!=='floorObject')continue;
          for(let y=0;y<scene.grid.room.floor.rows;y++)for(let x=0;x<scene.grid.room.floor.cols;x++){
            const result=scene.placement.validatePlacement({type:item.type,x,y,rotation:item.r||0,movingItemId:item.id});
            const cells=scene.grid.getFootprintCells(item.type,x,y,item.r||0);
            if(!result.valid||scene.catBehaviorController.isAnyCatInCells(cells)||(x===item.x&&y===item.y))continue;
            const targetAnchor=scene.grid.getAnchor(item.type,x,y,item.r||0);
            const start=toScreen({x:entity.x,y:entity.y-entity.displayHeight*.45});
            const target=toScreen({x:targetAnchor.x,y:targetAnchor.y-entity.displayHeight*.45});
            const visible=point=>point.x>=rect.left+12&&point.x<=rect.right-12&&point.y>=rect.top+12&&point.y<=rect.bottom-12;
            if(!visible(start)||!visible(target))continue;
            return {
              id,originalGrid:{x:item.x,y:item.y},targetGrid:{x,y},
              start,target,
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
        await page.waitForTimeout(100);
        const dragDownState=await page.evaluate(()=>{const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');return {selected:scene.selectedId,armed:scene.furnitureDragController.armed?.itemId||null,drag:scene.furnitureDragController.drag?.movingItemId||null,mode:scene.inputMode.getMode()}});
        await page.mouse.move(dragPlan.target.x,dragPlan.target.y,{steps:12});
        const dragMoveState=await page.evaluate(()=>{const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');return {selected:scene.selectedId,armed:scene.furnitureDragController.armed?.itemId||null,drag:scene.furnitureDragController.drag?.movingItemId||null,mode:scene.inputMode.getMode(),candidate:scene.furnitureDragController.drag?.candidate||null}});
        await page.mouse.up();
        await page.waitForTimeout(250);
        const expectedGrid=dragMoveState.candidate?{x:dragMoveState.candidate.x,y:dragMoveState.candidate.y}:dragPlan.targetGrid;
        const dragResult=await page.evaluate(plan=>{
          const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
          const item=scene.state.items.find(entry=>entry.id===plan.id);
          const camera=scene.cameras.main;
          const savedState=JSON.parse(localStorage.getItem('catCafePhaserV0540')||'null');
          return {
            item:{x:item.x,y:item.y},camera:{x:camera.scrollX,y:camera.scrollY},
            cameraEnabled:scene.cameraController.isEnabled(),aiPaused:scene.catBehaviorController.getDebugSnapshot().paused,
            saved:Boolean(savedState?.items?.some(entry=>entry.id===plan.id&&entry.x===plan.targetGrid.x&&entry.y===plan.targetGrid.y))
          };
        },{...dragPlan,targetGrid:expectedGrid});
        if(expectedGrid.x===dragPlan.originalGrid.x&&expectedGrid.y===dragPlan.originalGrid.y)problems.push('furniture drag candidate did not leave its original grid');
        if(dragResult.item.x!==expectedGrid.x||dragResult.item.y!==expectedGrid.y)problems.push(`furniture drag landed at ${JSON.stringify(dragResult.item)} instead of ghost candidate ${JSON.stringify(expectedGrid)}; down=${JSON.stringify(dragDownState)} move=${JSON.stringify(dragMoveState)} plan=${JSON.stringify(dragPlan)}`);
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
  const artContext=await browser.newContext({viewport:{width:1366,height:768}});
  const artPage=await artContext.newPage();
  await artPage.goto(origin+'/?artDebug=1',{waitUntil:'domcontentloaded',timeout:20000});
  await artPage.waitForFunction(()=>document.body.dataset.gameReady==='1',null,{timeout:20000});
  const artState=await artPage.evaluate(()=>{
    const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
    return {enabled:scene.artDebug?.enabled,labels:scene.artDebug?.labels?.size||0,graphics:Boolean(scene.artDebug?.graphics),canvasCount:document.querySelectorAll('#phaserGame canvas').length};
  });
  if(!artState.enabled||!artState.graphics||artState.labels<1||artState.canvasCount!==1)throw new Error(`Art Debug failed: ${JSON.stringify(artState)}`);
  results.push({scenario:'art-debug',viewport:'1366x768',...artState,problems:[]});
  await artContext.close();
}finally{
  await browser?.close();
  await new Promise(resolveClose=>server.close(resolveClose));
}

console.log(JSON.stringify({browser:executablePath,results},null,2));
console.log('Browser smoke passed: eight viewports, fresh/legacy saves, 25 redraw thumbnails, Art Debug, furniture drag, cat motion and one complete care interaction.');
