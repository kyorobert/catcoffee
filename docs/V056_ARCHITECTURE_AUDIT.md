# V0.56 平面化咖啡廳與營運生命感 — 架構稽核

- 任務 ID：`ARCH-0560-FLAT-CAFE-AUDIT`
- 基線版本：`V0.55.2-alpha`｜Build `0552a`｜package `0.55.2-alpha`
- 引擎：Phaser `3.90.0`（Canvas renderer，本地 `assets/vendor/phaser-3.90.0.min.js`）
- 存檔 key：`catCafePhaserV0540`（`SaveAdapter.CURRENT_KEY`）
- 稽核性質：**唯讀稽核**。本次未修改任何 Runtime、HTML、CSS、素材、存檔或設定；僅新增／更新 Markdown。
- 相關文件：[實作計畫](./V056_IMPLEMENTATION_PLAN.md)｜[產品決策交接](./handoffs/V056_PRODUCT_DECISION.md)｜[決策紀錄](./decisions.md)｜[目前狀態](./current-state.md)｜[V0552 交接](./handoffs/V0552_TO_CLAUDE.md)

> 本文所有主要判斷都標註實際檔案、class 或 function。技術方案一律標示為 **Proposed／建議**，不得視為已核准。

---

## 0. 前置檢查結果

| 項目 | 結果 | 證據 |
|---|---|---|
| 專案根目錄 | `c:\Users\rober\Desktop\貓咪咖啡廳` | 本次 shell |
| Git repository | **否**（無 `.git`）；未執行 `git init` | 目錄無 `.git` |
| 版本／Build | `V0.55.2-alpha` / `0552a` | [package.json](../package.json)、[build-info.js](../assets/js/config/build-info.js)、[index.html](../index.html) `data-build-id="0552a"` |
| Phaser | `3.90.0` Canvas | [game-config.js:7](../assets/js/config/game-config.js) `type:Phaser.CANVAS` |
| 存檔 key | `catCafePhaserV0540` | [SaveAdapter.js:1](../assets/js/systems/SaveAdapter.js) |
| `npm test` | **通過**：`Core tests passed: cat config/entity animations, Grid anchors, Occupancy, Placement and safe SaveAdapter migration.` | 本次執行 |
| `npm run check:deploy` | **通過**：`Build 0552a, 35 DOM IDs, 13 nested selectors, 44 JavaScript modules.` | 本次執行 |
| 治理文件 | 全部存在（AGENTS、CLAUDE、decisions、current-state、handoffs/V0552、devlog、roadmap、ART_BIBLE、FURNITURE_AUDIT、PROTOTYPE_REDRAW_PLAN/RESULT、V0552_MANUAL_BROWSER_ACCEPTANCE、README、templates/TASK_CARD） | `docs/` 掃描 |

治理文件缺失：**無**。`npm test` 只執行 `tests/core.test.js`（見 [package.json:7](../package.json)）；其餘測試為個別 script，未在本次逐一執行。

---

## 1. 執行摘要

現行架構是一個運作良好、測試齊全的「**家具擺放 + 貓咪漫遊 + 照顧**」沙盒，外加**以固定計時器假裝的營運演出**。它距離「玩家不用理解系統也能感覺咖啡廳一直在運作」的目標，缺的**不是投影方式**，而是三件事：

1. **一個真正的顧客／訂單狀態機**（目前是 [`CafeScene.maybeSpawnCustomer`](../assets/js/scenes/CafeScene.js) 的 `delayedCall(2600) → dailyRevenue+=320`）。
2. **一個把家具 socket 轉成可到達工作站的 StationRegistry**（socket 資料已存在但**零 Runtime 消費者**）。
3. **一個通用、有預算控制的 Reaction System**（目前只有貓咪專用的 [`CatReactionBubble`](../assets/js/entities/CatReactionBubble.js)）。

平面化（flat/shallow）是**可讀性議題**，與上述營運生命感**正交**。好消息是：`OccupancySystem`、`PlacementSystem`、`grid-pathfinder`、`SaveAdapter.migrateIfNeeded` **完全不觸碰投影函式**，家具座標以邏輯格 `x/y/r` 儲存，因此投影抽離（方案 B）的影響面小且可枚舉。

**Claude Code 的 Proposed 建議：採方案 B**（保留邏輯格與存檔、抽離 `SceneProjection`、新增可切換的平面／淺俯視顯示模式），並將營運生命感（Station/Customer/Order/Reaction）作為**與投影解耦的獨立工作流**先行，因為它們不依賴投影決策。詳見 §12–§13。

---

## 2. 現行架構地圖

```
index.html ──(module)──▶ assets/js/main.js
  main.js: DOM contract → SaveAdapter → Phaser.Game(preBoot: UiBridge) → resize
    │
    ├─ config/        game-config, room-config, furniture-config(972行/47件),
    │                 furniture-visual-config(station/socket/art), cat-config, build-info
    ├─ scenes/        BootScene(載入+fallback) → CafeScene(God object, 323行)
    ├─ systems/       GridSystem, OccupancySystem, PlacementSystem, CameraController,
    │                 DepthSystem, SaveAdapter, StartupController, StoreLayoutValidator,
    │                 CatAnimationSystem, ToastManager
    ├─ entities/      FurnitureEntity, CatEntity, CustomerEntity(placeholder),
    │                 CatReactionBubble, WallDecorationEntity, AmbientEffects
    ├─ phaser/        FurnitureDragController(362行), CatBehaviorController(253行),
    │                 CareInteractionController, InputModeController, ArtDebugRenderer,
    │                 InteractionDebugView
    ├─ core/          (純函式, Node 可測) cat-behavior-core, care-interaction-core,
    │                 grid-pathfinder, furniture-direction, furniture-display-state,
    │                 furniture-*-validator, furniture-catalog-selector, input-state
    └─ ui/            UiBridge(事件橋), StorePanel, CarePanel, dom-contract
```

**系統間通訊**：透過 `game.events`（Phaser `EventEmitter`）廣播字串事件（`state-changed`、`selection-changed`、`toast`、`daily-report`、`care-session-*`、`boot-*`）。這其實已是一個**非正式的 Event Bus**（見 [UiBridge.js:43-67](../assets/js/ui/UiBridge.js)），但沒有型別化事件目錄。

