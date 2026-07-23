import {FURNITURE_VISUAL_CONFIG} from '../config/furniture-visual-config.js?v=0560a';

export class ArtDebugRenderer{
  constructor(scene,{grid,entities,definitions}={}){
    this.scene=scene;
    this.grid=grid;
    this.entities=entities;
    this.definitions=definitions;
    this.enabled=new URLSearchParams(location.search).get('artDebug')==='1';
    this.filter=new URLSearchParams(location.search).get('artFilter')||'all';
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
  refresh(force=false){
    const signature=[...this.entities.values()].map(entity=>`${entity.item.id}:${entity.item.x}:${entity.item.y}:${entity.item.r}:${entity.texture.key}`).join('|');
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
      const bounds=entity.getBounds();
      const polygon=this.grid.getFootprintPolygon(data.type,entity.item.x,entity.item.y,entity.item.r||0);
      this.graphics.lineStyle(1,0x4cc9f0,.9).strokeRect(bounds.x,bounds.y,bounds.width,bounds.height);
      this.graphics.lineStyle(2,0xffd166,.95).strokePoints([...polygon,polygon[0]],false);
      this.graphics.fillStyle(0xff4d6d,1).fillCircle(entity.x,entity.y,3);
      for(const socket of visual.interactionSockets){
        const cell=this.grid.getCellCenter(entity.item.x+socket.gridOffset.x,entity.item.y+socket.gridOffset.y);
        this.graphics.fillStyle(0x72efdd,.95).fillCircle(cell.x,cell.y,3);
      }
      let label=this.labels.get(instanceId);
      if(!label){
        label=this.scene.add.text(0,0,'',{fontFamily:'monospace',fontSize:'9px',color:'#fff7df',backgroundColor:'#3b291fd9',padding:{x:3,y:2}}).setDepth(200001);
        this.labels.set(instanceId,label);
      }
      label.setPosition(bounds.x,bounds.y-3).setText([
        `${data.type}｜${definition.name}`,
        `${visual.artStatus} store:${visual.storeVisible} ${visual.sourceFormat}`,
        `scale:${visual.visualScale} anchor:${visual.anchor.x},${visual.anchor.y} foot:${visual.footprint.width}x${visual.footprint.height}`,
        `${visual.heightClass} ${data.direction} ${data.texture}`,
        `path:${visual.texturePathByDirection?.[data.direction]||definition.texture}`,
        `station:${visual.stationType} block:${visual.walkBlocking} sockets:${visual.interactionSockets.length}`,
        `sizeFallback:${data.sizeFallback} missingDir:${data.missingDirection} redraw:${visual.artStatus==='prototype'||visual.artStatus==='redraw'}`
      ]);
    }
    for(const [id,label] of this.labels)if(!liveIds.has(id)){label.destroy();this.labels.delete(id)}
  }
  destroy(){
    this.graphics?.destroy();
    this.labels.forEach(label=>label.destroy());
    this.labels.clear();
  }
}
