# V0.56 平面化咖啡廳與營運生命感 — 實作計畫

- 任務 ID：`ARCH-0560-FLAT-CAFE-AUDIT`（規劃階段）
- 基線：`V0.55.2-alpha` / Build `0552a` / Phaser `3.90.0` / 存檔 key `catCafePhaserV0540`
- 依據：[V056 架構稽核](./V056_ARCHITECTURE_AUDIT.md)
- 相關：[產品決策交接](./handoffs/V056_PRODUCT_DECISION.md)｜[決策紀錄](./decisions.md)｜[路線圖](./roadmap.md)｜[Task Card 模板](./templates/TASK_CARD.md)

> **狀態：本計畫所有技術方案為 Proposed。** 未經產品負責人核准前，任何階段都不得開始 Runtime 實作。本文只作規劃。

---

## 1. 目標架構（採方案 B 為前提）

```
CafeScene ── 生命週期 / 系統裝配 / 連接（薄化 God object）
  ├─ CafeRuntime ........ 營業狀態、時間、暫停、開店/打烊
  ├─ SpatialGrid ........ 邏輯座標、房間邊界、footprint、placeable mask、行走節點
  ├─ SceneProjection .... Iso（現況）/ Flat（新）：gridToWorld/worldToGrid/anchor/polygon/socket
  ├─ StationRegistry .... 由家具建站、socket 旋轉、可到達性、椅桌配對
  ├─ OccupancySystem .... （沿用）分層佔用、walkability snapshot
  ├─ PlacementSystem .... （沿用）放置驗證
  ├─ CustomerFlowSystem . 顧客狀態機（純規則）
  ├─ OrderSystem ........ 訂單狀態機、製作佇列、設備分配（純規則）
  ├─ ActorTaskSystem .... 角色任務：目標→路徑→到達通知
  ├─ CatBehaviorSystem .. （升級）需求、個性、家具使用、顧客互動
  ├─ ReactionSystem ..... 泡泡/表情/優先級/冷卻/上限/鏡頭裁切
  ├─ EconomySystem ...... 營收/人氣/小費/每日報告（單一冪等 commit）
  ├─ SceneEventBus ...... 正規化 game.events：型別化事件目錄
  └─ SaveAdapter ........ （擴充）schema migration、managerProfile、營運資料
```

模組最小責任、依賴與過度設計風險見稽核 §14。核心原則：**規則層純資料（Node 可測）；Phaser/DOM 只作顯示與輸入；單一 Grid/Occupancy/Placement/Camera/Depth/SaveAdapter；不建立第二套世界座標。**

---

## 2. 最小可玩營業循環（MVP）

**可見流程**：顧客進店 → 找座位 → 入座 → 點餐 → 製作 → 完成提示 → 送餐 → 用餐 → 貓咪互動 → 結帳 → **營收增加（來自 PAID）** → 離店。

### MVP 範圍
- 1 種普通顧客、1 種飲品、1 組可用座位、1 個點餐位、1 台製作設備、1 個送餐位、1 個結帳位。
- 3 種反應：成功、等太久、看到貓咪。
- 1 種貓使用貓家具的行為。

### 依賴的家具與現有配置

| MVP 站別 | socket | 候選家具 | 新遊戲 seed 是否已有 |
|---|---|---|---|
| 座位 | `customer-seat` | chair/cushionChair/redChair | **有**（seed 有多張椅） |
| 桌 | `customer-table` | pinkTable/pinkTableLong | **有** |
| 點餐/送餐/收銀 | `customer-order`/`serve-pickup`/`customer-pay` | **counter** | **有**（seed `counter` @7,2） |
| 製作設備 | `staff-use` | coffeeMachine（或先用 counter 抽象製作） | **無**（需玩家放置，或 MVP 用 counter 代製作） |

> seed 定義見 [SaveAdapter.js:6-12](../assets/js/systems/SaveAdapter.js)。**不得修改 seed／家具資料**；MVP 先以 **counter** 同時承擔 order/serve/pay，「製作」用 counter 的 `staff-work` 或玩家自放的 coffeeMachine。

### 還缺的 station/socket 能力
- **socket 旋轉轉換**（目前只 r=0）。
- **socket 可到達性檢查**。
- **StationRegistry 建立與快取**（目前 socket 無消費者）。

### 可用簡化 Placeholder 的角色
- 顧客：暫用現有幾何 `CustomerEntity`（ART_BIBLE §9 要求日後換正式四方向素材，**MVP 標為 placeholder**）。
- 「staff 製作」：依產品決策（稽核 §15.3）可用隱形/設備閘控 barista，**不得用盲目 timer 假裝完成**。

