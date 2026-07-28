# 暫定產品與技術路線圖

## 目前 Gate（V0.57.7-alpha / 0577d）

- [x] ARCH-0575C：playable area 與 visual shell 正式分離。
- [x] Room Skin foundation：wall/trim/floor/door/decor anchors 集中設定。
- [x] 1×1、1×2、2×2 邊界放置與 preview/commit 一致性回歸。
- [x] V0575 zoom/pan/clamp 回歸與 invalid projection fallback。
- [x] ARCH-0576A：context toolbar 真實手機觸控與取消清理。
- [x] 正交左右／下框架縮為 8–16 CSS px 範圍。
- [x] 正式入口改由 zone metadata 產生 `(7,0)/(8,0)` mask，底部舊入口釋放。
- [x] Save migration 5402 與 Demo 唯讀隔離。
- [x] `ART-0577-CORE-ORTHOGONAL-FURNITURE-PASS-1`：12 件核心家具四方向
  Orthogonal override、商店縮圖、Ghost 與 runtime 整合完成。
- [x] 第一批以 projection-specific override 接入；iso／flat 維持 base visual，iso 仍是預設／rollback。
- [x] `ART-0577B-FIRST-BATCH-ROTATION-AND-DIRECTION-CALIBRATION`：12 件共用
  stable visual pivot；木椅補齊真四方向；Preview／Entity／Ghost 一致。
- [x] `FIX-0577D-ROTATION-UX-ENVELOPE-AND-HANDOFF-COMPLETION`：以固定
  edit-session envelope、最小位移與 `fixed/axis2/cardinal4` 政策取代
  0577c corner-pivot UX；無效旋轉零正式副作用。
- [ ] iPhone Safari 真機 Gate：家具比例、輪廓、anchor、拖曳／旋轉、pan／pinch 與地址列變化；Chrome／Edge 自動驗收不可替代真機。
- [ ] 第二批家具：尚未核准；其餘 35 件仍使用 base visual，不得自行接續。

### 下一個 Gate

1. 部署 Build `0577d`。
2. 於真實 iPhone Safari 驗收 fixed／axis2／cardinal4 的連續旋轉、無效紅色
   preview、底列 Rotate／Cancel／Store、pan／pinch 與地址列變化。
3. 判斷 0577d 的比例／輪廓／包絡位移與觸控手感是否通過。
4. 貓咪 × 家具互動只先另立 `ARCH-0578-CAT-FURNITURE-INTERACTION-AUDIT`
   規格卡，不在家具美術卡偷做。
5. 通過後才由產品負責人另立第二批家具 Task Card；未核准前不得開始其餘 35 件。

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

- **進度（截至 2026-07-28）：Stage 1–15 已依序完成；Orthogonal 仍未設為預設。**
  - Stage 1 `ARCH-0561`：SpatialGrid + IsoProjection Facade。
  - Stage 2 `ARCH-0562`：`FlatProjection` Prototype。
  - Stage 3 `ARCH-0563`：Flat Preset A/B/C 比較；三案皆被拒絕，僅保留回歸（[DEC-016 Superseded](./decisions.md)）。
  - Stage 4 `ARCH-0570`：`OrthogonalProjection`、正交房間、唯讀 Demo 與 Art Debug。
  - Stage 5 `ARCH-0571`：手機直立取景與 Camera 邊界。
  - Stage 6 `ARCH-0572`：cell 88×120、整面背牆、滿版化與分區 Demo。
  - Stage 7 `ARCH-0573`：room/core bounds 分離、核心營業區滿版與 `ortho-room-zones.js`。
  - Stage 8 `ARCH-0574`：營業區聚焦、分區底色與 23 件 Demo 構圖。
  - Stage 9 `ARCH-0575`：zoom-in pan 根因修正、四邊 clamp、留白與深色直條清理。
  - Stage 10 `ARCH-0575A`（Build 0575b，歷史階段）：視覺外殼滿版與入口門比例修正。
  - Stage 11 `ARCH-0575C`（Build 0576a，歷史階段）：playable area／Room Skin foundation，preview/commit 共用評估。
  - Stage 12 `ARCH-0576A`（Build 0576b，歷史階段）：context toolbar、窄框架、正式入口 `(7,0)/(8,0)` 與 migration 5402。
  - Stage 13 `ART-0577`（Build 0577a）：第一批 12 件 Orthogonal 家具與 projection-specific override 完成。
  - Stage 14 `ART-0577B`（Build 0577b，歷史階段）：第一批旋轉視覺 pivot 校準；
    木椅真正四方向；貓咪 × 家具只完成稽核，不含互動 Runtime。其餘 35 件仍使用 base visual。
  - Stage 15 `ARCH-0577C` → `FIX-0577D`（Build 0577c→0577d，現行）：
    單一 cardinal resolver、底列編輯模式與 Art Debug；最終以固定 edit-session
    envelope、最小位移與集中旋轉 policy 取代 corner-pivot。

  上述歷史階段的成果與證據分別保留在 `docs/evidence/` 及各版本結果／驗收文件。
  現行產品 Gate 是 0577d 旋轉包絡與第一批家具的 iPhone Safari 真機驗收；
  第二批尚未核准。
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
