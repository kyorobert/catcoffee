const ART_STATUSES=new Set(['production','redraw','prototype','retired']);
const HEIGHT_CLASSES=new Set(['floor','low','medium','tall','wall']);
const STATION_TYPES=new Set(['none','counter','cashier','coffee-machine','oven','display','prep-table','seat','table','cat-bed','cat-play','decoration']);
const DIRECTIONS=new Set(['down-right','down-left','up-right','up-left']);

export function validateFurnitureVisualConfig({definitions,visualConfig,prototypePlanIds=[],assetAudit={}}={}) {
  const errors=[];
  const warnings=[];
  const ids=Object.keys(definitions || {});
  const planIds=new Set(prototypePlanIds);
  const knownIds=new Set(ids);
  const whiteCardIds=new Set(assetAudit.whiteCardIds || []);
  const textSvgIds=new Set(assetAudit.textSvgIds || []);

  for(const id of ids){
    const definition=definitions[id];
    const visual=visualConfig?.[id];
    if(!visual){errors.push(`${id}: missing visual config`);continue}
    if(!ART_STATUSES.has(visual.artStatus))errors.push(`${id}: invalid artStatus`);
    if(typeof visual.storeVisible!=='boolean')errors.push(`${id}: storeVisible must be boolean`);
    if(!(Number.isFinite(visual.visualScale)&&visual.visualScale>0))errors.push(`${id}: visualScale must be > 0`);
    if(!(Number.isFinite(visual.anchor?.x)&&visual.anchor.x>=0&&visual.anchor.x<=1))errors.push(`${id}: anchor.x out of range`);
    if(!(Number.isFinite(visual.anchor?.y)&&visual.anchor.y>=0&&visual.anchor.y<=1))errors.push(`${id}: anchor.y out of range`);
    const textures=Object.values(visual.textureByDirection || {}).filter(value=>typeof value==='string'&&value.length>0);
    if(!textures.length)errors.push(`${id}: no directional texture`);
    if(textures.some(value=>!/^furniture:[A-Za-z0-9_-]+$/.test(value)&&!/^\.\//.test(value)))errors.push(`${id}: unresolvable texture reference`);
    if(visual.footprint?.width!==definition.foot?.[0]||visual.footprint?.height!==definition.foot?.[1])errors.push(`${id}: footprint changed`);
    if(!HEIGHT_CLASSES.has(visual.heightClass))errors.push(`${id}: invalid heightClass`);
    if(!Array.isArray(visual.interactionSockets))errors.push(`${id}: interactionSockets must be an array`);
    else{
      const socketIds=new Set();
      for(const socket of visual.interactionSockets){
        if(!socket?.id||socketIds.has(socket.id))errors.push(`${id}: duplicate or missing socket id`);
        socketIds.add(socket?.id);
        if(!Number.isFinite(socket?.gridOffset?.x)||!Number.isFinite(socket?.gridOffset?.y))errors.push(`${id}/${socket?.id}: invalid gridOffset`);
        if(!DIRECTIONS.has(socket?.facing))errors.push(`${id}/${socket?.id}: invalid facing`);
      }
    }
    if(!STATION_TYPES.has(visual.stationType))errors.push(`${id}: invalid stationType`);
    if(typeof visual.walkBlocking!=='boolean')errors.push(`${id}: walkBlocking must be boolean`);
    if(['prototype','retired'].includes(visual.artStatus)&&visual.storeVisible)errors.push(`${id}: ${visual.artStatus} must be hidden from store`);
    if((whiteCardIds.has(id)||textSvgIds.has(id))&&visual.artStatus==='production')errors.push(`${id}: card/text SVG cannot be production`);
    if(visual.artStatus==='prototype'&&!planIds.has(id))errors.push(`${id}: prototype missing from redraw plan`);
    if(visual.replacementId&&!knownIds.has(visual.replacementId))errors.push(`${id}: invalid replacementId`);
    if((visual.authoredDirections||[]).length<4)warnings.push(`${id}: missing authored direction artwork`);
  }
  for(const id of Object.keys(visualConfig || {}))if(!knownIds.has(id))warnings.push(`${id}: visual config has no furniture definition`);
  return {
    valid:errors.length===0,
    errors,warnings,
    summary:{furniture:ids.length,configured:ids.filter(id=>visualConfig?.[id]).length,errors:errors.length,warnings:warnings.length}
  };
}

