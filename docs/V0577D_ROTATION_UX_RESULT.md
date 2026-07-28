# V0577D 家具旋轉體驗重構結果

版本：`V0.57.7-alpha｜家具旋轉體驗重構版`  
Build：`0577d`  
Task：`FIX-0577D-ROTATION-UX-ENVELOPE-AND-HANDOFF-COMPLETION`

## 完成內容

1. `orthogonal-furniture-rotation.js` 成為 Orthogonal 旋轉的唯一純資料 resolver。
2. 新增 `fixed / axis2 / cardinal4` 集中政策；第一批 12 件政策如下：

| 家具 | Policy |
|---|---|
| counter | cardinal4 |
| coffeeMachine | cardinal4 |
| oven | cardinal4 |
| washStation | cardinal4 |
| dessert | cardinal4 |
| smartOrder | cardinal4 |
| pinkTableLong | axis2 |
| roundTable | fixed |
| chair | cardinal4 |
| creamSofa | cardinal4 |
| doubleCatTree | cardinal4 |
| scratchPost | fixed |

3. 固定 edit-session envelope；非方形旋轉以包絡中心的最小平方位移挑選整數格，
   同距時使用 `clockwise-envelope-edge-order`，不依房間合法性自動找別格。
4. `r0 South / r1 West / r2 North / r3 East` 保持順時針；axis2 的 legacy r2/r3
   只做顯示等價，不在載入時改寫存檔。
5. Entity、Ghost、紅綠 footprint、Placement input、正式 commit、Occupancy、
   Art Debug 與 Browser metrics 全部使用同一 resolved candidate。
6. 旋轉衝突、越界與入口保留皆保持正式狀態不變；只呈現紅色 preview，放開／按鈕
   失敗提示一次，不寫存檔、不動 coins、不重建 Occupancy。
7. Cancel 恢復進入編輯時的原始 `x/y/r`；Store、Sell、成功 commit 均有集中清理。
8. 編輯工具列沿用 0577c 的底列就地替換；fixed policy 的 Rotate 明確 disabled。
9. Art Debug 顯示 policy、resolved x/y/r、movement delta、envelope、cells 與 pivot。

## 旋轉範例

- `pinkTableLong`：`(3,3,r0) → (4,3,r1) → (3,3,r0)`；axis2 兩步精確回圈。
- `counter`：`(3,3,r0) → (4,3,r1) → (3,4,r2) → (3,3,r3) → (3,3,r0)`。
- 1×1 木椅四向保持同格；fixed 圓桌／抓柱 Rotate 不改正式狀態。
- 17 種非方形 footprint 全部完成整數候選、固定包絡與可逆回圈驗證。

## 未改契約

CameraController、ROOM_CONFIG、Grid／Occupancy／Placement 規則、Pathfinding、
家具 PNG、家具 ID／price／footprint／玩法 metadata、save key、schema、migration、
iso／flat 顯示均未修改。第二批 35 件未開始。

## 證據

`docs/evidence/v0577d/` 含 24 張 PNG 與 `metrics.json`。自動化使用真實
`#rotateBtn` 點擊及 390／393／430 觸控 pointer；iPhone Safari 真機仍 pending。
