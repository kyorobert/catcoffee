# V0.57.1-alpha 專案現況

本文件描述 repository 目前可直接查證的狀態，不代表未來產品承諾。決策以 [decisions.md](./decisions.md) 為準。

## A. 版本與部署

| 項目 | 現況 |
|---|---|
| 版本 | `V0.57.1-alpha｜正交手機構圖調整版` |
| Build ID | `0571a` |
| package version | `0.57.1-alpha` |
| 引擎 | Phaser `3.90.0`，Canvas renderer |
| 引擎來源 | `assets/vendor/phaser-3.90.0.min.js` |
| 部署 | GitHub Pages 純靜態相對路徑，不依賴 CDN |
| 模組載入 | ES Modules，必須由 HTTP server／HTTPS 載入，不使用 `file://` |
| 存檔 key | `catCafePhaserV0540`（V0.56.0 未變） |
| Legacy save | 只讀 legacy key，原始資料備份至 `catCafeLegacySaveBackupV0532` |

### A2. 場景投影：正交平面原型（V0.57.0）

- `GridSystem` 為 `SpatialGrid`（投影無關邏輯）＋ `SceneProjection` 的相容 Facade；投影模組有 `IsoProjection`（2:1 等角）、`FlatProjection`（淺斜／淺俯視，**已被產品拒絕，保留回歸**）與 **`OrthogonalProjection`（正交平面，本版新增）**。
- **`OrthogonalProjection`**：真正軸對齊 `axisX={104,0}`、`axisY={0,88}`（`axisX.y=0`、`axisY.x=0`，無 skew／shear／rotation），cell 為矩形、determinant 9152、origin 由房間 centroid 推導置中；集中於 `ORTHOGONAL_PROJECTION_PARAMS`（`assets/js/systems/OrthogonalProjection.js`）。
- **URL**：`/`／`?projection=iso`→iso（**預設**）；`?projection=ortho`（別名 `orthogonal`）→正交；`?projection=ortho&demoLayout=1`→正交 + 非存檔 Demo 構圖；可疊 `&artDebug=1`；`?projection=flat`（含 `flatPreset=near-iso/balanced/current`）保留作歷史回歸；非法值回退 iso。
- **Demo Layout**：`assets/js/config/ortho-demo-layout.js` 純資料 fixture（23 件現有家具，服務／座位／貓咪分區），僅 ortho 有效、display-only；**不寫入存檔、不改 `state.items`／inventory／coins、不觸發 save**。
- **預設仍為 iso**；Orthogonal 尚未成為正式預設，待產品視覺驗收。投影與 demoLayout **不寫入存檔**。家具 `x/y/r`、Occupancy、Placement、Pathfinding、存檔 key／schema 未因投影改變。
- **Flat A／B／C 已被產品負責人拒絕**（見 [DEC-016 Superseded](./decisions.md)、[DEC-017](./decisions.md)）；正交房間幾何正確，但現有等角家具仍為 Placeholder，**正式家具重作尚未開始**（見 [V0570 家具重作計畫](./V0570_ORTHOGONAL_ASSET_REBUILD_PLAN.md)）。
- real-browser 截圖見 `docs/evidence/v0570/`；細節見 [V0570 結果](./V0570_ORTHOGONAL_ROOM_RESULT.md)、[V0570 驗收](./V0570_ORTHOGONAL_ROOM_ACCEPTANCE.md)、[比較 HTML](./V0570_ORTHOGONAL_COMPARISON.html)；前版 Flat 紀錄見 [V0561 構圖比較結果](./V0561_FLAT_PRESET_COMPARISON_RESULT.md)。
- **V0.57.1 手機取景修正（`ARCH-0571`）**：產品負責人 iPhone 驗收確認 Orthogonal 方向正確、但 V0.57.0 首屏過度放大。新增純模組 `core/scene-viewport.js`＋`core/camera-framing.js`＋DOM adapter `ui/viewport-metrics.js`；`CameraController` 對 **ortho** 改為「以房間內容 bounds＋DOM/visualViewport safe viewport 計算 fit zoom＋centerOn 置中＋內容 clamp」（iso/flat 分支不變）。手機直立首屏可見**整間咖啡廳 100% 寬度**、置中、無需左右拖曳、pan/zoom 夾在房間內（無外部空白）、無黑邊；初始無選取家具/情境列；情境列出現於底部保留帶不遮住房間、且不使 Camera 跳動。Demo 重排為 16 件緊湊分區。**未改投影數學/家具/存檔**。real-browser 證據 `docs/evidence/v0571/`；見 [V0571 結果](./V0571_ORTHOGONAL_MOBILE_RESULT.md)、[驗收](./V0571_ORTHOGONAL_MOBILE_ACCEPTANCE.md)、[比較 HTML](./V0571_ORTHOGONAL_MOBILE_COMPARISON.html)、[DEC-018](./decisions.md)。手機實機再驗收 pending。

## B. 架構地圖

- `assets/js/config/`：Build、房間、家具視覺、家具規則與貓咪資料。
- `assets/js/core/`：不綁 Phaser 的 input、pathfinding、照顧與家具視覺選擇／驗證規則。
- `assets/js/entities/`：Phaser 家具、貓咪、簡化顧客、牆飾、環境效果與反應泡泡。
- `assets/js/phaser/`：輸入模式、家具拖曳、貓咪行為、照顧互動、互動／美術 Debug controller。
- `assets/js/scenes/`：`BootScene` 與 `CafeScene`。
- `assets/js/systems/`：Grid、Occupancy、Placement、Camera、Depth、Save、Startup、Toast 與營業前布局檢查。
- `assets/js/ui/`：Phaser 與 DOM 的 `UiBridge`、商店與照顧面板。
- `tests/`：純核心、互動、AI、拖曳、照顧、建置、HTTP、Browser Smoke 與家具美術／相容性測試。

