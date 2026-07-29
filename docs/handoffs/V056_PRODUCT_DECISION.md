# V0.56 產品決策交接（給產品負責人）

> **最新 Gate（2026-07-30，V0.57.7-alpha / Build 0577k）**：
> `ART-0577K` 已完成核准核心家具正式 Runtime 整合。SoftCute 保留既有
> `pinkTableLong`，HardCafe 使用獨立 `pinkTableLongHardCafe` 商品 ID；
> chair/counter/dessert 為正式 cardinal4 素材。Option C
> `counter → coffeeMachine → washStation → dessert` 已接真實 Grid demo，
> 並含雙桌島與可達貓區。原第一批 12 件不變，override catalog 為 13 件；
> 其餘 35 件仍為 base visual、第二批未核准。Save key/schema/migration 不變。
> Chrome／Edge 通過；iPhone Safari 真機仍 pending。下一個 P0 建議為
> `ANIM-0578-CAT-LOCOMOTION-AND-DIRECTIONAL-STATE-AUDIT`。
>
> **歷史 Gate（2026-07-29，Build 0577e，已由 ART-0577K 取代）**：
> `ART-0577J` 已完成 concept-only 的家具共同比例、服務帶連續性與桌椅島精修。
> 現有貓咪固定作尺度基準；compact chair、較低 counter、收斂 dessert 與
> coffee/wash 以單一顯示契約組成 A/B/C 三種服務帶。A/B/C 尚未由產品選案，
> 正式 PNG、Runtime、Build、Save/schema/migration 均未變，也未建立 ZIP。
> 狀態為 `AWAITING_PRODUCT_REVIEW`；iPhone Safari 真機仍 pending，第二批 35 件
> 未核准。另將貓咪水平滑行、側姿、四足步態、起停轉向與 furniture socket 姿勢
> 升為下一階段 P0 `ANIM-0578-CAT-LOCOMOTION-AND-DIRECTIONAL-STATE-AUDIT`，
> 本 Gate 未實作貓咪 Runtime。
>
> **最新狀態（2026-07-28，V0.57.7-alpha / Build 0577e）**：
> `ART-0577E-ORTHOGONAL-FURNITURE-VISUAL-REDESIGN-PHASE1` 已完成。
> 0577d 的單一 resolver、固定 edit-session envelope 與
> `fixed/axis2/cardinal4` 政策不變；本階段只重畫 `pinkTableLong`、`chair`、
> `counter`、`dessert` 的 16 張 Orthogonal override。長桌已具真正水平／垂直
> 桌面，木椅為真 cardinal 四向，吧台與甜點櫃可辨識顧客／店員及展示／服務面。
> 第一批其餘 8 件維持既有 Orthogonal 素材，其餘 35 件仍為 base visual；
> iso 預設／rollback、ortho opt-in。家具與存檔資料契約均未改。
> iPhone Safari 真機仍 pending；第二批 35 件未核准、未開始。
>
> **歷史狀態（2026-07-28，V0.57.7-alpha / Build 0577d）**：
> `FIX-0577D-ROTATION-UX-ENVELOPE-AND-HANDOFF-COMPLETION` 已完成。Orthogonal
> 家具旋轉維持單一 resolver，改採固定 edit-session envelope、最小位移及
> `fixed/axis2/cardinal4` 政策；`r0 South / r1 West / r2 North / r3 East`
> 順時針不變。無效旋轉只顯示紅色 Ghost／footprint，正式 `x/y/r`、Occupancy、
> save、coins 不變，不自動搜尋替代格；Cancel 可精確回復。第一批 12 件／48 張
> PNG 未重畫，其餘 35 件仍為 base visual；iso 預設／rollback、ortho opt-in。
> iPhone Safari 真機仍 pending；第二批 35 件未核准、未開始。
>
> **歷史狀態（2026-07-28，Build 0577c）**：`ARCH-0577C` 建立單一 cardinal
> resolver、底列就地編輯工具列與精簡 Art Debug；其 corner-pivot UX 已由
> DEC-029／0577d 的固定包絡取代。
>
> **歷史狀態（2026-07-28，Build 0577b）**：
> `ART-0577B-FIRST-BATCH-ROTATION-AND-DIRECTION-CALIBRATION` 完成 12 件
> Orthogonal override 的初版 pivot 校準與木椅真四向；其固定 r0 pivot 手法已
> 經 0577c 稽核並退出現行 Runtime。
>
> **歷史狀態（2026-07-27，V0.57.7-alpha / Build 0577a）**：
> `ART-0577-CORE-ORTHOGONAL-FURNITURE-PASS-1` 已完成。12 件核心家具已用
> projection-specific visual override 接入 Orthogonal；商店縮圖、Entity、Ghost
> 與旋轉共用同一 selector。其餘 35 件仍使用既有 base visual；iso 仍是預設與
> rollback，Orthogonal 仍為 URL opt-in。家具 ID、footprint、`x/y/r`、玩法
> metadata、Camera、Grid、正式入口、schema 5401、migration 5402 與 save key
> 均未改。Chrome／Edge Browser Smoke 已通過；iPhone Safari 真機 Gate 仍
> pending。第二批家具尚未核准，不得自行開始。

