# ARCH-0561-GRID-PROJECTION-SPLIT 實作結果

- 任務：Grid／Projection 拆分——`SpatialGrid` + `IsoProjection` 純重構
- 執行者：Claude Code
- 日期：2026-07-24
- 相關：[decisions DEC-012](./decisions.md)｜[實作計畫 Stage 1](./V056_IMPLEMENTATION_PLAN.md)｜[架構稽核 §5](./V056_ARCHITECTURE_AUDIT.md)｜[產品決策](./handoffs/V056_PRODUCT_DECISION.md)｜[devlog](./devlog.md)

## 任務摘要

將 `GridSystem` 的兩種責任拆開：**投影無關的邏輯格**（`SpatialGrid`）與**2:1 等角畫面投影**（`IsoProjection`）。`GridSystem` 改為組合兩者的相容 Facade，public API 完全不變。這為未來的淺俯視／平面投影建立安全切換點，同時保證現行等角行為零變化。**本次不新增平面模式、不改變任何玩家可見行為、不動存檔。**

## 基線版本

| 項目 | 值 |
|---|---|
| 版本 / Build | `V0.55.2-alpha` / `0552a`（未變動） |
| Phaser | `3.90.0`（本地 vendor，Canvas；未變動） |
| 存檔 key | `catCafePhaserV0540`（未變動） |
| sceneSchemaVersion / migrationCompletedVersion | `5401` / `5401`（未變動） |
| Git | 此環境不包含 `.git` |

## 重構前架構

單一 `GridSystem`（62 行）同時持有邏輯與投影：
- 邏輯：`getFootprintSize`、`getFootprintCells`、`isInsideGrid`、`isPlaceableCell`。
- 投影：`gridToWorld`、`worldToGrid`、`snapWorldToGrid`、`getCellCenter`、`getCellDiamond`。
- 橋接（投影，吃邏輯）：`getFootprintPolygon`、`getAnchor`。
- 屬性：`room`、`floor`、`furniture`。

## 重構後架構

```
GridSystem (Facade)
├─ spatialGrid: SpatialGrid   // 投影無關邏輯
└─ projection: IsoProjection  // 2:1 等角投影（持有 spatialGrid 參照）
```
- `roomConfig`、`furnitureConfig` 由三者**共用同一參照**——單一來源、無第二份 cols/rows/mask/世界座標。
- `GridSystem` 公開唯讀 `spatialGrid`、`projection`，供後續投影切換階段使用。

## GridSystem Facade 設計

- 建構：`new GridSystem(roomConfig, furnitureConfig)` 建立 `SpatialGrid`，再以其為引數建立 `IsoProjection`。
- 邏輯方法委派 `spatialGrid`；投影方法委派 `projection`。
- 保留 `this.room / this.floor / this.furniture`（皆為傳入物件的參照，非複製），確保讀 `grid.room.*` 的消費者不受影響。
- 檔名/目錄沿用現有分層（`assets/js/systems/`）；內部 import 使用 repo 慣例的 `?v=0552a`。

## SpatialGrid 責任

**只有**投影無關的邏輯格資訊：
- `cols` / `rows` / `placeableMask`（getter，讀 `roomConfig.floor`，不複製）。
- `getFootprintSize(type,rotation)`（`rotation%2` 交換寬高）。
- `getFootprintCells(type,x,y,rotation)`（row-major 順序）。
- `isInsideGrid(x,y)`、`isPlaceableCell(x,y)`。

**不做**：不依賴引擎、DOM、Camera、世界/畫面座標、家具 Entity、Occupancy、角色身份、店長/店員或任何營運邏輯。（測試以 grep 斷言原始碼不含 `Phaser/document/window/localStorage` 與任何 actor 身份字串。）

## IsoProjection 責任

**只有**現行 2:1 等角投影：
- `gridToWorld` / `worldToGrid` / `snapWorldToGrid` / `getCellCenter` / `getCellDiamond` / `getFootprintPolygon` / `getAnchor`。
- 讀取 `SpatialGrid.getFootprintSize` 與 `roomConfig.floor` 幾何（tileWidth/Height、origin）與 `furnitureConfig[type].layer`（僅用於 anchor 規則）。

