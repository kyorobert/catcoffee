export const CURRENT_KEY='catCafePhaserV0540';
export const LEGACY_SAVE_KEYS=Object.freeze(['catCafeDecorV049','catCafeDecorV048','catCafeDecorV0473','catCafeDecorV04703']);
export const LEGACY_BACKUP_KEY='catCafeLegacySaveBackupV0532';
export const MIGRATION_COMPLETED_VERSION=5401;

const initialItems=[
  ['rugStripe',3,4,0],['rugPink',6,5,0],['counter',7,2,1],['dessert',8,3,0],
  ['console',5,2,0],['pinkTableLong',2,4,0],['chair',2,5,0],['chair',3,4,1],
  ['pinkTable',5,5,0],['cushionChair',5,6,0],['redChair',6,5,1],['sofa',1,2,0],
  ['bookshelf',1,4,0],['glassCabinet',3,2,0],['plant',8,5,0],['vasePlant',7,6,0],
  ['catBed',1,6,0],['fireplace',8,4,0]
];

export class SaveAdapter{
  constructor(furnitureConfig,storage=window.localStorage){
    this.furniture=furnitureConfig;
    this.storage=storage;
    this.state=this.load();
  }
  defaultState(){
    return {
      sceneSchemaVersion:5401,migrationCompletedVersion:MIGRATION_COMPLETED_VERSION,
      engine:'phaser',engineVersion:'3.90.0',
      coins:128750,reputation:4850,xp:2320,shopLevel:23,day:32,weekdayIndex:2,
      phase:'prep',phaseElapsed:0,energy:5,maxEnergy:5,cleanliness:72,foodStock:8,
      dailyRevenue:0,dailyRep:0,servedCustomers:0,dailyOrders:0,dailyTips:0,
      category:'全部',placementHelper:false,inventory:{},dutyCats:['bean','coal','snow'],
      catStats:{
        bean:{satiety:62,mood:76,bond:12,clean:70,lastCareAt:0,careCount:0,lastCareMode:null},
        coal:{satiety:58,mood:68,bond:8,clean:64,lastCareAt:0,careCount:0,lastCareMode:null},
        snow:{satiety:66,mood:74,bond:10,clean:82,lastCareAt:0,careCount:0,lastCareMode:null},
        latte:{satiety:61,mood:82,bond:11,clean:68,lastCareAt:0,careCount:0,lastCareMode:null},
        hana:{satiety:55,mood:78,bond:9,clean:72,lastCareAt:0,careCount:0,lastCareMode:null}
      },
      tasks:{serve:0,care:0,revenue:0},taskRewardClaimed:false,
      migrationWarnings:[],migrationArchive:[],unmappedLegacyItems:[],
      items:initialItems.filter(([type])=>this.furniture[type]).map((entry,index)=>({id:`i${index}`,type:entry[0],x:entry[1],y:entry[2],r:entry[3]}))
    };
  }
  findLegacyRaw(){
    for(const key of LEGACY_SAVE_KEYS){
      const raw=this.storage.getItem(key);
      if(raw)return {key,raw};
    }
    return null;
  }
  load(){
    const currentRaw=this.storage.getItem(CURRENT_KEY);
    if(currentRaw){
      try{return this.normalizeState(JSON.parse(currentRaw),{fromLegacy:false})}
      catch(error){console.error('Phaser save is invalid; attempting legacy recovery.',error)}
    }
    const legacy=this.findLegacyRaw();
    if(!legacy)return this.defaultState();
    try{
      if(!this.storage.getItem(LEGACY_BACKUP_KEY))this.storage.setItem(LEGACY_BACKUP_KEY,legacy.raw);
      const state=this.normalizeState(JSON.parse(legacy.raw),{fromLegacy:true});
      this.storage.setItem(CURRENT_KEY,JSON.stringify(state));
      return state;
    }catch(error){
      console.error('Save migration failed; legacy keys remain unchanged.',error);
      return this.defaultState();
    }
  }
  normalizeState(parsed,{fromLegacy}){
    const defaults=this.defaultState();
    const state={...defaults,...parsed};
    const sourceItems=Array.isArray(parsed.items)?parsed.items:defaults.items;
    const unknownItems=sourceItems.filter(item=>item&&!this.furniture[item.type]);
    state.unmappedLegacyItems=[...(parsed.unmappedLegacyItems||[]),...unknownItems]
      .filter((item,index,list)=>list.findIndex(candidate=>candidate.id===item.id&&candidate.type===item.type)===index);
    state.items=sourceItems.filter(item=>item&&this.furniture[item.type]).map(item=>{
      const x=Number(item.x),y=Number(item.y),rotation=Number(item.r??item.rotation??0);
      return {...item,x:Number.isFinite(x)?x:item.x,y:Number.isFinite(y)?y:item.y,r:Number.isFinite(rotation)?rotation:0};
    });
    state.inventory={...defaults.inventory,...(parsed.inventory||{})};
    state.catStats=Object.fromEntries(Object.keys(defaults.catStats).map(catId=>[
      catId,
      {...defaults.catStats[catId],...(parsed.catStats?.[catId]||{})}
    ]));
    for(const [catId,stats] of Object.entries(parsed.catStats||{})){
      if(!state.catStats[catId])state.catStats[catId]={...stats,lastCareAt:Number(stats.lastCareAt)||0,careCount:Number(stats.careCount)||0,lastCareMode:stats.lastCareMode||null};
    }
    state.migrationWarnings=Array.isArray(parsed.migrationWarnings)?[...parsed.migrationWarnings]:[];
    state.migrationArchive=Array.isArray(parsed.migrationArchive)?[...parsed.migrationArchive]:[];
    for(const item of unknownItems){
      if(!state.migrationArchive.some(entry=>entry.item?.id===item.id&&entry.reason==='unknown-furniture-type')){
        state.migrationArchive.push({item:{...item},reason:'unknown-furniture-type'});
      }
    }
    if(unknownItems.length&&!state.migrationWarnings.some(warning=>warning.reason==='unknown-furniture-type')){
      state.migrationWarnings.push({count:unknownItems.length,reason:'unknown-furniture-type',action:'preserved-unmapped'});
    }
    state.sceneSchemaVersion=fromLegacy?Number(parsed.sceneSchemaVersion||0):Number(parsed.sceneSchemaVersion||5401);
    state.migrationCompletedVersion=fromLegacy?0:Number(parsed.migrationCompletedVersion||0);
    state.engine='phaser';
    state.engineVersion='3.90.0';
    return state;
  }
  migrateIfNeeded(grid){
    if(Number(this.state.migrationCompletedVersion)>=MIGRATION_COMPLETED_VERSION)return this.state.migrationWarnings;
    const kept=[];
    const occupied={floorObject:new Set(),wallObject:new Set()};
    for(const item of this.state.items){
      const cells=grid.getFootprintCells(item.type,item.x,item.y,item.r||0);
      const layer=this.furniture[item.type]?.layer||'floorObject';
      const inside=cells.every(cell=>grid.isInsideGrid(cell.x,cell.y));
      const placeable=layer==='wallObject'||cells.every(cell=>grid.isPlaceableCell(cell.x,cell.y));
      const collision=layer!=='floorDecoration'&&cells.some(cell=>occupied[layer]?.has(`${cell.x},${cell.y}`));
      if(inside&&placeable&&!collision){
        kept.push(item);
        if(layer!=='floorDecoration')cells.forEach(cell=>occupied[layer]?.add(`${cell.x},${cell.y}`));
        continue;
      }
      const reason=!inside?'out-of-bounds':(!placeable?'reserved-cell':'overlap');
      if(!this.state.migrationArchive.some(entry=>entry.item?.id===item.id)){
        this.state.migrationArchive.push({item:{...item},reason});
        this.state.inventory[item.type]=(this.state.inventory[item.type]||0)+1;
      }
      if(!this.state.migrationWarnings.some(warning=>warning.itemId===item.id&&warning.reason===reason)){
        this.state.migrationWarnings.push({itemId:item.id,type:item.type,reason,action:'inventory'});
      }
    }
    this.state.items=kept;
    this.state.sceneSchemaVersion=5401;
    this.state.migrationCompletedVersion=MIGRATION_COMPLETED_VERSION;
    this.save();
    return this.state.migrationWarnings;
  }
  clearCurrent(){this.storage.removeItem(CURRENT_KEY)}
  save(){this.storage.setItem(CURRENT_KEY,JSON.stringify(this.state))}
}
