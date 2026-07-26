# V0.57.6-alpha 專案現況

## Build 0576a（ARCH-0575C）

- 正交模式仍為 opt-in；iso 仍是預設／rollback。
- 新 `ortho-room-skin.js` 是正交房間 visual tokens 的唯一來源；`OrthogonalProjection` 回到純幾何。
- 10×8 logical grid／placeableMask 未變：78 格 playable、舊入口 `(8,7)/(9,7)` 兩格 reserved。
- playable cell 使用 zone floor palette；reserved cell 使用 threshold；Grid 外滿版 shell 使用深木 `fixed-architecture` panel/trim，不再像可放置地板。
- 門的 visual geometry/style 由 Skin 管理；logical entrance metadata 仍由 `ortho-room-zones.js` 管理。
- `FurnitureDragController.evaluateCandidate()` 統一 preview/commit evaluation；candidate 變動以 signature 失效。
- CameraController、Grid/Occupancy/Placement、save key/schema、furniture data contract 未改。
- Chrome 390/393/430 與桌面 smoke 通過；iPhone Safari 真機仍 pending。
- 結果與證據：[V0576 結果](./V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_RESULT.md)、[驗收](./V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_ACCEPTANCE.md)、`docs/evidence/v0576/`。

本文件描述 repository 目前可直接查證的狀態，不代表未來產品承諾。決策以 [decisions.md](./decisions.md) 為準。

## A. 版本與部署

| 項目 | 現況 |
|---|---|
| 版本 | `V0.57.5-alpha｜正交房間外殼與門比例修正版` |
| Build ID | `0575b` |
| package version | `0.57.5-alpha` |
| 引擎 | Phaser `3.90.0`，Canvas renderer |
| 引擎來源 | `assets/vendor/phaser-3.90.0.min.js` |
| 部署 | GitHub Pages 純靜態相對路徑，不依賴 CDN |
| 模組載入 | ES Modules，必須由 HTTP server／HTTPS 載入，不使用 `file://` |
| 存檔 key | `catCafePhaserV0540`（schema 5401、migration 5401，未變） |
| Legacy save | 只讀 legacy key，原始資料備份至 `catCafeLegacySaveBackupV0532` |

### A2. 場景投影：正交平面（V0.57.0 → V0.57.3）

