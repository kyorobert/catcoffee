import {ROOM_CONFIG} from '../config/room-config.js?v=0577e';
import {FURNITURE_CONFIG} from '../config/furniture-config.js?v=0577e';
import {CAT_PROFILES} from '../config/cat-config.js?v=0577e';
import {GridSystem} from '../systems/GridSystem.js?v=0577e';
import {OccupancySystem} from '../systems/OccupancySystem.js?v=0577e';
import {PlacementSystem} from '../systems/PlacementSystem.js?v=0577e';
import {CameraController} from '../systems/CameraController.js?v=0577e';
import {DepthSystem} from '../systems/DepthSystem.js?v=0577e';
import {validateStoreLayoutBeforeOpen} from '../systems/StoreLayoutValidator.js?v=0577e';
import {FurnitureEntity} from '../entities/FurnitureEntity.js?v=0577e';
import {CatEntity} from '../entities/CatEntity.js?v=0577e';
import {CustomerEntity} from '../entities/CustomerEntity.js?v=0577e';
import {WallDecorationEntity} from '../entities/WallDecorationEntity.js?v=0577e';
import {AmbientEffects} from '../entities/AmbientEffects.js?v=0577e';
import {INPUT_MODE} from '../core/input-state.js?v=0577e';
import {InputModeController} from '../phaser/InputModeController.js?v=0577e';
import {FurnitureDragController} from '../phaser/FurnitureDragController.js?v=0577e';
import {CatBehaviorController} from '../phaser/CatBehaviorController.js?v=0577e';
import {CareInteractionController} from '../phaser/CareInteractionController.js?v=0577e';
import {InteractionDebugView} from '../phaser/InteractionDebugView.js?v=0577e';
import {ArtDebugRenderer} from '../phaser/ArtDebugRenderer.js?v=0577e';
import {projectionModeFromSearch,PROJECTION_MODE} from '../core/projection-mode.js?v=0577e';
import {flatPresetFromSearch} from '../config/flat-projection-presets.js?v=0577e';
import {ORTHO_ROOM_ZONES,zoneAt} from '../config/ortho-room-zones.js?v=0577e';
import {DEFAULT_ORTHOGONAL_ROOM_SKIN,getOrthogonalCellAppearance}
  from '../config/ortho-room-skin.js?v=0577e';
