# 貓咪咖啡廳 V0.55.1-alpha

版本：`V0.55.1-alpha｜美術規格與素材清理版`  
Build ID：`0551a`

V0.55.1-alpha 建立正式家具美術規格與資產資料管線。遊戲世界、Grid、Occupancy、Placement、Camera、貓咪 AI、經濟數值與存檔 key 均沿用已穩定的 Phaser 架構。

## 本版內容

- [Art Bible](./docs/ART_BIBLE.md)：唯一 2:1 等角、光源、陰影、像素密度、比例、anchor、方向與角色基準。
- [家具完整稽核](./docs/FURNITURE_AUDIT.md)：47 件家具、22 PNG、25 SVG 的格式、問題、分類與處理。
- [Prototype 重繪計畫](./docs/PROTOTYPE_REDRAW_PLAN.md)：下一版 25 件白底示意素材的 P0/P1/P2 完整 brief。
- 四種美術狀態：`production` 正式可用、`redraw` 保留使用並排程重畫、`prototype` 僅保留相容、`retired` 僅保留舊資料。
- 所有白底／文字 SVG 均為 Prototype；不出現在正常商店、新遊戲預設場景、任務獎勵或自動生成。
- 舊存檔中的 Prototype 不會被刪除或替換，仍可顯示、選取、拖曳、旋轉、收納與出售。
- 本版不全面重畫 Prototype；預定 V0.55.2-alpha 依重繪計畫逐件交付正式透明等角素材。

## 家具視覺資料

`assets/js/config/furniture-visual-config.js` 為每個既有家具 ID 提供：

- `artStatus`、`storeVisible`
- `visualScale`、normalized `anchor`
- `textureByDirection`、`mirrorAllowed` 與安全 fallback
- 與既有設定一致的 `footprint`
- `heightClass`、`walkBlocking`
- 未來營運用 `stationType`、`interactionSockets`
- `redrawReason`、`replacementId`、`sourceFormat`、`notes`

重畫家具不得變更 furniture ID、價格、解鎖、footprint 或玩家存檔座標。

## Art Debug

透過以下網址啟用：

```text
http://127.0.0.1:8765/?artDebug=1
```

可檢查 sprite bounds、anchor、footprint、socket、方向、texture、scale、分類及 fallback。Debug 不攔截 Pointer、不修改存檔，正常網址完全不顯示。

## 啟動安全與存檔

- HTML、JavaScript 與 runtime module 使用固定 Build ID `0551a`。
- 建立 `Phaser.Game` 前檢查 Build 與 DOM Contract；錯誤會顯示完整診斷，不會永遠轉圈。
- 正式存檔 key 維持 `catCafePhaserV0540`，不清除、不改名、不覆寫 legacy key。
- 商店顯示狀態與存檔實例載入完全分離；`storeVisible=false` 不會刪除玩家家具。

## 本機啟動

ES Modules 必須透過 HTTP server 載入，不能使用 `file://`：

```powershell
cd "C:\Users\rober\Desktop\貓咪咖啡廳"
py -m http.server 8765
```

開啟 `http://127.0.0.1:8765/`。

## 測試

```powershell
npm.cmd test
npm.cmd run test:interaction
npm.cmd run test:ai
npm.cmd run test:drag
npm.cmd run test:care
npm.cmd run test:animation
npm.cmd run test:furniture-visual
npm.cmd run test:furniture-classification
npm.cmd run test:furniture-store
npm.cmd run test:furniture-save
npm.cmd run test:furniture-direction
npm.cmd run test:prototype-plan
npm.cmd run test:dom
npm.cmd run test:build
npm.cmd run test:http
npm.cmd run test:browser
npm.cmd run check:deploy
```

`check:dev` 會再要求本機 Chrome／Edge browser smoke。`node_modules` 僅供本機開發測試，不能放入 GitHub Pages 或部署 ZIP。

## GitHub Pages

正式執行載入本地 `assets/vendor/phaser-3.90.0.min.js`，不依賴 CDN 或 npm runtime。部署 ZIP 根目錄可直接發布，並保留 Prototype SVG，因舊存檔仍可能引用這些 ID。

