# V0.57.6-alpha｜正交可玩區與 Room Skin 驗收

Build：`0576a`  
日期：2026-07-26

## 自動化驗收

| 項目 | 結果 | 證據 |
|---|---|---|
| `npm.cmd test` | 通過 | Core tests |
| `npm.cmd run check:deploy` | 通過 | deploy gate |
| `npm.cmd run check:dev` | 通過 | deploy gate + Chrome smoke |
| iso golden | 通過 | `grid-projection-compat` / core |
| Flat C golden | 通過 | `flat-projection` / preset tests |
| playable visual follows mask | 通過 | `ortho-playable-area-skin.test.js` |
| shell 不使用 playable floor palette | 通過 | luminance separation + role assertion |
| 1×1 edge placement | 通過 | top-left、right edge、reserved entrance |
| 1×2 edge placement | 通過 | bottom-left valid、bottom overflow invalid |
| 2×2 edge placement | 通過 | top-right/bottom-left valid、right overflow/entrance invalid |
| green preview → unchanged commit | 通過 | cached evaluation regression |
| candidate 改變後重新驗證 | 通過 | signature invalidation regression |
| Room Skin config purity | 通過 | no Phaser/DOM/storage |
| Camera zoom/pan | 通過 | Chrome real pointer + metrics |
| invalid projection fallback | 通過 | browser smoke |
| local assets / 404 / console | 通過 | browser smoke |

## Chrome 視覺驗收

| URL / viewport | 結果 |
|---|---|
| `/?projection=ortho` / 390×844 | 通過 |
| `/?projection=ortho&demoLayout=1` / 390×844 | 通過 |
| `/?projection=ortho&demoLayout=1` / 393×852 | 通過 |
| `/?projection=ortho&demoLayout=1` / 430×932 | 通過 |
| `/?projection=ortho&demoLayout=1&artDebug=1` / desktop | 通過 |
| invalid projection fallback | 通過 |

390×844 初始 zoom `0.53125`，minZoom `0.425`。zoom-in `1.3` 後 real pointer pan delta：X `104`、Y `98` world px。pageerror / request failure：0。

## 人工視覺確認

- [x] 可玩地板為明亮 10×8 區域。
- [x] bottom shell 為深木固定建築帶，不再像地板延伸。
- [x] `(8,7)/(9,7)` 保留格有不同 threshold treatment。
- [x] 門包含 casing、lintel、玻璃、門板、把手與小招牌。
- [x] 牆面與護牆板有結構，不是單色大塊。
- [x] 390/393/430 截圖沒有外圈黑邊。
- [x] zoom-in pan 後仍無黑邊，家具／Grid 相對位置不漂移。

## 仍需實機驗收

- [ ] iPhone Safari 真機單指 pan。
- [ ] iPhone Safari 真機 pinch。
- [ ] Safari 地址列展開／收合。
- [ ] 真機長按／拖曳 1×1、1×2、2×2 至所有邊界。

以上項目未實機測試，不宣稱通過；Chrome 自動化與桌面人工截圖已通過。
