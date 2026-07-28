# V0.57.7-alpha 專案現況

## Build 0577d（FIX-0577D）— 現行

- **家具旋轉 UX 採固定 edit-session envelope**：唯一純資料 resolver 同時計算
  resolved x/y/r、policy、footprint cells/polygon、visual anchor、movement delta 與
  tie-break；Entity、Ghost、Preview、Placement、commit、Occupancy、Art Debug 與
  Browser evidence 全部消費同一候選。
- **最小位移且可逆**：非方形 footprint 以固定包絡中心挑選最近整數格；同距用
  `clockwise-envelope-edge-order`。不得依合法性搜尋更遠格，故 Rotate 不會偷偷
  變成搬動。多週期精確歸位、零累積漂移。
- **集中旋轉政策**：`fixed / axis2 / cardinal4`。第一批中
  `pinkTableLong=axis2`、`roundTable/scratchPost=fixed`，其餘九件為
  `cardinal4`；方位固定 `r0 South / r1 West / r2 North / r3 East`、順時針。
- **無效旋轉安全**：衝突、越界或入口保留只顯示紅色 Ghost／footprint；正式
  `x/y/r`、Occupancy、save、coins 均不變，不自動找替代格。Cancel 精確回復進入
  編輯時的原始狀態。
- 0577c 的底列就地編輯工具列與精簡 Art Debug 保留；fixed 家具 Rotate disabled。
- 第一批 12 件、48 張 Orthogonal PNG 未重畫；其餘 35 件仍使用 base visual。
  iso 仍預設／rollback，ortho 仍 URL opt-in。
- 不變：家具 ID／price／footprint／入口 `(7,0)(8,0)`／10×8 Grid／78 cells／
  save key `catCafePhaserV0540`／schema 5401／migration 5402／CameraController／
  iso・flat。
- package 維持 `0.57.7-alpha`；正式 module query 為 `?v=0577d`。
- 自動化含真實 Rotate／Cancel／Store 點擊、390／393／430 touch pointer 與
  conflict／boundary／entrance／projection 回歸；證據在 `docs/evidence/v0577d/`。
- **iPhone Safari 實機仍 pending；第二批 35 件未核准、未開始。**
- 詳見 [強制交接稽核](./V0577D_FORCED_HANDOFF_AUDIT.md)、
  [結果](./V0577D_ROTATION_UX_RESULT.md)、
  [驗收](./V0577D_ROTATION_UX_ACCEPTANCE.md)。

## Build 0577c（ARCH-0577C）— 歷史方案，已由 DEC-029／0577d 取代

- 0577c 建立單一 resolver、cardinal 方位、底列就地編輯工具列與精簡 Art Debug。
- 當時採 corner-pivot；雖修正 Sprite／Ghost／footprint 不同源，非方形家具的
  Rotate 仍有可見位移，因此該 UX 已被 0577d 固定包絡取代。
- 歷史證據保留於 `docs/evidence/v0577c/` 與 V0577C 稽核／結果／驗收文件。

## Build 0577b（ART-0577B）

- Orthogonal 第一批 12 件核心家具已改用原創、透明、四方向 PNG。
- `ART-0577B` 已完成第一批旋轉校準：Entity、拖曳 Ghost 與放置預覽共用
  `getFurnitureVisualPosition()`；非正方形 footprint 旋轉時保留同一視覺 pivot，
  gameplay footprint／Occupancy／Placement 仍照原方向旋轉。
- 木椅已補成真正四個正交 3/4 方向，左右可辨識椅背厚度、椅面深度與前後腳。
- Override 僅屬視覺選擇：ortho 使用 `furniture:ortho:*`，iso／flat 保持既有 texture。
- 其餘 35 件家具尚未正交重作，仍使用既有 base visual；不得將第一批描述為全 47 件完成。
- 商店縮圖、FurnitureEntity、Ghost 與旋轉方向共用同一 visual selector。
- 家具 ID、footprint、`x/y/r`、價格、layer、station/socket、walkBlocking、
  Occupancy、Placement、Grid 10×8、78 playable cells 與入口 `(7,0)/(8,0)` 未變。
- 存檔 key `catCafePhaserV0540`、scene schema 5401、migration 5402 未變。
- Chrome／Edge browser smoke、所有投影 URL、HTTP 48 張新 PNG 與回歸測試通過；
  iPhone Safari 真機尚未測試。

