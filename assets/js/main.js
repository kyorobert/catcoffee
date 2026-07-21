import {createGameConfig} from './config/game-config.js?v=0541a';
import {FURNITURE_CONFIG} from './config/furniture-config.js?v=0541a';
import {SaveAdapter} from './systems/SaveAdapter.js?v=0541a';
import {StartupController} from './systems/StartupController.js?v=0541a';
import {UiBridge} from './ui/UiBridge.js?v=0541a';

if(!window.Phaser)throw new Error('Local Phaser 3.90.0 failed to load');

const saveAdapter=new SaveAdapter(FURNITURE_CONFIG);
const startup=new StartupController();
const earlyError=window.__CAT_CAFE_EARLY_ERRORS__?.[0];
if(earlyError){
  const error=new Error(earlyError.message);
  startup.fail(error,earlyError.context);
  throw error;
}
startup.startTimeout(20000);
let ui=null;
const game=new Phaser.Game(createGameConfig({
  preBoot(phaserGame){
    phaserGame.registry.set('saveAdapter',saveAdapter);
    phaserGame.registry.set('startupController',startup);
    ui=new UiBridge(phaserGame,saveAdapter,FURNITURE_CONFIG,{startup});
  },
  postBoot(phaserGame){
    phaserGame.registry.set('rendererName','Canvas');
    console.info('Renderer: Canvas');
  }
}));

const scene=()=>game.scene.getScene('CafeScene');
window.gameController=Object.freeze({
  openStore:()=>ui?.store.open(),
  startPlacement:type=>scene()?.startPlacement(type),
  rotateSelection:()=>scene()?.rotateSelection(),
  storeSelection:()=>scene()?.storeSelection(),
  sellSelection:()=>scene()?.sellSelection(),
  cancelPlacement:()=>scene()?.cancelDrag(),
  getState:()=>structuredClone(saveAdapter.state)
});
window.__CAT_CAFE_GAME__=game;

let resizePending=false;
function resizeGame(attempt=0){
  if(resizePending)return;
  resizePending=true;
  requestAnimationFrame(()=>{
    resizePending=false;
    const viewport=document.getElementById('gameViewport');
    const width=viewport?.clientWidth||0,height=viewport?.clientHeight||0;
    if(width<=0||height<=0){
      if(attempt<60){resizeGame(attempt+1);return}
      startup.fail(new Error(`場景 viewport 尺寸無效：${width}×${height}`),'初始 Resize');
      return;
    }
    game.scale.resize(width,height);
  });
}
window.addEventListener('resize',()=>resizeGame(),{passive:true});
window.visualViewport?.addEventListener('resize',()=>resizeGame(),{passive:true});
window.visualViewport?.addEventListener('scroll',()=>resizeGame(),{passive:true});
resizeGame();
