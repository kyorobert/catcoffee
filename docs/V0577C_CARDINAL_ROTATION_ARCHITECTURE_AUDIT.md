# V0577C 正交基本方位旋轉架構稽核（Phase A）

- 任務：ARCH-0577C-ORTHOGONAL-CARDINAL-ROTATION-AND-EDIT-MODE
- 基線：V0.57.7-alpha｜Build `0577b`（本稽核撰寫時 repo 現況）
- 本文件性質：**只做稽核、判定與最小風險方案**。在本稽核取得核准前，不進行 Runtime 廣泛實作。
- STOP 條款檢查結論（先講結論）：**未觸發任何 STOP 條款**。正確的 90° 正交旋轉可在**不改 Save schema、不改 x/y/r 語意、不搬移任何家具座標、不建立第二套 Grid/Occupancy、不重畫 47 張美術、不動 CameraController 核心**的前提下達成。詳見 Q13、Q14。

---

## 基線證據（撰寫本稽核前實測）

| 項目 | 結果 |
|---|---|
| `BUILD_ID` | `0577b`（`assets/js/config/build-info.js:4`） |
| `npm test`（core） | PASS |
| `npm run test:build` | PASS（V0.57.7-alpha｜第一批家具旋轉與方向校正版, Build 0577b） |
| `npm run test:ortho-furniture` | PASS（12 IDs, 48 authored directions） |
| `npm run test:entrance` | PASS（migration 5402） |
| `npm run test:ortho-area` | PASS |
| `npm run test:drag` | PASS |
| `npm run test:furniture-footprint` | PASS（47 footprints agree） |
| `npm run test:furniture-direction` | PASS |
| `npm run check:deploy` | PASS（Build 0577b, 57 modules） |

基線為 0577b 且全綠，符合開工前提。

---

## 十四問

### Q1 — 家具存檔 x / y / r 的語意是什麼？
- 儲存為**邏輯格座標**：`x`、`y` 為家具 footprint 包圍盒的**左上角格**（top-left cell）；`r` 為 0..3 的整數旋轉，實際以 `r % 4` 使用。
- 證據：`SpatialGrid.getFootprintCells()` 由 `(x,y)` 往**右、下**填格（`for gy=y..y+height; gx=x..x+width`，`assets/js/systems/SpatialGrid.js:18-23`）。因此 `(x,y)` 恆為左上角，不是中心。
- Save key `catCafePhaserV0540`、`sceneSchemaVersion=5401`、`migrationCompletedVersion=5402`。x/y/r 三個欄位即完整表達位置與朝向，**無額外像素或方位欄位**。

### Q2 — `getFootprintSize` / `getFootprintCells` 如何隨旋轉變化？
- `getFootprintSize(type,r)`：`Math.abs(r)%2 ? [foot[1],foot[0]] : [foot[0],foot[1]]`（`SpatialGrid.js:14-17`）。即**奇數旋轉交換寬高**，偶數旋轉維持原寬高。
- `getFootprintCells`：以左上角 `(x,y)` 為起點、依交換後的 `[width,height]` 展開矩形格集合。
- 關鍵推論：footprint 只取決於 `r % 2` 與 `(x,y)`。所以 `cells(r0)==cells(r2)`、`cells(r1)==cells(r3)`；且 `(x,y)` 在旋轉中**不被變更**。

### Q3 — `getAnchor` 的世界座標如何計算？（正交）
- `OrthogonalProjection.getAnchor(type,x,y,r)`（非 floorDecoration）= footprint polygon 的 `bottomRight` 與 `bottomLeft` 中點 = **包圍盒底邊中央**（`OrthogonalProjection.js:84-96`）。
- 幾何展開：`gridToWorld(gx,gy)=O + (gx*88, gy*120)`；`getFootprintPolygon` 用 `getCellDiamond` 的 ±0.5 角點。推導出：
  - **anchor 的格座標 = (x + w/2 − 0.5, y + h − 0.5)**，其中 `[w,h]=getFootprintSize(type,r)`。
- floorDecoration 例外：取四角平均（中心），亦僅依 `(x,y,w,h)`。
- 這是**純資料、可重算、無隨機、無累積誤差**的整數/半整數運算。

### Q4 — 1×1 家具旋轉時視覺與 footprint 如何變化？
- `w=h=1` → anchorGrid = `(x, y+0.5)`，**四個旋轉完全相同**；footprint 亦恆為單格。
- 結論：1×1 旋轉時**位置與占格皆不動，只有貼圖/朝向改變**。（測試家具：`chair`、任一 1×1）

### Q5 — 2×1 家具旋轉時的行為？
- `foot=[2,1]`。anchorGrid：
  - r0/r2（w=2,h=1）→ `(x+0.5, y+0.5)`
  - r1/r3（w=1,h=2）→ `(x+0.0, y+1.5)`
