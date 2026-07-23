import {FURNITURE_CONFIG} from './furniture-config.js?v=0552a';

// Visual-only metadata. Prices, unlocks, footprints and save data remain owned by
// furniture-config.js and SaveAdapter; this module never mutates those sources.
export const FURNITURE_ART_STATUS = Object.freeze({
  PRODUCTION: 'production',
  REDRAW: 'redraw',
  PROTOTYPE: 'prototype',
  RETIRED: 'retired'
});

export const FURNITURE_HEIGHT_CLASS = Object.freeze({
  FLOOR: 'floor',
  LOW: 'low',
  MEDIUM: 'medium',
  TALL: 'tall',
  WALL: 'wall'
});

export const FURNITURE_STATION_TYPE = Object.freeze({
  NONE: 'none',
  COUNTER: 'counter',
  CASHIER: 'cashier',
  COFFEE_MACHINE: 'coffee-machine',
  OVEN: 'oven',
  DISPLAY: 'display',
  PREP_TABLE: 'prep-table',
  SEAT: 'seat',
  TABLE: 'table',
  CAT_BED: 'cat-bed',
  CAT_PLAY: 'cat-play',
  DECORATION: 'decoration'
});

export const FURNITURE_DIRECTIONS = Object.freeze([
  'down-right', 'down-left', 'up-right', 'up-left'
]);

export const PROTOTYPE_FURNITURE_IDS = Object.freeze([
  'squareCafeTable', 'windowHighChair', 'wallBench', 'catEarChair', 'creamSofa',
  'pawSofa', 'cardboardNest', 'scratchPost', 'windowHammock', 'doubleCatTree',
  'catTent', 'catCastle', 'coffeeMachine', 'oven', 'washStation', 'smartOrder',
  'welcomeSign', 'dryFlower', 'monsterPlant', 'photoBackdrop', 'aquarium',
  'pawRug', 'creamPlaidRug', 'starNightRug', 'childrenPlayArea'
]);

// Historical audit set: these 25 IDs were the V0.55.1 placeholder SVGs.
// V0.55.2 preserves IDs and gameplay metadata while replacing only runtime art.
export const V0552_REDRAW_FURNITURE_IDS = PROTOTYPE_FURNITURE_IDS;
export const FURNITURE_REDRAW_ASSET_VERSION = '0552a';
export const V0552_REDRAW_BATCHES = Object.freeze({
  P0:Object.freeze(['squareCafeTable','windowHighChair','wallBench','catEarChair','creamSofa','pawSofa','cardboardNest','scratchPost','windowHammock','doubleCatTree']),
  P1:Object.freeze(['catTent','catCastle','coffeeMachine','oven','washStation','smartOrder','pawRug','creamPlaidRug','starNightRug']),
  P2:Object.freeze(['welcomeSign','dryFlower','monsterPlant','photoBackdrop','aquarium','childrenPlayArea'])
});

const prototypeIds = new Set(PROTOTYPE_FURNITURE_IDS);
const redrawIds = new Set(['sofa', 'kitchen', 'console', 'catBed']);
const v0552RedrawIds = new Set(V0552_REDRAW_FURNITURE_IDS);
const needsFinalPolishIds = new Set(['childrenPlayArea']);
const mirrorAllowedIds = new Set([
  'roundTable', 'pinkTable', 'rugPink', 'rugStripe', 'rugRed',
  'pawRug', 'creamPlaidRug', 'starNightRug'
]);

// Values preserve the current scene footprint and approximately preserve the
// previous target width, while making the display multiplier explicit per asset.
const visualScaleById = Object.freeze({
  roundTable:.78,pinkTable:.78,woodTable:.82,pinkTableLong:.84,
  chair:1.12,cushionChair:1.2,redChair:1.32,sofa:.86,
  counter:1.08,dessert:.97,kitchen:1.27,console:1.53,
  bookshelf:.73,tallCabinet:1.1,glassCabinet:1.17,plant:1.1,
  vasePlant:1.25,fireplace:1.16,catBed:.75,
  rugPink:.65,rugStripe:.65,rugRed:.67,
  squareCafeTable:.61,windowHighChair:.61,wallBench:.75,catEarChair:.61,
  creamSofa:.75,pawSofa:.75,cardboardNest:.61,scratchPost:.61,
  windowHammock:.61,doubleCatTree:.75,catTent:.61,catCastle:.75,
  coffeeMachine:.61,oven:.61,washStation:.75,smartOrder:.61,welcomeSign:.61,
  dryFlower:.61,monsterPlant:.61,photoBackdrop:.75,aquarium:.75,
  pawRug:.75,creamPlaidRug:.75,starNightRug:.75,childrenPlayArea:.77
});

