# ARCH-0562-FLAT-PROJECTION-PROTOTYPE 實作結果

- 任務：淺俯視 FlatProjection Prototype 與安全模式切換
- 執行者：Claude Code
- 日期：2026-07-24
- 相關：[decisions DEC-012/DEC-015](./decisions.md)｜[V0561 結果](./V0561_IMPLEMENTATION_RESULT.md)｜[實作計畫 Stage 2](./V056_IMPLEMENTATION_PLAN.md)｜[人工驗收](./V0562_FLAT_PROJECTION_ACCEPTANCE.md)｜[產品決策](./handoffs/V056_PRODUCT_DECISION.md)

## 任務摘要

在 ARCH-0561 的 SpatialGrid/IsoProjection 骨架上，新增第一個**可見的淺斜／淺俯視 `FlatProjection` Prototype**，透過 `?projection=flat` opt-in 啟動。**預設仍為 iso**；非法值安全回退 iso；投影不寫入存檔；家具邏輯座標 `x/y/r`、Occupancy、Placement、Pathfinding 與存檔 key 完全不變。可立即以移除網址參數回到 iso。

## 基線與版本

| 項目 | 基線 | 本次 |
|---|---|---|
| 版本 | V0.55.2-alpha | **V0.56.0-alpha｜淺俯視投影原型版** |
| Build | 0552a | **0560a** |
| package version | 0.55.2-alpha | **0.56.0-alpha** |
| Phaser | 3.90.0（本地 vendor，Canvas） | 不變 |
| 存檔 key | `catCafePhaserV0540` | **不變** |
| sceneSchemaVersion / migrationCompletedVersion | 5401 / 5401 | **不變** |
| Git | 此環境不包含 `.git` | 同上 |

## FlatProjection 數學模型

可逆二維 basis 投影：`world = origin + gridX·axisX + gridY·axisY`；`worldToGrid` 以同一 2×2 basis 反解。全部參數集中於 `FLAT_PROJECTION_PARAMS`（[FlatProjection.js](../assets/js/systems/FlatProjection.js)），origin 由房間尺寸推導（無散落 magic number）。

| 參數 | 值 | 說明 |
|---|---|---|
| axisX | `{x:112, y:0}` | +1 gridX → 右 112px（欄位純水平，左右清楚） |
| axisY | `{x:26, y:84}` | +1 gridY → 下 84px、右 26px（列往內縮並淺斜） |
| origin | `{x:185, y:266}`（由 worldCenter − gridCentroid 推導） | 使 10×8 floor 置中於世界中心 |
| determinant | `9408`（非零） | 保證可逆 |
| world bounds | 所有 cell 角落落在 x∈[116,1444], y∈[224,896]，在 1560×1120 世界內含邊距 | 不裁切、無黑邊 |

### 與 2:1 iso 的幾何差異
- iso 是對稱菱形（tile 128×64，2:1，寬而扁）；flat 是**右傾平行四邊形**：上下緣水平（axisX.y=0）、列往下並向右淺斜。
- flat 較 iso **更平、更窄、更善用垂直空間** → 直立手機上 10×8 房間更易一眼讀懂牆面／地板／入口／行走區。
- 仍保有前後（列）與左右（欄）方向，**非正射純頂視**。
- 家具四方向素材（iso 透視）仍沿用；在較平的 flat 地板上會有輕微透視落差（Prototype 可接受，逐件校準為後續 Codex 任務）。

## Projection 選擇機制

- 純解析器 [projection-mode.js](../assets/js/core/projection-mode.js)：`resolveProjectionMode(raw)` 與 `projectionModeFromSearch(search)`，只回傳 `iso`／`flat`，空／非法／非字串一律回退 `iso`；trim+lowercase；不依賴引擎/DOM/儲存/存檔。
- URL 解析隔離於場景裝配層：`CafeScene.initializeGrid()` 讀 `location.search` → `projectionModeFromSearch()` → `new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode})`。
- `GridSystem` 舊 2 參數 constructor 仍建立 iso（向後相容）；第三參數 `{mode:'flat'}` 在**同一個 SpatialGrid** 上換 FlatProjection；GridSystem 自身不讀 URL。
- **預設模式**：iso（`index.html` 或 `?projection=iso`）。
- **Flat 啟動**：`?projection=flat`；`?projection=flat&artDebug=1` 疊 Art Debug。
- **非法值**（`?projection=abc`、空值）：回退 iso，不空白、不報錯。
- **是否寫入存檔**：**否**（模式僅由網址參數決定）。

