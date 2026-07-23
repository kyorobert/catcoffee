import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

const PNG_SIGNATURE=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);

function paeth(a,b,c){
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}

export function decodeRgbaPng(path){
  const data=readFileSync(path);
  if(!data.subarray(0,8).equals(PNG_SIGNATURE))throw new Error(`${path}: invalid PNG signature`);
  let offset=8,width=0,height=0,bitDepth=0,colorType=0,interlace=0;
  const idat=[];
  while(offset<data.length){
    const length=data.readUInt32BE(offset);const type=data.toString('ascii',offset+4,offset+8);
    const body=data.subarray(offset+8,offset+8+length);offset+=12+length;
    if(type==='IHDR'){
      width=body.readUInt32BE(0);height=body.readUInt32BE(4);bitDepth=body[8];colorType=body[9];interlace=body[12];
    }else if(type==='IDAT')idat.push(body);else if(type==='IEND')break;
  }
  if(bitDepth!==8||colorType!==6||interlace!==0)throw new Error(`${path}: expected non-interlaced 8-bit RGBA PNG`);
  const raw=inflateSync(Buffer.concat(idat));const stride=width*4;const rgba=Buffer.alloc(stride*height);
  let sourceOffset=0;
  for(let y=0;y<height;y++){
    const filter=raw[sourceOffset++];const row=y*stride;const previous=row-stride;
    for(let x=0;x<stride;x++){
      const value=raw[sourceOffset++];const left=x>=4?rgba[row+x-4]:0;const up=y?rgba[previous+x]:0;const upperLeft=y&&x>=4?rgba[previous+x-4]:0;
      rgba[row+x]=(value+(filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):filter===4?paeth(left,up,upperLeft):NaN))&255;
      if(filter<0||filter>4)throw new Error(`${path}: unsupported PNG filter ${filter}`);
    }
  }
  return {width,height,rgba};
}

export function inspectRgbaPng(path){
  const {width,height,rgba}=decodeRgbaPng(path);let visiblePixels=0,whitePixels=0;
  for(let offset=0;offset<rgba.length;offset+=4){
    const [r,g,b,a]=rgba.subarray(offset,offset+4);if(a<=8)continue;visiblePixels++;
    if(Math.min(r,g,b)>242&&Math.max(r,g,b)-Math.min(r,g,b)<8)whitePixels++;
  }
  const alphaAt=(x,y)=>rgba[(y*width+x)*4+3];
  return {format:'png',width,height,hasAlpha:true,visiblePixels,whitePixelRatio:visiblePixels?whitePixels/visiblePixels:1,cornerAlpha:[alphaAt(0,0),alphaAt(width-1,0),alphaAt(0,height-1),alphaAt(width-1,height-1)]};
}
