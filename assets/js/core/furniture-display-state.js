import {getFurnitureVisualDefinition} from '../config/furniture-visual-config.js?v=0577k';
import {resolveFurnitureDirection,rotationToDirection} from './furniture-direction.js?v=0577k';
import {
  resolveOrthogonalRotationPlacement,
  getOrthogonalRotationPolicy,
  effectiveRotationForPolicy,
  orthogonalRotationToCardinal,
  orthogonalRotationToTextureDirection
} from './orthogonal-furniture-rotation.js?v=0577k';

// Pure display description shared by the scene entity and its drag ghost.
// It contains only JSON-like values and never touches a texture manager or sprite.
// ARCH-0577C: orthogonal furniture resolves its facing through the cardinal map
// (r0 south / r1 west / r2 north / r3 east) and reuses the existing authored
// texture keys. iso/flat keep the untouched rotationToDirection mapping.
export function getFurnitureDisplayState(type,rotation,definition,projectionMode='iso'){
  const isOrtho=projectionMode==='ortho';
  const visual=getFurnitureVisualDefinition(type,projectionMode);
  const rotationPolicy=isOrtho
    ? getOrthogonalRotationPolicy(type,definition)
    : null;
  const displayRotation=isOrtho
    ? effectiveRotationForPolicy(rotation,rotationPolicy)
    : rotation;
  const textureDirection=isOrtho
    ? orthogonalRotationToTextureDirection(displayRotation)
    : rotationToDirection(rotation);
  const cardinalDirection=isOrtho
    ? orthogonalRotationToCardinal(displayRotation)
    : null;
  if(!visual){
    return {
      visual:null,texture:`furniture:${type}`,flipX:Boolean((rotation||0)%2),
      originX:.5,originY:definition.layer==='floorDecoration'?.5:1,
      scale:null,sizeFallback:true,direction:textureDirection,cardinalDirection,
      rotationPolicy,displayRotation,
      calibration:null,
      missingDirection:true,usedFallback:true
    };
  }
  const resolved=resolveFurnitureDirection(visual,textureDirection);
  return {
    visual,texture:resolved.texture,flipX:resolved.flipX,
    originX:visual.anchor.x,originY:visual.anchor.y,
    scale:visual.visualScale,sizeFallback:false,direction:textureDirection,cardinalDirection,
    rotationPolicy,displayRotation,
    calibration:visual.calibration||null,...resolved
  };
}

// ARCH-0577C: the sprite, the ghost and the red/green placement box all derive
// their world position from ONE resolver result. For orthogonal furniture that
// is the honest actual-rotation anchor (shared with Occupancy/Placement), so a
// non-square 90-degree turn moves the sprite exactly as its footprint moves —
// no fixed pivot, no screen offset. iso/flat keep their prior anchor path.
export function getFurnitureVisualPosition(grid,type,x,y,rotation,display){
  if((grid?.projectionMode||'iso')==='ortho'){
    return resolveOrthogonalRotationPlacement({
      grid,type,x,y,rotation,
      definition:grid?.furniture?.[type],
      policy:display?.rotationPolicy
    }).visualPosition;
  }
  const calibration=display?.calibration;
  const anchorRotation=calibration?.rotationAnchor==='base-rotation'
    ? calibration.baseRotation||0
    : rotation||0;
  const anchor=grid.getAnchor(type,x,y,anchorRotation);
  const nudge=calibration?.perDirectionNudge?.[display?.direction]||{x:0,y:0};
  return {x:anchor.x+nudge.x,y:anchor.y+nudge.y};
}
