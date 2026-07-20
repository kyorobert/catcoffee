const fs=require('fs');
const vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const required=['FLOOR_MAPPING_VERSION=5310','const FLOOR_GRID_POINTS=[','function floorGridToWorld','function worldToFloorGrid','function getFootprintPolygon','function getFurnitureAnchor','function drawImageTriangle','function drawImageToQuad','floorDebug=1','drawAllRugs(ctx)','drawFloorOverlay(ctx)'];
const missing=required.filter(token=>!html.includes(token));
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const syntaxErrors=[];
scripts.forEach((source,index)=>{try{new vm.Script(source,{filename:`index-script-${index+1}.js`});}catch(error){syntaxErrors.push(error.message);}});
const gridMatch=html.match(/const FLOOR_GRID_POINTS=(\[[\s\S]*?\n\]);/);
let gridError='';
if(!gridMatch)gridError='FLOOR_GRID_POINTS not found';
else{
  const grid=vm.runInNewContext(gridMatch[1]);
  if(grid.length!==9||grid.some(row=>row.length!==11))gridError='expected a 9 x 11 control grid';
  for(let y=0;!gridError&&y<8;y++)for(let x=0;x<10;x++){
    const p=[grid[y][x],grid[y][x+1],grid[y+1][x+1],grid[y+1][x]];let sign=0;
    for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4],c=p[(i+2)%4],cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);if(cross&&sign&&Math.sign(cross)!==sign)gridError=`non-convex cell ${x},${y}`;if(cross&&!sign)sign=Math.sign(cross);}
  }
}
const deploy=['index.html','manifest.webmanifest','.nojekyll','README.md','check.js','assets','icons','splash'].filter(path=>!fs.existsSync(path));
if(missing.length||syntaxErrors.length||gridError||deploy.length){console.error({missing,syntaxErrors,gridError,missingDeployEntries:deploy});process.exit(1);}
console.log('V0.53.1 static checks passed: scripts parse, floor grid is 9 x 11 and convex, deployment entries exist.');
