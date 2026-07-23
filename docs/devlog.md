# 開發日誌

每筆紀錄包含版本、目標、完成內容、驗證、已知限制與下一步。歷史版本若 repository 沒有完整日期或測試輸出，會明確標示為回溯摘要，不補造證據。

## 2026-07-24｜ARCH-0562-FLAT-PROJECTION-PROTOTYPE

- 版本／Build：**V0.56.0-alpha｜淺俯視投影原型版** / **0560a**（由 V0.55.2-alpha / 0552a 升版；存檔 key `catCafePhaserV0540` 不變）
- 目標：在 SpatialGrid/IsoProjection 骨架上建立第一個可見的淺斜／淺俯視 `FlatProjection` Prototype，透過 `?projection=flat` opt-in；預設仍 iso；不動家具邏輯座標、Occupancy、Placement、Pathfinding、存檔。
- FlatProjection 架構：可逆二維 basis 投影（`world=origin+gx·axisX+gy·axisY`），參數集中於 `FLAT_PROJECTION_PARAMS`（axisX(112,0)、axisY(26,84)），origin 由房間尺寸推導置中；`getCellDiamond` 回傳平行四邊形、`getFootprintPolygon`/`getAnchor` 沿用共同規則。與 iso 相同介面，經 GridSystem Facade 供既有消費者使用。
- Mode resolver：純函式 `projection-mode.js`（iso/flat、空/非法/非字串回退 iso、trim+lowercase、不依賴引擎/DOM/儲存/存檔）；URL 解析隔離於 `CafeScene.initializeGrid`；`GridSystem` 第三參數 `{mode}` 選投影，預設 iso，不讀 URL。
- 玩家可見變化：預設 iso **不變**；flat 僅在 `?projection=flat` 可見；**無新玩家 UI**、無存檔變化。
- 修改檔案：新增 `FlatProjection.js`、`projection-mode.js`、`tests/projection-mode.test.js`、`tests/flat-projection.test.js`；改 `GridSystem.js`、`CafeScene.js`（flat 房間 branch，iso branch 未動）；版本機械升版（build-info、index.html、manifest、package/lock、全 `assets/js` 模組 query、`CAT_ASSET_VERSION`/`FURNITURE_REDRAW_ASSET_VERSION`→0560a）、`check.js`（版本/Build/obsolete/import-query 斷言、protected hashes 更新 GridSystem＋新增 FlatProjection/projection-mode、required、tests、cat pin）、`tests/build-consistency.test.js`、`tests/browser-smoke.test.js`、README、docs。
- 測試結果：`npm test` 通過；`npm run check:deploy` 通過（Build 0560a、48 modules）；`npm run check:dev` 通過（含**本機 Chrome 實際 browser smoke**）；`tests/*.test.js` 逐一 25/25（Node，排除 browser-smoke）＋ browser-smoke 經 check:dev 通過；iso golden-master 期望值未改、通過。
- 家具顯示問題：家具 sprite 仍為 iso 透視，於較平 flat 地板上輕微視覺落差（Prototype 預期，逐件校準 = 候選 ART-0563）；本次未加任何 flat 顯示 override。
- 人工驗收狀態：本環境可啟動 Chrome，已產生 real-browser 截圖 `docs/evidence/v0562/`（iso 1440、flat 1440/390/430、flat+artDebug 390；皆 gameReady、flat pageerror=0、projectionMode 正確）；393×852、觸控互動、存檔重整、切回 iso 對照仍 **pending**（見 `V0562_FLAT_PROJECTION_ACCEPTANCE.md`）。**未**宣稱手機實機驗收通過、**未**宣稱 flat 為正式預設、**未**宣稱家具 flat 美術完成。
- 存檔影響：無（projection 不入存檔；schema/遷移版本/x/y/r 不變）。
- 下一步候選（未核准不執行）：`ART-0563-FLAT-FURNITURE-CALIBRATION`（Codex）、`ARCH-0563-ECONOMY-EXTRACT`、`ARCH-0563-STATION-REGISTRY`。詳見 `docs/V0562_FLAT_PROJECTION_RESULT.md`。

## 2026-07-24｜ARCH-0561-GRID-PROJECTION-SPLIT