- `GridSystem` 為 `SpatialGrid`（投影無關邏輯）＋ `SceneProjection` 的相容 Facade；投影模組有 `IsoProjection`（2:1 等角，**預設／rollback**）、`FlatProjection`（淺斜／淺俯視，**已被產品拒絕，僅保留回歸**）與 **`OrthogonalProjection`（正交平面）**。
- **`OrthogonalProjection`**：真正軸對齊 `axisX={88,0}`、`axisY={0,120}`（`axisX.y=0`、`axisY.x=0`，無 skew／shear／rotation／perspective），cell 為矩形、origin 由房間 centroid 推導置中；集中於 `ORTHOGONAL_PROJECTION_PARAMS`（`assets/js/systems/OrthogonalProjection.js`）。
- **URL**：`/`／`?projection=iso`→iso（**預設**）；`?projection=ortho`（別名 `orthogonal`）→正交；`?projection=ortho&demoLayout=1`→正交 + 非存檔 Demo 構圖；可疊 `&artDebug=1`；`?projection=flat`（含 `flatPreset=near-iso/balanced/current`）保留作歷史回歸；非法值回退 iso。
- **Zone metadata（V0.57.3 新增，V0.57.4 收斂為乾淨分割）**：`assets/js/config/ortho-room-zones.js` 以純格座標矩形描述入口門／入口點／員工工作區／櫃檯帶／顧客服務區／座位／貓咪／主走道／核心取景區；功能帶收斂為 x1-6（與 x7-8 走道不重疊），並提供 `zoneAt(x,y)`／`ORTHO_ZONE_KEYS`（每格單一 zone，供分區底色）。**純資料、可投影、無 world pixel、無 Phaser/DOM、無 actor 身份（zone key 為身份中性的 `work`/`counter`/`service`/`seating`/`cat`/`aisle`/`outer`）、可 Node 測試；非 StationRegistry、非 CustomerFlowSystem、無行為邏輯。**
- **分區地板底色（V0.57.4 新增）**：`ORTHOGONAL_ROOM_RENDER.zoneFloor` 提供各 zone 暖色底色；`CafeScene.drawRoomOrtho` 依 `zoneAt` 為每格上分區底色（`shadeColor` 逐格二階明暗），使營業區一眼可辨。純視覺、無行為。
- **Demo Layout**：`assets/js/config/ortho-demo-layout.js` 純資料 fixture（**23 件**現有家具，依 `ortho-room-zones` 分區、連續服務帶＋成組座位＋集中貓咪、地板占用 ~48%），僅 ortho 有效、display-only；**不寫入存檔、不改 `state.items`／inventory／coins、不觸發 save**。
- **預設仍為 iso**；Orthogonal 尚未成為正式預設，待手機實機再驗收。投影與 demoLayout **不寫入存檔**。家具 `x/y/r`、Occupancy、Placement、Pathfinding、存檔 key／schema 未因投影改變。
- **Flat A／B／C 已被產品負責人拒絕**（見 [DEC-016 Superseded](./decisions.md)、[DEC-017](./decisions.md)）；正交房間幾何正確，但現有等角家具仍為 Placeholder，**正式家具重作尚未開始**（延後至核心滿版與分區實機通過後，候選 `ART-0574`）。
- **手機取景演進**：
  - `ARCH-0571`（[DEC-018](./decisions.md)）：新增純模組 `core/scene-viewport.js`＋`core/camera-framing.js`＋DOM adapter `ui/viewport-metrics.js`；`CameraController` 對 ortho 改為「以內容 bounds＋safe viewport 計算 fit＋centerOn＋內容 clamp」。
  - `ARCH-0572`（[DEC-019](./decisions.md)）：正交房間比例 cellWidth 104→88／cellHeight 88→120＋整面背牆，房間占 canvas ~44%→~78%；右上角單格入口門、上方連續櫃檯帶；Demo 17 件。
  - `ARCH-0573`（[DEC-020](./decisions.md)）：首屏由「整房 contain」改為「**核心營業區滿版**」。分離 **roomBounds**（整房＝pan/zoom-out 範圍）與 **coreGameplayBounds**（首屏取景＝x1-8＋短牆條）；核心縱向占 safe viewport 96/95/93%、裁切 ~8%。入口改為 **x7-8 兩格視覺門**（x9 留牆；`customerEntryPoint=(8,0)`、staging `(8,1)`；logical 存檔入口 `(8,7)/(9,7)` 不變）。
  - `ARCH-0574`（[DEC-021](./decisions.md)）：**營業區聚焦與分區辨識**。分區地板底色（`zoneAt`＋`zoneFloor`）＋分區收斂 x1-6 乾淨分割＋Demo 加密 23 件（連續設備帶/櫃檯、兩組座位、集中貓咪角，占用 ~28%→~48%）。
  - **`ARCH-0575A`（[DEC-023](./decisions.md)，本版，Build 0575b）**：**房間視覺外殼滿版化與入口門比例修正**。留白根因為房間外殼只畫到邏輯 Grid；改為把**牆＋地板視覺外殼畫到超出 Grid**（`ORTHOGONAL_ROOM_RENDER.shell`）延伸至 safe viewport 邊緣，手機首屏外圈背景 ~18px→**~0px**（純視覺、**不新增 placeable cells**、不改 Grid/存檔；細牆腳線取代粗卡片外框）。**視覺門與邏輯入口分離**：`logicalEntranceZone` 維持兩格 x7-8，新增較小 `visualDoorBounds`（~1.4 格、123×124 world px、置中 x7-8、x9 牆），門改為分層繪製（門框＋玻璃格窗＋黃銅門把＋木門扇，非深色黑洞）。**Zoom/Pan 核心凍結**（CameraController 未改），real-browser 拖曳 pan 回歸通過。`customerEntryPoint (8,0)`／staging／舊存檔入口 `(8,7)/(9,7)`／cell 88×120 皆不變。real-browser 證據 `docs/evidence/v0575b/`＋`metrics.json`；見 [V0575B 結果](./V0575B_ORTHOGONAL_ROOM_SHELL_RESULT.md)、[驗收](./V0575B_ORTHOGONAL_ROOM_SHELL_ACCEPTANCE.md)、[比較 HTML](./V0575B_ORTHOGONAL_ROOM_SHELL_COMPARISON.html)。手機實機再驗收 pending。
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
| `FurnitureEntity` | texture／origin／hit area／世界位置／depth／選取顯示 |
| `CatEntity` | sprite、動畫、方向、移動顯示、depth、選取和值班徽章 |
| `StorePanel` | DOM 商店清單、購買入口與面板生命週期 |
| `CarePanel` | DOM 選貓、照顧方式、演出、結果與取消流程 |

## D. 功能狀態矩陣

| 功能 | 狀態 | 說明 |
|---|---|---|
| Phaser 啟動與錯誤遮罩 | 完成 | 有 timeout、error UI、fallback 與 Build consistency |
| Camera pan／pinch／wheel／resize | 完成 | 單一 Main Camera；ortho 首屏核心滿版、可 zoom-out 至整房；外部裝置仍需人工驗收 |
| 家具顯示、選取、拖曳、旋轉、收納、出售 | 完成 | 同一 Grid／Occupancy／Placement／Ghost 資料流 |
| 家具商店與購買 | 完成 | 以 Runtime visual config 顯示 |
| 家具存檔相容 | 完成 | 固定 ID 與 `catCafePhaserV0540` |
| 貓咪顯示、動畫、漫遊與家具避障 | 完成 | 五個 cat ID；BFS、delta movement、休息狀態 |
| 餵食／梳毛／玩耍照顧流程 | 完成 | 純規則 core + Phaser session + DOM 演出 |
| 正交房間空間分區（metadata） | 完成（僅空間） | `ortho-room-zones` 純資料；三層服務為空間方向，**無行為邏輯** |
| 日別、階段、營收與報告計數 | 部分實作 | 有簡化狀態推進與報告，不代表完整經營系統 |
| 顧客 | 部分實作 | `CustomerEntity` 有簡化生成、定點移動與營收演出；完整顧客 AI 未實作 |
| 店員／玩家店長 | 未實作 | 沒有正式角色、AI 或自訂資料模型 |
| 訂單、料理、送餐、結帳 | 未實作 | 目前數字演出不等於完整訂單流程；工作站邏輯未做 |
| 任務／故事 | 未實作或僅資料預留 | state 有簡化 task counter；沒有完整任務／故事系統 |
| 最終角色呈現 | 未完成 | 貓咪已有正式方向；店長、店員與顧客最終美術待定；正交家具重作待 `ART-0574` |

