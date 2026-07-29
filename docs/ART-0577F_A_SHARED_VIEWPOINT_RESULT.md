# ART-0577F 候選 A 共用視角語言 Gate 結果

## 產品核准輸入

- 產品已核准候選 A 的近俯視觀看角度、桌面主導比例及 2×1／1×2 長軸關係。
- 核准不代表候選稿可原樣上線。
- 基線維持 `V0.57.7-alpha`／Build `0577e`。
- 正式 Runtime、`assets/furniture/orthogonal/`、visual mapping、rotation resolver、
  furniture metadata、Save、schema 5401、migration 5402 均未修改。

## pinkTableLong 硬質材料精修

精修稿保留 A 的視角與長軸關係，並依產品條件調整：

- 桌面改為硬質漆木／硬質貼面語言，降低軟墊、長椅與床墊感。
- 桌面邊緣變薄且剛性清楚。
- 桌腳略為加強，但只作次要支撐。
- 無厚前板、粗橫梁或大面積正立面。
- 橫向與縱向仍是同一件家具旋轉 90 度。
- 驗收圖由核准輪廓稿加上可重建的硬質表面處理產生：移除中央蓬鬆漸層，
  保留三像素內的既有硬邊，並加入稀疏直線漆木紋；不以 Runtime offset 補救。
- 離線粉／奶油色桌面像素 proxy：橫向 **91.8%**、縱向 **92.0%**；
  達到本 Gate 的 ≥90% 量化門檻。這是 proxy，不取代產品目視驗收。

## 共用語言驗收稿

本次只產生概念稿，沒有重畫正式家具：

- `chair`：四向都保留大面積硬木椅面；椅背只作方向提示，側向不是薄片。
- `counter`：四向以硬質檯面為第一辨識；顧客封閉面／員工開放面壓縮成低矮次要結構。
- `dessert`：四向以斜玻璃展示面與展示深度為第一辨識；木質底座壓成淺帶。

三件共用語言稿的狀態均為 `UNAPPROVED_SHARED_LANGUAGE_DRAFT`。它們不是正式 PNG，
也不構成開始第二批家具的核准。

## 證據

- [A 硬質桌面精修](./evidence/v0577f-a-shared-viewpoint-gate/approved-a-hard-surface-table.png)
- [原 A 與精修對照](./evidence/v0577f-a-shared-viewpoint-gate/candidate-a-original-vs-refined.png)
- [共用視角總覽](./evidence/v0577f-a-shared-viewpoint-gate/shared-viewpoint-language-overview.png)
- [chair 四向](./evidence/v0577f-a-shared-viewpoint-gate/chair-cardinal-acceptance.png)
- [counter 四向](./evidence/v0577f-a-shared-viewpoint-gate/counter-cardinal-acceptance.png)
- [dessert 四向](./evidence/v0577f-a-shared-viewpoint-gate/dessert-cardinal-acceptance.png)
- [與現有貓咪比例](./evidence/v0577f-a-shared-viewpoint-gate/shared-viewpoint-with-cat.png)
- [390×844 預覽](./evidence/v0577f-a-shared-viewpoint-gate/actual-mobile-scale-preview.png)
- [量測資料](./evidence/v0577f-a-shared-viewpoint-gate/metrics.json)
- [比較頁](./ART-0577F_A_SHARED_VIEWPOINT_COMPARISON.html)

## 停止條件

本次停在共用視角語言 Gate。產品需先核准：

1. A 精修稿可作為正式 `pinkTableLong` 生產基準。
2. chair／counter／dessert 的共用近俯視語言方向可延伸。

在明確核准前，不覆寫正式 PNG、不接 Runtime、不升 Build、不建立部署 ZIP，
也不批量重畫其他家具。
