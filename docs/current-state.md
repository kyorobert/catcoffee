# V0.56.1-alpha 專案現況

本文件描述 repository 目前可直接查證的狀態，不代表未來產品承諾。決策以 [decisions.md](./decisions.md) 為準。

## A. 版本與部署

| 項目 | 現況 |
|---|---|
| 版本 | `V0.56.1-alpha｜淺俯視構圖比較版` |
| Build ID | `0561a` |
| package version | `0.56.1-alpha` |
| 引擎 | Phaser `3.90.0`，Canvas renderer |
| 引擎來源 | `assets/vendor/phaser-3.90.0.min.js` |
| 部署 | GitHub Pages 純靜態相對路徑，不依賴 CDN |
| 模組載入 | ES Modules，必須由 HTTP server／HTTPS 載入，不使用 `file://` |
| 存檔 key | `catCafePhaserV0540`（V0.56.0 未變） |
| Legacy save | 只讀 legacy key，原始資料備份至 `catCafeLegacySaveBackupV0532` |

### A2. 場景投影與 Flat 構圖三方案（V0.56.1 更新）

- `GridSystem` 為 `SpatialGrid`（投影無關邏輯）＋ `SceneProjection` 的相容 Facade；投影有 `IsoProjection`（現行 2:1 等角）與 `FlatProjection`（淺斜／淺俯視）。
- **預設投影仍為 iso**；`FlatProjection` 由網址 `?projection=flat` opt-in。本版新增**三個共用同一 `FlatProjection` 的構圖 Preset**（參數集中於 `assets/js/config/flat-projection-presets.js`）：
  - **A｜Near Iso**：`?projection=flat&flatPreset=near-iso`
  - **B｜Balanced**：`?projection=flat&flatPreset=balanced`
  - **C｜Current Flat**：`?projection=flat&flatPreset=current`（＝`?projection=flat`，沿用 `ARCH-0562`）
  - 未知／空字串 → `current`；`projection` 非 flat 時忽略 `flatPreset`；可疊 `&artDebug=1`。
- **投影模式與 Preset 皆不寫入存檔**；重整後由網址決定。家具 `x/y/r`、Occupancy、Placement、Pathfinding、存檔 key／schema 未因投影或 Preset 改變。
- Flat 房間 rendering 由 Preset metadata 決定（後牆高度、可選側牆、外框線寬、牆飾位置），僅屬視覺、深度 -1000；iso 呈現未動。
- **三個 Preset 皆為 Proposed 比較方案，正式 Flat Preset 尚未選定**；未做家具 flat 逐件校準。real-browser 截圖見 `docs/evidence/v0563/`，比較說明見 [V0561 構圖比較結果](./V0561_FLAT_PRESET_COMPARISON_RESULT.md) 與 [V0561 人工驗收](./V0561_FLAT_PRESET_COMPARISON_ACCEPTANCE.md)；前一版 Prototype 紀錄見 [V0562 結果](./V0562_FLAT_PROJECTION_RESULT.md)。

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
- `npm.cmd run check:deploy`：通過；檢查 Build `0561a`、35 DOM IDs、13 nested selectors、49 JavaScript modules。
- `npm.cmd run check:dev`：通過（含真實 Chrome browser smoke）。
- `node tests/flat-preset.test.js`：通過（Flat 三 Preset resolver 與幾何）。

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