- 版本：V0.55.2-alpha／Build `0552a`（未變動）
- 目標：純架構重構——把 `GridSystem` 的「邏輯格責任」與「2:1 等角畫面投影責任」拆開，為未來平面／淺俯視投影建立安全切換點；畫面、家具位置、貓咪移動、拖曳、放置、Camera 與存檔行為必須完全不變。
- 新增模組：
  - `assets/js/systems/SpatialGrid.js`：投影無關邏輯（cols/rows/placeableMask getter、getFootprintSize/Cells、isInsideGrid/isPlaceableCell）；不依賴引擎/DOM/世界座標/角色身份。
  - `assets/js/systems/IsoProjection.js`：2:1 等角投影（gridToWorld/worldToGrid/snapWorldToGrid/getCellCenter/getCellDiamond/getFootprintPolygon/getAnchor）；讀 SpatialGrid 邏輯，不保存家具/占用/角色狀態。
- 修改檔案：
  - `assets/js/systems/GridSystem.js`：改為組合 `SpatialGrid` + `IsoProjection` 的相容 Facade；public API 全數保留、對外委派，並公開唯讀 `spatialGrid`、`projection`。
  - `check.js`：更新 `GridSystem.js` 受保護雜湊（必要——否則 protected-core 檢查會擋），並新增 `SpatialGrid.js`、`IsoProjection.js` 至受保護清單（避免把核心公式移到未受保護檔案而弱化既有防護）；將新測試加入 deploy 測試清單。
  - `tests/grid-projection-compat.test.js`（新增）：golden-master 相容測試 + 責任拆分/單一來源結構檢查。
