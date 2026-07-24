# V0.56.1-alpha｜Flat 構圖三方案人工驗收

- 任務：`ARCH-0563-FLAT-VISUAL-PRESET-COMPARISON`
- 版本：`V0.56.1-alpha｜淺俯視構圖比較版` / Build `0561a`
- 相關：[構圖比較結果](./V0561_FLAT_PRESET_COMPARISON_RESULT.md)｜[DEC-016](./decisions.md#dec-016flat-淺俯視構圖三方案比較proposed待產品選擇)
- 截圖證據：[`docs/evidence/v0563/`](./evidence/v0563/)

> 目的：協助**產品負責人**在相同配置、相同鏡頭下比較三個 Flat 構圖，選出值得進入後續家具校準的 Preset。**Claude Code 不代為選定。** 勾選欄請由實機驗收者填寫。

## A. 本機啟動

```powershell
cd "C:\Users\rober\Desktop\貓咪咖啡廳"
py -m http.server 8765
```

| 網址 | 期望 |
|---|---|
| `http://127.0.0.1:8765/` | iso（預設） |
| `http://127.0.0.1:8765/?projection=flat&flatPreset=near-iso` | Preset A |
| `http://127.0.0.1:8765/?projection=flat&flatPreset=balanced` | Preset B |
| `http://127.0.0.1:8765/?projection=flat&flatPreset=current` | Preset C（＝`?projection=flat`） |
| 任一後加 `&artDebug=1` | 疊 Art Debug |
| `?projection=flat&flatPreset=abc` | 安全回退 Preset C |
| `?projection=iso&flatPreset=near-iso` | iso（忽略 flatPreset） |

## B. 自動化（已於本環境通過）

| 項目 | 狀態 |
|---|---|
| `npm test` | ✅ 通過 |
| `tests/flat-preset.test.js`（resolver＋三 basis 幾何） | ✅ 通過 |
| `tests/flat-projection.test.js`（Preset C 參數未變） | ✅ 通過 |
| `tests/grid-projection-compat.test.js`（iso golden） | ✅ 通過 |
| `npm run check:deploy`（Build 0561a、49 modules） | ✅ 通過 |
| `npm run check:dev`（真實 Chrome browser smoke） | ✅ 通過 |
| 三 Preset 桌面＋手機＋Art Debug 截圖（14 張，零錯誤，Camera 同一） | ✅ 已擷取 |

## C. 產品比較項目（待產品負責人填寫）

對每個 Preset（A／B／C）於桌面與手機直立各看一次：

| 觀察點 | A Near Iso | B Balanced | C Current |
|---|---|---|---|
| 後牆是否清楚、有厚度 | ☐ | ☐ | ☐ |
| 牆角是否清楚、有房間感 | ☐ | ☐ | ☐ |
| 是否不像斜放的大棋盤 | ☐ | ☐ | ☐ |
| 手機直立能看到清楚且完整的營業區 | ☐ | ☐ | ☐ |
| 上方家具是否遠離 HUD 遮蔽區 | ☐ | ☐ | ☐ |
| 等角家具看起來是否自然（透視一致） | ☐ | ☐ | ☐ |
| 左右／前後布局是否好讀 | ☐ | ☐ | ☐ |

**產品負責人選擇（單選）**：☐ A Near Iso｜☐ B Balanced｜☐ C Current｜☐ 皆不滿意，需再調

> 選定後才啟動 `ART-0563-FLAT-FURNITURE-CALIBRATION`（Codex 家具校準）。

## D. 實機驗收（pending）

| 裝置 | 狀態 |
|---|---|
| iPhone Safari（直立） | ☐ pending |
| Android Chrome（直立） | ☐ pending |
| 桌面 Chrome / Edge | ☐ pending |
| 手機橫式 | ☐ pending |

> 未完成實機驗收前，不得宣稱三方案已在真實裝置比較通過。本環境證據為桌面 Chrome headless 截圖。

## E. 不在本次範圍

- 家具逐件 flat 校準／override／重畫。
- 玩家可見 Preset 切換按鈕。
- EconomySystem／StationRegistry／顧客／訂單／店長／店員／招募／反應系統／貓咪新行為。
- 修改存檔 key／schema、iso 呈現、家具邏輯資料、Camera 重寫。
