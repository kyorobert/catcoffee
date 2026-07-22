import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {CAT_PROFILES, CAT_ANIMATION_LAYOUT, FALLBACK_CAT} from '../assets/js/config/cat-config.js';
import {catAnimationKey} from '../assets/js/systems/CatAnimationSystem.js';

function decodeRgbaPng(path) {
  const file = readFileSync(path);
  assert.deepEqual([...file.subarray(0, 8)], [137,80,78,71,13,10,26,10], `${path} is PNG`);
  let offset = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset); const type = file.subarray(offset + 4, offset + 8).toString('ascii');
    const data = file.subarray(offset + 8, offset + 8 + length); offset += 12 + length;
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    if (type === 'IDAT') idat.push(data);
    if (type === 'IEND') break;
  }
  assert.equal(bitDepth, 8); assert.equal(colorType, 6, `${path} must be RGBA`);
  const raw = inflateSync(Buffer.concat(idat)); const stride = width * 4; const pixels = Buffer.alloc(stride * height);
  const paeth = (a,b,c) => { const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c; };
  let source = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[source++];
    for (let x = 0; x < stride; x++) {
      const value = raw[source++], left = x >= 4 ? pixels[y*stride+x-4] : 0;
      const up = y ? pixels[(y-1)*stride+x] : 0, upperLeft = y && x >= 4 ? pixels[(y-1)*stride+x-4] : 0;
      pixels[y*stride+x] = (value + (filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,upperLeft))) & 255;
    }
  }
  return {width,height,pixels};
}

function frameBytes(image, column, row) {
  const output = Buffer.alloc(64*64*4); let target = 0;
  for (let y=0;y<64;y++) {
    const source=((row*64+y)*image.width+column*64)*4;
    image.pixels.copy(output,target,source,source+64*4);target+=64*4;
  }
  return output;
}

for (const profile of [...CAT_PROFILES, FALLBACK_CAT]) {
  const path = profile.spriteSheet.split('?')[0].replace(/^\.\//, '');
  const image = decodeRgbaPng(path);
  assert.deepEqual([image.width,image.height],[512,384],`${profile.id} sheet is 8x6 64px frames`);
  for (const directionOffset of [0,4]) {
    const frames=[0,1,2,3].map(index=>frameBytes(image,directionOffset+index,1));
    assert.equal(new Set(frames.map(frame=>frame.toString('base64'))).size,4,`${profile.id} walk direction has four distinct frames`);
    const feet=frames.map(frame=>Buffer.concat(Array.from({length:14},(_,row)=>frame.subarray((50+row)*64*4,(51+row)*64*4))).toString('base64'));
    assert.ok(new Set(feet).size>=3,`${profile.id} has visible alternating foot phases`);
    const idleFrames=[0,1,2,3].map(index=>frameBytes(image,directionOffset+index,0));
    assert.ok(new Set(idleFrames.map(frame=>frame.toString('base64'))).size>=2,`${profile.id} idle row contains low-frequency life variation`);
  }
  assert.equal(catAnimationKey(profile.id,'walk','down'),`cat:${profile.id}:walk-down`);
  assert.equal(catAnimationKey(profile.id,'walk','up'),`cat:${profile.id}:walk-up`);
}
const catEntitySource=readFileSync('assets/js/entities/CatEntity.js','utf8');
const behaviorSource=readFileSync('assets/js/phaser/CatBehaviorController.js','utf8');
assert.match(catEntitySource,/currentAnimation === playableKey[\s\S]{0,80}return/,'same walk animation is not restarted every update');
assert.match(catEntitySource,/visualOffsetY = Math\.sin/,'CatEntity owns display-only gait motion');
assert.match(behaviorSource,/if \(arrived\.pathIndex >= arrived\.path\.length\)[\s\S]{0,180}finishPath/,'rest animation only starts after the full path');
assert.equal(CAT_ANIMATION_LAYOUT.walk.row,1);
assert.equal(CAT_ANIMATION_LAYOUT.walk.frameRate,9);
console.log('Cat animation assets passed: six 512x384 RGBA sheets, distinct four-frame walk-down/up rows and stable keys.');
