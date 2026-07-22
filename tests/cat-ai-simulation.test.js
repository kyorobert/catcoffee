import assert from 'node:assert/strict';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {CAT_PROFILES} from '../assets/js/config/cat-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js';
import {CatBehaviorController} from '../assets/js/phaser/CatBehaviorController.js';

const grid=new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG);
const occupancy=new OccupancySystem(grid,FURNITURE_CONFIG);
occupancy.build([
  {id:'table',type:'woodTable',x:4,y:3,r:0},
  {id:'rug',type:'rugPink',x:1,y:3,r:0}
]);
assert.equal(occupancy.getWalkabilitySnapshot().has('1,3'),false,'rug is not a path blocker');
assert.equal(occupancy.getWalkabilitySnapshot().has('4,3'),true,'floor furniture blocks paths');

const entityCount={created:0};
const makeEntity=profile=>{
  entityCount.created++;
  return {
    catData:profile,sprite:{x:0,y:0,flipX:false,setFlipX(value){this.flipX=value}},animation:'idle',
    setPosition(x,y){this.sprite.x=x;this.sprite.y=y},
    playIdle(){this.animation='idle'},playWalk(){this.animation='walk'},playSit(){this.animation='sit'},playSleep(){this.animation='sleep'}
  };
};
const profiles=CAT_PROFILES.slice(0,3);
const entities=new Map(profiles.map(profile=>[profile.id,makeEntity(profile)]));
let saveCount=0;
const scene={state:{catPositions:{}},time:{now:0}};
let randomIndex=0;
const randomValues=[.02,.24,.49,.73,.91,.34,.58,.12];
const controller=new CatBehaviorController(scene,{
  grid,occupancy,entities,profiles,saveAdapter:{save(){saveCount++}},
  random:()=>randomValues[(randomIndex++)%randomValues.length]
});
const initial=new Map([...controller.behaviors].map(([id,state])=>[id,`${state.gridX},${state.gridY}`]));
const moved=new Set();
for(let time=0;time<=60000;time+=100){
  scene.time.now=time;
  controller.update(time,100);
  for(const [id,state] of controller.behaviors)if(`${state.gridX},${state.gridY}`!==initial.get(id))moved.add(id);
}
assert.deepEqual([...moved].sort(),profiles.map(profile=>profile.id).sort(),'all three primary cats move within 60 simulated seconds');
const blockedCells=occupancy.getWalkabilitySnapshot();
for(const state of controller.behaviors.values()){
  assert.equal(grid.isPlaceableCell(state.gridX,state.gridY),true);
  assert.equal(blockedCells.has(`${state.gridX},${state.gridY}`),false,'cat does not finish inside furniture');
}
assert.equal(entityCount.created,3,'AI updates never rebuild cat sprites');
assert.ok(saveCount>0&&saveCount<100,'logical cells are saved at low frequency, never per frame');

controller.pause('furniture-drag');
const pausedPositions=[...entities].map(([id,entity])=>[id,entity.sprite.x,entity.sprite.y]);
controller.update(60100,1000);
assert.deepEqual([...entities].map(([id,entity])=>[id,entity.sprite.x,entity.sprite.y]),pausedPositions,'AI pauses during furniture drag');
controller.onFurnitureLayoutChanged();
controller.resume('furniture-drag');
assert.equal(controller.getDebugSnapshot().paused,false,'AI resumes after furniture drag');
assert.equal([...controller.behaviors.values()].some(state=>state.needsRepath),true,'layout changes mark active paths for validation');

console.log('Cat AI simulation passed: 60 seconds, three cats moved, furniture avoided, rug walkable, pause/resume and repath active.');
