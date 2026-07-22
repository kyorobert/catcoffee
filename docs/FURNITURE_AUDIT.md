# 家具與環境素材稽核

版本：V0.55.1-alpha。掃描來源為 `FURNITURE_CONFIG` 與 `assets/furniture/`。

## 摘要

- 家具定義 47：PNG 22、SVG 25，與預估完全一致。
- 缺失素材 0；SHA-256 內容重複 0。
- 22 件 PNG 全部具有 Alpha；25 件 SVG 都有不透明白色圓角卡片背景，故無透明背景素材共 25。
- SVG 含 `<text>` 24；`childrenPlayArea` 雖無 `<text>`，仍是白底幾何示意卡及 `meta.isNew`，人工判定 Prototype。
- 正式四方向素材 0；全部 47 件目前只有單一原生方向。明確允許 mirror fallback 8 件，其餘使用安全單圖 fallback。
- footprint 完整 47；具有預留 station/socket 功能概念 30。
- 新遊戲預設 18 件實例均來自 PNG 正式／待重畫組，無 Prototype。
- 正常商店 V0.55.1 可購買 22 件（18 production + 4 redraw）；25 Prototype 全部隱藏。
- 舊存檔可能包含全部 47 個 ID；SaveAdapter 仍依既有定義載入，不以 artStatus 過濾。

## 完整清單

