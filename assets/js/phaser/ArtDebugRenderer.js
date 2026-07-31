import {FURNITURE_VISUAL_CONFIG} from '../config/furniture-visual-config.js?v=0577n';
import {resolveOrthogonalRotationPlacement} from '../core/orthogonal-furniture-rotation.js?v=0577n';

// ARCH-0577C: read-only overlay. It never writes save state and never intercepts
// pointer input. In artDebug=1 mode it draws geometry (sprite bounds, footprint
// cells, logical pivot, visual pivot) plus a SHORT one-line id/rotation tag for
// every furniture, so labels no longer pile into an unreadable wall on mobile.
// Full per-furniture metadata is shown only for the focused item -- the one named
// by ?artDebugFocus=<id|type>, or the currently selected furniture.
export class ArtDebugRenderer{
  constructor(scene,{grid,entities,definitions,getRotationCandidate=()=>null}={}){
    this.scene=scene;
    this.grid=grid;
    this.entities=entities;
    this.definitions=definitions;
    this.getRotationCandidate=getRotationCandidate;
    this.enabled=new URLSearchParams(location.search).get('artDebug')==='1';
    this.filter=new URLSearchParams(location.search).get('artFilter')||'all';
    this.focus=new URLSearchParams(location.search).get('artDebugFocus')||'';
    this.graphics=null;
    this.labels=new Map();
    this.lastSignature='';
    this.nextRefreshAt=0;
    if(this.enabled){
      this.graphics=scene.add.graphics().setDepth(200000).setScrollFactor(1);
      this.refresh(true);
    }
  }
  update(time){
    if(!this.enabled||time<this.nextRefreshAt)return;
    this.nextRefreshAt=time+350;
    this.refresh(false);
  }
  isFocused(instanceId,data){
    if(this.scene.selectedId&&this.scene.selectedId===instanceId)return true;
    if(!this.focus)return false;
    return this.focus===instanceId||this.focus===data.id||this.focus===data.type;
  }
  // The single shared resolver result, so Art Debug reports exactly the geometry
  // the sprite/box/occupancy use. iso/flat fall back to the grid directly.
  resolvePlacement(data,item){
    if((this.grid.projectionMode||'iso')==='ortho'){
      return resolveOrthogonalRotationPlacement({
        grid:this.grid,type:data.type,definition:this.definitions[data.type],
        x:item.x,y:item.y,rotation:item.r||0
      });
    }
    return {
      footprintCells:this.grid.getFootprintCells(data.type,item.x,item.y,item.r||0),
      footprintPolygon:this.grid.getFootprintPolygon(data.type,item.x,item.y,item.r||0),
      logicalPivot:{x:item.x,y:item.y},
      visualPosition:this.grid.getAnchor(data.type,item.x,item.y,item.r||0),
      cardinalDirection:null,
      resolvedRotation:item.r||0
    };
  }
  refresh(force=false){
    const rotationCandidate=this.getRotationCandidate?.();
    const signature=[
      ...[...this.entities.values()].map(entity=>`${entity.item.id}:${entity.item.x}:${entity.item.y}:${entity.item.r}:${entity.texture.key}:${this.scene.selectedId===entity.item.id?'*':''}`),
      rotationCandidate?.resolved?.signature||''
    ].join('|');
    if(!force&&signature===this.lastSignature)return;
    this.lastSignature=signature;
    this.graphics.clear();
    const liveIds=new Set();
    for(const [instanceId,entity] of this.entities){
      liveIds.add(instanceId);
      const data=entity.getArtDebugData();
      const visual=data.visual;
      const definition=this.definitions[data.type];
      if(!visual||!definition)continue;
      const isV0552=Boolean(visual.texturePathByDirection);
      const isIncomplete=(visual.authoredDirections||[]).length<4;
      const filterMatch=this.filter==='all'
        ||(this.filter==='v0552'&&isV0552)
        ||(this.filter==='production'&&visual.artStatus==='production')
        ||(this.filter==='redraw'&&visual.artStatus==='redraw')
        ||(this.filter==='incomplete'&&isIncomplete)
        ||(this.filter==='missing-direction'&&data.missingDirection);
      if(!filterMatch)continue;
      const focused=this.isFocused(instanceId,data);
      const bounds=entity.getBounds();
      const placement=this.resolvePlacement(data,entity.item);
      // Footprint cells (each occupied diamond) make the logical area readable.
      for(const cell of placement.footprintCells){
        const diamond=this.grid.getCellDiamond(cell.x,cell.y);
        this.graphics.fillStyle(0xffd166,focused?.16:.08).fillPoints(diamond,true);
      }
      // Sprite bounds, footprint outline, then the two pivots drawn distinctly:
      // logical pivot (stored top-left cell centre) vs visual pivot (sprite anchor).
      this.graphics.lineStyle(1,0x4cc9f0,focused?1:.55).strokeRect(bounds.x,bounds.y,bounds.width,bounds.height);
      this.graphics.lineStyle(2,0xffd166,focused?1:.65).strokePoints([...placement.footprintPolygon,placement.footprintPolygon[0]],false);
      const logicalPivot=this.grid.getCellCenter(placement.logicalPivot.x,placement.logicalPivot.y);
      this.graphics.lineStyle(1.5,0x9d4edd,.95).strokeCircle(logicalPivot.x,logicalPivot.y,5);
      this.graphics.fillStyle(0xff4d6d,1).fillCircle(placement.visualPosition.x,placement.visualPosition.y,3);
      if(focused){
        for(const socket of visual.interactionSockets){
          const cell=this.grid.getCellCenter(entity.item.x+socket.gridOffset.x,entity.item.y+socket.gridOffset.y);
          this.graphics.fillStyle(0x72efdd,.95).fillCircle(cell.x,cell.y,3);
        }
      }
      let label=this.labels.get(instanceId);
      if(!label){
        label=this.scene.add.text(0,0,'',{fontFamily:'monospace',fontSize:'9px',color:'#fff7df',backgroundColor:'#3b291fd9',padding:{x:3,y:2}}).setDepth(200001);
        this.labels.set(instanceId,label);
      }
      const dir=placement.cardinalDirection?`${placement.cardinalDirection}(${data.direction})`:data.direction;
      if(focused){
        label.setColor('#fff7df').setBackgroundColor('#3b291fea').setText([
          `${data.type}｜${definition.name}`,
          `resolved x:${entity.item.x} y:${entity.item.y} r:${placement.resolvedRotation} dir:${dir}`,
          `policy:${placement.rotationPolicy||'legacy'} delta:${placement.movementDelta?.x||0},${placement.movementDelta?.y||0}`,
          `logicalPivot:${placement.logicalPivot.x},${placement.logicalPivot.y} visualPivot:${Math.round(placement.visualPosition.x)},${Math.round(placement.visualPosition.y)}`,
          `envelope:${placement.envelopeContext?`${placement.envelopeContext.originX},${placement.envelopeContext.originY} ${placement.envelopeContext.width}x${placement.envelopeContext.height}`:'formal-state'}`,
          `bounds:${Math.round(bounds.width)}x${Math.round(bounds.height)} foot:${visual.footprint.width}x${visual.footprint.height} cells:${placement.footprintCells.length}`,
          `scale:${visual.visualScale} anchor:${visual.anchor.x},${visual.anchor.y} ${visual.sourceFormat}`,
          `tex:${data.texture}`,
          `sizeFallback:${data.sizeFallback} missingDir:${data.missingDirection}`
        ]);
      }else{
        // Short tag only: type + short id + rotation/direction. No metadata wall.
        const shortId=String(data.id).slice(-4);
        label.setColor('#ffe8bd').setBackgroundColor('#3b291f9c').setText(`${data.type}#${shortId} r${placement.resolvedRotation}·${placement.cardinalDirection||data.direction}`);
      }
      label.setPosition(bounds.x,bounds.y-3);
      // ARCH-0577M1: composition overlay. Read-only. Draws the native->composed
      // pull line, target and pull metrics; a red warning marks a capped pull that
      // needs ART-0577M2 asset reauthoring. It never moves the entity or changes any
      // resolver result — the sprite is already at its composed position.
      const comp=entity.composition;
      if(comp&&comp.isConnected){
        const composed={x:entity.x,y:entity.y};
        const native={x:entity.x-(comp.visualOffsetX||0),y:entity.y-(comp.visualOffsetY||0)};
        const warn=Boolean(comp.requiresAssetReauthoring);
        const color=warn?0xff5a5a:0x51d88a;
        this.graphics.lineStyle(2,color,.95).strokeCircle(native.x,native.y,3);
        this.graphics.lineBetween(native.x,native.y,composed.x,composed.y);
        this.graphics.fillStyle(color,1).fillCircle(composed.x,composed.y,3);
        if(!this.compLabels)this.compLabels=new Map();
        let compLabel=this.compLabels.get(instanceId);
        if(!compLabel){compLabel=this.scene.add.text(0,0,'',{fontFamily:'monospace',fontSize:'8px',color:'#eafff2',backgroundColor:'#123726e6',padding:{x:3,y:2}}).setDepth(200002);this.compLabels.set(instanceId,compLabel);}
        const lines=[
          `comp ${comp.connectionSide}->${comp.targetItemId}`,
          `pull req:${comp.requestedPull} app:${comp.appliedPull}/${comp.maxAllowedPull} gap:${comp.finalVisualGap}`,
          `depthBias:${comp.depthBias} sig:${String(comp.signature).slice(0,20)}`,
          `excessive:${comp.isExcessivePull} reauthor:${comp.requiresAssetReauthoring}`
        ];
        if(warn)lines.push('ASSET REAUTHOR REQUIRED (ART-0577M2)');
        compLabel.setColor(warn?'#ffd0d0':'#eafff2').setBackgroundColor(warn?'#5a1414ee':'#123726e6').setText(lines).setPosition(composed.x+6,composed.y+6);
      }else if(this.compLabels?.has(instanceId)){
        this.compLabels.get(instanceId).setText('');
      }
    }
    if(rotationCandidate?.resolved&&!rotationCandidate.committed){
      const resolved=rotationCandidate.resolved;
      const color=rotationCandidate.result?.valid?0x60be73:0xda5252;
      this.graphics.lineStyle(3,color,1).strokePoints(
        [...resolved.footprintPolygon,resolved.footprintPolygon[0]],false
      );
      this.graphics.fillStyle(color,1).fillCircle(
        resolved.visualPivot.x,resolved.visualPivot.y,4
      );
    }
    for(const [id,label] of this.labels)if(!liveIds.has(id)){label.destroy();this.labels.delete(id)}
    if(this.compLabels)for(const [id,label] of this.compLabels)if(!liveIds.has(id)){label.destroy();this.compLabels.delete(id)}
  }
  destroy(){
    this.graphics?.destroy();
    this.labels.forEach(label=>label.destroy());
    this.labels.clear();
    this.compLabels?.forEach(label=>label.destroy());
    this.compLabels?.clear();
  }
}
