# V0.57.2-alpha｜正交手機直立滿版化人工驗收

- 任務：`ARCH-0572-ORTHOGONAL-PORTRAIT-DENSITY-AND-ROOM-ZONING`
- 版本：`V0.57.2-alpha｜正交直立空間調整版` / Build `0572a`
- 相關：[結果](./V0572_ORTHOGONAL_PORTRAIT_RESULT.md)｜[比較 HTML](./V0572_ORTHOGONAL_PORTRAIT_COMPARISON.html)｜[DEC-019](./decisions.md)
- 截圖證據：[`docs/evidence/v0572/`](./evidence/v0572/)

> 由**產品負責人**在真實 iPhone 直立判斷手機滿版化與分區是否通過。**Claude Code 不代為核准，未預先勾選。**

## 本機啟動

```powershell
cd "C:\Users\rober\Desktop\貓咪咖啡廳"
py -m http.server 8765
```

| 網址 | 期望 |
|---|---|
| `?projection=ortho` | 正交 + 既有存檔布局（首屏滿版、右上角門） |
| `?projection=ortho&demoLayout=1` | 正交 + Demo 咖啡廳（門/櫃檯/座位/貓咪分區） |
| `?projection=ortho&demoLayout=1&artDebug=1` | 疊 Art Debug |
| `/` 或 `?projection=iso` | iso（預設，未變） |
| `?projection=invalid` | 安全回退 iso |

## 自動化（已於本環境通過）

| 項目 | 狀態 |
|---|---|
| `npm test` | ✅ |
| `tests/ortho-projection.test.js`（新 88×120 dims、軸對齊） | ✅ |
| `tests/ortho-demo-layout.test.js`（17 件、右上角門、可達性、隔離） | ✅ |
| `tests/camera-framing.test.js` | ✅ |
| iso golden／Flat C golden 未改、全數通過 | ✅ |
| `npm run check:deploy`（Build 0572a、54 modules） | ✅ |
| `npm run check:dev`（真實 Chrome，含首屏 fit=minZoom/整寬/無初始選取/情境列/invalid 回退） | ✅ |
| 14 張 real-browser 截圖 + before/after、零 page error | ✅ |

## 滿版與方向（待勾選）

- ☐ Orthogonal 地板橫線水平、直線垂直、房間不歪斜。
- ☐ 房間占比明顯比 V0.57.1 提高。
- ☐ 上下留白明顯減少。
- ☐ 首屏不需先縮放或大量左右拖曳。
- ☐ 家具仍可辨識（未過小）。
- ☐ 390／393／430 首屏皆可理解完整營業空間。

## 分區（待勾選）

- ☐ 顧客入口門位於上方（右上）角落、可辨識。
- ☐ 上方櫃檯／員工工作區清楚、連續。
- ☐ 顧客座位區清楚（桌椅成組）。
- ☐ 貓咪活動區清楚（前左角）。
- ☐ 入口→櫃檯、入口→座位主動線可達、非狹窄迷宮。

## Camera（待勾選）

- ☐ 左／右／上／下拖曳邊界合理、無大片空白。
- ☐ minZoom 合理（整間可讀）。
- ☐ zoom-in 正常。
- ☐ pinch 正常。
- ☐ resize／地址列收合後不跳到房間外。
- ☐ 情境操作列出現時不完全遮住選中家具、關閉後 Camera 不跳動。

## 操作（待勾選，於既有布局 `?projection=ortho`）

- ☐ 家具選取／拖曳／旋轉／放置／取消。
- ☐ 重整後存檔不變。
- ☐ 切回 iso 仍一致。

## 裝置（待勾選）

- ☐ iPhone Safari／WebView 直立。
- ☐ Android Chrome 直立。
- ☐ 桌面 Chrome／Edge。
- ☐ 手機橫向基本回歸。

> 本環境證據為桌面 Chrome headless；未完成實機前不得宣稱實機通過。

## 產品決策（待勾選，擇一）

- ☐ 手機滿版化與分區通過，進入核心家具重作（`ART-0573`）。
- ☐ 方向正確，仍需一次小幅調整。
- ☐ 暫不進入家具重作。

## 不在本次範圍

- 家具重畫／逐件校準（仍為 Placeholder）。
- EconomySystem／StationRegistry／顧客／訂單／店長／店員／招募／反應系統／貓咪新行為。
- HUD／底部列全面重製、Projection 切換 UI。
- 修改存檔 key／schema、把 projection/camera/demoLayout 寫入存檔、第二套 CameraController、改預設 iso、回 Flat。
