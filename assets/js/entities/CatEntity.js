import {DepthSystem} from '../systems/DepthSystem.js?v=0540a1';

export class CatEntity extends Phaser.GameObjects.Container{
  constructor(scene,profile,position){
    super(scene,position.x,position.y);
    this.profile=profile;
    const shadow=scene.add.ellipse(0,0,42,16,0x5b3828,.25);
    const body=scene.add.ellipse(0,-24,34,40,profile.color);
    const head=scene.add.circle(0,-48,18,profile.color);
    const leftEar=scene.add.triangle(-10,-65,0,14,8,0,14,15,profile.color);
    const rightEar=scene.add.triangle(10,-65,0,15,6,0,14,14,profile.color);
    const eyes=scene.add.text(0,-50,'•  •',{fontFamily:'monospace',fontSize:'11px',color:'#3b291f'}).setOrigin(.5);
    const name=scene.add.text(0,-82,`${profile.icon} ${profile.name}`,{fontFamily:'system-ui',fontSize:'13px',color:'#4b3025',backgroundColor:'#fff4dfcc',padding:{x:5,y:2}}).setOrigin(.5);
    this.add([shadow,body,head,leftEar,rightEar,eyes,name]);
    this.setDepth(DepthSystem.for('character',position.y));
    scene.add.existing(this);
    scene.tweens.add({targets:this,y:position.y-3,duration:900,yoyo:true,repeat:-1,ease:'Sine.inOut'});
  }
}
