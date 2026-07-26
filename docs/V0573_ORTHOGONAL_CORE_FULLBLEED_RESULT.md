# V0.57.3-alpha 正交核心營業區滿版與分區 結果（ARCH-0573）

- 版本：`V0.57.3-alpha｜正交滿版營業區原型版`｜Build `0573a`（由 `0572a` 升版）
- 存檔契約：key `catCafePhaserV0540`、schema `5401`、migration `5401` **皆不變**
- 決策依據：[DEC-020](./decisions.md#dec-020正交核心營業區滿版與分區metadataaccepted)（延續 DEC-017～DEC-019）
- 證據：`docs/evidence/v0573/`（15 張 real-browser 截圖 + before/after）

## 1. 目標（一句話）

把手機首屏取景由「整個房間 contain（仍留上下白）」改為「**核心營業區滿版**」，並把咖啡廳空間分區從臨時 Demo 資料升級為**正式 Zone metadata**；不重畫家具、不做營運/角色系統、不改存檔。

## 2. 問題與根因

`V0.57.2` 已把房間比例調高（cellWidth 104→88、cellHeight 88→120）並加整面背牆，房間占 canvas ~78%，但實機仍「滿版感不足、上下留白」。根因：首屏 framing 仍以**整個房間**（含外圈 x0/x9 邊距與整面高牆）做 contain fit；在手機直立寬受限下，高度方向必然留白。降低內容「高度」無法在寬受限 fit 下提高占比——必須**縮小取景寬度**（較窄的核心區）才能滿版。

## 3. 解法：roomBounds 與 coreGameplayBounds 分離

| 矩形 | 內容 | 用途 |
|---|---|---|
| **roomBounds** | 地板 + 整面背牆(wallHeight 200) + 外圈 x0/x9 邊距 | Camera **pan / zoom-out** 範圍；縮到底可見整房、無空背景 |
| **coreGameplayBounds** | 遊戲欄 x1–8 + 短牆條(coreTopStrip 140，含門) | **首屏滿版取景目標**（contain 此較小矩形 → 縱向填滿） |

- 首屏 zoom = fit(coreGameplayBounds)；初始置中於 core，clamp 於 room。
- minZoom = fit(roomBounds)（＜ core fit），可縮到看見整房。
- 外圈 x0/x9 於首屏裁切，可由 pan 補看；所有 gameplay 都在 x1–8，關鍵分區 0 裁切。

### 實測（safe gameplay viewport = canvas 高度 − 78px 情境列保留）

| 視窗 | 首屏 zoom | minZoom(整房) | 核心縱向占 safe | 左右每側裁切 |
|---|---|---|---|---|
| 390×844 | 0.526 | 0.420 | **96%** | ~8% |
| 393×852 | 0.530 | 0.424 | **95%** | ~8% |
| 430×932 | 0.582 | 0.466 | **93%** | ~8% |
| 1440×812（桌面） | 0.491 | 0.466 | 97% | 0% |

皆達 ≥ 90% 目標；裁切每側 ≤ 10%（皆為外圈欄）。zoom-out 至整房占比降至 ~76%（0 裁切、整房可見）。

## 4. 兩格顧客入口門（x7–8）

- `visualDoorBounds = {x:7, y:0, w:2, h:1}`：上牆右側**兩格**視覺門；**x9 保持牆面**（門不貼房邊）。
- 門畫在**下牆**（`doorHeight=130 < wallHeight=200`），落在 `coreTopStrip` 內，首屏完整可見門；門上方高牆於首屏裁切。
- 單一 logical 進入點 `customerEntryPoint=(8,0)`、staging `customerEntryStaging=(8,1)`。
- **logical 存檔入口 room-config `(8,7)/(9,7)` 不變。**

## 5. 正式 Zone metadata（`assets/js/config/ortho-room-zones.js`）

純格座標矩形（無 world pixel、無 Phaser/DOM、無 actor 身份、可 Node 測試；**非 StationRegistry、非 CustomerFlowSystem**）：

| Zone | 矩形(格) | 說明 |
|---|---|---|
| `visualDoorBounds` | x7 y0 2×1 | 兩格視覺門 |
| `customerEntranceZone` | x7 y0 2×2 | 入口區 |
| `customerEntryPoint` / `customerEntryStaging` | (8,0)/(8,1) | 進入點 / 站位 |
| `staffWorkZone` | x1 y0 6×2 | B 員工工作區（櫃檯後連續可走） |
| `serviceCounterLine` | x1 y2 6×1 | 櫃檯帶（分隔工作側/服務側） |
| `customerServiceZone` | x1 y3 7×1 | C 顧客服務區（點餐/收銀/取餐/排隊） |
| `seatingZone` | x1 y4 8×2 | 主座位 |
| `catZone` | x1 y6 4×2 | 前左貓咪區 |
| `mainAisle` | x7 y1 2×6 | 主走道（門→服務 2 格縱向脊） |
| `coreGameplayBounds` | x1 y0 8×8 | 首屏取景目標 |

三層服務空間：A 背牆設備帶(y0)＋B 員工工作區(y0–1) 在**後**、C 顧客服務區(y3) 在**前**，中隔櫃檯(y2)。**本次僅空間 prototype 與 metadata，無任何行為邏輯。**

## 6. Demo 依分區重排（18 件，display-only）

`門(x7–8)→主走道(x7–8)→設備(y0)/櫃檯(y2)→服務區(y3)→座位(y4–5)→貓咪(y6–7)`。

- 設備：coffeeMachine/oven/dessert/smartOrder（staffWorkZone）。
- 櫃檯：counter(2,2)、console(4,2)（serviceCounterLine）。
- 座位：左組(woodTable+椅+creamPlaidRug)、右組(roundTable+椅+rugPink)。
- 貓咪：doubleCatTree/catBed/scratchPost（catZone）。
- 前左 lobby 植栽(monsterPlant 1,3)。

驗證（Node）：18 件全部合法無重疊；入口→服務/座位/貓咪皆可達；**主走道 12/12 格全通（2 格寬）**；顧客動線**不穿越員工工作區**仍可達服務/座位/貓咪；員工工作區內部連續（8 格連通）。仍不入存檔、不改 `state.items`/coins/inventory。

## 7. 修改檔案

- **改**：`OrthogonalProjection.js`（`ORTHOGONAL_ROOM_RENDER`：`doorHeight`/`coreTopStrip`/`door`，移除舊 `entrance`）、`core/camera-framing.js`（`computeInitialFraming` 收 core+room，保留單一 content 舊路徑）、`systems/CameraController.js`（`getCoreBounds`/`getRoomBounds`）、`scenes/CafeScene.js`（`buildOrthoFraming` core/room bounds、`drawRoomOrtho` 兩格門+入口地墊由 zones）、`config/ortho-demo-layout.js`（依 zones 重排 18 件）。
- **新增**：`config/ortho-room-zones.js`、`tests/ortho-room-zones.test.js`。
- **測試更新**：`ortho-demo-layout`（分區/BFS/工作區-顧客分離）、`camera-framing`（core 滿版/room 裁切/minZoom）、`ortho-projection`（door/doorHeight/coreTopStrip）、`browser-smoke`（core 滿版而非整房 fit）。
- **版本**：0572a→0573a 全域 `?v=` 與 build 字串；`check.js` 版本/Build/obsolete `?v=0572a`/protected hash（OrthogonalProjection/camera-framing/GridSystem/flat-presets/viewport-metrics 更新＋ortho-room-zones 新增）/required＋test/`.gitattributes` 納入 root 與 ZIP root。
- **未改**：投影軸向（水平/垂直、無 skew/shear/rotation）、cell 尺寸、家具美術、存檔 key/schema、iso/flat 分支、`SpatialGrid`/`room-config`/`furniture-config`/`projection-mode`/`scene-viewport` hash。

## 8. 驗證

- `node check.js --deploy`：通過（Build `0573a`、35 DOM IDs、13 nested selectors、**55** JavaScript modules）。
- `node check.js --dev`：通過（含**本機真實 Chrome** browser smoke：ortho 首屏核心滿版可見、外圈裁切、可 zoom-out 至整房、無初始選取/情境列、demo boot、invalid 回退 iso）。
- 個別：`ortho-room-zones`、`ortho-demo-layout`（18 件）、`camera-framing`（96/95/93% core fill、8% crop、minZoom=room fit）、`ortho-projection`、`build-consistency`、`grid-projection-compat`（iso/Flat golden 未改）皆通過。
- 15 張 real-browser 證據 + before/after 零 page error。

## 9. 已知限制／未完成

- 家具仍為等角 Placeholder（正交透視待 `ART-0574`，本次未動）。
- 桌面因房間為手機直立比例、左右仍有邊距（手機優先）。
- 三層服務僅空間 metadata，**無收銀/製作/送餐/排隊行為**（待未來 `ARCH-0574-STATION-REGISTRY`，本次不做）。
- **手機實機再驗收 pending**（見 [驗收清單](./V0573_ORTHOGONAL_CORE_FULLBLEED_ACCEPTANCE.md)）；未 commit/push/部署；本環境無 `.git`。
- iso 仍為預設與 rollback；Orthogonal 仍 URL opt-in。
