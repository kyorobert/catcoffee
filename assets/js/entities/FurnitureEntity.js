import {DepthSystem} from '../systems/DepthSystem.js?v=0550a1';

export class FurnitureEntity extends Phaser.GameObjects.Image{
  constructor(scene,item,definition,grid){
    const anchor=grid.getAnchor(item.type,item.x,item.y,item.r||0);
    super(scene,anchor.x,anchor.y,`furniture:${item.type}`);
    this.item=item;
    this.definition=definition;
    this.grid=grid;
    this.setName(`furniture:${item.id}`);
    this.setOrigin(definition.layer==='floorDecoration'?.5:.5,definition.layer==='floorDecoration'?.5:1);
    const targetWidth=Math.max(44,Math.min(180,definition.size||96));
    if(this.width)this.setScale(targetWidth/this.width);
    this.setFlipX(Boolean((item.r||0)%2));
    this.setDepth(DepthSystem.for(definition.layer||'floorObject',anchor.y));
    scene.add.existing(this);
    const minimumWorldHit=40/Math.max(.35,grid.room.camera.baseMinZoom);
    const hitWidth=Math.max(this.width,minimumWorldHit/Math.max(.01,Math.abs(this.scaleX)));
    const hitHeight=Math.max(this.height,minimumWorldHit/Math.max(.01,Math.abs(this.scaleY)));
    this.setInteractive(
      new Phaser.Geom.Rectangle((this.width-hitWidth)/2,(this.height-hitHeight)/2,hitWidth,hitHeight),
      Phaser.Geom.Rectangle.Contains
    );
    this.input.cursor='pointer';
    scene.input.setDraggable(this);
  }
  sync(){
    const rotation=this.item.r||0;
    const anchor=this.grid.getAnchor(this.item.type,this.item.x,this.item.y,rotation);
    this.setPosition(anchor.x,anchor.y);
    this.setFlipX(Boolean(rotation%2));
    this.setDepth(DepthSystem.for(this.definition.layer||'floorObject',anchor.y));
  }
  setGridPosition(x,y,rotation=this.item.r||0){
    this.item.x=x;this.item.y=y;this.item.r=rotation;this.sync();return this;
  }
  updateWorldPosition(){this.sync();return this}
  updateDepth(){
    this.setDepth(DepthSystem.for(this.definition.layer||'floorObject',this.y));return this;
  }
  setDragVisual(state){this.setAlpha(state==='dragging'?.35:1);return this}
  setSelected(selected){this.setTint(selected?0xfff0a5:0xffffff)}
  destroy(fromScene){this.scene?.input?.setDraggable(this,false);super.destroy(fromScene)}
}
