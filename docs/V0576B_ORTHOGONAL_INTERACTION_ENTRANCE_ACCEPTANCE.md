# V0576B 正交互動與入口清理驗收

## Context toolbar

- [x] 390×844：Rotate／Store／Sell／Cancel 中心均命中正確 element。
- [x] 393×852：四個按鈕中心均命中正確 element。
- [x] 430×932：四個按鈕中心均命中正確 element。
- [x] 所有按鈕最小 44×44 CSS px，單次 touch 只觸發一次。
- [x] Cancel 清除 selection、隱藏工具列、InputMode 回 idle、Camera 恢復。
- [x] Cancel 不改家具位置／旋轉／金幣／inventory。
- [x] 重複選取／取消與 viewport 高度變更後仍穩定。
- [x] Rotate、Store、Sell 經真實 touch 分別只執行一次。

## Shell

- [x] 390 初始視角：side 12.75 px、bottom 13.81 px。
- [x] 393 初始視角：side 12.85 px、bottom 13.92 px。
- [x] 430 初始視角：side 14.11 px、bottom 15.29 px。
- [x] 上牆與 Room Skin 保留。
- [x] 沒有新增 placeable cell，10×8 Grid 未變。
- [x] Zoom-in 後 X/Y pan、minZoom 與 clamp 回歸通過。

## Entrance

- [x] `logicalEntranceZone` 是正式入口唯一資料源。
- [x] `(7,0)`、`(8,0)` 為 reserved entrance。
- [x] `(8,7)`、`(9,7)` 已成為正常可玩格。
- [x] placeable cell 總數 78。
- [x] Scene visual threshold、Placement、Preview、Commit、Occupancy 與尋路共用 mask。
- [x] 顧客入口點讀取 `customerEntryPoint`。

## Migration 5402

- [x] Fresh save 預設 5402，不執行不必要遷移。
- [x] Legacy／current 5401 無衝突資料保持不變。
- [x] 1×1、1×2、2×2 footprint 與入口相交會安全入庫。
- [x] archive 保留 `id/type/x/y/r` 與衝突格 metadata。
- [x] 重複載入不重複 inventory、archive、warning 或 Toast。
- [x] iso projection 結果一致。
- [x] Demo 不遷移、不寫 save。

## 放置與回歸

- [x] 1×1 舊底部入口合法。
- [x] 1×2 底部邊界合法。
- [x] 2×2 右下邊界合法。
- [x] 新入口候選為紅色且 blocking reason 為 `reserved-entrance`。
- [x] Preview 與 pointerup commit 使用同一 candidate evaluation。
- [x] iso／flat／orthogonal、invalid projection fallback 回歸。
- [x] Browser Smoke 無 pageerror、failed request 或 fatal console error。
- [ ] iPhone Safari 真機：未實機測試。

量測原始資料：[metrics.json](./evidence/v0576b/metrics.json)