const heightById = Object.freeze({
  roundTable:'medium',pinkTable:'medium',woodTable:'medium',pinkTableLong:'medium',
  chair:'medium',cushionChair:'medium',redChair:'medium',sofa:'medium',
  counter:'medium',dessert:'tall',kitchen:'medium',console:'low',bookshelf:'tall',
  tallCabinet:'tall',glassCabinet:'tall',plant:'tall',vasePlant:'medium',
  fireplace:'tall',catBed:'low',rugPink:'floor',rugStripe:'floor',rugRed:'floor',
  squareCafeTable:'medium',windowHighChair:'medium',wallBench:'medium',catEarChair:'medium',
  creamSofa:'medium',pawSofa:'medium',cardboardNest:'low',scratchPost:'medium',
  windowHammock:'wall',doubleCatTree:'tall',catTent:'low',catCastle:'tall',
  coffeeMachine:'medium',oven:'medium',washStation:'medium',smartOrder:'medium',
  welcomeSign:'medium',dryFlower:'low',monsterPlant:'tall',photoBackdrop:'wall',
  aquarium:'tall',pawRug:'floor',creamPlaidRug:'floor',starNightRug:'floor',
  childrenPlayArea:'low'
});

const stationById = Object.freeze({
  roundTable:'table',pinkTable:'table',woodTable:'table',pinkTableLong:'table',
  squareCafeTable:'table',chair:'seat',cushionChair:'seat',redChair:'seat',
  windowHighChair:'seat',wallBench:'seat',catEarChair:'seat',sofa:'seat',
  creamSofa:'seat',pawSofa:'seat',counter:'counter',dessert:'display',
  glassCabinet:'display',kitchen:'prep-table',console:'prep-table',
  coffeeMachine:'coffee-machine',oven:'oven',washStation:'prep-table',smartOrder:'cashier',
  catBed:'cat-bed',cardboardNest:'cat-bed',windowHammock:'cat-bed',catTent:'cat-bed',
  scratchPost:'cat-play',doubleCatTree:'cat-play',catCastle:'cat-play',
  bookshelf:'decoration',tallCabinet:'decoration',plant:'decoration',vasePlant:'decoration',
  fireplace:'decoration',welcomeSign:'decoration',dryFlower:'decoration',
  monsterPlant:'decoration',photoBackdrop:'decoration',aquarium:'decoration',
  rugPink:'decoration',rugStripe:'decoration',rugRed:'decoration',pawRug:'decoration',
  creamPlaidRug:'decoration',starNightRug:'decoration',childrenPlayArea:'decoration'
});

const socket = (id, x, y, facing, capacity=1) => Object.freeze({
  id, type:id, gridOffset:Object.freeze({x,y}), facing, capacity
});

function socketsFor(stationType) {
  const sockets = {
    counter:[socket('staff-work',0,1,'up-right'),socket('customer-order',1,-1,'down-left'),socket('serve-pickup',1,1,'up-left')],
    cashier:[socket('staff-use',0,1,'up-right'),socket('customer-pay',0,-1,'down-left')],
    'coffee-machine':[socket('staff-use',0,1,'up-right')],
    oven:[socket('staff-use',0,1,'up-right')],
    display:[socket('staff-use',0,1,'up-right'),socket('customer-view',0,-1,'down-left')],
    'prep-table':[socket('staff-use',0,1,'up-right')],
    seat:[socket('customer-seat',0,0,'down-right')],
    table:[socket('customer-table',0,1,'up-right'),socket('staff-serve',1,0,'up-left')],
    'cat-bed':[socket('cat-rest',0,0,'down-right')],
    'cat-play':[socket('cat-play',0,0,'down-right')]
  };
  return Object.freeze([...(sockets[stationType] || [])]);
}