**不做**：不修改 `SpatialGrid`；不保存家具/Occupancy/Placement/角色/店長/店員狀態；不建立第二份房間格資料。

## public API 相容結果

`GridSystem` 對外 11 個方法 + 3 個屬性全部保留，簽章不變：

| 類別 | 成員 | 委派至 |
|---|---|---|
| 屬性 | `room` / `floor` / `furniture` / `spatialGrid` / `projection` | 自身（後二者為新公開唯讀參照） |
| 邏輯 | `getFootprintSize` / `getFootprintCells` / `isInsideGrid` / `isPlaceableCell` | `spatialGrid` |
| 投影 | `gridToWorld` / `worldToGrid` / `snapWorldToGrid` / `getCellCenter` / `getCellDiamond` / `getFootprintPolygon` / `getAnchor` | `projection` |

## 所有 Grid 消費者盤點（均未修改）

| 消費者 | 使用 | 影響 |
|---|---|---|
| `scenes/CafeScene.js` | `new GridSystem`、`getCellDiamond`、`getCellCenter` | 無 |
| `entities/FurnitureEntity.js` | `getAnchor`、`grid.room.camera.baseMinZoom` | 無 |
| `phaser/FurnitureDragController.js` | `getAnchor/getCellCenter/getCellDiamond/getFootprintPolygon/snapWorldToGrid/getFootprintCells/isPlaceableCell/isInsideGrid`、`grid.room.floor.*` | 無 |
| `phaser/CatBehaviorController.js` | `getCellCenter/snapWorldToGrid/isInsideGrid/isPlaceableCell`、`grid.room.floor.*` | 無 |
| `phaser/ArtDebugRenderer.js` | `getFootprintPolygon/getCellCenter` | 無 |
| `systems/OccupancySystem.js` | `getFootprintCells`、`grid.room.entrance.cells` | 無 |
| `systems/PlacementSystem.js` | `getFootprintCells/isInsideGrid/isPlaceableCell`、`grid.room.entrance.cells` | 無 |
| `systems/SaveAdapter.js`（`migrateIfNeeded(grid)`） | `getFootprintCells/isInsideGrid/isPlaceableCell` | 無 |
| `tests/core.test.js`、`tests/cat-ai-simulation.test.js` | `new GridSystem` + 多方法 | 無（期望值未改，全綠） |

外部僅存取 `grid.room`（`.camera` / `.floor` / `.entrance`）；無消費者存取 `grid.floor` / `grid.furniture`，但仍保留以策安全。**本次未修改任何消費者。**

## 實際修改檔案

| 檔案 | 建立/修改 | 用途 | 必要性 |
|---|---|---|---|
| `assets/js/systems/SpatialGrid.js` | 建立 | 邏輯格模組 | 任務核心 |
| `assets/js/systems/IsoProjection.js` | 建立 | 等角投影模組 | 任務核心 |
| `assets/js/systems/GridSystem.js` | 修改 | 改為相容 Facade | 任務核心 |
| `tests/grid-projection-compat.test.js` | 建立 | golden-master 相容 + 結構測試 | 任務要求（相容測試） |
| `check.js` | 修改 | (1) 更新 `GridSystem.js` 受保護雜湊；(2) 新增 `SpatialGrid.js`/`IsoProjection.js` 受保護雜湊；(3) 將新測試加入 deploy 測試清單 | **必要**：`check.js` 以 SHA-256 鎖定 `GridSystem.js`，不更新則 `check:deploy` 會以「protected core changed」失敗；新增二檔雜湊避免把核心公式移到未受保護檔案而**弱化**既有防護 |

> 超出「純 Facade」的唯一修改是 `check.js`。原因：`check.js` 的 `protectedHashes` 對 `GridSystem.js` 做內容雜湊防護，任務授權修改 `GridSystem.js` 就必然需要同步更新該雜湊，否則部署 Gate 無法通過。新增二檔雜湊是為維持防護強度，非擴大功能。未修改任何其他消費者或系統。

## 新增測試

