# 專案決策紀錄

相關治理文件：[代理協作規範](../AGENTS.md)｜[目前狀態](./current-state.md)｜[V0552 交接](./handoffs/V0552_TO_CLAUDE.md)

狀態定義：

- `Accepted`：目前有效，實作與後續任務必須遵守。
- `Proposed`：方向或方案待技術／產品確認，不得視為已核准實作。
- `Superseded`：已由新決策取代，保留歷史理由。

## DEC-001｜代理角色與責任邊界

- 日期：2026-07-23
- 狀態：Accepted
- 背景：專案由 ChatGPT Project、Claude Code 與 Codex 協作，需要避免重複決策與未授權的大型重構。
- 決策：ChatGPT Project 負責產品方向與 Task Card；Claude Code 負責跨檔案架構、重大整合與影響分析；Codex 負責邊界清楚的模組、測試與文件。
- 原因：讓決策、實作與驗證責任可追蹤。
- 影響：跨系統或破壞相容性的變更不可直接由執行代理自行決定。
- 後續：依 `AGENTS.md` 與 `CLAUDE.md` 執行。

## DEC-002｜Repository 文件是正式協作來源

- 日期：2026-07-23
- 狀態：Accepted
- 背景：過去大量需求與決策只存在對話或版本 Prompt。
- 決策：正式決策、現況、開發紀錄、路線圖與交接必須寫入 repository。
- 原因：避免對話截斷、代理切換或記憶差異造成方向漂移。
- 影響：對話與 Prompt 可作輸入，但不得取代 repo 內正式文件。
- 後續：每個任務至少更新 devlog；決策改變時更新本文件。

## DEC-003｜手機直立為主要產品視角

- 日期：2026-07-23
- 狀態：Accepted
- 背景：主要使用情境為 iPhone Safari、PWA 與 Android Chrome。
- 決策：以手機直立作為 UI、場景可讀性與操作優先驗收視角，同時保留橫式、平板與桌面相容。
- 原因：降低主要玩家裝置上的資訊與操作負擔。
- 影響：不得為桌面展示犧牲直立手機的場景空間、觸控或 safe area。
- 後續：外部裝置人工驗收仍需完成。

## DEC-004｜場景優先與低噪訊操作介面

- 日期：2026-07-23
- 狀態：Accepted
- 背景：咖啡廳活動應是主要遊戲空間，永久堆疊側邊按鈕會壓縮手機場景。
- 決策：場景保持主視覺；主要操作集中底部。任務、營運與顧客需求優先使用浮動提示、泡泡、可收合面板或 bottom drawer。
- 原因：提升沉浸感與手機可讀性。
- 影響：新增 UI 不得再建立永久堆疊的側邊按鈕群。
- 後續：具體 HUD／bottom drawer 規格由後續 Task Card 核准。

## DEC-005｜店內貓咪維持自然四足核心

- 日期：2026-07-23
- 狀態：Accepted
- 背景：貓咪是療癒體驗核心，不應為工作系統全面擬人化。
- 決策：貓咪維持自然四足角色；照顧、餵食、梳毛、玩耍、休息、個性與自然移動為核心體驗。
- 原因：保持主題辨識與情感連結。
- 影響：不得將所有店內貓咪轉成直立員工角色。
- 後續：深化照顧與個性前須保留現有 cat ID 與存檔相容性。

## DEC-006｜玩家店長代表玩家且未來可自訂

- 日期：2026-07-23
- 狀態：Accepted
- 背景：店長應是玩家在店內的代表，但目前尚無正式角色資料模型與外觀規格。
- 決策：未來店長支援玩家自訂；在規格核准前不建立固定性別、固定長相或不可遷移的角色資料。
- 原因：避免過早鎖死玩家認同與後續客製欄位。
- 影響：目前狀態為產品方向已核准、功能未實作。
- 後續：先完成資料模型、存檔與相容性設計。

## DEC-007｜現行 2:1 等角 Grid 是已實作技術基線

- 日期：2026-07-23
- 狀態：Accepted
- 背景：`ROOM_CONFIG` 與 `GridSystem` 已使用 10×8、128×64 的 2:1 等角 Grid，並供家具、Occupancy、Placement、Camera、Depth 與 Pathfinding 使用。
- 決策：在新投影遷移方案核准前，現行 2:1 Grid 是唯一正式 Runtime 基線。
- 原因：保護家具座標、存檔與既有互動。
- 影響：不得另建裝置專用 Grid 或第二套座標。
- 後續：平面化方向只先做架構稽核。

## DEC-008｜平面／淺俯視可讀性方向與方案 B

- 日期：2026-07-23（原）；2026-07-24 更新為 Accepted
- 狀態：Accepted
- 背景：產品希望獲得較平、較淺俯視的手機場景可讀性；現有實作是 2:1 等角。
- 原始決策（2026-07-23，Proposed）：將 flat／shallow top-down 列為產品目標候選，但保留 Grid、簡化投影或完整遷移的方式尚未決定。保留此歷史脈絡。
- 更新決策（2026-07-24，Accepted，依 `docs/V056_ARCHITECTURE_AUDIT.md` 三方案比較與產品核准）：
  - 採**方案 B**：保留邏輯格與家具邏輯座標 `x／y／r`、保留 OccupancySystem／PlacementSystem／grid-pathfinder／存檔 key 與家具資料，將**畫面投影責任從 GridSystem 抽離**。
  - 未來新增可切換的**淺斜／淺俯視**投影；**不採正射純頂視**；優先沿用現有四方向家具素材，透過 scale／anchor／socket 與顯示相容層逐件校準，不以「全面重畫」為預設。
  - 投影改變**不得搬動家具邏輯位置**。
