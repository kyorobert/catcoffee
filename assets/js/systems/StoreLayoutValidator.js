const CHAIRS=new Set(['chair','redChair','cushionChair','windowHighChair','catEarChair']);
export function validateStoreLayoutBeforeOpen(items,placement){
  const warnings=[];
  for(const item of items){
    if(CHAIRS.has(item.type)&&!placement.hasAdjacentTable({...item,rotation:item.r||0,movingItemId:item.id})){
      warnings.push({code:'chair-without-table',itemId:item.id,message:'有椅子尚未靠近咖啡桌，該座位營業時不會啟用'});
    }
  }
  return {valid:true,warnings};
}

