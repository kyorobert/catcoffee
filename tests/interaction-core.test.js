import assert from 'node:assert/strict';
import {findPath} from '../assets/js/core/grid-pathfinder.js';
import {
  CAT_STATE,createCatBehaviorState,chooseCatTarget,beginWalking,finishPath,
  pauseBehavior,resumeBehavior,markLayoutChanged,shouldLeaveIdle
} from '../assets/js/core/cat-behavior-core.js';
import {INPUT_MODE,canTransitionInputMode} from '../assets/js/core/input-state.js';

assert.equal(globalThis.Phaser,undefined,'pure core runs without a Phaser global');
const blocked=new Set(['2,1','2,2','2,3']);
const path=findPath({start:{x:0,y:2},goal:{x:4,y:2},cols:5,rows:5,isWalkable:(x,y)=>!blocked.has(`${x},${y}`)});
assert.deepEqual(path[0],{x:0,y:2});
assert.deepEqual(path.at(-1),{x:4,y:2});
assert.equal(path.some(cell=>blocked.has(`${cell.x},${cell.y}`)),false,'path does not cross furniture');
assert.deepEqual(findPath({start:{x:1,y:1},goal:{x:1,y:1},cols:3,rows:3,isWalkable:()=>true}),[{x:1,y:1}]);
assert.deepEqual(findPath({start:{x:0,y:0},goal:{x:2,y:2},cols:3,rows:3,isWalkable:(x,y)=>x===0&&y===0}),[]);
assert.ok(findPath({start:{x:0,y:0},goal:{x:2,y:0},cols:3,rows:2,isWalkable:()=>true}).length,'floor decorations do not enter the walkability callback as blockers');

let state=createCatBehaviorState({id:'bean',gridX:0,gridY:0},{now:0,random:()=>0});
assert.equal(state.state,CAT_STATE.IDLE);
assert.equal(shouldLeaveIdle(state,2000),true);
const target=chooseCatTarget({
  origin:{x:0,y:0},candidates:[{x:1,y:0},{x:2,y:0},{x:3,y:0}],
  isWalkable:(x)=>x!==3,reservedCells:new Set(['1,0']),random:()=>0
});
assert.deepEqual(target,{x:2,y:0},'target excludes blocked and reserved cells');
state=beginWalking(state,target,[{x:0,y:0},{x:1,y:0},{x:2,y:0}]);
assert.equal(state.state,CAT_STATE.WALKING);
state=finishPath({...state,gridX:2,gridY:0},5000,()=>0.9);
assert.equal(state.state,CAT_STATE.IDLE,'arrival returns to an idle-family state');
state=pauseBehavior({...state,state:CAT_STATE.WALKING,path:[{x:2,y:0},{x:2,y:1}]});
assert.equal(state.state,CAT_STATE.PAUSED);
assert.equal(shouldLeaveIdle(state,999999),false,'paused cats do not make decisions');
state=markLayoutChanged(state);
assert.equal(state.needsRepath,true);
state=resumeBehavior(state,6000,()=>0);
assert.equal(state.state,CAT_STATE.WALKING);

assert.equal(canTransitionInputMode(INPUT_MODE.IDLE,INPUT_MODE.CAMERA_PAN),true);
assert.equal(canTransitionInputMode(INPUT_MODE.FURNITURE_DRAG,INPUT_MODE.PINCH_ZOOM),true);
assert.equal(canTransitionInputMode(INPUT_MODE.PINCH_ZOOM,INPUT_MODE.FURNITURE_DRAG),false);

console.log('Portable interaction core passed: input transitions, BFS avoidance and cat behavior state rules.');