**分層品質**：`core/` 已嚴格分離純規則（無 Phaser／DOM／storage），`entities/`＋`phaser/` 負責顯示與輸入。這是本專案最大的既有資產，V0.56 應延續，不要打破。

---

## 3. 主要耦合與技術債

| # | 債務 | 位置（證據） | 風險 |
|---|---|---|---|
| D1 | **CafeScene God object**：生命週期＋家具 CRUD＋貓建立＋顧客演出＋日程＋經濟＋控制器接線＋拖曳 shim 全在一檔 | [CafeScene.js](../assets/js/scenes/CafeScene.js) 全檔 323 行 | 每次新增營運功能都要改這個檔；難以單元測試經濟與流程 |
| D2 | **經濟直接寫在 Scene**：`closeDay`、`sellSelection`、`maybeSpawnCustomer` 直接改 `state.coins/dailyRevenue` 並 `save()` | [CafeScene.js:253-312](../assets/js/scenes/CafeScene.js) | 營收來源分散、無單一 commit 點、無冪等保護 |
| D3 | **假營運**：顧客流程是 tween＋`delayedCall(2600)` 後固定 `+320` | [CafeScene.js:296-312](../assets/js/scenes/CafeScene.js) | 與產品「不得長期依賴固定秒數增加營收」直接衝突 |
| D4 | **Grid 邏輯與等角投影同居一檔** | [GridSystem.js](../assets/js/systems/GridSystem.js) | 投影方案評估的核心；詳見 §5 |
| D5 | **Station/socket 資料無消費者**：`stationById`、`socketsFor()` 完整，但只有 validator 與 ArtDebug 讀取 | [furniture-visual-config.js:98-132](../assets/js/config/furniture-visual-config.js)；消費者見 §7 grep | 資料看似就緒，實際 0% Runtime；socket 未做旋轉轉換 |
| D6 | **Reaction 只服務貓**：耦合 `catEntity.getWorldPosition()`、固定 depth、無優先級/冷卻/上限 | [CatReactionBubble.js](../assets/js/entities/CatReactionBubble.js) | 顧客反應無法沿用；大量反應會失控 |
| D7 | **貓行為未用需求資料**：`catStats` 有 satiety/mood/clean/bond，但 `CatBehaviorController` 只做隨機漫遊 | [CatBehaviorController.js:75-93](../assets/js/phaser/CatBehaviorController.js) | 生命感不足；socket（cat-rest/cat-play）未被使用 |
| D8 | **事件為 ad hoc 字串**：無事件目錄、無型別、無「鏡頭外略過」概念 | `game.events.emit(...)` 散落各處 | 系統一多，事件難追蹤與測試 |

> 註：D1–D3 是**營運生命感**的主障礙；D4 是**平面化**的主障礙；兩者可平行推進。

---

## 4. A — CafeScene 責任過度集中

### 現行實際責任（逐項對照）

| 責任 | 證據 |
|---|---|
| 場景生命週期／boot 分段 | `create()`、`runBootStage()`、`finishBoot()`、`SHUTDOWN` 清理 [CafeScene.js:28-119](../assets/js/scenes/CafeScene.js) |
| Grid 初始化 | `initializeGrid()`:65 |
| 存檔遷移**兼** Occupancy/Placement 建立 | `migrateSaveIfNeeded()`:69 —— 一個方法同時做遷移與建兩個系統 |
| 房間繪製（牆/地板/入口/牆飾/氛圍） | `drawRoom()`:120-146 |
| 家具 CRUD | `createFurniture/addFurnitureEntity`:147-159、`storeSelection/sellSelection`:243-262 |
| 貓建立**兼**行為控制器建立 | `createCats()`:160-177 |
| 控制器接線**兼**顧客生成排程 | `createCamera()`:80-112（尾端 `time.addEvent(...maybeSpawnCustomer)`） |
| 拖曳／放置委派 shim（11 個方法） | `startPlacement`~`cancelDrag`:196-226 |
| 選取 | `selectItem/selectCat/rotateSelection`:178-242 |
| 照顧委派 | `startCareInteraction`~`careCat`:268-277 |
| **經濟＋日程** | `openStoreForDay/nextPhase/closeDay`:278-295 |
| **顧客流程（假）** | `maybeSpawnCustomer`:296-312 |
| 狀態廣播 | `emitState`:313 |
| 主迴圈委派 | `update`:316-322 |

### 風險
- 任何營運功能（顧客、訂單、經濟、報告）都必須改 `CafeScene`，違反單一職責，且無法在 Node 對經濟與流程做純測試。
- 經濟散落三處（`closeDay`、`sellSelection`、`maybeSpawnCustomer`），沒有單一 commit 點，未來訂單付款極易重複計。

### 應拆出（依風險由低到高）
1. **`EconomySystem`**（純規則 + 單一 commit）：接手 `dailyRevenue/coins/reputation/xp` 的變更與每日結算。**最先拆，因為它是純數值、無 Phaser 依賴、可完全 Node 測試。**
2. **`CafeRuntime`**（營業狀態機）：接手 `phase`/`openStoreForDay`/`nextPhase`/`closeDay`/暫停。
3. **`CustomerFlowSystem` + `OrderSystem`**：取代 `maybeSpawnCustomer`（見 §8）。
4. **`SceneAssembler`/建立流程**：把 `createCats`＋控制器接線、`migrateSaveIfNeeded` 內的系統建立拆成明確的裝配步驟，讓 `CafeScene.create()` 只做「依序呼叫裝配器」。

### 拆分順序與「避免一次改整個遊戲」
- 每次只抽**一個純規則模組**出去，`CafeScene` 改為委派呼叫，**保留現有方法名**當薄 shim（如同現在的拖曳 shim），舊測試與 UI 呼叫點不動。
- 先抽 `EconomySystem`（Stage 依 §13），再抽 `CafeRuntime`，最後才接 Customer/Order。經濟先行可讓後續顧客流程「有地方 commit 營收」，避免又寫成 timer。

---

## 5. B — Grid 邏輯與等角投影耦合

