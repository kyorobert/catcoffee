# V0.56.1-alpha｜Flat 淺俯視構圖三方案比較結果

- 任務：`ARCH-0563-FLAT-VISUAL-PRESET-COMPARISON`
- 日期：2026-07-24
- 基線：`V0.56.0-alpha｜淺俯視投影原型版` / Build `0560a`
- 本版：`V0.56.1-alpha｜淺俯視構圖比較版` / Build `0561a`
- 存檔 key：`catCafePhaserV0540`（不變）
- 相關決策：[DEC-016](./decisions.md#dec-016flat-淺俯視構圖三方案比較proposed待產品選擇)（另見 DEC-008／012／015）
- 人工驗收：[V0561 構圖比較人工驗收](./V0561_FLAT_PRESET_COMPARISON_ACCEPTANCE.md)
- 截圖證據：[`docs/evidence/v0563/`](./evidence/v0563/)

> **本版只提供三個「可同時比較」的 Flat 構圖方案，不自行選定正式視角。** 正式 Flat Preset 由產品負責人比較桌面與手機截圖後決定；未選定前任一 Preset 都不是正式預設。iso 仍是預設投影。

---

## 1. 這次要回答的問題

`ARCH-0562` 已證明 Flat 技術可運作。本版要回答的是**構圖**問題：

1. Flat 應保留多少原本 iso 的空間深度？
2. 哪種角度能兼顧手機直立可讀性、沿用等角家具、咖啡廳室內空間感、家具與地板透視一致、以及未來角色工作流程辨識度？
3. 後牆與房間邊界要怎麼呈現，才不像一塊斜放的大棋盤？
4. 哪個 Preset 值得進入後續家具校準？

因此本版建立三個 Preset：**A｜Near Iso**、**B｜Balanced Shallow**、**C｜Current Flat**，三者皆為 Proposed 比較方案。

---

## 2. 三個 Preset 的參數

三個 Preset **共用同一個 `FlatProjection` 實作**，只更換集中在 [`assets/js/config/flat-projection-presets.js`](../assets/js/config/flat-projection-presets.js) 的參數。basis 以 iso（`axisX{64,32}`、`axisY{-64,32}`）與現行 Flat 為兩端點插值，再逐項驗證後定案。

| Preset | id | `axisX` | `axisY` | determinant | origin（推導） | 後牆高 | 側牆 |
|---|---|---|---|---|---|---|---|
| iso（參考） | — | `{64,32}` | `{-64,32}` | 4096 | `{716,304}` | — | V 型雙牆 |
| **A｜Near Iso** | `near-iso` | `{78,22}` | `{-37,48}` | 4558 | `{558.5,293}` | 206 | 有（後牆＋左牆） |
| **B｜Balanced** | `balanced` | `{93,13}` | `{-10,63}` | 5989 | `{396.5,281}` | 190 | 有（後牆＋左牆） |
| **C｜Current Flat** | `current` | `{112,0}` | `{26,84}` | 9408 | `{185,266}` | 176 | 無（單一後牆） |

- **Preset C 完整沿用 `ARCH-0562` 的 `FLAT_PROJECTION_PARAMS`（以參照沿用，未調整）**，且 `drawRoomFlat` 的房間 metadata 精確重現原本常數（後牆高 176、單一水平後牆、外框線寬 4、牆飾位置係數 0.28／0.72／0.52），故 Preset C 與 `ARCH-0562` 畫面一致。`FlatProjection.js` 受保護 hash 未變。
- determinant 單調遞增 `iso(4096) < A(4558) < B(5989) < C(9408)`：數值越大代表投影越「平／俯視」。所有 origin 皆由各 Preset 的房間 centroid 推導，使 `gridToWorld(4.5,3.5)` 一律落在世界中心 `(780,560)`，三個 Preset 取景公平。

### 構圖光譜（越往右越平）

| 指標 | iso | A Near Iso | B Balanced | C Current |
|---|---|---|---|---|
| 後牆邊斜度（px） | 320 | 220 | 130 | 0（水平） |
| 欄位傾角 `axisX.y` | 32 | 22 | 13 | 0（水平欄） |
| 列深 `axisY.y` | 32 | 48 | 63 | 84 |
| 地板螢幕寬×高（px） | 1152×576 | 1076×604 | 1010×634 | 1328×672 |

---

## 3. URL 與解析規則

| 目的 | 網址 |
|---|---|
| 預設 iso | `/` 或 `/?projection=iso` |
| 相容 Flat（＝Preset C） | `/?projection=flat` |
| Preset A | `/?projection=flat&flatPreset=near-iso` |
| Preset B | `/?projection=flat&flatPreset=balanced` |
| Preset C | `/?projection=flat&flatPreset=current` |
| 疊 Art Debug | 於上述後加 `&artDebug=1` |

規則（純函式 `resolveFlatPreset` / `flatPresetFromSearch`，可 Node 測試）：

- `projection` 不是 `flat` → 忽略 `flatPreset`（iso 模式不建立任何 Flat Preset，`grid.flatPreset` 為 `null`）。
- `projection=flat` 且無 `flatPreset` → `current`（維持 `ARCH-0562` 既有語意）。
- `near-iso` / `balanced` / `current` → 對應 Preset；大小寫、前後空白皆正規化。
- 未知值、空字串、非字串 → `current`。
- **不寫入 `localStorage`，不寫入 `SaveAdapter`**；重整後由網址決定。`GridSystem` 不直接讀 URL，由 `CafeScene` 解析後把 id 傳入。
- 本版**未**建立玩家可見的 Preset 切換按鈕（僅供比較用）。

---

## 4. 房間構圖調整（只屬視覺）

`drawRoomFlat` 改為 metadata 驅動，由各 Preset 的 `room` 決定：後牆高度、是否畫左側牆、外框線寬、牆飾位置。所有點皆由投影後的外框角與 per-cell 多邊形推導，**不使用固定畫面座標**；牆面深度 `-1000`、純視覺。

- **A / B**：加畫左側牆與後牆，兩牆於後角交會，形成清楚牆角與房間包覆感；後牆隨欄位傾角自然斜向後退（較接近 iso 的 V 型牆）。
- **C**：維持單一水平後牆（無側牆），重現 `ARCH-0562`。
- iso branch（`drawRoom`）完全未動。

**未改任何邏輯資料**：`cols/rows`、`placeableMask`、entrance cells、家具 `x/y/r`、footprint、layer、rotation、Occupancy、Pathfinding 皆不變。牆面不影響角色行走資料，貓咪不會走進牆面視覺區，家具合法格未失效（見 §7 測試）。

---

## 5. 截圖證據（相同配置、相同鏡頭）

以本機 Chrome（headless、`deviceScaleFactor:2`）、HTTP 載入（非 `file://`）擷取。每張皆：清空 `localStorage` 後同一份預設家具配置（18 件家具、3 隻貓）、相同 viewport、相同初始 Camera、相同 zoom、載入後固定沉澱 1200ms 才截圖、相同 DOM HUD。

自動驗證：每張截圖的 `projectionMode`、`flatPresetId` 皆正確，且**同一 viewport 下三個 Preset 的初始 Camera 完全相同**（例：mobile-430 三者皆 `zoom=1, scrollX=565, scrollY=168`；mobile-390 art-debug 三者皆 `zoom=1, scrollX=585, scrollY=212`），零 page error、零 HTTP ≥400（favicon 除外）。

| 檔案 | 內容 |
|---|---|
| `desktop-iso.png` / `mobile-390-iso.png` | iso 參考 |
| `desktop-near-iso.png` / `mobile-390-near-iso.png` / `mobile-430-near-iso.png` | Preset A |
| `desktop-balanced.png` / `mobile-390-balanced.png` / `mobile-430-balanced.png` | Preset B |
| `desktop-current.png` / `mobile-390-current.png` / `mobile-430-current.png` | Preset C |
| `mobile-390-{near-iso,balanced,current}-artdebug.png` | 各 Preset 疊 Art Debug |

### 觀察摘要

- **A｜Near Iso**：最接近 iso，地板仍有明顯前後深度，後牆＋左牆形成清楚牆角，房間感最強；等角家具看起來最自然。手機直立可讀性改善有限（如預期）。
- **B｜Balanced**：地板明顯比 iso 平、比 C 有深度；後牆仍清楚、房間不像斜棋盤；手機直立能看到清楚的營業區。家具與地板透視差距中等。
- **C｜Current Flat**：地板最平最寬、後牆薄且水平，家具較像散落在斜棋盤上（即產品負責人指出的問題），維持作為比較基準。

---

## 6. 家具透視觀察（本版不做逐件校準）

本版**禁止**正式家具校準（furniture ID／`x/y/r`／footprint／layer／rotation／texture／price／unlock／walkBlocking 皆未改，未重畫、未做 Preset override）。以下僅為觀察，供選定後交由 Codex（`ART-0563-FLAT-FURNITURE-CALIBRATION`）評估校準量：

| 家具類型 | 代表 | 與地板透視落差 | 備註 |
|---|---|---|---|
| 高型櫃體 | 衣櫃、書架 | C 最大、A 最小 | 立面高、iso 側面在越平的投影越突兀 |
| 桌椅 | 木桌、圓桌、椅 | C 最大、A 最小 | 桌面 iso 角度與平地板衝突最明顯 |
| 床與低矮家具 | 綠床、紅床 | 全體較小 | 低矮、受角度影響小 |
| 地毯 | rugPink、rugStripe | A/B 小、C 中 | floorDecoration 跟隨 cell 形狀，但內部條紋為 iso 繪製 |
| 工作櫃台 | 廚房檯、吧台 | C 較大 | 立體檯面，類同高型櫃體 |
| 牆掛家具 | windowHammock、photoBackdrop | 需依 Preset 牆面另評估 | 牆面概念在各 Preset 不同 |
| 貓咪家具 | 貓塔、貓城堡 | C 較大 | 高、立面明顯 |
| 裝飾植物 | 盆栽、樹 | 全體較小 | 多為直立對稱，受影響小 |

初步結論（**非決策**）：**Near Iso 需要的未來校準量最少、Current Flat 最多**；桌椅與高型櫃體是各 Preset 都要優先處理的類型。

---

## 7. 測試與驗證

| 檢查 | 結果 |
|---|---|
| `npm test`（core） | 通過 |
| `node tests/flat-preset.test.js`（新增） | 通過 |
| `node tests/flat-projection.test.js` | 通過（Preset C 參數／origin/det 未變） |
| `node tests/grid-projection-compat.test.js` | 通過（iso golden-master 未動） |
| `node tests/projection-mode.test.js` | 通過 |
| `node tests/build-consistency.test.js` | 通過（V0.56.1-alpha／0561a） |
| `npm run check:deploy` | 通過（Build 0561a、49 JavaScript modules） |
| `npm run check:dev`（含真實 Chrome browser smoke） | 通過 |
| 三 Preset real-browser 截圖（桌面＋手機＋Art Debug） | 14 張、零錯誤（見 §5） |

新增 `tests/flat-preset.test.js` 涵蓋：resolver 純函式與安全回退、三 basis 參數釘選、determinant 非零且 `iso<A<B<C`、每個 Preset 全 cell 在世界 bounds 內、round-trip 穩定、footprint／Occupancy／Placement 在 iso 與三 Preset 完全一致、`GridSystem` 依 id 選 Preset 且共用單一 `SpatialGrid`、Preset C `projection` 與 `FLAT_PROJECTION_PARAMS` 同一參照、模組純度（無引擎／DOM／存檔／角色身份）。

---

## 8. 修改範圍與相容性

- **新增**：`assets/js/config/flat-projection-presets.js`、`tests/flat-preset.test.js`、`.gitattributes`、`docs/evidence/v0563/`（14 張截圖）、本結果與驗收文件。
- **修改（Runtime）**：`GridSystem.js`（依 `flatPreset` id 選 Preset、公開 `flatPreset`）、`CafeScene.js`（解析 `flatPreset`、`drawRoomFlat` 改 metadata 驅動）。
- **版本機械變更**：全 `?v=0560a → 0561a`、版本字串 `V0.56.0-alpha｜淺俯視投影原型版 → V0.56.1-alpha｜淺俯視構圖比較版`、`BUILD_ID`／package version、`CAT_ASSET_VERSION`／`FURNITURE_REDRAW_ASSET_VERSION`、`check.js` 受保護 hash（`GridSystem` 更新、新增 presets 模組）與 obsolete 查詢（新增 `?v=0560a`）。
- **未改**：`FlatProjection.js`／`IsoProjection.js`／`SpatialGrid.js`／`projection-mode.js`（hash 未變）、`room-config.js`／`furniture-config.js`、`SaveAdapter` 邏輯／key／schema、iso 呈現、家具資料、營運與角色系統。

---

## 9. 誠實聲明（尚未完成）

- **尚未選定正式 Flat Preset**；三者皆 Proposed，等產品負責人決定。
- **未做**正式家具 flat 校準、逐件 override、重畫。
- **未新增** EconomySystem／StationRegistry／CustomerFlowSystem／OrderSystem／ActorTaskSystem／玩家店長／店員／招募／ReactionSystem／貓咪新行為。
- **手機實機**（iPhone Safari／Android Chrome）人工驗收仍 pending；本版證據為桌面 Chrome headless 截圖。詳見 [V0561 人工驗收](./V0561_FLAT_PRESET_COMPARISON_ACCEPTANCE.md)。
- 本環境無 `.git`；未 `git init`、未部署、未 push。
