# ART-0577J 家具共同比例、服務帶連續性與桌椅島精修 Gate 驗收

狀態：`AWAITING_PRODUCT_REVIEW`  
基線：`V0.57.7-alpha` / Build `0577e`  
正式素材／Runtime／部署：未變更

## 1. 驗收入口

- [比較頁](./ART-0577J_SHARED_SCALE_AND_SERVICE_BAND_COMPARISON.html)
- [總覽](./evidence/v0577j-shared-scale-service-band/overview.png)
- [正常 390×844](./evidence/v0577j-shared-scale-service-band/390x844-refined-normal.png)
- [編輯格線 390×844](./evidence/v0577j-shared-scale-service-band/390x844-refined-edit-grid.png)
- [ART-0577I 前後比較](./evidence/v0577j-shared-scale-service-band/art-0577i-before-after.png)
- [量測](./evidence/v0577j-shared-scale-service-band/metrics.json)

## 2. Product Gate（全部等待產品勾選）

### A. 共同比例

- [ ] 現有貓咪可作為穩定尺度基準。
- [ ] chair 不再像床、沙發或寬平台。
- [ ] counter 不再壓過整個服務帶。
- [ ] dessert 體積合理但仍是高型蛋糕展示櫃。
- [ ] coffee／wash 不再像與其他設備無關的小玩具。

### B. 服務帶

- [ ] A：緊密連續方案可接受。
- [ ] B：小間距方案可接受。
- [ ] C：均衡操作方案可接受。
- [ ] 已明確選定一個方案：`__________`
- [ ] 顧客面／員工面與入口／走道關係清楚。

> A／B／C 不會由 Codex 自動選定；未勾選前全部 pending。

### C. 桌椅島

- [ ] SoftCute 與 HardCafe 仍是兩種不同桌款。
- [ ] 椅子與桌邊距離自然。
- [ ] 大型 UI-like 粉／綠色塊已足夠退場。
- [ ] 小地毯、杯盤與朝向能建立分組，不需 Runtime 自動拼接。
- [ ] 中央走道足夠清楚。

### D. 完整手機畫面

- [ ] 正常／edit grid 共用完全相同 Camera、物件比例與位置。
- [ ] 無角色時仍是可讀的咖啡廳配置。
- [ ] 加入 Bean／Coal／Snow 後比例仍一致。
- [ ] 牆、入口、木地板、服務帶、兩座桌椅島與側邊貓區共同成立。
- [ ] 與 ART-0577I 相比有明確改善。

## 3. 不由本 Gate 核准

- 正式 PNG 覆寫。
- Runtime visual mapping。
- Build 升版。
- Save/schema/migration 變更。
- 第二批 35 件家具。
- A／B／C 自動選案。
- 貓咪 locomotion 修正或家具互動。
- iPhone Safari 真機通過。

## 4. 技術回歸 Gate

需保持：

- 正式 Orthogonal PNG 48 張，對 0577e 基線 diff `0`。
- Runtime JS 58 個，對 0577e 基線 diff `0`。
- Build `0577e`、package `0.57.7-alpha`。
- save key `catCafePhaserV0540`、schema 5401、migration 5402。
- 88×120、78 playable cells、入口 `(7,0)/(8,0)`。
- iso 預設與 rollback、ortho opt-in、flat/invalid fallback。
- 不建立部署 ZIP。

必要命令：

- `npm test`
- `npm run test:build`
- `npm run test:ortho-furniture`
- `npm run test:entrance`
- `npm run test:ortho-area`
- `npm run test:ortho-rotation`
- `npm run test:rotation-state`
- `npm run check:deploy`
- `npm run check:dev`

## 5. 實際驗證

2026-07-29 執行結果：

| Gate | 結果 |
|---|---|
| `npm test` | 通過 |
| `npm run test:build` | 通過，Build `0577e` |
| `npm run test:ortho-furniture` | 通過，12 IDs／48 PNG／iso-flat fallback |
| `npm run test:entrance` | 通過，入口與 migration 5402 不變 |
| `npm run test:ortho-area` | 通過，88×120／78 cells／Room Skin 不變 |
| `npm run test:ortho-rotation` | 通過，fixed／axis2／cardinal4 不變 |
| `npm run test:rotation-state` | 通過 |
| `npm run check:deploy` | 通過，58 個正式 JS modules |
| `npm run check:dev` | 通過，Chrome／Edge browser smoke |
| ART-0577J Comparison | Chrome／Edge HTTP 200；15/15 圖片解碼；0 pageerror／failed request |

保護比對：

- `assets/furniture/orthogonal/**/*.png`：48 張，對本卡完整備份 diff `0`。
- `assets/js/**/*.js`：58 個，對本卡完整備份 diff `0`。
- Build `0577e`、package `0.57.7-alpha`、save key `catCafePhaserV0540`、
  schema 5401、migration 5402 均未變。
- 17 份 evidence 存在；5 張完整手機圖均為 `390×844`。
- 未建立 dist、部署資料夾或 ZIP。

Browser automation 只能驗證頁面、資源與現行 Runtime 回歸，不能取代
iPhone Safari 真機產品驗收。

## 6. 已知限制

- 圖像是 concept composite，不是 Phaser Runtime screenshot。
- screen-space staging 與 bbox/間距數字是比較 proxy，不是 Placement 契約。
- 服務帶 A/B/C 尚未由產品選案。
- chair/counter/dessert 與桌椅島仍待產品核准。
- P0 貓咪 locomotion 只完成稽核輸入，沒有 Runtime 修正。
- iPhone Safari 真機仍未測試。
