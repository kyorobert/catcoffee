# 貓咪咖啡館 V0.53.1｜背景透視對齊與地板映射重建

純前端 HTML5 遊戲，可直接部署至 GitHub Pages，不需要後端或建置工具。

## V0.53.1 重點

- 保留 V0.53.0 的單一 Camera、Canvas 背景、Pointer Events 與 Safari resize 架構。
- 以 9 × 11、共 99 個明確世界座標控制點，取代四角平均與逐列端點映射。
- `floorGridToWorld()` 與 `worldToFloorGrid()` 統一家具、角色、Ghost 與觸控放置座標。
- 直立家具以占地底邊中心作為腳底錨點。
- 地毯由場景 Canvas 以兩個仿射三角形映射到占地四邊形，並預先分析素材 Alpha 邊界。
- `?floorDebug=1` 顯示控制點、格子編號、家具錨點與點擊座標。
- 舊存檔沿用原本的 `x / y / r / type` 格座標；一次性標記為 `floorMappingVersion: 5310`。

## 部署

將本目錄內容直接放到 GitHub Pages 根目錄。`index.html`、`manifest.webmanifest`、`.nojekyll`、`assets/`、`icons/` 與 `splash/` 必須位於同一層。

## 本機靜態檢查

```powershell
node check.js
```
