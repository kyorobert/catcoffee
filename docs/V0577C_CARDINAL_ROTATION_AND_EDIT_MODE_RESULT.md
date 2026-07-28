# V0577C 結果：正交 90° 旋轉、cardinal 方位與家具編輯修正

- Task：`ARCH-0577C-ORTHOGONAL-CARDINAL-ROTATION-AND-EDIT-MODE`
- 版本：`V0.57.7-alpha｜正交90度旋轉與家具編輯修正版`，Build `0577c`（package 維持 `0.57.7-alpha`）
- 前置稽核：[V0577C 旋轉架構稽核](./V0577C_CARDINAL_ROTATION_ARCHITECTURE_AUDIT.md)（判定 GREEN、未觸發 §21 STOP）
- 決策：[DEC-028](./decisions.md)（取代 DEC-027 固定視覺 pivot）

## 交付內容

### Goal A｜正交 cardinal 90° 旋轉核心
- 新增單一純資料 resolver `assets/js/core/orthogonal-furniture-rotation.js`：`resolveOrthogonalRotationPlacement()` 回傳 `resolvedX/Y/Rotation、footprintCells、footprintPolygon、logicalPivot、visualPosition、cardinalDirection、textureDirection、signature、safelyRepresentable`。
- `getFurnitureVisualPosition()`（`furniture-display-state.js`）ortho 分支改為委派 resolver → **Sprite/Ghost 世界位置＝實際旋轉 footprint 的 gameplay anchor**，與 Occupancy／Placement／紅綠框同源。移除 DEC-027 的 `base-rotation` 固定 pivot。
- 退場 `orthogonal-furniture-visuals.js` 的 `calibration`（改為 `null`）。
- 旋轉為誠實 corner-pivot：左上角 `(x,y)` 不動、奇數旋轉交換寬高。非方形（2×1／1×2／3×2）單次 90° 會移動（正確），`r0==r2`、`r1==r3`，4× 精確歸位、零漂移。

### Goal B｜cardinal 方位語意
- `ORTHOGONAL_CARDINAL_DIRECTION_MAP = {0:'south',1:'west',2:'north',3:'east'}`，旋向順時針（`r+1`），測試鎖定、版本內不可逆。
- cardinal→既有貼圖 key 對照（south→down-right、west→down-left、north→up-left、east→up-right）重用 48 張 authored PNG，**不重畫**。
- iso／flat 的 `rotationToDirection`／texture／golden／save 對應完全未動。

### Goal C｜家具編輯模式
- `#selectionBar` 由浮在 Canvas 上移入 `#gameBottomBar`；以 `data-mode="edit"` **就地替換**底部主導覽列（`.bottom-nav` 5 鍵），非第二層浮動列。
- 同容器等高切換（編輯鈕沿用 50px nav 高）→ viewport 不縮放、相機不跳。編輯鈕 ≥44×44、`safe-area-inset-bottom` 由底列 padding 保留。
- `UiBridge.renderSelection()` 切 `data-mode`；取消（`#cancelPlacementBtn`→`cancelDrag`）或取消選取即還原主導覽列。
- `viewport-metrics.js`（受保護檔）未改：`#selectionBar` 現為底列子元素、nav 模式時 `.hidden` 被跳過，不產生額外相機保留。

### Art Debug 可讀性
- `artDebug=1` 只畫幾何（sprite bounds、footprint cells、logical pivot 紫圈、visual pivot 紅點）＋單行短標籤（`type#idsuffix rN·方位`）。
- 完整 metadata（resolved x/y/r＋方位、logical/visual pivot、bounds、footprint、texture）只在 `artDebugFocus=<id|type>` 或選取的家具顯示；socket 點亦只在 focus 顯示。
- 唯讀、不寫存檔、不攔截指標；沿用同一 resolver 結果。

## 不變契約（已驗證）
家具 ID／price／footprint／entrance `(7,0)(8,0)`／10×8 Grid／78 placeable cells／`x/y/r` 語意／save key `catCafePhaserV0540`／schema 5401／migration 5402／CameraController 核心／iso・flat base visual／受保護 hash 檔（GridSystem／SpatialGrid／OrthogonalProjection／Occupancy／Placement／CameraController／viewport-metrics 等）全部未改。

## 測試與 Gate
- 新增 `tests/orthogonal-rotation-resolver.test.js`（cardinal 鎖定、resolver-shared、4×與40× 零漂移、x/y 不因旋轉改變、1×1/2×1/1×2/2×2/3×2 誠實位移）；註冊於 `check.js` required／tests／purity 與 `package.json`（`test:ortho-rotation`）。
- 更新 `orthogonal-furniture-visuals.test.js`：退場 `base-rotation` calibration、visual==gameplay anchor、`r0==r2`/`r1==r3` round-trip、非方形誠實位移。
- 更新 `browser-smoke.test.js`：ortho-demo round-trip 改為 `r0==r2`/`r1==r3`；toolbar rotation 改為**真實點擊 `#rotateBtn`** 四次驗證 sprite 貼齊 gameplay anchor＋零漂移歸位；新增編輯模式「就地替換底列、取消後還原」覆蓋；fixture build-id 與 htmlBuildId/jsBuildId 升 0577c。
- 全套 `npm test`＋各 furniture/ortho/entrance/drag/footprint/direction＋`check:deploy`＋`check:dev`（含 real-Chrome browser smoke）GREEN。
- 版本：`?v=0577c`、obsolete ban `?v=0577b`、import 一致性 `?v=0577c`；`ORTHOGONAL_FURNITURE_ASSET_VERSION='0577c'`。

## 未測 / 保留
- **iPhone Safari 實機驗收（旋轉、編輯模式底列、位址列收合、safe-area）仍 pending，保留給產品負責人勾選**；本工不代勾。
- 證據：`docs/evidence/v0577c/`＋`metrics.json`（見[驗收](./V0577C_CARDINAL_ROTATION_AND_EDIT_MODE_ACCEPTANCE.md)）。

## 後續（未在本卡執行）
- `ART-0577D`：cardinal 家具重繪與連接稿（[brief](./ART-0577D_CARDINAL_FURNITURE_REDRAW_AND_CONNECTION_BRIEF.md)）。
- `ARCH-0578`：貓咪移動與家具互動（[brief](./ARCH-0578_CAT_MOVEMENT_AND_FURNITURE_INTERACTION_BRIEF.md)）。
