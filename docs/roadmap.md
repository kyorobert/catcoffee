# 暫定產品與技術路線圖

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

- **進度（2026-07-24）：進行中／Prototype 階段。** Stage 1（`ARCH-0561`：SpatialGrid + IsoProjection Facade 拆分）已完成；Stage 2（`ARCH-0562`：`FlatProjection` 淺俯視 Prototype，`?projection=flat` opt-in、預設仍 iso、不入存檔）已完成並有 real-browser 截圖證據。**尚未**進入正式預設或手機 UI 重製；家具 flat 逐件校準與 Flat 視覺人工驗收待辦（見 [DEC-015](./decisions.md)、[V0562 驗收](./V0562_FLAT_PROJECTION_ACCEPTANCE.md)）。
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
