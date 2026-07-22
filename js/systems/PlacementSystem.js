const CHAIR_TYPES=new Set(['chair','redChair','cushionChair','windowHighChair','catEarChair']);
const TABLE_TYPES=new Set(['roundTable','pinkTable','woodTable','pinkTableLong','squareCafeTable']);

export class PlacementSystem{
  constructor(grid,occupancy,furnitureConfig){
    this.grid=grid;
    this.occupancy=occupancy;
    this.furniture=furnitureConfig;
  }
  validatePlacement({type,x,y,rotation=0,movingItemId=null}){
    const definition=this.furniture[type];
    if(!definition)return this.result(false,'unplaceable-cell','找不到這件家具');
    const cells=this.grid.getFootprintCells(type,x,y,rotation);
    if(cells.some(cell=>!this.grid.isInsideGrid(cell.x,cell.y)))return this.result(false,'out-of-bounds','這件家具會超出房間');
    if(cells.some(cell=>this.grid.room.entrance.cells.some(entrance=>entrance.x===cell.x&&entrance.y===cell.y)))return this.result(false,'reserved-entrance','此位置為入口保留區');
    if(cells.some(cell=>!this.grid.isPlaceableCell(cell.x,cell.y)))return this.result(false,'unplaceable-cell','這裡不是可擺放地板');
    const layer=definition.layer||'floorObject';
    if(layer==='wallObject'&&!cells.every(cell=>cell.x===0||cell.y===0))return this.result(false,'invalid-wall-slot','此家具只能放在指定牆面');
    const occupied=this.occupancy.canOccupy(cells,{layer,movingItemId});
    if(!occupied.valid){
      const message=occupied.reason==='reserved-entrance'?'此位置為入口保留區':'這個位置已有其他家具';
      return this.result(false,occupied.reason,message);
    }
    const warnings=[];
    if(CHAIR_TYPES.has(type)&&!this.hasAdjacentTable({type,x,y,rotation,movingItemId})){
      warnings.push({code:'chair-without-table',message:'這張椅子尚未靠近咖啡桌'});
    }
    return {valid:true,blockingReason:null,message:null,warnings};
  }
  hasAdjacentTable(item){
    const cells=this.grid.getFootprintCells(item.type,item.x,item.y,item.rotation||0);
    const neighbours=new Set();
    cells.forEach(({x,y})=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].forEach(([nx,ny])=>neighbours.add(`${nx},${ny}`)));
    for(const record of this.occupancy.items.values()){
      if(record.item.id===item.movingItemId||!TABLE_TYPES.has(record.item.type))continue;
      if(record.cells.some(cell=>neighbours.has(`${cell.x},${cell.y}`)))return true;
    }
    return false;
  }
  result(valid,blockingReason,message){return {valid,blockingReason,message,warnings:[]}}
}