## E. 家具與美術資料流

`furniture-config.js` 提供 gameplay 定義；`furniture-visual-config.js` 提供 `textureByDirection`、路徑、scale、anchor、station、socket、walkBlocking 與 art status。`BootScene` 依方向預載；`FurnitureEntity`、Ghost 與 `StorePanel` 使用同一視覺資料。

- 家具定義：47。
- V0.55.2 原 Prototype 重繪：25 件、100 張四方向透明 PNG。
- Runtime art status：42 `production`、5 `redraw`、0 `prototype`。
- `childrenPlayArea`：可用 `redraw`；陰影邊緣待精修。
- furniture ID、價格、footprint、rotation 與存檔座標未因重繪或投影改變。
- Anchor：直立物以腳底中心；平面裝飾以 footprint 中心。
- **正交地板上的等角家具仍為 Placeholder**（正交透視待 `ART-0574`）。

完整逐件紀錄見 [FURNITURE_AUDIT.md](./FURNITURE_AUDIT.md) 與 [PROTOTYPE_REDRAW_RESULT.md](./PROTOTYPE_REDRAW_RESULT.md)。

## F. 測試狀態

### 本次任務（ARCH-0575A，Build 0575b）實際執行

- `node check.js --deploy`：通過（Build `0575b`、35 DOM IDs、13 nested selectors、**55** JavaScript modules）。
- `node check.js --dev`：通過（含**本機真實 Chrome** browser smoke：**shell external margin≈0（外殼延伸滿版）**、**door 中央非暗塊（門非黑洞）**、zoom-in 真實指標拖曳後 X/Y scroll 皆改變且四邊 clamp、x0/x9 取樣非暗帶、可 zoom-out 至整房、demo 不寫存檔、invalid 回退 iso）。
- 個別：`ortho-room-zones`（門幾何：logicalEntranceZone 兩格、visualDoorBounds<2 格/置中 x7-8/x9 牆）、`ortho-projection`（shell 延伸、door leaf 非暗、glass>leaf>frame 層次、doorHeight~124）、`camera-framing`（pan range>0，未改）、`ortho-demo-layout`（23 件）、`grid-projection-compat`（iso/Flat golden 未改）皆通過。
- 18 張 real-browser 證據（`docs/evidence/v0575b/`）＋`metrics.json`（每張 visualShellBounds/visualDoorBounds/logicalEntranceZone/externalMargin/pan range）＋before(0575a)/after(0575b)＋門 before/after 零 page error。

### Repository 內已有

- Node 純核心／互動／AI／拖曳／照顧測試。
- Build、DOM contract、HTTP 與部署檢查。
- 家具分類、透明度、方向、ID、footprint、商店與存檔相容性測試。
- `tests/browser-smoke.test.js` 自動化入口（本機需 Chrome／Edge）。

### 尚未驗證

- [V0573 手機實機驗收清單](./V0573_ORTHOGONAL_CORE_FULLBLEED_ACCEPTANCE.md) 的 iPhone Safari、Android Chrome、桌面 Chrome／Edge 尚未勾選。
- [V0552 人工瀏覽器驗收](./V0552_MANUAL_BROWSER_ACCEPTANCE.md) 的實機項目尚未勾選。
- 未完成外部裝置驗收前，不得宣稱實機通過，也不得開始 `ART-0574`。

## G. 已知差距與待決策

- Orthogonal 為 opt-in 原型、尚未設為正式預設；iso 仍為預設與 rollback，待手機實機再驗收後另議。
- 正交地板上的等角家具仍為 Placeholder；核心 10～12 件正交重作（`ART-0574`）延後至核心滿版與分區實機通過後。
- 三層服務目前只有空間 metadata；工作站／可到達性／椅桌配對與收銀/製作/送餐/排隊**行為**未做（候選 `ARCH-0574-STATION-REGISTRY`，可用 `ortho-room-zones` 為空間依據）。
- 玩家店長未實作；已決定未來代表玩家且可自訂，但資料與視覺規格待定。
- 完整顧客、店員、訂單、料理、送餐、結帳、任務與故事系統未完成。
- 貓咪自然移動與照顧已有第一階段，個性、長期關係與更深互動仍待產品規格。
