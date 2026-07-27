import {
  ORTHO_ENTRANCE_CELLS,
  buildOrthogonalPlaceableMask
} from './ortho-room-zones.js?v=0577b';

const COLS=10;
const ROWS=8;
// The formal entrance is generated from orthogonal zone metadata. This is the one
// shared logical truth used by Grid, Placement, Occupancy and every projection.
const entranceCells=ORTHO_ENTRANCE_CELLS;
const mask=buildOrthogonalPlaceableMask({cols:COLS,rows:ROWS},entranceCells);

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
  entrance:{cells:entranceCells},
  camera:{defaultZoom:.82,baseMinZoom:.48,maxZoom:1.65}
});
