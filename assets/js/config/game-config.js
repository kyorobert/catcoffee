import {BootScene} from '../scenes/BootScene.js?v=0550a1';
import {CafeScene} from '../scenes/CafeScene.js?v=0550a1';

export function createGameConfig({preBoot,postBoot}={}){
  return {
    // Alpha.1 deliberately uses Canvas; a later verified release may restore Phaser.AUTO.
    type:Phaser.CANVAS,
    parent:'phaserGame',
    backgroundColor:'#3b291f',
    pixelArt:true,
    antialias:false,
    roundPixels:true,
    scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
    render:{pixelArt:true,antialias:false,roundPixels:true},
    loader:{timeout:15000,maxRetries:1},
    input:{activePointers:3},
    callbacks:{
      preBoot:game=>preBoot?.(game),
      postBoot:game=>postBoot?.(game)
    },
    scene:[BootScene,CafeScene]
  };
}
