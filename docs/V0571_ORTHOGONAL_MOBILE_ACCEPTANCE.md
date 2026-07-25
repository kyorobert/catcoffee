# V0.57.1-alpha｜Orthogonal 手機構圖人工驗收

- 任務：`ARCH-0571-ORTHOGONAL-MOBILE-FRAMING-AND-LAYOUT`
- 版本：`V0.57.1-alpha｜正交手機構圖調整版` / Build `0571a`
- 相關：[結果](./V0571_ORTHOGONAL_MOBILE_RESULT.md)｜[比較 HTML](./V0571_ORTHOGONAL_MOBILE_COMPARISON.html)｜[DEC-018](./decisions.md)
- 截圖證據：[`docs/evidence/v0571/`](./evidence/v0571/)

> 由**產品負責人**在真實 iPhone 直立判斷手機構圖是否通過。**Claude Code 不代為核准，未預先勾選。**

## 本機啟動

```powershell
cd "C:\Users\rober\Desktop\貓咪咖啡廳"
py -m http.server 8765
```

| 網址 | 期望 |
|---|---|
| `?projection=ortho` | 正交 + 既有存檔布局（首屏整間可見） |
| `?projection=ortho&demoLayout=1` | 正交 + Demo 構圖（首屏整間可見） |
| `?projection=ortho&demoLayout=1&artDebug=1` | 疊 Art Debug |
| `/` 或 `?projection=iso` | iso（預設，未變） |
| `?projection=invalid` | 安全回退 iso |

## 自動化（已於本環境通過）

| 項目 | 狀態 |
|---|---|
| `npm test` | ✅ |
| `tests/camera-framing.test.js`（safe viewport／fit zoom／centre clamp） | ✅ |
| `tests/ortho-demo-layout.test.js`（16 件、分區、可達性、隔離） | ✅ |
| iso golden／Flat C golden 未改、全數通過 | ✅ |
| `npm run check:deploy`（Build 0571a、54 modules） | ✅ |
| `npm run check:dev`（真實 Chrome，含首屏 fit=minZoom、整寬可見、無初始選取/情境列、invalid 回退） | ✅ |
| 17＋3 張 real-browser 截圖、零 page error | ✅ |

## 初始首屏（待勾選）

- ☐ 不需手動縮放即可理解主要區域。
- ☐ 可看到服務區。
- ☐ 可看到座位區。
- ☐ 可看到貓咪區。
- ☐ 左右房間邊界可辨識。
- ☐ 無大片無效背景。
- ☐ 初始沒有家具被選取。
- ☐ 初始沒有情境操作列。

## Camera（待勾選）

- ☐ 左右拖曳邊界合理。
- ☐ 上下拖曳邊界合理。
- ☐ minZoom 合理。
- ☐ zoom-in 正常。
- ☐ pinch 正常。
- ☐ Camera 不會停在空白區。
- ☐ resize 後不跳到房間外。
- ☐ 地址列收合後正常。

## Demo Layout（待勾選）

- ☐ 服務區清楚。
- ☐ 桌椅群組清楚。
- ☐ 主要通道清楚。
- ☐ 貓咪區清楚。
- ☐ 不像家具倉庫。
- ☐ 不過度空曠。
- ☐ 不過度擁擠。

## 操作（待勾選）

- ☐ 家具選取。
- ☐ 家具拖曳。
- ☐ 家具旋轉。
- ☐ 放置。
- ☐ 取消。
- ☐ 情境操作列不遮住選中家具。
- ☐ 重整後存檔不變。
- ☐ 切回 iso 仍一致。

> 提醒：家具操作請在**既有布局**（`?projection=ortho`，非 demo）測試；Demo 家具為 display-only。

## 裝置（待勾選）

- ☐ iPhone Safari／WebView 直立。
- ☐ Android Chrome 直立。
- ☐ 桌面 Chrome／Edge。
- ☐ 手機橫向基本回歸。

> 本環境證據為桌面 Chrome headless；未完成實機前不得宣稱實機通過。

## 產品決策（待勾選，擇一）

- ☐ 手機構圖通過，進入核心家具重作（`ART-0572`）。
- ☐ 方向正確，仍需一次小幅構圖修正。
- ☐ 暫不進入家具重作。

## 不在本次範圍

- 家具重畫／逐件校準（本版仍為 Placeholder）。
- EconomySystem／StationRegistry／顧客／訂單／店長／店員／招募／反應系統／貓咪新行為。
- HUD 全面重製、底部導覽列重製、Projection 切換按鈕。
- 修改存檔 key／schema、把 projection/camera/demoLayout 寫入存檔、第二套 CameraController、改預設 iso。
