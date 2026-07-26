# 貓咪咖啡廳 V0.57.5-alpha

版本：`V0.57.5-alpha｜正交滿版操作修正版`  
Build ID：`0575a`

V0.57.5-alpha 修好 **`OrthogonalProjection`（正交平面）手機的滿版取景與 Zoom/Pan 操作**（修 zoom/pan、滿版與分區視覺，**非家具重畫**）：**P0 修好放大後無法平移**——根因是互動平移直接位移 `scrollX/Y` 後，clamp 讀到只在 `preRender` 更新的**過期 `camera.midPoint`** 再 `centerOn` 回去，把平移量歸零；改由**即時 `scrollX + width/2`（`viewCentre()`）**推導中心，zoom-in 後 X/Y 皆可 pan、四邊 clamp、minZoom 看整房。**清除左右不明深色直條**（`zoneFloor.outer` 由暗色改中性淺色地板、全 tint 低對比）。**顯著減少四周留白**（`marginCss 10→8`、`toolbarReserveCss 78→40`、背牆做成**有家具的較高背牆** wallHeight 155→260/coreTopStrip 138→220/doorHeight 118→168 ＋ **wainscot 護牆板**、房外背景近地板暖色），上下留白由 V0574 ~44px 降至 **~18px（390/393）/26px（430）**。**cell 88×120 不變、未重畫家具、未建第二套 CameraController；門在 x7-8＋88×120 使 portrait 天生 width-constrained，無法在不裁門下 100% 填滿（單件家具未放大）。預設仍為 2:1 等角（iso）**；Orthogonal 仍 opt-in、等手機實機驗收。**存檔 key `catCafePhaserV0540`（schema/migration 5401）、logical 存檔入口 `(8,7)/(9,7)`、家具 `x/y/r`／footprint／Occupancy／Placement／Pathfinding 皆不變，投影/camera/demoLayout 不寫入存檔。** 等角家具在正交地板仍為 Placeholder（透視待 `ART-0576`）。

## 投影模式（V0.57.5）

- 預設（iso）：`index.html` 或 `?projection=iso`
- **Orthogonal 正交平面**：`?projection=ortho`（別名 `?projection=orthogonal`）
- **Orthogonal + Demo 構圖（不寫存檔）**：`?projection=ortho&demoLayout=1`
- 疊 Art Debug：於上述後加 `&artDebug=1`（如 `?projection=ortho&demoLayout=1&artDebug=1`）
- Flat（已拒絕，保留回歸）：`?projection=flat`（含 `flatPreset=near-iso/balanced/current`）
- 非法 `projection`（如 `?projection=abc`）安全回退 iso。
- 投影模式與 `demoLayout` 皆**不寫入存檔**；重整後由網址參數決定。
- 滿版取景與 Zoom/Pan 修正見 [V0575 結果](./docs/V0575_ORTHOGONAL_FULLBLEED_PAN_RESULT.md)、[V0575 人工驗收](./docs/V0575_ORTHOGONAL_FULLBLEED_PAN_ACCEPTANCE.md)、[before/after 比較 HTML](./docs/V0575_ORTHOGONAL_FULLBLEED_PAN_COMPARISON.html)、截圖與指標 `docs/evidence/v0575/`；前一版分區辨識見 [V0574 結果](./docs/V0574_ORTHOGONAL_COMPOSITION_RESULT.md)。
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