### 可暫時固定的數值
- 飲品價格、製作耗時、顧客耐心值可先固定常數（集中在 config，Codex 可調），但**流程狀態轉換必須真實**（座位/設備/送達為前置條件）。

### 必須正式實作、不得用 Timer 假裝
- 「入座」需真的找到可到達座位；「訂單成立」需真的佔用製作設備；「完成」需製作站真的釋出；「營收」只在 PAID 由 EconomySystem 冪等 commit。

### MVP 完成後如何驗證「不看說明也能理解」
- 人工驗收（手機直立）：不讀任何文字，觀察者能說出「顧客坐下→點餐→餐做好→送到→貓來蹭→付錢→離開」；營收數字只在付款時跳動；等太久的顧客出現不耐煩並離店不計費。

---

## 3. 分階段遷移計畫

> 每階段獨立可回滾。除 Stage 1–3 屬投影（需先核准方案 B），Stage 4–10 屬營運生命感，**不依賴投影決策，可先行**。實際順序依核准調整。

### Stage 0（本任務）— 稽核與計畫
- 目標：交付本稽核＋計畫＋產品決策。
- 存檔影響：無。測試：`npm test`、`check:deploy` 通過。回復：不適用（純文件）。
- 代理：Claude Code。**Gate**：產品選定投影方案 + MVP staff 決策。

### Stage 1 — 空間與 Projection 抽離骨架（純重構）
- 目標：把 `GridSystem` 拆為 `SpatialGrid`（邏輯）+ `SceneProjection.Iso`（投影），`GridSystem` 對外 API 不變、內部委派。
- 前置：方案 B 核准。
- 主要模組：GridSystem→SpatialGrid + SceneProjection.Iso；消費者改走 projection 取得 anchor/polygon/cellDiamond（FurnitureEntity、DragController、CafeScene.drawRoom、CatBehaviorController、ArtDebug）。
- 不做：不新增 Flat；不改投影數值；不動 Occupancy/Placement/Save。
- 存檔影響：**無**。
- 測試：既有 core/drag/footprint 測試**須全綠且不修改期望值**（純重構驗證）；新增 projection 單元測試（gridToWorld/worldToGrid 往返）。
- 人工驗收：iso 畫面與 V0.55.2 **像素一致**。
- 回復：還原重構（單一 commit 邊界）。
- 代理：**Claude Code**（跨檔重構）。**Gate**：全測試綠 + iso 視覺零差異。

### Stage 2 — 平面／淺俯視房間 Prototype
- 目標：新增 `SceneProjection.Flat` 與 `projectionMode`（預設 `iso`），可切換；房間幾何依投影重畫（程序繪製，非素材）。
- 前置：Stage 1 完成。
- 主要模組：SceneProjection.Flat；room 繪製；`projectionMode` 存於 save（頂層新欄位，預設 iso）；DragController 觸控偏移依投影校準。
- 不做：不改 items 座標；不批次重畫家具素材（用相容層 `getFurnitureDisplayState` 逐件調 scale/anchor）。
- 存檔影響：**新增 `projectionMode`（加進 `defaultState`，前向相容，不 bump schema）**。
- 測試：projection Flat 往返測試；家具在 flat 下 footprint↔世界對位測試。
- 人工驗收：手機直立可讀性；家具/貓不走牆；地毯可通行；切回 iso 完全還原。
- 回復：`projectionMode='iso'` 立即回退。
- 代理：**Claude Code**（投影核心）+ Codex（Flat 的 scale/anchor 資料表）。**Gate**：iso/flat 皆可玩且可互切、存檔可逆。

### Stage 3 — 手機場景與 DOM UI 責任調整
- 目標：場景占主要畫面；頂部只留必要資源/營業狀態；商店改 bottom drawer；點貓小選單；顧客浮動卡；報告僅打烊顯示；設定移次層。
- 前置：Stage 2（投影穩定）；**本階段大量 CSS/UI，屬後續 Task Card，非本稽核授權**。
- 主要模組：index.html、CSS、UiBridge（新事件訂閱）、InputModeController（新 mode）。
- 不做：不建立第二套世界座標；不以 CSS 移動 Phaser 物件。
- 存檔影響：無（可加 UI 偏好）。
- 測試：dom-contract 測試更新（若 IDs 變動）；build/deploy 檢查。
- 人工驗收：iPhone Safari 直立、Android Chrome、橫式；Safari 地址列收合不偏移。
- 回復：CSS/HTML 版本還原。
- 代理：Codex（單一 drawer/卡片/CSS）+ Claude Code（事件與輸入接線審閱）。**Gate**：手機直立人工驗收通過。

