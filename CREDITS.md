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

## 第三方程式庫

- Phaser 3.90.0：Phaser Studio Inc.，MIT License；完整記錄見 `THIRD_PARTY_NOTICES.md`。
- Playwright Core 1.55.0：僅供本機 Smoke Test，Apache License 2.0，不包含於瀏覽器執行路徑。

本版本未加入未授權商業遊戲素材，亦未使用開羅遊戲官方角色素材。
