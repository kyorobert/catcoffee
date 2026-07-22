export function getPurchasableFurniture({definitions,visualConfig,category='全部'}={}) {
  return Object.entries(definitions || {})
    .filter(([id,definition])=>{
      const visual=visualConfig?.[id];
      return visual?.storeVisible === true
        && visual.artStatus !== 'prototype'
        && visual.artStatus !== 'retired'
        && (category === '全部' || definition.cat === category);
    })
    .map(([id,definition])=>({id,definition,visual:visualConfig[id]}));
}

export function getDebugFurnitureCatalog({definitions,visualConfig}={}) {
  return Object.entries(definitions || {}).map(([id,definition])=>({id,definition,visual:visualConfig?.[id] || null}));
}