> **歷史更新（2026-07-26f，V0.57.6-alpha / Build 0576b）**：`ARCH-0576A` 已完成。iPhone 尺寸 context toolbar 的四個動作已用真實 Chrome touch 中心驗證，Cancel 會完整清理 selection/InputMode/Camera；左右／下 shell 已縮至 8–16 CSS px 範圍。正式入口由 `logicalEntranceZone` 唯一產生 `(7,0)/(8,0)` mask，舊底部入口釋放；migration 5402 安全入庫且冪等，Demo 唯讀。CameraController、Grid 幾何、家具資料與 save key 未改。iPhone Safari 真機 Gate 仍 pending；`ART-0577` 在當時尚未開始，後續已完成第一批 12 件。

> **歷史更新（2026-07-26e，V0.57.6-alpha / Build 0576a）**：`ARCH-0575C` 已完成。V0575B 的非可玩 shell 不再使用類地板淺色，改為明確 `fixed-architecture` 木作帶；playable cell 視覺直接由既有 placeableMask 驅動。新增 Room Skin foundation，牆／護牆板／收邊／floor palette／door geometry+style／decor anchors 與 Projection 幾何分離。家具 preview/commit 共用 candidate evaluation，1×1/1×2/2×2 邊界測試通過。V0575 zoom/pan/clamp、Grid/Occupancy/Placement、存檔契約未改。Chrome 390/393/430 與 desktop smoke 通過；iPhone 真機仍 pending。當時的候選編號 `ART-0576-CORE-ORTHOGONAL-FURNITURE` 後續由 `ART-0577` 執行第一批。

- 任務 ID：`ARCH-0560-FLAT-CAFE-AUDIT`
- 基線：`V0.55.2-alpha` / Build `0552a` / 存檔 key `catCafePhaserV0540`
- 完整依據：[架構稽核](../V056_ARCHITECTURE_AUDIT.md)｜[實作計畫](../V056_IMPLEMENTATION_PLAN.md)
- 治理：[AGENTS](../../AGENTS.md)｜[decisions](../decisions.md)（DEC-007 iso 為基線 Accepted；DEC-008 flat 方向 Proposed）

