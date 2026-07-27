# 暫定產品與技術路線圖

## 目前 Gate（V0.57.7-alpha / 0577a）

- [x] ARCH-0575C：playable area 與 visual shell 正式分離。
- [x] Room Skin foundation：wall/trim/floor/door/decor anchors 集中設定。
- [x] 1×1、1×2、2×2 邊界放置與 preview/commit 一致性回歸。
- [x] V0575 zoom/pan/clamp 回歸與 invalid projection fallback。
- [x] ARCH-0576A：context toolbar 真實手機觸控與取消清理。
- [x] 正交左右／下框架縮為 8–16 CSS px 範圍。
- [x] 正式入口改由 zone metadata 產生 `(7,0)/(8,0)` mask，底部舊入口釋放。
- [x] Save migration 5402 與 Demo 唯讀隔離。
- [ ] iPhone Safari 真機 Gate（自動化 Chrome 已通過，不可替代真機）。
- [x] `ART-0577-CORE-ORTHOGONAL-FURNITURE-PASS-1`：12 件核心家具四方向
  Orthogonal override、商店縮圖、Ghost 與 runtime 整合完成。
- [ ] iPhone Safari 真機驗收：Chrome／Edge 自動驗收已通過，真機不得代稱通過。
- [ ] 第二批家具：尚未排入本版；不得把第一批擴張為全 47 件。
- [ ] iPhone Safari 真機 pan/pinch/地址列與邊界拖曳驗收。
- [ ] 產品負責人確認 V0576A/B/C Gate 後，才可開始 `ART-0576-CORE-ORTHOGONAL-FURNITURE`。

下一步不得把 ART-0576 家具重畫與本架構修正混在同一變更；Room Skin 已提供穩定視覺底座。

> 本路線圖為暫定方向，必須逐階段核准。它不承諾版本號、完成日期或未經評估的實作方案。

開始排期前先讀 [決策紀錄](./decisions.md)、[目前狀態](./current-state.md) 與 [V0552 交接](./handoffs/V0552_TO_CLAUDE.md)。

## Phase 0｜V0.55.2 基線與治理

- 目標：固定 Build `0552a`、家具重繪結果、治理文件與交接基線。
- 前置：V0.55.2 靜態檢查通過。
- 非目標：變更 Grid、Camera、存檔、家具資料或新增營運系統。
- 驗收 Gate：治理文件互相連結；`npm test`、`npm run check:deploy` 通過；外部裝置驗收仍如實標示 pending。
- 適合代理：Codex 處理文件、清單與有界測試；Claude Code 審閱一致性。

## Phase 1｜手機直立與場景投影架構稽核

- **進度（2026-07-24）：已完成**（`ARCH-0560`；核准方案 B，見 [decisions DEC-008](./decisions.md)）。
- 目標：比較保留 2:1、簡化 2:1 與漸進遷移至 flat／shallow top-down 的 2～3 個選項。
- 前置：閱讀 decisions、current state、V0552 handoff、Room／Grid／Camera／Save 與美術資料流。
- 非目標：直接替換 Grid、批次遷移座標或重畫全部素材。
- 驗收 Gate：交付影響矩陣、成本／風險／相容性、rollback、階段拆解與明確建議。
- 適合代理：Claude Code 主責；Codex 可協助資料盤點與測試矩陣。

## Phase 2｜核准後的場景可讀性實作

