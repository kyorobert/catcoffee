# V0.57.6-alpha｜正交可玩區與房間 Skin 基礎版

- Task ID：`ARCH-0575C-ORTHOGONAL-PLAYABLE-AREA-AND-ROOM-SKIN-FOUNDATION`
- Build：`0576a`
- 基線：`V0.57.5-alpha / 0575b`
- 日期：2026-07-26
- 狀態：實作完成；Chrome 自動化通過；iPhone 實機仍需產品端驗收

## 1. 問題根因

V0575B 為消除手機首屏外圈留白，把 Grid 外的視覺外殼延伸到 safe viewport，但外殼使用與正常地板非常接近的淺色 `floorFill`。因此玩家看到的「地板」大於真正的 10×8 logical grid；視覺上像空地，放置時卻正確回報 out-of-bounds。這不是第二套 Placement 規則，而是顯示層錯誤承諾可玩範圍。

同時，牆、護牆板、地板 palette、門和裝飾 anchor 全部集中在 `OrthogonalProjection.js` 的 render metadata，讓投影幾何與房間美術耦合，不利於後續換 Skin。

## 2. 可玩區與視覺外殼

- `placeableMask` 維持唯一真相：10×8 logical grid 中 78 格可放置，舊入口 `(8,7)/(9,7)` 兩格保留。
- 可放置格才套用 zone floor palette。
- 保留格改用明確門檻／固定區材質，不再使用一般地板色。
- Grid 外 shell 改為 `role: fixed-architecture` 的深木固定建築帶，含 inset panel、深色 trim 與 highlight。
- shell 仍保持 V0575B 的 `side:84 / top:120 / bottom:132` 滿版範圍，不新增 cell、不改 Camera bounds。
- 可玩 10×8 邊界使用雙層細收邊；正式模式仍不顯示全場 placement grid。

## 3. Room Skin 基礎

新增 `assets/js/config/ortho-room-skin.js`：

- `layout`：wall height、core top strip、bottom pad。
- `wall`：upper wall、wainscot、molding、panel line。
- `floor`：zone palette、cell line、reserved treatment、playable boundary。
- `shell`：固定建築帶尺寸、色彩、panel、trim。
- `door`：visual grid bounds、門高、casing、lintel、玻璃、門板、把手、咖啡廳小招牌、threshold。
- `decorAnchors`：牆窗與菜單板的位置、scale 與 texture slot。
- `getOrthogonalCellAppearance()`：由 Scene 傳入 `GridSystem.isPlaceableCell()` 結果，避免視覺自行發明 mask。

`OrthogonalProjection.js` 現在只保留 axis/origin、grid/world 轉換、cell polygon、footprint polygon 與 anchor。

## 4. 門與牆面

門的 visual geometry 從 `ortho-room-zones.js` 移至 Room Skin；logical entrance zone、entry point、staging 仍留在 zones。門增加 casing、lintel、咖啡廳小招牌、玻璃分格、下門板與窄 threshold。原先填滿整格的 entry mat 改成窄 threshold，避免暗示整個 top cell 有不同放置規則。

牆面增加低頻 wainscot panel division；裝飾仍使用本地 `wall-window` 與 `menu-board`，由 Skin anchor slots 建立。

## 5. Placement 預覽／提交一致性

`FurnitureDragController` 新增：

- `candidateSignature()`：type/x/y/r/movingItemId。
- `evaluateCandidate()`：同時產生 footprint cells、polygon 與 validation result。
- `renderPlacementVisuals()` 使用此 evaluation 畫紅綠提示。
- `finish()` 對未變更 candidate 使用同一 cached evaluation；candidate 改變時 signature 不符，必須重新驗證。

PlacementSystem、OccupancySystem、GridSystem 與 placeableMask 沒有第二份實作，也沒有更改。

## 6. 回歸保護

新增 `tests/ortho-playable-area-skin.test.js`：

- 逐格驗證 visual kind 與 live placeable mask 一致。
- shell 必須是 `fixed-architecture` 且亮度與所有 playable floor palette 明顯分離。
- 1×1、1×2、2×2 在上／左／右／下邊界的合法與非法案例。
- shell 世界點 snap 到 Grid 外並回報 out-of-bounds。
- reserved entrance 案例。
- door geometry 與 decor slots 由 Skin 擁有。
- Projection 不得持有 Skin tokens；Skin 不依賴 Phaser/DOM/storage。

`tests/furniture-drag.test.js` 新增 preview/commit 共用 evaluation，以及 candidate 變更必須失效重驗的案例。

## 7. 未修改契約

- Phaser：3.90.0，本地載入。
- Save key：`catCafePhaserV0540`。
- schema/migration：未改。
- furniture ID、`x/y/r`、footprint：未改。
- ROOM_CONFIG、placeableMask、GridSystem 幾何、OccupancySystem、PlacementSystem：未改。
- CameraController 的 zoom/pan/clamp 行為：未改；只有 build query 機械更新。
- iso / Flat C：golden tests 不變。
- ART-0576 家具重畫：未開始。

## 8. 證據

- `docs/evidence/v0576/after-390x844-ortho-demo.png`
- `docs/evidence/v0576/after-393x852-ortho-demo.png`
- `docs/evidence/v0576/after-430x932-ortho-demo.png`
- `docs/evidence/v0576/after-390x844-zoomin-pan.png`
- `docs/evidence/v0576/after-390x844-pan-left.png`
- `docs/evidence/v0576/after-390x844-pan-right.png`
- `docs/evidence/v0576/after-390x844-pan-top.png`
- `docs/evidence/v0576/after-390x844-pan-bottom.png`
- `docs/evidence/v0576/after-1366x768-ortho-demo-artdebug.png`
- `docs/evidence/v0576/metrics.json`

V0575B before：`docs/evidence/v0575b/mobile-390-v0575b-after.png`。