### 沿用的 V0576 架構基礎（歷史階段，現行仍有效）

- 正交模式仍為 opt-in；iso 仍是預設／rollback。
- 家具 context toolbar 已有 44×44 CSS px 以上觸控區；Cancel 會完整清除 selection／InputMode／Camera lock。
- `ortho-room-skin.js` 左右／下框架改為手機初始視角約 12.8–15.3 px 的窄建築帶，上牆保留。
- 10×8 logical grid 仍為 78 格 playable；正式入口改由 `logicalEntranceZone` 產生 `(7,0)/(8,0)` mask，舊 `(8,7)/(9,7)` 已釋放。
- `migrationCompletedVersion=5402`；入口衝突家具一次性 archive＋inventory，Demo 唯讀不遷移、不寫 save。
- `CURRENT_KEY=catCafePhaserV0540`、`sceneSchemaVersion=5401`、CameraController／Grid 幾何／家具 ID 與 footprint 均未改。
- 門的 visual geometry/style 由 Skin 管理；logical entrance metadata 仍由 `ortho-room-zones.js` 管理。
- `FurnitureDragController.evaluateCandidate()` 統一 preview/commit evaluation；candidate 變動以 signature 失效。
- CameraController、Grid/Occupancy/Placement、save key/schema、furniture data contract 未改。
- Chrome 390/393/430 與桌面 smoke 通過；iPhone Safari 真機仍 pending。
- 歷史結果與證據：[V0576 結果](./V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_RESULT.md)、[驗收](./V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_ACCEPTANCE.md)、`docs/evidence/v0576/`。

本文件描述 repository 目前可直接查證的狀態，不代表未來產品承諾。決策以 [decisions.md](./decisions.md) 為準。

## A. 版本與部署

| 項目 | 現況 |
|---|---|
| 版本 | `V0.57.7-alpha｜家具旋轉體驗重構版` |
| Build ID | `0577d` |
| package version | `0.57.7-alpha` |
| 引擎 | Phaser `3.90.0`，Canvas renderer |
| 引擎來源 | `assets/vendor/phaser-3.90.0.min.js` |
| 部署 | GitHub Pages 純靜態相對路徑，不依賴 CDN |
| 模組載入 | ES Modules，必須由 HTTP server／HTTPS 載入，不使用 `file://` |
| 存檔 key | `catCafePhaserV0540`（schema 5401、migration 5402，未變） |
| Legacy save | 只讀 legacy key，原始資料備份至 `catCafeLegacySaveBackupV0532` |

### A2. 場景投影：正交平面（V0.57.0 → V0.57.3）