### Stage 4 — StationRegistry 與開店布局驗證
- 目標：由家具建立 StationRegistry（socket 旋轉轉換 + 可到達性 + 椅桌配對）；升級 `StoreLayoutValidator` 為開店前站別檢查。
- 前置：Stage 1（Spatial/Projection 分離，socket 需投影對位）。
- 主要模組：新 StationRegistry（純規則 + Phaser 投影查詢）；socket 旋轉純函式；StoreLayoutValidator。
- 不做：不改 furniture ID/footprint/socket 資料本身（只新增消費者）；阻擋判定讀 `layer` 不讀 stationType。
- 存檔影響：無（station 於載入時重建，不保存）。
- 測試：**純函式**——socket 旋轉（r=0..3 對位）、可到達性、椅桌配對；地毯/牆物不阻擋、childrenPlayArea 阻擋的回歸。
- 人工驗收：Art Debug 顯示 socket 隨旋轉正確移動。
- 回復：移除 Registry 消費者（資料本就無人用）。
- 代理：**Claude Code**（socket 旋轉/可到達性）+ Codex（socket 純函式測試、station 設定補齊）。**Gate**：socket 旋轉/可到達測試綠。

### Stage 5 — 顧客／訂單狀態機核心
- 目標：以純規則實作 §2 的精簡 Customer/Order 狀態機（Node 可測），取代 `maybeSpawnCustomer` 假流程。
- 前置：Stage 4（需可到達 station）；產品 staff 決策（稽核 §15.3）。
- 主要模組：新 `customer-flow-core`、`order-core`（純函式）；`CustomerFlowSystem`/`OrderSystem` controller；`EconomySystem`（**先於或同步拆出**）。
- 不做：不做完整狀態清單；不保存進行中顧客/訂單（MVP）；營收只在 PAID 冪等 commit。
- 存檔影響：**MVP 不保存進行中流程**；`maybeSpawnCustomer` 的 scene 經濟移入 EconomySystem（行為等價，數值不變或明確調整）。
- 測試：狀態機純函式（含 abandoned、無座位、無設備、暫停）；**冪等付款**測試（重複 pay 不重複加營收，比照 care committed 旗標）。
- 人工驗收：完整可見循環；營收只在付款跳動。
- 回復：feature flag 關閉新流程、還原舊 `maybeSpawnCustomer`（保留為 fallback 一版）。
- 代理：**Claude Code**（狀態機/經濟/接線）+ Codex（core 純函式測試、顧客/飲品設定資料）。**Gate**：狀態機測試綠 + 無重複結帳。

### Stage 6 — 一種飲品的 MVP 營運循環
- 目標：把 Stage 5 接上 Station/Actor/Reaction，跑通單飲品完整循環（§2）。
- 前置：Stage 4、5；Reaction 至少最小版（可與 Stage 8 交錯）。
- 主要模組：ActorTaskSystem（角色移動到 socket）；Customer/Order 接線；EconomySystem 每日報告。
- 不做：不加多飲品/多顧客類型/複雜經濟。
- 存檔影響：已結算經濟沿用現有欄位。
- 測試：整合層（Node 模擬一輪循環 → 營收 +1 次）；既有存檔相容回歸。
- 人工驗收：手機直立「不看說明可理解」驗收（§2 末）。
- 回復：feature flag。
- 代理：**Claude Code**。**Gate**：MVP 可玩性人工驗收通過。

### Stage 7 — 店貓生活行為與家具使用
- 目標：升級 CatBehaviorSystem：加 observe/groom/stretch/use-cat-bed/use-cat-play + 需求驅動選擇；使用 StationRegistry 的 cat-rest/cat-play。
- 前置：Stage 4（station）。
- 主要模組：cat-behavior-core（需求加權純函式）；CatBehaviorController；cat-config（新增個性數值傾向 + save 預設）。
- 不做：不把貓變店員、不端餐收銀（DEC-005）；`SERVING` 不給店貓。
- 存檔影響：cat-config 新增傾向欄位 → catStats/save 補預設（前向相容）。
- 測試：需求加權選擇純函式；目標占用/repath 回歸；無每貓 Timer 回歸。
- 人工驗收：貓會去貓床/跳台、原地舔毛/伸懶腰、看到顧客有反應；仍自然四足。
- 回復：還原 core 選擇函式。
- 代理：**Claude Code**（跨 AI/存檔）+ Codex（單一行為規則、動畫狀態、台詞資料）。**Gate**：行為純函式測試綠 + 效能無退化。