正式 `index.html` 僅建立 App shell、HUD、Phaser viewport、面板與底部操作；舊單檔程式保留在 `legacy/`，正式 Runtime 不載入。

## C. 核心模組責任

| 模組 | 單一責任 |
|---|---|
| `BootScene` | 預載家具／貓咪／環境 texture、回報進度、建立缺圖 fallback、啟動 `CafeScene` |
| `CafeScene` | 組裝 state、systems、entities、controllers 與場景生命週期 |
| `GridSystem` | 2:1 Grid ↔ world、cell diamond、footprint cells／polygon、anchor、placeable mask |
| `OccupancySystem` | `floorDecoration`、`floorObject`、`wallObject`、`character`、`reserved` 分層占用與 walkability snapshot |
| `PlacementSystem` | 邊界、placeable、入口、牆面與重疊驗證；椅桌關係不作拖曳硬阻擋 |
| `CameraController` | Phaser Main Camera bounds、cover zoom、pan、pinch、wheel 與 resize |
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
| Camera pan／pinch／wheel／resize | 完成 | 單一 Main Camera；外部裝置仍需人工驗收 |
| 家具顯示、選取、拖曳、旋轉、收納、出售 | 完成 | 同一 Grid／Occupancy／Placement／Ghost 資料流 |
| 家具商店與購買 | 完成 | 以 Runtime visual config 顯示 |
| 家具存檔相容 | 完成 | 固定 ID 與 `catCafePhaserV0540` |
| 貓咪顯示、動畫、漫遊與家具避障 | 完成 | 五個 cat ID；BFS、delta movement、休息狀態 |
| 餵食／梳毛／玩耍照顧流程 | 完成 | 純規則 core + Phaser session + DOM 演出 |
| 日別、階段、營收與報告計數 | 部分實作 | 有簡化狀態推進與報告，不代表完整經營系統 |
| 顧客 | 部分實作 | `CustomerEntity` 有簡化生成、定點移動與營收演出；完整顧客 AI 未實作 |
| 店員／玩家店長 | 未實作 | 沒有正式角色、AI 或自訂資料模型 |
| 訂單、料理、送餐、結帳 | 未實作 | 目前數字演出不等於完整訂單流程 |
| 任務／故事 | 未實作或僅資料預留 | state 有簡化 task counter；沒有完整任務／故事系統 |
| 最終角色呈現 | 未完成 | 貓咪已有正式方向；店長、店員與顧客最終美術待定 |

## E. 家具與美術資料流

`furniture-config.js` 提供 gameplay 定義；`furniture-visual-config.js` 提供 `textureByDirection`、路徑、scale、anchor、station、socket、walkBlocking 與 art status。`BootScene` 依方向預載；`FurnitureEntity`、Ghost 與 `StorePanel` 使用同一視覺資料。

- 家具定義：47。
- V0.55.2 原 Prototype 重繪：25 件、100 張四方向透明 PNG。
- Runtime art status：42 `production`、5 `redraw`、0 `prototype`。
- `childrenPlayArea`：可用 `redraw`；陰影邊緣待精修。
- furniture ID、價格、footprint、rotation 與存檔座標未因重繪改變。
- Anchor：直立物以腳底中心；平面裝飾以 footprint 中心。

完整逐件紀錄見 [FURNITURE_AUDIT.md](./FURNITURE_AUDIT.md) 與 [PROTOTYPE_REDRAW_RESULT.md](./PROTOTYPE_REDRAW_RESULT.md)。

## F. 測試狀態

### 本次文件任務實際執行

- `npm.cmd test`：通過。
- `npm.cmd run check:deploy`：通過；檢查 Build `0571a`、35 DOM IDs、13 nested selectors、54 JavaScript modules。
- `npm.cmd run check:dev`：通過（含真實 Chrome browser smoke，涵蓋 ortho 首屏 fit＝minZoom／整寬可見／無初始選取/情境列、ortho-demo boot 與 invalid 回退）。
- `node tests/ortho-projection.test.js`、`node tests/ortho-demo-layout.test.js`、`node tests/camera-framing.test.js`：通過（正交數學／Demo 隔離可達性／safe viewport＋fit zoom＋centre clamp）。

### Repository 內已有

- Node 純核心／互動／AI／拖曳／照顧測試。
- Build、DOM contract、HTTP 與部署檢查。
- 家具分類、透明度、方向、ID、footprint、商店與存檔相容性測試。
- `tests/browser-smoke.test.js` 自動化入口。

### 尚未驗證

- 本次文件任務未執行 Browser Smoke。
- [V0552 人工瀏覽器驗收](./V0552_MANUAL_BROWSER_ACCEPTANCE.md) 的 Chrome、Edge、iPhone Safari、Android Chrome 與手機橫式項目尚未勾選。
- 未完成外部裝置驗收前，不得宣稱實機通過。

## G. 已知差距與待決策

- 現行 Runtime 是 2:1 等角 Grid；產品希望評估 flat／shallow top-down 可讀性，但遷移方法尚未核准。
- 需稽核投影變更對 Camera、資產、座標、Depth、Occupancy、Placement、Pathfinding 與存檔的連鎖影響。
- 玩家店長未實作；已決定未來代表玩家且可自訂，但資料與視覺規格待定。
- 完整顧客、店員、訂單、料理、送餐、結帳、任務與故事系統未完成。
- 貓咪自然移動與照顧已有第一階段，個性、長期關係與更深互動仍待產品規格。

