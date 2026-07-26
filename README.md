# 貓咪咖啡廳 V0.57.6-alpha

版本：`V0.57.6-alpha｜正交互動與入口清理版`  
Build ID：`0576b`

## V0.57.6-alpha：正交互動與入口清理

`ARCH-0576A` 修正 iPhone 尺寸的家具 context toolbar：Rotate／Store／Sell／Cancel
均為至少 44×44 CSS px 的真實觸控目標，Cancel 會同時清除 drag、selection、
InputMode 與 Camera lock，且不修改家具資料。正交 Room Skin 左右／下框架縮為手機
初始視角約 8–16 CSS px；上牆維持完整。

正式入口現在由 `ortho-room-zones.js` 的 `logicalEntranceZone` 唯一產生 mask：
`(7,0)/(8,0)` 為 reserved，舊 `(8,7)/(9,7)` 已釋放，10×8 Grid 仍有 78 格
playable。存檔 key 與 schema 維持不變；migration 5402 將入口衝突家具完整 archive
後安全入庫且只執行一次。Demo 使用唯讀存檔 Adapter，不會遷移或寫入玩家資料。

- [結果](./docs/V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_RESULT.md)
- [驗收](./docs/V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_ACCEPTANCE.md)
- [Before / After](./docs/V0576B_ORTHOGONAL_INTERACTION_ENTRANCE_COMPARISON.html)
- 真實 Chrome 證據：`docs/evidence/v0576b/`
- 新增測試：`npm.cmd run test:entrance`

## V0.57.6-alpha：可玩區與 Room Skin（0576a 歷史）

`ARCH-0575C` 將正交房間的「可放置地板」與「不可放置的視覺外殼」正式分離。`placeableMask` 仍是唯一放置真相：78 個可放置 cell 使用明亮分區地板；兩個保留入口 cell 使用門檻材質；Grid 外的滿版區改為深木固定建築帶、嵌板與雙層收邊，不再偽裝成可放置地板。新 `assets/js/config/ortho-room-skin.js` 集中管理牆面、護牆板、收邊、地板 palette、門幾何／樣式與牆飾 anchor；`OrthogonalProjection` 回到純幾何職責。

家具拖曳的紅綠預覽與 pointerup 提交現在共用 `FurnitureDragController.evaluateCandidate()` 的同一評估快照；候選座標或旋轉變更會使快照失效並重新驗證。新增 1×1、1×2、2×2 邊界案例、shell 外點、保留入口與「綠色 preview 不可在未變更時 commit fail」回歸測試。V0575/V0575B 的 Camera zoom/pan/clamp、88×120 cell、Grid、Occupancy、Placement、存檔 key `catCafePhaserV0540` 及 furniture `id/x/y/r/footprint` 均保持。

- 結果：[V0576 正交可玩區與 Skin 結果](./docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_RESULT.md)
- 驗收：[V0576 驗收表](./docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_ACCEPTANCE.md)
- 比較：[V0576 before/after](./docs/V0576_ORTHOGONAL_PLAYABLE_AREA_AND_SKIN_COMPARISON.html)
- 證據：`docs/evidence/v0576/`
- 新測試：`npm.cmd run test:ortho-area`

## V0.57.5B 基線（歷史）

V0.57.5-alpha（Build 0575b）在 Zoom/Pan 實機通過（**核心凍結**）後，修正 **`OrthogonalProjection`（正交平面）的房間外殼滿版與入口門比例**（**不重構 Camera、不重畫家具**）：留白根因是房間視覺外殼只畫到邏輯 10×8 Grid，改為把**牆面＋地板視覺外殼畫到超出 Grid**（`ORTHOGONAL_ROOM_RENDER.shell`）延伸至 safe viewport 邊緣，手機首屏外圈房外背景由 ~18px 降至 **~0px**（純視覺、**不新增 placeable cells**、不改 Grid/存檔；以細牆腳線取代粗矩形卡片外框）。**視覺門與邏輯入口分離**：`logicalEntranceZone` 維持兩格 x7-8，新增較小 `visualDoorBounds`（**~1.4 格、123×124 world px、置中 x7-8、x9 牆**），門改為分層繪製（門框＋玻璃格窗＋黃銅門把＋木門扇，非深色黑洞/倉庫門）。**CameraController 核心未改**（`viewCentre`/pan/clamp 凍結，real-browser 拖曳 pan 回歸通過）。**cell 88×120、`customerEntryPoint (8,0)`／staging／舊存檔入口 `(8,7)/(9,7)`／存檔 key `catCafePhaserV0540`（schema/migration 5401）／placeableMask／Grid／Occupancy／Placement／Pathfinding 皆不變。預設仍為 2:1 等角（iso）**；Orthogonal 仍 opt-in、等手機實機驗收。等角家具與門在正交地板仍為 Placeholder/Prototype（正式素材待 `ART-0576`）。

## 投影模式（V0.57.5）