- `GridSystem` 為 `SpatialGrid`（投影無關邏輯）＋ `SceneProjection` 的相容 Facade；投影模組有 `IsoProjection`（2:1 等角，**預設／rollback**）、`FlatProjection`（淺斜／淺俯視，**已被產品拒絕，僅保留回歸**）與 **`OrthogonalProjection`（正交平面）**。
- **`OrthogonalProjection`**：真正軸對齊 `axisX={88,0}`、`axisY={0,120}`（`axisX.y=0`、`axisY.x=0`，無 skew／shear／rotation／perspective），cell 為矩形、origin 由房間 centroid 推導置中；集中於 `ORTHOGONAL_PROJECTION_PARAMS`（`assets/js/systems/OrthogonalProjection.js`）。
- **URL**：`/`／`?projection=iso`→iso（**預設**）；`?projection=ortho`（別名 `orthogonal`）→正交；`?projection=ortho&demoLayout=1`→正交 + 非存檔 Demo 構圖；可疊 `&artDebug=1`；`?projection=flat`（含 `flatPreset=near-iso/balanced/current`）保留作歷史回歸；非法值回退 iso。
- **Zone metadata（V0.57.3 新增，V0.57.4 收斂為乾淨分割）**：`assets/js/config/ortho-room-zones.js` 以純格座標矩形描述入口門／入口點／員工工作區／櫃檯帶／顧客服務區／座位／貓咪／主走道／核心取景區；功能帶收斂為 x1-6（與 x7-8 走道不重疊），並提供 `zoneAt(x,y)`／`ORTHO_ZONE_KEYS`（每格單一 zone，供分區底色）。**純資料、可投影、無 world pixel、無 Phaser/DOM、無 actor 身份（zone key 為身份中性的 `work`/`counter`/`service`/`seating`/`cat`/`aisle`/`outer`）、可 Node 測試；非 StationRegistry、非 CustomerFlowSystem、無行為邏輯。**
- **分區地板底色（V0.57.4 新增）**：`ORTHOGONAL_ROOM_RENDER.zoneFloor` 提供各 zone 暖色底色；`CafeScene.drawRoomOrtho` 依 `zoneAt` 為每格上分區底色（`shadeColor` 逐格二階明暗），使營業區一眼可辨。純視覺、無行為。
- **Demo Layout**：`assets/js/config/ortho-demo-layout.js` 純資料 fixture（**23 件**現有家具，依 `ortho-room-zones` 分區、連續服務帶＋成組座位＋集中貓咪、地板占用 ~48%），僅 ortho 有效、display-only；**不寫入存檔、不改 `state.items`／inventory／coins、不觸發 save**。
- **預設仍為 iso**；Orthogonal 尚未成為正式預設，待手機實機再驗收。投影與 demoLayout **不寫入存檔**。家具 `x/y/r`、Occupancy、Placement、Pathfinding、存檔 key／schema 未因投影改變。
- **Flat A／B／C 已被產品負責人拒絕**（見 [DEC-016 Superseded](./decisions.md)、[DEC-017](./decisions.md)）。正交房間幾何維持 opt-in；家具視覺已由 `ART-0577` 完成第一批 12 件 projection-specific override，其餘 35 件仍使用 base visual。
- **手機取景演進**：
  - `ARCH-0571`（[DEC-018](./decisions.md)）：新增純模組 `core/scene-viewport.js`＋`core/camera-framing.js`＋DOM adapter `ui/viewport-metrics.js`；`CameraController` 對 ortho 改為「以內容 bounds＋safe viewport 計算 fit＋centerOn＋內容 clamp」。
  - `ARCH-0572`（[DEC-019](./decisions.md)）：正交房間比例 cellWidth 104→88／cellHeight 88→120＋整面背牆，房間占 canvas ~44%→~78%；右上角單格入口門、上方連續櫃檯帶；Demo 17 件。
  - `ARCH-0573`（[DEC-020](./decisions.md)）：首屏由「整房 contain」改為「**核心營業區滿版**」。分離 **roomBounds**（整房＝pan/zoom-out 範圍）與 **coreGameplayBounds**（首屏取景＝x1-8＋短牆條）；核心縱向占 safe viewport 96/95/93%、裁切 ~8%。入口改為 **x7-8 兩格視覺門**（x9 留牆；`customerEntryPoint=(8,0)`、staging `(8,1)`；logical 存檔入口 `(8,7)/(9,7)` 不變）。
  - `ARCH-0574`（[DEC-021](./decisions.md)）：**營業區聚焦與分區辨識**。分區地板底色（`zoneAt`＋`zoneFloor`）＋分區收斂 x1-6 乾淨分割＋Demo 加密 23 件（連續設備帶/櫃檯、兩組座位、集中貓咪角，占用 ~28%→~48%）。
  - **`ARCH-0575A`（[DEC-023](./decisions.md)，歷史階段，Build 0575b）**：**房間視覺外殼滿版化與入口門比例修正**。留白根因為房間外殼只畫到邏輯 Grid；改為把**牆＋地板視覺外殼畫到超出 Grid**（`ORTHOGONAL_ROOM_RENDER.shell`）延伸至 safe viewport 邊緣，手機首屏外圈背景 ~18px→**~0px**（純視覺、**不新增 placeable cells**、不改 Grid/存檔；細牆腳線取代粗卡片外框）。**視覺門與邏輯入口分離**：`logicalEntranceZone` 維持兩格 x7-8，新增較小 `visualDoorBounds`（~1.4 格、123×124 world px、置中 x7-8、x9 牆），門改為分層繪製（門框＋玻璃格窗＋黃銅門把＋木門扇，非深色黑洞）。**Zoom/Pan 核心凍結**（CameraController 未改），real-browser 拖曳 pan 回歸通過。`customerEntryPoint (8,0)`／staging／舊存檔入口 `(8,7)/(9,7)`／cell 88×120 皆不變。real-browser 證據 `docs/evidence/v0575b/`＋`metrics.json`；見 [V0575B 結果](./V0575B_ORTHOGONAL_ROOM_SHELL_RESULT.md)、[驗收](./V0575B_ORTHOGONAL_ROOM_SHELL_ACCEPTANCE.md)、[比較 HTML](./V0575B_ORTHOGONAL_ROOM_SHELL_COMPARISON.html)。手機實機再驗收 pending。
  - `ARCH-0575`（[DEC-022](./decisions.md)）：**滿版取景、Zoom/Pan 修正與分區視覺清理**。**P0 修好 zoom-in 後平移**（根因：clamp 讀到只在 preRender 更新的過期 `camera.midPoint`；改由即時 `scrollX+width/2` 推導中心 `viewCentre()`）；**清除左右深色直條**（`zoneFloor.outer` 由暗色改中性淺色、全 tint 低對比）；**顯著減少留白**（`marginCss 10→8`、`toolbarReserveCss 78→40`、背牆加高為有家具的背牆 wallHeight 155→260/coreTopStrip 138→220/doorHeight 118→168 ＋ wainscot 護牆板、背景近地板暖色），上下留白 V0574 ~44px → **18/19/26px（390/393/430）**。zoom-in 後 X/Y 皆可 pan（真實拖曳 scrollX 289→880）、四邊 clamp、minZoom 整房、門完整可見。**cell 88×120 不變、未重畫家具、未建第二套 CameraController；門在 x7-8＋88×120 使 portrait 天生 width-constrained，無法在不裁門下 100% 填滿（單件家具未放大）。** real-browser before/after 證據 `docs/evidence/v0575/`＋`metrics.json`；見 [V0575 結果](./V0575_ORTHOGONAL_FULLBLEED_PAN_RESULT.md)、[驗收](./V0575_ORTHOGONAL_FULLBLEED_PAN_ACCEPTANCE.md)、[比較 HTML](./V0575_ORTHOGONAL_FULLBLEED_PAN_COMPARISON.html)。手機實機再驗收 pending。