- public API 相容結果：既有消費者（CafeScene、FurnitureEntity、FurnitureDragController、CatBehaviorController、ArtDebugRenderer、OccupancySystem、PlacementSystem、SaveAdapter.migrateIfNeeded）**未修改**，仍以 `grid.*` 呼叫。
- 測試結果：
  - 重構前基準 `npm test` 通過、`npm run check:deploy` 通過（44 modules）；tests/*.test.js 共 23 檔逐一執行全通過。
  - 重構後 `npm test` 通過、`npm run check:deploy` 通過（46 modules）；tests/*.test.js 共 24 檔（新增 1）逐一執行全通過、0 失敗、0 無法執行。
  - 相容以 golden-master 逐值驗證：gridToWorld/worldToGrid/snap（含 -0 邊界與浮點）、cellCenter/diamond（頂點與順序）、footprint size/cells（含 rotation 奇偶交換與順序）、footprint polygon、anchor（floorObject 腳底／floorDecoration 中心／wallObject 現行行為，rotation 0–3）、inside/placeable，全部與重構前一致。
- 人工瀏覽器驗收：本環境無瀏覽器，標示 **pending**；未宣稱 iso 像素一致已由人工確認。人工驗收步驟見 `docs/V0561_IMPLEMENTATION_RESULT.md`。
- Runtime 玩家可見行為是否改變：**否**（純內部重構，無新功能、無畫面/操作變更）。
- 存檔是否改變：**否**（未觸碰 SaveAdapter；key/schema/遷移版本不變）。
- 產品決策落檔：更新 `decisions.md`（DEC-008 → Accepted；新增 DEC-012 SceneProjection 抽離、DEC-013 actor-neutral 工作架構、DEC-014 顧客/訂單保存）與 `handoffs/V056_PRODUCT_DECISION.md`。
- 未實作（明確）：FlatProjection、projectionMode、平面顯示、店長、店員招募、ActorTaskSystem、StationRegistry、顧客/訂單、EconomySystem。
- 下一步候選（未核准不執行）：`ARCH-0562-FLAT-PROJECTION-PROTOTYPE` 或 `ARCH-0562-ECONOMY-EXTRACT`（比較見 `docs/V0561_IMPLEMENTATION_RESULT.md`）。

## 2026-07-23｜ARCH-0560-FLAT-CAFE-AUDIT

- 版本：V0.55.2-alpha／Build `0552a`（未變動）
- 目標：針對現行 V0.55.2 進行「平面化咖啡廳與營運生命感」架構稽核，產出方案比較、目標架構、MVP 與分階段實作計畫；不進行任何重構。
- 完成文件：
  - 新增 `docs/V056_ARCHITECTURE_AUDIT.md`（現況地圖、A–I 逐點分析、三方案比較表、Proposed 建議、待產品核准問題）。
  - 新增 `docs/V056_IMPLEMENTATION_PLAN.md`（目標架構、MVP 營運循環、Stage 0–10、測試/存檔/美術/效能/回復策略、Claude Code／Codex 任務拆分與相依）。
  - 新增 `docs/handoffs/V056_PRODUCT_DECISION.md`（給產品負責人的精簡決策文件）。
  - 更新本 devlog。`docs/decisions.md` 未變動：本次未形成 Accepted 決策，投影方向仍為 DEC-008 Proposed。
- 主要發現：
  - `CafeScene` 為 God object，經濟與「顧客流程」是 scene 內固定計時器（`maybeSpawnCustomer` 等 2.6 秒後 `+320` 營收）。
  - Grid 邏輯與 2:1 等角投影可乾淨拆分；`Occupancy`／`Placement`／`grid-pathfinder`／`SaveAdapter` 遷移／`Camera` 皆不依賴投影；家具以邏輯格 `x/y/r` 儲存 → 換投影不需搬家具或改存檔。
  - `furniture-visual-config.js` 已含完整 `stationType`／`interactionSockets` 資料，但**零 gameplay 消費者**；socket 無旋轉轉換與可到達性。
  - `walkBlocking` 由 `layer` 推導（非 stationType）；地毯/牆物不阻擋已正確。
  - 貓行為已用單一共享 update 迴圈（無每貓 Timer），但未使用 `catStats` 需求與家具 socket。
  - Reaction 只服務貓、無優先級/冷卻/上限；UI 已事件解耦、已有 bottom bar 與單一輸入 FSM。
  - 存檔 `{...defaults,...parsed}` 對新增頂層欄位前向相容；`care-interaction-core` 的 `committed` 旗標可作訂單防重複結帳範式。
  - Proposed 建議：方案 B（抽離 Projection、保留邏輯格與存檔、新增可切換平面/淺俯視）。
- 驗證：
  - 稽核前 `npm test`：通過（`Core tests passed…`）。
  - 稽核前 `npm run check:deploy`：通過（`Build 0552a, 35 DOM IDs, 13 nested selectors, 44 JavaScript modules`）。
  - 三份新文件互相連結，並連回 AGENTS/decisions/current-state/roadmap 等治理文件。
  - 本次未執行 Browser Smoke 或外部裝置實機驗收。
- 未核准事項：三種技術方案皆為 Proposed；投影方案、平面樣式、MVP staff 執行者、是否保存進行中流程、店長是否入場，均待產品負責人於 `V056_PRODUCT_DECISION.md` 核准。
- 本次未修改 Runtime：未動任何 JavaScript／HTML／CSS／Phaser 設定／家具或貓咪素材／存檔格式／版本號／Build ID／存檔 key／furniture ID／footprint／價格／rotation。
- 已知限制：專案根目錄無 `.git`，無法提供 `git status`／diff；V0552 人工瀏覽器驗收仍 pending。
- 下一步：待產品核准方案後，執行首張任務卡（B → `ARCH-0561-GRID-PROJECTION-SPLIT`；或生命感先行 → `ARCH-0562-ECONOMY-EXTRACT`）。

## 2026-07-23｜DOC-0552-CLAUDE-HANDOFF

- 版本：V0.55.2-alpha／Build `0552a`
- 目標：建立正式專案治理、決策、現況、路線圖、Task Card 與 Claude Code 交接文件。
- 完成：
  - 新增 `AGENTS.md`、`CLAUDE.md`。
  - 新增 decisions、devlog、current-state、roadmap、Task Card 與 V0552 handoff。
  - README 僅新增「專案治理與交接」連結。
- 驗證：
  - 修改前 `npm.cmd test`：通過；輸出為 Core tests passed。
  - 修改前 `npm.cmd run check:deploy`：通過；Build `0552a`、35 DOM IDs、13 nested selectors、44 JavaScript modules。
  - 文件完成後重跑上述兩項命令：均通過，輸出與基準一致。
  - README 內八個治理文件連結與治理文件間相對連結均可解析。
  - 本次未執行 Browser Smoke 或外部裝置實機驗收。
- 已知限制：專案根目錄沒有 `.git`，無法提供 `git status`／diff；V0552 人工瀏覽器驗收仍 pending。
- 下一步：依 `docs/handoffs/V0552_TO_CLAUDE.md` 先做架構稽核，不直接重構 Grid。

## 2026-07-23｜V0.55.2-alpha Prototype 家具全面重繪

- 版本：V0.55.2-alpha／Build `0552a`
- 目標：替換 V0.55.1 稽核出的白底／文字 Prototype。
- 完成：25 件家具、每件四方向，共 100 張透明 RGBA PNG；Runtime 分類為 42 `production`、5 `redraw`、0 `prototype`；`childrenPlayArea` 為可用 `redraw`。
- 驗證：靜態 PNG、方向、ID、footprint 與存檔相容性 Gate 已記錄於 `PROTOTYPE_REDRAW_RESULT.md` 與現有測試。
- 已知限制：`childrenPlayArea` 陰影邊緣待精修；`V0552_MANUAL_BROWSER_ACCEPTANCE.md` 的外部裝置項目尚未勾選。
- 下一步：完成人工瀏覽器／實機驗收；在任何投影調整前先做架構稽核。

## 2026-07-23｜V0.55.1-alpha 家具與美術稽核

- 版本：V0.55.1-alpha
- 目標：建立家具素材、方向、透明度、footprint 與商店狀態基線。
- 完成：稽核 47 個家具定義；識別 22 PNG 與 25 白底／文字 SVG Prototype；建立 Art Bible、完整清單與 Prototype 重繪計畫。
- 驗證：證據與逐件狀態保留於 `FURNITURE_AUDIT.md`。
- 已知限制：該文件的逐件表是 V0.55.1 基線，需配合其頂部 V0.55.2 Runtime 更新閱讀。
- 下一步：已由 V0.55.2 完成 25 件 Prototype Runtime 替換。

## 歷史日期未記錄｜V0.54.0 Phaser 架構重建

- 版本：V0.54.0 系列
- 目標：由舊單檔 DOM／Canvas Patch 遷移到 Phaser 3.90.0 模組化架構。
- 完成：建立本地 Phaser、Scene、Grid、Occupancy、Placement、Camera、Depth、SaveAdapter、Phaser 家具／貓咪與 DOM HUD 分工。
- 驗證：現行 Runtime、`legacy/legacy-notes.md` 與後續測試可證明架構存在；原始版本的完整測試紀錄未保留於目前文件。
- 已知限制：部分營運與顧客流程仍是簡化演出；不可回溯宣稱完整 AI。
- 下一步：後續版本持續補齊啟動安全、貓咪、拖曳、照顧與美術。

## 歷史日期未記錄｜V0.53.0 穩定場景核心

- 版本：V0.53.0
- 目標：建立單一 Canvas／Camera、穩定拖曳、縮放與 Safari resize 基線。
- 完成：依 `legacy/index-v0532.html` 內現存註解，背景與場景 DOM 曾共用 V0.53.0 Camera。
- 驗證：此為 legacy 原始碼與專案負責人提供的歷史摘要；目前沒有獨立測試報告可回溯。
- 已知限制：該舊執行路徑已退出正式 Runtime，不應作現行架構說明。
- 下一步：V0.54.0 已以 Phaser Main Camera 取代舊路徑。

## 歷史日期未記錄｜V0.50.4 手機直立方向

- 版本：V0.50.4 系列
- 目標：改善手機直立畫面的可用性與空白畫面問題。
- 完成：`legacy/index-v0532.html` 保留 `V0.50.4.1 mobile portrait blank-screen fix` 歷史註解；手機直立方向由專案負責人摘要確認。
- 驗證：目前沒有該版獨立測試輸出，不回溯宣稱特定裝置通過。
- 已知限制：舊 DOM/CSS Patch 不屬正式執行路徑。
- 下一步：手機直立持續作為現行產品優先視角。
