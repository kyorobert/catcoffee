# V0.57.5-alpha 正交滿版取景、Zoom/Pan 修正與分區視覺清理 結果（ARCH-0575）

- 版本：`V0.57.5-alpha｜正交滿版操作修正版`｜Build `0575a`（由 `0574a` 升版）
- 存檔契約：key `catCafePhaserV0540`、schema `5401`、migration `5401` **皆不變**
- 決策依據：[DEC-022](./decisions.md#dec-022正交滿版取景zoompan-修正與分區視覺清理accepted)（延續 DEC-017～DEC-021）
- 證據：`docs/evidence/v0575/`（16 張 real-browser 截圖 + `metrics.json` 每張指標）
- **本任務修 zoom/pan、滿版與分區視覺，不重畫家具。**

## 1. V0574 三項實機問題與根因

| # | 實機問題 | 根因（已稽核） |
|---|---|---|
| 2（P0） | 放大後無法左右上下平移（有 zoom 沒 pan） | 互動平移直接位移 `camera.scrollX/Y`，但 clamp 以 **`camera.midPoint`** 重算中心再 `centerOn` 回去；Phaser 的 `midPoint` 只在 `preRender` 更新，位移當下讀到**過期值**，等於把剛平移量歸零 → pan 死掉。自動化證據當時用 `centerOn`（會同步更新 midPoint）故未暴露。 |
| 3 | 左右不明深色直條 | `zoneFloor.outer`（x0/x9 外圈）用了暗色 `0x7f6549`，整欄壓暗，被理解為陰影／禁區。 |
| 1 | 四周留白太多、像展示卡片 | 門固定 x7-8 使首屏取景**寬度受限**（width-constrained），房高只填約 87% canvas；情境列保留 78px 在無選取時全變上下留白；牆太矮（空白）＋房外背景對比高。 |

## 2. P0：Zoom/Pan 修正（根因，非放寬 magic number）

- **修正**：`CameraController` 的 clamp 改由**即時 `scrollX + width/2`** 推導視圖中心（新 `viewCentre()`），不再讀過期的 `camera.midPoint`。因此互動平移後 clamp 只在超出 `roomBounds` 時才夾回、範圍內保留平移量。
- clamp 依當前 zoom 與 view（`width/zoom`、`height/zoom`）重算：房間 > view 的軸向允許平移到房間邊界；房間 < view 的軸向鎖定置中。pan/pinch/wheel/resize 後皆重 clamp。未建立第二套 CameraController。

### real-browser 驗證（真實指標拖曳，`docs/evidence/v0575/metrics.json`）

| 狀態 | zoom | X pan range | Y pan range | 拖曳後 scrollX |
|---|---|---|---|---|
| 首屏 390 | 0.531 | 78px | 0（整高可見） | — |
| zoom-in 1.35 pan-left | 1.35 | 798px | 983px | 289 |
| zoom-in 1.35 pan-right | 1.35 | 798px | 983px | **880** |

zoom-in 後左/右拖曳 scrollX 由 289→880（差 591px）、上/下拖曳 scrollY 亦變動；四邊到房間邊界正確 clamp；minZoom 可見整房並置中。browser-smoke 以**真實指標拖曳**斷言 X/Y pan 後 scroll 皆改變、可 pan 回、且到界 clamp。

## 3. 左右深色直條清除

- `zoneFloor.outer`（x0/x9）改為**中性淺色地板** `0xe7c295`；所有 zone tint 改為**低對比淺暖色**（work/counter/service/seating/cat/aisle/outer 皆淺，luminance 皆 >150），不像陰影／禁區。
- `zoneAt()` 對未知 key 回退 `outer`（中性）；外圈為可行走／可擺放的真實地板。
- browser-smoke 於 minZoom 取樣空的 x0/x9 地板 cell 實際像素，斷言為淺色（非暗帶）。

## 4. 顯著減少四周留白（誠實說明幾何限制）

門固定 x7-8＋cell 88×120 → 首屏 **width-constrained**，房高只填約 87% canvas，**無法在不裁門下 100% 填滿高度**。本版在不裁門與關鍵區前提下三管齊下：

- `marginCss` 10→8；`toolbarReserveCss` **78→40**（首屏無選取時整條保留是浪費、變上下留白；情境列僅選取時短暫覆蓋，可平移）。
- **背牆做成真實有家具的較高背牆**：`wallHeight 155→260`、`coreTopStrip 138→220`、`doorHeight 118→168`，加 **wainscot 護牆板＋molding 線**＋牆飾＋門，填滿上方而非空白牆。
- 房外背景 `backdropFill 0xbfa079`（近地板暖色），避免「卡片墊底」。

### 首屏上下留白（safe viewport 內 backdrop，CSS px）

| 視窗 | V0574 實測 | **V0575** | zoom |
|---|---|---|---|
| 390×844 | ~44px | **18px** | 0.531 |
| 393×852 | ~44px | **19px** | 0.536 |
| 430×932 | ~44px | **26px** | 0.588 |
| 1440×900（桌面） | — | 16/17px（左右邊距為手機優先） | 0.566 |

門完整可見於首屏；可 zoom-out 看整房；zoom-in 可 pan 看被裁外圈。cellWidth/cellHeight 88×120 不變。

## 5. 分區視覺（沿用 V0574 成組 Demo）

分區底色改為低飽和淺色 hint（輔助）；辨識主要靠家具：上方**連續服務帶**（設備 x1-6＋櫃檯 x1-6）、**兩組座位**（各在地毯上）、**集中貓咪角**（前左）、右側主走道。Demo 沿用 V0574 的 23 件（未改）。

## 6. 修改檔案

- `systems/CameraController.js`：新增 `viewCentre()`、clamp 改用即時 scrollX（P0 pan 修正）。
- `core/camera-framing.js`：`marginCss 10→8`、`toolbarReserveCss 78→40`。
- `systems/OrthogonalProjection.js`：`ORTHOGONAL_ROOM_RENDER` 加高 wall/door/strip、`zoneFloor` 中性低對比、新增 `backdropFill`／`wainscot`。
- `scenes/CafeScene.js`：`drawRoomOrtho` 背景改 `backdropFill`＋畫 wainscot/molding、floor 依 zoneAt 上中性淺色。
- 測試：`camera-framing`（pan range>0 兩軸／view>room 鎖中心）、`ortho-projection`（zoneFloor 無暗帶）、`browser-smoke`（真實拖曳 pan＋x0/x9 非暗）、`build-consistency`（版本）。
- 版本：0574a→0575a 全域＋`check.js`（版本/Build/obsolete `?v=0574a`/protected hash：OrthogonalProjection/camera-framing/GridSystem/flat-presets/viewport-metrics）。
- **未改**：CameraController 未新增第二套；投影軸向/cell 尺寸；家具美術/ID/x-y-r/footprint；Occupancy/Placement/Pathfinding；存檔 key/schema/migration；logical 存檔入口；iso/flat 分支；`ortho-room-zones`/`ortho-demo-layout`/`scene-viewport`/`room-config`/`furniture-config` hash。

## 7. 驗證

- `node check.js --deploy`：通過（Build `0575a`、35 DOM IDs、13 nested selectors、55 modules）。
- `node check.js --dev`：通過（**本機真實 Chrome** browser smoke，含 zoom-in **真實指標拖曳 pan** X/Y、x0/x9 非暗帶、demo 不寫存檔、invalid 回退）。
- 個別：`camera-framing`（pan range>0）、`ortho-projection`（zoneFloor 淺色）、`ortho-demo-layout`(23)、`ortho-room-zones`、`grid-projection-compat`（iso/Flat golden 未改）皆通過。
- 16 張 real-browser 證據＋`metrics.json`＋before(V0574)/after(V0575) 零 page error。

## 8. 誠實判斷（是否達成產品目標）

- **達成**：P0 zoom-in pan（X/Y 皆可、拖曳改變 scroll、四邊 clamp、minZoom 整房）；左右深色直條清除（外圈中性）；四周留白由 ~44px 降至 ~18px（明顯降低）；門保留完整；分區靠家具＋淺色 hint 可辨。
- **誠實限制**：門在 x7-8＋88×120 使 portrait 天生 width-constrained，**無法在不裁門下 100% 填滿**；~18px 留白已接近但略高於「8～16px」目標（430 為 26px）；單件家具尺寸未放大（幾何鎖定）；分區底色刻意低對比。若產品要更滿版或更大單件，需另議（裁門／改 cell），本次未做。
- **結論**：本版**應可通過**滿版與操作修正目標；最終以 iPhone 實機驗收為準（見驗收清單）。

## 9. 已知限制／未完成

- 家具仍等角 Placeholder（正交透視待 `ART-0576`）。
- 情境工具列選取時仍會短暫覆蓋底部（reserve 縮小的取捨）；可平移查看。
- 三層服務與分區僅空間/視覺，無收銀/製作/送餐/排隊行為（待 `ARCH-0576-STATION-REGISTRY`）。
- 桌面左右有邊距（手機優先）。
- **手機實機驗收 pending**（見 [驗收清單](./V0575_ORTHOGONAL_FULLBLEED_PAN_ACCEPTANCE.md)）；未 commit/push/部署；本環境無 `.git`。
- iso 仍為預設與 rollback。