## B. 架構地圖

- `assets/js/config/`：Build、房間、家具視覺、家具規則、貓咪資料、**正交 Zone metadata 與 Demo 構圖**。
- `assets/js/core/`：不綁 Phaser 的 input、pathfinding、照顧、家具視覺選擇／驗證規則、**safe viewport 與 camera framing 純數學**。
- `assets/js/entities/`：Phaser 家具、貓咪、簡化顧客、牆飾、環境效果與反應泡泡。
- `assets/js/phaser/`：輸入模式、家具拖曳、貓咪行為、照顧互動、互動／美術 Debug controller。
- `assets/js/scenes/`：`BootScene` 與 `CafeScene`。
- `assets/js/systems/`：Grid、投影、Occupancy、Placement、Camera、Depth、Save、Startup、Toast 與營業前布局檢查。
- `assets/js/ui/`：Phaser 與 DOM 的 `UiBridge`、商店與照顧面板、**viewport-metrics DOM adapter**。
- `tests/`：純核心、互動、AI、拖曳、照顧、建置、HTTP、Browser Smoke、投影／分區／framing 與家具美術／相容性測試。

正式 `index.html` 僅建立 App shell、HUD、Phaser viewport、面板與底部操作；舊單檔程式保留在 `legacy/`，正式 Runtime 不載入。

## C. 核心模組責任

