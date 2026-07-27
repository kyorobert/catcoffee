# V0.57.7 核心正交家具第一批｜驗收紀錄

## 自動化結果

| 項目 | 結果 |
|---|---|
| 12 個指定 ID | 通過 |
| 每件四方向、48 張 PNG | 通過 |
| PNG signature／RGBA／透明角落 | 通過 |
| Ortho selector 啟用 override | 通過 |
| iso／flat／invalid 保持 base | 通過 |
| Entity／Ghost 同一 texture selector | 通過 |
| StorePanel 投影縮圖 | 通過 |
| ID／footprint／玩法 metadata 不變 | 通過 |
| 存檔 `x/y/r` 與金幣相容 | 通過 |
| 入口 migration 5402 | 通過 |
| 78 playable cells／入口 mask | 通過 |
| HTTP 48 張新 PNG | 通過 |
| Chrome browser smoke | 通過 |
| Edge browser smoke | 通過 |
| iPhone Safari 真機 | **未實機測試** |

## Browser Smoke URL

以下均由安裝版 Chrome 與 Edge 經 HTTP server 啟動並驗證：

```text
/
?projection=iso
?projection=flat
?projection=ortho
?projection=orthogonal
?projection=ortho&demoLayout=1
?projection=ortho&artDebug=1
?projection=ortho&demoLayout=1&artDebug=1
?projection=invalid
```

結果：Canvas Renderer、單一 Canvas、CafeScene active、boot overlay hidden、
無 pageerror／unhandled rejection／failed request／HTTP 4xx／console fatal。

## 視覺檢查

- [x] 服務區可辨識咖啡機、烤箱、洗滌台、甜點櫃、櫃檯與自助點餐機。
- [x] 座位區圓桌、長桌、木椅與雙人沙發具有正交輪廓。
- [x] 貓跳台與抓柱為暖色、可辨識、非白底卡片。
- [x] 前／後方向內容不同，不只使用 flip。
- [x] 雙格家具正面寬、側面窄。
- [x] 透明背景沒有大片白色矩形。
- [x] Ghost、旋轉後 texture 與正式落點共用 selector。
- [x] iso 截圖仍使用舊 texture。
- [x] Art Debug footprint 仍由 Grid 產生。

## 不變契約

| 契約 | 驗證 |
|---|---|
| furniture ID 共 47 | 通過 |
| 本批 ID 不重新命名 | 通過 |
| footprint | 通過 |
| logical `x/y/r` | 通過 |
| Occupancy／Placement | 通過 |
| Camera／Grid／mask | 通過 |
| `(7,0)/(8,0)` 入口 | 通過 |
| save key/schema/migration | 通過 |
| iso／flat rollback | 通過 |

## 人工／真機 Gate

仍需產品負責人於 iPhone Safari 直式檢查：

1. 四方向家具在 Retina 縮放下是否仍清楚。
2. 手指拖曳、旋轉與商店縮圖的體感。
3. 沙發、櫃檯、貓跳台的相對比例是否需第二輪微調。
4. Safari 網址列收合／展開後是否保持既有 Camera 行為。

在真機驗收前，版本維持 `alpha`。