- **進度（2026-07-25）：Orthogonal Reboot 原型階段。** Stage 1（`ARCH-0561`：SpatialGrid + IsoProjection Facade）與 Stage 2（`ARCH-0562`：`FlatProjection` Prototype）已完成。Stage 3（`ARCH-0563`：Flat 構圖 Preset A/B/C 比較）已完成，但**產品負責人拒絕全部 Flat 方案**（見 [DEC-016 Superseded](./decisions.md)）。**Flat Preset 比較階段結束，不再安排 Flat Preset 校準。** Stage 4（`ARCH-0570`：正交平面 `OrthogonalProjection`、正交房間 rendering、非存檔 Demo Layout、Art Debug）已完成。產品負責人 iPhone 驗收**確認正交方向正確**，但 V0.57.0 手機首屏過度放大。Stage 5（`ARCH-0571`：Orthogonal 手機直立取景與 Camera 邊界）已完成。Stage 6（`ARCH-0572`：手機直立**滿版化**與咖啡廳分區——正交房間比例調整 cellWidth 104→88/cellHeight 88→120＋整面背牆使房間占比 ~44%→~78% canvas、右上角顧客入口門、上方連續櫃檯/服務帶、Demo 重排 17 件；Camera framing 邏輯不變）已完成並有 real-browser before/after 證據（`docs/evidence/v0572/`）。Stage 7（`ARCH-0573`：**核心營業區滿版與正式分區 metadata**——分離 roomBounds(pan/zoom-out)／coreGameplayBounds(首屏取景)，手機核心區占 safe viewport 96%/95%/93%、外圈 ~8% 裁切、可 zoom-out 至整房；x7–8 兩格入口門；新增純資料 `ortho-room-zones.js`（門/工作區/櫃檯/服務區/座位/貓咪/主走道/核心區，無行為邏輯）；Demo 重排 18 件）已完成並有 real-browser before/after 證據（`docs/evidence/v0573/`）。已完成並有 real-browser before/after 證據（`docs/evidence/v0573/`）。Stage 8（`ARCH-0574`：**營業區聚焦構圖與分區辨識**——縮短背牆(200→155)減少空牆；新增分區地板底色(`zoneAt`＋`zoneFloor`)使連續服務區/工作側/顧客側/成組座位/集中貓咪一眼可辨；分區收斂為 x1-6 乾淨分割；Demo 加密重排 23 件、占用 ~28%→~48%；首屏 core 仍滿版 94/93/91%、可 zoom-out）已完成並有 real-browser before/after 證據（`docs/evidence/v0574/`）。Stage 9（`ARCH-0575`：**滿版取景、Zoom/Pan 修正與分區視覺清理**——P0 修好 zoom-in 後平移（根因：clamp 讀過期 midPoint，改即時 scrollX 推導 `viewCentre()`）；清除左右深色直條（外圈中性淺色）；縮牆浪費/去情境列保留/加高有家具背牆(wainscot) 把上下留白 ~44px→~18px；zoom-in X/Y 皆可 pan、四邊 clamp、minZoom 整房）已完成並有 real-browser before/after 證據＋metrics（`docs/evidence/v0575/`）。實機驗收：Zoom/Pan 通過（凍結核心），但房間外殼滿版與門比例未通過。Stage 10（`ARCH-0575A`，Build 0575b：**房間視覺外殼滿版化＋門比例修正**——把牆/地板視覺外殼畫到超出邏輯 Grid 到 safe viewport 邊緣（手機外圈背景 ~18px→~0px、純視覺不新增可放置格），兩格 `logicalEntranceZone` 與較小 `visualDoorBounds`(~1.4 格分層木門) 分離；Camera 核心凍結）已完成並有 real-browser 證據＋metrics（`docs/evidence/v0575b/`）。**尚未**設為正式預設；手機實機再驗收與**核心家具 Orthogonal 重作（`ART-0576`，10～12 件，僅在房間外殼與門比例實機通過後）**待辦（見 [DEC-023](./decisions.md)、[V0575B 結果](./V0575B_ORTHOGONAL_ROOM_SHELL_RESULT.md)、[V0575B 驗收](./V0575B_ORTHOGONAL_ROOM_SHELL_ACCEPTANCE.md)）。不再安排 Flat Preset 校準。
- 目標：依 Phase 1 核准方案改善直立手機的場景平面感與資訊可讀性。
- 前置：產品核准投影方案、存檔策略、資產策略與驗收畫面。
- 非目標：同時新增店長、店員、顧客完整 AI 或經濟重做。
- 驗收 Gate：家具座標／數量／rotation 可回歸；Camera、Placement、Occupancy、Depth、Pathfinding 與舊存檔測試通過；有 rollback。
- 適合代理：Claude Code 主責跨系統遷移；Codex 負責獨立 adapter、fixture 與回歸測試。

## Phase 3｜玩家店長資料與呈現

- 目標：定義代表玩家、可自訂的店長資料模型與最小場景呈現。
- 前置：角色產品規格、外觀選項、存檔 schema 與相容性決策。
- 非目標：先做固定性別／長相，或同時建完整店員 AI。
- 驗收 Gate：舊存檔補預設值不丟資料；自訂欄位可擴充；角色與 UI 不建立第二套世界座標。
- 適合代理：Claude Code 主責模型與遷移；Codex 可實作單一資料正規化、元件與測試。

## Phase 4｜顧客、店員與訂單核心

- 目標：以純規則資料模型建立可測試的顧客需求、訂單生命週期、工作站與服務流程。
- 前置：場景投影穩定；station／socket、路徑與角色規格核准。
- 非目標：故事、料理大全、抽卡、付費或複雜員工養成。
- 驗收 Gate：規則層可在 Node 測試；顧客／店員不穿家具；訂單狀態可追蹤；現有簡化計數被清楚替代而非疊加。
- 適合代理：Claude Code 主責架構與整合；Codex 適合單一 state machine、fixture 與測試。

## Phase 5｜貓咪自然行為與照顧深化

- 目標：深化個性、休息、家具互動、照顧回饋與長期關係，同時維持自然四足核心。
- 前置：行為規格、資料欄位與存檔預設值核准。
- 非目標：全面擬人化、把貓咪改成店員或重寫 Grid。
- 驗收 Gate：現有 cat ID／數值保留；互動規則可獨立測試；手機不產生輸入衝突或效能退化。
- 適合代理：Claude Code 主責跨 AI／存檔整合；Codex 適合單一行為規則、動畫狀態與測試。

## Phase 6｜發行品質與內容 Gate

- 目標：完成跨裝置驗收、效能、可用性、素材授權、部署與內容一致性。
- 前置：前述已核准階段有穩定候選版本。
- 非目標：在 release hardening 期間加入大型新系統。
- 驗收 Gate：Node／HTTP／Browser Smoke、iPhone Safari、Android Chrome、桌面主流瀏覽器與存檔回歸完成；無未授權素材；部署包可重現。
- 適合代理：Claude Code 主責整體 release audit；Codex 處理明確檢查、文件與回歸案例。
