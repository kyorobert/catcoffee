import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FurnitureDragController} from '../assets/js/phaser/FurnitureDragController.js';

function harness({valid=true}={}){
  const item={id:'chair-1',type:'chair',x:1,y:1,r:0};
  const events=[];
  const occupancy={items:new Map(),addItem(value){this.items.set(value.id,{item:{...value}})},removeItem(id){this.items.delete(id)},getOccupant(){return null}};
  const entity={setGridPosition(x,y,r){item.x=x;item.y=y;item.r=r;return this},setDragVisual(){return this}};
  const controller=Object.create(FurnitureDragController.prototype);
  Object.assign(controller,{
    scene:{
      state:{items:[item],inventory:{},coins:1000,placementHelper:false},
      placementGraphics:{clear(){}},entities:new Map([[item.id,entity]]),selectedId:item.id,
      game:{events:{emit:(name,payload)=>events.push({name,payload})}},
      emitState(){},addFurnitureEntity(){},selectItem(){}
    },
    grid:{
      lastSnap:null,getFootprintCells:()=>[{x:2,y:1}],
      getCellCenter:()=>({x:0,y:0}),getAnchor:()=>({x:0,y:10}),
      snapWorldToGrid(x,y){this.lastSnap={x,y};return {x:2,y:1}}
    },
    occupancy,saveAdapter:{count:0,save(){this.count++}},
    furniture:{chair:{price:1,layer:'floorObject'}},
    inputMode:{releaseToStable(){this.released=true}},cameraController:{setEnabled(value){this.enabled=value}},
    catBehaviorController:{resume(){this.resumed=true},onFurnitureLayoutChanged(){this.changed=true},isAnyCatInCells(){return false}},
    ghost:null,armed:null,lastValidation:null,
    drag:{pointerId:1,isNew:false,movingItemId:item.id,item,original:{...item},candidate:{...item,x:2},entity},
    validate:()=>valid?{valid:true,blockingReason:null,warnings:[]}:{valid:false,blockingReason:'overlap',message:'occupied',warnings:[]}
  });
  return {controller,item,entity,occupancy,events};
}

let test=harness();
assert.equal(test.controller.finish(),true);
assert.equal(test.item.x,2);
assert.equal(test.controller.saveAdapter.count,1,'successful drag saves once');
assert.equal(test.occupancy.items.has(test.item.id),true,'successful drag restores occupancy at the new location');
assert.equal(test.controller.cameraController.enabled,true);
assert.equal(test.controller.catBehaviorController.resumed,true);
assert.equal(test.controller.catBehaviorController.changed,true);

test=harness({valid:false});
assert.equal(test.controller.finish(),false);
assert.equal(test.item.x,1,'failed drag retains the original pure item data');
assert.equal(test.controller.saveAdapter.count,0,'failed drag does not save');
assert.equal(test.events.filter(event=>event.name==='toast').length,1,'failed pointerup produces one toast');
assert.equal(test.occupancy.items.has(test.item.id),true,'failed drag restores occupancy');

test=harness();
test.controller.cancel('pointercancel');
assert.equal(test.item.x,1);
assert.equal(test.occupancy.items.has(test.item.id),true,'pointercancel restores occupancy');
assert.equal(test.controller.cameraController.enabled,true,'pointercancel restores camera');
assert.equal(test.controller.catBehaviorController.resumed,true,'pointercancel restores AI');

test=harness();
test.controller.pointerToWorld=()=>({x:200,y:110});
test.controller.syncGhost=()=>{};
test.controller.renderPlacementVisuals=()=>{};
test.controller.updateCandidateFromPointer({id:1});
assert.equal(test.controller.saveAdapter.count,0,'pointermove candidate update never saves');
assert.equal(test.events.length,0,'pointermove candidate update never emits a toast');
assert.deepEqual(test.controller.grid.lastSnap,{x:200,y:100},'foot anchor offset is removed before worldToGrid snapping');

const source=readFileSync(new URL('../assets/js/phaser/FurnitureDragController.js',import.meta.url),'utf8');
assert.match(source,/input\.on\('dragstart'/);
assert.match(source,/input\.on\('drag'/);
assert.match(source,/input\.on\('dragend'/);
assert.match(source,/pointer\.positionToCamera\(camera\)/,'desktop pointer uses the main camera conversion');
assert.match(source,/addEventListener\('pointercancel'/);
assert.doesNotMatch(source,/handlePointerMove[\s\S]{0,500}(?:save\(|emit\('toast')/,'pointermove handler has no save or toast side effect');

console.log('Furniture drag tests passed: success, invalid rollback, pointercancel, Camera/AI cleanup and quiet pointermove.');
