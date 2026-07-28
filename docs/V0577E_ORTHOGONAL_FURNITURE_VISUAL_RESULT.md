# V0577E 正交家具視覺重構第一階段結果

版本：`V0.57.7-alpha｜正交家具視覺重構第一階段`  
Build：`0577e`  
Task：`ART-0577E-ORTHOGONAL-FURNITURE-VISUAL-REDESIGN-PHASE1`

## 完成內容

1. 新增 [Orthogonal 家具視覺規格 v1](./ORTHOGONAL_FURNITURE_VISUAL_SPEC_V1.md)。
2. 重畫 `pinkTableLong` 四張 Runtime PNG：r0/r2 為真正水平長桌，
   r1/r3 為真正垂直深向長桌；桌面取代側板成為主要視覺。
3. 重畫 `chair` front/right/back/left；左右是窄側面而非斜 3/4 翻版。
4. 重畫 `counter`：South 顧客封閉面、North 店員開放層架、West/East 窄端面。
5. 重畫 `dessert`：South 甜點展示面、North 後方服務門、West/East 玻璃端面。
6. 16 張 PNG 保持原檔名、RGBA 透明、原畫布尺寸與底部中心 anchor；override
   資產 query 更新為 `0577e`。
7. 0577d 的唯一 resolver、edit-session envelope、`fixed/axis2/cardinal4`、
   Preview／Ghost／Entity／commit／Occupancy 共用候選全部保留。

## 可重建美術管線

- OpenAI imagegen 依既有合法素材與 Art Bible 產生四方向原創母稿。
- 來源稿保留於 `tools/v0577e-generated-sources/`。
- `remove_chroma_key.py` 產生透明母稿於 `tools/v0577e-transparent-sources/`。
- `tools/process-v0577e-orthogonal-furniture.py` 依 cardinal 順序切分、保留最大
  連通主體、最近鄰縮放、共同接地線與短陰影，輸出 16 張 Runtime PNG。
- 工具與來源不進部署 ZIP；正式 Runtime 只載入本地 PNG。

## 驗收證據

- 長桌：`docs/evidence/v0577e/table-axis-*.png`、
  `table-pair-horizontal.png`。
- 木椅：`chair-{south,west,north,east}.png`、`chair-cardinal-ring.png`。
- 吧台／展示櫃：`counter-*.png`、`dessert-*.png`。
- 整體構圖：`orthogonal-demo-layout.png`。
- 機器數據：`metrics.json`。
- 靜態素材總覽：`tools/art-reference/v0577e/runtime-cardinal-contact-sheet.png`
  （開發來源，不打包）。

## 不變契約

`catCafePhaserV0540`、schema 5401、migration 5402、家具 ID／footprint／
`x/y/r`／價格／station/socket、10×8 Grid、78 playable cells、入口 `(7,0)/(8,0)`、
CameraController、Placement、Occupancy、Pathfinding、iso 預設與 flat/invalid
fallback 均未改。

## 範圍限制

- 只重畫第一批中的 4 件；其餘第一批 8 件維持 ART-0577 素材。
- 其餘 35 件仍為 base visual，第二批未核准。
- 未實作桌椅自動拼接、貓咪家具互動或營業系統。
- iPhone Safari 真機仍 pending；Chrome 自動化不替代真機。
