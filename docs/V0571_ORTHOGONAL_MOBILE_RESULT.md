# V0.57.1-alpha｜Orthogonal 手機直立取景、Camera 邊界與營運構圖修正 結果

- 任務：`ARCH-0571-ORTHOGONAL-MOBILE-FRAMING-AND-LAYOUT`
- 日期：2026-07-25
- 基線：`V0.57.0-alpha｜正交平面咖啡廳原型版` / Build `0570a`
- 本版：`V0.57.1-alpha｜正交手機構圖調整版` / Build `0571a`
- 存檔 key：`catCafePhaserV0540`（不變）；`sceneSchemaVersion` 5401、`migrationCompletedVersion` 5401（不變）
- 決策：[DEC-018](./decisions.md#dec-018orthogonal-手機初始取景與-camera-邊界accepted)（Accepted）
- 人工驗收：[V0571 手機驗收](./V0571_ORTHOGONAL_MOBILE_ACCEPTANCE.md)｜並排比較：[V0571 比較 HTML](./V0571_ORTHOGONAL_MOBILE_COMPARISON.html)
- 截圖證據：[`docs/evidence/v0571/`](./evidence/v0571/)

> 產品負責人於真實 iPhone 確認 Orthogonal 正交方向正確，但 V0.57.0 手機首屏 Camera 過度放大、需大量左右拖曳、拖到房間外會露出大片背景、Demo 過於鬆散。本版**只修 Camera framing／safe viewport／房間有效邊界／Demo 構圖**，不動投影數學、不重畫家具、不做營運系統。**iso 仍為預設**；Orthogonal 仍由 URL opt-in。

---

## 1. iPhone 基線問題（V0.57.0）

實測（real-browser，390×844，`?projection=ortho&demoLayout=1`）：

- 初始 zoom：`1.0`（cover-zoom 於整個 1560×1120 world），初始 scroll 使 worldView 僅 `390×704`。
- 首屏只看到房間**約 37% 寬度**（1040px 房間只露出 390px），必須左右拖曳。
- 左右拖曳後露出大片無玩法背景（Camera bounds＝整個 world）。
- Demo 23 件家具偏鬆散、像展示場。

根因：`CameraController` 對 iso／flat／ortho 一律用「cover-zoom 填滿整個 world」＋「world bounds」，與正交房間（內容遠小於 world）不匹配。

---

## 2. Safe Viewport（純模組 + DOM adapter）

- **純計算**：[`assets/js/core/scene-viewport.js`](../assets/js/core/scene-viewport.js)
  - `deriveOverlayInsets(canvasRect, overlays)`：只扣除**實際覆蓋 canvas** 的浮動元件（依最近邊界歸位），HUD／底部列在各自 grid row、不覆蓋 canvas → 貢獻 0。
  - `computeSafeViewport({canvasWidth, canvasHeight, insets})`：回傳可用矩形，永不反轉、有 minSize。
- **DOM adapter**：[`assets/js/ui/viewport-metrics.js`](../assets/js/ui/viewport-metrics.js) — **唯一**讀取 viewport DOM rect 的地方（`getBoundingClientRect`，不硬編碼裝置／工具列高度），量測 HUD／底部列／家具情境列並轉為 insets；情境列隱藏時保留可設定的底部 reserve（本版 `78`）。
- Canvas 尺寸沿用 Phaser `Scale.RESIZE`（canvas＝`#gameViewport`，已排除 HUD／底部列與上下 safe-area padding）＋ `visualViewport`（`main.js` 既有 resize 監聽，未改）。

---

## 3. Orthogonal 初始 Camera Fit（純模組）

- [`assets/js/core/camera-framing.js`](../assets/js/core/camera-framing.js)（純函式）：
  - `computeFitZoom`：`fit = min(safeW/contentW, safeH/contentH)`（含 CSS margin），上限 `maxInitialZoom`、下限 `minZoomFloor`。
  - `clampCenterToContent`：以相機**中心（world midpoint）**表達；view ≥ content 該軸置中、否則夾在房間內。
  - `computeInitialFraming`：回傳 `{zoom, centerX, centerY, minZoom}`。
- 定位改用引擎的 `camera.centerOn(worldX, worldY)`（可靠置中），**不再假設 scrollX/scrollY 是 world 左上角**（V0.57.0 首版誤用此假設導致房間偏移，已修正）。
- **Content bounds**＝正交房間視覺矩形（地板＋上牆），由投影幾何推導；demo 與既有布局**都用房間 bounds**（不因家具少而過度放大）。
- `ORTHO_FRAMING` 集中所有數值（marginCss 10、toolbarReserveCss 78、maxInitialZoom 0.9、minZoomFloor 0.18），**無任何 390/393/430 專用硬編碼**。

**實測初始 fit（zoom＝minZoom，midpoint＝房間中心 (780,496)，toolbar 隱藏、無選取）**：

| viewport | canvas | zoom | 房間可見寬度 | 需左右拖曳 |
|---|---|---|---|---|
| 390×844 | 390×696 | 0.356 | 100%（worldView 1096 ≥ 房間 1040） | 否 |
| 393×852 | 393×704 | 0.359 | 100% | 否 |
| 430×932 | 430×784 | 0.394 | 100% | 否 |
| 1440×900 | 1440×812 | ~0.71 | 100%（房間置中，不佔滿寬度） | 否 |

---

## 4. Camera 邊界（Pan／Zoom Clamp）

- Orthogonal 移除 Phaser world bounds，改由 `clampCenterToContent` 夾住**房間內容**。
- `CameraController`（非受保護）新增 `applyFraming`／`clampToContent`；pan（`pointermove`）、pinch／wheel（`setZoomAt`）後都重新 clamp；resize 保留玩家 zoom、僅重算 fit 下限並 clamp。iso／flat 完全走原路徑（cover-zoom + world bounds），行為不變。
- `minZoom`＝fit（縮到最小即整間房間，不再出現房間縮成中央小方塊、四周空白）。`maxZoom` 沿用 1.65。
- **實測**（`docs/evidence/v0571/`）：minZoom 整間可讀；zoom-in 後可平移；pan 到左/右/上/下極限時，房間邊界貼齊畫面、**外部無大片空白**（見 `*-pan-*-limit.png`）；pinch 後重新 clamp。
- 房間外背景以房間基色填滿（`drawRoomOrtho` 底填擴大到 world 3×3），**無黑邊**。

---

## 5. 家具情境列 Safe Area

- 初始 boot **不自動選取家具**、**不顯示情境列**（browser smoke 斷言）。
- 底部保留 `toolbarReserveCss` 78px：房間置於情境列上方，選取家具時情境列出現於保留帶、**不遮住房間內容**；**選取／關閉情境列時 Camera 不跳動**（evidence 量測 midpoint/zoom 無變化）。見 `mobile-390-existing-selected-furniture.png`、`mobile-390-existing-context-toolbar-closed.png`。
- 未重製情境列 UI／文字／功能，只做 safe-area 接線。

---

## 6. resize／visualViewport

- 沿用 `main.js` 既有 `resize`／`visualViewport resize`／`scroll` 監聽與 rAF debounce（未改）；未重建 Scene、未重建家具、未改存檔。
- Orthogonal resize：保留玩家 zoom，重算 fit 下限，`clampToContent` 維持在合法範圍；地址列收合／orientation 變化後不跳到房間外、不黑屏。
- iso／flat resize 行為未改（未觸碰其分支）。

---

## 7. 房間比例 / OrthogonalProjection

- **未修改** `OrthogonalProjection`（cellWidth 104、cellHeight 88、origin、room render 皆不變；hash 未變）。首屏可讀性、家具可辨識性、上中下分區、不需左右拖曳皆由 Camera framing 達成，依任務「只靠 Camera 即可達成就不改投影」原則不動投影。
- `axisX.y=0`、`axisY.x=0` 仍成立（正交、無 skew/rotation）。
- 已知：手機直立為固定 landscape world（1560×1120）＋10×8 寬型房間，fit-to-width 後上下留有房間基色邊距（非黑邊）；此為此房型於直立螢幕的固有 letterbox，非錯誤。若未來要進一步減少邊距，可另案評估加高 cellHeight（本版未做）。

---

## 8. Demo Layout 重排（16 件，緊湊分區）

`ortho-demo-layout.js`（純資料、display-only、不寫存檔）由 23 件重排為 **16 件**：

- **上方服務區（y0）**：`counter`(2×1) + `coffeeMachine`/`oven`/`smartOrder` 連續服務帶；`y1` 為工作／排隊通道。
- **中央用餐區（y3–y4）**：左桌組（`woodTable`+`chair`+`cushionChair`）與右桌組（`roundTable`+`chair`+`redChair`），各鋪 `creamPlaidRug`/`rugPink`；中央走道清楚。
- **貓咪區（前左，y6–y7）**：`doubleCatTree`+`catBed`+`scratchPost` 集中一角，避開入口與主走道。
- **入口／通道**：`(8,7)(9,7)` 淨空；BFS 驗證入口可達服務區前與座位區（reach 60 格、非一格迷宮）。
- 隔離：**不改 `state.items`／inventory／coins、不觸發 save、存檔不含 projection/demoLayout**（測試＋real-browser 驗證）。

---

## 9. 測試與驗證

| 檢查 | 結果 |
|---|---|
| `npm test` | 通過 |
| `tests/camera-framing.test.js`（新增：safe viewport／fit zoom／centre clamp／純度） | 通過 |
| `tests/ortho-demo-layout.test.js`（更新：16 件、分區、可達性、隔離） | 通過 |
| `tests/ortho-projection.test.js`、`projection-mode`、`flat-*`、`grid-projection-compat`（iso/Flat C golden 未改） | 通過 |
| `tests/build-consistency.test.js`（V0.57.1-alpha／0571a） | 通過 |
| `npm run check:deploy` | 通過（Build 0571a、54 modules） |
| `npm run check:dev`（真實 Chrome browser smoke，含 ortho 首屏 fit＝minZoom、整寬可見、無初始選取／情境列、invalid 回退） | 通過 |
| 真實瀏覽器證據（初始／pan 邊界／zoom／選取／桌面／before-after，共 17＋3 張） | 零 page error |

Camera fit 測試涵蓋：zoom 由 bounds 計算、不同 viewport 不同 zoom（非硬編碼）、寬型房間 width-constrained／桌面 height-constrained、maxInitialZoom 上限、minZoomFloor 下限、room<viewport 置中、無 NaN/Infinity。Clamp 測試涵蓋四邊界、fit、zoom-in、內容小於 view 置中、內部自由平移。Safe viewport 測試涵蓋 overlay 相交/不相交、never invert、DOM 缺失 fallback。

---

## 10. 手機首屏結果摘要

390×844 / 393×852 / 430×932：初始 zoom＝fit（0.356/0.359/0.394），midpoint＝房間中心，**房間 100% 寬度可見、上中下分區皆可見、無需左右拖曳、無初始選取／情境列、無黑邊**；上方服務區在 HUD 下方可見，下方家具在情境列保留帶上方。桌面 1440×900：房間置中、不佔滿寬度、外部無大量背景。

---

## 11. 存檔與受保護契約

- `CURRENT_KEY = catCafePhaserV0540`、`sceneSchemaVersion` 5401、`migrationCompletedVersion` 5401（不變）。
- furniture ID／`x/y/r`／footprint／Occupancy／Placement／Pathfinding 未改。
- **Camera zoom/scroll 不入存檔、Projection 不入存檔、demoLayout 不入存檔**（未新增 Camera 持久化）。
- 受保護 hash：`GridSystem`、`flat-projection-presets`（僅 query 升版）更新；**新增保護 `scene-viewport`、`camera-framing`、`viewport-metrics`**；`OrthogonalProjection`／`projection-mode`／`FlatProjection`／`IsoProjection`／`SpatialGrid`／`room-config`／`furniture-config` hash **未變**。未弱化任何既有保護。obsolete query 新增禁止 `?v=0570a`。

---

## 12. LF／Git

- 根目錄 `.gitattributes` 保留（LF）；未改全域 Git 設定。本環境**無 `.git`**：未 git init/commit/push/部署。
- `check.js` 持續驗證版本／Build／protected hash／obsolete query／required／tests。

---

## 13. 已知問題（僅列實際）

- **Initial framing**：手機直立房間上下有房間基色邊距（wide 房型於 tall 螢幕的固有 letterbox；非黑、房間置中完整）。
- **Camera pan/zoom**：正常；pan 到邊界貼齊、無外部空白。
- **Demo Layout**：緊湊可讀；家具仍為 iso Placeholder（透視待 `ART-0572` 重作，本版不動）。
- **Furniture placeholder**：等角 sprite 於正交地板透視不合（已知，未校準）。
- **Mobile Safari / Android**：本版證據為桌面 Chrome headless；iPhone/Android 實機人工驗收 pending。
- **Desktop / Browser / Save**：未見問題。

---

## 14. 回復方式

- 回到 V0.57.0 framing：還原 `CameraController.js`（移除 `framing` 分支）、`CafeScene.js`（移除 `buildOrthoFraming`／`framing` 傳入、還原 `drawRoomOrtho` 底填）。
- 需移除的新模組：`assets/js/core/scene-viewport.js`、`assets/js/core/camera-framing.js`、`assets/js/ui/viewport-metrics.js`、`tests/camera-framing.test.js`、`docs/V0571_*`、`docs/evidence/v0571/`。
- 需還原：`ortho-demo-layout.js`（回 23 件）、`ortho-demo-layout.test.js`、`browser-smoke.test.js`（移除 framing 斷言）、版本檔（0571a→0570a、V0.57.1→V0.57.0）。
- `check.js` 回復：還原 protected hash（GridSystem/flat-presets）、移除三新模組保護與 required/tests、版本 pin 與 obsolete。
- **不涉及存檔回復**：存檔 key/schema/內容全程未改。

---

## 15. 誠實聲明（未完成）

- 手機構圖尚待產品負責人**再次實機驗收**；本版證據為桌面 Chrome headless。
- 未重畫家具、未逐件校準、未新增營運/角色系統、未重製 HUD、未新增 Projection 切換按鈕。
- Orthogonal 仍非正式預設（iso 為預設與 rollback）。未 commit/push/部署；本環境無 `.git`。