### `GridSystem`（62 行）實際同時處理

| 函式 | 性質 | 說明 |
|---|---|---|
| `gridToWorld` / `worldToGrid` | **投影** | 2:1 等角公式 [GridSystem.js:7-16](../assets/js/systems/GridSystem.js) |
| `snapWorldToGrid` | 投影 | 依賴 `worldToGrid` |
| `getCellCenter` | 投影 | = `gridToWorld` |
| `getCellDiamond` | **投影** | 菱形四頂點 :22-31 |
| `getFootprintSize` / `getFootprintCells` | **邏輯** | 純格座標、`rotation%2` 交換寬高 :32-41 |
| `getFootprintPolygon` | 橋接 | 用 `getCellDiamond`（投影）組 footprint 多邊形 :42-49 |
| `getAnchor` | 橋接 | 用 `getFootprintPolygon`（投影）+ `layer==='floorDecoration'` 判斷中心/腳底 :50-59 |
| `isInsideGrid` / `isPlaceableCell` | **邏輯** | 邊界 + `placeableMask` :60-61 |

### 可否拆成 SpatialGrid / SceneProjection？—— **可以，且切線乾淨**

- **SpatialGrid（邏輯）**：`getFootprintSize/Cells`、`isInsideGrid`、`isPlaceableCell`、房間邊界、`placeableMask`、行走節點（cols/rows）。這些**完全不含投影**。
- **SceneProjection（投影）**：`gridToWorld`、`worldToGrid`、`getCellDiamond`、`getFootprintPolygon`、`getAnchor`、（新）socket→world。這些**只讀 SpatialGrid 的邏輯結果**再投到世界座標。
- `getFootprintPolygon`/`getAnchor` 屬 Projection（產出世界多邊形），但**吃 SpatialGrid 的 footprint cells**——依賴方向單一（Projection → Grid），無循環。

### 對各系統的影響（實測消費者）

| 系統 | 是否用投影？ | 證據 | 遷移影響 |
|---|---|---|---|
| **OccupancySystem** | **否**（只用 `getFootprintCells`、`room.entrance`） | [OccupancySystem.js:12-24](../assets/js/systems/OccupancySystem.js) | **零** |
| **PlacementSystem** | **否**（`getFootprintCells`/`isInsideGrid`/`isPlaceableCell`） | [PlacementSystem.js:13-16](../assets/js/systems/PlacementSystem.js) | **零** |
| **StoreLayoutValidator** | 否（走 placement 的邏輯） | [StoreLayoutValidator.js](../assets/js/systems/StoreLayoutValidator.js) | 零 |
| **grid-pathfinder** | 否（純 cols/rows + isWalkable） | [grid-pathfinder.js](../assets/js/core/grid-pathfinder.js) | 零 |
| **SaveAdapter.migrateIfNeeded** | 否（`getFootprintCells`/`isInside`/`isPlaceable`） | [SaveAdapter.js:100-129](../assets/js/systems/SaveAdapter.js) | 零 |
| **CameraController** | **否**（只讀 `room.worldWidth/Height`、`room.camera`；縮放用 Phaser `getWorldPoint`） | [CameraController.js:20-33,125-131](../assets/js/systems/CameraController.js) | 只要 world 尺寸不變即零 |
| **DepthSystem** | 間接（吃 anchor 的 `worldY`） | [DepthSystem.js](../assets/js/systems/DepthSystem.js) | 平面下仍有 worldY，語意不變 |
| **FurnitureEntity** | 是（`getAnchor`）+ depth | [FurnitureEntity.js:6,24,38-45](../assets/js/entities/FurnitureEntity.js) | 改走 `projection.getAnchor` |
| **FurnitureDragController** | 是（`getAnchor/getCellCenter/getCellDiamond/getFootprintPolygon/snapWorldToGrid`）；並有觸控 `-36px` 微調 | [FurnitureDragController.js:129-226](../assets/js/phaser/FurnitureDragController.js) | 機械式改走 projection；`-36` 需按投影重新校準 |
| **CafeScene.drawRoom** | 是（`getCellDiamond`） | [CafeScene.js:120-146](../assets/js/scenes/CafeScene.js) | 房間美術需依投影重畫幾何 |
| **CatBehaviorController** | 是（`getCellCenter` 移動、`snapWorldToGrid` 佔格） | [CatBehaviorController.js:43,117,172](../assets/js/phaser/CatBehaviorController.js) | 改走 projection |
| **ArtDebugRenderer** | 是（socket/anchor 疊圖） | [ArtDebugRenderer.js:51-66](../assets/js/phaser/ArtDebugRenderer.js) | 改走 projection |

### 存檔 `x/y/r` 影響
`state.items` 儲存的是**邏輯格 `x,y` 與 rotation `r`（0–3）**（[SaveAdapter.js:37,72-75](../assets/js/systems/SaveAdapter.js)）。這些是**投影無關**的資料。**換投影不需要搬動家具，也不需改存檔**——只有「同一組 `x/y/r` 被投到不同世界位置」。這是方案 B 相容性的關鍵。

### 結論
Grid/Projection 拆分是**低風險、可漸進**的：先做**純重構**（抽出 `SceneProjection.Iso`，`GridSystem` 內部委派，對外 API 不變、測試不動），再在其後才新增 `SceneProjection.Flat`。詳見 §13 Stage 1–2。

---

## 6. C — 家具素材沿用程度

### 現況
- 47 件家具定義（[furniture-config.js](../assets/js/config/furniture-config.js)），layer 分布：**39 `floorObject`、6 `floorDecoration`（地毯）、2 `wallObject`（windowHammock、photoBackdrop）**。
- 25 件已重繪為**四方向透明 PNG**（`assets/furniture/redrawn/{id}/{id}-{dir}.png`，`textureByDirection`+`texturePathByDirection`）；其餘 22 件為**單方向 PNG**，用 mirror/fallback 補方向（[furniture-visual-config.js:157-200](../assets/js/config/furniture-visual-config.js)、[furniture-direction.js:26-40](../assets/js/core/furniture-direction.js)）。
- 素材是 **2:1 等角透視**像素圖（ART_BIBLE §2、§8）：光源左上、腳底 anchor、依 footprint 沿 Grid 軸延伸。

