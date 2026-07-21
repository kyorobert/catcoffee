import {DepthSystem} from '../systems/DepthSystem.js?v=0541a';

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
    this.setInteractive({useHandCursor:true});
    scene.add.existing(this);
  }
  sync(){
    const rotation=this.item.r||0;
    const anchor=this.grid.getAnchor(this.item.type,this.item.x,this.item.y,rotation);
    this.setPosition(anchor.x,anchor.y);
    this.setFlipX(Boolean(rotation%2));
    this.setDepth(DepthSystem.for(this.definition.layer||'floorObject',anchor.y));
  }
  setSelected(selected){this.setTint(selected?0xfff0a5:0xffffff)}
}