## Iso 保護

`IsoProjection.js` **未修改**（SHA-256 與 ARCH-0561 相同：`7b24bd…`）。iso golden-master 測試 `grid-projection-compat.test.js` 期望值未動、全綠。iso 房間、家具位置、anchor、Camera、Drag、Art Debug、貓咪移動、存檔讀取皆不變。real-browser（Chrome）iso 畫面正常（見 `docs/evidence/v0562/desktop-iso.png`）。

## 房間 rendering 差異

- iso branch（`CafeScene.drawRoom`）**未改**（僅在最前面加一行 `if(flat) return drawRoomFlat()`）。
- flat branch（新 `drawRoomFlat`）完全由投影後外框與 per-cell polygon 推導：地板格、房間邊界（四邊描邊）、後方牆面（上緣水平帶）、入口高亮、牆飾置於後牆。唯一本地 render 常數為 flat 後牆高度 `176`。
- Ambient 窗光／塵埃使用 iso-specific origin 座標，flat 模式**刻意省略**（已記為已知限制）。

## 家具素材沿用狀況

- **沿用全部素材**：未重畫、未改 furniture ID／textureByDirection／footprint／rotation／stationType／interactionSockets／price／unlock／layer／walkBlocking。
- 47 件在 flat 模式皆可載入、顯示、選取、旋轉、拖曳、放置／取消（測試 + real-browser 佐證）。
- 家具 sprite 仍為 iso 透視，落在較平地板上有輕微視覺落差（Prototype 預期）。

## 家具 Flat 顯示 override 清單

**無。** 本次未加入任何 projection-specific 顯示 override（scale/origin/offset）。所有家具沿用既有顯示相容層 `getFurnitureDisplayState`。逐件校準留待候選任務 `ART-0563-FLAT-FURNITURE-CALIBRATION`（Codex）。

## Drag 與 pointer 處理

- 家具拖曳、ghost、footprint、rotate、放置、取消全數透過 GridSystem Facade（現委派 flat projection 的 `getAnchor/getCellCenter/getCellDiamond/getFootprintPolygon/snapWorldToGrid`）。
- **未修改** `FurnitureDragController` 的觸控偏移數值（`-36`）。本次以自動化＋靜態截圖驗證；觸控實機拖曳精度屬人工驗收 pending 項（見 acceptance）。若日後 flat 實機發現偏移，再將該值改為 projection-aware 並集中管理（本次未觸發）。

## 影響評估

| 面向 | 影響 |
|---|---|
| 存檔 | 無（未觸碰 SaveAdapter；key/schema/遷移版本不變；projection 不入存檔） |
| Occupancy | 無（投影無關；flat/iso 邏輯結果相同，測試斷言） |
| Placement | 無（同上） |
| Pathfinding | 無（純 cols/rows；投影無關） |
| Camera | 無（未修改；flat floor 已置中於世界中心並落在既有 bounds） |
| Depth | 無（依 anchor worldY，flat 仍有 worldY） |
| Art Debug | flat 下正確（footprint polygon／anchor／socket 對齊 flat grid，見 art-debug 截圖） |

## 修改／建立檔案

| 檔案 | 動作 | 用途 | 必要性 |
|---|---|---|---|
| `assets/js/systems/FlatProjection.js` | 建立 | 淺俯視投影 | 核心 |
| `assets/js/core/projection-mode.js` | 建立 | 純模式解析器 | 核心 |
| `assets/js/systems/GridSystem.js` | 修改 | 第三參數選擇投影（預設 iso） | 核心 |
| `assets/js/scenes/CafeScene.js` | 修改 | 解析模式 + flat 房間 branch | 核心 |
| `tests/projection-mode.test.js` | 建立 | 解析器測試（E） | 測試要求 |
| `tests/flat-projection.test.js` | 建立 | flat round-trip/geometry/footprint/anchor + GridSystem 選擇 + 整合（B–D,F,G） | 測試要求 |
| `assets/js/config/build-info.js` | 修改 | Build 0560a、版本名 | 版本 |
| `index.html` | 修改 | data-build-id、HTML build id、標題／版本字串、module/asset query 0560a | 版本 |
| `manifest.webmanifest` | 修改 | 版本描述、start_url／icon query 0560a | 版本 |
| `package.json`／`package-lock.json` | 修改 | version 0.56.0-alpha | 版本 |
| 全部 `assets/js/**/*.js` | 修改（機械） | module import query `?v=0552a→0560a` | 版本 cache-bust |
| `assets/js/config/cat-config.js` | 修改 | `CAT_ASSET_VERSION 0560a` | 版本（見下） |
| `assets/js/config/furniture-visual-config.js` | 修改 | `FURNITURE_REDRAW_ASSET_VERSION 0560a` | 版本（見下） |
| `check.js` | 修改 | 版本/Build 斷言、obsolete `?v=0552a`、import-query 0560a、protected hashes（GridSystem 更新 + FlatProjection/projection-mode 新增）、required、tests、cat 版本 pin | 版本＋合法變更後保護更新 |
| `tests/build-consistency.test.js` | 修改 | 版本/Build/obsolete/cat pin 斷言 | 版本 |
| `tests/browser-smoke.test.js` | 修改 | build id 斷言 0560a | 版本 |
| `README.md` | 修改 | 目前版本資訊 + Flat Prototype 說明 | 版本／文件 |
| `docs/evidence/v0562/*.png` | 建立 | real-browser 截圖證據 | 驗收 |
| `docs/*`（見文件更新） | 建立/修改 | 結果、驗收、現況、決策、devlog、roadmap | 文件 |

