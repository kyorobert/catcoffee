# V0.55.2-alpha Prototype 家具重繪結果

完成日期：2026-07-23

## 摘要

- 原 Prototype：25 件（P0 10／P1 9／P2 6）
- 完成重繪：25 件
- 新增執行時素材：100 張透明 RGBA PNG（每件四方向）
- production：24 件
- redraw：1 件（`childrenPlayArea` 已可正式顯示，陰影邊緣保留後續像素精修）
- Prototype remaining: 0
- 舊 SVG：保留作 V0.55.1 歷史稽核，正式 Loader 與商店不再引用

## 逐件結果

| 批次 | ID | 名稱 | Footprint | 最終狀態 | 方向 | 新素材目錄 | 備註 |
|---|---|---|---:|---|---:|---|---|
| P0 | `squareCafeTable` | 方形咖啡桌 | 1×1 | production | 4 | `assets/furniture/redrawn/squareCafeTable/` | 完成 |
| P0 | `windowHighChair` | 窗邊高腳椅 | 1×1 | production | 4 | `assets/furniture/redrawn/windowHighChair/` | 完成 |
| P0 | `wallBench` | 靠牆長椅 | 2×1 | production | 4 | `assets/furniture/redrawn/wallBench/` | 完成 |
| P0 | `catEarChair` | 貓耳造型椅 | 1×1 | production | 4 | `assets/furniture/redrawn/catEarChair/` | 完成 |
| P0 | `creamSofa` | 奶油雙人沙發 | 2×1 | production | 4 | `assets/furniture/redrawn/creamSofa/` | 完成 |
| P0 | `pawSofa` | 貓掌造型沙發 | 2×1 | production | 4 | `assets/furniture/redrawn/pawSofa/` | 完成 |
| P0 | `cardboardNest` | 紙箱小窩 | 1×1 | production | 4 | `assets/furniture/redrawn/cardboardNest/` | 完成 |
| P0 | `scratchPost` | 貓抓柱 | 1×1 | production | 4 | `assets/furniture/redrawn/scratchPost/` | 完成 |
| P0 | `windowHammock` | 窗邊吊床 | 1×1 | production | 4 | `assets/furniture/redrawn/windowHammock/` | 完成 |
| P0 | `doubleCatTree` | 雙層貓跳台 | 1×2 | production | 4 | `assets/furniture/redrawn/doubleCatTree/` | 完成 |
| P1 | `catTent` | 貓咪小帳篷 | 1×1 | production | 4 | `assets/furniture/redrawn/catTent/` | 完成 |
| P1 | `catCastle` | 大型貓咪城堡 | 2×2 | production | 4 | `assets/furniture/redrawn/catCastle/` | 完成 |
| P1 | `coffeeMachine` | 專業咖啡機 | 1×1 | production | 4 | `assets/furniture/redrawn/coffeeMachine/` | 完成 |
| P1 | `oven` | 烘焙烤箱 | 1×1 | production | 4 | `assets/furniture/redrawn/oven/` | 完成 |
| P1 | `washStation` | 洗滌工作台 | 2×1 | production | 4 | `assets/furniture/redrawn/washStation/` | 完成 |
| P1 | `smartOrder` | 智慧點餐機 | 1×1 | production | 4 | `assets/furniture/redrawn/smartOrder/` | 完成 |
| P1 | `pawRug` | 貓掌圓毯 | 2×2 | production | 4 | `assets/furniture/redrawn/pawRug/` | 完成 |
| P1 | `creamPlaidRug` | 奶油格紋地毯 | 3×2 | production | 4 | `assets/furniture/redrawn/creamPlaidRug/` | 完成 |
| P1 | `starNightRug` | 星夜地毯 | 3×2 | production | 4 | `assets/furniture/redrawn/starNightRug/` | 完成 |
| P2 | `welcomeSign` | 木製歡迎牌 | 1×1 | production | 4 | `assets/furniture/redrawn/welcomeSign/` | 完成 |
| P2 | `dryFlower` | 乾燥花瓶 | 1×1 | production | 4 | `assets/furniture/redrawn/dryFlower/` | 完成 |
| P2 | `monsterPlant` | 大型龜背芋 | 1×1 | production | 4 | `assets/furniture/redrawn/monsterPlant/` | 完成 |
| P2 | `photoBackdrop` | 貓咪拍照背板 | 2×1 | production | 4 | `assets/furniture/redrawn/photoBackdrop/` | 完成 |
| P2 | `aquarium` | 大型水族箱 | 2×1 | production | 4 | `assets/furniture/redrawn/aquarium/` | 完成 |
| P2 | `childrenPlayArea` | 兒童遊戲區 | 3×2 | redraw | 4 | `assets/furniture/redrawn/childrenPlayArea/` | 正式可用；陰影邊緣待後續精修 |

## 相容性

`furniture-config.js` 未修改。所有原 ID、價格、meta、解鎖層級、footprint、layer 與 rotation 規則維持 V0.55.1。`SaveAdapter` 與存檔 key `catCafePhaserV0540` 未變；舊存檔只會以相同 ID 解析到新貼圖，不會搬動、改名或重新扣款。

## 靜態品質 Gate

每張 PNG 都檢查 PNG signature、RGBA、非空、四角 Alpha、連續白卡比例、四方向路徑與唯一 texture key。人工畫面驗收請使用 [V0552_MANUAL_BROWSER_ACCEPTANCE.md](./V0552_MANUAL_BROWSER_ACCEPTANCE.md)。
