import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {ORTHO_ROOM_ZONES,ORTHO_ENTRANCE_CELLS,ORTHO_ZONE_KEYS,zoneAt}
  from '../assets/js/config/ortho-room-zones.js?v=0577k';
import {
  DEFAULT_ORTHOGONAL_ROOM_SKIN as SKIN,
  getOrthogonalCellAppearance,
  getOrthogonalRoomSkin
} from '../assets/js/config/ortho-room-skin.js?v=0577k';
import {GridSystem} from '../assets/js/systems/GridSystem.js?v=0577k';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js?v=0577k';
import {PlacementSystem} from '../assets/js/systems/PlacementSystem.js?v=0577k';

const luminance = hex =>
  0.299 * ((hex >> 16) & 255) + 0.587 * ((hex >> 8) & 255) + 0.114 * (hex & 255);

const grid = new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG,{mode:'ortho'});
const occupancy = new OccupancySystem(grid,FURNITURE_CONFIG);
occupancy.build([]);
const placement = new PlacementSystem(grid,occupancy,FURNITURE_CONFIG);
const validate = (type,x,y,rotation=0) =>
  placement.validatePlacement({type,x,y,rotation,movingItemId:null});

// A. Visual classification is driven by the exact live placeableMask.
for(let y=0;y<ROOM_CONFIG.floor.rows;y++)for(let x=0;x<ROOM_CONFIG.floor.cols;x++){
  const placeable=grid.isPlaceableCell(x,y);
  const appearance=getOrthogonalCellAppearance({placeable,zoneKey:zoneAt(x,y),parity:(x+y)&1,skin:SKIN});
  assert.equal(appearance.kind,placeable?'playable':'reserved',`cell ${x},${y} visual kind follows placeableMask`);
  if(placeable)assert.equal(appearance.fill,SKIN.floor.zoneFill[zoneAt(x,y)],`cell ${x},${y} uses its zone palette`);
  else assert.equal(appearance.fill,SKIN.floor.reserved.fill,`cell ${x},${y} uses reserved treatment`);
}
assert.deepEqual(ORTHO_ENTRANCE_CELLS,[{x:7,y:0},{x:8,y:0}]);
assert.equal(ROOM_CONFIG.floor.placeableMask[0][7],false);
assert.equal(ROOM_CONFIG.floor.placeableMask[0][8],false);
assert.equal(ROOM_CONFIG.floor.placeableMask[7][8],true);
assert.equal(ROOM_CONFIG.floor.placeableMask[7][9],true);
assert.deepEqual(ROOM_CONFIG.entrance.cells,ORTHO_ENTRANCE_CELLS);
assert.equal(ROOM_CONFIG.floor.placeableMask.flat().filter(Boolean).length,78,'exactly 78 logical floor cells remain placeable');

// B. The beyond-grid shell is fixed architecture, not a floor-like extension.
assert.equal(SKIN.shell.role,'fixed-architecture');
assert.equal(SKIN.shell.material,'narrow-wood-trim');
for(const extent of ['sideThicknessWorld','topExtensionWorld','bottomThicknessWorld']){
  assert.ok(SKIN.shell[extent]>0,`shell has ${extent} extent`);
}
for(const {width,zoom} of [
  {width:390,zoom:.53125},
  {width:393,zoom:.5355},
  {width:430,zoom:.588}
]){
  const sideCss=SKIN.shell.sideThicknessWorld*zoom;
  const bottomCss=SKIN.shell.bottomThicknessWorld*zoom;
  assert.ok(sideCss>=8&&sideCss<=16,`${width}px side shell is ${sideCss.toFixed(1)} CSS px`);
  assert.ok(bottomCss>=8&&bottomCss<=16,`${width}px bottom shell is ${bottomCss.toFixed(1)} CSS px`);
}
const lightestDistance=Math.min(...Object.values(SKIN.floor.zoneFill)
  .map(color=>Math.abs(luminance(color)-luminance(SKIN.shell.fill))));
