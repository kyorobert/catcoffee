const DIRECTIONS=Object.freeze(['down-right','down-left','up-right','up-left']);
const ALLOWED_STATUS=new Set(['production','redraw']);

function inspectPng(meta={}){
  const errors=[];
  if(meta.format!=='png')errors.push('not-png');
  if(!Number.isInteger(meta.width)||meta.width<64||!Number.isInteger(meta.height)||meta.height<64)errors.push('invalid-size');
  if(meta.hasAlpha!==true)errors.push('missing-alpha');
  if(meta.visiblePixels<=0)errors.push('empty-image');
  if(!Array.isArray(meta.cornerAlpha)||meta.cornerAlpha.length!==4||meta.cornerAlpha.some(alpha=>alpha>8))errors.push('opaque-corner');
  if(Number(meta.whitePixelRatio)>0.72)errors.push('white-card-background');
  return errors;
}

export function validateFurnitureAssetRecord({id,definition,visual,pngByPath={}}={}){
  const errors=[];
  if(!id||!definition||!visual)return {id:id||'',valid:false,errors:['missing-record']};
  if(!ALLOWED_STATUS.has(visual.artStatus))errors.push('prototype-not-cleared');
  if(visual.storeVisible!==true)errors.push('store-hidden');
  if(visual.sourceFormat!=='png')errors.push('runtime-format-not-png');
  if(visual.footprint?.width!==definition.foot?.[0]||visual.footprint?.height!==definition.foot?.[1])errors.push('footprint-changed');
  if((visual.authoredDirections||[]).length!==4)errors.push('directions-incomplete');
  if(visual.mirrorAllowed!==false)errors.push('unexpected-mirror-fallback');
  for(const direction of DIRECTIONS){
    const key=visual.textureByDirection?.[direction];
    const path=visual.texturePathByDirection?.[direction];
    if(key!==`furniture:${id}:${direction}`)errors.push(`${direction}:invalid-texture-key`);
    if(typeof path!=='string'||!path.startsWith(`./assets/furniture/redrawn/${id}/`)||!path.endsWith(`-${direction}.png?v=0560a`)){
      errors.push(`${direction}:invalid-texture-path`);
      continue;
    }
    const canonicalPath=path.split('?')[0];
    const meta=pngByPath[canonicalPath];
    if(!meta){errors.push(`${direction}:missing-png-metadata`);continue}
    for(const error of inspectPng(meta))errors.push(`${direction}:${error}`);
  }
  return {id,valid:errors.length===0,errors};
}

export function summarizeFurnitureAssetValidation(records=[]){
  const failed=records.filter(record=>!record.valid);
  return {valid:failed.length===0,total:records.length,passed:records.length-failed.length,failed};
}

export {DIRECTIONS as FURNITURE_ASSET_DIRECTIONS};