| ID | 名稱 | 類別 | 格式 | 素材路徑 | Footprint | 原 size | visualScale / Anchor | Art Status | 商店 | 問題 | 後續處理 |
|---|---|---|---|---|---:|---:|---|---|---|---|---|
| roundTable | 圓形咖啡桌 | 座位 | PNG | `assets/furniture/roundTable.png` | 1×1 | 92 | .78 / .5,1 | production | 是 | 單一方向 | 保留，補四方向 |
| pinkTable | 粉紅圓桌 | 座位 | PNG | `assets/furniture/pinkTable.png` | 1×1 | 92 | .78 / .5,1 | production | 是 | 單一方向 | 保留，補四方向 |
| woodTable | 長方木桌 | 座位 | PNG | `assets/furniture/woodTable.png` | 2×1 | 105 | .82 / .5,1 | production | 是 | 操作方向圖不足 | 補真正四方向 |
| pinkTableLong | 奶油粉餐桌 | 座位 | PNG | `assets/furniture/pinkTableLong.png` | 2×1 | 108 | .84 / .5,1 | production | 是 | 操作方向圖不足 | 補真正四方向 |
| chair | 木椅 | 座位 | PNG | `assets/furniture/chair.png` | 1×1 | 58 | 1.12 / .5,1 | production | 是 | 單一方向 | 補真正四方向 |
| cushionChair | 軟墊椅 | 座位 | PNG | `assets/furniture/cushionChair.png` | 1×1 | 60 | 1.20 / .5,1 | production | 是 | 單一方向 | 補真正四方向 |
| redChair | 紅色小椅 | 座位 | PNG | `assets/furniture/redChair.png` | 1×1 | 58 | 1.32 / .5,1 | production | 是 | 單一方向、小型 | 補真正四方向 |
| sofa | 暖紅沙發 | 座位 | PNG | `assets/furniture/sofa.png` | 2×1 | 112 | .86 / .5,1 | redraw | 是 | 圖像較像床鋪 | 重畫雙人沙發 |
| counter | 咖啡吧台 | 營業 | PNG | `assets/furniture/counter.png` | 2×1 | 125 | 1.08 / .5,1 | production | 是 | 缺操作面方向 | 補真正四方向 |
| dessert | 甜點展示櫃 | 營業 | PNG | `assets/furniture/dessert.png` | 1×1 | 120 | .97 / .5,1 | production | 是 | 單一方向 | 補真正四方向 |
| kitchen | 料理工作台 | 營業 | PNG | `assets/furniture/kitchen.png` | 2×1 | 112 | 1.27 / .5,1 | redraw | 是 | 主體寬度不足 2×1 | 重畫工作面與方向 |
| console | 備品邊桌 | 營業 | PNG | `assets/furniture/console.png` | 2×1 | 104 | 1.53 / .5,1 | redraw | 是 | 視覺接近 1×1 | 重畫 2×1 主體 |
| bookshelf | 繽紛書櫃 | 裝飾 | PNG | `assets/furniture/bookshelf.png` | 1×1 | 105 | .73 / .5,1 | production | 是 | 單一方向 | 補方向 |
| tallCabinet | 木質高櫃 | 裝飾 | PNG | `assets/furniture/tallCabinet.png` | 1×1 | 92 | 1.10 / .5,1 | production | 是 | 單一方向 | 補方向 |
| glassCabinet | 玻璃展示櫃 | 裝飾 | PNG | `assets/furniture/glassCabinet.png` | 1×1 | 98 | 1.17 / .5,1 | production | 是 | 單一方向 | 補方向 |
| plant | 大型盆栽 | 裝飾 | PNG | `assets/furniture/plant.png` | 1×1 | 88 | 1.10 / .5,1 | production | 是 | 單一方向 | 保留，補方向 |
| vasePlant | 花瓶植栽 | 裝飾 | PNG | `assets/furniture/vasePlant.png` | 1×1 | 70 | 1.25 / .5,1 | production | 是 | 單一方向 | 保留，補方向 |
| fireplace | 暖爐壁爐 | 裝飾 | PNG | `assets/furniture/fireplace.png` | 1×1 | 104 | 1.16 / .5,1 | production | 是 | 單一方向 | 保留，補方向 |
| catBed | 貓咪長睡墊 | 貓咪 | PNG | `assets/furniture/catBed.png` | 2×1 | 98 | .75 / .5,1 | redraw | 是 | 偏人用床比例 | 重畫低矮貓睡墊 |
| rugPink | 粉色地毯 | 地毯 | PNG | `assets/furniture/rugPink.png` | 2×2 | 132 | .65 / .5,.5 | production | 是 | 單一方向 | 保留；可鏡像 |
| rugStripe | 條紋地毯 | 地毯 | PNG | `assets/furniture/rugStripe.png` | 2×2 | 132 | .65 / .5,.5 | production | 是 | 單一方向 | 保留；可鏡像 |
| rugRed | 復古紅毯 | 地毯 | PNG | `assets/furniture/rugRed.png` | 2×2 | 132 | .67 / .5,.5 | production | 是 | 單一方向 | 保留；可鏡像 |
| squareCafeTable | 方形咖啡桌 | 座位 | SVG | `assets/furniture/squareCafeTable.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、非等角 | V0.55.2 重繪 |
| windowHighChair | 窗邊高腳椅 | 座位 | SVG | `assets/furniture/windowHighChair.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、非等角 | V0.55.2 重繪 |
| wallBench | 靠牆長椅 | 座位 | SVG | `assets/furniture/wallBench.svg` | 2×1 | 112 | .75 / .5,1 | prototype | 否 | 白卡、文字、非等角 | V0.55.2 重繪 |
| catEarChair | 貓耳造型椅 | 座位 | SVG | `assets/furniture/catEarChair.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、非等角 | V0.55.2 重繪 |
| creamSofa | 奶油雙人沙發 | 座位 | SVG | `assets/furniture/creamSofa.svg` | 2×1 | 112 | .75 / .5,1 | prototype | 否 | 白卡、文字、非等角 | V0.55.2 重繪 |
| pawSofa | 貓掌造型沙發 | 座位 | SVG | `assets/furniture/pawSofa.svg` | 2×1 | 112 | .75 / .5,1 | prototype | 否 | 白卡、文字、非等角 | V0.55.2 重繪 |
| cardboardNest | 紙箱小窩 | 貓咪 | SVG | `assets/furniture/cardboardNest.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、示意圖 | V0.55.2 重繪 |
| scratchPost | 貓抓柱 | 貓咪 | SVG | `assets/furniture/scratchPost.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、示意圖 | V0.55.2 重繪 |
| windowHammock | 窗邊吊床 | 貓咪 | SVG | `assets/furniture/windowHammock.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、非牆面等角 | V0.55.2 重繪 |
| doubleCatTree | 雙層貓跳台 | 貓咪 | SVG | `assets/furniture/doubleCatTree.svg` | 1×2 | 112 | .75 / .5,1 | prototype | 否 | 白卡、文字、比例不合 | V0.55.2 重繪 |
| catTent | 貓咪小帳篷 | 貓咪 | SVG | `assets/furniture/catTent.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、非等角 | V0.55.2 重繪 |
| catCastle | 大型貓咪城堡 | 貓咪 | SVG | `assets/furniture/catCastle.svg` | 2×2 | 112 | .75 / .5,1 | prototype | 否 | 白卡、文字、比例不合 | V0.55.2 重繪 |
| coffeeMachine | 專業咖啡機 | 營業 | SVG | `assets/furniture/coffeeMachine.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、示意圖 | P0 重繪四方向 |
| oven | 烘焙烤箱 | 營業 | SVG | `assets/furniture/oven.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、示意圖 | P0 重繪四方向 |
| washStation | 洗滌工作台 | 營業 | SVG | `assets/furniture/washStation.svg` | 2×1 | 112 | .75 / .5,1 | prototype | 否 | 白卡、文字、示意圖 | P0 重繪四方向 |
| smartOrder | 智慧點餐機 | 營業 | SVG | `assets/furniture/smartOrder.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字、示意圖 | P0 重繪四方向 |
| welcomeSign | 木製歡迎牌 | 裝飾 | SVG | `assets/furniture/welcomeSign.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字 | P2 重繪 |
| dryFlower | 乾燥花瓶 | 裝飾 | SVG | `assets/furniture/dryFlower.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字 | P2 重繪 |
| monsterPlant | 大型龜背芋 | 裝飾 | SVG | `assets/furniture/monsterPlant.svg` | 1×1 | 92 | .61 / .5,1 | prototype | 否 | 白卡、文字 | P2 重繪 |
| photoBackdrop | 貓咪拍照背板 | 裝飾 | SVG | `assets/furniture/photoBackdrop.svg` | 2×1 | 112 | .75 / .5,1 | prototype | 否 | 白卡、文字、非牆面等角 | P2 重繪 |
| aquarium | 大型水族箱 | 裝飾 | SVG | `assets/furniture/aquarium.svg` | 2×1 | 112 | .75 / .5,1 | prototype | 否 | 白卡、文字、示意圖 | P2 重繪 |
| pawRug | 貓掌圓毯 | 地毯 | SVG | `assets/furniture/pawRug.svg` | 2×2 | 112 | .75 / .5,.5 | prototype | 否 | 白卡、文字、非場景地毯 | P1 重繪 |
| creamPlaidRug | 奶油格紋地毯 | 地毯 | SVG | `assets/furniture/creamPlaidRug.svg` | 3×2 | 112 | .75 / .5,.5 | prototype | 否 | 白卡、文字、非場景地毯 | P1 重繪 |
| starNightRug | 星夜地毯 | 地毯 | SVG | `assets/furniture/starNightRug.svg` | 3×2 | 112 | .75 / .5,.5 | prototype | 否 | 白卡、文字、非場景地毯 | P1 重繪 |
| childrenPlayArea | 兒童遊戲區 | 裝飾 | SVG | `assets/furniture/childrenPlayArea.svg` | 3×2 | 116 | .77 / .5,1 | prototype | 否 | 白卡幾何示意、無文字 | P2 重繪 |

