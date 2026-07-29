# ART-0577I Shared-camera Café Composition Gate 驗收

狀態：`AWAITING_PRODUCT_REVIEW`  
基線：`V0.57.7-alpha` / Build `0577e`  
Runtime／正式素材狀態：未變更

## 1. 驗收入口

- [比較頁](./ART-0577I_SHARED_CAMERA_CAFE_COMPOSITION_COMPARISON.html)
- [總覽](./evidence/v0577i-shared-camera-cafe-composition/overview.png)
- [正常 390×844](./evidence/v0577i-shared-camera-cafe-composition/390x844-cafe-composition-normal.png)
- [編輯格線 390×844](./evidence/v0577i-shared-camera-cafe-composition/390x844-cafe-composition-edit-grid.png)

## 2. Gate 檢查表

### A. 完整咖啡廳

- [ ] 服務帶一眼可辨識，且不是素材散放。
- [ ] SoftCute 與 HardCafe 兩個桌椅島各自成立。
- [ ] 中央主要通道清楚。
- [ ] 側邊貓咪互動／裝飾區不阻塞主要動線。
- [ ] 整體看起來是咖啡廳，不是格子測試板或 contact sheet。

### B. 固定共享鏡頭

- [ ] 桌子、椅子、吧台、展示櫃與貓咪像由同一個高角度鏡頭觀看。
- [ ] 家具維持必要厚度，不是平面正面 icon。
- [ ] 同類家具接地基線與陰影方向一致。
- [ ] 不需要 Runtime offset 才能理解視角。

### C. 地板資訊層級

- [ ] 正常畫面的木地板是低對比材質，不是棋盤。
- [ ] 正常畫面不顯示完整 gameplay grid。
- [ ] 編輯格線版本仍可辨識 `88:120` 空間比例。
- [ ] 格線只增加擺放資訊，不改變家具位置或 Camera。

### D. 家具與貓咪

- [ ] 現有貓咪與桌椅高度、寬度關係合理。
- [ ] 貓咪不被家具縮成比例尺，也不大到壓過服務設備。
- [ ] chair 四方向在實景中仍以完整椅面為主。
- [ ] counter 顧客面／員工面及左右端面仍可理解。
- [ ] dessert 在四向語言中仍被辨識為甜點展示櫃。

## 3. 本輪不授予的核准

即使本頁所有構圖項目通過，也不自動核准：

- 正式家具尺寸。
- 新家具 ID、價格、解鎖或 footprint。
- 正式 PNG 覆寫。
- Runtime mapping 或 visual override。
- 第二批 35 件家具。
- 貓咪 × 家具互動 Runtime。

產品若通過本 Gate，下一張卡仍需明確指定哪些概念進入正式規格／素材整合。

## 4. 技術回歸 Gate

完成後需確認：

- 正式 Orthogonal PNG：48 張，與 0577e 受保護基線 diff `0`。
- Runtime JS：58 個，與 0577e 受保護基線 diff `0`。
- Build：`0577e`。
- package：`0.57.7-alpha`。
- Save key：`catCafePhaserV0540`。
- schema：`5401`。
- migration：`5402`。
- 不建立部署 ZIP。

必要測試：

- `npm test`
- `npm run test:build`
- `npm run test:ortho-furniture`
- `npm run test:entrance`
- `npm run test:ortho-area`
- `npm run test:ortho-rotation`
- `npm run test:rotation-state`
- `npm run check:deploy`
- `npm run check:dev`

## 5. 實際驗證結果

2026-07-29 執行結果：

| Gate | 結果 |
|---|---|
| `npm test` | 通過 |
| `npm run test:build` | 通過，Build `0577e` |
| `npm run test:ortho-furniture` | 通過，12 IDs / 48 PNG / iso-flat fallback |
| `npm run test:entrance` | 通過，migration 5402 與入口契約不變 |
| `npm run test:ortho-area` | 通過，Room Skin / placeable mask 不變 |
| `npm run test:ortho-rotation` | 通過，fixed / axis2 / cardinal4 不變 |
| `npm run test:rotation-state` | 通過 |
| `npm run check:deploy` | 通過，58 個正式 JS modules |
| `npm run check:dev` | 通過，Chrome／Edge browser smoke 通過 |
| Comparison HTML browser check | Chrome／Edge HTTP 200；11/11 圖片解碼成功；0 pageerror / failed request |

額外保護比對：

- `assets/furniture/orthogonal/**/*.png`：48 張，對 0577e 備份 diff `0`。
- `assets/js/**/*.js`：58 個，對 0577e 備份 diff `0`。
- 12 張指定 evidence 全部存在；normal、edit-grid、no-characters 與
  with-characters 手機圖皆為 `390 × 844`。
- Comparison HTML 的 evidence 引用無缺漏。

## 6. 目前限制

- 這些畫面是可重建的 concept composite，不是實際 Runtime screenshot。
- screen-space staging 不是 Placement／Occupancy／Pathfinding 資料。
- iPhone Safari 真機仍需另行驗收；Chrome／Edge smoke 不能取代真機。
- chair、counter、dessert 的產品核准仍 pending。
