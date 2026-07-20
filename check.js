const fs=require('fs');
const vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const required=['V0.53.2｜地板視覺與放置系統止血修正版',"const floorDebug=new URLSearchParams(location.search).get('floorDebug')==='1'",'const HELPER_RADIUS=2','function isPlacementPolygonInsideFloor','function drawPlacementFootprint','function drawNearbyPlacementHelpers','function renderPlacementVisuals','renderPlacementVisuals(ctx);','放置輔助：'];
const forbiddenActive=['drawAllRugs(ctx);','drawFloorOverlay(ctx);','.map(normalizeItem)'];
const missing=required.filter(token=>!html.includes(token));
const forbidden=forbiddenActive.filter(token=>html.includes(token));
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const syntaxErrors=[];scripts.forEach((source,index)=>{try{new vm.Script(source,{filename:`index-script-${index+1}.js`});}catch(error){syntaxErrors.push(error.message);}});
const scene=html.match(/function renderScene\(\)\{([\s\S]*?)\n\}/)?.[1]||'';
const renderError=!scene.includes('renderPlacementVisuals(ctx)')||scene.includes('legacyDrawFloorOverlayDisabled')||scene.includes('legacyDrawAllRugsDisabled');
const deploy=['index.html','manifest.webmanifest','.nojekyll','README.md','check.js','assets','icons','splash'].filter(path=>!fs.existsSync(path));
if(missing.length||forbidden.length||syntaxErrors.length||renderError||deploy.length){console.error({missing,forbidden,syntaxErrors,renderError,missingDeployEntries:deploy});process.exit(1);}
console.log('V0.53.2 checks passed: no active full-grid/rug-warp renderer, placement visuals are local, scripts parse, deploy entries exist.');