> **更新（2026-07-24）：產品負責人已核准以下方向（§9 已勾選）。** 正式決策見 [decisions.md](../decisions.md) DEC-008、DEC-012、DEC-013、DEC-014。第一個實作任務 `ARCH-0561-GRID-PROJECTION-SPLIT`（僅第一階段骨架抽離）已完成，見 [V0561 實作結果](../V0561_IMPLEMENTATION_RESULT.md)。原稽核比較內容保留於下方作為決策脈絡。
>
> **更新（2026-07-25）：方向修正——Flat 全部拒絕、改採正交平面。** 產品負責人比較 Flat A（Near Iso）／B（Balanced）／C（Current）後**全部拒絕**（房間仍歪斜、水平垂直不清、非正向可讀）。停止斜投影微調，改採 **Orthogonal 正交平面**（水平／垂直矩形房間，可搭配 2.5D 正面／側面家具）。**iso 仍為暫時預設與 rollback**；Orthogonal 為 opt-in 原型（`?projection=ortho`），尚未設為正式預設。正式決策見 [DEC-017](../decisions.md)（Accepted）與 [DEC-016 Superseded](../decisions.md)。實作見 [V0570 結果](../V0570_ORTHOGONAL_ROOM_RESULT.md)。§2–§8 的三方案比較為 iso 基線下的歷史脈絡，保留不刪；**Flat 已不再是任何後續產品 Gate**。
>
> **更新（2026-07-25b）：iPhone 驗收——正交方向通過、手機取景已修正。** 產品負責人於**真實 iPhone 直立**確認 Orthogonal 正交方向正確，但 V0.57.0 手機首屏過度放大、需大量左右拖曳。`ARCH-0571` 已修正 Camera 取景（以房間內容＋safe viewport 計算 fit、centerOn 置中、pan/zoom 夾在房間內；iso/flat 不變）與 Demo 構圖（16 件緊湊分區）。正式決策見 [DEC-018](../decisions.md)。實作見 [V0571 結果](../V0571_ORTHOGONAL_MOBILE_RESULT.md)。
>
> **更新（2026-07-25c）：iPhone 再驗收——手機直立滿版化與分區已完成。** V0.57.1 Camera 技術正常但「內容太小、上下留白過多、Demo 像展示」。`ARCH-0572` 已**手機直立滿版化**（正交房間比例 cellWidth 104→88/cellHeight 88→120＋整面背牆，房間占 canvas 高度 ~44%→~78%）並**分區**（右上角顧客入口門、上方連續櫃檯/服務帶、中央座位、前左貓咪區、清楚動線；Demo 17 件）。**僅改 Demo/prototype 入口視覺與路線，logical 存檔入口與存檔契約不變；未重畫家具。** 正式決策見 [DEC-019](../decisions.md)。實作見 [V0572 結果](../V0572_ORTHOGONAL_PORTRAIT_RESULT.md)、before/after `docs/evidence/v0572/`。通過後才進入核心家具重作。iso 仍為暫時預設與 rollback。
>
> **更新（2026-07-26）：核心營業區滿版與正式分區已完成。** V0.57.2 滿版化後實機仍判定「手機滿版感不足、上下留白」；根因是首屏仍以**整個房間** contain。`ARCH-0573` 已把首屏改為「**核心營業區滿版**」（分離 roomBounds 作 pan/zoom-out、coreGameplayBounds 作首屏取景；核心區占 safe viewport 96%/95%/93%、外圈 ~8% 裁切、可 zoom-out 至整房），入口改為 **x7–8 兩格門**（x9 留牆），並新增正式空間分區 metadata `ortho-room-zones.js`（門/員工工作區/櫃檯/顧客服務區/座位/貓咪/主走道/核心區；**純資料、無行為邏輯**），Demo 重排 18 件。**僅改 Demo/prototype 視覺與路線；logical 存檔入口與存檔契約不變；未重畫家具、未做營運/店員/訂單/工作站行為。** 正式決策見 [DEC-020](../decisions.md)。實作見 [V0573 結果](../V0573_ORTHOGONAL_CORE_FULLBLEED_RESULT.md)、before/after `docs/evidence/v0573/`。Flat A/B/C 早已全部拒絕，僅保留程式回歸，不再是任何後續產品 Gate。通過後才進入核心家具重作。iso 仍為暫時預設與 rollback。
>
> **更新（2026-07-26b）：營業區聚焦與分區辨識已完成。** V0.57.3 核心滿版後實機仍判定「周遭留白太多、看不出分區」。`ARCH-0574`（**構圖與分區精修，非家具重畫**）已縮短背牆(200→155)減少空牆、新增**分區地板底色**（`zoneAt`＋`zoneFloor`）使連續服務區/員工側/顧客側/成組座位/集中貓咪一眼可辨、分區收斂為 x1-6 乾淨分割、Demo 依分區加密重排 23 件（占用 ~28%→~48%）；首屏 core 仍滿版 94/93/91%、可 zoom-out。**因門在 x7-8、core 必含 x8，取景寬度受幾何鎖定，單件家具尺寸與 V0573 相同（非本版放大）；未改 cell 尺寸、未重畫家具、未做營運/店員/訂單/工作站行為、存檔契約不變。** 正式決策見 [DEC-021](../decisions.md)。實作見 [V0574 結果](../V0574_ORTHOGONAL_COMPOSITION_RESULT.md)、before/after `docs/evidence/v0574/`。通過後才進入核心家具重作。iso 仍為暫時預設與 rollback。
>
> **更新（2026-07-26c）：滿版取景與 Zoom/Pan 修正已完成。** V0.57.4 於真實 iPhone 未通過：留白太多、**放大後無法平移（P0）**、左右不明深色直條。`ARCH-0575` 已修：**P0 pan**（根因是 clamp 讀到只在 preRender 更新的過期 `camera.midPoint`；改由即時 `scrollX+width/2` 推導中心，zoom-in 後 X/Y 皆可 pan、四邊 clamp、minZoom 整房，未建第二套 CameraController）；**清除深色直條**（外圈改中性淺色）；**留白 ~44px→~18px**（縮牆浪費/去情境列保留/加高有家具的背牆＋wainscot）。**cell 88×120 不變、未重畫家具、存檔契約不變、logical 入口不變。誠實限制**：門在 x7-8＋88×120 使 portrait 天生 width-constrained，無法在不裁門下 100% 填滿；~18px 略高於 8-16 目標；單件家具未放大。正式決策見 [DEC-022](../decisions.md)。實作見 [V0575 結果](../V0575_ORTHOGONAL_FULLBLEED_PAN_RESULT.md)、before/after＋metrics `docs/evidence/v0575/`。通過後才進入核心家具重作。iso 仍為暫時預設與 rollback。
>
> **歷史更新（2026-07-26d）：房間外殼滿版與門比例修正已完成（Build 0575b）。** V0575（0575a）實機：**Zoom/Pan 通過（凍結核心）**，但房間外殼滿版與視覺門比例未通過（四周仍見房外背景像卡片、門為近兩格深色矩形）。`ARCH-0575A` 已修（**不重構 Camera、不重畫家具**）：把**牆＋地板視覺外殼畫到超出邏輯 Grid** 到 safe viewport 邊緣（手機外圈背景 ~18px→~0px、純視覺不新增可放置格、細牆腳線取代粗卡片外框）；**兩格 `logicalEntranceZone` 與較小 `visualDoorBounds`(~1.4 格、分層木門：門框/玻璃格窗/門把) 分離**。**CameraController 核心未改；entryPoint(8,0)/staging/x9/舊存檔入口/cell 88×120/存檔契約皆不變。** 正式決策見 [DEC-023](../decisions.md)。實作見 [V0575B 結果](../V0575B_ORTHOGONAL_ROOM_SHELL_RESULT.md)、before/after＋門 before/after `docs/evidence/v0575b/`。當時候選家具任務編號為 `ART-0576`；後續已由 `ART-0577` 完成第一批 12 件。