- 以 (5,5) 實算：r0=(5.5,5.5)、r1=(5.0,6.5)。世界位移 `Δ(r0→r1)=(−44px, +120px)`。
- 這是「以左上角為樞紐（corner-pivot）」的旋轉：包圍盒底邊中央**確實會移動**。**這正是 0577b 用固定 pivot 隱藏起來的真實位移。**
- footprint：r0={(5,5),(6,5)}、r1={(5,5),(5,6)}——共用左上角 (5,5)，往不同方向展開。

### Q6 — 1×2 家具旋轉時的行為？
- `foot=[1,2]`，與 2×1 互為轉置。r0/r2（w=1,h=2）→`(x, y+1.5)`；r1/r3（w=2,h=1）→`(x+0.5, y+0.5)`。行為與 Q5 對稱，同為 corner-pivot、可逆。

### Q7 — 2×2 家具旋轉時的行為？
- `w=h=2` → anchorGrid = `(x+0.5, y+1.5)`，**四旋轉相同**；footprint 恆為同 4 格。
- 結論：2×2 旋轉**位置與占格皆不動，只有貼圖/朝向改變**（同 1×1 的不變性）。（測試家具：任一 2×2、`doubleCatTree`）

### Q8 — 為什麼目前「固定視覺 anchor」會與 gameplay footprint 分離？（0577b 缺陷根因）
- `getFurnitureVisualPosition()`（`furniture-display-state.js`）在 `calibration.rotationAnchor==='base-rotation'` 時，**一律用 `baseRotation`(=0) 的 anchor**，再加 `perDirectionNudge`。
- 而 `orthogonal-furniture-visuals.js:58-62` 的 calibration 為 `baseRotation:0` 且 `perDirectionNudge = ZERO_NUDGE`（全 0）。
- 因此 **Sprite/Ghost 的世界位置永遠 = `getAnchor(type,x,y,0)`**，而 Occupancy/Placement/紅綠框用 `getFootprintCells/Polygon(type,x,y,r)` 的**實際 r**。
- 對非方形（2×1、1×2），兩者相差 `(−44px,+120px)` 量級：**貼圖在 A、占格在 B**。這就是 ARCH-0577C 要消滅的核心缺陷。（消費點證據：Entity `FurnitureEntity.js:10,46`；Ghost/preview `FurnitureDragController.js:157,176,199`；框 `:245,267`。）

### Q9 — gameplay 層（Occupancy / Placement / Save）目前是否正確？
- **是，gameplay 層已是誠實的。** `validate`→`placement.validatePlacement({...rotation:r})`、`evaluateCandidate` 的 `cells/polygon` 皆用實際 r（`FurnitureDragController.js:211-247`）；commit `Object.assign(drag.item, drag.candidate)` 後 `occupancy.addItem`（`:309-311`）；`saveAdapter.save()` 存實際 x/y/r。
- 亦即：**錯的只有「視覺位置」單一函式**，不是占格或存檔。這讓修正範圍極小。

### Q10 — 目前 rotate / cancel / commit 流程？
- rotate：`rotateCandidate()` `r=(r+1)%4` → `syncGhost()`（視覺，pin r0）+ `renderPlacementVisuals()`（框，實際 r）（`:356-362`）。→ 旋轉當下框與貼圖分離。
- cancel：`drag.entity.setGridPosition(original.x, original.y, original.r)` 並補回 occupancy（`:334-335`）→ **已正確還原 x/y/r 與占格**。
- commit：僅在 `result.valid` 才寫入；非法時 `!drag.isNew` 補回原占格並吐司，不扣金幣（`:284-290`）→ 符合 §10「失敗不扣幣、不搬移」。
- 結論：rotate 的**框/占格已正確**、cancel/commit 已符合規範；唯一要改的是「rotate 後貼圖位置要跟上實際 r」。

### Q11 — 方位語意目前如何解析？可否為正交建立獨立 cardinal 映射而不動 iso/flat？
- 目前 `rotationToDirection(r)`（`furniture-direction.js`）回傳 iso 風格四向 `down-right/down-left/up-right/up-left`；`orthogonal-furniture-visuals.js` 的貼圖 key 亦以這四個名稱編排（`textureByDirection`）。
- 可以獨立：新增 `ORTHOGONAL_CARDINAL_DIRECTION_MAP = {0:'south',1:'west',2:'north',3:'east'}`，**僅在 projectionMode==='ortho' 時**用它解析朝向；再以一張 cardinal→既有貼圖 key 的對照表（例：south→down-right、west→down-left、north→up-left、east→up-right）重用現有 48 張 PNG，**不改 iso/flat 的 rotation/texture/golden/save 對應，不重畫美術**。
- 旋向（順/逆時針）需在本版**文件固定、測試鎖定、版本內不可逆**：本稽核建議採 **`r+1` = 順時針**（螢幕上 south→west→north→east），於 Phase B 測試以固定表鎖定。

