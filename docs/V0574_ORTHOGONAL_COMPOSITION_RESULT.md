# V0.57.4-alpha 正交營業區聚焦構圖與分區辨識 結果（ARCH-0574）

- 版本：`V0.57.4-alpha｜正交營業區聚焦分區版`｜Build `0574a`（由 `0573a` 升版）
- 存檔契約：key `catCafePhaserV0540`、schema `5401`、migration `5401` **皆不變**
- 決策依據：[DEC-021](./decisions.md#dec-021正交營業區聚焦構圖與分區辨識accepted)（延續 DEC-017～DEC-020）
- 證據：`docs/evidence/v0574/`（15 張 real-browser 截圖 + before/after vs V0573）
- **本任務是構圖與分區辨識精修，不是家具重畫（`ART-0574`）。**

## 1. 產品回饋（最高優先）與對應

| # | 回饋 | 本版對應 |
|---|---|---|
| 1 | 門的位置大致可以 | 保留 x7-8 兩格門（不動） |
| 2 | 周遭留白仍太多、浪費空間 | 縮短背牆、加密 Demo、分區底色填滿視覺 |
| 3 | 看不出上方是否為連續服務區 | 設備帶(y0)＋櫃檯(y2) 各連續覆蓋 x1-6，無縫 |
| 4 | 看不出顧客側／員工側之分 | 櫃檯(y2)為分界；工作側(y0-1)與服務側(y3)不同底色 |
| 5 | 看不出座位是否成組 | 兩組桌椅各在地毯上成組(x1-2、x4-5)，中留走道 |
| 6 | 看不出貓咪區是否集中 | 貓咪家具集中前左角＋貓地毯，貓咪區底色（玫瑰）獨立 |

## 2. 根因與策略（誠實說明）

首屏「留白」有三個來源：(a) 過高的上方牆面；(b) 家具稀疏的空地板；(c) 分區沒有視覺區別，整間像空教室。

幾何事實：門在 x7-8，首屏 core 必含 x8，故取景寬度被鎖在 x1-8 → **fit zoom 固定 ~0.526，無法在不裁掉門的前提下再放大單件家具**（narrower core 會裁掉門）。因此本版**不是靠放大縮放**，而是三管齊下：**縮短牆面**（去 a）、**加密並清楚成組的 Demo**（去 b）、**分區地板底色**（去 c）。

## 3. A. 首屏聚焦 + 牆面縮短

- `ORTHOGONAL_ROOM_RENDER`：`wallHeight 200→155`、`coreTopStrip 140→118`、`doorHeight 130→112`。上方空牆顯著變薄、門周邊不再有大片空區，讀作「整齊服務背牆」。
- 首屏仍 core（x1-8）滿版；zoom-out 仍可看整房、無空背景。

### 實測（safe gameplay viewport = canvas 高 − 78）

| 視窗 | 首屏 zoom | minZoom(整房) | 核心縱向占 safe | 左右每側裁切 |
|---|---|---|---|---|
| 390×844 | 0.526 | 0.420 | **94%** | ~8% |
| 393×852 | 0.530 | 0.424 | **93%** | ~8% |
| 430×932 | 0.582 | 0.466 | **91%** | ~8% |
| 1440×812（桌面） | 0.501 | 0.485 | 97% | 0% |

皆 ≥ 90%（較 V0573 的 96/95/93% 略降，因牆變薄；換得更少空牆），裁切每側 ≤ 10%。zoom-out 至整房占比 ~75%、0 裁切。

## 4. C. 分區地板底色（一眼可辨的關鍵）

新增 `ortho-room-zones.zoneAt(x,y)`（純格邏輯）＋ `ORTHOGONAL_ROOM_RENDER.zoneFloor`（暖色底色）。`drawRoomOrtho` 依 `zoneAt` 為每格上分區底色（逐格二階明暗保留質感）。x1-6 功能帶與 x7-8 走道各有可辨底色：

| zone | 位置 | 底色語意 |
|---|---|---|
| work | x1-6 y0-1 | 工作側（櫃檯後、較深暖棕） |
| counter | x1-6 y2 | 櫃檯帶（木色） |
| service | x1-6 y3 | 顧客點餐前廳（亮奶油） |
| seating | x1-6 y4-5 | 用餐區（暖棕黃） |
| cat | x1-6 y6-7 | 貓咪區（玫瑰） |
| aisle | x7-8 | 主走道（中性米） |

（zone key 由 `staff` 更名為身份中性的 `work`，維持 `OrthogonalProjection` 無 actor 身份的 purity。）

## 5. 分區收斂為乾淨分割

`ortho-room-zones` 將 `customerServiceZone`／`seatingZone`／`catZone` 收斂為 **x1-6**（與 x7-8 走道不重疊），成為每格單一 zone 的乾淨分割（`zoneAt` 核心 64 格：work 12／counter 6／service 6／seating 12／cat 12／aisle 16）。三層服務（設備帶＋工作側 / 櫃檯 / 顧客服務）仍堆疊不重疊。

## 6. C. Demo 依分區重排（23 件，display-only，密度 ~48%）

`門(x7-8)→主走道→連續設備帶/櫃檯→顧客前廳→兩組座位→集中貓咪角`。

- **連續設備帶**(staffWorkZone y0, x1-6)：coffeeMachine/oven/washStation/dessert/bookshelf，無縫覆蓋 x1-6。
- **連續櫃檯**(serviceCounterLine y2, x1-6)：counter/console/counter，無縫覆蓋 x1-6（工作側 vs 顧客側分界）。
- **顧客前廳**(y3)：開放排隊走道 + 左角自助點餐機（smartOrder）。
- **座位兩組**：A(x1-2 woodTable+椅+rugStripe)、B(x4-5 roundTable+椅+rugStripe)，中間 x3、右側 x6 為走道。
- **集中貓咪角**(catZone x1-4)：doubleCatTree/catCastle/scratchPost/pawRug + creamSofa 貓休憩沙發。

Node 驗證：23 件全部合法無重疊；入口→服務/座位/貓咪皆可達；顧客動線不穿越工作側；工作側內部連續；主走道 12/12 全通；設備帶與櫃檯各連續覆蓋 x1-6 無縫。仍不入存檔、不改 `state.items`/coins。地板占用 ~28%(V0573)→~48%。

## 7. 修改檔案

- **改**：`config/ortho-room-zones.js`（分區收斂 x1-6＋`zoneAt`/`ORTHO_ZONE_KEYS`）、`systems/OrthogonalProjection.js`（縮短牆＋`zoneFloor`）、`scenes/CafeScene.js`（`drawRoomOrtho` 分區底色＋`shadeColor`）、`config/ortho-demo-layout.js`（23 件重排）。
- **測試更新**：`ortho-room-zones`（zoneAt 乾淨分割）、`ortho-demo-layout`（23 件/連續帶/成組/動線）、`camera-framing`（新 wall/strip 幾何）、`ortho-projection`（身份中性）、`build-consistency`（版本字串）。
- **版本**：0573a→0574a 全域 `?v=` 與 build 字串；`check.js` 版本/Build/obsolete `?v=0573a`/protected hash（OrthogonalProjection/ortho-room-zones/GridSystem/flat-presets/viewport-metrics 更新）。
- **未改**：投影軸向（水平/垂直、無 skew/shear/rotation）、cell 尺寸、家具美術、存檔 key/schema、iso/flat 分支、第二套 CameraController（無）、`camera-framing`/`scene-viewport`/`SpatialGrid`/`room-config`/`furniture-config`/`projection-mode` hash。

## 8. 驗證

- `node check.js --deploy`：通過（Build `0574a`、35 DOM IDs、13 nested selectors、55 modules）。
- `node check.js --dev`：通過（含**本機真實 Chrome** browser smoke：ortho 首屏核心可見/外圈裁切/可 zoom-out 整房/demo boot/invalid 回退）。
- 個別：`ortho-room-zones`(zoneAt 分割 64 格)、`ortho-demo-layout`(23 件/連續帶/成組)、`camera-framing`(94/93/91% fill)、`ortho-projection`、`grid-projection-compat`(iso/Flat golden 未改) 皆通過。
- 15 張 real-browser 證據 + before/after 零 page error。

## 9. 誠實判斷（是否達成產品目標）

- **達成**：#1 門保留；#3 連續服務區（設備+櫃檯無縫）；#4 工作側/顧客側（櫃檯分界+底色）；#5 座位成組（兩組地毯）；#6 貓咪集中（前左角+玫瑰底色）；#2 留白（縮牆+密度 28→48%+底色）明顯改善。
- **有限度/需實機確認**：單件家具尺寸與 V0573 相同（受門+cell 幾何鎖定，非本版能放大；若產品要更大單件，需另議裁門或改 cell，本次未做）；分區底色差異在小螢幕可能偏微妙，實機可再調飽和度；家具仍為等角 Placeholder（正交透視待 `ART-0574`）。
- **結論**：本版**應可通過**「營業區聚焦與分區辨識」目標；最終以 iPhone 實機驗收為準（見驗收清單）。

## 10. 已知限制／未完成

- 家具仍等角 Placeholder（`ART-0574` 未做）；三層服務與分區僅空間/視覺，無收銀/製作/送餐/排隊行為（待 `ARCH-0575-STATION-REGISTRY`）。
- 桌面左右仍有邊距（手機優先）。
- **手機實機驗收 pending**（見 [驗收清單](./V0574_ORTHOGONAL_COMPOSITION_ACCEPTANCE.md)）；未 commit/push/部署；本環境無 `.git`。
- iso 仍為預設與 rollback。
