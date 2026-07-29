import {chromium} from 'playwright-core';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {extname,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {FURNITURE_VISUAL_CONFIG,PROTOTYPE_FURNITURE_IDS} from '../assets/js/config/furniture-visual-config.js?v=0577k';
import {ORTHOGONAL_FURNITURE_VISUAL_OVERRIDES}
  from '../assets/js/config/orthogonal-furniture-visuals.js?v=0577k';
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
    response.end(readFileSync(file,'utf8').replace('data-build-id="0577k"','data-build-id="0550-old"'));return;
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
       expectedFurnitureKeys:[...new Set([
         ...Object.values(FURNITURE_VISUAL_CONFIG).flatMap(visual=>Object.values(visual.textureByDirection)),
         ...Object.values(ORTHOGONAL_FURNITURE_VISUAL_OVERRIDES).flatMap(visual=>Object.values(visual.textureByDirection))
       ])],
      expectedCatKeys:[...CAT_PROFILES.map(cat=>cat.textureKey),FALLBACK_CAT.textureKey],
      catIds:CAT_PROFILES.map(cat=>cat.id),states:Object.keys(CAT_ANIMATION_LAYOUT)
    });
    const problems=[];
    if(!state.phaser||!state.game)problems.push('Phaser global or game missing');
    if(state.htmlBuildId!=='0577k'||state.jsBuildId!=='0577k')problems.push(`build mismatch ${state.htmlBuildId}/${state.jsBuildId}`);
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
       if(storeIds.length!==48)problems.push(`normal store contains ${storeIds.length} items instead of 48`);
       if(!storeIds.includes('pinkTableLong')||!storeIds.includes('pinkTableLongHardCafe'))problems.push('approved dual-table products are not both visible in Store');
       if(PROTOTYPE_FURNITURE_IDS.some(id=>!storeIds.includes(id)))problems.push('a V0.55.2 redraw is missing from the store');
       const redrawThumbnails=await page.locator(PROTOTYPE_FURNITURE_IDS.map(id=>`.store-card[data-id="${id}"] img`).join(',')).evaluateAll(images=>images.map(image=>({src:image.getAttribute('src'),width:image.naturalWidth,height:image.naturalHeight})));
       if(redrawThumbnails.length!==25||redrawThumbnails.some(image=>!image.src?.includes('/redrawn/')||!image.src.endsWith('.png?v=0577a')||image.width<=0||image.height<=0))problems.push(`invalid redraw store thumbnails: ${JSON.stringify(redrawThumbnails)}`);
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
       await page.click('#cancelPlacementBtn');
       const hardCafeBefore=await page.evaluate(()=>({
         coins:window.gameController.getState().coins,
         count:window.gameController.getState().items.filter(
           item=>item.type==='pinkTableLongHardCafe'
         ).length
       }));
       await page.click('#openStoreBtn');
       await page.click('.store-card[data-id="pinkTableLongHardCafe"]');
       await clickPlacementGhost();
       await page.click('#rotateBtn');
       await page.waitForTimeout(100);
       const placedHardCafe=await page.evaluate(()=>{
         const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
         const item=scene.state.items.filter(
           candidate=>candidate.type==='pinkTableLongHardCafe'
         ).at(-1);
         return {
           item,
           texture:item?scene.entities.get(item.id)?.texture?.key:null,
           coins:scene.state.coins,
           saved:JSON.parse(localStorage.getItem('catCafePhaserV0540')||'null')
             ?.items?.some(candidate=>candidate.id===item?.id)
         };
       });
       if(
         !placedHardCafe.item
         || placedHardCafe.item.r!==1
         || placedHardCafe.texture!=='furniture:pinkTableLongHardCafe'
         || !placedHardCafe.saved
         || placedHardCafe.coins
           !==hardCafeBefore.coins-FURNITURE_CONFIG.pinkTableLongHardCafe.price
         || hardCafeBefore.count+1
           !==await page.evaluate(()=>window.gameController.getState().items.filter(
             item=>item.type==='pinkTableLongHardCafe'
           ).length)
       ){
         problems.push(`HardCafe purchase/place/rotate failed: ${JSON.stringify({
           hardCafeBefore,
           placedHardCafe
         })}`);
       }
       await page.reload({waitUntil:'domcontentloaded'});
       await page.waitForFunction(
         ()=>document.body.dataset.gameReady==='1'
           &&document.getElementById('bootOverlay')?.classList.contains('hidden'),
         null,
         {timeout:20000}
       );
       const reloadedHardCafe=await page.evaluate(id=>{
         const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
         const item=scene.state.items.find(candidate=>candidate.id===id);
         return {
           item,
           texture:item?scene.entities.get(id)?.texture?.key:null
         };
       },placedHardCafe.item?.id);
       if(
         !reloadedHardCafe.item
         || reloadedHardCafe.item.r!==1
         || reloadedHardCafe.texture!=='furniture:pinkTableLongHardCafe'
       ) problems.push(`HardCafe reload failed: ${JSON.stringify(reloadedHardCafe)}`);
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

      // ARCH-0577C: the furniture edit bar REPLACES the bottom nav in-place. While
      // an item is selected the nav must be gone (not a second floating bar over the
      // Canvas), and the real cancel button must restore the nav so it can be used.
      const editReplace=await page.evaluate(()=>{
        const bar=document.getElementById('gameBottomBar');
        const nav=bar.querySelector('.bottom-nav');
        const selection=document.getElementById('selectionBar');
        return {
          mode:bar.dataset.mode,
          navHidden:!nav||nav.offsetParent===null,
          editVisible:!selection.classList.contains('hidden')&&selection.offsetParent!==null,
          navInsideBar:bar.contains(nav),editInsideBar:bar.contains(selection)
        };
      });
      if(editReplace.mode!=='edit'||!editReplace.navHidden||!editReplace.editVisible||!editReplace.navInsideBar||!editReplace.editInsideBar)problems.push(`edit mode did not replace bottom nav in-place: ${JSON.stringify(editReplace)}`);
      await page.click('#cancelPlacementBtn');
      const navRestored=await page.evaluate(()=>{
        const bar=document.getElementById('gameBottomBar');
        const nav=bar.querySelector('.bottom-nav');
        return {mode:bar.dataset.mode,navVisible:nav&&nav.offsetParent!==null,selected:window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').selectedId};
      });
      if(navRestored.mode!=='nav'||!navRestored.navVisible||navRestored.selected!==null)problems.push(`bottom nav did not return after cancel: ${JSON.stringify(navRestored)}`);
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
  // ARCH-0576A: use real mobile touch events at each context-toolbar button's
  // geometric centre. The furniture selection setup is deterministic, while every
  // action itself goes through the browser's pointer/click pipeline.
  for(const viewport of [{width:390,height:844},{width:393,height:852},{width:430,height:932}]){
    for(const action of [
      {id:'cancelPlacementBtn',kind:'cancel'},
      {id:'rotateBtn',kind:'rotate'},
      {id:'storeBtn',kind:'store'},
      {id:'sellBtn',kind:'sell'}
    ]){
      const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1});
      await context.addInitScript(()=>localStorage.clear());
      const page=await context.newPage();
      const pageErrors=[];
      page.on('pageerror',error=>pageErrors.push(error.message));
      await page.goto(origin+'/?projection=ortho',{waitUntil:'domcontentloaded',timeout:20000});
      await page.waitForFunction(()=>document.body.dataset.gameReady==='1',null,{timeout:20000});
      const before=await page.evaluate(()=>{
        const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
        const item=scene.state.items.find(entry=>entry.type==='plant')||scene.state.items[0];
        scene.selectItem(item.id);
        const raw=structuredClone(scene.state);
        return {
          id:item.id,type:item.type,r:item.r||0,coins:raw.coins,
          inventory:raw.inventory[item.type]||0,x:item.x,y:item.y,
          camera:{x:scene.cameras.main.scrollX,y:scene.cameras.main.scrollY,zoom:scene.cameras.main.zoom}
        };
      });
      // Mimic a Safari visualViewport height change before exercising the toolbar.
      await page.setViewportSize({width:viewport.width,height:Math.max(620,viewport.height-96)});
      await page.setViewportSize(viewport);
      await page.waitForTimeout(50);
      const hit=await page.evaluate(buttonId=>{
        const button=document.getElementById(buttonId);
        const rect=button.getBoundingClientRect();
        window.__CONTEXT_ACTION_CLICKS__=0;
        button.addEventListener('click',()=>window.__CONTEXT_ACTION_CLICKS__++,{once:false});
        const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
        const top=document.elementFromPoint(x,y);
        return {x,y,width:rect.width,height:rect.height,topId:top?.id||'',disabled:button.disabled};
      },action.id);
      if(hit.width<44||hit.height<44)throw new Error(`${viewport.width} ${action.id}: unsafe hit target ${hit.width}x${hit.height}`);
      if(hit.topId!==action.id||hit.disabled)throw new Error(`${viewport.width} ${action.id}: centre hit ${hit.topId}, disabled=${hit.disabled}`);
      await page.touchscreen.tap(hit.x,hit.y);
      await page.waitForTimeout(160);
      const after=await page.evaluate(({before,kind})=>{
        const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
        const item=scene.state.items.find(entry=>entry.id===before.id);
        const saved=JSON.parse(localStorage.getItem('catCafePhaserV0540')||'null');
        return {
          clickCount:window.__CONTEXT_ACTION_CLICKS__,
          selectedId:scene.selectedId,
          toolbarHidden:document.getElementById('selectionBar').classList.contains('hidden'),
          mode:scene.inputMode.getMode(),
          cameraEnabled:scene.cameraController.isEnabled(),
          camera:{x:scene.cameras.main.scrollX,y:scene.cameras.main.scrollY,zoom:scene.cameras.main.zoom},
          item:item?{x:item.x,y:item.y,r:item.r||0}:null,
          coins:scene.state.coins,inventory:scene.state.inventory[before.type]||0,
          savedItem:saved?.items?.find(entry=>entry.id===before.id)||null,
          kind
        };
      },{before,kind:action.kind});
      if(after.clickCount!==1)throw new Error(`${viewport.width} ${action.id}: click count ${after.clickCount}`);
      if(!after.cameraEnabled)throw new Error(`${viewport.width} ${action.id}: camera stayed disabled`);
      if(Math.abs(after.camera.x-before.camera.x)>.01||Math.abs(after.camera.y-before.camera.y)>.01||Math.abs(after.camera.zoom-before.camera.zoom)>.001){
        throw new Error(`${viewport.width} ${action.id}: toolbar touch moved camera`);
      }
      if(action.kind==='cancel'){
        if(after.selectedId!==null||!after.toolbarHidden||after.mode!=='idle')throw new Error(`${viewport.width} cancel did not clear selection: ${JSON.stringify(after)}`);
        if(!after.item||after.item.x!==before.x||after.item.y!==before.y||after.item.r!==before.r||after.coins!==before.coins||after.inventory!==before.inventory){
          throw new Error(`${viewport.width} cancel mutated game data: ${JSON.stringify({before,after})}`);
        }
        // Repeating select/cancel must remain stable and never leave stale UI state.
        await page.evaluate(id=>window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').selectItem(id),before.id);
        const repeat=await page.locator('#cancelPlacementBtn').boundingBox();
        await page.touchscreen.tap(repeat.x+repeat.width/2,repeat.y+repeat.height/2);
        await page.waitForTimeout(80);
        const repeated=await page.evaluate(()=>{const s=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');return {selected:s.selectedId,hidden:document.getElementById('selectionBar').classList.contains('hidden'),mode:s.inputMode.getMode()}});
        if(repeated.selected!==null||!repeated.hidden||repeated.mode!=='idle')throw new Error(`${viewport.width} repeat cancel is unstable: ${JSON.stringify(repeated)}`);
      }else if(action.kind==='rotate'){
        if(!after.item||after.item.r!==(before.r+1)%4||after.savedItem?.r!==after.item.r)throw new Error(`${viewport.width} rotate failed: ${JSON.stringify(after)}`);
      }else if(action.kind==='store'){
        if(after.item||after.inventory!==before.inventory+1||after.coins!==before.coins||after.mode!=='idle')throw new Error(`${viewport.width} store failed: ${JSON.stringify(after)}`);
      }else if(action.kind==='sell'){
        if(after.item||after.coins!==before.coins+Math.floor((FURNITURE_CONFIG[before.type].price||0)*.5)||after.mode!=='idle')throw new Error(`${viewport.width} sell failed: ${JSON.stringify(after)}`);
      }
      if(pageErrors.length)throw new Error(`${viewport.width} ${action.id}: ${pageErrors.join('; ')}`);
      results.push({scenario:`context-${action.kind}`,viewport:`${viewport.width}x${viewport.height}`,hit,after,problems:[]});
      await context.close();
    }
  }
  {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const migrationFixture={
      sceneSchemaVersion:5401,migrationCompletedVersion:5401,coins:2468,
      inventory:{chair:4,doubleCatTree:2,catCastle:1},
      migrationWarnings:[],migrationArchive:[],
      items:[
        {id:'entrance-1x1',type:'chair',x:7,y:0,r:0},
        {id:'entrance-1x2',type:'doubleCatTree',x:8,y:0,r:0},
        {id:'entrance-2x2',type:'catCastle',x:6,y:0,r:0},
        {id:'released-bottom',type:'chair',x:9,y:7,r:0}
      ]
    };
    await context.addInitScript(value=>{
      if(sessionStorage.getItem('__entranceMigrationFixture'))return;
      localStorage.setItem('catCafePhaserV0540',JSON.stringify(value));
      sessionStorage.setItem('__entranceMigrationFixture','1');
    },migrationFixture);
    const page=await context.newPage();
    await page.goto(origin+'/?projection=ortho',{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>document.body.dataset.gameReady==='1',null,{timeout:20000});
    await page.waitForTimeout(100);
    const first=await page.evaluate(()=>{
      const s=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
      return {
        version:s.state.migrationCompletedVersion,
        ids:s.state.items.map(item=>item.id),
        inventory:structuredClone(s.state.inventory),
        archive:s.state.migrationArchive.filter(entry=>entry.migrationVersion===5402),
        warnings:s.state.migrationWarnings.filter(entry=>entry.reason==='entrance-relocated'),
        toast:document.getElementById('gameToast').textContent,
        toastVisible:document.getElementById('gameToast').classList.contains('show')
      };
    });
    if(first.version!==5402||first.ids.join(',')!=='released-bottom'||first.archive.length!==3||first.warnings.length!==3){
      throw new Error(`browser entrance migration failed: ${JSON.stringify(first)}`);
    }
    if(!first.toastVisible||!first.toast.includes('3 件家具已安全收納'))throw new Error(`migration toast missing: ${first.toast}`);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.dataset.gameReady==='1',null,{timeout:20000});
    await page.waitForTimeout(100);
    const second=await page.evaluate(()=>{const s=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');return {
      inventory:structuredClone(s.state.inventory),
      archive:s.state.migrationArchive.filter(entry=>entry.migrationVersion===5402),
      warnings:s.state.migrationWarnings.filter(entry=>entry.reason==='entrance-relocated'),
      toast:document.getElementById('gameToast').textContent,
      toastVisible:document.getElementById('gameToast').classList.contains('show')
    }});
    if(JSON.stringify(second.inventory)!==JSON.stringify(first.inventory)||second.archive.length!==3||second.warnings.length!==3||second.toastVisible){
      throw new Error(`browser entrance migration is not idempotent: ${JSON.stringify({first,second})}`);
    }
    results.push({scenario:'entrance-migration-5402',viewport:'390x844',first,second,problems:[]});
    await context.close();
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
  // Orthogonal prototype: existing layout + demo layout boot cleanly on a portrait phone.
  for(const ortho of [
    {name:'ortho-existing',query:'?projection=ortho',demo:false},
    {name:'ortho-demo',query:'?projection=ortho&demoLayout=1&artDebug=1',demo:true}
  ]){
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(()=>localStorage.clear());
    const page=await context.newPage();
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')pageErrors.push('console:'+message.text())});
    await page.goto(origin+'/'+ortho.query,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>document.body.dataset.gameReady==='1'&&document.getElementById('bootOverlay')?.classList.contains('hidden'),null,{timeout:20000});
    const state=await page.evaluate(()=>{
      const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
      const saved=JSON.parse(localStorage.getItem('catCafePhaserV0540')||'null');
      const cats=[...scene.catEntities.values()].map(entity=>({x:entity.sprite.x,y:entity.sprite.y}));
      const targetTypes=new Set([
        'counter','coffeeMachine','oven','washStation','dessert','smartOrder',
        'pinkTableLong','pinkTableLongHardCafe','roundTable','chair',
        'creamSofa','doubleCatTree','scratchPost'
      ]);
      const targetEntities=[...scene.entities.values()]
        .filter(entity=>targetTypes.has(entity.item.type))
        .map(entity=>({type:entity.item.type,texture:entity.texture.key}));
      const rotationCalibration={};
      for(const type of ['pinkTableLong','pinkTableLongHardCafe','counter','chair','dessert']){
        let entity=[...scene.entities.values()].find(candidate=>candidate.item.type===type);
        let temporary=false;
        if(!entity){
          const item={id:`rotation-smoke-${type}`,type,x:3,y:3,r:0};
          scene.addFurnitureEntity(item);
          entity=scene.entities.get(item.id);
          temporary=true;
        }
        const original=entity.item.r||0;
        rotationCalibration[type]=[];
        for(let rotation=0;rotation<4;rotation++){
          entity.item.r=rotation;entity.sync();
          rotationCalibration[type].push({
            rotation,x:entity.x,y:entity.y,texture:entity.texture.key
          });
        }
        entity.item.r=original;entity.sync();
        if(temporary){
          entity.destroy();
          scene.entities.delete(entity.item.id);
        }
      }
      const cam=scene.cameras.main;
      const room=scene.cameraController.getRoomBounds();
      const core=scene.cameraController.getCoreBounds();
      const viewW=cam.width/cam.zoom,viewH=cam.height/cam.zoom;
      return {
        mode:scene.projectionMode,demo:Boolean(scene.demoLayoutActive),
        entities:scene.entities.size,stateItems:scene.state.items.length,
        saveExists:Boolean(saved),
        savedLeak:saved?('projection' in saved||'demoLayout' in saved):false,
        catsFinite:cats.length>0&&cats.every(cat=>Number.isFinite(cat.x)&&Number.isFinite(cat.y)),
        artDebug:scene.artDebug?.enabled||false,
        targetEntities,
        rotationCalibration,
        roomSkinId:scene.orthoRoomSkin?.id||null,
        shellRole:scene.orthoRoomSkin?.shell?.role||null,
        canvasRenderer:window.__CAT_CAFE_GAME__.renderer.type===Phaser.CANVAS,
        // ARCH-0573 mobile framing: full-bleed the CORE gameplay region (no crop), while the
        // whole ROOM is the zoom-out/pan range so the outer columns crop on the first screen.
        fitZoom:cam.zoom,minZoom:scene.cameraController.minZoom||0,
        coreFullyVisible:(viewW>=core.width-1)&&(viewH>=core.height-1),
        roomWidthCrops:viewW<room.width-1,
        canZoomOutToRoom:cam.zoom>(scene.cameraController.minZoom||0)+0.001,
        selectedId:scene.selectedId,
        toolbarHidden:document.getElementById('selectionBar').classList.contains('hidden')
      };
    });
    // ARCH-0575A: at INITIAL framing the visual SHELL (wall+floor drawn beyond the grid) should
    // reach the safe-viewport edges (little/no backdrop margin), and the door must NOT be a dark
    // 2-cell slab (its centre pixel is a light wood/glass door, not a black hole).
    const shellDoor=await page.evaluate(()=>{
      const s=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene'),cam=s.cameras.main;
      const TL=s.grid.getCellDiamond(0,0)[0],TR=s.grid.getCellDiamond(9,0)[1],BR=s.grid.getCellDiamond(9,7)[2];
      const skin=s.orthoRoomSkin,sh=skin.shell;
      const floorTop=TL.y,wallTop=floorTop-skin.layout.wallHeight;
       const shTop=wallTop-sh.topExtensionWorld;
       const shBot=BR.y+sh.bottomThicknessWorld;
       const shLeft=TL.x-sh.sideThicknessWorld;
       const shRight=TR.x+sh.sideThicknessWorld;
      const wv=cam.worldView,z=cam.zoom;
      const ext={top:Math.round(Math.max(0,(shTop-wv.y)*z)),bottom:Math.round(Math.max(0,(wv.y+wv.height-shBot)*z)),
        left:Math.round(Math.max(0,(shLeft-wv.x)*z)),right:Math.round(Math.max(0,(wv.x+wv.width-shRight)*z))};
      // door centre pixel (gridX 7.5, mid door height) via live worldView → screen
      const door=skin.door,dc=s.grid.gridToWorld(door.gridBounds.x+door.gridBounds.w/2,0),dy=floorTop-door.height/2;
      const cv=window.__CAT_CAFE_GAME__.canvas,ctx=cv.getContext('2d',{willReadFrequently:true});
      const sx=Math.round((dc.x-wv.x)/wv.width*cv.width),sy=Math.round((dy-wv.y)/wv.height*cv.height);
      const d=ctx.getImageData(Math.min(cv.width-1,Math.max(0,sx)),Math.min(cv.height-1,Math.max(0,sy)),1,1).data;
      return {ext,doorCentreLum:Math.round(0.299*d[0]+0.587*d[1]+0.114*d[2])};
    });
    // ARCH-0575 P0: zoom-in MUST enable real panning. The V0574 bug was "zoom works, pan dead"
    // because the clamp re-centred off a STALE camera.midPoint. Zoom in, drag in each direction
    // with a REAL pointer, and assert the camera actually scrolls and clamps within the room.
    await page.evaluate(()=>{const s=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');s.cameras.main.setZoom(1.3);s.cameraController.clampToContent();});
    const readScroll=()=>page.evaluate(()=>{const c=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').cameras.main;return {sx:c.scrollX,sy:c.scrollY};});
    async function dragCam(dx,dy){await page.mouse.move(200,470);await page.mouse.down();for(let i=1;i<=6;i++)await page.mouse.move(200+dx*i/6,470+dy*i/6);await page.mouse.up();await page.waitForTimeout(90);return readScroll();}
    const panBase=await readScroll();
    const panRight=await dragCam(-150,0);            // drag left → scroll right
    const panDown=await dragCam(0,-150);             // drag up   → scroll down
    const panLeft=await dragCam(150,0);              // drag back left
    const panUp=await dragCam(0,150);
    const pan={xMoved:Math.abs(panRight.sx-panBase.sx),yMoved:Math.abs(panDown.sy-panRight.sy),
      xReturned:Math.abs(panLeft.sx-panRight.sx),yReturned:Math.abs(panUp.sy-panDown.sy)};
    // The outer x0/x9 columns must be a LIGHT neutral floor (no unexplained dark vertical bar).
    // Sample the ACTUAL rendered pixel at the centre of empty x0/x9 floor cells (the demo keeps
    // x0/x9 empty), projected via the live worldView at min-zoom so the whole room is on screen.
    const edge=await page.evaluate(async()=>{
      const s=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene'),cam=s.cameras.main;
      cam.setZoom(s.cameraController.minZoom);
      const room=s.cameraController.getRoomBounds();
      cam.centerOn(room.x+room.width/2,room.y+room.height/2);s.cameraController.clampToContent();
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));   // let worldView refresh
      const wv=cam.worldView,cv=window.__CAT_CAFE_GAME__.canvas,ctx=cv.getContext('2d',{willReadFrequently:true});
      const sample=(gx,gy)=>{
        const w=s.grid.getCellCenter(gx,gy);
        const sx=Math.round((w.x-wv.x)/wv.width*cv.width),sy=Math.round((w.y-wv.y)/wv.height*cv.height);
        const d=ctx.getImageData(Math.min(cv.width-1,Math.max(0,sx)),Math.min(cv.height-1,Math.max(0,sy)),1,1).data;
        return Math.round(0.299*d[0]+0.587*d[1]+0.114*d[2]);
      };
      return {left:Math.max(sample(0,2),sample(0,4)),right:Math.max(sample(9,2),sample(9,4))};
    });

    const problems=[];
    if(state.mode!=='ortho')problems.push(`mode is ${state.mode}`);
    if(pan.xMoved<=2)problems.push(`zoom-in X pan is dead (scroll moved ${pan.xMoved})`);
    if(pan.yMoved<=2)problems.push(`zoom-in Y pan is dead (scroll moved ${pan.yMoved})`);
    if(pan.xReturned<=2)problems.push('cannot pan back on X');
    if(pan.yReturned<=2)problems.push('cannot pan back on Y');
    if(ortho.demo&&edge.left<120)problems.push(`left x0 column is a dark bar (lum ${edge.left})`);
    if(ortho.demo&&edge.right<120)problems.push(`right x9 column is a dark bar (lum ${edge.right})`);
    // ARCH-0575A: shell reaches the edges (small external backdrop margin) + door is not a dark slab.
    for(const side of ['top','bottom','left','right']) if(shellDoor.ext[side]>16)problems.push(`shell leaves a ${side} backdrop margin of ${shellDoor.ext[side]}px (not full-bleed)`);
    if(shellDoor.doorCentreLum<120)problems.push(`visual door centre is a dark slab (lum ${shellDoor.doorCentreLum})`);
    if(state.demo!==ortho.demo)problems.push(`demoLayoutActive is ${state.demo}`);
    if(ortho.demo&&state.stateItems!==18)problems.push(`demo mutated state.items (${state.stateItems})`);
    if(ortho.demo&&state.saveExists)problems.push('demo wrote the current save');
    if(state.savedLeak)problems.push('projection/demoLayout leaked into the save');
    if(!state.catsFinite)problems.push('a cat has a non-finite position');
    if(!state.canvasRenderer)problems.push('renderer is not Canvas');
    if(state.roomSkinId!=='warm-cafe-foundation')problems.push(`Room Skin is ${state.roomSkinId}`);
    if(state.shellRole!=='fixed-architecture')problems.push(`shell role is ${state.shellRole}`);
    if(ortho.demo&&!state.artDebug)problems.push('Art Debug did not enable');
    if(state.targetEntities.some(entity=>!entity.texture.startsWith(`furniture:ortho:${entity.type}:`))) {
      problems.push(`an orthogonal core asset used a base texture: ${JSON.stringify(state.targetEntities)}`);
    }
    if(ortho.demo){
      for(const [type,frames] of Object.entries(state.rotationCalibration)){
        const expectedDirections=
          type==='pinkTableLong'||type==='pinkTableLongHardCafe'?2:4;
        if(new Set(frames.map(frame=>frame.texture)).size!==expectedDirections){
          problems.push(`${type} policy texture count is wrong: ${JSON.stringify(frames)}`);
        }
      }
      if(Object.keys(state.rotationCalibration).length!==5){
        problems.push(`rotation calibration fixtures missing: ${JSON.stringify(state.rotationCalibration)}`);
      }
    }
    if(!state.coreFullyVisible)problems.push('core gameplay region not fully visible at initial framing');
    if(!state.roomWidthCrops)problems.push('outer room columns did not crop (first screen is not full-bleed)');
    if(!state.canZoomOutToRoom)problems.push(`cannot zoom out to the whole room (fit ${state.fitZoom} vs minZoom ${state.minZoom})`);
    if(state.selectedId)problems.push('a furniture is selected on the first screen');
    if(!state.toolbarHidden)problems.push('context toolbar is shown on the first screen');
    if(pageErrors.length)problems.push(JSON.stringify(pageErrors));
    results.push({scenario:ortho.name,viewport:'390x844',...state,pan,edge,shellDoor,problems});
    await context.close();
    if(problems.length)throw new Error(`${ortho.name}: ${problems.join('; ')}`);
  }
  // FIX-0577D: drive the REAL #rotateBtn. axis2 returns in two clicks; cardinal4
  // returns in four. Each intermediate state is the shared envelope candidate,
  // and the final state returns to the exact original x/y/r/world position.
  {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await context.addInitScript(()=>localStorage.clear());
    const page=await context.newPage();
    await page.goto(origin+'/?projection=ortho',{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>document.body.dataset.gameReady==='1',null,{timeout:20000});
    const calibration={};
    for(const type of ['pinkTableLong','pinkTableLongHardCafe','counter','chair','dessert']){
      await page.evaluate(fixtureType=>{
        const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
        scene.catBehaviorController.pause('rotation-smoke');
        for(const entity of scene.entities.values())entity.destroy();
        scene.entities.clear();
        scene.state.items.length=0;
        scene.occupancy.build([]);
        const item={id:`toolbar-rotation-${fixtureType}`,type:fixtureType,x:3,y:3,r:0};
        scene.state.items.push(item);
        scene.occupancy.addItem(item);
        scene.addFurnitureEntity(item).sync();
        scene.selectItem(item.id);
      },type);
      const read=()=>page.evaluate(fixtureType=>{
        const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
        const item=scene.state.items.find(entry=>entry.id===`toolbar-rotation-${fixtureType}`);
        const entity=scene.entities.get(item.id);
        const resolved=entity.resolvedPlacement;
        const last=scene.lastRotationCandidate;
        return {
          x:item.x,y:item.y,r:item.r||0,xWorld:entity.x,yWorld:entity.y,
          anchorX:resolved?.visualPosition.x,anchorY:resolved?.visualPosition.y,
          texture:entity.texture.key,policy:resolved?.rotationPolicy,
          delta:last?.resolved?.movementDelta||{x:0,y:0},
          signature:last?.resolved?.signature||resolved?.signature||''
        };
      },type);
      const steps=[await read()];
      const clickCount=type==='pinkTableLong'||type==='pinkTableLongHardCafe'?2:4;
      for(let click=0;click<clickCount;click++){
        await page.click('#rotateBtn');
        await page.waitForTimeout(40);
        steps.push(await read());
      }
      calibration[type]=steps;
    }
    for(const [type,steps] of Object.entries(calibration)){
      if(steps.some(step=>Math.abs(step.xWorld-step.anchorX)>0.01||Math.abs(step.yWorld-step.anchorY)>0.01)){
        throw new Error(`${type} sprite left the shared gameplay anchor: ${JSON.stringify(steps)}`);
      }
      const start=steps[0],end=steps[steps.length-1];
      if(end.r!==start.r||end.x!==start.x||end.y!==start.y||end.xWorld!==start.xWorld||end.yWorld!==start.yWorld){
        throw new Error(`${type} policy cycle drifted from the origin: ${JSON.stringify(steps)}`);
      }
      const expectedDirections=type==='pinkTableLong'||type==='pinkTableLongHardCafe'?2:4;
      if(new Set(steps.slice(0,-1).map(step=>step.texture)).size!==expectedDirections){
        throw new Error(`${type} toolbar rotate direction cycle failed: ${JSON.stringify(steps)}`);
      }
    }
    results.push({scenario:'ortho-toolbar-rotation-calibration',viewport:'390x844',calibration,problems:[]});
    await context.close();
  }
  // Every documented projection URL must boot independently. Orthogonal store
  // thumbnails use the override; iso/flat/default keep the base visual paths.
  for(const projection of [
    {name:'root',query:'',mode:'iso'},
    {name:'iso',query:'?projection=iso',mode:'iso'},
    {name:'flat',query:'?projection=flat',mode:'flat'},
    {name:'ortho',query:'?projection=ortho',mode:'ortho'},
    {name:'orthogonal-alias',query:'?projection=orthogonal',mode:'ortho'},
    {name:'ortho-demo',query:'?projection=ortho&demoLayout=1',mode:'ortho'},
    {name:'ortho-art-debug',query:'?projection=ortho&artDebug=1',mode:'ortho'},
    {name:'ortho-demo-art-debug',query:'?projection=ortho&demoLayout=1&artDebug=1',mode:'ortho'}
  ]){
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(()=>localStorage.clear());
    const page=await context.newPage();
    const failures=[];
    page.on('pageerror',error=>failures.push(error.message));
    page.on('requestfailed',request=>failures.push(`${request.url()} ${request.failure()?.errorText||''}`));
    await page.goto(origin+'/'+projection.query,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>document.body.dataset.gameReady==='1'&&document.getElementById('bootOverlay')?.classList.contains('hidden'),null,{timeout:20000});
    await page.click('#openStoreBtn');
    const state=await page.evaluate(targetIds=>{
      const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
      const thumbnails=Object.fromEntries(targetIds.map(id=>[
        id,
        document.querySelector(`.store-card[data-id="${id}"] img`)?.getAttribute('src')||''
      ]));
      return {mode:scene.projectionMode,thumbnails};
    },[
      'counter','coffeeMachine','oven','washStation','dessert','smartOrder',
      'pinkTableLong','pinkTableLongHardCafe','roundTable','chair',
      'creamSofa','doubleCatTree','scratchPost'
    ]);
    if(state.mode!==projection.mode)failures.push(`mode ${state.mode} !== ${projection.mode}`);
    for(const [id,path] of Object.entries(state.thumbnails)){
      const isOrtho=path.includes(`/orthogonal/${id}/`);
      if((projection.mode==='ortho')!==isOrtho)failures.push(`${id} thumbnail ${path}`);
    }
    if(failures.length)throw new Error(`${projection.name}: ${failures.join('; ')}`);
    results.push({scenario:`projection-${projection.name}`,viewport:'390x844',mode:state.mode,problems:[]});
    await context.close();
  }
  // Invalid projection value safely falls back to iso.
  {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    await page.goto(origin+'/?projection=invalid',{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>document.body.dataset.gameReady==='1',null,{timeout:20000});
    const mode=await page.evaluate(()=>window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').projectionMode);
    if(mode!=='iso')throw new Error(`invalid projection did not fall back to iso: ${mode}`);
    await context.close();
  }
}finally{
  await browser?.close();
  await new Promise(resolveClose=>server.close(resolveClose));
}

console.log(JSON.stringify({browser:executablePath,results},null,2));
console.log('Browser smoke passed: eight viewports, fresh/legacy saves, 25 redraw thumbnails, Art Debug, furniture drag, cat motion and one complete care interaction.');