> **資產版本說明**：`furniture-asset-validator.js` 硬編碼期望 redraw PNG 的 `?v=` 版本（原與 build 同步為 0552a）。因此本次將 `FURNITURE_REDRAW_ASSET_VERSION` 與 `CAT_ASSET_VERSION` 一併升為 `0560a`，使 runtime 路徑、驗證器與測試一致；素材檔本身未變（僅 cache-bust query）。check.js 與 build-consistency 的 cat 版本 pin 同步更新為 0560a。

## 測試結果

| 指令 | 結果 |
|---|---|
| `npm test` | 通過 |
| `npm run check:deploy` | 通過（Build 0560a、**48 JavaScript modules**） |
| `npm run check:dev` | 通過（含 **real Chrome browser smoke**，Build 0560a） |
| `tests/*.test.js` 逐一（Node，排除 browser-smoke） | **25／25 通過** |
| `tests/browser-smoke.test.js` | **通過**（經 check:dev 以本機 Chrome 實際啟動） |

- 新增測試：`projection-mode.test.js`（E：預設 iso、flat opt-in、非法回退、純度）、`flat-projection.test.js`（B round-trip 與可逆、C cell 幾何與相鄰共邊與 in-bounds、D footprint 邏輯同 iso＋anchor 規則、F GridSystem 選擇、G 整合：iso/flat 邏輯一致＋47 家具有限值＋Occupancy/Placement 一致、純度）。
- iso golden-master：**未修改期望值**，通過。
- 失敗：0；無法執行：0。
- **browser smoke 是否真的啟動瀏覽器**：**是**（playwright-core + 本機 `C:/Program Files/Google/Chrome/Application/chrome.exe`，headless）。

## 瀏覽器與人工驗收

本環境可啟動 Chrome，已產生 real-browser 截圖（`docs/evidence/v0562/`）：

| 檔案 | 視角 / URL | 觀察 |
|---|---|---|
| `desktop-iso.png` | 1440×900 `?projection=iso` | iso 正常（projectionMode=iso），無 page error（一則 favicon.ico 404，非致命） |
| `desktop-flat.png` | 1440×900 `?projection=flat` | flat 平行四邊形地板、後牆、家具在格、兩隻值班貓＋一隻貓、HUD 顯示 V0.56.0-alpha；無 error |
| `mobile-390-flat.png` | 390×844 `?projection=flat` | 直立可讀，地板填滿寬度；無 error |
| `mobile-430-flat.png` | 430×932 `?projection=flat` | 直立可讀；無 error |
| `mobile-390-flat-art-debug.png` | 390×844 `?projection=flat&artDebug=1` | footprint polygon／anchor／socket 對齊 flat grid；無 error |

自動化程式驗證：五個場景皆 `gameReady=1`、`projectionMode` 正確（iso/flat）、flat 場景 `pageerror` 為 0。

**仍為 pending（需產品負責人實機）**：393×852 視角、觸控拖曳/旋轉/放置/取消的手感、pinch zoom、地址列收合、載入舊存檔後 x/y/r 與重整不扣款、切回 iso 對照。清單見 [V0562_FLAT_PROJECTION_ACCEPTANCE.md](./V0562_FLAT_PROJECTION_ACCEPTANCE.md)。**不宣稱**手機實機驗收已通過。

## 存檔與受保護契約

