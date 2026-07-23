import {ROOM_CONFIG} from '../config/room-config.js?v=0552a';
import {FURNITURE_CONFIG} from '../config/furniture-config.js?v=0552a';
import {CAT_PROFILES} from '../config/cat-config.js?v=0552a';
import {GridSystem} from '../systems/GridSystem.js?v=0552a';
import {OccupancySystem} from '../systems/OccupancySystem.js?v=0552a';
import {PlacementSystem} from '../systems/PlacementSystem.js?v=0552a';
import {CameraController} from '../systems/CameraController.js?v=0552a';
import {DepthSystem} from '../systems/DepthSystem.js?v=0552a';
import {validateStoreLayoutBeforeOpen} from '../systems/StoreLayoutValidator.js?v=0552a';
import {FurnitureEntity} from '../entities/FurnitureEntity.js?v=0552a';
import {CatEntity} from '../entities/CatEntity.js?v=0552a';
import {CustomerEntity} from '../entities/CustomerEntity.js?v=0552a';
import {WallDecorationEntity} from '../entities/WallDecorationEntity.js?v=0552a';
import {AmbientEffects} from '../entities/AmbientEffects.js?v=0552a';
import {INPUT_MODE} from '../core/input-state.js?v=0552a';
import {InputModeController} from '../phaser/InputModeController.js?v=0552a';
import {FurnitureDragController} from '../phaser/FurnitureDragController.js?v=0552a';
import {CatBehaviorController} from '../phaser/CatBehaviorController.js?v=0552a';
import {CareInteractionController} from '../phaser/CareInteractionController.js?v=0552a';
import {InteractionDebugView} from '../phaser/InteractionDebugView.js?v=0552a';
import {ArtDebugRenderer} from '../phaser/ArtDebugRenderer.js?v=0552a';

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
    this.selectedId=null;
    this.selectedCatId=null;
  }
  initializeGrid(){
    this.grid=new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG);
    this.inputMode=new InputModeController({getSelectedItemId:()=>this.selectedId});
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
  bindInput(){}
  createCamera(){
    this.cameraController=new CameraController(this,ROOM_CONFIG,{
      inputMode:this.inputMode,
      isFurnitureDragging:()=>this.furnitureDragController?.isDragging()||false,
      onPinchStart:()=>this.furnitureDragController?.cancelForPinch()
    });
    this.furnitureDragController=new FurnitureDragController(this,{
      grid:this.grid,occupancy:this.occupancy,placement:this.placement,
      saveAdapter:this.saveAdapter,furnitureConfig:FURNITURE_CONFIG,
      inputMode:this.inputMode,cameraController:this.cameraController,
      catBehaviorController:this.catBehaviorController
    });
    this.careInteractionController=new CareInteractionController(this,{
      inputMode:this.inputMode,cameraController:this.cameraController,
      catBehaviorController:this.catBehaviorController,furnitureDragController:this.furnitureDragController,
      saveAdapter:this.saveAdapter,profiles:CAT_PROFILES
    });
    this.interactionDebug=new InteractionDebugView(this,{
      inputMode:this.inputMode,furnitureDragController:this.furnitureDragController,
      catBehaviorController:this.catBehaviorController,cameraController:this.cameraController
    });
    this.artDebug=new ArtDebugRenderer(this,{grid:this.grid,entities:this.entities,definitions:FURNITURE_CONFIG});
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.careInteractionController?.destroy();
      this.cameraController?.destroy();
      this.catBehaviorController?.destroy();
      this.interactionDebug?.destroy();
      this.artDebug?.destroy();
      this.wallDecorations?.forEach(decoration=>decoration.destroy());
      this.ambientEffects?.destroy();
    });
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
    this.wallDecorations=[
      new WallDecorationEntity(this,{texture:'environment:wall-window',x:top.x-165,y:top.y-walls.height+122,scale:.92}),
      new WallDecorationEntity(this,{texture:'environment:menu-board',x:top.x+155,y:top.y-walls.height+124,scale:.9})
    ];
    this.ambientEffects=new AmbientEffects(this,{top,floor});
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
    entity.on('pointerdown',pointer=>this.furnitureDragController?.onEntityPointerDown(pointer,item.id));
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
    this.catBehaviorController=new CatBehaviorController(this,{
      grid:this.grid,occupancy:this.occupancy,entities:this.catEntities,
      profiles:CAT_PROFILES,saveAdapter:this.saveAdapter
    });
  }
  selectCat(catId){
    this.inputMode?.setMode(INPUT_MODE.CAT_INTERACTION,{catId});
    this.selectedCatId=catId;
    this.catEntities.forEach((entity,id)=>entity.setSelected(id===catId));
    const profile=CAT_PROFILES.find(cat=>cat.id===catId)||null;
    this.game.events.emit('cat-selection-changed',profile?{
      cat:profile,
      stats:this.state.catStats?.[catId]||null,
      duty:(this.state.dutyCats||[]).includes(catId)
    }:null);
    this.inputMode?.releaseToStable();
  }
  bindPlacementInput(){
    // Formal pointer bindings live in FurnitureDragController.
  }
  beginFurnitureDrag(pointer,itemId){
    return this.furnitureDragController?.onEntityPointerDown(pointer,itemId);
  }
  startPlacement(type){
    return this.furnitureDragController?.startPlacement(type)||false;
  }
  findAvailablePlacement(type){
    return this.furnitureDragController?.findAvailablePlacement(type)||{x:4,y:4};
  }
  createGhost(item){
    return this.furnitureDragController?.createGhost(item,null);
  }
  updateDragCandidate(worldX,worldY){
    const pointer={id:this.furnitureDragController?.drag?.pointerId,x:worldX,y:worldY,positionToCamera:()=>({x:worldX,y:worldY})};
    return this.furnitureDragController?.updateCandidateFromPointer(pointer);
  }
  syncGhost(){
    return this.furnitureDragController?.syncGhost();
  }
  validation(){
    return this.furnitureDragController?.validate()||{valid:false,blockingReason:'unplaceable-cell'};
  }
  updatePlacementVisuals(){
    return this.furnitureDragController?.renderPlacementVisuals();
  }
  finishFurnitureDrag(){
    return this.furnitureDragController?.finish();
  }
  endDrag(){
    return this.furnitureDragController?.cleanup({layoutChanged:false});
  }
  cancelDrag(){
    return this.furnitureDragController?.cancel('ui-cancel');
  }
  selectItem(itemId){
    this.selectedId=itemId;
    this.entities.forEach((entity,id)=>entity.setSelected(id===itemId));
    const item=this.state.items.find(entry=>entry.id===itemId);
    this.game.events.emit('selection-changed',item?{item,definition:FURNITURE_CONFIG[item.type],placing:false}:null);
  }
  rotateSelection(){
    if(this.furnitureDragController?.isDragging()){this.furnitureDragController.rotateCandidate();return}
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
    this.saveAdapter.save();this.furnitureDragController?.renderPlacementVisuals();this.emitState();
    return this.state.placementHelper;
  }
  startCareInteraction(catId,mode){
    this.selectCat(catId);
    return this.careInteractionController?.start(catId,mode)||{started:false,reason:'controller-missing'};
  }
  cancelCareInteraction(reason='cancelled'){return this.careInteractionController?.cancel(reason)||false}
  finishCareInteraction(){return this.careInteractionController?.finish()||false}
  careCat(mode='play'){
    const id=this.selectedCatId||(this.state.dutyCats||[])[0]||'bean';
    return this.startCareInteraction(id,mode);
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
    this.furnitureDragController?.update(time,delta);
    this.catBehaviorController?.update(time,delta);
    this.careInteractionController?.update(time,delta);
    this.interactionDebug?.update(time,delta);
    this.artDebug?.update(time,delta);
  }
}
