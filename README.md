# 貓咪咖啡館 V0.54.0-alpha.1

本版集中修正 Phaser 啟動、家具 Loader、Canvas Renderer、載入錯誤畫面、家具 Anchor，以及新舊存檔隔離。Phaser 管理房間、等角地板、家具、角色、Camera、拖曳及放置提示；固定 HUD、商店與操作面板由 DOM 管理。

## 架構重點

- 單一 GridSystem 提供所有等角座標、footprint 與 anchor。
- 單一 OccupancySystem 分離地毯、地板家具、牆面家具與入口保留格。
- 單一 PlacementSystem 處理硬性阻擋；椅子未配桌只產生 warning。
- 單一 Phaser Main Camera 支援拖曳、雙指縮放、wheel、動態 cover zoom 與 resize 中心保留。
- 新版只寫入 catCafePhaserV0540；舊存檔首次遷移前備份到 catCafeLegacySaveBackupV0532。
- 啟動超過 20 秒或發生例外時顯示可操作錯誤畫面，不再永久停留於 Spinner。
- Alpha.1 固定使用 Phaser Canvas Renderer。
- 正式遊戲不載入 legacy，也不依賴 CDN。

## 本機執行

ES Modules 需要由靜態 HTTP Server 載入，不能使用 file://。可執行 `python -m http.server 8765`，核心檢查使用 `npm.cmd test`、`npm.cmd run test:http` 與 `npm.cmd run test:browser`。

## 部署

GitHub Pages 部署 ZIP 不包含 node_modules、legacy、測試截圖或本機暫存檔。Phaser 正式檔位於 assets/vendor/phaser-3.90.0.min.js。

部署後 Safari 應先正常重新整理；若裝置仍保留非常舊的網站資料，可由 Safari 設定清除該站資料再測試。正式入口、CSS 與 ES Modules 均使用 `v=0540a1` 版本識別，清除網站資料不是正常啟動的必要條件。
