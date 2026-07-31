import {getFurnitureVisualDefinition} from '../config/furniture-visual-config.js?v=0577n';
import {resolveFurnitureDirection,rotationToDirection} from './furniture-direction.js?v=0577n';
import {
  resolveOrthogonalRotationPlacement,
  getOrthogonalRotationPolicy,
  effectiveRotationForPolicy,
  orthogonalRotationToCardinal,
  orthogonalRotationToTextureDirection
} from './orthogonal-furniture-rotation.js?v=0577n';
import {
  resolveFurnitureVisualPlacement
} from './furniture-visual-placement.js?v=0577n';

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
      visualPlacement:null,
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
    visualPlacement:visual.visualPlacement||null,
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

function polygonBounds(points=[]){
  const xs=points.map(point=>Number(point.x)).filter(Number.isFinite);
  const ys=points.map(point=>Number(point.y)).filter(Number.isFinite);
  if(!xs.length||!ys.length)return {x:0,y:0,width:1,height:1};
  const minX=Math.min(...xs),maxX=Math.max(...xs);
  const minY=Math.min(...ys),maxY=Math.max(...ys);
  return {x:minX,y:minY,width:Math.max(1,maxX-minX),height:Math.max(1,maxY-minY)};
}

export function textureFrameDimensions(frame){
  return {
    width:Number(frame?.realWidth||frame?.cutWidth||frame?.width||0),
    height:Number(frame?.realHeight||frame?.cutHeight||frame?.height||0)
  };
}

// ARCH-0577L1: the placed entity, drag ghost and rotation preview must all call
// this adapter. Logical placement remains owned by Grid/rotation policy; this
// adapter only maps the selected texture into the optional visual contract.
export function getFurnitureVisualPlacementState({
  grid,type,x,y,rotation=0,definition,display,textureFrame,resolvedPlacement=null,
  composition=null
}){
  const logicalResolved=resolvedPlacement
    ||((grid?.projectionMode||'iso')==='ortho'
      ?resolveOrthogonalRotationPlacement({
        grid,type,x,y,rotation,definition,
        policy:display?.rotationPolicy
      })
      :null);
  const logicalAnchor=logicalResolved?.visualPosition
    ||getFurnitureVisualPosition(grid,type,x,y,rotation,display);
  const footprintPolygon=logicalResolved?.footprintPolygon
    ||grid.getFootprintPolygon(type,x,y,rotation);
  const rawFootprint=logicalResolved?.footprint
    ||grid.getFootprintSize?.(type,rotation)
    ||(Math.abs(rotation)%2
      ?[definition?.foot?.[1]||1,definition?.foot?.[0]||1]
      :[definition?.foot?.[0]||1,definition?.foot?.[1]||1]);
  const logicalFootprint=Array.isArray(rawFootprint)
    ?{width:Number(rawFootprint[0]),height:Number(rawFootprint[1])}
    :{width:Number(rawFootprint?.width),height:Number(rawFootprint?.height)};
  const logicalBounds=polygonBounds(footprintPolygon);
  logicalBounds.anchorX=logicalAnchor.x;
  logicalBounds.anchorY=logicalAnchor.y;
  const nativeTargetWidth=Math.max(44,Math.min(180,definition?.size||96));
  const visualPlacement=resolveFurnitureVisualPlacement({
    projectionMode:grid?.projectionMode||'iso',
    type,
    direction:display?.direction||'',
    logicalFootprint,
    logicalBounds,
    textureFrame:textureFrameDimensions(textureFrame),
    visualDefinition:{
      origin:{x:display?.originX??.5,y:display?.originY??1},
      nativeScale:display?.scale,
      nativeTargetWidth,
      visualPlacement:display?.visualPlacement||null
    }
  });
  // ARCH-0577M1: an optional composition result (from the pure composition
  // resolver, computed once per layout mutation) adds a VISUAL-ONLY offset and a
  // depth bias on top of the single-item visual placement. Null composition keeps
  // exact native/L1 parity. It never changes logical anchor, footprint or bounds.
  const compositionOffsetX=Number(composition?.visualOffsetX)||0;
  const compositionOffsetY=Number(composition?.visualOffsetY)||0;
  return {
    ...visualPlacement,
    worldX:logicalAnchor.x+visualPlacement.offsetX+visualPlacement.groundOffsetX+compositionOffsetX,
    worldY:logicalAnchor.y+visualPlacement.offsetY+visualPlacement.groundOffsetY+compositionOffsetY,
    compositionOffsetX,
    compositionOffsetY,
    compositionDepthBias:Number(composition?.depthBias)||0,
    composition:composition||null,
    logicalAnchor,
    logicalBounds,
    logicalFootprint,
    footprintPolygon,
    logicalResolved
  };
}
