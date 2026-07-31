import {DepthSystem} from '../systems/DepthSystem.js?v=0577n';
import {
  getFurnitureDisplayState,
  getFurnitureVisualPlacementState
} from '../core/furniture-display-state.js?v=0577n';
import {
  resolveOrthogonalRotationPlacement
} from '../core/orthogonal-furniture-rotation.js?v=0577n';

export class FurnitureEntity extends Phaser.GameObjects.Image{
  constructor(scene,item,definition,grid){
    const display=getFurnitureDisplayState(item.type,item.r||0,definition,grid.projectionMode);
    const frame=scene.textures.getFrame(display.texture);
    const placement=getFurnitureVisualPlacementState({
      grid,type:item.type,x:item.x,y:item.y,rotation:item.r||0,
      definition,display,textureFrame:frame,composition:null
    });
    super(scene,placement.worldX,placement.worldY,display.texture);
    this.composition=null;
    this.item=item;
    this.definition=definition;
    this.grid=grid;
    this.visual=display.visual;
    this.usesSizeFallback=display.sizeFallback;
    this.direction=display.direction;
    this.missingDirection=Boolean(display.missingDirection);
    this.setName(`furniture:${item.id}`);
    this.setOrigin(placement.originX,placement.originY);
    this.setScale(placement.scaleX,placement.scaleY);
    this.setFlipX(display.flipX);
    this.setDepth(DepthSystem.for(definition.layer||'floorObject',placement.worldY));
    this.visualPlacement=placement;
    this.baseDepth=this.depth;
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
    if(display.texture&&this.texture.key!==display.texture)this.setTexture(display.texture);
    const placement=getFurnitureVisualPlacementState({
      grid:this.grid,type:this.item.type,x:this.item.x,y:this.item.y,rotation,
      definition:this.definition,display,
      textureFrame:this.scene.textures.getFrame(display.texture),
      resolvedPlacement:resolved,
      composition:this.composition
    });
    this.setPosition(placement.worldX,placement.worldY)
      .setOrigin(placement.originX,placement.originY)
      .setScale(placement.scaleX,placement.scaleY)
      .setFlipX(display.flipX);
    this.direction=display.direction;
    this.missingDirection=Boolean(display.missingDirection);
    this.resolvedPlacement=resolved;
    this.visualPlacement=placement;
    // Base depth follows ground Y; composition depth bias (seat behind/in front of
    // its table) is added only while connected, and cleared when composition clears.
    this.baseDepth=DepthSystem.for(this.definition.layer||'floorObject',placement.worldY);
    this.setDepth(this.baseDepth+(placement.compositionDepthBias||0));
  }
  // ARCH-0577M1: composition is a VISUAL-ONLY result from the pure resolver. It is
  // assigned by the scene's layout-mutation recompute, never per frame, and never
  // touches item.x/y/r, footprint, occupancy or save.
  setComposition(composition){this.composition=composition||null;this.sync(this.resolvedPlacement);return this;}
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
      ,visualPlacement:this.visualPlacement||null
    };
  }
  destroy(fromScene){this.scene?.input?.setDraggable(this,false);super.destroy(fromScene)}
}
