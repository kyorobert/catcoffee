# V0577D 家具旋轉體驗驗收

## 自動化驗收

| Gate | 結果 |
|---|---|
| fixed／axis2／cardinal4 政策 | 通過 |
| r0 South／r1 West／r2 North／r3 East | 通過 |
| 17 種非方形 footprint 可逆回圈 | 通過 |
| 1×1／2×1／1×2／2×2／3×2 | 通過 |
| 最小位移＋確定性 tie-break | 通過 |
| 無效旋轉不改 x/y/r、Occupancy、save | 通過 |
| conflict／boundary／entrance 紅色 preview | 通過 |
| Preview／Ghost／Entity／commit 同候選 | 通過 |
| Rotate／Cancel／Store 真實 DOM 點擊 | 通過 |
| 390×844／393×852／430×932 bottom-row pointer | 通過 |
| `elementFromPoint` 命中 Canvas／工具列 | 通過 |
| viewport resize 後候選一致 | 通過 |
| iso／flat／invalid projection 回歸 | 通過 |

## 證據清單

- 方向／回圈：`chair-{south,west,north,east,roundtrip}.png`、
  `counter-roundtrip.png`、`dessert-roundtrip.png`、
  `table-axis-{horizontal,vertical,roundtrip}.png`
- 無效狀態：`rotation-{conflict,boundary,entrance}.png`、`invalid-ghost.png`
- 觸控底列：`bottom-row-{left,centre,right,1x2,2x1,cancel}.png`
- 編輯與 Debug：`edit-mode-toolbar.png`、`art-debug-focused.png`
- 回歸：`iso-regression.png`、`flat-regression.png`
- 機器可讀數據：`metrics.json`

## 人工 Gate

- iPhone Safari 真機：**pending**。Chrome／Edge 自動化不能替代網址列、
  safe-area、手感與實際觸控誤差驗收。
- 第二批 35 件 Orthogonal 家具：**未核准、未開始**。

因此 Build 維持 alpha；不宣稱已完成真機產品驗收。
