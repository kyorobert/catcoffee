# ART-0577K 正式整合結果

## 結論

`ART-0577K-APPROVED-CORE-ORTHOGONAL-FURNITURE-FORMAL-INTEGRATION` 已整合為
`V0.57.7-alpha｜核准核心正交家具正式素材與雙桌商品整合版`，Build `0577k`。
package version 維持 `0.57.7-alpha`。

本卡把產品已核准的概念稿轉成正式 Phaser Runtime 素材與資料，不沿用概念 Gate 的
screen-space 合成作為完成證據。

## 正式商品

- `pinkTableLong`：保留既有 ID、價格、`[2,1]` footprint 與 axis2 契約；正式商品為
  SoftCute 版本。
- `pinkTableLongHardCafe`：新增獨立商品 ID，價格與 `[2,1]` footprint 和 SoftCute
  相同；不取代、不遷移、不自動贈送給既有玩家。
- `chair`：保留 cardinal4，正式四方向皆有獨立透明 PNG。
- `counter`：保留 cardinal4；顧客面是雙貓掌櫃門，員工面是開放收納。
- `dessert`：保留 cardinal4；顧客面與左右面保留蛋糕／玻璃展示，背面為關閉工作面。

正式 Orthogonal 目錄由 48 張增加為 52 張 PNG：4 個既有 ID 共 16 張正式改圖，
加上 HardCafe 4 張新圖；其餘 8 個第一批 ID 的 32 張 PNG 未變。
完整 SHA-256 差異見
[`formal-asset-diff.json`](./evidence/v0577k/formal-asset-diff.json)。

## Runtime 接線

- `ORTHOGONAL_FIRST_BATCH_FURNITURE_IDS` 固定保存原第一批 12 件。
- 正式 Orthogonal override catalog 為 13 件（第一批 12 件 + HardCafe）。
- SoftCute 與 HardCafe 共用 axis2 rotation policy，但使用不同正式 ortho texture。
- Store、placed entity、Ghost、preview、rotate commit 仍經既有 visual selector。
- `/`、`?projection=iso` 與 `?projection=flat` 使用 base visual；ortho 仍為 URL opt-in。
- Save key `catCafePhaserV0540`、schema `5401`、migration `5402` 未變。

## Option C 實景佈局

`?projection=ortho&demoLayout=1` 改為 16 件真實 Grid fixture：

- 服務帶：`counter → coffeeMachine → washStation → dessert`。
- SoftCute 與 HardCafe 各自形成獨立桌椅島。
- 貓區保留可達動線，不使用未核准地毯。
- fixture 經 Grid、Occupancy、Placement 與 BFS 測試；不寫入正式存檔。

## 驗證證據

- 真實 Phaser Runtime：[`docs/evidence/v0577k/`](./evidence/v0577k/)
- 旋轉、指標與 projection 量測：
  [`metrics.json`](./evidence/v0577k/metrics.json)
- 實景 demo：`orthogonal-demo-layout.png`、`orthogonal-demo-layout-393.png`、
  `orthogonal-demo-layout-430.png`、`orthogonal-demo-layout-desktop.png`
- 雙桌同場：`dual-table-products.png`
- 四向椅：`chair-cardinal-ring.png`

## 受保護契約

未修改 Grid 幾何、78 playable cells、入口 `(7,0)/(8,0)`、CameraController、
PlacementSystem、OccupancySystem、Pathfinding、貓咪 Runtime／素材或 migration。
第二批 35 件家具未開始。

## 尚待人工 Gate

iPhone Safari 真機的家具辨識、拖曳、旋轉、pinch 與網址列變化驗收仍為 pending；
Chrome／Edge 自動化不能取代該 Gate。下一張 P0 建議仍為
`ANIM-0578-CAT-LOCOMOTION-AND-DIRECTIONAL-STATE-AUDIT`。