---

## 1. 目前問題（一句話）

咖啡廳「看起來一直在運作」的錯覺，目前是靠 [`CafeScene.maybeSpawnCustomer`](../../assets/js/scenes/CafeScene.js) 的**固定計時器**（顧客走到定點 → 等 2.6 秒 → 直接 `+320` 營收 → 走掉）撐起來的；而不是真正的顧客/訂單流程。另有一個獨立議題：現行 2:1 等角場景在**手機直立**下較難一眼讀懂布局。

---

## 2. 三種技術方案摘要

| | 方案 A | 方案 B（建議） | 方案 C |
|---|---|---|---|
| 做法 | 保留 2:1 等角，只改 Camera/美術/UI/流程呈現 | 保留邏輯格與存檔，**抽離投影**，新增可切換平面/淺俯視 | 全新矩形 Grid + 矩形房間 + 新座標，再遷移家具與存檔 |
| 手機直立可讀性 | 低–中 | 中–高 | 高 |
| 家具素材沿用 | ~100% | ~80–100% | 低（大量重畫） |
| 存檔/ID/footprint 相容 | 完全 | 完全（`x/y/r` 不變） | 需遷移 |
| 可漸進/可回復 | 是 | **是（可即時切回 iso）** | 難 |
| 失敗風險 | 低 | 中低 | 高 |