`tests/grid-projection-compat.test.js`（golden-master + 結構）：
- **golden 值於重構前**由未修改的 `GridSystem` 實際輸出擷取（非依公式重寫），以 `assert.deepStrictEqual` **精確**比對（含 `-0` 邊界與浮點原值，不使用寬鬆誤差）。
- 涵蓋：gridToWorld/worldToGrid/snap/round-trip（原點、中央、四角邊界、負數與非整數 world、tile 邊界、origin 偏移）、getCellCenter/getCellDiamond（頂點值與順序）、getFootprintSize/Cells（1×1/2×1/1×2/2×2/3×2、rotation 0–3、順序、奇偶交換）、isInsideGrid/isPlaceableCell、getFootprintPolygon、getAnchor（floorObject/floorDecoration/wallObject × 多尺寸 × rotation 0–3）。
- 結構：`grid.spatialGrid instanceof SpatialGrid`、`grid.projection instanceof IsoProjection`、`projection` 重用同一 `SpatialGrid`、`room/floor/mask` 皆單一來源（參照相等，無複製）、public API 齊備、SpatialGrid 無投影方法、二模組原始碼不含引擎/DOM/儲存與 actor 身份字串。

## 全部測試結果

| 指令 | 重構前 | 重構後 |
|---|---|---|
| `npm test` | 通過 | 通過 |
| `npm run check:deploy` | 通過（44 modules） | 通過（46 modules） |
| `tests/*.test.js` 逐一（Node） | 23 檔全通過 | **24 檔全通過**（新增 1） |

- 總數：24；通過：24；失敗：0；無法執行：0。
- `tests/browser-smoke.test.js` 與 `tests/http.test.js` 在本環境 exit 0（未因缺瀏覽器而失敗）。
- 相容測試 `grid-projection-compat` 通過，證明所有 iso 數值輸出逐項與重構前一致。

## 影響評估

| 面向 | 影響 | 說明 |
|---|---|---|
| 存檔 | 無 | 未觸碰 `SaveAdapter`；key/schema/遷移版本不變；`x/y/r` 不變 |
| Occupancy | 無 | 未修改；仍呼叫 `grid.getFootprintCells`（現委派 SpatialGrid，輸出相同） |
| Placement | 無 | 未修改；`getFootprintCells/isInsideGrid/isPlaceableCell` 輸出相同 |
| Camera | 無 | 未修改；`CameraController` 讀 `room.worldWidth/Height/camera`，與投影拆分無關 |
| 家具拖曳 | 無 | `FurnitureDragController` 未修改；`getAnchor/snapWorldToGrid/...` 輸出相同；觸控偏移數值未動 |
| 貓咪移動 | 無 | `CatBehaviorController` 未修改；`getCellCenter/snapWorldToGrid` 輸出相同；路徑（`grid-pathfinder`）未動 |
| Art Debug | 無 | `ArtDebugRenderer` 未修改；`getFootprintPolygon/getCellCenter` 輸出相同 |
| Depth | 無 | `DepthSystem` 依 anchor 的 worldY，anchor 輸出相同 |

## 玩家可見影響

**無。** 無新功能、無畫面差異、無操作差異、無存檔差異。純內部架構重構。

## 人工驗收狀態

**pending。** 本環境無法啟動瀏覽器，未執行實機畫面驗收，**不宣稱** iso 像素一致已由人工確認。自動化證據為 golden-master 相容測試（數值逐項一致）。專案負責人可執行的人工驗收步驟：

1. 以 HTTP 開啟現行版本（`py -m http.server 8765` → `http://127.0.0.1:8765/`）。
2. 對照重構前後：地板/牆面/入口外觀、家具位置與方向與 anchor、貓咪初始位置與漫遊、Camera 起始位置/拖曳/縮放、家具選取/旋轉/拖曳/放置/取消、`?artDebug=1` 的格線與 anchor 疊圖，應**無可見差異**。
3. 載入 V0.55.1 舊存檔，確認家具 ID/數量/位置/rotation 不變、重整不重新扣款。

## 禁止事項檢查