| 模組 | 單一責任 |
|---|---|
| `BootScene` | 預載家具／貓咪／環境 texture、回報進度、建立缺圖 fallback、啟動 `CafeScene` |
| `CafeScene` | 組裝 state、systems、entities、controllers 與場景生命週期；ortho 由 `buildOrthoFraming` 提供 core/room bounds、`drawRoomOrtho` 畫**延伸至邊緣的視覺外殼**（`shell`，超出 Grid 但不新增可放置格）、分區地板底色（`zoneAt`＋`zoneFloor`）與**較小分層入口門**（`visualDoorBounds`，與兩格 `logicalEntranceZone` 分離） |
| `GridSystem` | Grid ↔ world、cell 矩形、footprint cells／polygon、anchor、placeable mask（投影無關；ortho 為軸對齊矩形） |
| `OccupancySystem` | `floorDecoration`、`floorObject`、`wallObject`、`character`、`reserved` 分層占用與 walkability snapshot |
| `PlacementSystem` | 邊界、placeable、入口、牆面與重疊驗證；椅桌關係不作拖曳硬阻擋 |
| `CameraController` | Phaser Main Camera；iso/flat 走 cover zoom＋world bounds；**ortho 走 framing policy：`getCoreBounds` 首屏 fit、`getRoomBounds` 為 pan/zoom-out 範圍、minZoom＝整房 fit；clamp 由即時 `scrollX+width/2`（`viewCentre()`）推導中心（非過期 midPoint），房間>view 軸向允許平移、房間<view 軸向鎖中心**；pan／pinch／wheel／resize 後重 clamp |
| `camera-framing`（純） | `computeFitZoom`／`clampCenterToContent`／`computeInitialFraming`（收 core＋room，回傳 zoom／centre／minZoom） |
| `ortho-room-zones`（純） | 正交房間空間分區的純格座標矩形＋純 helper（無 world pixel／引擎／行為） |
| `DepthSystem` | 依接地 `worldY + layerBias` 統一排序 |
| `SaveAdapter` | 新／舊存檔載入、正規化、一次性遷移、inventory archive 與寫回現行 key |
| `FurnitureEntity` | texture／origin／hit area／世界位置／depth／選取顯示；Ortho Entity 與 Ghost 共用視覺 pivot 校準 |
| `CatEntity` | sprite、動畫、方向、移動顯示、depth、選取和值班徽章 |
| `StorePanel` | DOM 商店清單、購買入口與面板生命週期 |
| `CarePanel` | DOM 選貓、照顧方式、演出、結果與取消流程 |

## D. 功能狀態矩陣

| 功能 | 狀態 | 說明 |
|---|---|---|
| Phaser 啟動與錯誤遮罩 | 完成 | 有 timeout、error UI、fallback 與 Build consistency |
| Camera pan／pinch／wheel／resize | 完成 | 單一 Main Camera；ortho 首屏核心滿版、可 zoom-out 至整房；外部裝置仍需人工驗收 |
| 家具顯示、選取、拖曳、旋轉、收納、出售 | 完成 | 同一 resolver／Grid／Occupancy／Placement／Ghost 資料流；第一批 ortho 旋轉採固定 edit-session envelope |
| 家具商店與購買 | 完成 | 以 Runtime visual config 顯示 |
| 家具存檔相容 | 完成 | 固定 ID 與 `catCafePhaserV0540` |
| 核心 12 件 Orthogonal 家具素材 | 完成 | `ART-0577` 提供四方向 48 張 PNG；0577d 不重畫素材，只重構旋轉 UX |
| 其餘 35 件 Orthogonal 家具素材 | 未完成 | 仍沿用既有 base visual；第二批尚未核准 |
| 貓咪顯示、動畫、漫遊與家具避障 | 完成 | 五個 cat ID；BFS、delta movement、休息狀態 |
| 餵食／梳毛／玩耍照顧流程 | 完成 | 純規則 core + Phaser session + DOM 演出 |
| 正交房間空間分區（metadata） | 完成（僅空間） | `ortho-room-zones` 純資料；三層服務為空間方向，**無行為邏輯** |
| 日別、階段、營收與報告計數 | 部分實作 | 有簡化狀態推進與報告，不代表完整經營系統 |
| 顧客 | 部分實作 | `CustomerEntity` 有簡化生成、定點移動與營收演出；完整顧客 AI 未實作 |
| 店員／玩家店長 | 未實作 | 沒有正式角色、AI 或自訂資料模型 |
| 訂單、料理、送餐、結帳 | 未實作 | 目前數字演出不等於完整訂單流程；工作站邏輯未做 |
| 任務／故事 | 未實作或僅資料預留 | state 有簡化 task counter；沒有完整任務／故事系統 |
| 最終角色呈現 | 未完成 | 貓咪已有正式方向；店長、店員與顧客最終美術待定；其餘 35 件家具尚未正交重作 |

## E. 家具與美術資料流

`furniture-config.js` 提供 gameplay 定義；`furniture-visual-config.js` 提供 `textureByDirection`、路徑、scale、anchor、station、socket、walkBlocking 與 art status。`BootScene` 依方向預載；`FurnitureEntity`、Ghost 與 `StorePanel` 使用同一視覺資料。