### Q12 — 是否能建立「單一純資料 rotation resolver」讓所有消費者共用一個結果？
- 可以。輸入：`type/definition、當前 x/y/r、target r、projectionMode、grid 幾何`。輸出：`resolved x/y/r、footprintCells、logical pivot（左上角格）、visual world position、directionKey、candidateSignature、safelyRepresentable 旗標`。
- 關鍵：**visual world position 改為 `grid.getAnchor(type,x,y,實際 r)`**（與 footprint 同源），取代 0577b 的 r0-pin。如此 Entity/Ghost/框/Occupancy/Save/ArtDebug/BrowserSmoke 全部吃**同一個 resolved 結果**。
- 現有 `candidateSignature = type:x:y:r:movingId`（`:223-225`）已含 r，可直接作為 resolver 的簽章基礎。

### Q13 — 「單一 resolver」是否需要改 Save schema 或搬移座標？（STOP 條款核心）
- **不需要。**
  - x/y/r 語意不變、欄位不變、值不變 → 舊存檔位置**不會被改動**。
  - footprint「奇數旋轉交換寬高、左上角不動」已能無損表達 90° 旋轉；`cells(r0)==cells(r2)`、`cells(r1)==cells(r3)`，且 anchor 為精確半整數運算 → **4× 旋轉回到完全相同 x/y/r/footprint/visual，零漂移**（Q3–Q7 已算）。
  - 修正只發生在**視覺位置函式**與**新增純資料 resolver + cardinal 映射**，Occupancy/Placement/Save 一律沿用既有實際 r 路徑。
- 逐條對照 STOP 條款（§21）：需改 Save schema？**否**。需批次搬移家具座標？**否**。需第二套 Grid/Occupancy？**否**。方位映射無法分離而破壞 iso/flat？**否**（ortho-only 分支）。非方形無法用現有整數格 x/y/r 表達？**否**（本已表達）。需重畫 47 張？**否**（cardinal 重用既有 key）。需 CameraController 核心重構？**否**（編輯模式用 DOM 底列替換，不動相機核心）。舊存檔位置會變？**否**。→ **全部否，未觸發 STOP。**

### Q14 — 建議的最小風險方案與 rollback？
**方案（最小風險、分階段、可回滾）：**
1. **Phase B 新增純模組** `assets/js/core/orthogonal-furniture-rotation.js`，導出 `resolveOrthogonalRotationPlacement(input)`，回傳 Q12 的統一輸出；其中 visual world position = 實際 r 的 `getAnchor`（誠實 corner-pivot）。iso/flat 不走此模組（維持現行 `getFurnitureVisualPosition` 相容行為，或以 projectionMode 分支保持既有結果 golden 不變）。
2. **改寫 `getFurnitureVisualPosition`**：ortho 時委派給 resolver（等同移除 r0-pin 的 base-rotation 校準）；把 `orthogonal-furniture-visuals.js` 的 `calibration` 由「base-rotation 固定 pivot」退場（保留欄位相容但語意改為 actual-rotation，或移除該分支）。
3. **新增 cardinal 映射** `ORTHOGONAL_CARDINAL_DIRECTION_MAP` 與 cardinal→貼圖 key 對照（ortho-only），不動 iso/flat。
4. **消費者全部改吃 resolver 結果**：`FurnitureEntity`（constructor/sync）、`FurnitureDragController`（createGhost/syncGhost/updateCandidateFromPointer/renderPlacementVisuals）、ArtDebug、browser-smoke。
5. **編輯模式（Goal C）**：以既有底部容器**替換**主導覽列，不新增第二層浮動 `selectionBar`、不改相機核心。
6. **測試鎖定**：新增 resolver round-trip（1×1/2×1/1×2/2×2 + 全部真實非方形）、cardinal 旋向固定表、resolver-shared（sprite==框==occupancy 同源）、iso/flat golden 不變、edit-mode pointer、camera-no-jump、44×44。

**rollback：**
- 新模組與 cardinal 映射為新增檔案；`getFurnitureVisualPosition` 的改動為單函式分支。回滾 = 還原該函式 ortho 分支為 base-rotation + 移除 resolver 委派，即回到 0577b 視覺行為。
- 因 x/y/r/Save/Occupancy 全程未變，**任何階段回滾都不會污染存檔或占格**；舊存檔在 0577c 與 0577b 之間可雙向載入。
- 版本回滾：`?v=0577c`→`?v=0577b`、`BUILD_ID` 還原、check.js protectedHashes 復原即可。

---

## 判定

- **GREEN，可進入 Phase B。** 正交 cardinal 90° 旋轉在現有 Save 契約下**安全可表達**，缺陷侷限於單一視覺位置函式，修法為「新增純資料 resolver + 視覺改吃實際 r anchor + ortho-only cardinal 映射」。
- **非方形單次旋轉的貼圖會誠實地隨 corner-pivot 移動**（例：2×1 為 −44px/+120px 量級），此為正確行為而非缺陷；4× 回圈精確歸位、零漂移。**不得**再以固定 pivot 或畫面 offset 遮蓋此位移（違反任務 Goal A 與治理）。
- 未觸發任何 §21 STOP 條款；毋須先送架構選項給產品負責人即可實作。惟 **iPhone Safari 實機驗收欄位仍保留給產品負責人勾選**，本工不代勾。
