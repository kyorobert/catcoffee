const LAYERS=['floorDecoration','floorObject','wallObject','character','reserved'];
const key=(x,y)=>`${x},${y}`;

export class OccupancySystem{
  constructor(grid,furnitureConfig){
    this.grid=grid;
    this.furniture=furnitureConfig;
    this.layers=new Map(LAYERS.map(layer=>[layer,new Map()]));
    this.items=new Map();
  }
  clear(){for(const layer of this.layers.values())layer.clear();this.items.clear()}
  build(items=[]){
    this.clear();
    this.grid.room.entrance.cells.forEach(cell=>this.layers.get('reserved').set(key(cell.x,cell.y),'entrance'));
    items.forEach(item=>this.addItem(item));
  }
  layerFor(item){return this.furniture[item.type]?.layer||'floorObject'}
  addItem(item){
    const layer=this.layerFor(item);
    const cells=this.grid.getFootprintCells(item.type,item.x,item.y,item.r??item.rotation??0);
    this.items.set(item.id,{item:{...item},layer,cells});
    if(layer==='character')return;
    const map=this.layers.get(layer);
    cells.forEach(cell=>map.set(key(cell.x,cell.y),item.id));
  }
  removeItem(itemId){
    const record=this.items.get(itemId);
    if(!record)return;
    const map=this.layers.get(record.layer);
    record.cells.forEach(cell=>{if(map?.get(key(cell.x,cell.y))===itemId)map.delete(key(cell.x,cell.y))});
    this.items.delete(itemId);
  }
  updateItem(item){this.removeItem(item.id);this.addItem(item)}
  isOccupied(x,y,layer='floorObject',movingItemId=null){
    const occupant=this.layers.get(layer)?.get(key(x,y));
    return Boolean(occupant&&occupant!==movingItemId);
  }
  canOccupy(cells,{layer='floorObject',movingItemId=null}={}){
    for(const cell of cells){
      if(layer!=='wallObject'&&this.isOccupied(cell.x,cell.y,'reserved',movingItemId))return {valid:false,reason:'reserved-entrance'};
      if(layer==='floorDecoration')continue;
      if(layer==='wallObject'){
        if(this.isOccupied(cell.x,cell.y,'wallObject',movingItemId))return {valid:false,reason:'overlap'};
      }else if(this.isOccupied(cell.x,cell.y,'floorObject',movingItemId))return {valid:false,reason:'overlap'};
    }
    return {valid:true,reason:null};
  }
}

