# 貓咪咖啡廳 V0.55.0-alpha

本版在 V0.54.2-alpha 的單一 Phaser Camera、等角 Grid、家具拖曳、Occupancy 與 BFS 尋路架構上，改善貓咪步行生命感，並加入可取消、不可重複提交的三段式照顧流程。正式存檔 key 仍為 `catCafePhaserV0540`。

## 貓咪生命感

- 豆豆、煤球、雪球、拿鐵、花花與 fallback 均維持 512×384、64×64、8×6 spritesheet 規格。
- walk row 重新製作左右腳交替、身體高低與尾巴反向擺動的四幀節奏，正面與背面各四幀。
- 同一條 BFS 路徑只在整段路徑完成後進入 idle／sit／sleep，不會在每個中繼格停頓。
- `CatEntity` 只在顯示層加入約 1–2 world px 的步行微動與陰影縮放；邏輯世界座標、gridX/gridY、尋路與 Depth 基準不受影響。
- idle row 改以低頻率播放，搭配極輕微呼吸位移，不建立逐幀 Timer。

## 房間氛圍

- 移除 CafeScene 中藍色 `fillRect` 與深色 `fillRoundedRect` placeholder。
- 左牆改為本地透明像素窗戶，右牆改為本地透明木質菜單板；兩者已預先依牆面方向剪切，不靠 runtime CSS transform。
- 加入不可互動的淡窗光與七個低頻塵埃，`prefers-reduced-motion` 開啟時不建立塵埃 Tween。

## 三段式照顧流程

1. 選擇貓咪：顯示 portrait、名字、個性及飽足／心情／清潔／羈絆進度。
2. 選擇方式：餵食、梳毛、玩耍三張大型照顧卡，均清楚標示體力消耗。
3. 演出與結果：顯示不同道具動畫、貓咪反應、數值前後差異；玩家按「完成」後才離開。

照顧規則集中於純 JavaScript `assets/js/core/care-interaction-core.js`：

- 餵食：飽足 +14、心情 +3、羈絆 +2。
- 梳毛：清潔 +14、心情 +4、羈絆 +2。
- 玩耍：心情 +14、飽足 -2（最低 0）、羈絆 +3。
- 三種行為皆消耗體力 1，所有 0–100 數值都有邊界限制。

`CareInteractionController` 管理 Phaser Session、單一貓咪 AI 暫停、Camera 鎖定、動畫、反應泡泡與清理；`CarePanel` 管理 DOM 選擇／演出／結果。Session 在演出開始時鎖定結果，完成時才一次套用與存檔，`committed` 防止快速連點或重複動畫事件再次加值。演出中關閉、ESC、blur、page hidden、pointercancel 或 Scene shutdown 都會取消且不扣體力。

## 輸入與舊存檔

- InputMode 新增 `care-interaction`，照顧期間不允許家具拖曳、Camera pan 或 pinch。
- 完成或取消後恢復 Camera、單一貓咪 AI 與穩定輸入狀態。
- 舊家具 `x/y/r`、ROOM_CONFIG、GridSystem、Occupancy 與新版存檔 key 均未變更。
- SaveAdapter 只為每隻貓補上 `lastCareAt`、`careCount`、`lastCareMode` 預設值，不刪除或覆寫舊資料與 legacy key。
- 未完成的 Care Session 不寫入存檔；重新整理不會重複加值。

## 啟動與測試

ES Modules 必須透過 HTTP Server 載入，不可直接使用 `file://`。

```powershell
py -m http.server 8765
npm.cmd test
npm.cmd run test:interaction
npm.cmd run test:ai
npm.cmd run test:drag
npm.cmd run test:care
npm.cmd run test:animation
npm.cmd run test:http
npm.cmd run test:browser
npm.cmd run check
```

正式入口、CSS、ES Modules 與更新素材統一使用固定 `v=0550a` 快取版本。GitHub Pages 只載入本地 `assets/vendor/phaser-3.90.0.min.js`，不依賴 CDN 或 `node_modules/`。

部署時上傳 ZIP 解壓後的根目錄內容；`index.html`、`manifest.webmanifest`、`.nojekyll` 與 `assets/` 必須位於同一層。部署 ZIP 不包含 `node_modules/`、`legacy/`、`tools/`、備份或測試截圖。