### 沿用估算

| 情境 | 可沿用比例 | 理由 |
|---|---|---|
| **保留 2:1（方案 A）** | **≈100%** | 投影不變，素材完全對位 |
| **淺俯視/斜投影（方案 B 的建議顯示）** | **高（≈80–100%）** | 若新投影維持相近的斜角（非正射），等角素材的透視仍成立；主要調整 `visualScale`、`anchor`、socket 對位，多數不必重畫 |
| **正射 top-down / 矩形（方案 C）** | **低（大量重畫）** | 素材內建的等角前縮與側面暗面會與正上方視角衝突；家具、牆、地板幾乎全需重繪 |

### 逐類沿用建議
- **可直接沿用**：地毯（6 件 floorDecoration，`mirrorAllowed`）、對稱圓桌（roundTable/pinkTable）。
- **只需調 scale/anchor/socket**：多數座位與桌（chair/cushionChair/table 系列）、營業設備（counter/coffeeMachine/oven/washStation/smartOrder）——四方向圖已存在，平面下主要是重新校準 `visualScaleById`、`anchor`、socket gridOffset。
- **可能需重畫**：牆面與地板幾何（由 `drawRoom` 程序繪製，非素材），以及若採方案 C 則幾乎全部。

### 四方向圖片在平面方案中的用途
四方向（down-right/left、up-right/left）本質是**四個朝向**，不是四個相機角度。平面／淺俯視若保留「角色與家具有左右＋前後朝向」，四方向圖**仍直接對應 rotation 0–3**（[furniture-direction.js:8-24](../assets/js/core/furniture-direction.js)），可原樣沿用。只有正射純頂視才會讓四方向失去意義。

### 相容層可避免立即重畫
`getFurnitureDisplayState`（[furniture-display-state.js](../assets/js/core/furniture-display-state.js)）已是**顯示相容層**：entity 與 ghost 共用它取得 texture/anchor/scale/flip。新增投影時，讓此層在「平面模式」回傳調整後的 `anchor/scale`，即可**不動素材**先跑起來，逐件再精修。→ **不需、也不應提「全部重畫」**。

### `childrenPlayArea` 現況
- footprint 3×2、`layer:"floorObject"`（[furniture-config.js:968](../assets/js/config/furniture-config.js)）、stationType `decoration`、art status **`redraw`**（唯一未升 production 者，陰影邊緣待精修，見 [PROTOTYPE_REDRAW_RESULT.md](./PROTOTYPE_REDRAW_RESULT.md)）。
- **影響**：它是 `floorObject` → **會阻擋行走**（正確，是實體遊戲區）。切勿因 stationType 是 `decoration` 就誤判為可穿越（見 §7 的 walkBlocking 陷阱）。

---

## 7. D — 家具工作站系統

### `stationType` 與 `interactionSockets` 實際狀態
- **完整存在**：`stationById` 涵蓋全部 47 件（[furniture-visual-config.js:98-112](../assets/js/config/furniture-visual-config.js)）；`socketsFor()`（:118-132）依 station 產出 socket，型別**與任務清單完全一致**：`customer-seat / customer-table / customer-order / customer-pay / staff-use / staff-work / staff-serve / serve-pickup / cat-rest / cat-play`（另有 `customer-view`）。
- 每個 socket 形如 `{id, type, gridOffset:{x,y}, facing, capacity=1}`（:114-116）。
- **零 Runtime 消費者**：全專案 grep 顯示 `interactionSockets`/`stationType` 只被 [furniture-visual-validator.js](../assets/js/core/furniture-visual-validator.js)（驗證）與 [ArtDebugRenderer.js](../assets/js/phaser/ArtDebugRenderer.js)（Debug 疊圖）讀取。**沒有任何 gameplay 使用 socket。**

### 逐步建立 StationRegistry 的分析

| 問題 | 現況 / 建議 |
|---|---|
| 如何從家具建立工作站 | 掃 `state.items` → 查 `FURNITURE_VISUAL_CONFIG[type]` 的 `stationType`+`interactionSockets` → 依 `item.x/y/r` 展開成世界/格層級的 station 實例。**建議建成獨立 `StationRegistry`，快取結果。** |
| **旋轉後 socket 如何轉換** | **目前完全未實作**：socket `gridOffset`/`facing` 只針對 `r=0` 撰寫。需新增「依 rotation 轉換 gridOffset 與 facing」的純函式。注意 rotation 語意特殊：`getFootprintSize` 以 `rotation%2` 交換寬高（[GridSystem.js:32-34](../assets/js/systems/GridSystem.js)），四方向對應 down-right/left/up-right/up-left（非單純 90° 旋轉），socket 轉換必須與此一致。**這是 D 的主要新工作。** |
| socket 是否可到達 | 需新增 reachability：socket 站立格必須 `isPlaceableCell` 且不在 `getWalkabilitySnapshot()` 內、或可由入口 BFS（`grid-pathfinder`）抵達。 |
| 椅桌如何配對 | 已有 `PlacementSystem.hasAdjacentTable`（[PlacementSystem.js:30-39](../assets/js/systems/PlacementSystem.js)）與 `StoreLayoutValidator` 的相鄰判定，可升級為「seat.customer-seat ↔ 相鄰 table.customer-table」配對。 |
| 顧客端 vs 工作端 | 由 socket `id` 前綴區分（`customer-*` vs `staff-*`/`serve-*`）。 |
| 何時重建 Registry | 佈局變更時。已有 hook：`FurnitureDragController.cleanup({layoutChanged})` → `catBehaviorController.onFurnitureLayoutChanged()`（[FurnitureDragController.js:291-303](../assets/js/phaser/FurnitureDragController.js)）。StationRegistry 可掛同一個 `layoutChanged` 事件重建，**不需每幀掃描**。 |
| 避免每幀掃全部家具 | Registry 只在 build/`layoutChanged` 時重算；每幀查詢走快取索引。 |
| StoreLayoutValidator 升級 | 從「椅子有無鄰桌」擴充為「開店前檢查：至少 N 組可用座位、至少 1 個 order/serve/pay 可到達站」。 |
| **地毯/裝飾不得誤成阻擋** | **關鍵陷阱**：`walkBlocking` 由 **`layer`** 推導（`layer!=='floorDecoration' && layer!=='wallObject'`，[furniture-visual-config.js:189](../assets/js/config/furniture-visual-config.js)），**不是** stationType。地毯是 `floorDecoration`（不擋，正確），但 plant/bookshelf/childrenPlayArea 是 `floorObject`（擋，正確）雖 stationType 皆為 `decoration`。**StationRegistry 判斷阻擋必須讀 `layer`，切勿以 stationType==='decoration' 反推可穿越。** |

