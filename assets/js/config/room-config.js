const COLS=10;
const ROWS=8;
const mask=Array.from({length:ROWS},()=>Array(COLS).fill(true));
// The front door is visible floor but reserved for customers.
mask[ROWS-1][8]=false;
mask[ROWS-1][9]=false;

export const ROOM_CONFIG=Object.freeze({
  worldWidth:1560,
  worldHeight:1120,
  backgroundColor:0x3b291f,
  floor:{
    cols:COLS,
    rows:ROWS,
    tileWidth:128,
    tileHeight:64,
    originX:720,
    originY:300,
    placeableMask:mask,
    colors:[0xf2c892,0xe9b982,0xf5d09e,0xe7b37e],
    lineColor:0xc48a62
  },
  walls:{
    height:250,
    left:{fill:0xb96f5f,accent:0x8f4f49},
    right:{fill:0xd99378,accent:0xa85f55}
  },
  entrance:{cells:[{x:8,y:7},{x:9,y:7}]},
  camera:{defaultZoom:.82,baseMinZoom:.48,maxZoom:1.65}
});

