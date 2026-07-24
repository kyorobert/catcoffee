# V0.57.0-alpha｜正交平面咖啡廳原型（Orthogonal Room Prototype）結果

- 任務：`ARCH-0570-ORTHOGONAL-ROOM-PROTOTYPE`
- 日期：2026-07-25
- 基線：`V0.56.1-alpha｜淺俯視構圖比較版` / Build `0561a`
- 本版：`V0.57.0-alpha｜正交平面咖啡廳原型版` / Build `0570a`
- 存檔 key：`catCafePhaserV0540`（不變）；`sceneSchemaVersion` 5401、`migrationCompletedVersion` 5401（不變）
- 決策：[DEC-017](./decisions.md#dec-017正交平面場景方向accepted停止斜投影微調)（Accepted）；[DEC-016](./decisions.md) 標為 Superseded；[DEC-008](./decisions.md) 部分更新
- 人工驗收：[V0570 正交房間驗收](./V0570_ORTHOGONAL_ROOM_ACCEPTANCE.md)
- 核心家具重作計畫：[V0570 Orthogonal 家具重作計畫](./V0570_ORTHOGONAL_ASSET_REBUILD_PLAN.md)
- 並排比較：[V0570 比較 HTML](./V0570_ORTHOGONAL_COMPARISON.html)
- 截圖證據：[`docs/evidence/v0570/`](./evidence/v0570/)

> 產品負責人已拒絕 Flat A／B／C（整體仍歪斜、方向不清），並改採**手機直立、水平／垂直、正向閱讀的平面咖啡廳**。本版建立**單一** `OrthogonalProjection`（真正軸對齊、無 skew／shear／rotation）與正交房間 rendering、非存檔 Demo Layout 與 Art Debug。**iso 仍是預設與 rollback**；ortho 尚未設為正式預設，等產品視覺驗收。現有等角家具僅作 Placeholder（透視不合為已知，待後續重作）。

---

## 1. 產品決策落檔

| 項目 | 狀態 |
|---|---|
| Preset A｜Near Iso | **Rejected** |
| Preset B｜Balanced | **Rejected** |
| Preset C｜Current Flat | **Rejected** |
| DEC-016（Flat 三方案比較） | **Superseded**（保留歷史，未刪除） |
| 停止斜投影微調 | **Accepted** |
| Orthogonal／正交平面方向 | **Accepted** |
| 房間必須水平／垂直 | **Accepted** |
| 核心家具允許重作 | **Accepted**（本次不執行重作，只出計畫） |
| 不再以「沿用全部等角家具」為房間方向前提 | **Accepted** |
| 預設 Projection | 仍為 **iso**（ortho 未設為正式預設，待驗收） |

Flat A／B／C 的 URL、程式與測試**保留**作歷史回歸；只在正式文件標為 Rejected／Superseded。iso golden-master 與 Flat C golden 未改。

---

## 2. OrthogonalProjection

檔案：[`assets/js/systems/OrthogonalProjection.js`](../assets/js/systems/OrthogonalProjection.js)（自足、無 import、受保護 hash）。

- 模型：`world = origin + gridX·axisX + gridY·axisY`
  - `axisX = {104, 0}`（X 只控制左右，欄位完全垂直）
  - `axisY = {0, 88}`（Y 只控制上下，列完全水平）
  - **`axisX.y === 0`、`axisY.x === 0`**：無 skew、無 shear、無 rotation、無透視縮放。
- `cellWidth=104`、`cellHeight=88`：集中於 `ORTHOGONAL_PROJECTION_PARAMS`（不散落 magic number）。
  - **選擇理由**：10×8 房間、既有 world bounds 1560×1120、手機直立可讀性。寬 104 → 地板寬 `10×104=1040`（世界 1560 內，左右各留 260 邊界作垂直側牆）；高 88 → 地板高 `8×88=704`（世界 1120 內，上留牆、下留邊界）；比例讓「上方服務／中央座位／下方貓咪」在直立畫面能由上而下閱讀。經 real-browser 桌面與手機驗證（見 §7）。
- `determinant = 104×88 = 9152`（非零、可逆）。
- `origin`：由房間 centroid 推導使 `gridToWorld(4.5,3.5)=(780,560)`＝世界中心（非單一 viewport 硬座標）；本版 origin `= {312, 252}`。
- 介面與既有 Projection 相容：`gridToWorld / worldToGrid / snapWorldToGrid / getCellCenter / getCellDiamond / getFootprintPolygon / getAnchor`。
- `getCellDiamond` 在 ortho 回傳**矩形**四頂點，順序固定 `[TL, TR, BR, BL]`（有測試；非菱形、非平行四邊形）。外框為乾淨矩形 `(260,208)–(1300,912)`，落在世界 bounds 內。

`ORTHOGONAL_ROOM_RENDER`（同檔輸出）：房間 rendering 的 framing metadata（後牆高度、線寬、牆飾位置），僅供 `CafeScene.drawRoomOrtho`，不含邏輯資料。

---

## 3. GridSystem 與 URL

- 既有保留：`/`→iso、`?projection=iso`→iso、`?projection=flat`→Flat Current、Flat A／B／C URL 保留。
- 新增：`?projection=ortho` 與別名 `?projection=orthogonal`，兩者啟動**同一** `OrthogonalProjection`。
- 非法值 → 安全回退 iso。**預設仍 iso**。
- `GridSystem` 第三參數 `{mode}` 選投影；**不直接讀 URL**（由 `CafeScene` 用純函式 `projectionModeFromSearch` 解析後傳入）。舊二參 constructor 仍建立 iso。
- OrthogonalProjection 與 iso／flat **共用同一 `SpatialGrid`**；未建立第二套 Grid／Occupancy／Placement／家具資料。
- Projection 模式**不寫入 SaveAdapter、不寫入 localStorage**。

---

## 4. 正交房間渲染（`drawRoomOrtho`，僅視覺）

全部由投影後的外框角與 per-cell 矩形推導（非固定畫面座標），深度 `-1000`，不改任何邏輯資料：

1. **地板**：水平／垂直矩形格（棋盤配色），淡格線與 Placement cell 對齊；無菱形、無斜邊、無整體旋轉。
2. **上方牆面**：水平長方形牆面帶（`topWallHeight`），上有窗戶與菜單牆飾；無斜屋角、無透視梯形。
3. **左右邊界**：以房間基色填滿左右邊界（世界邊到地板邊），加強垂直側邊線；不向內斜。
4. **下方邊界**：房間基色填滿地板下方作「場景結束區」；不畫完整前牆以免遮角色。
5. **入口**：邏輯入口格 `(8,7)(9,7)` 不變，於地板上以醒目底色標示。
6. **場景外**：整個世界先填房間基色，矩形房間置於其中；**無大片不明黑區、非斜放棋盤**、非 CSS transform。

iso（`drawRoom`）與 flat（`drawRoomFlat`）branch 完全未動。

---

## 5. Demo Layout（非存檔）

- URL：`?projection=ortho&demoLayout=1`（僅 ortho 有效；純函式 `isDemoLayoutRequested` 解析）。
- 純資料 fixture：[`assets/js/config/ortho-demo-layout.js`](../assets/js/config/ortho-demo-layout.js)（`ORTHO_DEMO_LAYOUT` 凍結陣列 + `buildOrthoDemoItems()`）；**配置不硬寫在 drawRoom 或 Entity 內**。
- 23 件現有 furniture ID 組成的暫時配置，分區：
  - **上方服務區**：`coffeeMachine`、`oven`、`counter`、`smartOrder`（點餐）、`dessert`、`washStation`。
  - **中央座位區**：`pinkTableLong`（共享長桌）＋ `chair`／`roundTable`／`pinkTable`／`redChair`／`cushionChair`、`sofa`、`wallBench`；`creamPlaidRug`／`rugPink` 鋪在座位下。
  - **貓咪區**：`catTent`、`catBed`、`doubleCatTree`、`scratchPost`。
  - **通道**：入口 `(8,7)(9,7)` 淨空；`y=1` 全排走道；BFS 證明入口可達櫃台前與座位區。
- 隔離保證（測試＋real-browser 驗證）：**不修改 `state.items`、`inventory`、`coins`，不觸發 `SaveAdapter.save`，存檔不含 `projection`／`demoLayout`**；關閉 demo 或一般 URL 重整後回到原存檔配置。Demo 家具為 display-only（非互動，避免拖曳／選取誤動真實存檔）。

---

## 6. 家具與角色相容（Placeholder）

- **47 件家具在 `?projection=ortho` 下無 Runtime error**（測試 + real-browser 驗證）。
- furniture ID、`x/y/r`、footprint、layer、rotation、價格、解鎖、socket、walkBlocking **全部不變**。
- `FurnitureEntity`、拖曳 Ghost、Art Debug 皆透過同一 `grid.getAnchor`／`getFootprintPolygon`（Facade）取得**相同 Orthogonal anchor**；放置格與接地點基本一致。
- **本次未加任何 Orthogonal 家具顯示 override、未逐件校準、未新增方向資料、未重畫**。等角圖片在正交地板上透視不合為**已知 Placeholder 現象**，待 `ART-0571`（Codex）重作核心家具。
- 角色：格座標不變，世界位置由 OrthogonalProjection 計算，`DepthSystem` 依 `worldY` 排序；貓咪決策／顧客流程未改；顧客 Placeholder 於營業階段可出現移動（原型截圖為 `prep` 階段故無顧客）。

---

## 7. 測試與驗證

| 檢查 | 結果 |
|---|---|
| `npm test`（core） | 通過 |
| `tests/ortho-projection.test.js`（新增：軸對齊數學／footprint／資料相容／GridSystem 選擇／純度） | 通過 |
| `tests/ortho-demo-layout.test.js`（新增：fixture 有效／不重疊／入口可達／隔離／純度） | 通過 |
| `tests/projection-mode.test.js`（擴充 ortho／orthogonal／invalid 回退） | 通過 |
| `tests/flat-*`、`grid-projection-compat`（iso golden 與 Flat C golden 未改） | 通過 |
| `tests/build-consistency.test.js`（V0.57.0-alpha／0570a） | 通過 |
| `npm run check:deploy` | 通過（Build 0570a、51 JavaScript modules） |
| `npm run check:dev`（含真實 Chrome browser smoke，含 ortho／ortho-demo boot、invalid 回退） | 通過 |
| 真實瀏覽器截圖（桌面＋390／393／430；ortho existing／demo／artDebug；Flat A/B/C 參照） | 13 張、零 page error（見 §8） |

Orthogonal math 測試涵蓋：`axisX.y===0`、`axisY.x===0`、determinant 非零、可逆、原點/中央/四邊/四角/房間外皆有限值、相鄰 cell 共用水平或垂直邊、所有 cell 為矩形且頂點順序固定、room bounds 落在 world bounds。Footprint 涵蓋 1×1／2×1／1×2／2×2／3×2、rotation 0–3，邏輯 cells 與 iso 相同、polygon 為軸對齊矩形、anchor 規則正確。資料相容：Occupancy／Placement／footprint 在 iso 與 ortho 完全一致；SaveAdapter 輸出不含 projection／demoLayout。

---

## 8. 真實瀏覽器證據

`docs/evidence/v0570/`（真實 Chrome、HTTP、每張 gameReady、page error 0、清空 localStorage 後同一份預設配置、固定沉澱、記錄 mode/demo/entities/camera）：

| 檔案 | 內容 |
|---|---|
| `desktop-iso.png` / `mobile-390-iso.png` | iso 對照 |
| `desktop-flat-c.png` / `mobile-390-flat-{a,b,c}.png` | 已拒絕的 Flat 對照 |
| `desktop-ortho-existing-layout.png` / `mobile-390-ortho-existing-layout.png` | Orthogonal + 既有存檔布局 |
| `desktop-ortho-demo-layout.png` / `mobile-390/393/430-ortho-demo-layout.png` | Orthogonal + Demo 構圖 |
| `mobile-390-ortho-demo-artdebug.png` | Orthogonal Demo + Art Debug（矩形 footprint 對齊 cell） |

觀察：地板為真正水平／垂直矩形棋盤，後牆水平、左右邊界垂直、房間不歪斜、無斜放黑區；手機直立能由上而下讀到服務→座位→貓咪。等角家具 sprite 在平地板上透視偏斜（Placeholder，已知）。Demo 三個手機 viewport 的初始 Camera 相同（例 430：zoom 1、scroll 565/168）。

---

## 9. 存檔與受保護契約

- `CURRENT_KEY = catCafePhaserV0540`（不變）；`sceneSchemaVersion` 5401、`migrationCompletedVersion` 5401（不變）。
- furniture ID／`x/y/r`／footprint 未改；Occupancy／Placement／Pathfinding 未改。
- **Projection 不入存檔、demoLayout 不入存檔**（real-browser 驗證存檔無這些欄位）。
- 受保護 hash：`GridSystem`（更新）、`projection-mode`（更新，加入 ortho）、`flat-projection-presets`（query 升版）更新；**新增 `OrthogonalProjection`**；`FlatProjection`／`IsoProjection`／`SpatialGrid`／`room-config`／`furniture-config` hash **未變**。未弱化任何既有 protected hash。

---

## 10. LF／Git

- 根目錄 `.gitattributes` 保留（文字檔 LF、binary 規則）；未改全域 Git 設定、未 `git config --global`。
- 本環境**無 `.git`**：未 `git init`、未 commit、未 push、未部署。
- `check.js` 持續驗證必要 LF／版本／protected hash／obsolete query（新增禁止 `?v=0561a`）。

---

## 11. 已知問題（僅列實際）

- **Orthogonal room**：上方牆面帶較薄，桌面時部分被 HUD 邊緣接近（服務家具仍可見、未被完全遮住）。屬原型可接受，未來 HUD／牆面可再調。
- **Furniture placeholder**：等角 sprite 在正交地板透視不合（衣櫃／桌椅／高型家具最明顯），接地點正確但視覺偏斜——**待 `ART-0571` 重作**，本版刻意不校準。
- **Drag**：ortho 拖曳走 `grid.worldToGrid`（Facade），觸控 36px 螢幕偏移為通用值（非 iso-specific），沿用；未見 ortho 特有偏移問題。
- **Camera**：沿用單一 `CameraController`；手機直立因固定 landscape world（1560×1120）只顯示中央垂直帶，需左右 pan 看邊緣座位（垂直層級完整可讀）。未硬編碼任何 viewport scroll。
- **Mobile**：390／393／430 主要營業區可讀；上方服務區接近 HUD、下方家具接近操作列但未被完全遮住。
- **Art**：Placeholder 透視；Art Debug 文字可重疊（開發工具）。
- **Browser**：桌面 Chrome headless 已驗；iPhone Safari／Android Chrome 實機**pending**。
- **Save**：未見問題；projection／demoLayout 皆不入存檔。

---

## 12. 回復方式

- 回到 iso：移除網址 `?projection=...`（或用 `?projection=iso`）；**預設本來就是 iso**。
- 關閉 demo：移除 `&demoLayout=1`；demo 從不寫存檔，無需還原資料。
- 需移除的新檔案（若要完全回退本版）：`assets/js/systems/OrthogonalProjection.js`、`assets/js/config/ortho-demo-layout.js`、`tests/ortho-projection.test.js`、`tests/ortho-demo-layout.test.js`、`docs/V0570_*`、`docs/evidence/v0570/`。
- 需還原的檔案：`GridSystem.js`（移除 ortho 分支）、`CafeScene.js`（移除 ortho import／`drawRoomOrtho`／demo 接線）、`core/projection-mode.js`（移除 ortho）、`check.js`（移回 0561a pins／hash／required／tests）、版本檔案（0570a→0561a、V0.57.0→V0.56.1）。
- `check.js` 回復：還原 protected hash、required、tests、版本 pin 與 obsolete 清單。
- **不涉及存檔回復**：存檔 key／schema／內容全程未改。

---

## 13. 誠實聲明（未完成）

- **Orthogonal 尚未成為正式預設**，等產品負責人視覺驗收。
- 未做正式家具重作／逐件校準／重畫；未新增 EconomySystem／StationRegistry／CustomerFlowSystem／OrderSystem／ActorTaskSystem／店長／店員／招募／反應系統／貓咪新行為；未重製 HUD；未新增玩家可見 Projection 切換按鈕。
- 手機實機（iPhone Safari／Android Chrome）人工驗收 pending；本版證據為桌面 Chrome headless。
- 未 commit／push／部署；本環境無 `.git`。