---

## 8. E — 顧客與訂單狀態機

### 現況
- `CustomerEntity` 是**幾何 placeholder**（陰影橢圓＋矩形身體＋圓頭＋☕文字），只有 `walkTo` tween，無狀態、無尋路（[CustomerEntity.js](../assets/js/entities/CustomerEntity.js)）。ART_BIBLE §9 明言正式角色不得用幾何圖形。
- 流程是假的：`maybeSpawnCustomer` 生成→tween 到固定點→`delayedCall(2600)`→`dailyRevenue+=320; dailyRep+=6; servedCustomers++`→tween 回入口→destroy（[CafeScene.js:296-312](../assets/js/scenes/CafeScene.js)）。**無座位/點餐/製作/付款概念。**

### 最小可行狀態機（MVP）
建議先實作**精簡子集**，非任務列出的完整清單一次到位：

**Customer**：`SPAWNING → ENTERING → FINDING_SEAT → SEATED → ORDER_PLACED → WAITING_FOR_FOOD → EATING → PAYING → LEAVING → COMPLETED`，加 `ABANDONED`（無座位/等太久）。MVP 可先略過 `QUEUING`、`READING_MENU`、`CAT_INTERACTION`、`WAITING_TO_PAY` 的獨立狀態（併入相鄰狀態或用 Reaction 表現）。

**Order**：`CREATED → ASSIGNED → PREPARING → READY → DELIVERED → PAID → COMPLETED`，加 `CANCELLED`。MVP 可先略過 `QUEUED`、`WAITING_FOR_DELIVERY`、`CONSUMED`（併入 `READY`/`DELIVERED`/`EATING`）。

### 關鍵問答

| 問題 | 建議 |
|---|---|
| 哪個系統擁有狀態 | `CustomerFlowSystem` 擁有顧客狀態；`OrderSystem` 擁有訂單狀態。**兩者皆為純規則模組**（比照 [care-interaction-core.js](../assets/js/core/care-interaction-core.js)）。 |
| Entity 是否只負責顯示 | **是**。`CustomerEntity` 只讀狀態播動畫/走位，不持有流程或經濟（修正目前把經濟放進 scene 的反模式）。 |
| 狀態轉換由什麼觸發 | 事件＋條件：到達 socket、station 空出、計時完成（**但計時是「製作需時」的真實資源，不是假裝完成**）、玩家/員工動作。 |
| **何時增加營收** | 只在 `Order: PAID` 的**單一 commit 點**由 `EconomySystem` 加，且帶冪等旗標（見下）。 |
| 等太久如何處理 | 顧客狀態帶 `patience`，逾時 → `ABANDONED` + 負面 Reaction；不計營收。 |
| 沒有座位/設備 | `FINDING_SEAT` 找不到可到達 `customer-seat` → 短暫等待→`ABANDONED`；`OrderSystem` 找不到可用 station → 訂單留在 `CREATED`/`QUEUED` 佇列。 |
| 遊戲暫停 | 由 `CafeRuntime` 提供 paused 旗標；所有 system 的 `update` 在 paused 時早退（比照 `CatBehaviorController.update` 的 `pausedReasons`，[CatBehaviorController.js:60-61](../assets/js/phaser/CatBehaviorController.js)）。 |
| 關頁/重載保存哪些 | **MVP 建議：不保存進行中的顧客與訂單**（重載後清空重生）；只保存**已結算的經濟結果**（`coins/reputation/dailyRevenue…`，已在 save）。 |
| MVP 可否先不保存進行中顧客/訂單 | **可以，且建議如此**（降低 schema 風險）。日後再評估 `cafeRuntime.customers/orders` 序列化。 |
| **避免重複結帳/重複加營收** | 直接沿用 [care-interaction-core.js:76-99](../assets/js/core/care-interaction-core.js) `commitCareSession` 的 `committed` 旗標模式：`OrderSystem.pay(order)` 檢查 `order.paid` 為真則 `applied:false`，只加一次營收。 |

> **不要**一開始就設計完整餐廳模擬器；先讓上面精簡循環**真的可見**且**營收來自 PAID**。

---

## 9. F — 店貓生活行為

### 現況（`CatBehaviorController` + `cat-behavior-core`）
- 狀態：`IDLE / WALKING / SITTING / SLEEPING`（+`PAUSED`；`SERVING` 定義但未用）。
- **只做隨機漫遊**：`chooseCatTarget` 在 2–6 格內隨機選可走格；`finishPath` 用隨機骰決定坐/睡/idle（[cat-behavior-core.js:27-47](../assets/js/core/cat-behavior-core.js)）。
- **未使用需求資料**：`catStats`（satiety/mood/clean/bond）存在於 save，但**不參與行為選擇**。
- **未使用家具 socket**：貓漫遊到隨機格，**不會**前往 `cat-rest`/`cat-play`。
- `personality` 只是顯示字串（[cat-config.js:30-59](../assets/js/config/cat-config.js)），非行為權重；無疲勞欄位。

### 已滿足的關鍵要求（重要）
- **無每貓 Timer**：`CatBehaviorController.update()` 單一迴圈掃所有貓，決策以 `nextDecisionAt` 時間戳閘控（[CatBehaviorController.js:60-73](../assets/js/phaser/CatBehaviorController.js)）。→ 任務擔心的「每貓大量 Timer」**現況已避免**，升級時延續此模型即可。
- **目標被占用**：`getReservedCatCells` + repath 已處理（:157-165、:103-112）。
- **不走牆/家具**：`isWalkableCell` = `isPlaceableCell` && 不在 `getWalkabilitySnapshot()`（:56-58）。

