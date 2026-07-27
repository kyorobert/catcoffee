# V0577B 第一批家具旋轉與方向校準結果

## 1. 範圍

- Task：`ART-0577B-FIRST-BATCH-ROTATION-AND-DIRECTION-CALIBRATION`
- 版本／Build：`V0.57.7-alpha｜第一批家具旋轉與方向校正版`／`0577b`
- 僅處理 ART-0577 第一批 12 件的旋轉視覺 pivot、木椅四方向與
  「貓咪 × 家具」後續稽核。
- 未開始其餘 35 件、未改 Camera、Grid、玩法 footprint、SaveAdapter 或貓咪 Runtime。

## 2. 旋轉跳動根因

家具資料的 `x/y` 是 footprint 基準格。`GridSystem.getAnchor()` 正確地依旋轉後
footprint 取底邊中心；但 `FurnitureEntity` 與 drag ghost 又直接把該點當作 sprite
視覺 pivot。對 1×1 沒有差異，對 2×1／1×2 則會在偶數與奇數方向切換到不同 world
point。結果是資料格沒有變，玩家卻看到 sprite 大幅左右／上下跳動。

48 張 ART-0577 PNG 都使用等尺寸方向 canvas、共同底部 padding 與底部置中，
因此問題不是 Phaser trim、texture display size 或透明邊距；`rotateSelection()`
也沒有重新安排 `x/y`。根因是「旋轉後的 gameplay footprint anchor」同時被誤當成
「應穩定的視覺旋轉 pivot」。

## 3. 修正

- `orthogonal-furniture-visuals.js` 為 12 件 override 集中加入：
  `calibration.rotationAnchor = "base-rotation"`、`baseRotation = 0` 與方向 nudge。
- `getFurnitureVisualPosition()` 是唯一視覺位置 resolver；以同一 Grid anchor 為來源，
  不複製投影公式。
- `FurnitureEntity` constructor／sync、`FurnitureDragController` ghost／sync／
  pointer snapping 都改用該 resolver。
- 方向 texture、visual origin、scale 與 rotation mapping 保持由既有 selector 管理。
- gameplay footprint、紅綠 polygon、Occupancy、Placement 與 commit 仍依真實 `r`
  計算；未改 furniture `x/y/r`。

已校準 12 件：`counter`、`coffeeMachine`、`oven`、`washStation`、`dessert`、
`smartOrder`、`pinkTableLong`、`roundTable`、`chair`、`creamSofa`、
`doubleCatTree`、`scratchPost`。其中非正方形的餐桌、吧台、洗滌台、沙發與雙層
貓跳台是本次跳動修正的主要受益者；1×1 仍走相同管線作回歸。

## 4. 木椅四方向

舊來源的 top-left／top-right 是近乎同一張正面，bottom-left／bottom-right 是近乎
同一張背面。新來源保留暖木、奶油坐墊、貓耳椅背與貓頭鏤空，改成四個真實 3/4
方向。左右方向可從椅背厚度、坐墊透視、近／遠腳和橫桿位置辨識；前／後方向也有
獨立 silhouette。

Runtime 契約維持：

- 路徑：`assets/furniture/orthogonal/chair/chair-{direction}.png`
- 92×126 RGBA、透明角落、共同接地 baseline
- `down-right`、`down-left`、`up-right`、`up-left` 四張
- 生成／透明化工具保留於 `tools/calibrate-v0577b-chair.py`，部署不依賴且不打包 tools

## 5. 貓咪 × 家具不匹配稽核（本卡只分析）

### 比例

- 貓咪 frame 為 64×64、scale 1；第一批椅子可見高度約 114 px、雙人家具寬約
  170–180 px。貓咪身高約為椅子的四至五成，單看比例可接受。
- 問題主要不是全局 scale，而是家具已是明確 3/4 量體，貓咪仍只以 cell center
  和 up/down 動畫活動，缺少靠近家具時的姿態／接觸基準。

### 空間與站位

- `CatBehaviorController` 只從 placeable、未被 floorObject 阻擋的格選漫遊目標。
  家具只被視為不可穿越 footprint，沒有「靠近哪一側」的 approach point。
- 貓咪停在 cell center；椅面、沙發坐墊、貓跳台平台和抓柱周圍都沒有可用高度、
  facing、接觸 offset 或 reservation。
- `DepthSystem` 可依腳底排序，但無法表達「坐在椅面／窩內／跳台平台上」的局部
  depth 與 attachment，所以視覺上只是在家具旁走過。

### 缺少的互動節點

- 可達 approach socket：從哪一格、朝哪個方向接近。
- use/rest/play socket：目標 world anchor、角色 facing、角色 animation/state。
- 容量與 reservation：避免多貓長期占同一椅／窩／平台。
- 家具狀態：空閒、保留、使用中、冷卻；布局改變時安全取消。
- 角色 attachment：互動期間使用家具局部 anchor／depth，結束後回到合法 walk cell。
- 規則層 selector：依個性／需求挑互動，而不是把 Phaser Sprite 寫進家具資料。

### 建議下一卡

`ARCH-0578-CAT-FURNITURE-INTERACTION-AUDIT`

下一卡應先定義 socket schema、可達性、reservation、狀態機、取消／布局變更、存檔
邊界與 3～4 個代表家具 fixture，再決定是否進 Runtime。本卡**沒有**實作坐椅、
上桌、窩睡、跳台、完整移動動畫或新的存檔欄位。

## 6. 不變契約與限制

- iso／flat／非法 projection 繼續使用 base visual；ortho 仍 URL opt-in。
- Save key `catCafePhaserV0540`、schema 5401、migration 5402 不變。
- 10×8 Grid、78 playable cells、入口 `(7,0)/(8,0)`、CameraController 行為不變。
- iPhone Safari 真機仍 pending；Chrome／Edge 自動化不能替代真機。
- 其餘 35 件仍為 base visual，第二批未核准。