---

## 3. 推薦方案：**方案 B**

抽離 `SceneProjection`，新增可切換的平面／淺俯視顯示模式，保留邏輯格、家具座標、Occupancy、Placement、Pathfinding 與存檔。

## 4. 推薦原因

1. **改的是「投影」不是「資料」**：實測 `OccupancySystem`、`PlacementSystem`、`grid-pathfinder`、`SaveAdapter` 遷移、`CameraController` **都不依賴投影函式**；家具以邏輯格 `x/y/r` 儲存。換投影＝把同一組座標投到不同位置，**不搬家具、不改存檔**。
2. **可漸進、可回復**：先做純重構（iso 視覺零差異），再加平面模式與 `projectionMode`，隨時切回 iso 作 rollback。
3. **素材風險低**：等角像素圖在淺斜投影多數可沿用，透過既有相容層逐件精修，**不需全部重畫**。
4. **不卡住生命感**：顧客/訂單/工作站/反應與投影**正交**，可平行推進。

## 5. 最大風險

- **B 的風險**：平面投影下家具需逐件校準 scale/anchor 與 socket 對位；家具拖曳的觸控偏移需重新校準。屬中低風險，且有 iso 即時回退。
- **共同最大風險**：若把「營運生命感」再次用計時器搪塞（重蹈 D3），就算換了投影也達不到產品目標。→ 計畫已規定**營收只在 `Order: PAID` 由 EconomySystem 冪等 commit**，狀態轉換需真前置條件。

## 6. 家具素材可沿用程度

- 方案 A：~100%；**方案 B：~80–100%（淺斜）**；方案 C：低。
- 25 件已有四方向透明 PNG、其餘 22 件單方向 + mirror/fallback；四方向對應 rotation 0–3，淺斜可沿用。正射純頂視才需大量重畫（故不建議 C）。

## 7. 存檔影響

- key `catCafePhaserV0540` **不變**；家具 `x/y/r` **不變**。
- 新增只走「頂層加欄位 + 預設值」（如 `projectionMode`、未來 `managerProfile`），對舊存檔前向相容，多數不需 bump schema。
- MVP **不保存**進行中顧客/訂單；station/行為載入時重建。

## 8. 預估需先完成的基礎階段

1. **Stage 1**：Grid/Projection 拆分（純重構，iso 零差異）— 投影方案的地基。
2. **EconomySystem 抽出**（可與 Stage 1 平行）— 生命感的地基（單一冪等營收 commit）。
3. **Stage 4 StationRegistry** — 顧客/訂單/貓行為的共同前置。

---

## 9. 產品負責人決策結果（2026-07-24 已核准）

