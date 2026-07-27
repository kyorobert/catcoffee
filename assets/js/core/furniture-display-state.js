import {getFurnitureVisualDefinition} from '../config/furniture-visual-config.js?v=0577b';
import {resolveFurnitureDirection,rotationToDirection} from './furniture-direction.js?v=0577b';

// Pure display description shared by the scene entity and its drag ghost.
// It contains only JSON-like values and never touches a texture manager or sprite.
export function getFurnitureDisplayState(type,rotation,definition,projectionMode='iso'){
  const visual=getFurnitureVisualDefinition(type,projectionMode);
  if(!visual){
    return {
      visual:null,texture:`furniture:${type}`,flipX:Boolean((rotation||0)%2),
      originX:.5,originY:definition.layer==='floorDecoration'?.5:1,
      scale:null,sizeFallback:true,direction:rotationToDirection(rotation),
      calibration:null,
      missingDirection:true,usedFallback:true
    };
  }
  const direction=rotationToDirection(rotation);
  const resolved=resolveFurnitureDirection(visual,direction);
  return {
    visual,texture:resolved.texture,flipX:resolved.flipX,
    originX:visual.anchor.x,originY:visual.anchor.y,
    scale:visual.visualScale,sizeFallback:false,direction,
    calibration:visual.calibration||null,...resolved
  };
}

// Entity, preview and drag ghost must resolve the exact same visual pivot.
// Gameplay footprint/occupancy remains rotation-aware in GridSystem; this
// helper only prevents non-square orthogonal artwork from appearing to jump
// when its logical top-left cell is unchanged.
export function getFurnitureVisualPosition(grid,type,x,y,rotation,display){
  const calibration=display?.calibration;
  const anchorRotation=calibration?.rotationAnchor==='base-rotation'
    ? calibration.baseRotation||0
    : rotation||0;
  const anchor=grid.getAnchor(type,x,y,anchorRotation);
  const nudge=calibration?.perDirectionNudge?.[display?.direction]||{x:0,y:0};
  return {x:anchor.x+nudge.x,y:anchor.y+nudge.y};
}