### Stage 8 — 通用 Reaction System
- 目標：把 `CatReactionBubble` 泛化為 `ReactionSystem`（優先級/冷卻/單體上限/全場上限/鏡頭裁切/事件觸發）。
- 前置：SceneEventBus（Stage 1 起可漸進）。
- 主要模組：新 ReactionSystem；各 system 改 `emit('reaction', payload)`。
- 不做：Reaction 不持有遊戲狀態；不建立第二套 emitter。
- 存檔影響：無。
- 測試：優先級/冷卻/上限/裁切純函式（顯示決策可抽為純函式測試）。
- 人工驗收：大量事件下畫面不擁擠、不重複同句、鏡頭外略過。
- 回復：切回舊 CatReactionBubble。
- 代理：**Claude Code**（系統）+ Codex（reaction 台詞/icon 資料、純函式測試）。**Gate**：預算/冷卻測試綠 + 畫面密度人工驗收。

### Stage 9 — 玩家店長資料模型
- 目標：定義 `managerProfile` 純資料模型與 save 預設；**不**建立固定外觀（DEC-006）。
- 前置：產品店長規格（含是否入場，稽核 §15.5）。
- 主要模組：SaveAdapter（managerProfile 預設 + 遷移）；（若入場）ActorTaskSystem/美術。
- 不做：不建固定性別/長相；不同時做完整店員 AI。
- 存檔影響：新增 `managerProfile`（頂層加欄位 + defaultState 預設，前向相容）。
- 測試：舊存檔補預設不丟資料；欄位可擴充。
- 回復：移除欄位讀取（round-trip 保留）。
- 代理：**Claude Code**（模型/遷移）+ Codex（資料正規化/元件/測試）。**Gate**：舊存檔相容測試綠。

### Stage 10 — 經濟、每日報告與內容擴充
- 目標：擴充 EconomySystem（小費、人氣、報告細節）與內容（多飲品/顧客類型）。
- 前置：Stage 6 循環穩定。
- 主要模組：EconomySystem；config 內容資料。
- 不做：不在此加大型新系統。
- 存檔影響：可能新增報告/統計欄位（前向相容）。
- 測試：經濟純函式；報告數值。
- 代理：Codex（內容資料/設定驗證器）+ Claude Code（經濟審閱）。**Gate**：內容一致性 + 存檔回歸。

---

## 4. 測試策略

- **純規則優先**：Customer/Order/Economy/Cat-need/Reaction-decision/socket-rotation 全部寫成 `core/` 純函式，Node 測試（延續現有 `tests/*.test.js` 模式）。
- **投影往返**：`gridToWorld∘worldToGrid` 恆等、footprint↔世界對位、iso/flat 一致性。
- **相容回歸**：`furniture-save-compatibility`、`furniture-footprint-regression`、`furniture-id-compatibility`、`core.test.js` 每階段須綠。
- **冪等**：付款/結算重入測試。
- **部署**：`npm run check:deploy`（Build/DOM/模組數）每階段須綠。
- **Browser Smoke／實機**：自動化環境無瀏覽器時標 `pending`，不得宣稱通過（AGENTS §5）。

---

## 5. 存檔相容策略

1. key 不變 `catCafePhaserV0540`。
2. 新增一律**頂層加欄位 + 補 `defaultState()`**（`{...defaults,...parsed}` 前向相容），純加欄位不 bump schema。
3. 真正遷移才 bump `sceneSchemaVersion` + 新增冪等、可跳過、失敗保留原資料的遷移區塊（比照 `migrateIfNeeded`）。
4. 家具 `x/y/r` 不因投影改變；`projectionMode` 只影響顯示。
5. MVP 不保存進行中顧客/訂單；station/行為狀態載入時重建。
6. 失敗回復：沿用 try/catch + legacy 備份；rollback 靠 feature flag 與 `projectionMode`。

---

## 6. 家具與美術遷移策略

- 以相容層 `getFurnitureDisplayState` 承載「iso/flat 顯示差異」，**先不動素材**跑起來，逐件精修 scale/anchor/socket。
- 四方向 PNG 對應 rotation 0–3，淺斜投影可沿用；正射才需重畫（不建議）。
- 牆/地板是程序繪製，依投影調整幾何，非素材。
- 不得為配合圖片反改 footprint/anchor/存檔（AGENTS §8、ART_BIBLE §13）。

---

## 7. 手機效能策略

