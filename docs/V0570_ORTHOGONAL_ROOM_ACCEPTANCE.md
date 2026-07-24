# V0.57.0-alpha｜正交平面咖啡廳原型人工驗收

- 任務：`ARCH-0570-ORTHOGONAL-ROOM-PROTOTYPE`
- 版本：`V0.57.0-alpha｜正交平面咖啡廳原型版` / Build `0570a`
- 相關：[結果](./V0570_ORTHOGONAL_ROOM_RESULT.md)｜[比較 HTML](./V0570_ORTHOGONAL_COMPARISON.html)｜[家具重作計畫](./V0570_ORTHOGONAL_ASSET_REBUILD_PLAN.md)｜[DEC-017](./decisions.md)
- 截圖證據：[`docs/evidence/v0570/`](./evidence/v0570/)

> 目的：由**產品負責人**判斷 Orthogonal 正交房間方向是否通過。**Claude Code 不代為核准，未預先勾選。**

## 本機啟動

```powershell
cd "C:\Users\rober\Desktop\貓咪咖啡廳"
py -m http.server 8765
```

| 網址 | 期望 |
|---|---|
| `http://127.0.0.1:8765/` | iso（預設） |
| `?projection=ortho` | Orthogonal + 既有存檔布局 |
| `?projection=orthogonal` | 同上（別名） |
| `?projection=ortho&demoLayout=1` | Orthogonal + Demo 構圖（不寫存檔） |
| `?projection=ortho&demoLayout=1&artDebug=1` | 疊 Art Debug（矩形 footprint） |
| `?projection=flat` | Flat C（已拒絕，保留回歸） |
| `?projection=invalid` | 安全回退 iso |

## 自動化（已於本環境通過）

| 項目 | 狀態 |
|---|---|
| `npm test` | ✅ |
| `tests/ortho-projection.test.js`（軸對齊數學／footprint／資料相容／純度） | ✅ |
| `tests/ortho-demo-layout.test.js`（fixture 有效／不重疊／入口可達／隔離） | ✅ |
| `tests/projection-mode.test.js`（ortho／orthogonal／invalid） | ✅ |
| iso golden／Flat C golden 未改、全數通過 | ✅ |
| `npm run check:deploy`（Build 0570a、51 modules） | ✅ |
| `npm run check:dev`（真實 Chrome，含 ortho／ortho-demo boot、invalid 回退） | ✅ |
| 13 張 real-browser 截圖、零 page error | ✅ |

## 房間方向（待勾選）

- ☐ 地板橫線水平。
- ☐ 地板直線垂直。
- ☐ 房間沒有整體歪斜。
- ☐ 後牆水平。
- ☐ 左右邊界垂直。
- ☐ 不像斜放棋盤。
- ☐ 手機直立可清楚閱讀。

## 場景構圖（待勾選）

- ☐ 上方服務區清楚。
- ☐ 中央座位區清楚。
- ☐ 主要走道清楚。
- ☐ 貓咪區不妨礙營運。
- ☐ HUD 沒有遮住主要工作區。
- ☐ 底部操作列沒有遮住關鍵家具。

## 操作（待勾選）

- ☐ Camera 拖曳。
- ☐ pinch。
- ☐ 家具選取。
- ☐ 家具旋轉。
- ☐ 家具拖曳。
- ☐ 放置與取消。
- ☐ 重整後家具位置不變。
- ☐ 切回 iso 後存檔仍一致。

> 提醒：家具拖曳／選取請在**既有布局**（`?projection=ortho`，非 demo）測試；Demo 家具為 display-only。

## 實機驗收（pending）

| 裝置 | 狀態 |
|---|---|
| iPhone Safari（直立） | ☐ pending |
| Android Chrome（直立） | ☐ pending |
| 桌面 Chrome / Edge | ☐ pending |
| 手機橫式 | ☐ pending |

> 本環境證據為桌面 Chrome headless；未完成實機前不得宣稱實機通過。

## 產品決策（待勾選，擇一）

- ☐ Orthogonal 方向通過，進入核心家具重作（`ART-0571`）。
- ☐ Orthogonal 方向正確，但房間構圖需再改。
- ☐ 暫時不採用。

## 不在本次範圍

- 正式家具重作／逐件校準／重畫（本版只出 [重作計畫](./V0570_ORTHOGONAL_ASSET_REBUILD_PLAN.md)）。
- EconomySystem／StationRegistry／顧客／訂單／店長／店員／招募／反應系統／貓咪新行為。
- HUD 全面重製、玩家可見 Projection 切換按鈕。
- 修改存檔 key／schema、把 projection／demoLayout 寫入存檔、建立第二套 Grid、改預設 iso。