- 影響：不得把目前場景描述成已平面化。**本次 ARCH-0561 僅完成第一階段骨架抽離**（`SpatialGrid` + `IsoProjection`，`GridSystem` 改為相容 Facade），畫面仍維持等角；FlatProjection／平面顯示模式**尚未實作**。
- **部分更新（2026-07-25，見 [DEC-017](#dec-017正交平面場景方向accepted停止斜投影微調)）**：本決策的「邏輯格與投影分離（方案 B）」核心**仍有效**——邏輯格、家具 `x/y/r`、Occupancy／Placement／Pathfinding／存檔與投影責任分離持續採用。但「**淺斜／淺俯視為最終平面方向**」與「**不採正交**」兩點**已由 DEC-017 取代**：產品負責人拒絕 Flat 全部方案，改採正交平面（水平／垂直矩形）。保留本段歷史脈絡，不刪除。
- 後續：見 [DEC-012](#dec-012scene-projection-抽離與-iso-facade-已完成第一階段) 與 [DEC-017](#dec-017正交平面場景方向accepted停止斜投影微調)。

## DEC-012｜SceneProjection 抽離與 Iso Facade（已完成第一階段）

- 日期：2026-07-24
- 狀態：Accepted
- 背景：依方案 B（[DEC-008](#dec-008平面淺俯視可讀性方向與方案-b)）需為未來平面投影建立安全切換點，且不得改變現行等角行為。
- 決策：`GridSystem` 拆分為投影無關的 `SpatialGrid`（cols/rows/mask/footprint 邏輯）與 `IsoProjection`（gridToWorld/worldToGrid/anchor/polygon 等角投影）；`GridSystem` 保留為組合兩者的相容 Facade，public API 不變，並公開唯讀 `spatialGrid`、`projection` 參照。
- 原因：讓後續 FlatProjection 可在同一介面下切換，且既有消費者不需改寫。
- 影響：單一邏輯格與單一世界座標；`SpatialGrid`／`IsoProjection` 不得依賴引擎、DOM 或角色身份；不得複製第二份房間資料。任務 `ARCH-0561-GRID-PROJECTION-SPLIT` 完成，行為經 golden-master 測試證明與重構前逐一致（見 `docs/V0561_IMPLEMENTATION_RESULT.md`）。
- 後續：FlatProjection Prototype 為候選下一任務（`ARCH-0562-FLAT-PROJECTION-PROTOTYPE`），未核准前不實作。

## DEC-013｜玩家店長與招募店員採 actor／worker-neutral 工作架構

- 日期：2026-07-24
- 狀態：Accepted（方向）；Proposed（招募細節）
- 背景：MVP 需要第一位工作角色以跑通營運流程，但完整招募店員機制尚未建立；店貓維持自然四足（[DEC-005](#dec-005店內貓咪維持自然四足核心)）。
- 決策（Accepted）：
  - 店長代表玩家本人、未來支援客製化、不是固定角色也不是擬人貓、未來會進入場景（延續 [DEC-006](#dec-006玩家店長代表玩家且未來可自訂)）。
  - MVP 招募系統完成前，先由**玩家店長 Placeholder** 作為第一位工作角色，可執行製作／送餐／收銀等最小營運工作；Placeholder 只是過渡方案，不代表最終美術，也不代表店長永久負責全部工作。
  - 未來會有招募店員機制；店員可負責製作、送餐、收銀、清潔等；店貓不是工作人員。
  - 工作任務架構必須 **actor／worker-neutral**：`CustomerFlowSystem`／`OrderSystem`／`StationRegistry`／`ActorTaskSystem` 不得綁定特定角色身份，店長與未來店員共用同一套移動／工作站／任務分配／進度／完成通知接口；**不得建立 manager-only 工作流程**。Grid／SpatialGrid／Projection 不得依賴角色身份。
- 決策（Proposed／待規劃）：招募規則、能力、薪資、排班與角色類型。
- 影響：本次 `ARCH-0561` **未實作**店長、店員、actor/worker、StationRegistry 或任務系統；此為方向記錄，非功能完成。

## DEC-014｜MVP 顧客與訂單保存範圍

- 日期：2026-07-24
- 狀態：Accepted
- 背景：完整顧客／訂單尚未實作；需先界定保存範圍以免過早鎖死 schema。
- 決策：MVP **不保存**進行中的顧客與訂單，重新載入後重新生成；只保存已結算的經濟結果與玩家進度。此決策**不得**因此修改現行存檔格式（key `catCafePhaserV0540`、schema、遷移版本不變）。
- 原因：降低 schema 風險，符合可回復原則。
- 影響：本次 `ARCH-0561` 未觸碰 `SaveAdapter` Runtime；顧客／訂單尚未實作。

## DEC-009｜家具與存檔相容性是受保護契約

- 日期：2026-07-23
- 狀態：Accepted
- 背景：V0.55.2 以相同 furniture ID 替換 Runtime 美術，舊存檔可直接解析。
- 決策：固定存檔 key `catCafePhaserV0540`；保護 furniture ID、名稱、價格、解鎖、footprint、layer、rotation 與座標語意。
- 原因：避免玩家物品、配置與經濟資料遺失。
- 影響：美術或投影變更不得暗中改動邏輯資料。
- 後續：任何 schema／座標遷移須先提出可逆方案與測試。

## DEC-010｜Phaser 固定本地載入，不依賴 CDN

- 日期：2026-07-23
- 狀態：Accepted
- 背景：專案部署於 GitHub Pages，需在外部 CDN 不可用時仍可啟動。
- 決策：使用 Phaser `3.90.0` 與 `assets/vendor/phaser-3.90.0.min.js`，正式 Runtime 不從 CDN 或 `node_modules` 載入。
- 原因：確保靜態部署可重現。
- 影響：更新引擎版本必須另立決策並保留第三方授權。
- 後續：部署檢查持續驗證本地檔與相對路徑。

## DEC-011｜未完成系統必須如實標示

- 日期：2026-07-23
- 狀態：Accepted
- 背景：目前只有簡化顧客演出與營運計數；完整店員 AI、顧客 AI、訂單／料理／結帳與故事系統尚未完成。
- 決策：文件與交付不得把上述系統、玩家店長自訂或最終角色呈現寫成已完成。
- 原因：保持規格、測試與產品狀態一致。
- 影響：簡化 placeholder／fallback 必須標為部分實作或替代方案。
- 後續：待資料模型、互動流程與驗收標準核准後分階段開發。

## DEC-015｜FlatProjection Prototype 已建立（預設仍為 iso）

- 日期：2026-07-24
- 狀態：Accepted（實作進度）；視覺正式化為 Proposed（待人工驗收）
- 背景：依 [DEC-008](#dec-008平面淺俯視可讀性方向與方案-b)（方案 B）與 [DEC-012](#dec-012scene-projection-抽離與-iso-facade-已完成第一階段），需在 SceneProjection 抽離骨架上建立可見的淺俯視原型。
- 決策（實作進度）：
  - 已建立 `FlatProjection`（淺斜／淺俯視、可逆 basis 投影）與純模式解析器 `projection-mode.js`；`GridSystem` 第三參數可選投影，**預設仍為 iso**。
  - Flat 僅由網址 `?projection=flat` opt-in 啟動；非法值回退 iso；**投影模式不寫入存檔**；家具 `x/y/r`、Occupancy、Placement、Pathfinding、存檔 key 不變；`IsoProjection` 未修改、iso golden-master 未動。
  - 版本升為 `V0.56.0-alpha｜淺俯視投影原型版`／Build `0560a`（僅版本與 cache-bust 機械變更；存檔 key 不變）。
- 決策（待核准）：**Flat 尚未取代 iso**；是否成為正式預設，須由產品負責人完成 Flat 視覺人工驗收後另行核准。
- 影響：不得把 Flat 寫成正式預設或「平面化場景已完成」；家具尚未完成 flat 正式美術；手機實機驗收未完成前不得宣稱通過。real-browser 截圖證據見 `docs/evidence/v0562/`，逐項驗收見 `docs/V0562_FLAT_PROJECTION_ACCEPTANCE.md`。
- 後續：候選 `ART-0563-FLAT-FURNITURE-CALIBRATION`（家具 flat 校準）、`ARCH-0563-ECONOMY-EXTRACT`、`ARCH-0563-STATION-REGISTRY`，均未核准前不執行。

## DEC-016｜Flat 淺俯視構圖三方案比較（Superseded）

- 日期：2026-07-24
- 狀態：**Superseded**（2026-07-25，由 [DEC-017](#dec-017正交平面場景方向accepted停止斜投影微調) 取代；保留歷史脈絡，不刪除）
- 取代原因：產品負責人比較三方案後**全部拒絕**（Preset A／B／C 皆 Rejected）——A、B 房間仍明顯歪斜，C 雖較平但垂直格線仍向右偏移，皆非真正水平／垂直、正向可讀的手機直立平面咖啡廳。改採正交平面方向（見 DEC-017）。Flat A／B／C 程式與 URL 保留作歷史回歸，正式文件標為 Rejected。
- 原始內容（保留）：
- 背景：`ARCH-0562` 的 Flat Prototype 技術可運作，但產品負責人比較畫面後認為現行 Flat 過度扁平、家具像散落在斜棋盤、後牆與空間感不足、上方家具易近 HUD，尚不適合直接設為正式視角，也不適合現在就全面校準 47 件家具。需要在相同配置與鏡頭條件下比較不同「保留多少 iso 深度」的構圖。
- 決策（本任務 `ARCH-0563-FLAT-VISUAL-PRESET-COMPARISON` 完成）：
  - 建立**三個共用同一個 `FlatProjection` 實作**的構圖 Preset，參數集中於純設定模組 [`assets/js/config/flat-projection-presets.js`](../assets/js/config/flat-projection-presets.js)：
    - **Preset A｜Near Iso**（`near-iso`）：axisX `{78,22}`、axisY `{-37,48}`、det `4558`。最接近 iso，只稍平，保留較強房間深度與牆角。
    - **Preset B｜Balanced Shallow**（`balanced`）：axisX `{93,13}`、axisY `{-10,63}`、det `5989`。介於 iso 與現行 Flat 之間。
    - **Preset C｜Current Flat**（`current`）：axisX `{112,0}`、axisY `{26,84}`、det `9408`。**完整沿用 `ARCH-0562` 的 `FLAT_PROJECTION_PARAMS`（以參照沿用，未調整）**，作為比較基準。
  - basis 以 iso 與現行 Flat 為兩端點插值後，逐項驗證 determinant 非零、cell 可逆、cell 共邊、房間落在世界 bounds、家具 anchor 合法、房間 centroid 皆對齊世界中心（公平取景），確認後定案（非機械插值直接完成）。
  - URL：`?projection=flat`（無 preset）維持 **Preset C**，不改變 `ARCH-0562` 既有語意；新增 `?projection=flat&flatPreset=near-iso|balanced|current`（另可疊 `&artDebug=1`）。`projection` 非 flat 時忽略 `flatPreset`；未知／空字串 → `current`。解析器為純函式、可單元測試；`GridSystem` 不直接讀 URL（由組裝層解析後傳入 id）。
  - Flat 房間 rendering 由 Preset metadata 決定（後牆高度、可選側牆、牆角、外框線寬、牆飾位置），仍全由投影幾何推導、僅屬視覺、深度 -1000；**iso branch 完全未動**。
  - **不改任何邏輯資料**：cols/rows、placeableMask、entrance cells、家具 `x/y/r`、footprint、layer、rotation、Occupancy、Pathfinding、存檔 key `catCafePhaserV0540` 與 schema 全部不變；投影／Preset 不寫入存檔、不含任何角色身份。
  - 版本升為 `V0.56.1-alpha｜淺俯視構圖比較版`／Build `0561a`（僅版本與 cache-bust 機械變更）。
- 決策（待產品負責人）：由產品負責人比較桌面與手機截圖後，選出值得進入後續家具校準的 Preset。**Claude Code 不得自行選定正式方案，不得自行把任一 Preset 設為正式預設。**
- 影響：本次未進行正式家具校準、未新增營運／角色系統；家具沿用 iso 素材，透視落差為已知、待選定後由 Codex 校準。real-browser 截圖證據見 `docs/evidence/v0563/`；逐項說明見 [V0561 構圖比較結果](./V0561_FLAT_PRESET_COMPARISON_RESULT.md) 與 [V0561 人工驗收](./V0561_FLAT_PRESET_COMPARISON_ACCEPTANCE.md)。
- 後續：產品選定 Preset 後，`ART-0563-FLAT-FURNITURE-CALIBRATION`（Codex，家具 flat 逐件校準）方可啟動；未選定前不執行。→ **已作廢**：產品未選定任一 Flat 方案，改採正交平面（DEC-017）。

## DEC-017｜正交平面場景方向（Accepted）＋停止斜投影微調

- 日期：2026-07-25
- 狀態：Accepted
- 背景：Flat A／B／C（DEC-016）比較後被產品負責人**全部拒絕**（整體仍歪斜、水平垂直不清、難以正向閱讀、為保留等角家具而持續扭曲房間，不符手機直立平面咖啡廳目標）。決定停止斜投影微調，直接建立正交平面原型。
- 決策：
  - **Flat A／B／C：Rejected**；不再修改其 axis／角度／牆面／Camera，不進入 Flat 家具校準。**DEC-016：Superseded**（保留歷史，不刪除）。
  - **停止斜投影微調：Accepted**——不再建立 Near／Balanced／Current 或任何多組 angle Preset 的斜投影。
  - **Orthogonal／正交平面場景方向：Accepted**——採水平／垂直矩形地板、水平後牆、垂直左右邊界；X 只控制左右、Y 只控制上下；無菱形、無斜平行四邊形、無整體傾斜、無 skew／shear／rotation、非 CSS transform、非純頂視。可搭配正面／側面／有厚度的 2.5D 家具與四方向角色、依 `worldY` 前後遮擋（原創 2.5D 表現）。
  - **房間必須水平／垂直：Accepted**。
  - **手機直立優先**；資訊層級：上方牆面／入口／點餐櫃台／製作區，中央座位／顧客／店長店員動線，下方／側邊貓咪與通道。
  - **核心家具允許重作：Accepted**——方向核准後重做最核心 10～12 件（`ART-0571`），不一次重畫 47 件；保留 furniture ID 與存檔相容。
  - **不再以「沿用全部等角家具」為房間方向前提：Accepted**——房間幾何先做正確，現有等角家具僅作 Placeholder，看起來不合角度即記錄為需重作，不得為遷就舊家具把地板做歪。
  - **Orthogonal Prototype 尚未成為正式預設**：`?projection=ortho`（別名 `orthogonal`）opt-in、非法值回退 iso、**預設與 rollback 仍為 iso**；投影與 demoLayout **不寫入存檔**。
- 影響：本任務 `ARCH-0570-ORTHOGONAL-ROOM-PROTOTYPE` 完成 `OrthogonalProjection`（真正軸對齊、共用同一 `SpatialGrid`）、正交房間 rendering、非存檔 Demo Layout 與 Art Debug；未改 furniture ID／`x/y/r`／footprint／Occupancy／Placement／Pathfinding／存檔 key／schema；iso／Flat 程式與 golden 未動。real-browser 證據 `docs/evidence/v0570/`。細節見 [V0570 結果](./V0570_ORTHOGONAL_ROOM_RESULT.md)、[驗收](./V0570_ORTHOGONAL_ROOM_ACCEPTANCE.md)、[家具重作計畫](./V0570_ORTHOGONAL_ASSET_REBUILD_PLAN.md)。
- 後續（未核准前不執行）：`ART-0571-CORE-ORTHOGONAL-FURNITURE`（核心 10～12 件正交重作）；`ARCH-0571-ECONOMY-SYSTEM`；`ARCH-0571-STATION-REGISTRY`（待正交房間與核心家具核准）。→ **更新**：核心家具重作延後至手機構圖通過後（見 [DEC-018](#dec-018orthogonal-手機初始取景與-camera-邊界accepted)），並改編號為 `ART-0572`。

## DEC-018｜Orthogonal 手機初始取景與 Camera 邊界（Accepted）

- 日期：2026-07-25
- 狀態：Accepted
- 背景：產品負責人於**真實 iPhone 直立**確認 Orthogonal 正交方向正確（地板水平/垂直、房間不歪斜、不回 Flat、不再微調斜投影），但 `V0.57.0-alpha` 手機首屏 Camera 過度放大（只見約 37% 房間寬）、需大量左右拖曳、拖到房間外露出大片背景、Demo 過於鬆散。正式判定：「**Orthogonal 方向通過，但 V0.57.0 尚未通過手機產品驗收；須先完成手機直立取景、Camera 邊界與 Demo Layout 修正，才能進入核心家具重作。**」
- 決策：
  - **Orthogonal 正交方向：維持 Accepted**（延續 [DEC-017](#dec-017正交平面場景方向accepted停止斜投影微調)）。**V0.57.0 手機初始取景：未通過**（記錄）。
  - **手機首屏必須呈現主要營業區：Accepted**——手機直立初次進入不需先縮放或大量左右拖曳即可看懂服務／座位／貓咪分區與主要通道。
  - **Camera bounds 應以房間內容與 safe viewport 計算：Accepted**——初始 zoom 由房間內容 bounds 與實際可用（DOM/visualViewport 量測、扣除 HUD/底部列/情境列/safe-area）的 safe viewport 推導；pan/zoom 夾在房間內容，minZoom＝fit；**不得硬編碼裝置專用 zoom/scroll、不得建立第二套 CameraController、不得放寬 bounds 掩蓋空白、不得用 CSS transform 假裝**。iso/flat 取景行為不變。
  - **首屏不應依賴大量左右拖曳：Accepted**。
  - **核心家具重作延後至本手機構圖通過後：Accepted**（候選 `ART-0572-CORE-ORTHOGONAL-FURNITURE`）。
  - **iso 暫時仍為預設與 rollback**；Orthogonal 仍由 URL opt-in，待手機構圖實機驗收通過後再另議是否改為預設。
- 實作（本任務 `ARCH-0571` 完成）：新增純模組 `core/scene-viewport.js`、`core/camera-framing.js` 與 DOM adapter `ui/viewport-metrics.js`；`CameraController` 新增 Orthogonal framing（fit＋centerOn＋內容 clamp），iso/flat 分支不變；`drawRoomOrtho` 底填擴大避免黑邊；`ortho-demo-layout` 重排為 16 件緊湊分區（仍 display-only、不入存檔）。未改投影數學、未重畫家具、未新增營運/角色系統、未改存檔 key/schema。real-browser 證據 `docs/evidence/v0571/`。細節見 [V0571 結果](./V0571_ORTHOGONAL_MOBILE_RESULT.md)、[驗收](./V0571_ORTHOGONAL_MOBILE_ACCEPTANCE.md)。
- 後續（未核准前不執行）：`ART-0572-CORE-ORTHOGONAL-FURNITURE`（核心 10～12 件正交重作）；`ARCH-0572-ECONOMY-SYSTEM`；`ARCH-0572-STATION-REGISTRY`。→ **更新**：家具重作再延後至手機直立滿版化通過後（見 [DEC-019](#dec-019正交手機直立滿版化與咖啡廳分區accepted)），改編號 `ART-0573`。

## DEC-019｜正交手機直立滿版化與咖啡廳分區（Accepted）

- 日期：2026-07-25
- 狀態：Accepted
- 背景：`V0.57.1-alpha` 的 Camera framing 技術正常，但真實 iPhone 驗收判定「房間內容太小、上下留白太多、缺乏手機直立滿版感、Demo 仍像家具展示」。正式判定：Orthogonal 方向保留，但需先手機直立滿版化與咖啡廳空間分區，才能進入家具重畫。
- 決策：
  - **Orthogonal 正交方向：維持 Accepted**（延續 [DEC-017](#dec-017正交平面場景方向accepted停止斜投影微調)／[DEC-018](#dec-018orthogonal-手機初始取景與-camera-邊界accepted)）；地板保持完全水平／垂直，無 skew/shear/rotation。
  - **V0.57.1 內容太小、上下留白過多：記錄**（未通過手機產品驗收）。
  - **手機直立滿版化：Accepted**——顯著提高房間在 Canvas 的視覺占比、顯著減少上下留白，首屏不需縮放或大量拖曳；390/393/430 皆合理。**只有 Camera 無法達成時才調整 Projection 參數**（本次確認 Camera 無法單獨消除固有留白，故調整正交 cellWidth/cellHeight/origin 與房間比例）。
  - **顧客入口位於上方角落：Accepted**——正交 prototype 入口門置於房間**上方角落**（本任務採**右上角**，理由：服務櫃檯連續帶置於上方左至中，入口置於相對的右上角，避免顧客動線穿過櫃檯後方；右側欄與前方 y1 走道形成門→櫃檯→座位的清楚路線）。本次僅修改 Demo/Orthogonal prototype 的入口視覺與路線；**logical 存檔入口（room-config `(8,7)/(9,7)`）與存檔契約不變**。
  - **櫃檯／員工工作區為正式空間方向：Accepted**——上方連續服務帶表達收銀／出餐／咖啡飲品／甜點展示與員工工作區，為店長與未來店員的工作起始區；顧客側（前）與工作側（後）可辨識。
  - **家具重畫再延後至本手機滿版化通過後：Accepted**（候選 `ART-0573-CORE-ORTHOGONAL-FURNITURE`）。
  - **iso 暫時仍為預設與 rollback**；Orthogonal 仍由 URL opt-in。
- 實作（本任務 `ARCH-0572` 完成）：`OrthogonalProjection` cellWidth 104→88、cellHeight 88→120（origin 重推導，仍完全水平／垂直、cell 在世界 bounds 內）；`ORTHOGONAL_ROOM_RENDER` 改為含背牆 `wallHeight` 與右上角 `entrance` 門；`drawRoomOrtho` 畫整面背牆＋右上角門＋入口地墊、移除底部 logical 入口高亮；`buildOrthoFraming` content bounds 含背牆使手機直立滿版；`ortho-demo-layout` 重排為 17 件（右上角門→上方服務帶→中央座位→前左貓咪區→清楚動線）。Camera framing 邏輯不變（fit-to-content＋centerOn＋內容 clamp）。未改投影軸向水平/垂直、未重畫家具、未新增營運/角色系統、未改存檔 key/schema。real-browser before/after 證據 `docs/evidence/v0572/`。細節見 [V0572 結果](./V0572_ORTHOGONAL_PORTRAIT_RESULT.md)、[驗收](./V0572_ORTHOGONAL_PORTRAIT_ACCEPTANCE.md)。
- 後續（未核准前不執行）：`ART-0573-CORE-ORTHOGONAL-FURNITURE`；`ARCH-0573-ECONOMY-SYSTEM`；`ARCH-0573-STATION-REGISTRY`。→ **更新**：家具重作再延後至「核心營業區滿版與分區」通過後（見 [DEC-020](#dec-020正交核心營業區滿版與分區metadataaccepted)），改編號 `ART-0574`。

## DEC-020｜正交核心營業區滿版與分區 Metadata（Accepted）

- 日期：2026-07-26
- 狀態：Accepted
- 背景：`V0.57.2-alpha` 的比例調整與整面背牆改善了占比，但真實 iPhone 驗收判定「**手機滿版感仍不足、上下仍有留白**」。根因：首屏 framing 仍嘗試把**整個房間**（含外圈裝飾欄與整面高牆）以 contain 完整塞入，寬受限下高度方向自然留白。正式判定：Orthogonal 方向與 V0.57.2 比例保留，但首屏取景要改為「**核心營業區滿版**」，並把空間分區從臨時 Demo 資料升級為正式 metadata，才能進入家具重畫。
- 決策：
  - **Orthogonal 正交方向與 V0.57.2 比例：維持 Accepted**（延續 [DEC-017](#dec-017正交平面場景方向accepted停止斜投影微調)～[DEC-019](#dec-019正交手機直立滿版化與咖啡廳分區accepted)）；`cellWidth=88`／`cellHeight=120`、`axisX.y=0`／`axisY.x=0`、完全水平／垂直不變。
  - **首屏改為核心營業區滿版（cover 優先）：Accepted**——分離兩個矩形：**roomBounds**（整房：地板＋整面背牆＋外圈邊距，作為 Camera pan／zoom-out 範圍）與 **coreGameplayBounds**（首屏取景目標，較小，含入口／櫃檯／主要座位／主走道／貓咪區，排除非必要外牆與外圈空格）。手機核心區在 **safe gameplay viewport 縱向占比 ≥ 90%**（390×844／393×852／430×932 實測 **96%／95%／93%**）；允許左右少量裁切（每側 ≤ 10%，實測 ~8%，皆為外圈欄；關鍵分區 0 裁切）。zoom-out 下限＝整房 fit，可縮到看見整間房、無空背景。
  - **顧客入口改為兩格視覺門：Accepted**——`visualDoorBounds` 為上牆右側 **x7–8 兩格**視覺門（**x9 保持牆面**、門不貼房間邊）；單一 logical 進入點 `customerEntryPoint=(8,0)`、`customerEntryStaging=(8,1)` 分離。**僅 Demo/prototype 視覺與路線；logical 存檔入口 room-config `(8,7)/(9,7)` 與存檔契約不變。**
  - **正式 Zone metadata 模組：Accepted**——新增 `assets/js/config/ortho-room-zones.js`，以純格座標矩形描述 `customerEntranceZone`／`visualDoorBounds`／`customerEntryPoint`／`customerEntryStaging`／`staffWorkZone`／`serviceCounterLine`／`customerServiceZone`／`seatingZone`／`catZone`／`mainAisle`／`coreGameplayBounds`。**純資料、無 world pixel、可投影、無 Phaser／DOM、無 actor 身份、可 Node 測試**；**不是 StationRegistry、不是 CustomerFlowSystem**，不含收銀／製作／送餐／AI 邏輯。
  - **櫃檯／服務三層空間方向：Accepted**——A 背牆設備帶、B 員工工作區（櫃檯後方連續可走、非零散縫隙）、C 顧客服務區（櫃檯前方：點餐／收銀／取餐／排隊）。本次僅空間 prototype 與 metadata，**不含任何行為邏輯**。
  - **Demo 依分區重排、display-only：Accepted**——18 件（略多於 V0572 的 17）、主走道 2 格全通；驗證入口→服務／座位／貓咪皆可達、員工工作區內部連續、顧客動線不穿越員工工作區、入口不被擋。仍不入存檔、不改 `state.items`／coins。
  - **只在 framing 無法達成時才調 cell 尺寸：Accepted**——本次以 coreGameplayBounds 取景（非把 cell 由 120 硬拉到 140/160）達標，故不改 cell 尺寸。
  - **iso 暫時仍為預設與 rollback**；Orthogonal 仍由 URL opt-in。
- 實作（本任務 `ARCH-0573` 完成）：新增 `ortho-room-zones.js`（zone metadata＋純 helper）；`OrthogonalProjection.ORTHOGONAL_ROOM_RENDER` 改為 `doorHeight`／`coreTopStrip`／`door` 顏色（移除舊 `entrance` 角落單格門）；`camera-framing.computeInitialFraming` 改收 `core`（滿版取景）＋`room`（clamp／minZoom），保留單一 `content` 舊路徑；`CameraController` 以 `getCoreBounds`（fit）＋`getRoomBounds`（pan/zoom-out）取代單一 content；`CafeScene.buildOrthoFraming` 提供 core/room bounds、`drawRoomOrtho` 由 zones 畫 x7–8 兩格門＋`customerEntryPoint` 地墊；`ortho-demo-layout` 依 zones 重排 18 件、`ORTHO_DEMO_ENTRANCE` 取自 `customerEntryPoint`。新增 `tests/ortho-room-zones.test.js`；更新 `ortho-demo-layout`／`camera-framing`／`ortho-projection`／`browser-smoke` 測試。版本機械升版 0572a→0573a、`check.js`（版本／Build／obsolete `?v=0572a`／protected hash 更新 OrthogonalProjection/camera-framing/GridSystem/flat-presets/viewport-metrics＋新增 ortho-room-zones／required＋test／`.gitattributes` 納入 root 與 ZIP root）。未改投影軸向、未重畫家具、未新增營運/角色/訂單/店員系統、未改存檔 key／schema（`catCafePhaserV0540`／5401／5401）。real-browser before/after 證據 `docs/evidence/v0573/`。細節見 [V0573 結果](./V0573_ORTHOGONAL_CORE_FULLBLEED_RESULT.md)、[驗收](./V0573_ORTHOGONAL_CORE_FULLBLEED_ACCEPTANCE.md)、[比較 HTML](./V0573_ORTHOGONAL_CORE_FULLBLEED_COMPARISON.html)。
- 後續（未核准前不執行）：`ART-0574-CORE-ORTHOGONAL-FURNITURE`（核心 10～12 件正交重作，延後至本核心滿版與分區實機通過後）；`ARCH-0574-ECONOMY-SYSTEM`；`ARCH-0574-STATION-REGISTRY`（可用 `ortho-room-zones` 為空間依據，但工作站／顧客流程邏輯本次不做）。→ **更新**：家具重作再延後至「營業區聚焦與分區辨識」通過後（見 [DEC-021](#dec-021正交營業區聚焦構圖與分區辨識accepted)）。

## DEC-021｜正交營業區聚焦構圖與分區辨識（Accepted）

- 日期：2026-07-26
- 狀態：Accepted
- 背景：`V0.57.3-alpha` 首屏已核心滿版，但真實 iPhone 驗收判定「**周遭留白仍太多、看不出分區**」——看不出上方是否為連續服務區、看不出員工工作側與顧客側之分、看不出座位是否成組、看不出貓咪區是否集中。判定：門位置可接受，但需先把首屏聚焦在有效營業區、縮短牆面、並讓分區「一眼可辨」，才能進入家具重畫。**本任務為構圖與分區辨識精修（`ARCH-0574`），不是家具重畫。**
- 決策：
  - **Orthogonal 正交方向與比例：維持 Accepted**（延續 [DEC-017](#dec-017正交平面場景方向accepted停止斜投影微調)～[DEC-020](#dec-020正交核心營業區滿版與分區metadataaccepted)）；`cellWidth=88`／`cellHeight=120`、`axisX.y=0`／`axisY.x=0` 不變。
  - **首屏更聚焦有效營業區、牆面縮短：Accepted**——縮短背牆（`wallHeight 200→155`、`coreTopStrip 140→118`、`doorHeight 130→112`），讓上方讀作「整齊服務背牆」而非大片空牆；首屏仍 core（x1-8）滿版（safe viewport 縱向 94%／93%／91%），並保留 zoom-out 看整房。**因門在 x7-8、core 必含 x8，取景寬度受幾何鎖定（無法在不裁掉門的前提下再放大單件家具）；本次以「縮牆＋密度＋分區底色」提升空間利用與可讀性，而非放大縮放。**
  - **分區以底色辨識：Accepted**——新增 `ortho-room-zones.zoneAt()` 與 `ORTHOGONAL_ROOM_RENDER.zoneFloor`，把 x1-6 功能帶（工作區/櫃檯/服務/座位/貓咪）與 x7-8 走道以**不同地板底色**呈現（暖色系、逐格微幅二階明暗），使各營業區一眼可辨。純視覺、無行為邏輯。
  - **分區改為乾淨分割：Accepted**——`ortho-room-zones` 將 `customerServiceZone`／`seatingZone`／`catZone` 收斂為 x1-6（與 x7-8 走道不重疊），成為每格單一 zone 的乾淨分割，供 `zoneAt` 與 Demo 對齊。
  - **Demo 依分區重排、更密且清楚成組：Accepted**——23 件（多於 V0573 的 18）；上方**連續設備帶**(x1-6)＋**連續櫃檯**(x1-6) 形成清楚服務區與工作側/顧客側之分；**兩組桌椅**各在地毯上成組（x1-2、x4-5，中留走道）；**貓咪集中**於前左角（貓跳台/城堡/抓柱/貓地毯/沙發）；保留 y1 後走道、y3 顧客前廳、x3/x6 直走道、x7-8 主走道，動線 入口→點餐→座位 不穿越工作核心。地板占用由 ~28% 提升至 ~48%。
  - **iso 暫時仍為預設與 rollback**；Orthogonal 仍由 URL opt-in。
- 實作（本任務 `ARCH-0574` 完成）：`ortho-room-zones.js` 分區收斂為 x1-6 乾淨分割＋新增 `zoneAt`／`ORTHO_ZONE_KEYS`（zone key `staff`→`work` 保持身份中性、通過投影 purity）；`OrthogonalProjection.ORTHOGONAL_ROOM_RENDER` 縮短牆面＋新增 `zoneFloor` 底色；`CafeScene.drawRoomOrtho` 依 `zoneAt` 上分區底色（＋`shadeColor` 二階明暗），`buildOrthoFraming` 沿用縮短後 wall/coreTopStrip；`ortho-demo-layout` 重排 23 件。更新 `ortho-room-zones`（zoneAt 分割）／`ortho-demo-layout`（23 件/連續帶/成組/動線）／`camera-framing`（新 wall/strip 幾何）／`ortho-projection`（身份中性）／`build-consistency` 測試。版本機械升版 0573a→0574a、`check.js`（版本／Build／obsolete `?v=0573a`／protected hash 更新 OrthogonalProjection/ortho-room-zones/GridSystem/flat-presets/viewport-metrics）。未改投影軸向/cell 尺寸、未重畫家具、未新增營運/角色/訂單/店員/工作站行為、未改存檔 key／schema（`catCafePhaserV0540`／5401／5401）。real-browser before/after 證據 `docs/evidence/v0574/`。細節見 [V0574 結果](./V0574_ORTHOGONAL_COMPOSITION_RESULT.md)、[驗收](./V0574_ORTHOGONAL_COMPOSITION_ACCEPTANCE.md)、[比較 HTML](./V0574_ORTHOGONAL_COMPOSITION_COMPARISON.html)。
- 後續（未核准前不執行）：`ART-0574-CORE-ORTHOGONAL-FURNITURE`（核心 10～12 件正交重作，僅在本構圖與分區實機通過後）；`ARCH-0575-STATION-REGISTRY`（可用 `ortho-room-zones` 為空間依據，行為本次仍不做）。→ **更新**：家具重作再延後至「滿版操作修正」通過後（見 [DEC-022](#dec-022正交滿版取景zoompan-修正與分區視覺清理accepted)），改編號 `ART-0576`。

## DEC-022｜正交滿版取景、Zoom/Pan 修正與分區視覺清理（Accepted）

- 日期：2026-07-26
- 狀態：Accepted
- 背景：`V0.57.4-alpha` 於真實 iPhone Safari 驗收**未通過**，三項問題：(1) 房間四周留白仍太多、像置中展示卡片；(2) **放大後無法左右上下平移**——有 zoom 沒有效 pan（P0 Runtime）；(3) 房間最左／最右出現不明**深色直條**，被理解為陰影／禁區。判定：Orthogonal 方向與兩格門維持，先修 zoom/pan、滿版構圖與分區視覺，家具重畫繼續延後。
- 決策：
  - **Zoom-in 後必須可 pan（P0）：Accepted**——放大後可向左／右／上／下拖曳查看細節，只在抵達 `roomBounds` 邊界才停止；縮小可見整房並置中；不得「有 zoom 沒 pan」；clamp 依當前 zoom 與 view 重新計算，房間大於 view 的軸向允許平移、小於 view 的軸向才鎖定置中；不建立第二套 CameraController、不硬編碼裝置 scroll/zoom。
  - **根因（已稽核，非放寬 magic number）**：互動平移把 `camera.scrollX/Y` 直接位移後，clamp 以 **`camera.midPoint`** 重算中心並 `centerOn` 回去；但 Phaser 的 `midPoint` 只在 `preRender` 更新，位移當下讀到的是**過期值**，等於把剛平移的量歸零 → pan 失效（自動化證據曾用 `centerOn` 更新 midPoint 故未暴露）。**修正：clamp 改由即時 `scrollX + width/2` 推導中心**（`viewCentre()`），不再讀過期 midPoint。
  - **左右深色直條清除：Accepted**——來源為 `zoneFloor.outer`（x0/x9）用了暗色 `0x7f6549`。改為**中性淺色地板**；所有 zone tint 改為低對比淺暖色（不像陰影／禁區）；`zoneAt()` 對未知 key 回退 `outer`（中性）；外圈為可行走／可擺放的真實地板，不得以暗色暗示「非核心區」。
  - **顯著減少四周留白：Accepted**——根因是門固定於 x7-8 使首屏取景**寬度受限**（width-constrained），房間高度只填約 87% canvas。**在不裁掉門與關鍵區的前提下**：(a) 縮小 `marginCss` 10→8；(b) 縮小情境列保留 `toolbarReserveCss` 78→40（首屏無選取時整條保留是浪費、變成上下留白；情境列僅選取時短暫覆蓋）；(c) 把背牆做成**真實有家具的較高背牆**（wainscot 護牆板＋牆飾＋門，`wallHeight 155→260`、`coreTopStrip 138→220`、`doorHeight 118→168`）填滿上方，而非空白牆；(d) 房外背景改為近地板暖色，避免「卡片墊底」。首屏上下留白由 V0574 實測 ~44px 降至 **~18px（390/393）/26px（430）**。cellWidth/cellHeight 88×120 不變。
  - **誠實限制記錄：Accepted**——門在 x7-8＋cell 88×120 使 portrait 天生 width-constrained，**無法在不裁門下 100% 填滿高度**；本版以縮牆浪費、加高有家具的背牆、去情境列浪費把留白降到 ~18px，並保留 zoom-out 看整房、zoom-in pan 探索。單件家具尺寸未放大（幾何鎖定）。
  - **分區底色只作輔助：Accepted**——低飽和淺色 hint，辨識主要靠家具配置（連續服務帶／兩組座位／集中貓咪）；本版沿用 V0574 的 23 件成組 Demo。
  - **iso 暫時仍為預設與 rollback**；Orthogonal 仍 URL opt-in。
- 實作（本任務 `ARCH-0575` 完成）：`CameraController` 修正 clamp（`viewCentre()` 以即時 scrollX 推導、取代過期 midPoint；pan/pinch/wheel/resize 後重 clamp；未建立第二套 controller）；`camera-framing` `marginCss 10→8`、`toolbarReserveCss 78→40`；`OrthogonalProjection.ORTHOGONAL_ROOM_RENDER` 加高牆/門/strip、`zoneFloor` 改中性低對比（`outer` 淺色）、新增 `backdropFill`／`wainscot`；`CafeScene.drawRoomOrtho` 背景改 `backdropFill`＋畫 wainscot 護牆板/molding、floor 依 `zoneAt` 上中性淺色。新增測試：`camera-framing`（zoom-in 兩軸 pan range>0、view>room 鎖中心）、`ortho-projection`（zoneFloor 每 zone 淺色無暗帶、outer/aisle 中性、backdrop 暖色）、`browser-smoke`（**真實指標拖曳後 scrollX/scrollY 改變、X/Y pan 皆有效、x0/x9 取樣非暗色**）。版本機械升版 0574a→0575a、`check.js`（版本/Build/obsolete `?v=0574a`/protected hash 更新 OrthogonalProjection/camera-framing/GridSystem/flat-presets/viewport-metrics）。未改投影軸向/cell 尺寸、未重畫家具、未新增營運/角色/訂單/店員/工作站行為、未改存檔 key／schema（`catCafePhaserV0540`／5401／5401）、未改 logical 存檔入口。real-browser before/after 證據 `docs/evidence/v0575/`＋每張指標 `metrics.json`。細節見 [V0575 結果](./V0575_ORTHOGONAL_FULLBLEED_PAN_RESULT.md)、[驗收](./V0575_ORTHOGONAL_FULLBLEED_PAN_ACCEPTANCE.md)、[比較 HTML](./V0575_ORTHOGONAL_FULLBLEED_PAN_COMPARISON.html)。
- 後續（未核准前不執行）：`ART-0576-CORE-ORTHOGONAL-FURNITURE`（核心 10～12 件正交重作，僅在本滿版與操作修正實機通過後）；`ARCH-0576-STATION-REGISTRY`（行為本次仍不做）。→ **更新**：家具重作再延後至「房間外殼與門比例」通過後（見 [DEC-023](#dec-023視覺房間外殼與邏輯-grid-分離門比例修正accepted)）。

## DEC-023｜視覺房間外殼與邏輯 Grid 分離、門比例修正（Accepted）

- 日期：2026-07-26
- 狀態：Accepted
- 背景：`V0.57.5-alpha / 0575a` 於真實 iPhone Safari 驗收：**Zoom/Pan 通過（凍結核心行為）**、Orthogonal 方向與右上入口位置通過；但**房間外殼滿版感未通過**（四周仍見大量無功能房外背景、像置中卡片）、**視覺門比例未通過**（近兩格寬的大型深色矩形，像倉庫入口/牆洞，與家具/角色不協調）。判定：小範圍修正房間外殼滿版與門比例，**不重構 Camera、不重畫家具**。Build 0575a→0575b（package 維持 0.57.5-alpha）。
- 決策：
  - **Zoom/Pan 核心凍結：Accepted**——V0575 的 `viewCentre()`/pan/clamp 不再重構；本次 CameraController 核心不改（其受保護狀態不變）。
  - **視覺房間外殼可超出邏輯 Grid：Accepted**——留白根因之一是房間外殼只畫到邏輯 10×8 Grid 矩形，之外即背景。改為把**牆面＋地板視覺外殼畫到超出 Grid**（顯示用 world px：`shell.side/top/bottom`），使房間材質延伸到 safe viewport 邊緣，手機首屏「畫面就是咖啡廳」。**延伸區為純視覺、不新增 placeable cells、不改 placeableMask/Occupancy/Grid/存檔**；以細牆腳線/收邊區分可玩區（取消過度明顯的矩形「卡片」外框）。實測手機 390/393/430 首屏外圈背景 external margin ≈ **0**。可 zoom-out 看整房、zoom-in pan 查看外圍。
  - **視覺門與邏輯入口分離：Accepted**——`logicalEntranceZone` 維持兩格 x7-8（整數格）；新增較小的 `visualDoorBounds`（**約 1.4 cellWidth、~123 world px 寬、124 world px 高**，置於 x7-8 中央、grid-coord 空間），**不再等於兩格 logical entrance**；`customerEntryPoint (8,0)`／`customerEntryStaging (8,1)`／x9 牆面／舊 logical 存檔入口 `(8,7)/(9,7)` 皆不變。
  - **門的視覺最低要求：Accepted**——Prototype 程式繪製的真實咖啡廳門：木質門扇（非深色黑洞）＋玻璃格窗（muntins）＋黃銅門把＋門框，清楚層次；比例與櫃檯/角色協調，可由後續 `ART` 正式重畫。
  - **iso 暫時仍為預設與 rollback**；Orthogonal 仍 URL opt-in。
- 實作（本任務 `ARCH-0575A` 完成）：`ortho-room-zones` 新增 `logicalEntranceZone`＋縮小 `visualDoorBounds`（1.4 格、置中）；`OrthogonalProjection.ORTHOGONAL_ROOM_RENDER` 新增 `shell`（side84/top120/bottom132/floorFill）、`playAreaLineWidth`、`doorHeight 168→124`、door 顏色改為 `frame/leaf/glass/glassEdge/handle/panel/matFill`；`CafeScene.drawRoomOrtho` 畫視覺外殼（floor+wall 延伸超出 Grid）、以細收邊取代粗卡片外框、畫較小有層次的門。**未改 CameraController 核心**（clamp/pan/viewCentre 不動）、未改投影軸向/cell 尺寸/placeableMask/Grid/Occupancy/Placement/Pathfinding/存檔 key/schema/logical 入口。新增/更新測試：`ortho-room-zones`（logicalEntranceZone＋visualDoorBounds<2 格/置中/x9 牆）、`ortho-projection`（shell 延伸、door leaf 非暗、glass>leaf>frame 層次、doorHeight ~124）、`browser-smoke`（**shell external margin≈0、door 中央非暗塊、zoom-in pan 仍有效**）。Build 機械升版 0575a→0575b（package 維持 0.57.5-alpha）、`check.js`（Build/APP_VERSION/obsolete `?v=0575a`/protected hash 更新 OrthogonalProjection/ortho-room-zones/GridSystem/flat-presets/viewport-metrics；camera-framing 與 CameraController 未改）。real-browser 證據 `docs/evidence/v0575b/`＋`metrics.json`。細節見 [V0575B 結果](./V0575B_ORTHOGONAL_ROOM_SHELL_RESULT.md)、[驗收](./V0575B_ORTHOGONAL_ROOM_SHELL_ACCEPTANCE.md)、[比較 HTML](./V0575B_ORTHOGONAL_ROOM_SHELL_COMPARISON.html)。
- 後續（未核准前不執行）：`ART-0576-CORE-ORTHOGONAL-FURNITURE`（僅在房間外殼與門比例實機通過後）；`ARCH-0576-STATION-REGISTRY`（行為本次仍不做）。
