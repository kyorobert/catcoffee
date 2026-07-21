# 貓咪咖啡廳 V0.54.1-alpha

本版重建 Phaser 場景貓咪的全身點陣角色與動畫。豆豆、煤球、雪球、拿鐵與花花均有獨立 64×64 Frame Sprite Sheet；名冊仍使用原有大頭貼，兩種素材由同一個 cat ID 綁定。

## 貓咪角色

- 動畫：`idle`、`walk`、`sit`、`sleep`、`happy`、`serve`。
- 方向：向下與向上各四幀，左右移動使用 `flipX`。
- 腳底：所有 Phaser Sprite 使用 `setOrigin(0.5, 1)`。
- 深度：沿用現有 `DepthSystem`，以角色腳底 worldY 排序。
- 錯誤處理：個別 Sprite Sheet 無法載入時改用本地 fallback，不會阻止 CafeScene 啟動。
- 貓咪名冊：保留原大頭貼、名字、個性與照顧數值。

## 啟動與測試

ES Modules 必須透過 HTTP Server 載入，不可直接使用 `file://`。

```powershell
py -m http.server 8765
npm.cmd test
npm.cmd run test:http
npm.cmd run test:browser
npm.cmd run check
```

正式入口、CSS、ES Modules 與貓咪 Sprite Sheet 使用固定 `v=0541a` 快取版本。Safari 部署更新後可先正常重新整理；清除網站資料只應作為裝置仍保留非常舊快取時的排除步驟，不是遊戲啟動的必要條件。

## 部署

GitHub Pages 部署檔使用本地 `assets/vendor/phaser-3.90.0.min.js`，不依賴 CDN。部署 ZIP 不包含 `node_modules/`、`legacy/`、`tools/`、備份或測試截圖。

新版存檔仍使用 `catCafePhaserV0540`；本版本不變更存檔 key、房間、Grid、Placement、Occupancy 或 Camera 核心。