- 貓/顧客/Reaction 皆走**單一共享 update 迴圈**（延續 CatBehaviorController 模型），避免每角色 Timer。
- StationRegistry 只在 `layoutChanged` 重建，不每幀掃描。
- Reaction 有全場上限 + 鏡頭外裁切。
- 保持 `pixelArt/roundPixels`；不新增高頻氛圍。

---

## 8. 回復策略總則

- 每階段單一 commit 邊界 + feature flag。
- 投影可 `projectionMode='iso'` 即時回退。
- 新流程以 flag 關閉即回舊演出（舊 `maybeSpawnCustomer` 保留一版作 fallback）。
- 存檔失敗保留原資料 + legacy 備份不覆寫。

---

## 9. Claude Code／Codex 任務拆分與相依

見 [產品決策交接 §「核准後第一張任務卡」](./handoffs/V056_PRODUCT_DECISION.md) 與下表；完整任務卡清單如下。

### Claude Code 任務（跨系統/架構）
| ID | 名稱 | 前置 | 不可平行 |
|---|---|---|---|
| CC-01 | Grid/Projection 拆分（SpatialGrid + SceneProjection.Iso，純重構） | 方案 B 核准 | 與 CC-02 互斥（同動 GridSystem 消費者） |
| CC-02 | SceneProjection.Flat + projectionMode | CC-01 | 依賴 CC-01 |
| CC-03 | EconomySystem 抽出（單一冪等 commit） | — | 可與 CC-01 平行 |
| CC-04 | CafeScene 責任拆分（CafeRuntime + 裝配器） | CC-03 | 與 CC-05 相依 |
| CC-05 | StationRegistry（socket 旋轉 + 可到達性 + 配對） | CC-01 | 依賴 CC-01 |
| CC-06 | Customer/Order 狀態機核心 + 接線 | CC-05、CC-03、staff 決策 | 依賴 CC-05 |
| CC-07 | ActorTaskSystem | CC-01 | — |
| CC-08 | SaveAdapter schema migration（projectionMode/managerProfile） | — | 與 CC-02、CC-09 協調 |
| CC-09 | CatBehaviorSystem 升級（需求/socket 使用） | CC-05 | 依賴 CC-05 |
| CC-10 | SceneEventBus 型別化 + Runtime 生命週期 | — | 早期基礎 |
| CC-11 | 效能與跨模組除錯 | 各系統就緒後 | — |

### Codex 任務（介面明確後）
| ID | 名稱 | 前置（介面就緒） |
|---|---|---|
| CX-01 | 餐點設定資料 | CC-06 介面 |
| CX-02 | 顧客設定資料 | CC-06 介面 |
| CX-03 | Reaction 台詞與 icon 資料 | ReactionSystem 介面 |
| CX-04 | 家具 station/socket 設定補齊與驗證器 | CC-05 介面 |
| CX-05 | 單一底部抽屜 UI（商店） | Stage 3 契約 |
| CX-06 | 單一浮動顧客卡 | CC-06 事件 |
| CX-07 | 純函式單元測試（各 core 模組） | 對應 core 就緒 |
| CX-08 | 設定檔驗證器 | 對應 config |
| CX-09 | 明確 CSS 樣板修改 | Stage 3 契約 |
| CX-10 | 文件與 devlog 更新 | 各任務完成 |

### 不能平行進行
- CC-01 與 CC-02（後者依前者）；CC-01 與 CC-05/CC-06/CC-07/CC-09（後者依投影拆分）。
- 所有 Codex 資料/UI 任務必須等對應 Claude Code 介面**定稿**後才啟動（AGENTS §1：Codex 不自行決定架構）。

---

## 10. 第一個可執行實作任務建議

**任務名稱**：`ARCH-0561-GRID-PROJECTION-SPLIT`（Grid/Projection 拆分，純重構）
- 執行者：Claude Code。
- 前置核准：**方案 B**（產品負責人於 [V056_PRODUCT_DECISION.md](./handoffs/V056_PRODUCT_DECISION.md) 選定）。
- 本任務只完成 **Stage 1**（SpatialGrid + SceneProjection.Iso，API 不變、iso 視覺零差異、既有測試不改期望值）。
- 不做：不新增 Flat、不改座標語意、不動 Occupancy/Placement/Save。

> 若產品優先「生命感先行」，替代首任務為 `ARCH-0562-ECONOMY-EXTRACT`（CC-03，抽出 EconomySystem），因其不依賴投影決策。

---

*本計畫未修改任何 Runtime／HTML／CSS／素材／存檔。技術方案為 Proposed，待 [產品決策交接](./handoffs/V056_PRODUCT_DECISION.md) 核准。*