function statusFor(id) {
  if (v0552RedrawIds.has(id)) {
    return needsFinalPolishIds.has(id)
      ? FURNITURE_ART_STATUS.REDRAW
      : FURNITURE_ART_STATUS.PRODUCTION;
  }
  if (prototypeIds.has(id)) return FURNITURE_ART_STATUS.PROTOTYPE;
  if (redrawIds.has(id)) return FURNITURE_ART_STATUS.REDRAW;
  return FURNITURE_ART_STATUS.PRODUCTION;
}

function redrawReasonFor(id, status) {
  if (status === FURNITURE_ART_STATUS.PROTOTYPE) {
    return '白底圓角示意卡／非正式等角場景素材；保留舊存檔相容，排入 V0.55.2-alpha 重繪。';
  }
  return ({
    sofa:'現有圖像更接近床鋪，與「雙人沙發」概念不符。',
    kitchen:'2×1 footprint 的視覺寬度與工作面不足，需補正式方向與工作區。',
    console:'2×1 footprint 但主體接近 1×1，比例與占地不一致。',
    catBed:'現有圖像偏人用床，需重畫成符合貓咪比例的低矮睡墊。'
  })[id] || '';
}

function createVisualDefinition(id, definition) {
  const artStatus = statusFor(id);
  const textureKey = `furniture:${id}`;
  const layer = definition.layer || 'floorObject';
  const stationType = stationById[id] || FURNITURE_STATION_TYPE.NONE;
  const hasDirectionalRedraw = v0552RedrawIds.has(id);
  const textureByDirection = hasDirectionalRedraw
    ? Object.fromEntries(FURNITURE_DIRECTIONS.map(direction => [direction, `furniture:${id}:${direction}`]))
    : Object.fromEntries(FURNITURE_DIRECTIONS.map(direction => [direction, textureKey]));
  const texturePathByDirection = hasDirectionalRedraw
    ? Object.fromEntries(FURNITURE_DIRECTIONS.map(direction => [
      direction,
      `./assets/furniture/redrawn/${id}/${id}-${direction}.png?v=${FURNITURE_REDRAW_ASSET_VERSION}`
    ]))
    : null;
  const sourceFormat = hasDirectionalRedraw
    ? 'png'
    : definition.texture.toLowerCase().endsWith('.svg') ? 'svg' : 'png';
  return Object.freeze({
    artStatus,
    storeVisible: artStatus === FURNITURE_ART_STATUS.PRODUCTION || artStatus === FURNITURE_ART_STATUS.REDRAW,
    visualScale: visualScaleById[id],
    anchor:Object.freeze({x:.5,y:layer === 'floorDecoration' ? .5 : 1}),
    textureByDirection:Object.freeze(textureByDirection),
    texturePathByDirection:texturePathByDirection ? Object.freeze(texturePathByDirection) : null,
    fallbackTexture:hasDirectionalRedraw ? textureByDirection['down-right'] : textureKey,
    fallbackDirection:'down-right',
    authoredDirections:Object.freeze(hasDirectionalRedraw ? [...FURNITURE_DIRECTIONS] : ['down-right']),
    footprint:Object.freeze({width:definition.foot[0],height:definition.foot[1]}),
    heightClass:heightById[id],
    interactionSockets:socketsFor(stationType),
    stationType,
    walkBlocking:layer !== 'floorDecoration' && layer !== 'wallObject',
    mirrorAllowed:hasDirectionalRedraw ? false : mirrorAllowedIds.has(id),
    redrawReason:redrawReasonFor(id,artStatus),
    replacementId:null,
    sourceFormat,
    notes:hasDirectionalRedraw
      ? 'V0.55.2 原創四方向透明 PNG；舊 SVG 僅保留歷史稽核，不進入正式 Loader。'
      : artStatus === FURNITURE_ART_STATUS.PROTOTYPE
      ? 'Prototype 僅供舊存檔與 Art Debug；正常商店、新遊戲與自動生成均不使用。'
      : '目前只有 down-right 原生方向；其他方向採安全 fallback，不建立不存在的素材路徑。'
  });
}

export const FURNITURE_VISUAL_CONFIG = Object.freeze(Object.fromEntries(
  Object.entries(FURNITURE_CONFIG).map(([id, definition])=>[id,createVisualDefinition(id,definition)])
));

export function getFurnitureVisualDefinition(id) {
  return FURNITURE_VISUAL_CONFIG[id] || null;
}