- 預設（iso）：`index.html` 或 `?projection=iso`
- **Orthogonal 正交平面**：`?projection=ortho`（別名 `?projection=orthogonal`）
- **Orthogonal + Demo 構圖（不寫存檔）**：`?projection=ortho&demoLayout=1`
- 疊 Art Debug：於上述後加 `&artDebug=1`（如 `?projection=ortho&demoLayout=1&artDebug=1`）
- Flat（已拒絕，保留回歸）：`?projection=flat`（含 `flatPreset=near-iso/balanced/current`）
- 非法 `projection`（如 `?projection=abc`）安全回退 iso。
- 投影模式與 `demoLayout` 皆**不寫入存檔**；重整後由網址參數決定。
- 房間外殼滿版與門比例見 [V0575B 結果](./docs/V0575B_ORTHOGONAL_ROOM_SHELL_RESULT.md)、[V0575B 人工驗收](./docs/V0575B_ORTHOGONAL_ROOM_SHELL_ACCEPTANCE.md)、[before/after 比較 HTML](./docs/V0575B_ORTHOGONAL_ROOM_SHELL_COMPARISON.html)、截圖與指標 `docs/evidence/v0575b/`；前一版 Zoom/Pan 修正見 [V0575 結果](./docs/V0575_ORTHOGONAL_FULLBLEED_PAN_RESULT.md)、`docs/evidence/v0575/`。
- 正交房間原型見 [V0570 結果](./docs/V0570_ORTHOGONAL_ROOM_RESULT.md)、[V0570 驗收](./docs/V0570_ORTHOGONAL_ROOM_ACCEPTANCE.md)、[家具重作計畫](./docs/V0570_ORTHOGONAL_ASSET_REBUILD_PLAN.md)、截圖 `docs/evidence/v0570/`；前版 Flat 見 [V0561 構圖比較](./docs/V0561_FLAT_PRESET_COMPARISON_RESULT.md)。

## V0.55.2 家具重繪內容（前版，保留）

V0.55.2-alpha 將 V0.55.1 稽核出的 25 件白底／文字 Prototype 全面替換為原創 2:1 等角透明 PNG。遊戲世界、Grid、Occupancy、Placement、Camera、貓咪 AI、經濟數值與存檔 key 均沿用既有 Phaser 架構。以下為該版詳細：

- 25 件 Prototype 全部重繪，P0 10 件／P1 9 件／P2 6 件。
- 每件提供 `down-right`、`down-left`、`up-right`、`up-left` 四張原生方向圖，共 100 張 RGBA PNG。
- 白色圖卡、圖片內名稱與執行時 SVG 已從正式 Loader／商店移除。
- 原 furniture ID、名稱、價格、meta、解鎖、footprint、layer、rotation 與存檔座標完全不變。
- `furniture-visual-config.js` 集中提供方向 texture key、相對路徑、scale、anchor、station、socket 與 walkBlocking。
- 24 件升級為 `production`；`childrenPlayArea` 為可用的 `redraw`，陰影邊緣保留後續像素精修；Prototype remaining 為 0。
- 本版不包含店員 AI、顧客 AI、訂單流程或故事系統。

文件：

- [Art Bible](./docs/ART_BIBLE.md)
- [家具完整稽核](./docs/FURNITURE_AUDIT.md)
- [Prototype 重繪計畫](./docs/PROTOTYPE_REDRAW_PLAN.md)
- [逐件重繪結果](./docs/PROTOTYPE_REDRAW_RESULT.md)
- [前後 Contact Sheet](./docs/PROTOTYPE_REDRAW_CONTACT_SHEET.html)
- [人工瀏覽器驗收](./docs/V0552_MANUAL_BROWSER_ACCEPTANCE.md)

## 專案治理與交接

- [代理協作規範](./AGENTS.md)
- [Claude Code 操作指南](./CLAUDE.md)
- [專案決策紀錄](./docs/decisions.md)
- [開發日誌](./docs/devlog.md)
- [目前狀態](./docs/current-state.md)
- [暫定路線圖](./docs/roadmap.md)
- [Task Card 模板](./docs/templates/TASK_CARD.md)
- [V0.55.2 → Claude Code 交接](./docs/handoffs/V0552_TO_CLAUDE.md)

## 執行時素材與相容性

新素材位於 `assets/furniture/redrawn/{id}/{id}-{direction}.png`。舊 SVG 留在原路徑作歷史稽核，但正式 `BootScene` 與 `StorePanel` 不再讀取它們。舊存檔以相同家具 ID 自動顯示新圖，無需 ID migration，也不會搬動家具或重新扣款。

正式存檔 key 固定為 `catCafePhaserV0540`；Phaser 固定使用本地 `assets/vendor/phaser-3.90.0.min.js`。GitHub Pages 不需要 `node_modules`、`tools` 或 CDN。

## Art Debug

```text
http://127.0.0.1:8765/?artDebug=1
http://127.0.0.1:8765/?artDebug=1&artFilter=v0552
http://127.0.0.1:8765/?artDebug=1&artFilter=redraw
http://127.0.0.1:8765/?artDebug=1&artFilter=missing-direction
```

Debug 顯示 sprite bounds、anchor、footprint、socket、方向、texture 路徑、scale、分類及 fallback；不攔截 Pointer、不修改存檔，正常網址不顯示。

## 本機啟動

ES Modules 必須透過 HTTP server 載入，不能使用 `file://`：

```powershell
cd "C:\Users\rober\Desktop\貓咪咖啡廳"
py -m http.server 8765
```

開啟 `http://127.0.0.1:8765/`。

## 測試

```powershell
npm.cmd test
npm.cmd run test:interaction
npm.cmd run test:ai
npm.cmd run test:drag
npm.cmd run test:care
npm.cmd run test:animation
npm.cmd run test:prototype-redraw
npm.cmd run test:furniture-assets
npm.cmd run test:furniture-redraw-direction
npm.cmd run test:furniture-id
npm.cmd run test:furniture-footprint
npm.cmd run test:furniture-store-reenable
npm.cmd run test:furniture-save-redraw
npm.cmd run test:http
npm.cmd run check:deploy
```

`test:browser`／`check:dev` 需要本機 Chrome 或 Edge。若自動化環境沒有瀏覽器，版本維持 alpha，依人工驗收文件在實際裝置完成最後檢查；這不影響靜態檢查與部署 ZIP 產出。

## GitHub Pages

將部署 ZIP 根目錄內容直接發布即可。正式 Runtime 僅使用相對路徑、內建 Phaser 與 PNG 素材，不依賴 `node_modules`、Python、Pillow、生成工具或外部 CDN。
