import {ROOM_CONFIG} from '../config/room-config.js?v=0541a';
import {FURNITURE_CONFIG} from '../config/furniture-config.js?v=0541a';
import {CAT_PROFILES} from '../config/cat-config.js?v=0541a';
import {GridSystem} from '../systems/GridSystem.js?v=0541a';
import {OccupancySystem} from '../systems/OccupancySystem.js?v=0541a';
import {PlacementSystem} from '../systems/PlacementSystem.js?v=0541a';
import {CameraController} from '../systems/CameraController.js?v=0541a';
import {DepthSystem} from '../systems/DepthSystem.js?v=0541a';
import {validateStoreLayoutBeforeOpen} from '../systems/StoreLayoutValidator.js?v=0541a';
import {FurnitureEntity} from '../entities/FurnitureEntity.js?v=0541a';
import {CatEntity} from '../entities/CatEntity.js?v=0541a';
import {CustomerEntity} from '../entities/CustomerEntity.js?v=0541a';

const PHASES=['prep','morning','afternoon','evening','closed'];
const PHASE_LABELS={prep:'準備中',morning:'上午營業',afternoon:'午後營業',evening:'晚間營業',closed:'已打烊'};

export class CafeScene extends Phaser.Scene{
  constructor(){super('CafeScene')}
  create(){
    this.bootStage='啟動 CafeScene';
    try{
      this.events.once(Phaser.Scenes.Events.CREATE,()=>this.game.events.emit('cafe-scene-create',this));
      this.runBootStage('讀取存檔…',.80,()=>this.initializeState());
      this.runBootStage('建立地板座標…',.83,()=>this.initializeGrid());
      this.runBootStage('遷移存檔…',.86,()=>this.migrateSaveIfNeeded());
      this.runBootStage('建立房間…',.89,()=>this.drawRoom());
      this.runBootStage('載入家具…',.93,()=>this.createSceneFurniture());
      this.runBootStage('建立貓咪…',.96,()=>this.createCats());
      this.runBootStage('綁定操作…',.98,()=>this.bindInput());
      this.runBootStage('建立 Camera…',.99,()=>this.createCamera());
      this.runBootStage('準備完成…',1,()=>this.finishBoot());
    }catch(error){
      console.error(`CafeScene initialization failed at ${this.bootStage}`,error);
      this.game.events.emit('boot-failed',{stage:this.bootStage,error});
      this.scene.pause();
    }
  }
  runBootStage(stage,progress,callback){
    this.bootStage=stage;
    this.registry.get('startupController')?.setStatus(stage);
    const result=callback();
    this.registry.get('startupController')?.setProgress(progress);
    this.game.events.emit('boot-progress',progress);
    return result;
  }
  initializeState(){
    this.saveAdapter=this.registry.get('saveAdapter');
    if(!this.saveAdapter)throw new Error('SaveAdapter 未在 preBoot 註冊');
    this.state=this.saveAdapter.state;
    this.entities=new Map();
    this.customers=new Map();
    this.catEntities=new Map();
    this.dragState=null;
    this.selectedId=null;
    this.selectedCatId=null;
  }
  initializeGrid(){
    this.grid=new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG);
  }
  migrateSaveIfNeeded(){
    this.saveAdapter.migrateIfNeeded(this.grid);
    this.occupancy=new OccupancySystem(this.grid,FURNITURE_CONFIG);
    this.occupancy.build(this.state.items);
    this.placement=new PlacementSystem(this.grid,this.occupancy,FURNITURE_CONFIG);
  }
  createSceneFurniture(){
    this.placementGraphics=this.add.graphics().setDepth(DepthSystem.for('placement',0));
    this.createFurniture();
  }
  bindInput(){this.bindPlacementInput()}
  createCamera(){
    this.cameraController=new CameraController(this,ROOM_CONFIG,{isFurnitureDragging:()=>Boolean(this.dragState)});
    this.time.addEvent({delay:6500,loop:true,callback:()=>this.maybeSpawnCustomer()});
  }
  finishBoot(){
    this.registry.set('cafe-ready',true);
    this.registry.get('startupController')?.setProgress(1);
    this.game.events.emit('scene-ready',this);
    this.emitState();
    if(this.state.migrationWarnings?.length)this.game.events.emit('toast',{message:`${this.state.migrationWarnings.length} 件無法直接遷移的家具已安全保留`,key:'migration-warning',priority:2,duration:4200});
  }
  drawRoom(){
    const graphics=this.add.graphics();
    const {floor,walls}=ROOM_CONFIG;
    const top=this.grid.getCellDiamond(0,0)[0];
    const right=this.grid.getCellDiamond(floor.cols-1,0)[1];
    const left=this.grid.getCellDiamond(0,floor.rows-1)[3];
    graphics.fillStyle(walls.left.fill,1).fillPoints([top,left,{x:left.x,y:left.y-walls.height},{x:top.x,y:top.y-walls.height}],true);
    graphics.fillStyle(walls.right.fill,1).fillPoints([top,right,{x:right.x,y:right.y-walls.height},{x:top.x,y:top.y-walls.height}],true);
    graphics.lineStyle(8,walls.left.accent,1).strokePoints([top,left],false);
    graphics.lineStyle(8,walls.right.accent,1).strokePoints([top,right],false);
    // Original wall decorations generated from the same room geometry.
    graphics.fillStyle(0x8bd0dc,.85).fillRect(top.x-210,top.y-walls.height+55,125,92);
    graphics.lineStyle(9,0xf5e4ca,1).strokeRect(top.x-210,top.y-walls.height+55,125,92);
    graphics.fillStyle(0x4b3b32,.9).fillRoundedRect(top.x+82,top.y-walls.height+64,145,88,8);
    graphics.lineStyle(6,0xd8b384,1).strokeRoundedRect(top.x+82,top.y-walls.height+64,145,88,8);
    for(let y=0;y<floor.rows;y++)for(let x=0;x<floor.cols;x++){
      const diamond=this.grid.getCellDiamond(x,y);
      const color=floor.colors[(x+y*3)%floor.colors.length];
      graphics.fillStyle(color,1).fillPoints(diamond,true);
      graphics.lineStyle(1,floor.lineColor,.32).strokePoints([...diamond,diamond[0]],false);
    }
    ROOM_CONFIG.entrance.cells.forEach(cell=>{
      const diamond=this.grid.getCellDiamond(cell.x,cell.y);
      graphics.fillStyle(0x9f765a,.48).fillPoints(diamond,true);
    });
    graphics.setDepth(-1000);
  }
  createFurniture(){
    this.entities.forEach(entity=>entity.destroy());
    this.entities.clear();
    this.state.items.forEach(item=>this.addFurnitureEntity(item));
  }
  addFurnitureEntity(item){
    const definition=FURNITURE_CONFIG[item.type];
    if(!definition)return null;
    const entity=new FurnitureEntity(this,item,definition,this.grid);
    entity.on('pointerdown',pointer=>this.beginFurnitureDrag(pointer,item.id));
    entity.on('pointerup',pointer=>pointer.event?.stopPropagation?.());
    this.entities.set(item.id,entity);
    return entity;
  }
  createCats(){
    const duty=new Set(this.state.dutyCats||[]);
    this.catEntities.forEach(entity=>entity.destroy());
    this.catEntities.clear();
    CAT_PROFILES.forEach((profile,index)=>{
      if(!duty.has(profile.id)&&index>2)return;
      const cell=profile.initialCell||[{x:1,y:6},{x:5,y:6},{x:7,y:5},{x:3,y:7},{x:8,y:4}][index];
      const entity=new CatEntity(this,profile,this.grid.getCellCenter(cell.x,cell.y),{
        duty:duty.has(profile.id),
        onSelect:(catId)=>this.selectCat(catId)
      });
      this.catEntities.set(profile.id,entity);
    });
  }
  selectCat(catId){
    this.selectedCatId=catId;
    this.catEntities.forEach((entity,id)=>entity.setSelected(id===catId));
    const profile=CAT_PROFILES.find(cat=>cat.id===catId)||null;
    this.game.events.emit('cat-selection-changed',profile?{
      cat:profile,
      stats:this.state.catStats?.[catId]||null,
      duty:(this.state.dutyCats||[]).includes(catId)
    }:null);
  }
  bindPlacementInput(){
    this.input.on('pointerdown',pointer=>{
      if(this.dragState?.isNew&&this.dragState.pointerId===null){
        this.dragState.pointerId=pointer.id;
        const world=pointer.positionToCamera(this.cameras.main);
        this.updateDragCandidate(world.x,world.y);
      }
    });
    this.input.on('pointermove',pointer=>{
      if(!this.dragState||pointer.id!==this.dragState.pointerId)return;
      const world=pointer.positionToCamera(this.cameras.main);
      this.updateDragCandidate(world.x,world.y);
    });
    const finish=pointer=>{
      if(this.dragState&&pointer.id===this.dragState.pointerId)this.finishFurnitureDrag();
    };
    this.input.on('pointerup',finish);
    this.input.on('pointerupoutside',finish);
  }
  beginFurnitureDrag(pointer,itemId){
    if(this.dragState)return;
    const item=this.state.items.find(entry=>entry.id===itemId);
    if(!item)return;
    this.selectItem(itemId);
    this.occupancy.removeItem(itemId);
    const entity=this.entities.get(itemId);
    entity.setAlpha(.35);
    this.dragState={
      pointerId:pointer.id,isNew:false,movingItemId:itemId,
      original:{...item},candidate:{...item},entity
    };
    this.createGhost(item);
    pointer.event?.stopPropagation?.();
  }
  startPlacement(type){
    if(!FURNITURE_CONFIG[type])return false;
    this.cancelDrag();
    const candidate=this.findAvailablePlacement(type);
    const item={id:`new-${Date.now().toString(36)}`,type,x:candidate.x,y:candidate.y,r:0};
    this.dragState={pointerId:null,isNew:true,movingItemId:null,original:null,candidate:item,entity:null};
    this.createGhost(item);
    this.updatePlacementVisuals();
    this.game.events.emit('selection-changed',{item,definition:FURNITURE_CONFIG[type],placing:true});
    return true;
  }
  findAvailablePlacement(type){
    for(let y=0;y<ROOM_CONFIG.floor.rows;y++)for(let x=0;x<ROOM_CONFIG.floor.cols;x++){
      if(this.placement.validatePlacement({type,x,y,rotation:0}).valid)return {x,y};
    }
    return {x:4,y:4};
  }
  createGhost(item){
    this.ghost?.destroy();
    const definition=FURNITURE_CONFIG[item.type];
    const anchor=this.grid.getAnchor(item.type,item.x,item.y,item.r||0);
    this.ghost=this.add.image(anchor.x,anchor.y,`furniture:${item.type}`)
      .setOrigin(.5,definition.layer==='floorDecoration'?.5:1)
      .setAlpha(.72).setDepth(DepthSystem.for('ghost',anchor.y));
    const targetWidth=Math.max(44,Math.min(180,definition.size||96));
    if(this.ghost.width)this.ghost.setScale(targetWidth/this.ghost.width);
  }
  updateDragCandidate(worldX,worldY){
    const snapped=this.grid.snapWorldToGrid(worldX,worldY);
    const drag=this.dragState;
    drag.candidate.x=snapped.x;
    drag.candidate.y=snapped.y;
    this.syncGhost();
    this.updatePlacementVisuals();
  }
  syncGhost(){
    const item=this.dragState?.candidate;
    if(!item||!this.ghost)return;
    const anchor=this.grid.getAnchor(item.type,item.x,item.y,item.r||0);
    this.ghost.setPosition(anchor.x,anchor.y).setFlipX(Boolean((item.r||0)%2)).setDepth(DepthSystem.for('ghost',anchor.y));
  }
  validation(){
    const item=this.dragState.candidate;
    return this.placement.validatePlacement({type:item.type,x:item.x,y:item.y,rotation:item.r||0,movingItemId:this.dragState.movingItemId});
  }
  updatePlacementVisuals(){
    this.placementGraphics.clear();
    if(!this.dragState)return;
    const item=this.dragState.candidate;
    if(this.state.placementHelper){
      for(let y=item.y-2;y<=item.y+2;y++)for(let x=item.x-2;x<=item.x+2;x++){
        if(!this.grid.isPlaceableCell(x,y))continue;
        const diamond=this.grid.getCellDiamond(x,y);
        this.placementGraphics.fillStyle(0xfff2c8,.10).fillPoints(diamond,true);
        this.placementGraphics.lineStyle(1,0xfff2c8,.28).strokePoints([...diamond,diamond[0]],false);
      }
    }
    const result=this.validation();
    const polygon=this.grid.getFootprintPolygon(item.type,item.x,item.y,item.r||0);
    const color=result.valid?0x60be73:0xda5252;
    this.placementGraphics.fillStyle(color,.25).fillPoints(polygon,true);
    this.placementGraphics.lineStyle(2,color,.9).strokePoints([...polygon,polygon[0]],false);
    this.ghost?.setTint(result.valid?0xc9ffd1:0xffb3b3);
  }
  finishFurnitureDrag(){
    if(!this.dragState)return;
    const result=this.validation();
    const drag=this.dragState;
    if(result.valid){
      if(drag.isNew){
        const type=drag.candidate.type;
        const inventory=this.state.inventory[type]||0;
        if(inventory>0)this.state.inventory[type]=inventory-1;
        else{
          const price=FURNITURE_CONFIG[type].price||0;
          if(this.state.coins<price){
            this.game.events.emit('toast',{message:'金幣不足，尚未購買這件家具',key:'not-enough-coins',priority:2});
            this.endDrag();
            return;
          }
          this.state.coins-=price;
        }
        const item={...drag.candidate,id:`i-${Date.now().toString(36)}`};
        this.state.items.push(item);
        this.occupancy.addItem(item);
        this.addFurnitureEntity(item);
        this.selectItem(item.id);
      }else{
        Object.assign(drag.original,drag.candidate);
        this.occupancy.addItem(drag.original);
        drag.entity.setAlpha(1).sync();
      }
      this.saveAdapter.save();
      this.emitState();
      this.endDrag();
    }else{
      if(!drag.isNew){
        this.occupancy.addItem(drag.original);
        drag.entity.setAlpha(1).sync();
        this.endDrag();
      }
      this.game.events.emit('toast',{message:result.message||'這裡不能放置',key:`placement-${result.blockingReason}`,priority:2,cooldown:1200});
    }
  }
  endDrag(){
    this.dragState=null;
    this.ghost?.destroy();this.ghost=null;
    this.placementGraphics.clear();
  }
  cancelDrag(){
    if(!this.dragState)return;
    if(!this.dragState.isNew){
      this.occupancy.addItem(this.dragState.original);
      this.dragState.entity?.setAlpha(1).sync();
    }
    this.endDrag();
  }
  selectItem(itemId){
    this.selectedId=itemId;
    this.entities.forEach((entity,id)=>entity.setSelected(id===itemId));
    const item=this.state.items.find(entry=>entry.id===itemId);
    this.game.events.emit('selection-changed',item?{item,definition:FURNITURE_CONFIG[item.type],placing:false}:null);
  }
  rotateSelection(){
    if(this.dragState){
      this.dragState.candidate.r=((this.dragState.candidate.r||0)+1)%4;
      this.syncGhost();this.updatePlacementVisuals();return;
    }
    const item=this.state.items.find(entry=>entry.id===this.selectedId);
    if(!item)return;
    this.occupancy.removeItem(item.id);
    const next={...item,r:((item.r||0)+1)%4};
    const result=this.placement.validatePlacement({type:next.type,x:next.x,y:next.y,rotation:next.r,movingItemId:item.id});
    if(result.valid){Object.assign(item,next);this.occupancy.addItem(item);this.entities.get(item.id)?.sync();this.saveAdapter.save()}
    else{this.occupancy.addItem(item);this.game.events.emit('toast',{message:result.message,key:'rotate-invalid',priority:2})}
  }
  storeSelection(){
    const index=this.state.items.findIndex(entry=>entry.id===this.selectedId);
    if(index<0)return;
    const [item]=this.state.items.splice(index,1);
    this.state.inventory[item.type]=(this.state.inventory[item.type]||0)+1;
    this.occupancy.removeItem(item.id);
    this.entities.get(item.id)?.destroy();this.entities.delete(item.id);
    this.selectedId=null;this.saveAdapter.save();this.emitState();
    this.game.events.emit('selection-changed',null);
  }
  sellSelection(){
    const index=this.state.items.findIndex(entry=>entry.id===this.selectedId);
    if(index<0)return;
    const [item]=this.state.items.splice(index,1);
    this.state.coins+=Math.floor((FURNITURE_CONFIG[item.type].price||0)*.5);
    this.occupancy.removeItem(item.id);
    this.entities.get(item.id)?.destroy();this.entities.delete(item.id);
    this.selectedId=null;this.saveAdapter.save();this.emitState();
    this.game.events.emit('selection-changed',null);
  }
  togglePlacementHelper(){
    this.state.placementHelper=!this.state.placementHelper;
    this.saveAdapter.save();this.updatePlacementVisuals();this.emitState();
    return this.state.placementHelper;
  }
  careCat(mode='play'){
    if(this.state.energy<=0){this.game.events.emit('toast',{message:'體力不足，下一天會恢復',key:'energy-empty',priority:2});return}
    const id=this.selectedCatId||(this.state.dutyCats||[])[0]||'bean';
    const stats=this.state.catStats[id]||{satiety:60,mood:60,bond:0,clean:60};
    this.state.energy--;
    if(mode==='feed')stats.satiety=Math.min(100,stats.satiety+14);
    if(mode==='groom')stats.clean=Math.min(100,stats.clean+14);
    if(mode==='play')stats.mood=Math.min(100,stats.mood+14);
    stats.bond=(stats.bond||0)+2;
    this.state.catStats[id]=stats;this.state.tasks.care=(this.state.tasks.care||0)+1;
    this.saveAdapter.save();this.emitState();
    this.catEntities.get(id)?.playHappy();
    this.game.events.emit('toast',{message:`已和 ${CAT_PROFILES.find(cat=>cat.id===id)?.name||'貓咪'} 完成互動`,key:`care-${mode}`});
  }
  openStoreForDay(){
    const layout=validateStoreLayoutBeforeOpen(this.state.items,this.placement);
    if(layout.warnings.length)this.game.events.emit('toast',{message:`${layout.warnings.length} 張椅子尚未配桌，暫不計入座位`,key:'layout-chair-warning',priority:1,duration:3200});
    this.state.phase='morning';this.state.phaseElapsed=0;this.saveAdapter.save();this.emitState();
  }
  nextPhase(){
    const index=PHASES.indexOf(this.state.phase);
    if(index<PHASES.length-1)this.state.phase=PHASES[index+1];
    if(this.state.phase==='closed')this.closeDay();
    this.saveAdapter.save();this.emitState();
  }
  closeDay(){
    const report={day:this.state.day,revenue:this.state.dailyRevenue,served:this.state.servedCustomers,reputation:this.state.dailyRep};
    this.state.day++;this.state.phase='prep';this.state.energy=this.state.maxEnergy;
    this.state.coins+=this.state.dailyRevenue;this.state.reputation+=this.state.dailyRep;this.state.xp=(this.state.xp||0)+this.state.servedCustomers*8;
    this.game.events.emit('daily-report',report);
    this.state.dailyRevenue=0;this.state.dailyRep=0;this.state.servedCustomers=0;this.state.dailyOrders=0;
  }
  maybeSpawnCustomer(){
    if(!['morning','afternoon','evening'].includes(this.state.phase)||this.customers.size>=4)return;
    const id=`customer-${Date.now().toString(36)}`;
    const entrance=this.grid.getCellCenter(9,7);
    const targets=[{x:2,y:5},{x:4,y:5},{x:6,y:4},{x:7,y:6}];
    const targetCell=targets[this.customers.size%targets.length];
    const customer=new CustomerEntity(this,id,entrance,[0x7fa6b8,0xd58ca0,0x86ad79,0xc49a6c][this.customers.size%4]);
    this.customers.set(id,customer);
    customer.walkTo(this.grid.getCellCenter(targetCell.x,targetCell.y),()=>{
      this.time.delayedCall(2600,()=>{
        if(!customer.active)return;
        this.state.dailyRevenue+=320;this.state.dailyRep+=6;this.state.servedCustomers++;this.state.dailyOrders++;this.state.tasks.serve=(this.state.tasks.serve||0)+1;this.state.tasks.revenue=(this.state.tasks.revenue||0)+320;
        customer.walkTo(entrance,()=>{customer.destroy();this.customers.delete(id)});
        this.emitState();
      });
    });
  }
  emitState(){
    this.game.events.emit('state-changed',{...this.state,phaseLabel:PHASE_LABELS[this.state.phase]||this.state.phase});
  }
  update(time,delta){
    this.catEntities?.forEach(entity=>entity.update(time,delta));
  }
}
