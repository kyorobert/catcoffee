# ART-0577F pinkTableLong 視角 Gate 結果

## 任務界線

- 任務：`ART-0577F-PINK-TABLE-VIEWPOINT-GATE`
- 基線：`V0.57.7-alpha｜正交家具視覺重構第一階段`／Build `0577e`
- 狀態：**候選 A 視角已核准；原候選 PNG 不可直接上線**
- 本次只探索 `pinkTableLong` 的視角語言，未製作或接入正式素材。
- `assets/furniture/orthogonal/`、Runtime visual mapping、rotation resolver、家具
  `x/y/r`、footprint、Save、Build 與 module query 均未變更。
- `chair`、`counter`、`dessert` 與其餘家具未重畫。
- 先前的正立面主導中間稿已標示為
  `REJECTED_FRONT_ELEVATION_DOMINANT`，只留在 `tools/` 作失敗追蹤，不作為候選母稿。

## 候選產製方式

六組 A–F 均由零開始，各自產生一對：

- 橫向：2×1 長桌。
- 縱向：1×2 長桌。
- 同組兩張以相同材質、桌面輪廓與支撐語言表達同一件家具旋轉 90 度。
- 共同提示方向為 `TOP-SURFACE-FIRST NEAR-TOP-DOWN FURNITURE`，避免正立面、
  前側板或桌腳成為主要辨識來源。
- 生成圖先使用純色去背背景，再離線轉為透明 PNG；未取代正式 Runtime PNG。

## A–F 的有意義差異

| 候選 | 視角／造型重點 | 橫向桌面像素 proxy | 縱向桌面像素 proxy | 狀態 |
| --- | --- | ---: | ---: | --- |
| A | 最高近俯視；支撐最少，桌面量體最大 | 93.9% | 93.9% | 視角／長軸關係已核准 |
| B | 高近俯視；保留較多桌腳與薄前緣資訊 | 89.2% | 90.7% | 未核准 |
| C | 高近俯視；圓角與柔和桌面輪廓最明顯 | 92.2% | 93.0% | 未核准 |
| D | 高近俯視；桌緣最薄、前側板最弱 | 92.6% | 93.8% | 未核准 |
| E | 強近俯視；四角支撐結構較清楚 | 88.6% | 89.6% | 未核准 |
| F | 平衡近俯視；桌面裝飾識別最強 | 87.0% | 89.7% | 未核准 |

> 上表的百分比是以粉色／奶油色像素占非透明像素的離線 proxy，用來量化
> 「桌面大於支撐」的趨勢，不等於產品已判定達到 85–90% 的辨識面積。

## 十項視覺檢查

1. **第一眼是否先看到桌面**：六組的桌面均大於支撐，但仍需產品在實際風格下選擇。
2. **橫向是否讀成 2×1**：六組均有明確橫向長軸；格線圖只作概念占地對照。
3. **縱向是否讀成 1×2**：六組均有明確深度長軸，未以 runtime offset 或 footprint 補救。
4. **縱向是否仍像小桌／凳子**：手機縮圖已提供；是否完全排除誤認仍由產品 Gate 判定。
5. **同組是否像同一家具**：每組共用配色、桌緣與支撐家族；尚未進入正式四向校準。
6. **餐具是否有可放桌面**：杯盤 overlay 可落在水平與縱向可見桌面，不落在前側板。
7. **桌面辨識比重**：proxy 為 87.0%–93.9%；產品視覺判斷仍未核准。
8. **390×844 是否可辨方向**：已做原尺寸畫布預覽；A–F 的長軸在縮圖仍可分辨。
9. **是否仍由正立面主導**：相較 0577e 已顯著降低；候選 B／E／F 保留較多支撐資訊，
   是否過多仍待產品選擇。
10. **能否延伸到其他家具**：本 Gate 刻意不推論到 chair／counter／dessert；
    只有核准桌子視角後才能建立共用正式語言。

上述內容是客觀盤點，不是六組全部通過。產品於 2026-07-29 選擇候選 A，
只核准觀看角度、桌面占比及 2×1／1×2 長軸關係。

## 證據

- [A–F 總覽](./evidence/v0577f-table-viewpoint-gate/candidate-pairs-overview.png)
- [2×1／1×2 格線比例](./evidence/v0577f-table-viewpoint-gate/candidate-pairs-on-grid.png)
- [與現有貓咪比例](./evidence/v0577f-table-viewpoint-gate/candidate-pairs-with-cat.png)
- [杯盤可用桌面](./evidence/v0577f-table-viewpoint-gate/candidate-pairs-with-place-settings.png)
- [0577e 退件比較](./evidence/v0577f-table-viewpoint-gate/rejected-v0577e-comparison.png)
- [390×844 實際畫布縮圖](./evidence/v0577f-table-viewpoint-gate/actual-mobile-scale-preview.png)
- [候選量測 JSON](./evidence/v0577f-table-viewpoint-gate/candidate-metrics.json)
- [互動式比較頁](./ART-0577F_PINK_TABLE_VIEWPOINT_GATE_COMPARISON.html)

## 結論與停止條件

本卡已收到「核准候選 A，可以進入正式素材整合」。原候選稿仍不可原樣上線；
正式整合前須先完成硬質薄桌面精修，並以 chair／counter／dessert 概念驗收稿確認
共用近俯視語言。詳見
[`ART-0577F_A_SHARED_VIEWPOINT_RESULT.md`](./ART-0577F_A_SHARED_VIEWPOINT_RESULT.md)。
