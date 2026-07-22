import {getFurnitureVisualDefinition} from '../config/furniture-visual-config.js?v=0551a';
import {resolveFurnitureDirection,rotationToDirection} from './furniture-direction.js?v=0551a';

// Pure display description shared by the scene entity and its drag ghost.
// It contains only JSON-like values and never touches a texture manager or sprite.
export function getFurnitureDisplayState(type,rotation,definition){
  const visual=getFurnitureVisualDefinition(type);
  if(!visual){
    return {
      visual:null,texture:`furniture:${type}`,flipX:Boolean((rotation||0)%2),
      originX:.5,originY:definition.layer==='floorDecoration'?.5:1,
      scale:null,sizeFallback:true,direction:rotationToDirection(rotation),
      missingDirection:true,usedFallback:true
    };
  }
  const direction=rotationToDirection(rotation);
  const resolved=resolveFurnitureDirection(visual,direction);
  return {
    visual,texture:resolved.texture,flipX:resolved.flipX,
    originX:visual.anchor.x,originY:visual.anchor.y,
    scale:visual.visualScale,sizeFallback:false,direction,...resolved
  };
}
