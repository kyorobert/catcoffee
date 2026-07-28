import {DepthSystem} from '../systems/DepthSystem.js?v=0577e';
import {
  getFurnitureDisplayState,
  getFurnitureVisualPosition
} from '../core/furniture-display-state.js?v=0577e';
import {
  resolveOrthogonalRotationPlacement
} from '../core/orthogonal-furniture-rotation.js?v=0577e';

export class FurnitureEntity extends Phaser.GameObjects.Image{
  constructor(scene,item,definition,grid){
    const display=getFurnitureDisplayState(item.type,item.r||0,definition,grid.projectionMode);
    const anchor=getFurnitureVisualPosition(
      grid,item.type,item.x,item.y,item.r||0,display
    );
    super(scene,anchor.x,anchor.y,display.texture);
    this.item=item;
    this.definition=definition;
    this.grid=grid;
    this.visual=display.visual;
    this.usesSizeFallback=display.sizeFallback;
    this.direction=display.direction;
    this.missingDirection=Boolean(display.missingDirection);
    this.setName(`furniture:${item.id}`);
    this.setOrigin(display.originX,display.originY);
    if(display.scale)this.setScale(display.scale);
    else{
      const targetWidth=Math.max(44,Math.min(180,definition.size||96));
      if(this.width)this.setScale(targetWidth/this.width);
    }
    this.setFlipX(display.flipX);
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
  sync(resolvedCandidate=null){
    const rotation=this.item.r||0;
    const display=getFurnitureDisplayState(
      this.item.type,rotation,this.definition,this.grid.projectionMode
    );
    const resolved=resolvedCandidate
      ||((this.grid.projectionMode||'iso')==='ortho'
        ?resolveOrthogonalRotationPlacement({
          grid:this.grid,type:this.item.type,definition:this.definition,
          x:this.item.x,y:this.item.y,rotation,
          policy:display.rotationPolicy
        })
        :null);
    const anchor=resolved?.visualPosition||getFurnitureVisualPosition(
      this.grid,this.item.type,this.item.x,this.item.y,rotation,display
    );
    this.setPosition(anchor.x,anchor.y);
    if(display.texture&&this.texture.key!==display.texture)this.setTexture(display.texture);
    this.setOrigin(display.originX,display.originY).setFlipX(display.flipX);
    this.direction=display.direction;
    this.missingDirection=Boolean(display.missingDirection);
    this.resolvedPlacement=resolved;
    this.setDepth(DepthSystem.for(this.definition.layer||'floorObject',anchor.y));
  }
  setGridPosition(x,y,rotation=this.item.r||0,resolvedCandidate=null){
    this.item.x=x;this.item.y=y;this.item.r=rotation;
    this.sync(resolvedCandidate);return this;
  }
  updateWorldPosition(){this.sync();return this}
  updateDepth(){
    this.setDepth(DepthSystem.for(this.definition.layer||'floorObject',this.y));return this;
  }
  setDragVisual(state){this.setAlpha(state==='dragging'?.35:1);return this}
  setSelected(selected){this.setTint(selected?0xfff0a5:0xffffff)}
  getArtDebugData(){
    return {
      id:this.item.id,type:this.item.type,direction:this.direction,
      texture:this.texture.key,sizeFallback:this.usesSizeFallback,
      missingDirection:this.missingDirection,visual:this.visual
      ,resolvedPlacement:this.resolvedPlacement||null
    };
  }
  destroy(fromScene){this.scene?.input?.setDraggable(this,false);super.destroy(fromScene)}
}
