import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {extname,normalize,resolve} from 'node:path';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {CAT_PROFILES,FALLBACK_CAT} from '../assets/js/config/cat-config.js';

const root=process.cwd();
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const relativePath=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const file=resolve(root,normalize(relativePath));
  if(!file.startsWith(resolve(root))||!existsSync(file)||!statSync(file).isFile()){
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});
  response.end(readFileSync(file));
});

await new Promise(resolveListen=>server.listen(0,'127.0.0.1',resolveListen));
const {port}=server.address();
const origin=`http://127.0.0.1:${port}`;
const queue=['/index.html','/manifest.webmanifest'];
const visited=new Set();
const failures=[];

function validateSvgXml(source,path){
  const cleaned=source.replace(/<!--[\s\S]*?-->/g,'').replace(/<\?[^>]*\?>/g,'').replace(/<!DOCTYPE[\s\S]*?>/gi,'');
  const stack=[];
  let root=null;
  for(const match of cleaned.matchAll(/<([^>]+)>/g)){
    const token=match[1].trim();
    if(!token||token.startsWith('!'))continue;
    if(token.startsWith('/')){
      const name=token.slice(1).trim().split(/\s+/)[0];
      if(stack.pop()!==name)throw new Error(`${path}: XML closing tag mismatch at ${name}`);
      continue;
    }
    const name=token.split(/\s+/)[0].replace(/\/$/,'');
    root??=name;
    if(!token.endsWith('/'))stack.push(name);
  }
  if(root!=='svg'||stack.length)throw new Error(`${path}: invalid SVG XML structure`);
}

function discover(text,url,contentType){
  const candidates=[];
  if(contentType.includes('html')){
    for(const match of text.matchAll(/(?:src|href)=["']([^"'#]+)["']/g))candidates.push(match[1]);
  }
  if(contentType.includes('javascript')&&!url.includes('/assets/vendor/')){
    for(const match of text.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g))candidates.push(match[1]);
  }
  if(contentType.includes('css')){
    for(const match of text.matchAll(/url\(["']?([^"')?#]+)["']?\)/g))candidates.push(match[1]);
  }
  if(contentType.includes('json')||contentType.includes('manifest')){
    for(const match of text.matchAll(/["'](\.\.?\/[^"']+)["']/g))candidates.push(match[1]);
  }
  for(const candidate of candidates){
    if(/^(?:data:|https?:|#)/i.test(candidate))continue;
    queue.push(new URL(candidate,url).pathname);
  }
}

try{
  while(queue.length){
    const path=queue.shift();
    if(visited.has(path))continue;
    visited.add(path);
    const response=await fetch(origin+path);
    if(!response.ok){failures.push(`${response.status} ${path}`);continue;}
    const contentType=response.headers.get('content-type')||'';
    if(/(?:html|javascript|css|json|manifest)/.test(contentType))discover(await response.text(),origin+path,contentType);
  }
  for(const definition of Object.values(FURNITURE_CONFIG)){
    const path=new URL(definition.texture,origin+'/').pathname;
    const response=await fetch(origin+path);
    if(!response.ok){failures.push(`${response.status} furniture ${path}`);continue;}
    const contentType=response.headers.get('content-type')||'';
    const body=new Uint8Array(await response.arrayBuffer());
    if(!body.length){failures.push(`empty furniture response ${path}`);continue;}
    if(path.toLowerCase().endsWith('.png')){
      const signature=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
      if(!contentType.includes('image/png'))failures.push(`wrong PNG content-type ${path}: ${contentType}`);
      if(!signature.every((byte,index)=>body[index]===byte))failures.push(`invalid PNG signature ${path}`);
    }else if(path.toLowerCase().endsWith('.svg')){
      if(!contentType.includes('image/svg+xml'))failures.push(`wrong SVG content-type ${path}: ${contentType}`);
      try{validateSvgXml(new TextDecoder().decode(body),path)}catch(error){failures.push(error.message)}
    }
  }
  const catAssets=[
    ...CAT_PROFILES.flatMap(profile=>[profile.spriteSheet,profile.portrait]),
    FALLBACK_CAT.spriteSheet
  ];
  for(const asset of catAssets){
    const path=new URL(asset,origin+'/').pathname;
    const response=await fetch(origin+path);
    if(!response.ok){failures.push(`${response.status} cat asset ${path}`);continue;}
    const contentType=response.headers.get('content-type')||'';
    const body=new Uint8Array(await response.arrayBuffer());
    const signature=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
    if(!contentType.includes('image/png'))failures.push(`wrong cat PNG content-type ${path}: ${contentType}`);
    if(!signature.every((byte,index)=>body[index]===byte))failures.push(`invalid cat PNG signature ${path}`);
    if(body.length<100)failures.push(`empty cat PNG ${path}`);
  }
  for(const asset of ['./assets/environment/wall-window.png?v=0551a','./assets/environment/menu-board.png?v=0551a']){
    const path=new URL(asset,origin+'/').pathname;
    const response=await fetch(origin+path);
    const body=new Uint8Array(await response.arrayBuffer());
    const signature=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
    if(!response.ok||!response.headers.get('content-type')?.includes('image/png')||!signature.every((byte,index)=>body[index]===byte))failures.push(`invalid environment PNG ${path}`);
  }
} finally {
  await new Promise(resolveClose=>server.close(resolveClose));
}

if(failures.length){
  console.error('HTTP resource failures:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log(`HTTP resource test passed: ${visited.size} linked resources, ${Object.keys(FURNITURE_CONFIG).length} furniture textures, 11 cat PNG assets and 2 wall decorations.`);
