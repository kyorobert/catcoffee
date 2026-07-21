export class CameraController{
  constructor(scene,roomConfig,{isFurnitureDragging=()=>false}={}){
    this.scene=scene;
    this.camera=scene.cameras.main;
    this.room=roomConfig;
    this.isFurnitureDragging=isFurnitureDragging;
    this.pointers=new Map();
    this.pan=null;
    this.pinch=null;
    this.initialized=false;
    this.bind();
    this.resize(scene.scale.gameSize);
  }
  getCoverZoom(width=this.camera.width,height=this.camera.height){
    return Math.max(width/this.room.worldWidth,height/this.room.worldHeight);
  }
  resize(size){
    const center=this.initialized?{x:this.camera.midPoint.x,y:this.camera.midPoint.y}:{x:this.room.worldWidth/2,y:this.room.worldHeight/2};
    this.minZoom=Math.max(this.room.camera.baseMinZoom,this.getCoverZoom(size.width,size.height));
    this.camera.setBounds(0,0,this.room.worldWidth,this.room.worldHeight);
    this.camera.setZoom(Math.max(this.minZoom,Math.min(this.room.camera.maxZoom,this.camera.zoom||this.room.camera.defaultZoom)));
    this.camera.centerOn(center.x,center.y);
    this.initialized=true;
  }
  bind(){
    const input=this.scene.input;
    input.on('pointerdown',(pointer,over)=>{
      this.pointers.set(pointer.id,{x:pointer.x,y:pointer.y});
      if(this.isFurnitureDragging()||over.length)return;
      if(this.pointers.size===1)this.pan={id:pointer.id,x:pointer.x,y:pointer.y};
      if(this.pointers.size===2)this.beginPinch();
    });
    input.on('pointermove',pointer=>{
      if(!this.pointers.has(pointer.id))return;
      this.pointers.set(pointer.id,{x:pointer.x,y:pointer.y});
      if(this.isFurnitureDragging()){this.pan=null;return}
      if(this.pointers.size>=2){this.updatePinch();return}
      if(this.pan?.id===pointer.id){
        const dx=pointer.x-this.pan.x,dy=pointer.y-this.pan.y;
        this.camera.scrollX-=dx/this.camera.zoom;
        this.camera.scrollY-=dy/this.camera.zoom;
        this.pan.x=pointer.x;this.pan.y=pointer.y;
      }
    });
    const finish=pointer=>{
      this.pointers.delete(pointer.id);
      if(this.pan?.id===pointer.id)this.pan=null;
      this.pinch=null;
      if(this.pointers.size===1){
        const [id,point]=this.pointers.entries().next().value;
        this.pan={id,x:point.x,y:point.y};
      }
    };
    input.on('pointerup',finish);
    input.on('pointerupoutside',finish);
    input.on('gameout',()=>{if(!this.isFurnitureDragging()){this.pan=null;this.pointers.clear();this.pinch=null}});
    input.on('wheel',(pointer,_objects,_dx,dy)=>{
      if(this.isFurnitureDragging())return;
      const before=this.camera.getWorldPoint(pointer.x,pointer.y);
      this.setZoomAt(pointer.x,pointer.y,this.camera.zoom*Math.exp(-dy*.0015),before);
    });
    this.scene.scale.on('resize',size=>this.resize(size));
  }
  beginPinch(){
    const points=[...this.pointers.values()].slice(0,2);
    const center={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};
    this.pinch={distance:Phaser.Math.Distance.Between(points[0].x,points[0].y,points[1].x,points[1].y),zoom:this.camera.zoom,world:this.camera.getWorldPoint(center.x,center.y)};
    this.pan=null;
  }
  updatePinch(){
    const points=[...this.pointers.values()].slice(0,2);
    if(!this.pinch||points.length<2){this.beginPinch();return}
    const center={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};
    const distance=Phaser.Math.Distance.Between(points[0].x,points[0].y,points[1].x,points[1].y);
    this.setZoomAt(center.x,center.y,this.pinch.zoom*(distance/Math.max(1,this.pinch.distance)),this.pinch.world);
  }
  setZoomAt(screenX,screenY,nextZoom,worldBefore=this.camera.getWorldPoint(screenX,screenY)){
    const zoom=Phaser.Math.Clamp(nextZoom,this.minZoom,this.room.camera.maxZoom);
    this.camera.setZoom(zoom);
    const after=this.camera.getWorldPoint(screenX,screenY);
    this.camera.scrollX+=worldBefore.x-after.x;
    this.camera.scrollY+=worldBefore.y-after.y;
  }
  destroy(){this.scene.scale.off('resize')}
}

