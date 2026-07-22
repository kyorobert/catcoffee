export const CAT_ASSET_VERSION = '0550a';
export const CAT_FRAME_WIDTH = 64;
export const CAT_FRAME_HEIGHT = 64;

export const CAT_ANIMATION_LAYOUT = Object.freeze({
  idle: Object.freeze({row: 0, frameRate: 1, repeat: -1}),
  walk: Object.freeze({row: 1, frameRate: 9, repeat: -1}),
  sit: Object.freeze({row: 2, frameRate: 3, repeat: -1}),
  sleep: Object.freeze({row: 3, frameRate: 2, repeat: -1}),
  happy: Object.freeze({row: 4, frameRate: 8, repeat: 0}),
  serve: Object.freeze({row: 5, frameRate: 6, repeat: 0})
});

const profile = definition => Object.freeze({
  frameWidth: CAT_FRAME_WIDTH,
  frameHeight: CAT_FRAME_HEIGHT,
  scale: 1,
  moveSpeed: 52,
  ...definition,
  careReactions: Object.freeze(Object.fromEntries(
    Object.entries(definition.careReactions || {}).map(([mode, lines]) => [mode, Object.freeze([...lines])])
  )),
  textureKey: `cat:${definition.id}`,
  spriteSheet: `./assets/cats/${definition.id}/${definition.id}-spritesheet.png?v=${CAT_ASSET_VERSION}`,
  portrait: `./assets/cats/${definition.id}/${definition.id}-portrait.png?v=${CAT_ASSET_VERSION}`
});

// Cat IDs are save-data identities. Never rename these keys during visual updates.
export const CAT_CONFIG = Object.freeze({
  bean: profile({
    id: 'bean', name: '豆豆', personality: '親人又好奇',
    palette: Object.freeze({primary: '#a97852', secondary: '#fff4e5', eyes: '#367658'}),
    accessory: 'green-scarf', initialCell: Object.freeze({x: 1, y: 6}),
    careReactions: {feed: ['好香！', '豆豆還想再吃一口！'], groom: ['呼嚕呼嚕……', '毛毛變蓬鬆了！'], play: ['再一次！', '豆豆抓到你了！']}
  }),
  coal: profile({
    id: 'coal', name: '煤球', personality: '沉穩又可靠',
    palette: Object.freeze({primary: '#303238', secondary: '#4c4e55', eyes: '#d78c27'}),
    accessory: 'red-neckerchief', initialCell: Object.freeze({x: 5, y: 6}),
    careReactions: {feed: ['味道不錯。', '煤球滿意地舔舔嘴。'], groom: ['呼嚕……很舒服。', '煤球瞇起眼睛。'], play: ['這次算你厲害！', '煤球撲了過去！']}
  }),
  snow: profile({
    id: 'snow', name: '雪球', personality: '溫柔愛撒嬌',
    palette: Object.freeze({primary: '#f8f3e9', secondary: '#ffffff', eyes: '#2786c8'}),
    accessory: 'blue-bow', initialCell: Object.freeze({x: 7, y: 5}),
    careReactions: {feed: ['好好吃！', '雪球開心地晃晃尾巴。'], groom: ['軟綿綿的～', '雪球舒服地閉上眼。'], play: ['再玩一下嘛！', '雪球跳了起來！']}
  }),
  latte: profile({
    id: 'latte', name: '拿鐵', personality: '活潑的小吃貨',
    palette: Object.freeze({primary: '#c8864e', secondary: '#fff0d4', eyes: '#517c47'}),
    accessory: 'gold-bandana', initialCell: Object.freeze({x: 3, y: 7}),
    careReactions: {feed: ['拿鐵聞到香味了！'], groom: ['今天也很帥氣！'], play: ['快追上來！']}
  }),
  hana: profile({
    id: 'hana', name: '花花', personality: '優雅又貼心',
    palette: Object.freeze({primary: '#f0d3bc', secondary: '#fff6ec', eyes: '#8a6d45'}),
    accessory: 'pink-bib', initialCell: Object.freeze({x: 8, y: 4}),
    careReactions: {feed: ['謝謝招待。'], groom: ['花花輕輕地呼嚕。'], play: ['抓到小球了！']}
  })
});

export const CAT_PROFILES = Object.freeze(Object.values(CAT_CONFIG));

export const FALLBACK_CAT = Object.freeze({
  id: 'fallback', name: '貓咪', textureKey: 'cat:fallback',
  spriteSheet: `./assets/cats/fallback/fallback-spritesheet.png?v=${CAT_ASSET_VERSION}`,
  frameWidth: CAT_FRAME_WIDTH, frameHeight: CAT_FRAME_HEIGHT, scale: 1,
  careReactions: Object.freeze({feed: Object.freeze(['好香！']), groom: Object.freeze(['呼嚕呼嚕……']), play: Object.freeze(['再一次！'])})
});

export function getCatProfile(catId) {
  return CAT_CONFIG[catId] || Object.freeze({...FALLBACK_CAT, id: catId || 'fallback'});
}