| 項目 | 狀態 |
|---|---|
| CURRENT_KEY | `catCafePhaserV0540`（不變） |
| sceneSchemaVersion / migrationCompletedVersion | 5401 / 5401（不變） |
| furniture x／y／r | 不變 |
| furniture ID / footprint / rotation / stationType / interactionSockets / layer | 不變 |
| projection mode 是否保存 | **否** |

## 玩家可見影響

- **預設 iso 是否改變**：否（預設仍 iso，畫面與 V0.55.2 iso 一致）。
- **Flat 模式是否可見**：是，但僅在 `?projection=flat` opt-in 時。
- **是否有新 UI**：否（無玩家可見投影切換按鈕；HUD/bottom bar/面板未動）。
- **是否影響既有存檔**：否。

## 已知問題

- **Furniture**：家具 sprite 為 iso 透視，於較平 flat 地板上有輕微視覺落差（Prototype 預期；逐件校準 = ART-0563）。
- **Room rendering**：flat 側牆以邊界描邊呈現（非實體側牆）；後牆為薄帶；ambient 窗光／塵埃於 flat 省略。
- **Projection**：flat 家具四方向朝向沿用 iso 語意，某些朝向在 flat 下辨識度較弱（待美術校準）。
- **Mobile**：Art Debug 疊字在 390 寬會重疊（Debug 專用，非正式畫面）。
- **Browser validation**：截圖為靜態；觸控互動、393×852、存檔重整、切回 iso 對照尚待人工實機（pending）。
- **iso**：desktop-iso 有一則 `favicon.ico` 404 主控台訊息（瀏覽器自動請求，非致命，iso/flat 皆會有）。

## 回復方式

- **如何關閉 Flat**：移除網址 `?projection=flat`（或用預設網址）即回 iso；無需其他動作。
- **需還原檔案**：`GridSystem.js`（移除第三參數與 flat/projection-mode import）、`CafeScene.js`（移除 flat branch 與模式解析）。
- **需移除檔案**：`assets/js/systems/FlatProjection.js`、`assets/js/core/projection-mode.js`、`tests/projection-mode.test.js`、`tests/flat-projection.test.js`、`docs/evidence/v0562/`。
- **check.js 回復**：移除 FlatProjection/projection-mode 的 protected hash、required 與 tests 項；還原 GridSystem hash。
- **版本／Build**：如需回退，將 0560a→0552a（build-info、index.html、manifest、package、模組 query、asset 版本常數、check.js/build-consistency/browser-smoke 斷言）。
- **存檔處理**：**不需要**（投影不入存檔、無資料遷移、無玩家資料變更）。
- 所有 flat-specific rendering 與 iso branch 分離；FlatProjection 為獨立模組，可整體移除。

## 是否建議進入下一階段

建議：Flat Prototype 已達「驗證空間可讀性、場景構圖與互動可行性」目標並有 real-browser 證據，**建議提交產品負責人做 Flat 視覺人工驗收**（acceptance 文件）。**在人工視覺核准前，不將 flat 設為正式預設**。核准後，優先候選見下。

## 下一步建議（候選，未核准不執行）

| 候選 | 內容 | 執行者 | 前置 | 玩家可見 | 風險 | 需先完成 Flat 人工驗收？ |
|---|---|---|---|---|---|---|
| **A `ART-0563-FLAT-FURNITURE-CALIBRATION`** | 逐件調 flat scale／origin／offset（不改 footprint/x/y/rotation/Occupancy/socket 邏輯格） | Codex | 本次 flat 介面（已就緒） | 是（家具更貼合 flat 地板） | 低 | 建議先完成，以確定校準方向 |
| **B `ARCH-0563-ECONOMY-EXTRACT`** | 抽 EconomySystem，建立未來 Order: PAID 單一冪等營收入口 | Claude Code | 無（與投影無關） | 否 | 低 | 否 |
| **C `ARCH-0563-STATION-REGISTRY`** | socket 旋轉、可到達性、椅桌配對 | Claude Code | flat 場景幾何與 socket 投影方向確認 | 間接 | 中 | 是（socket 投影需 flat 幾何定案） |

- **最應優先**：若目標是「讓 flat 看起來對」→ **A**（低風險、玩家可見、Codex 可獨立進行、可與 B 平行）。若目標是「營運生命感地基」→ **B**（與投影無關、可立即開始）。**C** 依賴 flat 幾何與 socket 投影方向定案，宜在 A/Flat 驗收後。
- 本文件僅提出候選，**不在本任務執行 A、B 或 C**。