- 家具定義：47。
- V0.55.2 原 Prototype 重繪：25 件、100 張四方向透明 PNG。
- Runtime art status：42 `production`、5 `redraw`、0 `prototype`。
- `childrenPlayArea`：可用 `redraw`；陰影邊緣待精修。
- furniture ID、價格、footprint、rotation 與存檔座標未因重繪或投影改變。
- Anchor：直立物以腳底中心；平面裝飾以 footprint 中心。
- `ART-0577` 第一批 12 件在 ortho 使用 projection-specific visual override；商店縮圖、Entity、Ghost 與旋轉共用同一 selector。
- 0577d 以集中式 `fixed / axis2 / cardinal4` policy 與 edit-session envelope
  取代 0577b 固定 r0 visual pivot、0577c corner-pivot；不把方向 offset 散落到 Scene。
  方向 PNG、footprint cells／polygon、驗證與正式 commit 共用同一 resolver candidate。
- 其餘 35 件在 ortho、以及全部家具在 iso／flat，仍使用既有 base visual。

完整逐件紀錄見 [FURNITURE_AUDIT.md](./FURNITURE_AUDIT.md) 與 [PROTOTYPE_REDRAW_RESULT.md](./PROTOTYPE_REDRAW_RESULT.md)。

## F. 測試狀態

### 現行 Runtime（FIX-0577D，Build 0577d）實際驗證

- `npm run test:ortho-rotation`／`test:rotation-state`：通過（policy、17 種非方形
  footprint、最小位移、可逆回圈、無效狀態零副作用）。
- `npm run test:rotation-browser`：真實 Rotate／Cancel／Store、390／393／430
  pointer、invalid preview、resize 與投影回歸通過。
- `node check.js --deploy`／`--dev`：Build、Save key、schema、migration、78 cells、
  入口、48 張 PNG、Chrome／Edge Browser Smoke 均受 Gate 保護。
- 證據位於 `docs/evidence/v0577d/`；見 [0577d 結果](./V0577D_ROTATION_UX_RESULT.md)
  與 [0577d 驗收](./V0577D_ROTATION_UX_ACCEPTANCE.md)。

### Repository 內已有

- Node 純核心／互動／AI／拖曳／照顧測試。
- Build、DOM contract、HTTP 與部署檢查。
- 家具分類、透明度、方向、ID、footprint、商店與存檔相容性測試。
- `tests/browser-smoke.test.js` 自動化入口（本機需 Chrome／Edge）。

### 尚未驗證

- V0577B 第一批家具的 iPhone Safari 直式比例、輪廓、anchor、拖曳與旋轉體感尚未真機驗收。
- [V0552 人工瀏覽器驗收](./V0552_MANUAL_BROWSER_ACCEPTANCE.md) 的實機項目尚未勾選。
- 自動化 Chrome／Edge 不得替代 iPhone Safari 真機 Gate；真機通過前不得核准或開始第二批家具。

## G. 已知差距與待決策

- Orthogonal 為 opt-in 原型、尚未設為正式預設；iso 仍為預設與 rollback，待手機實機再驗收後另議。
- 第一批 12 件 Orthogonal 家具已由 `ART-0577` 完成；其餘 35 件仍為 base visual，第二批 Task Card 尚未核准。
- 貓咪目前只把家具 occupancy 當阻擋格，尚未消費 seat／cat-rest／cat-play
  interaction socket，也沒有 approach point、家具狀態占用或對應動畫；完整稽核見
  [V0577B 結果](./V0577B_FIRST_BATCH_ROTATION_AND_DIRECTION_RESULT.md)，建議另立
  `ARCH-0578-CAT-FURNITURE-INTERACTION-AUDIT`，本 Build 未實作互動。
- 三層服務目前只有空間 metadata；工作站／可到達性／椅桌配對與收銀/製作/送餐/排隊**行為**未做（未核准，可用 `ortho-room-zones` 為未來空間依據）。
- 玩家店長未實作；已決定未來代表玩家且可自訂，但資料與視覺規格待定。
- 完整顧客、店員、訂單、料理、送餐、結帳、任務與故事系統未完成。
- 貓咪自然移動與照顧已有第一階段，個性、長期關係與更深互動仍待產品規格。
