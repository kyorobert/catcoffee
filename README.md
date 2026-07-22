# 貓咪咖啡廳 V0.55.0-alpha.1

版本：`V0.55.0-alpha.1｜桌面啟動與版本一致性修正版`  
Build ID：`0550a1`

本版修正 Windows Chrome／Edge 在 GitHub Pages 上可能因 HTML 與 ES Module 快取混版而停在載入畫面的問題。遊戲世界、Grid、家具放置、Camera、貓咪 AI、照顧規則與存檔 key 均沿用 V0.55.0-alpha。

## 啟動安全

- HTML、JavaScript 與所有 runtime module 使用同一個固定 Build ID `0550a1`。
- `main.js` 會在建立 `Phaser.Game` 前檢查 HTML／JavaScript Build ID。
- `dom-contract.js` 一次驗證所有必要 DOM ID 與 panel 子節點；缺少節點時會顯示完整名稱，不會再只出現 null `addEventListener`。
- 早期 `error`、`unhandledrejection` 與資源載入失敗會寫入載入畫面的診斷區。
- 啟動逾時為 20 秒，錯誤畫面提供「重新載入」與「重新載入最新版」。
- 重新載入最新版只加入 `_reload` 查詢參數，不會清除 localStorage。

## 存檔相容

正式存檔 key 維持：

```text
catCafePhaserV0540
```

啟動修復不會刪除、改名或覆寫 legacy key。Build mismatch、DOM contract failure 與載入失敗也不會清除存檔。

## 本機啟動

ES Modules 必須透過 HTTP server 載入，不能使用 `file://`：

```powershell
cd "C:\Users\rober\Desktop\貓咪咖啡廳"
py -m http.server 8765
```

然後開啟 `http://127.0.0.1:8765/`。

## 測試與部署門檻

不依賴 Playwright 或 `node_modules` 的部署檢查：

```powershell
npm.cmd run check:deploy
```

包含本機 Chrome／Edge browser smoke 的開發檢查：

```powershell
npm.cmd run check:dev
```

個別測試：

```powershell
npm.cmd test
npm.cmd run test:interaction
npm.cmd run test:ai
npm.cmd run test:drag
npm.cmd run test:care
npm.cmd run test:animation
npm.cmd run test:dom
npm.cmd run test:build
npm.cmd run test:http
npm.cmd run test:browser
```

## GitHub Pages

正式執行使用本地 `assets/vendor/phaser-3.90.0.min.js`，不依賴 CDN 或 `node_modules`。部署 ZIP 解壓後可直接將根目錄內容發布至 GitHub Pages。

若 Safari 或桌面瀏覽器仍持有上一版 HTML，可按錯誤畫面的「重新載入最新版」。這個動作不會清除遊戲進度。