### 分階段升級
- **第一階段就需要**：`observe`（看四周）、`groom`（舔毛）、`stretch`（伸懶腰）——皆為**原地動畫狀態**，可在 `finishPath` 的休息選擇中加入，成本低、立刻提升生命感。加上 `use-cat-bed`/`use-cat-play`（前往家具 socket）作為第一批「有目的移動」。
- **後續**：`approach-customer`/`avoid-customer`（需 CustomerFlowSystem 就緒）、`request-care`/`receive-care`（接上 CareInteraction）、需求驅動的 `sleep`。
- **需求驅動選擇**：把 `chooseCatTarget` 升級為「依 satiety/mood/clean/bond/疲勞/個性/附近事件加權」的純函式（仍在 `cat-behavior-core`，Node 可測）。個性從顯示字串擴為數值傾向（如 `socialBias`、`restBias`）——**新欄位需加進 cat-config 與 save 預設**。
- **使用家具 socket**：向 `StationRegistry` 查詢 `cat-rest`/`cat-play` 的可到達 socket 作為目標；到達後播對應休息動畫。目標被占用 → 走既有 reserved/repath 路徑。
- **保持自然四足**：所有升級都是「貓自己的需求與家具」，**不接入 staff 工作站、不端餐、不收銀**（DEC-005）。`SERVING` 狀態應保留給未來員工，不給店貓。

---

## 10. G — 通用 Reaction System

### `CatReactionBubble` 是否適合泛化？—— 部分可，需重寫為系統
現況只支援：綁 `catEntity`、單一文字泡泡、固定 `depth 21000`、單一 duration、無 icon/愛心/汗滴、**無優先級/冷卻/上限/事件觸發/鏡頭外處理**（[CatReactionBubble.js](../assets/js/entities/CatReactionBubble.js)）。可保留「跟隨世界座標的浮動標籤」概念，但需升級為受管理的系統。

### 目標 Reaction System 需求
| 面向 | 建議 |
|---|---|
| 資料模型 | `{id, actorRef, kind:'emoji'|'text'|'heart'|'sweat'|'exclaim'|'station-done'|'anim'|'particle', payload, priority, duration, cooldownKey, soundEvent?}` |
| 優先級 | 高（設備完成、abandoned）> 中（點餐/上餐）> 低（看四周/貓舔毛）。 |
| 冷卻 | 以 `(actorId, cooldownKey)` 記錄 `lastShownAt`，同鍵冷卻內不重播（避免同句反覆）。 |
| 單一角色同時上限 | 每 actor 最多 1（新的高優先可取代低優先）。 |
| 全場上限 | 全域並發上限（如 ≤6）；超過時只保留高優先，低優先丟棄。 |
| 普通 vs 重要 | 重要事件必顯示（可蓋過上限一格）；普通事件受預算與冷卻約束。 |
| 鏡頭外 | 以 `camera.worldView` 判斷，鏡頭外的普通反應**略過**（節省效能與畫面雜訊）。 |
| 避免重複同句 | 記錄 actor 最近用過的台詞索引，優先換句（比照 `selectCareReaction`）。 |
| 事件觸發 | **應**透過 Event Bus：system 只 `emit('reaction', payload)`，由 `ReactionSystem` 訂閱決定顯示，**與遊戲邏輯解耦**。 |
| 顯示層 vs 邏輯層責任 | 邏輯 system 不建立 Phaser 物件；`ReactionSystem` 是唯一建立/回收泡泡與粒子的顯示層，並自行做預算/冷卻/裁切。 |

---

## 11. H — 手機場景與 UI 邊界

### 現況（Phaser Canvas vs DOM）
- **DOM（[index.html](../index.html)）**：頂部 `#gameHud`（品牌 + coins/reputation/energy/xp + 每日營運卡含開店/下一階段）、`#gameBottomBar`（5 顆：商店/放置輔助/照顧/報告/設定）、四個 modal 面板（store/care/report/settings）、`#selectionBar`（旋轉/收納/出售/取消）、`#gameToast`、`#bootOverlay`。
- **Phaser**：場景、家具、貓、顧客、reaction 泡泡、氛圍效果。
- **橋接**：`UiBridge` 訂閱 `game.events` 更新 DOM，按鈕呼叫 `scene()?.method()`（[UiBridge.js:43-103](../assets/js/ui/UiBridge.js)）。DOM 契約由 `dom-contract.js`（35 IDs + 13 巢狀選擇器）強制。
- **無永久側邊按鈕堆疊**（已符合 DEC-004）；已有 bottom bar。

### 分析
| 問題 | 建議 |
|---|---|
| 留在 Phaser | 世界內的一切：場景、角色、家具、reaction 泡泡、station 提示、浮動愛心/汗滴。 |
| 用 DOM | 資源 HUD、營業狀態、bottom drawer（商店）、浮動顧客卡、每日報告、設定、選取列。 |
| UiBridge 擴充 | 新增對 `customer-*`/`order-*`/`reaction`（若走 DOM 卡）事件的訂閱；維持「Runtime 只 emit，DOM 只讀」。 |
| UI 事件如何與 Runtime 解耦 | 已解耦（event bus + `window.gameController`，[main.js:73-81](../assets/js/main.js)）；V0.56 應把 ad hoc 字串整理成**事件目錄**，不改變方向。 |
| Pointer/拖曳/Camera/放置/角色點擊避免衝突 | **已有單一輸入仲裁 FSM**：`InputModeController` + `input-state.js` 定義 `INPUT_MODE` 與允許轉移（[input-state.js:12-25](../assets/js/core/input-state.js)）。新互動（點貓小選單、顧客卡）應**註冊為新 mode 或複用 `CAT_INTERACTION`**，不要繞過 FSM。 |
| Safari 地址列 | `main.js` 已監聽 `visualViewport` resize/scroll 並 `game.scale.resize`（[main.js:104-114](../assets/js/main.js)）；Camera 以 world bounds cover（[CameraController.js:24-33](../assets/js/systems/CameraController.js)）。世界座標不隨地址列改變。此為既有機制，H 階段勿破壞。 |

> 本次不修改 CSS/UI；以上為後續 Task Card 的邊界依據。

