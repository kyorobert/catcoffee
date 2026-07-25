# V0.57.2-alpha｜正交手機直立滿版化、房間比例與咖啡廳分區重構 結果

- 任務：`ARCH-0572-ORTHOGONAL-PORTRAIT-DENSITY-AND-ROOM-ZONING`
- 日期：2026-07-25
- 基線：`V0.57.1-alpha｜正交手機構圖調整版` / Build `0571a`
- 本版：`V0.57.2-alpha｜正交直立空間調整版` / Build `0572a`
- 存檔 key：`catCafePhaserV0540`（不變）；`sceneSchemaVersion` 5401、`migrationCompletedVersion` 5401（不變）
- 決策：[DEC-019](./decisions.md#dec-019正交手機直立滿版化與咖啡廳分區accepted)（Accepted）
- 人工驗收：[V0572 驗收](./V0572_ORTHOGONAL_PORTRAIT_ACCEPTANCE.md)｜並排比較：[V0572 比較 HTML](./V0572_ORTHOGONAL_PORTRAIT_COMPARISON.html)
- 截圖證據：[`docs/evidence/v0572/`](./evidence/v0572/)

> 產品負責人 iPhone 再驗收：Orthogonal 方向保留，但 V0.57.1「房間內容太小、上下留白太多、缺乏滿版感、Demo 仍像展示」。本版**手機直立滿版化 + 咖啡廳空間分區**：調整正交房間比例、加整面背牆、右上角顧客入口門、上方連續櫃檯/服務帶、Demo 重排。**本次不重畫家具、不做營運系統。** iso 仍預設。

## 1. 基線與新版本
- 基線 `V0.57.1-alpha`/`0571a` → 本版 `V0.57.2-alpha｜正交直立空間調整版`/`0572a`。Phaser 3.90.0 本地 vendor、Canvas。Git：**無 `.git`**（未 init/commit/push/部署）。

## 2. 修改檔案
- **改**：`OrthogonalProjection.js`（cellWidth/cellHeight/origin + `ORTHOGONAL_ROOM_RENDER` 背牆/門/入口角）、`CafeScene.js`（`drawRoomOrtho` 背牆+右上角門+入口地墊、`buildOrthoFraming` content bounds 含背牆）、`ortho-demo-layout.js`（17 件、右上角入口、`ORTHO_DEMO_ENTRANCE`）。
- **改（測試）**：`ortho-projection.test.js`（新 dims pins）、`ortho-demo-layout.test.js`（新布局/入口/可達）、`camera-framing.test.js`（新 content bounds）、`browser-smoke.test.js`（沿用 ortho 首屏斷言）。
- **機械升版** 0571a→0572a（含 `check.js` 版本/Build/obsolete `?v=0571a`/protected hash 更新 OrthogonalProjection/GridSystem/flat-presets/viewport-metrics）、build-info/index.html/manifest/package*、README、docs。
- **未改**：Camera framing 純模組邏輯（`scene-viewport.js`/`camera-framing.js` 內容未變）、`projection-mode`/`FlatProjection`/`IsoProjection`/`SpatialGrid`/`room-config`/`furniture-config` hash 未變、SaveAdapter runtime、家具素材、CatBehavior/Customer 流程。

## 3. 手機滿版改善方式
- **正交房間比例**：`OrthogonalProjection` cellWidth `104→88`、cellHeight `88→120`（origin `{312,252}→{384,140}`、det `9152→10560`）。fit-to-width 於直立仍 width-constrained，故更高的 cell 直接增加房間**螢幕高度**而不縮小房間。
- **整面背牆**：`ORTHOGONAL_ROOM_RENDER.wallHeight=200`，背牆立於地板上方並**納入 framing content bounds**，使房間（背牆+地板）填滿手機直立。
- 結果：手機直立房間占 canvas 高度由 V0.57.1 的 **~44%** 提升至 **~78%**；上下留白顯著減少。furniture 因 fit zoom 提高（0.356→0.42）而在螢幕上更大。

## 4. room / content / Camera / Projection 是否修改
- **Projection**：修改（cellWidth/cellHeight/origin；仍 `axisX.y=0`、`axisY.x=0`，完全水平/垂直、無 skew/shear/rotation、cell 在世界 bounds 內）。
- **room render（drawRoomOrtho）**：修改（整面背牆、右上角門、入口地墊、移除底部 logical 入口高亮）。
- **content bounds（buildOrthoFraming）**：修改（含背牆：`y = floorTop - wallHeight`）。
- **Camera framing 邏輯**：**不變**（fit-to-content + centerOn + `clampCenterToContent`；`ORTHO_FRAMING` 常數未變）。CameraController iso/flat 分支不變。

## 5. 入口角落選擇與理由
- **右上角（`(9,0)`）**。理由：上方服務/櫃檯連續帶置於左至中（x1–6），入口置於**相對的右上角**，避免顧客動線穿過櫃檯後方（員工側）；右側欄（x9）與前方 y1 走道形成「門→櫃檯前→座位」的清楚路線。
- 僅修改 **Demo/Orthogonal prototype** 的入口視覺（drawRoomOrtho 門+地墊）與路線（demo 布局+BFS）；**logical 存檔入口 `(8,7)/(9,7)` 與存檔契約不變**（仍為 reserved，簡化顧客 placeholder 仍用之，待未來 CustomerFlowSystem）。

## 6. 櫃檯／員工工作區配置
- 上方 `y0` 連續服務帶：`coffeeMachine(1,0)`、`oven(2,0)`、`counter(3-4,0)`、`dessert(5,0)`、`smartOrder(6,0)`（收銀/點餐、咖啡/飲品、烘焙、甜點展示）。員工/工作側在 `y0`（背牆前），顧客側在 `y1`（點餐/排隊走道，保留淨空）。門在右上角、不被服務帶阻塞。

## 7. Demo Layout 分區與家具數
- **17 件**（display-only、不寫存檔）。上方服務帶（5）；左桌組 woodTable+chair+cushionChair+rug（4）；右桌組 roundTable+chair+redChair+rug（4）；右側 monsterPlant（1）；前左貓咪區 doubleCatTree+catBed+scratchPost（3）。BFS：入口 `(9,0)` 可達櫃檯前（`1,1`–`6,1`）、座位（`3,4`/`4,4`/`5,4`/`4,5`）與貓咪區（reach 59 格、非一格迷宮）。入口與 logical `(8,7)/(9,7)` 淨空。

## 8. 390 / 393 / 430 首屏結果
初始（無縮放/拖曳）：zoom＝fit＝minZoom，midpoint 為房間中心，toolbar 隱藏、無選取；房間 **100% 寬可見**、上中下分區（門/服務→座位→貓咪）皆可見、房間占 canvas 高度 ~78%、無黑邊。
| viewport | zoom | 房間可見寬 |
|---|---|---|
| 390×844 | ~0.42 | 100% |
| 393×852 | ~0.42 | 100% |
| 430×932 | 0.466 | 100% |
桌面 1440×900：房間（現為直立比例）置中、不佔滿寬度、外部無大量背景。

## 9. Camera 四邊與縮放結果
- minZoom＝fit（整間可讀）；zoom-in 可平移；pan 到左/右/上/下極限時房間邊界貼齊、**外部無大片空白**（見 `*-pan-*-limit.png`，上邊界顯示背牆頂與服務帶）；pinch/resize 後重新 clamp。房間外以房間基色填滿、無黑邊。

## 10. 測試結果
`npm test`✓｜`ortho-projection`（新 dims）✓｜`ortho-demo-layout`（17 件/入口/可達）✓｜`camera-framing`✓｜`projection-mode`/`flat-*`/`grid-projection-compat`（iso/Flat C golden 未改）✓｜`build-consistency`✓｜`check:deploy`✓（54 modules、0572a）｜`check:dev`✓（真實 Chrome browser smoke，含 ortho 首屏 fit=minZoom/整寬/無初始選取/情境列/invalid 回退）｜14 張 real-browser 證據零 page error。

## 11. 存檔相容
CURRENT_KEY `catCafePhaserV0540`／schema 5401／migration 5401 不變；furniture ID/`x/y/r`/footprint/Occupancy/Placement/Pathfinding 未改；**Projection/Camera/demoLayout 皆不入存檔**。protected hash：OrthogonalProjection/GridSystem/flat-presets/viewport-metrics 更新（dims 或 query），iso/flat/spatial/room/furniture hash 未變、未弱化。

## 12. 文件與截圖證據
新增 `V0572_ORTHOGONAL_PORTRAIT_RESULT.md`/`_ACCEPTANCE.md`/`_COMPARISON.html`、`docs/evidence/v0572/`（15 張：手機首屏 390/393/430、pan 四邊界+minzoom+zoomin、art-debug、桌面、before/after）；更新 decisions(DEC-019)/current-state/roadmap/devlog/handoff/README。

## 13. 部署資料夾與 ZIP
`dist/cat_cafe_v0572a_git_deploy/` + `cat_cafe_v0572a_git_deploy.zip`（見 §部署驗證於 devlog）。

## 14. 已知問題
- 手機直立仍有少量上下房間基色邊距（wide 房型於 tall 螢幕固有；已由加高 cell + 背牆大幅減少，非黑）。
- 家具仍 iso Placeholder（透視待 `ART-0573` 重作，本版不校準）；部分立體家具（櫃台/awning）在正交地板略突兀。
- 桌面因房間改直立比例，左右留有房間基色邊距（手機優先取捨；置中、無黑）。
- Mobile Safari/Android 實機再驗收 pending（證據為桌面 Chrome headless）。

## 15. 是否建議進入 `ART-0573-CORE-ORTHOGONAL-FURNITURE`
待**產品負責人實機驗收本版手機滿版化與分區通過後**再啟動；本版**不得**自行開始家具重畫。
