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
- 後續（未核准前不執行）：`ART-0571-CORE-ORTHOGONAL-FURNITURE`（核心 10～12 件正交重作）；`ARCH-0571-ECONOMY-SYSTEM`；`ARCH-0571-STATION-REGISTRY`（待正交房間與核心家具核准）。