1. **投影方案**：☑ **B**｜☐ A｜☐ C
2. **平面樣式**：☑ **淺斜／淺俯視**（沿用素材）｜☐ 正射純頂視
3. **MVP 第一位工作角色**：☑ **玩家店長 Placeholder**（過渡方案，可執行製作/送餐/收銀等最小工作；只用來跑通流程，不代表最終美術，也不代表店長永久負責全部工作）。未來將有招募店員機制承接這些工作；店貓維持自然四足、不是店員。
4. **是否保存進行中顧客/訂單**：☑ **MVP 不保存**（重載後重生）；僅保存已結算經濟與玩家進度；不因此改動存檔格式。
5. **店長是否需實體出現在場景**：☑ **未來入場**（本次未實作，且不建立固定外觀）。
6. **工作任務架構**：☑ **actor／worker-neutral**（店長與未來店員共用同一套移動/工作站/任務接口；不得建立 manager-only 流程；Grid/Projection 不得綁定角色身份）。

> 對應正式決策：[DEC-008](../decisions.md)（方案 B）、[DEC-012](../decisions.md)（SceneProjection 抽離）、[DEC-013](../decisions.md)（actor-neutral 工作架構）、[DEC-014](../decisions.md)（顧客/訂單保存）。

---

## 10. 實作任務進度

- ✅ **已完成**：`ARCH-0561-GRID-PROJECTION-SPLIT`（Claude Code）— 骨架抽離（`SpatialGrid` + `IsoProjection` + `GridSystem` 相容 Facade），等角視覺零差異、golden-master 逐項一致。見 [V0561 結果](../V0561_IMPLEMENTATION_RESULT.md)。
- ✅ **已完成（Prototype）**：`ARCH-0562-FLAT-PROJECTION-PROTOTYPE`（Claude Code）— 新增 `FlatProjection`（淺斜／淺俯視）+ 純模式解析器；`?projection=flat` opt-in、**預設仍 iso**、非法值回退 iso、**投影不入存檔**；家具 `x/y/r`／Occupancy／Placement／Pathfinding／存檔 key 不變；iso 未動。版本升 `V0.56.0-alpha`／Build `0560a`。有 real-browser 截圖證據（`docs/evidence/v0562/`）。**Flat 尚未成為正式預設；家具 flat 美術未完成；手機實機驗收未完成。** 見 [V0562 結果](../V0562_FLAT_PROJECTION_RESULT.md) 與 [V0562 驗收](../V0562_FLAT_PROJECTION_ACCEPTANCE.md)。
- **待產品負責人**：完成 [V0562 Flat 人工驗收](../V0562_FLAT_PROJECTION_ACCEPTANCE.md)；核准後才決定 Flat 是否成為正式預設。
- **候選下一任務**（未核准前不執行）：
  - `ART-0563-FLAT-FURNITURE-CALIBRATION`（Codex）：逐件 flat 顯示校準（不改邏輯 footprint）。
  - `ARCH-0563-ECONOMY-EXTRACT`（Claude Code）：抽 EconomySystem，建立 Order: PAID 單一冪等營收入口（與投影無關，可先跑）。
  - `ARCH-0563-STATION-REGISTRY`（Claude Code）：socket 旋轉／可到達性／椅桌配對（需 flat 幾何與 socket 投影方向定案）。

> 任務卡細節見 [實作計畫 §10](../V056_IMPLEMENTATION_PLAN.md)。

---

## 11. 誠實聲明（尚未完成事項）

`ARCH-0561` 只做了 **Grid／Projection 內部重構**（玩家無可見變化）。以下**仍未完成**：完整顧客 AI、訂單流程、玩家店長與客製化、招募店員機制、iPhone Safari 真機驗收，以及其餘 35 件 Orthogonal 家具。FlatProjection 已完成但產品拒絕為正式方向，僅保留回歸；Orthogonal 仍為 opt-in。現行狀態以文件最上方「最新狀態」為準。
