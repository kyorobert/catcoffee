# V0577D 強制交接稽核

Task：`FIX-0577D-ROTATION-UX-ENVELOPE-AND-HANDOFF-COMPLETION`  
稽核日期：2026-07-28  
正式基線：V0.57.7-alpha／Build 0577b  
接手工作樹：V0.57.7-alpha／Build 0577c

## 1. 強制差異盤點

在任何 0577d 修改前，以現存 0577b 部署資料夾與 0577c 工作樹做逐檔 SHA-256
比對。0577b 基線有 559 個部署範圍檔案；0577c 相對基線為 49 個內容不同、
0 個缺失、18 個新增。32 個差異只屬 Build/query 機械更新；其餘為 0577c 的
旋轉 resolver、編輯工具列、Art Debug、文件、測試與證據。

受保護核心逐項稽核：

- `ROOM_CONFIG` 幾何、10×8 Grid、78 playable cells、入口 `(7,0)/(8,0)` 未改。
- `GridSystem`、`SpatialGrid`、三投影、Camera framing／CameraController 的行為未改；
  其中少數檔案只有 `?v=` import query 差異。
- `OccupancySystem`、`PlacementSystem`、Pathfinding、SaveAdapter 行為未改。
- save key `catCafePhaserV0540`、scene schema 5401、migration 5402 未改。
- 第一批 12 件、48 張 Orthogonal PNG 與其 SHA-256 未改；其餘 35 件仍是 base visual。
- iso 預設／rollback、flat 回歸、ortho URL opt-in 未改。

## 2. 0577c 可保留與必須退場

可保留：

- 單一 `orthogonal-furniture-rotation.js` resolver 的資料流方向。
- `r0 South / r1 West / r2 North / r3 East` 的順時針 cardinal 契約。
- `#selectionBar` 就地替換底部主導覽列的編輯模式。
- 簡化且唯讀的 Art Debug。

必須退場：

- DEC-028 的 corner-pivot 作為現行 UX。它雖使 Sprite 與 gameplay anchor 同源，
  卻讓 2×1／1×2／3×2 單按 Rotate 時產生可見位移。
- 將所有家具一律視為四方向可旋轉。
- 旋轉後另行搜尋「附近合法格」的作法；這會把 Rotate 偷換成搬動。

## 3. 0577d 接手結論

0577d 採固定 edit-session envelope、最小位移與確定性 clockwise tie-break：

- `fixed`：對稱家具不改正式旋轉。
- `axis2`：只有水平／垂直兩個有效狀態。
- `cardinal4`：四個正交方向。
- 非方形 footprint 以固定包絡中心為幾何目標；同距候選依
  `clockwise-envelope-edge-order` 決定，禁止依合法性自動搜尋。
- Entity、Ghost、Preview、Placement input、commit、Occupancy、Art Debug 與
  Browser evidence 都消費同一個 resolved candidate。
- 無效旋轉只顯示紅色 Ghost／footprint；正式 `x/y/r`、Occupancy、save、coins
  全部不變。

0577c 的歷史文件與證據保留；現行決策由 DEC-029 取代 DEC-028。

