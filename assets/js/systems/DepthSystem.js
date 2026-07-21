export const DEPTH_BIAS=Object.freeze({floorDecoration:-200,floorObject:0,wallObject:-80,character:20,foreground:2000,ghost:4000,placement:4100});
export class DepthSystem{
  static for(layer,anchorY){return Math.round(anchorY)+(DEPTH_BIAS[layer]??0)}
}

