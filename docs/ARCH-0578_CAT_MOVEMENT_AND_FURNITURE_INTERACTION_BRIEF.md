# ARCH-0578 規格草案：貓咪移動與家具互動（未核准，僅規格）

> 狀態：**草案／未核准**。只描述後續架構任務的範圍、風險與分階段方案，供產品負責人決策。**不得**在未核准前實作。

## 背景
目前貓咪由 `cat-behavior-core`／`grid-pathfinder`（皆為受保護純核心）驅動，在 10×8 Grid 上移動；家具以 `x/y/r` 佔格、`interactionSockets` 定義互動點（目前僅美術/除錯用途，未接行為）。V0577C 已讓家具旋轉/占格/視覺一致（[DEC-028](./decisions.md)），為互動提供穩定的 footprint 與 socket 幾何基礎。

## 目標（若核准）
1. 讓貓咪能**尋路到家具的 interaction socket** 並執行對應行為（睡、抓、吃、跳上等），以家具 `stationType`／`interactionSockets`／`walkBlocking` 為資料來源。
2. 家具佔格與 socket 於旋轉後正確跟隨（重用 V0577C resolver 的 `footprintCells`／方位，不另算）。
3. 互動具入場/占用/離場狀態，避免多貓搶同一 socket 或卡死。

## 待答（Phase A 稽核先回答）
- socket 的世界/格座標是否隨 cardinal 方位旋轉？由 resolver 提供或新增純函式？
- `walkBlocking` 與 pathfinder 的耦合：家具旋轉改變占格時，路網如何即時更新（現有 `onFurnitureLayoutChanged`）？
- 互動占用是否需要新的 runtime 狀態欄位？**是否需要改 save schema**？（若需要 → 觸發 STOP，先報產品負責人）
- 與店員/顧客/訂單系統的邊界（本卡只做「貓×家具」，不擴張到營運系統）。

## 硬邊界
- 不改 furniture ID／price／footprint／entrance／Grid／`x/y/r`／save key/schema/migration（除非 Phase A 稽核證明必要並經核准）。
- 不建第二套 Grid/Occupancy/Pathfinder；重用 `SpatialGrid`／`OccupancySystem`／`grid-pathfinder`／resolver。
- 純核心（behavior/pathfinder）維持無 Phaser/DOM 依賴。
- 不宣稱店員/顧客/訂單/故事系統完成。

## 分階段（規格）
- Phase A：socket 旋轉與路網耦合稽核＋STOP 判定（是否動 schema）。
- Phase B：純資料「貓×家具互動解析」（目標 socket、占用、離場），純核心測試。
- Phase C：Scene/動畫接線與 browser smoke；iPhone Safari 實機（保留產品負責人）。

## 相依
- 前置：V0577C（本版，提供一致的 footprint/方位）。
- 與 [[ART-0577D]] 可並行；美術與互動分開立卡。
