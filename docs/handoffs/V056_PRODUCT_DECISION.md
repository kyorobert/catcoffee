# V0.56 產品決策交接（給產品負責人）

- 任務 ID：`ARCH-0560-FLAT-CAFE-AUDIT`
- 基線：`V0.55.2-alpha` / Build `0552a` / 存檔 key `catCafePhaserV0540`
- 完整依據：[架構稽核](../V056_ARCHITECTURE_AUDIT.md)｜[實作計畫](../V056_IMPLEMENTATION_PLAN.md)
- 治理：[AGENTS](../../AGENTS.md)｜[decisions](../decisions.md)（DEC-007 iso 為基線 Accepted；DEC-008 flat 方向 Proposed）

> **更新（2026-07-24）：產品負責人已核准以下方向（§9 已勾選）。** 正式決策見 [decisions.md](../decisions.md) DEC-008、DEC-012、DEC-013、DEC-014。第一個實作任務 `ARCH-0561-GRID-PROJECTION-SPLIT`（僅第一階段骨架抽離）已完成，見 [V0561 實作結果](../V0561_IMPLEMENTATION_RESULT.md)。原稽核比較內容保留於下方作為決策脈絡。

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

`ARCH-0561` 只做了 **Grid／Projection 內部重構**（玩家無可見變化）。以下**仍未完成**：FlatProjection／平面顯示模式、平面化場景、顧客 AI、訂單流程、玩家店長與客製化、招募店員機制、手機瀏覽器／實機驗收。本次未修改 HTML／CSS／素材／存檔格式。[V0552 人工瀏覽器驗收](../V0552_MANUAL_BROWSER_ACCEPTANCE.md) 仍全部 pending。
