# 素材與授權紀錄

## 貓咪角色 Sprite Sheet

- 名稱：豆豆、煤球、雪球、拿鐵、花花全身點陣角色與 fallback 貓咪
- 作者：本專案原創製作
- 來源：依專案既有合法角色大頭貼、名字與毛色設定重新設計
- 授權：隨本專案使用
- 修改內容：建立 64×64 Frame、透明背景的 Phaser Sprite Sheet，包含 idle、walk、sit、sleep、happy、serve 與上下方向幀
- V0.55.0 修改：以本地 Pillow 腳本重新製作 walk row 的腳步交替、重心與尾巴節奏；未改變角色識別設計
- 專案路徑：`assets/cats/*/*-spritesheet.png`

## 牆面窗戶與菜單板

- 名稱：左牆像素窗戶、右牆咖啡菜單板
- 作者：本專案原創；以 OpenAI imagegen 產生原創來源稿
- 來源：專案既有咖啡廳前景僅作為色彩與氣氛參考
- 授權：隨本專案使用
- 修改內容：移除 chroma-key、裁切、最近鄰像素縮放並預先依左右牆方向剪切
- 專案路徑：`assets/environment/wall-window.png`、`assets/environment/menu-board.png`

## 貓咪名冊大頭貼

- 名稱：豆豆、煤球、雪球、拿鐵、花花大頭貼
- 來源：V0.53.2 既有專案素材
- 用途：名冊與照顧面板；未縮小作為場景全身角色
- 專案路徑：`assets/cats/*/*-portrait.png`

## 房間、家具、圖示與 Splash

- 來源：專案既有素材與 V0.54.0 原創 Phaser Graphics 房間
- 用途：咖啡廳場景、家具、PWA 圖示與啟動畫面

## V0.55.2 Prototype 家具重繪

- 名稱：25 件 Prototype 家具、四方向共 100 張等角像素 PNG
- 作者：本專案原創；以 OpenAI imagegen 產生逐件原創來源稿，再經本地透明背景、裁切、最近鄰縮放、限色色盤與方向切片流程整理
- 來源：`docs/ART_BIBLE.md` 與既有家具功能 brief；未使用外部遊戲截圖或商業遊戲素材
- 授權：隨本專案使用
- 修改內容：移除 chroma-key／棋盤背景、校正 footprint 尺度、透明邊距、輪廓、光源與四方向 texture
- 專案路徑：`assets/furniture/redrawn/*/*.png`

## 第三方程式庫

- Phaser 3.90.0：Phaser Studio Inc.，MIT License；完整記錄見 `THIRD_PARTY_NOTICES.md`。
- Playwright Core 1.55.0：僅供本機 Smoke Test，Apache License 2.0，不包含於瀏覽器執行路徑。

本版本未加入未授權商業遊戲素材，亦未使用開羅遊戲官方角色素材。
## V0.57.7 Orthogonal 核心家具第一批

- 資產：12 件家具、四方向，共 48 張透明 PNG。
- 製作：OpenAI image generation 依專案 Art Bible 與本任務原創設計；未使用、
  裁切或仿製任何未授權商業遊戲素材。
- 後製：本地 chroma-key 去背、方向切分、等比例縮放、透明邊界與底部中心校準。
- Runtime 路徑：`assets/furniture/orthogonal/{id}/{id}-{direction}.png`。
- 開發來源與處理工具位於 `tools/`，不納入 GitHub Pages 部署 ZIP。

### V0577B 木椅方向校準

- 保留暖木、奶油坐墊、貓耳椅背與貓頭鏤空的專案原創設定，以 OpenAI image
  generation 編修為四個真正 3/4 正交方向。
- 本地工具負責棋盤去背、方向切分、92×126 runtime 尺寸、透明角落與共同接地線。
- 未使用外部遊戲截圖、商業遊戲素材或開羅遊戲官方素材。

### V0577E 正交家具視覺重構第一階段

- 資產：`pinkTableLong`、`chair`、`counter`、`dessert` 四件家具，各四方向，
  共 16 張透明 PNG。
- 作者／來源：本專案原創；以 OpenAI image generation 依既有角色設定及
  `ORTHOGONAL_FURNITURE_VISUAL_SPEC_V1.md` 產生四份 source sheet，再由本地
  工具去除 chroma-key、取主要 alpha 元件、最近鄰縮放、底部置中與加入柔和接地影。
- 設計重點：真正水平／垂直奶油粉長桌、真 cardinal 木椅、可辨識顧客面／店員面
  的吧台，以及可辨識玻璃展示面／服務背面的甜點櫃。
- 開發來源：`tools/v0577e-generated-sources/`；
  透明中間稿：`tools/v0577e-transparent-sources/`；
  處理器：`tools/process-v0577e-orthogonal-furniture.py`。上述開發工具與中間稿
  不納入 GitHub Pages 部署 ZIP。
- Runtime 路徑：
  `assets/furniture/orthogonal/{pinkTableLong,chair,counter,dessert}/*.png`。
- 授權：隨本專案使用；未使用外部遊戲截圖、未授權商業素材或開羅遊戲官方素材。

### V0577K 核准核心家具與雙桌正式整合

- 範圍：`pinkTableLong`、`pinkTableLongHardCafe`、`chair`、`counter`、`dessert`
  共 20 張正式 Orthogonal 透明 PNG。
- 來源：ART-0577G/J 已核准的專案內 workbench 稿，以及本卡為 chair 產生的原創
  四方向 source sheet；由 Codex 以本地裁切、透明化、最近鄰縮放與接地校準整合。
- Runtime 路徑：`assets/furniture/orthogonal/{id}/{id}-{direction}.png`。
- 開發來源與處理工具保留於 `tools/`，不打入 GitHub Pages 部署包。
- 授權：隨本專案使用；未下載或使用未授權商業遊戲素材。
