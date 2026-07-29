# ART-0577K 驗收紀錄

## Gate 狀態

Build `0577k` 的 Node、Chrome、Edge 與部署 Gate 通過；iPhone Safari 真機 Gate
仍為 pending，因此本文件不把桌面瀏覽器自動化描述為真機通過。

| 驗收項目 | 結果 | 證據 |
|---|---|---|
| SoftCute axis2、round-trip | 通過 | `table-axis-*.png`、`metrics.json` |
| HardCafe 為獨立商品 | 通過 | Store 購買／放置／旋轉／重載 Smoke |
| HardCafe axis2、round-trip | 通過 | `hard-table-axis-*.png` |
| 雙桌同場可辨識 | 通過 | `dual-table-products.png` |
| chair cardinal4 | 通過 | `chair-*.png`、`chair-cardinal-ring.png` |
| counter 顧客／員工／側面 | 通過 | `counter-*.png` |
| dessert 展示／背面／側面 | 通過 | `dessert-*.png` |
| Option C 連續服務帶 | 通過 | `orthogonal-demo-layout*.png` |
| Grid／Occupancy／Placement／BFS fixture | 通過 | `ortho-demo-layout.test.js` |
| iso／flat／invalid fallback | 通過 | Browser Smoke、projection regression |
| Save key/schema/migration | 通過 | `v0577k-formal-integration.test.js` |
| iPhone Safari 真機 | **Pending** | 尚未實機驗收 |

## Runtime 驗收覆蓋

- 390×844、393×852、430×932 與 1366×768 實際 Runtime 截圖。
- 8 組 rotate case、18 組 pointer／底列案例、7 組 projection regression。
- Chrome 與 Edge 均完成 fresh／legacy、Store、購買、Ghost、旋轉、commit、拖曳、
  存檔重載與所有文件化 projection URL。
- pageerror、failed request、HTTP error 與 fatal console error 為 0。

## 資產範圍 Gate

- 基線 48 張；目前 52 張。
- 已改既有 ID：`chair`、`counter`、`dessert`、`pinkTableLong`。
- 新增 ID：`pinkTableLongHardCafe`。
- 未移除任何正式 PNG；其餘 8 個第一批 ID 未改。
- 透明背景、有效 PNG、方向 key 與 base fallback 均由自動檢查覆蓋。

## 契約 Gate

- `CURRENT_KEY=catCafePhaserV0540`
- `sceneSchemaVersion=5401`
- `migrationCompletedVersion=5402`
- 10×8 Grid、88×120 cell、78 playable cells、入口 `(7,0)/(8,0)` 未變。
- `fixed/axis2/cardinal4` 與 0577d edit-session envelope 未變。
- HardCafe 沒有 migration；舊存檔不會自動新增該商品。

## 人工驗收注意

真機應優先確認 390px 級畫面下 chair 的 front/back 識別、兩款桌子的材質差異、
counter/dessert 側面辨識與家具拖曳／pinch 互斥。若真機不通過，應開校準卡，
不得以本文件的桌面自動化取代真機產品判斷。
