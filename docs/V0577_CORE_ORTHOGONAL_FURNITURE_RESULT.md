# V0.57.7 核心正交家具第一批｜實作結果

## 任務

- Task：`ART-0577-CORE-ORTHOGONAL-FURNITURE-PASS-1`
- 版本：`V0.57.7-alpha｜核心正交家具第一批版`
- Build：`0577a`
- 日期：2026-07-27

## 結果摘要

完成 12 個既有 furniture ID 的 Orthogonal 專用視覺：

| 分區 | ID |
|---|---|
| 服務 | `counter`, `coffeeMachine`, `oven`, `washStation`, `dessert`, `smartOrder` |
| 座位 | `pinkTableLong`, `roundTable`, `chair`, `creamSofa` |
| 貓咪 | `doubleCatTree`, `scratchPost` |

每件家具提供 `down-right`、`down-left`、`up-right`、`up-left` 四張透明 PNG，
共 48 張。圖面採正面／背面正交讀法、暖木色咖啡廳色盤、底部中心 anchor；
雙格家具在正面方向保留橫向跨度，旋轉到側面時呈現較窄輪廓。

## 素材管線

1. 以專案 Art Bible 與既有 ID 功能為 brief 產生原創 2×2 四方向來源。
2. 使用本地 chroma-key helper 去背，不在 runtime 解碼或處理來源稿。
3. `tools/process-v0577-ortho-furniture.py` 依固定 quadrant 切分方向。
4. 同一家具的四方向使用同一縮放係數，放入相同尺寸透明 canvas。
5. 圖像以底部中心對齊，Runtime 統一 `origin={x:0.5,y:1}`、`scale=1`。

正式資產位於：

```text
assets/furniture/orthogonal/{id}/{id}-{direction}.png
```

`tools/` 僅保存可重建來源與 QA contact sheet，不進部署 ZIP。

## Projection-specific override

新增：

- `assets/js/config/orthogonal-furniture-visuals.js`

調整：

- `furniture-visual-config.js`：`getFurnitureVisualDefinition(id, projectionMode)`
- `furniture-display-state.js`：顯式接收 projection
- `FurnitureEntity.js`：使用 `grid.projectionMode`
- `FurnitureDragController.js`：Ghost 與正式 Entity 使用同一 display selector
- `BootScene.js`：預載 base 與 ortho texture，個別失敗仍有 fallback
- `StorePanel.js`／`UiBridge.js`：商店縮圖依目前 Scene projection 選圖

只有 `projectionMode === 'ortho'` 才合併 override。未指定、`iso`、`flat` 與非法
projection 皆回傳原本的 `FURNITURE_VISUAL_CONFIG` 物件。

## 明確未變

- 47 個 furniture ID 與 `furniture-config.js`
- footprint、`x/y/r`、價格、解鎖、layer
- stationType、interactionSockets、walkBlocking
- Occupancy、Placement、preview/commit evaluation
- 10×8 Grid、78 playable cells
- 正式入口 `(7,0)`／`(8,0)`
- CameraController、camera-framing、OrthogonalProjection 幾何
- `catCafePhaserV0540`
- `sceneSchemaVersion=5401`
- `migrationCompletedVersion=5402`
- iso 預設與 rollback、flat 回歸路徑

## 自動驗證

- 新增 `tests/orthogonal-furniture-visuals.test.js`
  - 精確 12 ID
  - 48 個唯一 texture key／path
  - 每方向不 mirror、不 fallback
  - PNG 可解碼、透明四角、非空
  - gameplay metadata 與 base 相同
  - iso／flat／invalid selector identity 不變
- HTTP 測試實際請求 48 張新 PNG，驗證狀態、content type 與 PNG signature。
- Browser smoke 使用本機 Chrome 與 Edge：
  - 8 個既有 viewport、fresh／legacy save
  - ortho existing／demo
  - root、iso、flat、ortho、orthogonal alias、demo、Art Debug、invalid
  - StorePanel 依 projection 切換 12 個縮圖
  - 170 個 furniture texture，0 failed，0 fallback
  - 0 pageerror、0 failed request、0 console fatal

## 視覺驗證

真實 Chrome 截圖位於 `docs/evidence/v0577/`：

- 390×844、393×852、430×932 Orthogonal Demo
- 390×844 服務區、座位區、貓咪區
- 390×844 多件家具旋轉
- 390×844 Art Debug
- 1440×900 Orthogonal Demo
- iso 回歸
- Orthogonal 商店縮圖
- `metrics.json`

## 誠實限制

- iPhone Safari 真機尚未測試，不能宣稱通過。
- 本批只重畫 12 件；其餘 35 件沿用既有視覺，因此 Demo 中仍可看到舊等角素材。
- 本版不把 Orthogonal 設為預設，不進行第二批家具，也不新增營運行為。

