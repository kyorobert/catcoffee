# 貓咪咖啡廳 V0.54.2-alpha

本版恢復手機與滑鼠家具拖曳，並加入不穿越家具的貓咪自主漫遊。房間幾何、等角 Grid 公式、Camera 邊界、家具與貓咪素材、經濟數值及 `catCafePhaserV0540` 存檔 key 均維持不變。

## 輸入與家具拖曳

- 家具資料的 `x/y` 統一表示 footprint 左上邏輯格，`r` 表示旋轉狀態。
- `InputModeController` 統一 Camera pan、家具選取／拖曳、Pinch zoom 與貓咪點擊優先順序。
- `FurnitureEntity` 使用 Phaser Interactive 與 Draggable；移動超過 8 CSS px 才進入正式拖曳。
- Pointer 經 Main Camera 轉為世界座標，再由唯一 `GridSystem` 吸附。
- 拖曳時暫時移除原家具 Occupancy、停用 Camera pan、暫停貓咪 AI；所有完成、取消、pointercancel、gameout、blur 與 Scene shutdown 路徑都集中恢復。
- Pointer move 只更新 Ghost 與紅綠 footprint，不存檔、不顯示 Toast；成功 pointerup 才寫入存檔。

## 貓咪行為

- 貓咪邏輯資料使用 `{id, gridX, gridY, state, targetGridX, targetGridY}`；Sprite 像素座標只存在於顯示層。
- `grid-pathfinder.js` 提供無引擎依賴的四方向 BFS。
- `cat-behavior-core.js` 提供無引擎依賴的狀態、等待、目標與重新尋路規則。
- `CatBehaviorController` 以 delta time 沿格子中心移動，切換 idle／walk／sit／sleep，使用 Occupancy 純快照避開家具並允許地毯通行。
- 多貓不選擇重複的目前格或保留目標格；家具布局改變後重新檢查路徑。

## Debug

在網址加上 `?interactionDebug=1` 顯示輸入模式、Pointer、Camera、家具候選與阻擋原因、貓咪狀態、路徑和保留格。正式網址不建立 Debug UI。

## 啟動與測試

ES Modules 必須透過 HTTP Server 載入，不可直接使用 `file://`。

```powershell
py -m http.server 8765
npm.cmd test
npm.cmd run test:interaction
npm.cmd run test:ai
npm.cmd run test:drag
npm.cmd run test:http
npm.cmd run test:browser
npm.cmd run check
```

正式入口、CSS 與 ES Modules 使用固定 `v=0542a` 快取版本。GitHub Pages 執行時只載入本地 `assets/vendor/phaser-3.90.0.min.js`，不依賴 CDN 或 `node_modules/`。

部署 ZIP 不包含 `node_modules/`、`legacy/`、`tools/`、備份或測試截圖。
