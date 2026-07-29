# ART-0577G 共用視角產品識別校正結果

## 產品部分核准（2026-07-29）

- `pinkTableLong_softCute_concept`：**產品與視角方向核准**。
- `pinkTableLong_hardCafe_concept`：**作為另一項獨立商品方向核准**。
- 兩款桌不互相取代；正式尺寸、正式 ID、價格、Runtime、素材覆寫均未核准。
- `chair`：**退回重做**。本稿仍由正立面與高椅背主導，側向仍偏薄；下一稿
  必須使用固定上方鏡頭，讓同一完整椅面在四方向旋轉，椅背只作遠端次要 cue。
- `counter`：只核准雙貓掌正面及員工收納背面的**產品識別**；四向觀看鏡頭
  不一致、左右端面過窄，禁止正式整合。
- `dessert`：只核准高型蛋糕展示櫃、甜點陳列及貓咪下櫃的**產品識別**；
  front／back 仍由正立面主導、左右過窄，禁止正式整合。
- 下一步只建立真實 390×844 咖啡廳場景合成 Gate；正式 PNG、Runtime、mapping、
  Build、Save、ZIP 與其餘 35 件仍凍結。

## 狀態

- 任務性質：概念 Gate／驗收稿校正。
- 版本基線：`V0.57.7-alpha`／Build `0577e`，不升版。
- 狀態：`CONCEPT_ONLY_UNAPPROVED`。
- 正式 `assets/furniture/orthogonal/`、Runtime、visual mapping、rotation、
  footprint、Placement、Occupancy、Save、schema 5401、migration 5402 均未修改。
- 本輪共用的是近俯視觀看角度，不共用家具輪廓，也不代表 shared viewpoint
  整批獲准。

## pinkTableLong：兩項不同商品方向

本輪把 A 視角固定為共同幾何基準，但明確拆成兩條不互相覆蓋的產品線：

### `pinkTableLong_softCute_concept`

- 奶油粉、柔和漆面、奶油色細邊與極小貓掌／愛心角落鑲飾。
- 可愛感來自色盤與小型裝飾，不來自軟墊、縫線、蓬鬆高光或厚床墊輪廓。
- 保持薄硬桌緣、次要桌腳及 A 的 2×1／1×2 長軸。
- 桌面像素 proxy：橫向 **96.3%**、縱向 **94.7%**。

### `pinkTableLong_hardCafe_concept`

- 霧面硬質粉紅漆木／貼面與稀疏直線木紋，產品表情較克制。
- 保持 A 視角、薄硬桌緣、次要桌腳、無厚前板／粗橫梁。
- 桌面像素 proxy：橫向 **91.8%**、縱向 **92.0%**。

兩者是不同商品方向；本輪不建立正式 ID，也不覆寫現行 `pinkTableLong`。

## chair

- 奶油色椅墊保留，四向都可見明確椅面。
- 正面保留貓耳輪廓與貓臉挖孔；背面保留貓耳外形但不複製正面貓臉。
- right／left 顯示椅面深度、椅背厚度與前後腳，不是單一薄片。
- front／right／back／left 依順時針排列，四向是同一件椅子。
- 相較上一輪 generic 木椅稿，本輪恢復正式 chair 的貓咪產品識別。
- 尚未進行正式畫布、anchor、像素密度與 Runtime 尺寸校準。

## counter

- front 以正式雙貓掌奶油面板作產品識別基準。
- back 保留員工側開放收納、貓窩／籃具與咖啡廳小物語意。
- right／left 保留有厚度的端面、框架及檯面外挑，沒有只把 front 壓扁。
- 檯面可見量提高，但沒有套用桌類的 90% 上表面規則；正反功能面仍是主體。
- 尚未進行正式 socket、anchor 或 Runtime 尺寸校準。

## dessert

- 恢復正式家具的高型蛋糕展示櫃類型，拒絕上一輪低矮斜玻璃冷藏台方向。
- front 保留三層玻璃陳列、實際蛋糕內容與下方雙貓咪櫃門。
- right／left 保留展示深度、層板與甜點；不是薄側片。
- back 使用補貨／服務滑門與背板語意，仍維持同一高型櫃體。
- 頂面與內部深度比正式稿更可見，但原正式正面產品識別未被 generic 化。
- 尚未進行正式玻璃透明度、畫布、anchor 與 Runtime 尺寸校準。

## 自審結論

- `pinkTableLong`：兩個產品方向成立，均保留 A 視角且不像床墊。
- `chair`：奶油椅面與貓咪椅背同時成立；side view 保留足夠椅面深度。
- `counter`：仍能直接辨識為正式雙貓掌吧台，正反功能面成立。
- `dessert`：仍是正式高型蛋糕展示櫃，不是低矮展示台。
- 本輪稿件可交產品 Gate，但不等於任何正式素材核准。

## 保護驗證

- 正式 Orthogonal PNG：48 張，對 Build 0577e 備份 SHA-256 tree diff `0`。
- 正式 Runtime JS：58 個，對 Build 0577e 備份 SHA-256 tree diff `0`。
- `index.html`、manifest、package、lock、`check.js`、build-info 均未修改。
- `npm test`：通過。
- `npm run test:build`：通過。
- `npm run test:ortho-furniture`：通過。
- `npm run check:deploy`：通過。
- `npm run check:dev`：通過，包含 Browser Smoke。

## 證據

- [總覽](./evidence/v0577g-shared-viewpoint-rework/shared-viewpoint-rework-overview.png)
- [粉紅桌雙產品方向](./evidence/v0577g-shared-viewpoint-rework/pink-table-dual-product.png)
- [chair 正式／四向對照](./evidence/v0577g-shared-viewpoint-rework/chair-formal-vs-rework.png)
- [counter 正式／四向對照](./evidence/v0577g-shared-viewpoint-rework/counter-formal-vs-rework.png)
- [dessert 正式／四向對照](./evidence/v0577g-shared-viewpoint-rework/dessert-formal-vs-rework.png)
- [與現有貓咪比例](./evidence/v0577g-shared-viewpoint-rework/furniture-with-cat-scale.png)
- [390×844 手機縮圖](./evidence/v0577g-shared-viewpoint-rework/mobile-390x844.png)
- [88×120 cell ratio](./evidence/v0577g-shared-viewpoint-rework/orthogonal-cell-ratio-88x120.png)
- [量測資料](./evidence/v0577g-shared-viewpoint-rework/metrics.json)
- [比較頁](./ART-0577G_SHARED_VIEWPOINT_REWORK_COMPARISON.html)

## 停止條件

在產品分別核准兩張桌與 chair／counter／dessert 前：

- 不覆寫正式 PNG；
- 不接 Runtime／visual mapping；
- 不升 Build；
- 不建立部署 ZIP；
- 不開始其他家具或第二批 35 件。
