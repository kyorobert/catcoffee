import {DepthSystem} from '../systems/DepthSystem.js?v=0540a1';

export class CustomerEntity extends Phaser.GameObjects.Container{
  constructor(scene,id,position,color=0x7fa6b8){
    super(scene,position.x,position.y);
    this.customerId=id;
    const shadow=scene.add.ellipse(0,0,34,13,0x4a2f24,.2);
    const body=scene.add.rectangle(0,-28,25,38,color).setStrokeStyle(2,0x5b3c32);
    const head=scene.add.circle(0,-55,14,0xf2c8a4).setStrokeStyle(2,0x5b3c32);
    const order=scene.add.text(18,-76,'☕',{fontSize:'17px',backgroundColor:'#fff8e8dd',padding:{x:4,y:3}}).setOrigin(.5);
    this.add([shadow,body,head,order]);
    this.setDepth(DepthSystem.for('character',position.y));
    scene.add.existing(this);
  }
  walkTo(position,onComplete){
    this.scene.tweens.add({targets:this,x:position.x,y:position.y,duration:1200,ease:'Sine.inOut',onUpdate:()=>this.setDepth(DepthSystem.for('character',this.y)),onComplete});
  }
}
