# V0.57.5-alpha 正交房間外殼滿版化與入口門比例修正 結果（ARCH-0575A）

- 版本：`V0.57.5-alpha｜正交房間外殼與門比例修正版`｜Build `0575b`（由 `0575a` 升版；package 維持 `0.57.5-alpha`）
- 存檔契約：key `catCafePhaserV0540`、schema `5401`、migration `5401` **皆不變**
- 決策依據：[DEC-023](./decisions.md#dec-023視覺房間外殼與邏輯-grid-分離門比例修正accepted)
- 證據：`docs/evidence/v0575b/`（18 張 real-browser 截圖 + `metrics.json`）
- **本任務是房間外殼滿版與門比例修正，不重構 Camera、不重畫家具。**

## 1. V0575 實機驗收結論

| 項目 | 判定 |
|---|---|
| Zoom/Pan（放大後四向平移） | **通過** → 本次凍結核心行為 |
| Orthogonal 方向 / 右上入口位置 | 通過，維持 |
| 房間外殼滿版感 | **未通過**（四周仍大量房外背景、像置中卡片） |
| 視覺門比例 | **未通過**（近兩格寬大型深色矩形，像倉庫入口/牆洞） |

## 2. 留白根因分析（依 §六稽核）

1. **左右留白**：首屏 width-constrained，房間本體填滿寬度（外圈裁切），左右幾乎無 Camera margin；殘留主要是**房間視覺外殼只畫到邏輯 Grid 矩形**，Grid 左右邊界外即背景。
2. **上下留白**：核心 framing 置中後，牆頂之上、地板之下（`bottomPad` 外）為背景；同樣因**外殼只畫到 Grid**，Grid 上/下邊界外即背景。
3. **哪些來自 Camera framing**：極少（V0575 已把 margin 壓到 ~18px）；且 Camera 核心已凍結。
4. **哪些來自外殼只畫到 Grid 邊界**：**主因**——牆面/地板未延伸超出 Grid，故 Grid 矩形外露出背景，形成「房間卡片放在大底色」。
5. **哪些來自 CSS/DOM**：Canvas 為 `#gameViewport`（HUD 與底部列之間），本身無額外邊距；非 CSS 造成。
6. **最終解法**：**擴大視覺房間外殼**（牆＋地板畫到超出 Grid 到 safe viewport 邊緣）＋**取消粗矩形卡片外框**（改細收邊）。Camera framing 幾乎不動、不增加 placeable cells。

## 3. A. 視覺房間外殼滿版化（不增加 placeable cells）

- `ORTHOGONAL_ROOM_RENDER.shell = {side:84, top:120, bottom:132, floorFill}`：`drawRoomOrtho` 把**地板外殼**（中性淺色）與**牆面外殼**（牆色）畫到 Grid 之外 `side/top/bottom` world px，使房間材質延伸到 safe viewport 邊緣。
- **純視覺、不改 logical 10×8 Grid、不新增 placeable cells、不改 placeableMask/Occupancy/存檔**。以**細牆腳線＋細收邊**（`playAreaLineWidth`，取代舊粗 `floorOutlineWidth` 卡片外框）區分可玩區。
- 遠處 `backdropFill` 僅在完全 zoom-out 越過外殼時才可見。

### 手機首屏外圈房外背景（external margin，CSS px；shell 外緣到螢幕邊）

| 視窗 | zoom | top | bottom | left | right |
|---|---|---|---|---|---|
| 390×844 | 0.531 | **0** | **0** | **0** | **0** |
| 393×852 | 0.536 | **0** | **0** | **0** | **0** |
| 430×932 | 0.588 | **0** | **0** | **0** | **0** |
| 1440×900（桌面） | 0.566 | 0 | 0 | 423 | 423（手機優先，桌面左右邊距） |

手機首屏外圈背景由 V0575 的 ~18-26px 降至 **~0px**（外殼填滿）。仍可 zoom-out 看整房、zoom-in pan 查看外圍細節。

## 4. B. 視覺門比例修正 + 門的視覺

- **邏輯入口不變**：`logicalEntranceZone {x:7,y:0,w:2,h:1}`（兩格 x7-8）、`customerEntryPoint (8,0)`、`customerEntryStaging (8,1)`、x9 牆面、舊 logical 存檔入口 `(8,7)/(9,7)`。
- **視覺門縮小**：`visualDoorBounds {x:6.8, y:0, w:1.4, h:1}`（grid-coord 空間），置於 x7-8 中央（中心 gridX 7.5）；實測門寬 **123 world px（1.4 cellWidth）**、高 **124 world px**；門右緣 gridX 8.2 ≤ 8.5，x9 仍為牆。**visualDoorBounds ≠ 兩格 logical entrance。**
- **門的視覺**（程式繪製 Prototype，非黑洞/倉庫門）：`door = {frame, leaf, glass, glassEdge, handle, panel, matFill}` — 深木門框、暖木門扇（leaf 淺於 frame）、上半玻璃格窗（glass 淺於 leaf ＋ muntins 十字）、黃銅門把、下半木質嵌板。層次清楚、與暖色系一致。before/after 見 `door-v0575a-before.png`（舊兩格深色塊）／`door-v0575b-after.png`（新木門）。

## 5. Zoom/Pan 回歸（核心未改）

CameraController 核心（`viewCentre`/pan/clamp）**未修改**（其非受保護、且僅 `?v=` import 隨版本升，邏輯不動）。real-browser 真實指標拖曳仍：zoom-in 後 X/Y 皆可 pan、四邊 clamp、minZoom 整房、pinch/resize 正常。門近景 zoom 1.95 時 pan range X 1326／Y 1730 px。

## 6. 修改檔案

- `config/ortho-room-zones.js`：新增 `logicalEntranceZone`、縮小 `visualDoorBounds`。
- `systems/OrthogonalProjection.js`：`ORTHOGONAL_ROOM_RENDER` 新增 `shell`/`playAreaLineWidth`、`doorHeight 168→124`、door 顏色改為分層。
- `scenes/CafeScene.js`：`drawRoomOrtho` 畫視覺外殼（floor+wall 延伸）、細收邊取代卡片外框、較小分層門。
- 測試：`ortho-room-zones`（門幾何）、`ortho-projection`（shell＋door 層次）、`browser-smoke`（shell margin≈0、door 非暗、pan 回歸）、`build-consistency`（版本）。
- Build 升版 0575a→0575b（package 維持 0.57.5-alpha）＋`check.js`（Build/APP_VERSION/obsolete `?v=0575a`/protected hash：OrthogonalProjection/ortho-room-zones/GridSystem/flat-presets/viewport-metrics）。
- **未改**：CameraController 核心（非受保護、邏輯不動）、camera-framing（hash 不變）、投影軸向/cell 尺寸、placeableMask/Grid/Occupancy/Placement/Pathfinding、存檔 key/schema/migration/logical 入口、iso/flat 分支、`ortho-demo-layout`/`scene-viewport`/`room-config`/`furniture-config` hash。

## 7. 驗證

- `node check.js --deploy`：通過（Build `0575b`、55 modules）。
- `node check.js --dev`：通過（**本機真實 Chrome** browser smoke：shell external margin≈0、door 中央非暗塊、zoom-in 真實拖曳 pan X/Y、x0/x9 非暗帶、demo 不寫存檔、invalid 回退）。
- 個別：`ortho-room-zones`（門幾何）、`ortho-projection`（shell/door 層次/palette）、`camera-framing`（pan range>0，未改）、`ortho-demo-layout`(23)、`grid-projection-compat`（iso/Flat golden 未改）皆通過。
- 18 張 real-browser 證據＋`metrics.json`（含 visualShellBounds/visualDoorBounds/logicalEntranceZone/externalMargin/pan range）＋before/after 零 page error。

## 8. 誠實判斷（是否達成產品目標）

- **達成**：手機首屏外圈房外背景 ~18px→~0px（外殼延伸填滿，不再像卡片）；視覺門由兩格深色塊縮為 1.4 格有門框/玻璃/門把的木門；Zoom/Pan 核心凍結且回歸通過；logical 入口/存檔/x9 牆不變。
- **誠實限制**：桌面左右仍有邊距（手機優先，非本次目標）；門仍為 Prototype 程式繪製（正式素材待 `ART-0576`）；家具仍等角 Placeholder。
- **結論**：本版**應可通過**房間外殼與門比例目標；最終以 iPhone 實機驗收為準（見驗收清單）。

## 9. 已知限制／未完成

- 家具仍等角 Placeholder；門為 Prototype（待 `ART-0576`）。
- 桌面左右邊距（手機優先）。
- 三層服務/分區僅空間視覺，無行為（待 `ARCH-0576-STATION-REGISTRY`）。
- **手機實機驗收 pending**（見 [驗收清單](./V0575B_ORTHOGONAL_ROOM_SHELL_ACCEPTANCE.md)）；未 commit/push/部署；本環境無 `.git`。
- iso 仍為預設與 rollback。