---

## 12. I — SaveAdapter 與版本遷移

### 現況
- `CURRENT_KEY='catCafePhaserV0540'`；`sceneSchemaVersion:5401`；`MIGRATION_COMPLETED_VERSION=5401`；legacy keys + `catCafeLegacySaveBackupV0532` 備份（[SaveAdapter.js:1-4,20-38](../assets/js/systems/SaveAdapter.js)）。
- items 格式：`{id,type,x,y,r}`（邏輯格）；`catStats`：per-cat `satiety/mood/bond/clean/lastCareAt/careCount/lastCareMode`；`tasks:{serve,care,revenue}`；營運數值 `coins/reputation/xp/day/phase/dailyRevenue…`。
- 執行期另加 `state.catPositions[id]={id,gridX,gridY}`（[CatBehaviorController.js:230-236](../assets/js/phaser/CatBehaviorController.js)）。
- `normalizeState` 做 `{...defaults,...parsed}`（:65-67）→ **對新增頂層欄位天然前向相容**：舊存檔缺欄位取 default，未知欄位 round-trip 保留。
- 一次性佈局遷移由 `migrateIfNeeded` 以 `migrationCompletedVersion>=5401` 閘控，只用邏輯格函式（投影無關）。

### 未來新增欄位的處置

| 資料 | 保存？ | 理由 |
|---|---|---|
| `managerProfile`（店長資料模型） | **保存** | 玩家身份，需持久 |
| `projectionMode` / `layoutVersion` | **保存**（小） | 記住玩家偏好投影/佈局版本 |
| `cafeRuntime`（進行中顧客/訂單） | **MVP 不保存** | 重建成本低、schema 風險高 |
| station cache | **不保存** | 由家具 + StationRegistry 於載入時重建 |
| 貓行為狀態（path/nextDecisionAt） | **不保存**（`catPositions` 已足夠） | 行為可重建；只需邏輯位置 |
| 已結算經濟（coins/rep/day…） | **保存**（現況已保存） | 玩家進度 |

### 策略建議
1. **key 不變**：續用 `catCafePhaserV0540`；新增只走**頂層加欄位 + 補進 `defaultState()`**，不動既有欄位語意。
2. **schema 版本**：需要真正遷移時才 bump `sceneSchemaVersion`，並仿 `migrateIfNeeded` 加**獨立、冪等、可跳過**的遷移區塊。純加欄位可不 bump（靠 `{...defaults,...parsed}`）。
3. **保留舊 `x/y/r`**：投影變更**不改** items 座標（§5 結論）。
4. **換投影不搬家具**：`projectionMode` 只影響顯示投影函式，不寫回 items。
5. **失敗回復**：沿用現有 try/catch + legacy 備份（load 失敗回 `defaultState`，legacy 不覆寫，[SaveAdapter.js:47-64](../assets/js/systems/SaveAdapter.js)）；新增遷移必須「失敗則保留原資料、標 warning、不半寫」。
6. **暫留舊投影模式**：建議 `projectionMode` 支援 `iso`（預設）與 `flat`，可即時切換與回退，作為 rollback 手段。

---

## 13. 三種技術方案比較

> 全部為 **Proposed**。Claude Code 可推薦，但推薦僅為建議，未經產品核准不得寫成 Accepted。

- **方案 A**：保留現行 2:1 等角 Grid，只改善 Camera、房間美術、UI 與流程呈現。
- **方案 B**：保留邏輯格、家具座標、Occupancy 與存檔，**抽離 `SceneProjection`**，新增可切換的平面／淺俯視顯示模式。
- **方案 C**：建立全新矩形 Grid、矩形房間與新座標系統，再遷移家具與存檔。

| 評估面向 | 方案 A | 方案 B（建議） | 方案 C |
|---|---|---|---|
| 與產品目標符合度 | 中（生命感可達，但直立可讀性受限於陡等角） | **高** | 高（但代價極大） |
| 手機直立可讀性 | 低–中 | **中–高** | 高 |
| 角色工作流程呈現 | 可（與投影無關） | **可** | 可 |
| 家具素材沿用 | ~100% | **~80–100%** | 低（大量重畫） |
| furniture ID 相容 | 完全 | **完全** | 完全（但需遷移座標） |
| footprint 相容 | 完全 | **完全** | 需重新定義 |
| 存檔相容 | 完全 | **完全（x/y/r 不變）** | 需 schema+座標遷移 |
| Placement 影響 | 無 | **無（投影無關）** | 全面改寫 |
| Occupancy 影響 | 無 | **無（投影無關）** | 全面改寫 |
| Camera 影響 | 小 | **小（world 尺寸不變則零）** | 需重設 bounds/zoom |
| Depth 影響 | 無 | 小（worldY 語意保留） | 需重設 |
| 路徑系統影響 | 無 | **無（純 cols/rows）** | 需驗證 |
| 家具拖曳影響 | 小 | 中（改走 projection + 校準觸控偏移） | 大 |
| Art Debug 影響 | 無 | 小（改走 projection） | 大 |
| 測試修改量 | 小 | **中（新增 projection 測試；既有邏輯測試不動）** | 大 |
| 實作複雜度 | 低 | **中** | 高 |
| 失敗風險 | 低 | **中低** | 高 |
| 可漸進導入 | 是 | **是（先純重構，再加 Flat）** | 難 |
| 可快速回復 | 是 | **是（`projectionMode` 切回 iso）** | 難 |
| 後續顧客/訂單適配 | 好 | **好** | 好 |
| 後續店貓行為適配 | 好 | **好** | 好 |

### Proposed 建議：**方案 B**
理由：
1. **可讀性與相容性的最佳折衷**：邏輯格、家具座標、Occupancy、Placement、Pathfinding、存檔**全部不變**（§5 實測），只換「同一組 `x/y/r` 的世界投影」。
2. **可漸進、可回復**：先做**純重構**（抽 `SceneProjection.Iso`，API 不變、測試不動），再加 `SceneProjection.Flat` 與 `projectionMode`，隨時切回 `iso`。
3. **素材風險低**：等角素材在淺斜投影多數可沿用（§6），透過既有相容層 `getFurnitureDisplayState` 逐件精修，不必全部重畫。
4. **與生命感正交**：Station/Customer/Order/Reaction 不依賴投影，可平行推進，不被投影決策卡住。