assert.ok(lightestDistance>35,`shell luminance is visibly separated from every playable floor tint (${lightestDistance.toFixed(1)})`);
assert.notEqual(SKIN.shell.fill,SKIN.floor.reserved.fill,'outside shell and reserved cell have distinct roles');
assert.ok(SKIN.floor.playableBoundary.width>=2,'playable area has an explicit boundary');

// C. Representative edge placements use the one PlacementSystem/footprint source.
for(const sample of [
  ['chair',0,0,0],                  // 1x1 top-left
  ['chair',9,7,0],                 // old bottom entrance is released
  ['doubleCatTree',0,6,0],         // 1x2 bottom-left edge
  ['catCastle',0,6,0],             // 2x2 bottom-left corner
  ['catCastle',8,6,0]              // 2x2 bottom-right corner
]){
  const [type,x,y,r]=sample;
  assert.equal(validate(type,x,y,r).valid,true,`${type} ${x},${y} r${r} is a valid visible edge placement`);
}
assert.equal(validate('chair',7,0).blockingReason,'reserved-entrance','new top entrance is explicitly blocked');
assert.equal(validate('chair',8,0).blockingReason,'reserved-entrance','both formal entrance cells are blocked');
assert.equal(validate('doubleCatTree',9,7).blockingReason,'out-of-bounds','1x2 beyond bottom edge is out of bounds');
assert.equal(validate('catCastle',9,6).blockingReason,'out-of-bounds','2x2 beyond right edge is out of bounds');
assert.equal(validate('catCastle',6,0).blockingReason,'reserved-entrance','2x2 touching the new entrance is blocked consistently');

// A point in the visible architectural shell snaps outside the logical grid and is rejected.
const topLeft=grid.getCellDiamond(0,0)[0];
const shellGrid=grid.snapWorldToGrid(topLeft.x-12,grid.getCellCenter(0,0).y);
assert.ok(shellGrid.x<0,'left shell does not snap to a playable cell');
assert.equal(validate('chair',shellGrid.x,shellGrid.y).blockingReason,'out-of-bounds');

// D. Skin owns wall/trim/floor/door/decor presentation and door geometry.
assert.equal(getOrthogonalRoomSkin('missing-skin'),SKIN,'unknown skin falls back to the default');
assert.ok(Object.isFrozen(SKIN)&&Object.isFrozen(SKIN.door)&&Object.isFrozen(SKIN.decorAnchors));
for(const key of ORTHO_ZONE_KEYS)assert.equal(typeof SKIN.floor.zoneFill[key],'number',`zone colour exists: ${key}`);
assert.equal('visualDoorBounds' in ORTHO_ROOM_ZONES,false,'logical zones do not own visual door geometry');
const door=SKIN.door;
for(const key of ['gridBounds','height','frame','casing','leaf','glass','handle','panel','cafeSign']){
  assert.ok(door[key]!==undefined,`door skin has ${key}`);
}
assert.ok(door.gridBounds.w>=1.3&&door.gridBounds.w<=1.5);
assert.ok(Math.abs((door.gridBounds.x+door.gridBounds.w/2)-7.5)<1e-9,'visual door remains centred in x7-8');
assert.ok(SKIN.decorAnchors.length>=2&&SKIN.decorAnchors.every(slot=>slot.texture&&Number.isFinite(slot.fx)));

// E. Projection contains geometry only; Room Skin is pure data/helper code.
const projectionSource=readFileSync(new URL('../assets/js/systems/OrthogonalProjection.js',import.meta.url),'utf8');
for(const token of ['zoneFill','decorAnchors','cafeSign','panelInset']){
  assert.equal(projectionSource.includes(token),false,`projection does not own skin token ${token}`);
}
const skinSource=readFileSync(new URL('../assets/js/config/ortho-room-skin.js',import.meta.url),'utf8');
for(const banned of ['Phaser','document','localStorage','SaveAdapter']){
  assert.ok(!new RegExp(`\\b${banned}\\b`).test(skinSource),`Room Skin must not reference ${banned}`);
}
assert.ok(!/\bwindow\s*[.\[]/.test(skinSource),'Room Skin must not access the browser window');

console.log('Orthogonal playable area / Room Skin: mask-driven cell visuals, fixed non-floor shell, edge footprints, skin-owned door/decor and projection separation passed.');
