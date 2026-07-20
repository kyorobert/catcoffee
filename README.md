# 貓咪咖啡館 V0.53.2｜地板視覺與放置系統止血修正版

純前端 HTML5 遊戲，可直接部署至 GitHub Pages。

## V0.53.2 重點

- 正式模式完全不顯示全場邏輯格、地板外框或控制點。
- 家具放置與拖曳時，只顯示候選家具的綠色／紅色占地提示。
- 「放置輔助」開啟時，最多顯示候選位置附近 5×5 格。
- 完整控制網格只能透過 `?floorDebug=1` 顯示。
- 地毯恢復使用原始點陣素材與腳底錨點，不再進行 Canvas 四邊形拉伸或 Polygon 裁切。
- 邏輯格仍負責吸附、碰撞、尋路與存檔，但與背景美術地磚正式分離。
- V0.53.0 的單一 Camera、Canvas 背景、Pointer Events 與 Safari resize 架構保持不變。
- 載入舊存檔時不批次正規化、搬動或重排家具座標。

## Debug

正式模式：`index.html`

地板校正模式：`index.html?floorDebug=1`

## 靜態檢查

```powershell
node check.js
```
