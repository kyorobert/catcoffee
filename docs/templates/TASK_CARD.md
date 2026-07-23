# Task Card

> 複製此模板建立新任務。未填清楚「非目標、受保護契約、驗收 Gate」前，不開始跨系統實作。

## 基本資料

- 任務 ID：
- 任務名稱：
- 建立日期：
- Owner：
- 執行代理：Claude Code／Codex／其他
- 狀態：Draft／Approved／In Progress／Blocked／Done
- 對應版本／Build：

## 目標

- 玩家／產品問題：
- 本次可驗證結果：

## 非目標

- 

## 相關決策與文件

- `docs/decisions.md`：
- `docs/current-state.md`：
- 版本 handoff：
- 其他規格：

## 現況與重現

- 目前行為：
- 重現步驟：
- 第一個真實錯誤／證據：
- 基準測試結果：

## 影響範圍

- 預計修改檔案／模組：
- 不得修改檔案／模組：
- 相依系統：

## 受保護契約

- 存檔 key／legacy key：
- furniture ID／價格／footprint／rotation：
- Grid／Camera／Occupancy／Placement／Depth：
- 版本／Build／query：
- 素材授權：

## 資料與相容性

- 輸入／輸出資料格式：
- 存檔 schema 影響：
- 舊存檔策略：
- migration 是否需要：
- rollback：

## 實作階段

1. 
2. 
3. 

## 風險

| 風險 | 可能性 | 影響 | 緩解／rollback |
|---|---|---|---|
|  |  |  |  |

## 驗收 Gate

- [ ] 功能驗收：
- [ ] 相容性驗收：
- [ ] 手機直立驗收：
- [ ] 錯誤／fallback 不被當成完成：
- [ ] 未測項目明確列出：

## 測試

### 修改前

```powershell
npm.cmd test
npm.cmd run check:deploy
```

### 修改後

```powershell
# 填入本任務必要命令
```

### Browser／實機

- 自動 Browser Smoke：
- iPhone Safari：
- Android Chrome：
- 桌面：

## 文件更新

- [ ] `docs/devlog.md`
- [ ] `docs/decisions.md`（若有決策）
- [ ] `docs/current-state.md`（若現況改變）
- [ ] `docs/handoffs/`（若需要交接）
- [ ] README／規格（若公開使用方式改變）

## Review 與交付

- Review owner：
- 實際修改摘要：
- 實際測試結果：
- 未完成／blocked：
- 下一個 handoff：

