# V0576B 正交互動與入口清理結果

## 結論

`ARCH-0576A-ORTHOGONAL-INTERACTION-SHELL-AND-ENTRANCE-CLEANUP` 已完成，版本維持
`V0.57.6-alpha`，Build 更新為 `0576b`。

- iPhone 尺寸的家具 context toolbar 已改為至少 `44×44 CSS px` 的真實觸控目標。
- Cancel 會同時清理 drag、selection、InputMode 與 Camera lock；不改家具 `x/y/r`、Occupancy、inventory 或金幣。
- Rotate／Store／Sell／Cancel 均在 390、393、430 寬度以按鈕中心真實 touch 測試，每次只觸發一次。
- 正交房間左、右、下框架縮為窄木作；初始手機視角實測約 12.8–15.3 CSS px，上牆保留完整。
- 正式入口唯一來源為 `logicalEntranceZone`，保留格改為 `(7,0)`、`(8,0)`；舊 `(8,7)`、`(9,7)` 已釋放。
- `placeableMask` 仍為 10×8，正式可放置格數為 78。
- `migrationCompletedVersion` 更新為 5402；`CURRENT_KEY` 與 `sceneSchemaVersion` 分別維持
  `catCafePhaserV0540`、5401。
- 與新入口相交的舊家具會保留完整 instance metadata 至 archive，並且只入庫一次；重載冪等。
- `demoLayout=1` 使用唯讀 SaveAdapter，不執行遷移、不寫入正式存檔。
- CameraController、Grid 幾何、家具 ID／footprint 與經濟系統均未重構。

## 真實根因

取消按鈕在基線已被 `elementFromPoint` 正確命中，且 click count 為 1；Canvas 與 overlay
沒有攔截事件。問題出在 `CafeScene.cancelDrag()` 只呼叫 drag controller：
selected-but-not-dragging 狀態沒有清除 `selectedId`，也沒有送出空 selection，所以工具列看似無反應。
此外舊手機按鈕僅約 25×42 CSS px，低於安全觸控尺寸。

## 入口資料鏈

```text
ORTHO_ROOM_ZONES.logicalEntranceZone
  -> ORTHO_ENTRANCE_CELLS
  -> buildOrthogonalPlaceableMask()
  -> ROOM_CONFIG.floor.placeableMask / ROOM_CONFIG.entrance.cells
  -> SpatialGrid / Placement / Occupancy / Pathfinding / Preview / Commit
```

Scene 不再持有另一份入口格清單；顧客入口點也改讀 `customerEntryPoint`。

## 遷移 5402

- 一次性判定 footprint 的任一 cell 是否與正式入口相交。
- 衝突 instance 的 `id/type/x/y/r` 完整存入 `migrationArchive`。
- archive 帶有 `reason: entrance-relocated`、`migrationVersion: 5402` 與衝突格。
- 同一 item ID 只增加一次 inventory 與 warning。
- 首次實際遷移只顯示一則友善 Toast；歷史 warning 不會每次啟動重播。
- 1×1、1×2、2×2、重複載入、iso projection 與 demo 唯讀均有自動測試。

## 證據

- 真實 Chrome 圖片與量測：[docs/evidence/v0576b](./evidence/v0576b/)
- 驗收清單：[V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_ACCEPTANCE.md](./V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_ACCEPTANCE.md)
- Before/after：[V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_COMPARISON.html](./V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_COMPARISON.html)

## 保留事項

- iPhone Safari 真機仍需由使用者執行最終 Gate；本次證據來自安裝版 Chrome 的手機 viewport/touch automation。
- `ART-0577-CORE-ORTHOGONAL-FURNITURE` 未開始。
