import {FURNITURE_CONFIG} from '../config/furniture-config.js?v=0540a1';

export class BootScene extends Phaser.Scene{
  constructor(){super('BootScene');this.failures=[]}
  preload(){
    const startup=this.registry.get('startupController');
    startup?.setStatus('載入家具素材…');
    this.load.on('progress',value=>{
      startup?.setProgress(value*.72);
      this.game.events.emit('boot-progress',value*.72);
    });
    this.load.on('fileprogress',(file,value)=>{
      this.game.events.emit('boot-file',{key:file.key,url:file.url,type:file.type,progress:value});
    });
    this.load.on('loaderror',file=>{
      const failure={key:file.key,url:file.url||file.src||'',type:file.type||'unknown',error:file.error?.message||'loaderror'};
      this.failures.push(failure);
      this.registry.set('furniture-load-failures',[...this.failures]);
      startup?.setFailedAssets(this.failures);
      this.game.events.emit('boot-load-error',failure);
    });
    this.load.on('complete',(_loader,totalComplete,totalFailed)=>{
      this.registry.set('furniture-load-summary',{totalComplete,totalFailed});
      this.game.events.emit('boot-progress',.74);
    });

    for(const [id,definition] of Object.entries(FURNITURE_CONFIG)){
      const key=`furniture:${id}`;
      const path=new URL(definition.texture,location.href).pathname.toLowerCase();
      if(path.endsWith('.svg'))this.load.svg(key,definition.texture);
      else this.load.image(key,definition.texture);
    }
  }
  create(){
    const startup=this.registry.get('startupController');
    startup?.setStatus('驗證家具素材…');
    const missing=[];
    for(const id of Object.keys(FURNITURE_CONFIG)){
      const key=`furniture:${id}`;
      if(!this.textures.exists(key)){
        missing.push({key,url:FURNITURE_CONFIG[id].texture,type:'fallback',error:'texture-missing-after-load'});
        this.createFallbackTexture(key);
      }
    }
    const combined=[...this.failures];
    for(const failure of missing)if(!combined.some(entry=>entry.key===failure.key))combined.push(failure);
    const report={
      total:Object.keys(FURNITURE_CONFIG).length,
      failed:combined,
      fallbackKeys:missing.map(entry=>entry.key),
      successful:Object.keys(FURNITURE_CONFIG).length-missing.length
    };
    this.registry.set('furniture-load-report',report);
    this.registry.set('furniture-load-failures',combined);
    startup?.setFailedAssets(combined);
    if(combined.length){
      console.error('Furniture texture load failures:',combined);
      this.game.events.emit('toast',{message:'部分家具素材載入失敗，已使用替代圖示',key:'furniture-load-partial',priority:2,duration:4200});
    }
    this.game.events.emit('boot-progress',.78);
    this.scene.start('CafeScene');
  }
  createFallbackTexture(key){
    const graphics=this.make.graphics({x:0,y:0,add:false});
    graphics.fillStyle(0x9c6951,1).fillRoundedRect(4,18,88,74,10);
    graphics.lineStyle(4,0xffe2b8,1).strokeRoundedRect(4,18,88,74,10);
    graphics.lineStyle(5,0x6f4638,1).strokeLineShape(new Phaser.Geom.Line(22,70,74,40));
    graphics.strokeLineShape(new Phaser.Geom.Line(22,40,74,70));
    graphics.generateTexture(key,96,96);
    graphics.destroy();
  }
}
