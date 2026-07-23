# 貓咪咖啡廳 V0.55.2-alpha

版本：`V0.55.2-alpha｜Prototype 家具全面重繪版`  
Build ID：`0552a`

V0.55.2-alpha 將 V0.55.1 稽核出的 25 件白底／文字 Prototype 全面替換為原創 2:1 等角透明 PNG。遊戲世界、Grid、Occupancy、Placement、Camera、貓咪 AI、經濟數值與存檔 key 均沿用既有 Phaser 架構。

## 本版內容

- 25 件 Prototype 全部重繪，P0 10 件／P1 9 件／P2 6 件。
- 每件提供 `down-right`、`down-left`、`up-right`、`up-left` 四張原生方向圖，共 100 張 RGBA PNG。
- 白色圖卡、圖片內名稱與執行時 SVG 已從正式 Loader／商店移除。
- 原 furniture ID、名稱、價格、meta、解鎖、footprint、layer、rotation 與存檔座標完全不變。
- `furniture-visual-config.js` 集中提供方向 texture key、相對路徑、scale、anchor、station、socket 與 walkBlocking。
- 24 件升級為 `production`；`childrenPlayArea` 為可用的 `redraw`，陰影邊緣保留後續像素精修；Prototype remaining 為 0。
- 本版不包含店員 AI、顧客 AI、訂單流程或故事系統。

文件：

- [Art Bible](./docs/ART_BIBLE.md)
- [家具完整稽核](./docs/FURNITURE_AUDIT.md)
- [Prototype 重繪計畫](./docs/PROTOTYPE_REDRAW_PLAN.md)
- [逐件重繪結果](./docs/PROTOTYPE_REDRAW_RESULT.md)
- [前後 Contact Sheet](./docs/PROTOTYPE_REDRAW_CONTACT_SHEET.html)
- [人工瀏覽器驗收](./docs/V0552_MANUAL_BROWSER_ACCEPTANCE.md)

## 執行時素材與相容性

新素材位於 `assets/furniture/redrawn/{id}/{id}-{direction}.png`。舊 SVG 留在原路徑作歷史稽核，但正式 `BootScene` 與 `StorePanel` 不再讀取它們。舊存檔以相同家具 ID 自動顯示新圖，無需 ID migration，也不會搬動家具或重新扣款。

正式存檔 key 固定為 `catCafePhaserV0540`；Phaser 固定使用本地 `assets/vendor/phaser-3.90.0.min.js`。GitHub Pages 不需要 `node_modules`、`tools` 或 CDN。

## Art Debug

```text
http://127.0.0.1:8765/?artDebug=1
http://127.0.0.1:8765/?artDebug=1&artFilter=v0552
http://127.0.0.1:8765/?artDebug=1&artFilter=redraw
http://127.0.0.1:8765/?artDebug=1&artFilter=missing-direction
```

Debug 顯示 sprite bounds、anchor、footprint、socket、方向、texture 路徑、scale、分類及 fallback；不攔截 Pointer、不修改存檔，正常網址不顯示。

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
npm.cmd run test:prototype-redraw
npm.cmd run test:furniture-assets
npm.cmd run test:furniture-redraw-direction
npm.cmd run test:furniture-id
npm.cmd run test:furniture-footprint
npm.cmd run test:furniture-store-reenable
npm.cmd run test:furniture-save-redraw
npm.cmd run test:http
npm.cmd run check:deploy
```

`test:browser`／`check:dev` 需要本機 Chrome 或 Edge。若自動化環境沒有瀏覽器，版本維持 alpha，依人工驗收文件在實際裝置完成最後檢查；這不影響靜態檢查與部署 ZIP 產出。

## GitHub Pages

將部署 ZIP 根目錄內容直接發布即可。正式 Runtime 僅使用相對路徑、內建 Phaser 與 PNG 素材，不依賴 `node_modules`、Python、Pillow、生成工具或外部 CDN。
