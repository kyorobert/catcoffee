# V0.55.2-alpha → Claude Code 交接

開始前依序閱讀 [AGENTS.md](../../AGENTS.md)、[CLAUDE.md](../../CLAUDE.md)、[決策紀錄](../decisions.md)、[目前狀態](../current-state.md) 與 [開發日誌](../devlog.md)。

## A. 目前基線

- 版本：`V0.55.2-alpha｜Prototype 家具全面重繪版`
- Build：`0552a`
- Phaser：`3.90.0`，正式 Runtime 使用本地 `assets/vendor/phaser-3.90.0.min.js`
- 存檔 key：`catCafePhaserV0540`
- V0.55.2：25 件舊 Prototype 已替換為 100 張四方向透明 PNG；Runtime 42 `production`、5 `redraw`、0 `prototype`。
- furniture ID、價格、footprint、rotation、位置與存檔契約保持不變。
- 本次文件任務執行的 `npm.cmd test` 與 `npm.cmd run check:deploy` 均通過。
- [V0552 人工瀏覽器驗收](../V0552_MANUAL_BROWSER_ACCEPTANCE.md) 仍全部 pending；不可宣稱外部裝置已通過。
- repository 根目錄目前沒有 `.git`；不要自行 `git init`。

## B. 已核准產品方向

- 手機直立優先，平板、橫式與桌面相容。
- 咖啡廳場景是主要遊戲空間；主操作集中底部，降低永久側邊按鈕噪訊。
- 任務、營運與顧客需求偏向浮動提示、泡泡、可收合面板或 bottom drawer。
- 店內貓咪維持自然四足；照顧、個性與自然移動是核心。
- 玩家店長未來代表玩家並可自訂；在規格核准前不建立固定外觀。
- 完整店員 AI、顧客 AI、訂單／料理／送餐／結帳與故事系統尚未完成。
- 產品希望評估 flat／shallow top-down 可讀性；現行正式 Runtime 仍是 2:1 等角。

## C. 開放技術問題

1. 保留 2:1 Grid、降低視覺斜率，或遷移投影，何者能滿足直立手機可讀性？
2. 投影改變是否需要同步調整 Main Camera、viewport 與 HUD／bottom drawer 分配？
3. 現有 47 件家具與四方向素材可否重用；需多少方向／anchor／shadow 調整？
4. 如何保持 `catCafePhaserV0540`、furniture ID 與既有 `x/y/r` 可逆相容？
5. Depth、Occupancy、Placement 與 Pathfinding 在各方案中的變更面積為何？
6. 是否需要 visual adapter，避免 UI 或資產建立第二套世界座標？
7. 玩家店長的純資料模型、客製欄位、場景座標與存檔預設值應如何定義？
8. 顧客、店員、工作站與訂單模型如何取代目前簡化演出，而不疊加第二套流程？

## D. 建議第一個任務

### 任務名稱

直立手機與場景平面化方向架構稽核

### 任務範圍

- 只做 repository 稽核、gap analysis、方案比較與分階段計畫。
- 檢查 `ROOM_CONFIG`、`GridSystem`、Camera、Depth、Occupancy、Placement、Pathfinding、SaveAdapter、家具視覺資料流及手機 viewport。
- 提出 2～3 個選項，至少涵蓋：
  - 保留現行 2:1；
  - 保留邏輯 Grid、簡化視覺投影；
  - 漸進遷移至 flat／shallow top-down。
- 比較成本、風險、相容性、資產重用、rollback、測試 Gate 與可分階段程度。
- 明確建議哪些工作由 Claude Code 主責、哪些可拆成 Codex 的有界子任務。

### 必要輸出

- `docs/V056_ARCHITECTURE_AUDIT.md`
- `docs/V056_IMPLEMENTATION_PLAN.md`

### 本任務不得做

- 不直接替換 Grid 或投影。
- 不批次遷移家具／世界座標。
- 不修改存檔 key 或 furniture ID。
- 不重畫全部家具或角色。
- 不把未完成的店長、顧客、店員、訂單系統一起實作。

## E. 禁止事項

- 建立第二套正式 Grid、Camera、Occupancy、Placement 或世界座標。
- 以 CSS／DOM 移動 Phaser 場景物件。
- 用 fallback、放寬碰撞或批次重排家具掩蓋架構問題。
- 未核准就改存檔 schema、坐標語意或家具 ID。
- 只針對單一手機尺寸使用 magic number。
- 把人工瀏覽器驗收或實機結果寫成已完成。

## F. 稽核驗收標準

- 現況描述與 `docs/current-state.md`、程式及測試一致。
- 每個方案都涵蓋 Camera、資產、存檔座標、Depth、Occupancy、Placement、Pathfinding 與 UI。
- 有清楚的非目標、遷移順序、rollback 與測試 Gate。
- 明確分離「已核准產品方向」與「待核准技術方案」。
- 不在稽核任務內廣泛修改 Runtime。
- 交付後更新 `docs/devlog.md`；形成決策時更新 `docs/decisions.md`。
