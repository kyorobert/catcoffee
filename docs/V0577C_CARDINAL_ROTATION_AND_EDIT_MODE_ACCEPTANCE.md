# V0577C 驗收：正交 90° 旋轉、cardinal 方位與家具編輯

- Task：`ARCH-0577C-ORTHOGONAL-CARDINAL-ROTATION-AND-EDIT-MODE`｜Build `0577c`
- 判定圖例：✅ 自動化已驗證　🟡 產品負責人實機保留　⛔ 不適用/未觸發

## A. 旋轉核心（Goal A）
| # | 驗收項 | 判定 | 依據 |
|---|---|---|---|
| A1 | 單一 resolver，所有消費者共用同一結果 | ✅ | `orthogonal-rotation-resolver.test.js`：visual==getAnchor、cells==getFootprintCells、polygon==getFootprintPolygon |
| A2 | Sprite 與 Occupancy 不再分離（消滅 r0-pin） | ✅ | `orthogonal-furniture-visuals.test.js` visual==gameplay anchor；browser-smoke sprite 貼齊 anchor |
| A3 | 4× 旋轉回到相同 x/y/r/footprint/visual、零漂移 | ✅ | resolver 40× round-trip；browser-smoke 真實 4 點擊歸位 |
| A4 | 非方形（2×1/1×2/3×2）單次 90° 誠實位移、不用固定 pivot 或畫面 offset | ✅ | resolver `notDeepEqual(r1,r0)`；audit 幾何推導（counter Δ=−44px/+120px） |
| A5 | 邊界/衝突以紅框拒絕、不偷偷移向中心 | ✅ | rotate 只改 r 不改 x/y；`furniture-drag`/scene `rotateSelection` 非法回退不移動 |
| A6 | 取消還原 x/y/r 與 Occupancy；旋轉一次只 commit 一次；失敗不扣幣 | ✅ | `furniture-drag.test.js`；scene rotate 非法路徑不 commit/不扣幣 |

## B. cardinal 方位（Goal B）
| # | 驗收項 | 判定 | 依據 |
|---|---|---|---|
| B1 | `{0:south,1:west,2:north,3:east}`、順時針、版本內鎖定 | ✅ | `orthogonal-rotation-resolver.test.js` cardinal 斷言 |
| B2 | 重用既有 4 貼圖 key、不重畫 | ✅ | cardinal→texture 對照；`ortho-furniture` 4 unique textures |
| B3 | iso/flat rotation/texture/golden/save 對應不變 | ✅ | `furniture-direction.test.js`；ortho-furniture iso/flat fallback preserved |

## C. 家具編輯模式（Goal C）
| # | 驗收項 | 判定 | 依據 |
|---|---|---|---|
| C1 | 編輯列就地替換底部主導覽列，非第二層浮動列 | ✅ | browser-smoke：`data-mode=edit`、`.bottom-nav` offsetParent=null、selectionBar 在 bar 內 |
| C2 | 取消後主導覽列還原、`selectedId=null` | ✅ | browser-smoke navRestored 斷言 |
| C3 | 相機不因選取/切換而跳（同容器等高） | ✅ | browser-smoke 既有「toolbar touch moved camera」零位移；drag「camera moved」零位移 |
| C4 | 編輯鈕 ≥44×44 CSS px | ✅ | browser-smoke 44×44 hit-target（cancel/rotate/store/sell），`elementFromPoint`=按鈕 |
| C5 | safe-area-inset-bottom 保留 | ✅ | `#gameBottomBar` padding `calc(...+env(safe-area-inset-bottom))` 未變 |
| C6 | 未縮放時底列可完整操作（拖曳/預覽/pointerup/commit/rotate/cancel） | ✅ | browser-smoke 放置/拖曳/旋轉/取消/收納/出售全流程 |
| C7 | iPhone Safari 位址列收合不破版、實機手感 | 🟡 | **保留產品負責人實機** |

## D. Art Debug
| # | 驗收項 | 判定 | 依據 |
|---|---|---|---|
| D1 | `artDebug=1` 只幾何＋短標籤、不再重疊字牆 | ✅ | ArtDebugRenderer focused/short 分支；browser-smoke artDebug URL 無 pageerror |
| D2 | 顯示 sprite bounds/footprint cells/logical pivot/visual pivot/resolved x/y/r+方位 | ✅ | focus 標籤與幾何繪製 |
| D3 | `artDebugFocus=<id>` 或選取才顯示完整 metadata；唯讀不寫存檔不攔指標 | ✅ | isFocused 分支；無 save 寫入、graphics 唯讀 |

## E. 版本 / 治理
| # | 驗收項 | 判定 |
|---|---|---|
| E1 | Build 0577b→0577c、package 維持 0.57.7-alpha、`?v=0577c`、obsolete `?v=0577b` | ✅ |
| E2 | save key/schema/migration/家具 ID/price/footprint/entrance/Grid 未改 | ✅ |
| E3 | 未建第二套 Grid/Camera/Occupancy；未用 CSS transform 假旋轉；未用畫面 offset 掩蓋 Occupancy | ✅ |
| E4 | `npm test`＋furniture/ortho/entrance/drag/footprint/direction＋`check:deploy`＋`check:dev`(real-Chrome smoke) GREEN | ✅ |
| E5 | 未自行 git init/commit/push/部署；無 `.git` 則誠實記錄 | ✅（見結果/報告） |
| E6 | iPhone Safari 實機 Gate | 🟡 保留產品負責人 |

## 證據
`docs/evidence/v0577c/`：
- `metrics.json`（每案 resolved x/y/r、visual==anchor、round-trip、edit-mode data-mode、44×44）
- 旋轉 r0–r3＋round-trip、非方形位移、邊界/衝突紅框、編輯模式底列替換、Art Debug、iso 回歸截圖