## 資料流與相容性

- 新遊戲 seed：`SaveAdapter.initialItems` 僅引用 production/redraw PNG ID。
- 商店：由 `getPurchasableFurniture()` 只選 `storeVisible === true`。
- 任務／自動生成：目前不存在家具獎勵或家具自動生成路徑；因此沒有 Prototype 入口。
- 舊存檔：47 個 ID 的原定義與 texture 全部保留。Prototype 可顯示、選取、拖曳、旋轉、收納及出售，不自動替換、不重新扣款。

## 房間與環境素材

| 項目 | 目前實作／素材 | 尺寸 | 狀態 | 稽核結果 |
|---|---|---:|---|---|
| 左牆 | `CafeScene.drawRoom()` 等角 Polygon | 依 ROOM_CONFIG | production | 與 floor top/left 共用 Grid 幾何 |
| 右牆 | `CafeScene.drawRoom()` 等角 Polygon | 依 ROOM_CONFIG | production | 與 floor top/right 共用 Grid 幾何 |
| 窗戶 | `assets/environment/wall-window.png` | 118×164 RGBA | production | 透明像素素材，由 WallDecorationEntity 顯示 |
| 菜單板 | `assets/environment/menu-board.png` | 112×166 RGBA | production | 透明像素素材，由 WallDecorationEntity 顯示 |
| 窗光／塵埃 | `AmbientEffects` | 程序式 | production | 不互動、低頻、reduced-motion 可停用 |
| 舊前景圖 | `assets/scene_foreground.png` | 1448×1086 RGBA | legacy retained | 正式 Phaser 路徑未載入；保留歷史素材，不參與 Room 幾何 |
| 舊前景 mask | `assets/scene_foreground_mask.png` | 1448×1086 | legacy retained | 正式 Phaser 路徑未載入，不裁切家具或角色 |