> 若產品優先「最大化直立可讀性」且願承擔重畫與遷移成本，才考慮方案 C；但本稽核不建議在營運系統尚未成形前先付 C 的代價。

---

## 14. 目標架構草案評估（§8 逐模組）

| 建議模組 | 真的需要？ | 最小責任 | 不應負責 | 依賴 | 可延後？ | 過度設計風險 |
|---|---|---|---|---|---|---|
| **CafeScene** | 是（既有） | 生命週期、系統初始化與連接 | 經濟、流程、投影數學 | 全部 system | 否 | 低 |
| **CafeRuntime** | 是 | 營業狀態/時間/暫停/開店打烊 | 經濟金額計算 | EconomySystem、EventBus | 部分（可與經濟一起） | 低 |
| **SpatialGrid** | 是 | 邏輯座標/邊界/footprint/placeable mask/行走節點 | 世界投影 | 無 | 否（Stage 1） | 低 |
| **SceneProjection**（Iso/Flat） | 是 | gridToWorld/worldToGrid/anchor/polygon/socket 投影 | 邏輯/佔用 | SpatialGrid | 否（Stage 1–2） | 中（勿一次做太多投影） |
| **StationRegistry** | 是 | 由家具建站、socket 旋轉、可到達性、椅桌配對 | 顧客/訂單狀態 | SpatialGrid、Projection、Occupancy | 否（Stage 4） | 中 |
| **CustomerFlowSystem** | 是 | 顧客狀態機 | 訂單製作、經濟 commit | StationRegistry、ActorTask、EventBus | 否（Stage 5） | 高（勿一次做完整清單） |
| **OrderSystem** | 是 | 訂單狀態/製作佇列/設備分配/完成取消 | 顧客位移、營收金額規則 | StationRegistry、Economy、EventBus | 否（Stage 5–6） | 高 |
| **ActorTaskSystem** | 是（但可精簡） | 角色任務：目標格→路徑→到達通知 | 業務語意（誰為何而去） | Pathfinder、Projection | 部分（可先併入各 controller） | 中 |
| **CatBehaviorSystem** | 是（既有升級） | 貓需求/個性/家具使用/顧客互動 | 員工工作、端餐收銀 | StationRegistry、EventBus | 部分（Stage 7） | 中 |
| **ReactionSystem** | 是 | 泡泡/表情/優先級/冷卻/上限/裁切 | 遊戲邏輯狀態 | EventBus、Camera | 部分（Stage 8） | 中 |
| **EconomySystem** | 是 | 營收/人氣/小費/每日報告（單一冪等 commit） | 顧客/訂單狀態 | EventBus | 否（**最先拆**） | 低 |
| **SceneEventBus** | 是（正規化既有 `game.events`） | 系統間事件/UI 通知/Reaction 觸發 | 保存狀態 | 無 | 否（Stage 1 起） | 低（勿造第二套 emitter） |
| **SaveAdapter** | 是（既有擴充） | schema migration/店長/家具/貓/營運 | 業務規則 | 無 | 否 | 低 |

**避免過度設計的原則**：`ActorTaskSystem` 初期可先作為薄封裝（複用 `grid-pathfinder` + `CatBehaviorController` 的移動模式），不必一開始就抽象化所有角色；`SceneEventBus` 直接沿用 `game.events`，只加型別化事件目錄，不另建 emitter。

---

## 15. 仍需產品負責人決定的問題

1. **投影方案**：A / B（建議）/ C，其一。
2. **平面「淺斜」還是「正射」**：影響素材沿用比例（§6）；建議淺斜以沿用等角素材。
3. **MVP「staff 工作」由誰執行**：目前無員工角色、店貓非店員（DEC-005）、店長是否入場未定（DEC-006）。MVP 的「製作/送餐」需在下列擇一：(a) 隱形/時間+設備閘控的 barista（不可用盲目 timer）、(b) 店長 placeholder 角色、(c) 玩家點擊送餐。→ **此決策直接決定 Customer/Order 的角色接線。**
4. **是否保存進行中顧客/訂單**：建議 MVP 不保存（§8、§12）。
5. **店長是否需實體出現在場景**（DEC-006 未定），影響 ActorTaskSystem 與美術。

---

## 16. 主要判斷 ↔ 檔案索引（快速查證）

- God object：[CafeScene.js](../assets/js/scenes/CafeScene.js)（經濟 253-295、假顧客 296-312）
- Grid/投影切線：[GridSystem.js](../assets/js/systems/GridSystem.js)
- 投影無關證明：[OccupancySystem.js](../assets/js/systems/OccupancySystem.js)、[PlacementSystem.js](../assets/js/systems/PlacementSystem.js)、[grid-pathfinder.js](../assets/js/core/grid-pathfinder.js)、[CameraController.js](../assets/js/systems/CameraController.js)、[SaveAdapter.js:100-129](../assets/js/systems/SaveAdapter.js)
- Station/socket 資料（無消費者）：[furniture-visual-config.js:98-132](../assets/js/config/furniture-visual-config.js)
- walkBlocking 由 layer 推導：[furniture-visual-config.js:189](../assets/js/config/furniture-visual-config.js)
- 冪等 commit 範式：[care-interaction-core.js:76-99](../assets/js/core/care-interaction-core.js)
- 單一輸入 FSM：[input-state.js](../assets/js/core/input-state.js)、[InputModeController.js](../assets/js/phaser/InputModeController.js)
- 事件橋：[UiBridge.js](../assets/js/ui/UiBridge.js)
- 存檔前向相容：[SaveAdapter.js:65-99](../assets/js/systems/SaveAdapter.js)

---

*本稽核未修改任何 Runtime／HTML／CSS／素材／存檔。實作階段、任務拆分與驗收 Gate 見 [V056_IMPLEMENTATION_PLAN.md](./V056_IMPLEMENTATION_PLAN.md)；產品決策摘要見 [V056_PRODUCT_DECISION.md](./handoffs/V056_PRODUCT_DECISION.md)。*
