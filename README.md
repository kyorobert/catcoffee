# 貓咪咖啡館 V0.47.0

可直接部署至 GitHub Pages 的單頁遊戲版本。

## 目錄內容

- `index.html`：遊戲主程式
- `.nojekyll`：避免 GitHub Pages 使用 Jekyll 處理
- `README.md`：部署說明

## GitHub Pages 部署方式

1. 在 GitHub 建立新的 Repository。
2. 將本目錄內所有檔案上傳到 Repository 根目錄。
3. 進入 Repository 的 `Settings`。
4. 選擇左側 `Pages`。
5. 在 `Build and deployment` 中設定：
   - Source：`Deploy from a branch`
   - Branch：`main`
   - Folder：`/ (root)`
6. 按下 `Save`。
7. 等待 GitHub Pages 完成部署後，使用產生的網址開啟遊戲。

網址通常為：

```text
https://你的GitHub帳號.github.io/Repository名稱/
```

## 注意事項

- 建議使用 Chrome、Edge 或 Safari 開啟。
- iPhone 不建議直接透過「檔案」App 預覽 HTML，請使用 GitHub Pages 網址開啟。
- 遊戲進度儲存在瀏覽器的 Local Storage；清除瀏覽器資料可能會使進度消失。