| 項目 | 是否新增/修改 |
|---|---|
| FlatProjection | 否（原始碼 grep `FlatProjection` 於 `assets/` 無結果） |
| projectionMode / 投影 feature flag | 否 |
| 第二套 Grid / Occupancy / Placement / Camera / 世界座標 | 否（單一來源，測試斷言參照相等） |
| SaveAdapter Runtime / CURRENT_KEY / schema / 遷移版本 | 否 |
| OccupancySystem / PlacementSystem / StoreLayoutValidator / DepthSystem / grid-pathfinder | 否 |
| CameraController / Camera bounds / zoom / Safari resize | 否 |
| FurnitureDragController 觸控偏移 | 否 |
| room-config / 房間形狀 / 牆 / 入口 / 世界尺寸 | 否 |
| furniture ID / 價格 / footprint / rotation / stationType / interactionSockets / layer / walkBlocking / 素材 | 否 |
| CatBehaviorController / CustomerEntity / CafeScene 顧客演出 | 否 |
| EconomySystem / StationRegistry / CustomerFlowSystem / OrderSystem / ActorTaskSystem | 否（未實作） |
| 玩家店長 / 固定店長外觀 / 店員招募 / StaffEntity / EmployeeRoster / 店員 AI / 排班 / 能力薪資 | 否 |
| manager-only 工作流程 / 角色身份寫入 Grid 或 Projection | 否 |
| 店貓改成店員 | 否 |
| managerProfile / projectionMode 存檔欄位 | 否 |
| Build ID / package version / Phaser 版本 / CDN | 否 |
| HTML / CSS / 貓咪素材 / 角色素材 | 否 |
| 刪除/弱化/跳過既有測試 / 放寬誤差掩蓋公式 | 否 |

## 已知限制

- 人工瀏覽器/實機驗收 **pending**（本環境無瀏覽器）。
- `getAnchor`/`IsoProjection` 仍需讀 `furnitureConfig[type].layer` 以決定 floorDecoration 中心 anchor——此為保留現行行為所必需，非新增耦合；未來若要讓 Projection 完全與家具中繼資料解耦，可在後續任務把 layer 以參數傳入（會改變 Facade 內部傳遞，屬另一次重構）。

## 後續問題（本次不修正，僅記錄）

- **worldToGrid 對房間外座標不夾限**：可回傳負數或超界格（如 `(-40,-10)→{-10.78,1.09}`）。此為現行行為，消費者自行以 `isInsideGrid`/`isPlaceableCell` 過濾。純重構不修正。
- **snapWorldToGrid 會回傳 `-0`**（`Math.round` 對極小負數）：與重構前一致，數學上等同 0；若未來需正規化為 `+0` 應另立任務並更新 golden。

## 回復方式

- **無資料遷移、無存檔變更**，回復不涉及玩家資料。
- 還原步驟：將 `assets/js/systems/GridSystem.js` 還原為重構前單檔實作；刪除 `assets/js/systems/SpatialGrid.js`、`assets/js/systems/IsoProjection.js`、`tests/grid-projection-compat.test.js`；在 `check.js` 還原 `GridSystem.js` 舊雜湊 `b8f1c48f10f9a30a7893a687e17b36ad8724dcb97856c31599478d3a3550f92f`、移除二新雜湊與新測試清單項。
- 無殘留：未留下半套 FlatProjection、第二套 Grid 或暫時性角色架構。

## 下一張任務建議（候選，未核准不執行）

| 候選 | 內容 | 前置 | 風險 | 玩家可見 | 依賴本次 | 與後續關係 |
|---|---|---|---|---|---|---|
| **A：`ARCH-0562-FLAT-PROJECTION-PROTOTYPE`** | 建立淺俯視 `SceneProjection` 變體 + 可切換模式 | 本次 Facade（已完成） | 中（家具 scale/anchor/socket 逐件校準；觸控偏移重校） | **是**（首次可見平面變化） | **是**（直接建立在 `projection` 切換點上） | 為 StationRegistry/顧客/店貓提供最終場景形狀 |
| **B：`ARCH-0562-ECONOMY-EXTRACT`** | 將經濟/營收 commit 從 `CafeScene` 抽為 `EconomySystem`（單一冪等付款入口） | 無（與投影無關） | 低 | 否 | 否 | 為 `OrderSystem` 提供防重複結帳的營收入口 |

- **建議**：若優先「可見平面化進度」選 A；若優先「營運生命感地基且低風險」選 B。兩者皆與本次相容，且不互相阻擋。
- 本文件僅提出候選，**不在本任務開始 A 或 B**。
