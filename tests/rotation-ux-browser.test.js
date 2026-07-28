import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {
  existsSync, mkdirSync, readFileSync, statSync, writeFileSync
} from 'node:fs';
import {extname, normalize, resolve} from 'node:path';

const root=process.cwd();
const evidence=resolve(root,'docs/evidence/v0577d');
mkdirSync(evidence,{recursive:true});
const candidates=[
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
];
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('No installed Chrome or Edge executable was found');

const types={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.png':'image/png','.svg':'image/svg+xml'
};
const server=createServer((request,response)=>{
  const url=new URL(request.url,'http://127.0.0.1');
  const pathname=decodeURIComponent(url.pathname);
  const relative=pathname==='/'?'index.html':pathname.split('/').filter(Boolean).join('/');
  const file=resolve(root,normalize(relative));
  if(!file.startsWith(resolve(root))||!existsSync(file)||!statSync(file).isFile()){
    response.writeHead(404);response.end('Not found');return;
  }
  response.writeHead(200,{
    'content-type':types[extname(file)]||'application/octet-stream',
    'cache-control':'no-store'
  });
  response.end(readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin=`http://127.0.0.1:${server.address().port}`;
const metrics={
  build:'0577d',
  browser:executablePath,
  cases:[],
  pointerCases:[],
  projections:[],
  pageerrors:[]
};
let browser;

function screenshot(page,name){
  return page.screenshot({path:resolve(evidence,name),animations:'disabled'});
}

async function boot(viewport={width:390,height:844},query='?projection=ortho'){
  const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
  await context.addInitScript(()=>localStorage.clear());
  const page=await context.newPage();
  page.on('pageerror',error=>metrics.pageerrors.push(error.message));
  page.on('requestfailed',request=>metrics.pageerrors.push(
    `${request.url()} ${request.failure()?.errorText||''}`
  ));
  const response=await page.goto(`${origin}/${query}`,{
    waitUntil:'domcontentloaded',timeout:20000
  });
  if(response?.status()!==200)throw new Error(`HTTP ${response?.status()}`);
  await page.waitForFunction(()=>
    document.body.dataset.gameReady==='1'
    &&document.getElementById('bootOverlay')?.classList.contains('hidden')
  ,null,{timeout:20000});
  return {context,page};
}

async function fixture(page,{
  type,x=3,y=3,r=0,id=`fixture-${type}`,blockers=[],select=true
}){
  await page.evaluate(({type,x,y,r,id,blockers,select})=>{
    const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
    scene.catBehaviorController.pause('rotation-evidence');
    scene.catEntities.forEach(entity=>entity.destroy());
    scene.catEntities.clear();
    scene.selectItem(null);
    scene.furnitureDragController.clearRotationPreview();
    scene.entities.forEach(entity=>entity.destroy());
    scene.entities.clear();
    scene.state.items.length=0;
    scene.occupancy.build([]);
    const item={id,type,x,y,r};
    scene.state.items.push(item);
    scene.occupancy.addItem(item);
    scene.addFurnitureEntity(item).sync();
    for(const blocker of blockers){
      scene.state.items.push(blocker);
      scene.occupancy.addItem(blocker);
      scene.addFurnitureEntity(blocker).sync();
    }
    scene.selectItem(select?id:null);
  },{type,x,y,r,id,blockers,select});
}

async function readCase(page,id){
  return page.evaluate(id=>{
    const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
    const item=scene.state.items.find(entry=>entry.id===id);
    const entity=scene.entities.get(id);
    const ghost=scene.furnitureDragController.rotationPreviewGhost;
    const last=scene.lastRotationCandidate;
    const record=item?scene.occupancy.items.get(item.id):null;
    const bounds=value=>value?({
      x:Math.round(value.x),y:Math.round(value.y),
      width:Math.round(value.width),height:Math.round(value.height)
    }):null;
    return {
      item:item?{x:item.x,y:item.y,r:item.r||0,type:item.type}:null,
      policy:last?.resolved?.rotationPolicy||entity?.resolvedPlacement?.rotationPolicy||null,
      movementDelta:last?.resolved?.movementDelta||{x:0,y:0},
      envelope:last?.resolved?.envelopeContext||scene.rotationEditSession?.envelope||null,
      cells:last?.resolved?.footprintCells||record?.cells||[],
      spriteBounds:bounds(entity?.getBounds()),
      ghostBounds:bounds(ghost?.getBounds()),
      occupancyCells:record?.cells||[],
      preview:last?.result||null,
      committed:Boolean(last?.committed),
      signature:last?.resolved?.signature||entity?.resolvedPlacement?.signature||'',
      selectedId:scene.selectedId,
      camera:{
        scrollX:scene.cameras.main.scrollX,
        scrollY:scene.cameras.main.scrollY,
        zoom:scene.cameras.main.zoom
      },
      toolbarMode:document.getElementById('gameBottomBar')?.dataset.mode,
      ghostVisible:Boolean(ghost?.visible),
      pageerror:[...(window.__ROTATION_PAGE_ERRORS__||[])]
    };
  },id);
}

async function clickRotate(page){
  await page.locator('#rotateBtn').click();
  await page.waitForTimeout(70);
}

async function rotationSequence(page,{type,id,steps,names}){
  const states=[await readCase(page,id)];
  if(names[0])await screenshot(page,names[0]);
  for(let index=0;index<steps;index++){
    await clickRotate(page);
    states.push(await readCase(page,id));
    if(names[index+1])await screenshot(page,names[index+1]);
  }
  const first=states[0].item,last=states.at(-1).item;
  if(JSON.stringify(first)!==JSON.stringify(last)){
    throw new Error(`${type} round-trip drift: ${JSON.stringify(states)}`);
  }
  metrics.cases.push({type,states,roundTrip:true});
  return states;
}

async function entityScreenPoint(page,id){
  return page.evaluate(id=>{
    const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
    const entity=scene.entities.get(id);
    const camera=scene.cameras.main;
    const canvas=window.__CAT_CAFE_GAME__.canvas;
    const rect=canvas.getBoundingClientRect();
    const bounds=entity.getBounds();
    const worldX=bounds.centerX;
    const worldY=bounds.centerY;
    return {
      x:rect.left+(worldX-camera.worldView.x)/camera.worldView.width*rect.width,
      y:rect.top+(worldY-camera.worldView.y)/camera.worldView.height*rect.height,
      canvasTag:document.elementFromPoint(
        rect.left+(worldX-camera.worldView.x)/camera.worldView.width*rect.width,
        rect.top+(worldY-camera.worldView.y)/camera.worldView.height*rect.height
      )?.tagName||''
    };
  },id);
}

async function pointerSelect(page,config,name){
  await fixture(page,{...config,select:false});
  await page.evaluate(id=>{
    const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
    const entity=scene.entities.get(id);
    scene.cameras.main.centerOn(entity.x,entity.y);
    scene.cameraController.clampToContent();
  },config.id);
  await page.waitForTimeout(40);
  const point=await entityScreenPoint(page,config.id);
  if(point.canvasTag!=='CANVAS'){
    throw new Error(`entity pointer is covered/outside Canvas: ${JSON.stringify({config,point})}`);
  }
  await page.touchscreen.tap(point.x,point.y);
  await page.waitForFunction(id=>
    window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').selectedId===id
  ,config.id,{timeout:3000});
  const result=await page.evaluate(({id,point})=>{
    const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
    const before={x:scene.cameras.main.scrollX,y:scene.cameras.main.scrollY};
    const buttons=['rotateBtn','storeBtn','sellBtn','cancelPlacementBtn'].map(buttonId=>{
      const element=document.getElementById(buttonId);
      const rect=element.getBoundingClientRect();
      return {
        id:buttonId,width:rect.width,height:rect.height,
        hit:document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2)?.id
      };
    });
    return {
      id,canvasTag:point.canvasTag,selected:scene.selectedId,
      mode:document.getElementById('gameBottomBar').dataset.mode,
      camera:before,buttons
    };
  },{id:config.id,point});
  if(result.canvasTag!=='CANVAS'||result.selected!==config.id||result.mode!=='edit'){
    throw new Error(`pointer selection failed: ${JSON.stringify(result)}`);
  }
  if(result.buttons.some(button=>button.width<44||button.height<44||button.hit!==button.id)){
    throw new Error(`toolbar hit target failed: ${JSON.stringify(result.buttons)}`);
  }
  if(name)await screenshot(page,name);
  metrics.pointerCases.push(result);
  return result;
}

try{
  browser=await chromium.launch({executablePath,headless:true});
  {
    const {context,page}=await boot();
    await page.evaluate(()=>{
      window.__ROTATION_PAGE_ERRORS__=[];
      window.addEventListener('unhandledrejection',event=>
        window.__ROTATION_PAGE_ERRORS__.push(String(event.reason)));
    });

    await fixture(page,{type:'pinkTableLong',id:'table'});
    await rotationSequence(page,{
      type:'pinkTableLong',id:'table',steps:2,
      names:['table-axis-horizontal.png','table-axis-vertical.png','table-axis-roundtrip.png']
    });

    await fixture(page,{type:'chair',id:'chair'});
    await rotationSequence(page,{
      type:'chair',id:'chair',steps:4,
      names:['chair-south.png','chair-west.png','chair-north.png','chair-east.png','chair-roundtrip.png']
    });

    await fixture(page,{type:'counter',id:'counter'});
    await rotationSequence(page,{
      type:'counter',id:'counter',steps:4,
      names:[null,null,null,null,'counter-roundtrip.png']
    });

    await fixture(page,{type:'dessert',id:'dessert'});
    await rotationSequence(page,{
      type:'dessert',id:'dessert',steps:4,
      names:[null,null,null,null,'dessert-roundtrip.png']
    });

    await fixture(page,{
      type:'counter',id:'conflict',x:3,y:3,r:0,
      blockers:[{id:'blocker',type:'chair',x:4,y:4,r:0}]
    });
    const conflictBefore=await readCase(page,'conflict');
    await clickRotate(page);
    const conflictAfter=await readCase(page,'conflict');
    if(JSON.stringify(conflictBefore.item)!==JSON.stringify(conflictAfter.item)
      ||conflictAfter.preview?.blockingReason!=='overlap'
      ||!conflictAfter.ghostVisible){
      throw new Error(`conflict rotation mutated formal state: ${JSON.stringify(conflictAfter)}`);
    }
    await screenshot(page,'rotation-conflict.png');
    await screenshot(page,'invalid-ghost.png');
    metrics.cases.push({type:'conflict',before:conflictBefore,after:conflictAfter});

    await fixture(page,{type:'counter',id:'boundary',x:0,y:0,r:1});
    const boundaryBefore=await readCase(page,'boundary');
    await clickRotate(page);
    const boundaryAfter=await readCase(page,'boundary');
    if(JSON.stringify(boundaryBefore.item)!==JSON.stringify(boundaryAfter.item)
      ||boundaryAfter.preview?.blockingReason!=='out-of-bounds'){
      throw new Error(`boundary rotation failed: ${JSON.stringify(boundaryAfter)}`);
    }
    await screenshot(page,'rotation-boundary.png');
    metrics.cases.push({type:'boundary',before:boundaryBefore,after:boundaryAfter});

    await fixture(page,{type:'counter',id:'entrance',x:6,y:0,r:3});
    const entranceBefore=await readCase(page,'entrance');
    await clickRotate(page);
    const entranceAfter=await readCase(page,'entrance');
    if(JSON.stringify(entranceBefore.item)!==JSON.stringify(entranceAfter.item)
      ||entranceAfter.preview?.blockingReason!=='reserved-entrance'){
      throw new Error(`entrance rotation failed: ${JSON.stringify(entranceAfter)}`);
    }
    await screenshot(page,'rotation-entrance.png');
    metrics.cases.push({type:'entrance',before:entranceBefore,after:entranceAfter});

    await fixture(page,{type:'chair',id:'toolbar',x:4,y:6,r:0});
    await screenshot(page,'edit-mode-toolbar.png');
    await context.close();
  }

  // Real pointer coverage at all three target portrait widths.
  for(const viewport of [
    {width:390,height:844},{width:393,height:852},{width:430,height:932}
  ]){
    const {context,page}=await boot(viewport);
    const suffix=viewport.width===390?'':`-${viewport.width}`;
    const cases=[
      {type:'chair',id:'bottom-left',x:0,y:7,r:0,name:viewport.width===390?'bottom-row-left.png':null},
      {type:'dessert',id:'bottom-centre',x:4,y:7,r:0,name:viewport.width===390?'bottom-row-centre.png':null},
      {type:'chair',id:'bottom-right',x:9,y:7,r:0,name:viewport.width===390?'bottom-row-right.png':null},
      {type:'pinkTableLong',id:'bottom-2x1',x:3,y:7,r:0,name:viewport.width===390?'bottom-row-2x1.png':null},
      {type:'doubleCatTree',id:'bottom-1x2',x:5,y:6,r:0,name:viewport.width===390?'bottom-row-1x2.png':null}
    ];
    for(const item of cases){
      await pointerSelect(page,item,item.name);
    }
    await fixture(page,{type:'pinkTableLong',id:'cancel',x:3,y:6,r:0});
    const cancelPoint=await entityScreenPoint(page,'cancel');
    await page.mouse.click(cancelPoint.x,cancelPoint.y);
    await clickRotate(page);
    await page.locator('#cancelPlacementBtn').click();
    const cancelled=await page.evaluate(()=>{
      const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
      const item=scene.state.items.find(entry=>entry.id==='cancel');
      return {item,selected:scene.selectedId,mode:document.getElementById('gameBottomBar').dataset.mode};
    });
    if(cancelled.item.x!==3||cancelled.item.y!==6||cancelled.item.r!==0
      ||cancelled.selected!==null||cancelled.mode!=='nav'){
      throw new Error(`cancel did not restore edit origin: ${JSON.stringify(cancelled)}`);
    }
    if(viewport.width===390)await screenshot(page,'bottom-row-cancel.png');

    await fixture(page,{type:'chair',id:'store',x:8,y:7,r:0});
    const storePoint=await entityScreenPoint(page,'store');
    await page.mouse.click(storePoint.x,storePoint.y);
    await page.locator('#storeBtn').click();
    const stored=await page.evaluate(()=>{
      const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
      return {
        exists:scene.state.items.some(item=>item.id==='store'),
        inventory:scene.state.inventory.chair||0,
        mode:document.getElementById('gameBottomBar').dataset.mode
      };
    });
    if(stored.exists||stored.inventory<1||stored.mode!=='nav'){
      throw new Error(`store action failed: ${JSON.stringify(stored)}`);
    }
    metrics.pointerCases.push({viewport:`${viewport.width}x${viewport.height}`,cancelled,stored});

    // Safari-style viewport-height change: edit bar survives and Camera centre is
    // not reinitialized. This is browser automation, not an iPhone-device claim.
    await fixture(page,{type:'chair',id:'resize',x:4,y:6,r:0});
    const resizePoint=await entityScreenPoint(page,'resize');
    await page.mouse.click(resizePoint.x,resizePoint.y);
    const cameraBefore=await page.evaluate(()=>{
      const c=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').cameras.main;
      return {x:c.midPoint.x,y:c.midPoint.y};
    });
    await page.setViewportSize({width:viewport.width,height:viewport.height-84});
    await page.waitForTimeout(100);
    const resizeAfter=await page.evaluate(()=>{
      const scene=window.__CAT_CAFE_GAME__.scene.getScene('CafeScene');
      const c=scene.cameras.main;
      return {
        x:c.midPoint.x,y:c.midPoint.y,
        selected:scene.selectedId,
        mode:document.getElementById('gameBottomBar').dataset.mode
      };
    });
    if(resizeAfter.selected!=='resize'||resizeAfter.mode!=='edit'
      ||Math.abs(resizeAfter.x-cameraBefore.x)>90
      ||Math.abs(resizeAfter.y-cameraBefore.y)>90){
      throw new Error(`viewport resize reset edit state/camera: ${JSON.stringify({cameraBefore,resizeAfter})}`);
    }
    await context.close();
  }

  for(const projection of [
    {query:'?projection=ortho&artDebug=1&artDebugFocus=chair',name:'art-debug-focused.png',mode:'ortho'},
    {query:'?projection=iso',name:'iso-regression.png',mode:'iso'},
    {query:'?projection=flat',name:'flat-regression.png',mode:'flat'}
  ]){
    const {context,page}=await boot({width:390,height:844},projection.query);
    const mode=await page.evaluate(()=>
      window.__CAT_CAFE_GAME__.scene.getScene('CafeScene').projectionMode
    );
    if(mode!==projection.mode)throw new Error(`${projection.query} => ${mode}`);
    await screenshot(page,projection.name);
    metrics.projections.push({query:projection.query,mode});
    await context.close();
  }
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}

if(metrics.pageerrors.length){
  throw new Error(`rotation browser page errors: ${metrics.pageerrors.join('; ')}`);
}
writeFileSync(
  resolve(evidence,'metrics.json'),
  JSON.stringify(metrics,null,2)
);
console.log(
  `Rotation UX browser passed: ${metrics.cases.length} rotation cases, `+
  `${metrics.pointerCases.length} pointer records, ${metrics.projections.length} projection regressions.`
);