import {buildOrthoDemoItems,isDemoLayoutRequested} from '../config/ortho-demo-layout.js?v=0577e';
import {ViewportMetrics} from '../ui/viewport-metrics.js?v=0577e';
import {ORTHO_FRAMING} from '../core/camera-framing.js?v=0577e';
import {
  ROTATION_POLICY,
  createRotationEditSession,
  advanceRotationEditSession,
  getOrthogonalRotationPolicy,
  resolveNextOrthogonalRotation
} from '../core/orthogonal-furniture-rotation.js?v=0577e';

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
    this.rotationEditSession=null;
    this.lastRotationCandidate=null;
  }
  initializeGrid(){
    const search=typeof location!=='undefined'?location.search:'';
    this.projectionMode=projectionModeFromSearch(search);
    this.flatPresetId=flatPresetFromSearch(search);
    // Demo composition is orthogonal-only and display-only; it never writes the save.
    this.demoLayoutActive=this.projectionMode===PROJECTION_MODE.ORTHO&&isDemoLayoutRequested(search);
    this.demoItems=this.demoLayoutActive?buildOrthoDemoItems():null;
    this.grid=new GridSystem(ROOM_CONFIG,FURNITURE_CONFIG,{mode:this.projectionMode,flatPreset:this.flatPresetId});
    this.inputMode=new InputModeController({getSelectedItemId:()=>this.selectedId});
  }
  // Items shown in the scene: the ortho demo composition (opt-in) or the real save.
  // The demo layout NEVER touches state.items, inventory, coins or the save.
  getLayoutItems(){return this.demoLayoutActive?this.demoItems:this.state.items;}
  migrateSaveIfNeeded(){
    // The opt-in demo is presentation evidence only. It must not migrate or write the
    // player's real save, even when that save predates the entrance relocation.
    this.migrationResult=this.demoLayoutActive
      ?{performed:false,demoSkipped:true,entranceConflictCount:0,newWarnings:[]}
      :this.saveAdapter.migrateIfNeeded(this.grid);
    this.occupancy=new OccupancySystem(this.grid,FURNITURE_CONFIG);
    this.occupancy.build(this.getLayoutItems());
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
      onPinchStart:()=>this.furnitureDragController?.cancelForPinch(),
      framing:this.projectionMode===PROJECTION_MODE.ORTHO?this.buildOrthoFraming():null
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
    this.artDebug=new ArtDebugRenderer(this,{
      grid:this.grid,entities:this.entities,definitions:FURNITURE_CONFIG,
      getRotationCandidate:()=>this.lastRotationCandidate
    });
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
    const movedCount=Number(this.migrationResult?.entranceConflictCount||0);
    if(movedCount>0)this.game.events.emit('toast',{
      message:`入口位置已調整，${movedCount} 件家具已安全收納`,
      key:'entrance-migration-5402',
      priority:2,
      duration:4200
    });
  }
  drawRoom(){
    if(this.projectionMode===PROJECTION_MODE.ORTHO){this.drawRoomOrtho();return;}
    if(this.projectionMode===PROJECTION_MODE.FLAT){this.drawRoomFlat();return;}
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
  // Flat room rendering, shared by all three composition presets (ARCH-0563). Every
  // point is derived from the projected outer frame and per-cell polygons via the
  // GridSystem Facade, so it uses no iso-specific constants and never touches the
  // logical walkable area. Back-wall height, whether a left side wall is drawn, the
  // outline widths and the wall-decoration placement all come from the resolved
  // preset's `room` metadata (config/flat-projection-presets.js) — no per-preset
  // numbers live here. The iso branch above is left untouched. Walls are purely visual
  // (depth -1000) and change no grid, occupancy or pathfinding data. Current Flat
  // (sideWall:false, height 176) reproduces the ARCH-0562 rendering exactly.
  drawRoomFlat(){
    const graphics=this.add.graphics();
    const {floor,walls}=ROOM_CONFIG;
    const cols=floor.cols,rows=floor.rows;
    const frame=this.grid.flatPreset.room;
    const wallHeight=frame.backWallHeight;
    const cornerTL=this.grid.getCellDiamond(0,0)[0];
    const cornerTR=this.grid.getCellDiamond(cols-1,0)[1];
    const cornerBR=this.grid.getCellDiamond(cols-1,rows-1)[2];
    const cornerBL=this.grid.getCellDiamond(0,rows-1)[3];
    const raise=point=>({x:point.x,y:point.y-wallHeight});
    // Optional left side wall (near-iso/balanced): clarifies the back corner and room
    // enclosure. Current Flat omits it, matching the ARCH-0562 single-wall look.
    if(frame.sideWall){
      graphics.fillStyle(walls.left.fill,1).fillPoints([cornerTL,cornerBL,raise(cornerBL),raise(cornerTL)],true);
      graphics.lineStyle(frame.backWallTopWidth,walls.left.accent,1).strokePoints([raise(cornerTL),raise(cornerBL)],false);
    }
    // Back wall: a strip standing above the back edge (it slants when the preset keeps
    // column tilt, and is horizontal for Current Flat).
    graphics.fillStyle(walls.right.fill,1).fillPoints([cornerTL,cornerTR,raise(cornerTR),raise(cornerTL)],true);
    graphics.lineStyle(frame.backWallTopWidth,walls.right.accent,1).strokePoints([raise(cornerTL),raise(cornerTR)],false);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const diamond=this.grid.getCellDiamond(x,y);
      const color=floor.colors[(x+y*3)%floor.colors.length];
      graphics.fillStyle(color,1).fillPoints(diamond,true);
      graphics.lineStyle(1,floor.lineColor,.32).strokePoints([...diamond,diamond[0]],false);
    }
    graphics.lineStyle(frame.floorOutlineWidth,walls.left.accent,1).strokePoints([cornerTL,cornerTR,cornerBR,cornerBL,cornerTL],false);
    ROOM_CONFIG.entrance.cells.forEach(cell=>{
      const diamond=this.grid.getCellDiamond(cell.x,cell.y);
      graphics.fillStyle(0x9f765a,.48).fillPoints(diamond,true);
    });
    graphics.setDepth(-1000);
    const deco=frame.decoration;
    const spanX=cornerTR.x-cornerTL.x;
    const spanY=cornerTR.y-cornerTL.y;
    const decoAt=fx=>({x:cornerTL.x+spanX*fx,y:cornerTL.y+spanY*fx-wallHeight*deco.heightFactor});
    const windowPos=decoAt(deco.windowFx);
    const boardPos=decoAt(deco.boardFx);
    this.wallDecorations=[
      new WallDecorationEntity(this,{texture:'environment:wall-window',x:windowPos.x,y:windowPos.y,scale:deco.windowScale}),
      new WallDecorationEntity(this,{texture:'environment:menu-board',x:boardPos.x,y:boardPos.y,scale:deco.boardScale})
    ];
    // Ambient window glow/dust are positioned from iso-specific origin coordinates,
    // so they are intentionally omitted in the flat presets (known limitation).
  }
  // Orthogonal room rendering: a true front-facing rectangle. Every point is derived
  // from the projected outer frame and per-cell rectangles (via the GridSystem Facade),
  // never from fixed screen coordinates, and nothing here is skewed, sheared or rotated.
  // Room presentation comes from ortho-room-skin.js. Walls and fixed shell are purely
  // visual (depth -1000) and change no grid/occupancy/pathfinding/save data.
  // The iso and flat branches above are left untouched.
  // Lighten (factor>0) or darken (factor<0) a 0xRRGGBB colour by a fraction. Pure helper for
  // the subtle per-cell zone-floor 2-tone; no engine state.
  shadeColor(hex,factor){
    const clamp=c=>Math.max(0,Math.min(255,Math.round(c*(1+factor))));
    return (clamp((hex>>16)&255)<<16)|(clamp((hex>>8)&255)<<8)|clamp(hex&255);
  }
  drawRoomOrtho(){
    const graphics=this.add.graphics();
    const {floor,worldWidth,worldHeight}=ROOM_CONFIG;
    const cols=floor.cols,rows=floor.rows;
    const skin=DEFAULT_ORTHOGONAL_ROOM_SKIN;
    this.orthoRoomSkin=skin;
    const TL=this.grid.getCellDiamond(0,0)[0];
    const TR=this.grid.getCellDiamond(cols-1,0)[1];
    const BR=this.grid.getCellDiamond(cols-1,rows-1)[2];
    const BL=this.grid.getCellDiamond(0,rows-1)[3];
    const floorW=TR.x-TL.x,floorTop=TL.y,wallTop=floorTop-skin.layout.wallHeight;
    const sh=skin.shell;
    // VISUAL SHELL (ARCH-0575A): the wall + floor are drawn BEYOND the logical 10x8 grid so the
    // room material reaches the safe-viewport edges — the cafe fills the screen instead of sitting
    // as a card in a backdrop. Display-only; adds NO placeable cells and does not touch the grid.
    const shLeft=TL.x-sh.sideThicknessWorld;
    const shRight=TR.x+sh.sideThicknessWorld;
    const shWallTop=wallTop-sh.topExtensionWorld;
    const shFloorBottom=BR.y+sh.bottomThicknessWorld;
    // far ambient (only seen when fully zoomed out past the shell), then floor shell, then wall shell.
    graphics.fillStyle(skin.backdrop.fill,1).fillRect(-worldWidth,-worldHeight,worldWidth*3,worldHeight*3);
    graphics.fillStyle(sh.fill,1).fillRect(shLeft,floorTop,shRight-shLeft,shFloorBottom-floorTop);
    // Wainscot panelling + molding across the shell width — the taller wall reads as a furnished
    // cafe back wall, not an empty band.
    // Fixed shell architecture outside the grid: darker wood + inset panels.
    const inset=sh.panelInset;
    graphics.fillStyle(sh.insetFill,.78)
      .fillRect(shLeft+inset,floorTop+inset,Math.max(1,sh.sideThicknessWorld-inset*2),shFloorBottom-floorTop-inset*2)
      .fillRect(TR.x+inset,floorTop+inset,Math.max(1,sh.sideThicknessWorld-inset*2),shFloorBottom-floorTop-inset*2)
      .fillRect(TL.x+inset,BR.y+inset,Math.max(1,floorW-inset*2),Math.max(1,sh.bottomThicknessWorld-inset*2));
    graphics.lineStyle(2,sh.panelLine,sh.panelLineAlpha);
    for(let y=floorTop+sh.panelStep;y<shFloorBottom;y+=sh.panelStep){
      graphics.strokePoints([{x:shLeft+inset,y},{x:TL.x-inset,y}],false);
      graphics.strokePoints([{x:TR.x+inset,y},{x:shRight-inset,y}],false);
    }
    for(let x=TL.x+sh.panelStep;x<TR.x;x+=sh.panelStep){
      graphics.strokePoints([{x,y:BR.y+inset},{x,y:shFloorBottom-inset}],false);
    }
    // Structured cafe wall: upper wall, lower wainscot, molding and panel divisions.
    const wall=skin.wall,lower=wall.lower;
    graphics.fillStyle(wall.upperFill,1).fillRect(shLeft,shWallTop,shRight-shLeft,floorTop-shWallTop);
    const lowerH=skin.layout.wallHeight*lower.heightFactor,lowerTop=floorTop-lowerH;
    graphics.fillStyle(lower.fill,1).fillRect(shLeft,lowerTop,shRight-shLeft,lowerH);
    graphics.lineStyle(lower.moldingWidth,lower.molding,1)
      .strokePoints([{x:shLeft,y:lowerTop},{x:shRight,y:lowerTop}],false);
    graphics.lineStyle(2,lower.panelLine,.4);
    for(let x=shLeft+lower.panelWidth;x<shRight;x+=lower.panelWidth){
      graphics.strokePoints([{x,y:lowerTop+lower.moldingWidth},{x,y:floorTop}],false);
    }
    // Logical floor cells (the PLAYABLE area) tinted BY ZONE, drawn OVER the floor shell; a subtle
    // 2-tone by parity keeps the floor from looking flat.
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const rect=this.grid.getCellDiamond(x,y);
      const appearance=getOrthogonalCellAppearance({
        placeable:this.grid.isPlaceableCell(x,y),
        zoneKey:zoneAt(x,y),
        parity:(x+y)&1,
        skin
      });
      const fill=appearance.kind==='playable'
        ?this.shadeColor(appearance.fill,appearance.shadeFactor)
        :appearance.fill;
      graphics.fillStyle(fill,appearance.alpha).fillPoints(rect,true);
      graphics.lineStyle(1,appearance.line,appearance.kind==='playable'?skin.floor.cellLineAlpha:.7)
        .strokePoints([...rect,rect[0]],false);
      if(appearance.kind==='reserved'){
        const {bandInset,bandDepth}=skin.floor.reserved;
        graphics.fillStyle(skin.floor.reserved.insetFill,.48)
          .fillRect(
            rect[0].x+bandInset,
            rect[0].y+3,
            rect[1].x-rect[0].x-bandInset*2,
            Math.min(bandDepth,rect[3].y-rect[0].y-6)
          );
      }
    }
    // Wall/floor seam + a SUBTLE playable-grid edge (a thin收邊, not a bold "card" frame) so the
    // player can tell the 10x8 placeable area from the surrounding visual shell.
    const boundary=skin.floor.playableBoundary;
    graphics.lineStyle(wall.topLineWidth,wall.upperAccent,1).strokePoints([TL,TR],false);
    graphics.lineStyle(boundary.width,boundary.color,boundary.alpha).strokePoints([TL,TR,BR,BL,TL],false);
    graphics.lineStyle(boundary.innerWidth,boundary.innerColor,boundary.innerAlpha)
      .strokePoints([{x:TL.x+3,y:TL.y+3},{x:TR.x-3,y:TR.y+3},{x:BR.x-3,y:BR.y-3},{x:BL.x+3,y:BL.y-3},{x:TL.x+3,y:TL.y+3}],false);
    graphics.lineStyle(sh.trimThickness,sh.trimColor,1)
      .strokePoints([{x:shLeft,y:floorTop},{x:shLeft,y:shFloorBottom},{x:shRight,y:shFloorBottom},{x:shRight,y:floorTop}],false);
    graphics.lineStyle(sh.edgeHighlight,sh.highlightColor,.75)
      .strokePoints([
        {x:shLeft+sh.trimThickness,y:shFloorBottom-sh.trimThickness},
        {x:shRight-sh.trimThickness,y:shFloorBottom-sh.trimThickness}
      ],false);
    // Visual door LEAF: smaller than the 2-cell slot, centred in x7-8; a warm wood door with a
    // glass panel, muntins, a brass handle and a frame (not a dark slab). x9 stays wall.
    const D=skin.door,vd=D.gridBounds;
    const doorL=this.grid.gridToWorld(vd.x,0).x,doorR=this.grid.gridToWorld(vd.x+vd.w,0).x;
    const doorW=doorR-doorL,doorH=D.height,doorT=floorTop-doorH,pad=D.framePad;
    graphics.fillStyle(D.casing,1)
      .fillRect(doorL-pad,doorT-pad,doorW+pad*2,doorH+pad)
      .fillRect(doorL-D.lintelExtension,doorT-D.lintelHeight,doorW+D.lintelExtension*2,D.lintelHeight);
    graphics.fillStyle(D.frame,1).fillRect(doorL-pad/2,doorT-pad/2,doorW+pad,doorH+pad/2);
    graphics.fillStyle(D.leaf,1).fillRect(doorL,doorT,doorW,doorH);
    const gp=D.glassPad,gH=doorH*D.glassHeightFactor,gW=doorW-2*gp;
    graphics.fillStyle(D.glass,1).fillRect(doorL+gp,doorT+gp,gW,gH);
    graphics.lineStyle(2,D.glassEdge,1).strokeRect(doorL+gp,doorT+gp,gW,gH);
    graphics.lineStyle(2,D.frame,.85);
    graphics.strokePoints([{x:doorL+doorW/2,y:doorT+gp},{x:doorL+doorW/2,y:doorT+gp+gH}],false);
    graphics.strokePoints([{x:doorL+gp,y:doorT+gp+gH/2},{x:doorL+doorW-gp,y:doorT+gp+gH/2}],false);
    graphics.lineStyle(2,D.panel,.9).strokeRect(doorL+gp,doorT+gp*2+gH,gW,doorH-gH-gp*3);
    graphics.fillStyle(D.handle,1).fillRect(doorL+doorW-gp-6,doorT+doorH*0.56,5,15);
    graphics.lineStyle(3,D.frame,1).strokeRect(doorL,doorT,doorW,doorH);
    const sign=D.cafeSign,signW=doorW*sign.widthFactor,signX=doorL+(doorW-signW)/2;
    const signY=doorT-D.lintelHeight-sign.height-4;
    graphics.fillStyle(sign.fill,1).fillRect(signX,signY,signW,sign.height);
    graphics.lineStyle(2,sign.accent,.9).strokeRect(signX,signY,signW,sign.height);
    for(let i=1;i<=sign.lineCount;i++){
      const yy=signY+(sign.height/(sign.lineCount+1))*i;
      graphics.lineStyle(2,sign.accent,.75).strokePoints([{x:signX+8,y:yy},{x:signX+signW-8,y:yy}],false);
    }
    // A narrow threshold avoids implying that the full top cell has separate rules.
    graphics.fillStyle(D.matFill,.65).fillRect(doorL+5,floorTop+3,doorW-10,14);
    graphics.setDepth(-1000);
    this.wallDecorations=skin.decorAnchors.map(anchor=>new WallDecorationEntity(this,{
      texture:anchor.texture,
      x:TL.x+floorW*anchor.fx,
      y:wallTop+skin.layout.wallHeight*anchor.heightFactor,
      scale:anchor.scale
    }));
  }
  // Orthogonal-only camera framing policy (ARCH-0573). The first screen full-bleeds the
  // CORE gameplay region (getCoreBounds) into the DOM-measured safe viewport, so a portrait
  // phone fills its height with the cafe (no big top/bottom margins); the outer columns crop
  // and the whole ROOM (getRoomBounds) is the pan / zoom-out range. Bounds are derived from
  // the projected room frame (via the Facade) and ortho-room-zones; safe insets come from
  // the ViewportMetrics DOM adapter (the single place these DOM rects are read).
  buildOrthoFraming(){
    const {floor}=ROOM_CONFIG,cols=floor.cols,rows=floor.rows;
    const skin=DEFAULT_ORTHOGONAL_ROOM_SKIN,Z=ORTHO_ROOM_ZONES;
    const metrics=new ViewportMetrics();
    const floorTop=()=>this.grid.getCellDiamond(0,0)[0].y;
    const floorBottom=()=>this.grid.getCellDiamond(cols-1,rows-1)[2].y;
    return {
      // Whole room (floor + full back wall + outer x0/x9 margins): the Camera pan and
      // zoom-out range, so the player can reach every column and see the entire room.
      getRoomBounds:()=>{
        const TL=this.grid.getCellDiamond(0,0)[0];
        const BR=this.grid.getCellDiamond(cols-1,rows-1)[2];
        const top=TL.y-skin.layout.wallHeight;
        return {x:TL.x,y:top,width:BR.x-TL.x,height:(BR.y+skin.layout.bottomPad)-top};
      },
      // First-screen full-bleed target: the gameplay columns (coreGameplayBounds) plus a
      // short wall strip (coreTopStrip) that shows the door. It excludes the outer x0/x9
      // margins and the tall decorative upper wall, so a CONTAIN fit fills the portrait
      // height (~90%+) while the outer columns crop and stay reachable by panning.
      getCoreBounds:()=>{
        const cg=Z.coreGameplayBounds;
        const left=this.grid.getCellDiamond(cg.x,0)[0].x;
        const right=this.grid.getCellDiamond(cg.x+cg.w-1,rows-1)[2].x;
        const top=floorTop()-skin.layout.coreTopStrip;
        return {x:left,y:top,width:right-left,height:(floorBottom()+skin.layout.bottomPad)-top};
      },
      getSafeInsets:()=>metrics.getInsets(this.game.canvas,{toolbarReserve:ORTHO_FRAMING.toolbarReserveCss}),
      policy:{}
    };
  }
  createFurniture(){
    this.entities.forEach(entity=>entity.destroy());
    this.entities.clear();
    this.getLayoutItems().forEach(item=>this.addFurnitureEntity(item,{interactive:!this.demoLayoutActive}));
  }
  addFurnitureEntity(item,{interactive=true}={}){
    const definition=FURNITURE_CONFIG[item.type];
    if(!definition)return null;
    const entity=new FurnitureEntity(this,item,definition,this.grid);
    // Demo-composition entities are display-only (they are not in state.items), so they
    // are non-interactive to keep drag/selection strictly on the real saved layout.
    if(interactive)entity.on('pointerdown',pointer=>this.furnitureDragController?.onEntityPointerDown(pointer,item.id));
    else{entity.disableInteractive();this.input.setDraggable(entity,false);}
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
    // The drag controller owns drag cleanup, while this public toolbar action also
    // owns clearing a selected-but-not-dragging item. Keeping both steps here makes
    // Cancel idempotent across touch, mouse, pointercancel and interrupted drags.
    this.furnitureDragController?.cancel('ui-cancel');
    this.restoreSelectionEditOrigin();
    this.selectItem(null);
    this.cameraController?.setEnabled(true);
    this.inputMode?.releaseToStable();
    return true;
  }
  selectItem(itemId){
    const previousId=this.selectedId;
    if(previousId&&previousId!==itemId){
      this.rotationEditSession=null;
      this.lastRotationCandidate=null;
      this.furnitureDragController?.clearRotationPreview();
    }
    this.selectedId=itemId;
    this.entities.forEach((entity,id)=>entity.setSelected(id===itemId));
    const item=this.state.items.find(entry=>entry.id===itemId);
    if(item&&(!this.rotationEditSession||this.rotationEditSession.itemId!==item.id)){
      this.rotationEditSession=this.createSelectionRotationSession(item);
    }else if(!item){
      this.rotationEditSession=null;
      this.lastRotationCandidate=null;
      this.furnitureDragController?.clearRotationPreview();
    }
    const definition=item?FURNITURE_CONFIG[item.type]:null;
    this.game.events.emit('selection-changed',item?{
      item,definition,placing:false,
      rotationPolicy:this.projectionMode===PROJECTION_MODE.ORTHO
        ?getOrthogonalRotationPolicy(item.type,definition)
        :null
    }:null);
  }
  createSelectionRotationSession(item,original=null){
    if(this.projectionMode!==PROJECTION_MODE.ORTHO)return null;
    const definition=FURNITURE_CONFIG[item.type];
    return {
      itemId:item.id,
      ...createRotationEditSession({
        type:item.type,definition,x:item.x,y:item.y,rotation:item.r||0,
        policy:getOrthogonalRotationPolicy(item.type,definition),
        original
      })
    };
  }
  onFurniturePlacementCommitted(item){
    if(!item||this.projectionMode!==PROJECTION_MODE.ORTHO)return;
    const original=this.rotationEditSession?.itemId===item.id
      ?this.rotationEditSession.original
      :null;
    this.rotationEditSession=this.createSelectionRotationSession(item,original);
    this.lastRotationCandidate=null;
  }
  validateResolvedRotation(item,resolved){
    const result=this.placement.validatePlacement({
      ...resolved.validityInput,movingItemId:item.id
    });
    if(!result.valid)return result;
    if(
      FURNITURE_CONFIG[item.type]?.layer!=='floorDecoration'
      &&this.catBehaviorController.isAnyCatInCells(resolved.footprintCells)
    )return {
      valid:false,blockingReason:'character-occupied',
      message:'這裡有貓咪，請換個位置',warnings:result.warnings||[]
    };
    return result;
  }
  restoreSelectionEditOrigin(){
    const session=this.rotationEditSession;
    if(!session)return false;
    const item=this.state.items.find(entry=>entry.id===session.itemId);
    if(!item)return false;
    const original=session.original;
    if(item.x===original.x&&item.y===original.y&&(item.r||0)===original.r)return false;
    Object.assign(item,{x:original.x,y:original.y,r:original.r});
    this.occupancy.updateItem(item);
    this.entities.get(item.id)?.setGridPosition(item.x,item.y,item.r);
    this.saveAdapter.save();
    this.catBehaviorController?.onFurnitureLayoutChanged();
    return true;
  }
  rotateSelection(){
    if(this.furnitureDragController?.isDragging()){this.furnitureDragController.rotateCandidate();return}
    const item=this.state.items.find(entry=>entry.id===this.selectedId);
    if(!item)return;
    if(this.projectionMode!==PROJECTION_MODE.ORTHO){
      this.occupancy.removeItem(item.id);
      const next={...item,r:((item.r||0)+1)%4};
      const result=this.placement.validatePlacement({type:next.type,x:next.x,y:next.y,rotation:next.r,movingItemId:item.id});
      if(result.valid){Object.assign(item,next);this.occupancy.addItem(item);this.entities.get(item.id)?.sync();this.saveAdapter.save()}
      else{this.occupancy.addItem(item);this.game.events.emit('toast',{message:result.message,key:'rotate-invalid',priority:2})}
      return;
    }
    const definition=FURNITURE_CONFIG[item.type];
    const session=this.rotationEditSession?.itemId===item.id
      ?this.rotationEditSession
      :this.createSelectionRotationSession(item);
    const resolved=resolveNextOrthogonalRotation({
      grid:this.grid,type:item.type,definition,
      x:item.x,y:item.y,rotation:item.r||0,
      policy:session.policy,editSession:session
    });
    if(session.policy===ROTATION_POLICY.FIXED){
      this.lastRotationCandidate={itemId:item.id,resolved,result:{valid:true},committed:false,noOp:true};
      this.furnitureDragController?.clearRotationPreview();
      return;
    }
    const result=this.validateResolvedRotation(item,resolved);
    this.lastRotationCandidate={itemId:item.id,resolved,result,committed:false,noOp:false};
    if(!result.valid){
      this.furnitureDragController?.showRotationPreview(
        {...item,x:resolved.resolvedX,y:resolved.resolvedY,r:resolved.resolvedRotation},
        resolved,result,this.entities.get(item.id)
      );
      this.game.events.emit('toast',{
        message:this.furnitureDragController?.friendlyMessage(
          result.blockingReason,result.message
        )||result.message,
        key:`rotate-${result.blockingReason}`,priority:2,cooldown:1200
      });
      return;
    }
    Object.assign(item,{
      x:resolved.resolvedX,y:resolved.resolvedY,r:resolved.resolvedRotation
    });
    this.occupancy.updateItem(item);
    this.entities.get(item.id)?.setGridPosition(
      item.x,item.y,item.r,resolved
    );
    this.rotationEditSession={
      itemId:item.id,
      ...advanceRotationEditSession(session,resolved)
    };
    this.lastRotationCandidate={itemId:item.id,resolved,result,committed:true,noOp:false};
    this.furnitureDragController?.clearRotationPreview();
    this.saveAdapter.save();
    this.catBehaviorController?.onFurnitureLayoutChanged();
    this.game.events.emit('selection-changed',{
      item,definition,placing:false,rotationPolicy:session.policy
    });
  }
  storeSelection(){
    if(this.furnitureDragController?.isDragging()){
      if(this.furnitureDragController.drag?.isNew)return;
      this.furnitureDragController.cancel('store-selection');
    }
    const index=this.state.items.findIndex(entry=>entry.id===this.selectedId);
    if(index<0)return;
    const [item]=this.state.items.splice(index,1);
    this.state.inventory[item.type]=(this.state.inventory[item.type]||0)+1;
    this.occupancy.removeItem(item.id);
    this.entities.get(item.id)?.destroy();this.entities.delete(item.id);
    this.rotationEditSession=null;this.lastRotationCandidate=null;
    this.furnitureDragController?.clearRotationPreview();
    this.selectedId=null;this.inputMode?.releaseToStable();this.saveAdapter.save();this.emitState();
    this.game.events.emit('selection-changed',null);
  }
  sellSelection(){
    if(this.furnitureDragController?.isDragging()){
      if(this.furnitureDragController.drag?.isNew)return;
      this.furnitureDragController.cancel('sell-selection');
    }
    const index=this.state.items.findIndex(entry=>entry.id===this.selectedId);
    if(index<0)return;
    const [item]=this.state.items.splice(index,1);
    this.state.coins+=Math.floor((FURNITURE_CONFIG[item.type].price||0)*.5);
    this.occupancy.removeItem(item.id);
    this.entities.get(item.id)?.destroy();this.entities.delete(item.id);
    this.rotationEditSession=null;this.lastRotationCandidate=null;
    this.furnitureDragController?.clearRotationPreview();
    this.selectedId=null;this.inputMode?.releaseToStable();this.saveAdapter.save();this.emitState();
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
    const entrance=this.grid.getCellCenter(
      ORTHO_ROOM_ZONES.customerEntryPoint.x,
      ORTHO_ROOM_ZONES.customerEntryPoint.y
    );
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
