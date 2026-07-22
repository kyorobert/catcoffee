# V0.55.2-alpha Prototype 家具全面重繪計畫

本清單涵蓋全部 25 件 Prototype。重繪只替換場景素材與 visual metadata；家具 ID、價格、解鎖、footprint、玩家座標與存檔 key 均不得改變。

| 優先級 | ID | 名稱 | 現有素材 | Footprint | 問題 | 未來正式造型 Brief | 需要方向 | Station Type | Socket | 備註 |
|---|---|---|---|---:|---|---|---|---|---|---|
| P0 | squareCafeTable | 方形咖啡桌 | SVG 白卡文字 | 1×1 | 非等角卡片 | 暖木方桌、清楚桌腳與右下陰影 | 四方向 | table | customer-table, staff-serve | 與椅面比例校準 |
| P0 | windowHighChair | 窗邊高腳椅 | SVG 白卡文字 | 1×1 | 無腳底與方向 | 細木高腳椅、奶油坐墊、腳踏桿 | 四方向 | seat | customer-seat | 不可鏡像操作面 |
| P0 | wallBench | 靠牆長椅 | SVG 白卡文字 | 2×1 | footprint 視覺不足 | 兩人木長椅、暖布坐墊、靠牆輪廓 | 四方向 | seat | customer-seat | 2×1 寬度清楚 |
| P0 | catEarChair | 貓耳造型椅 | SVG 白卡文字 | 1×1 | 幾何示意 | 貓耳椅背、木腳、柔粉坐墊 | 四方向 | seat | customer-seat | 保留貓耳剪影 |
| P0 | creamSofa | 奶油雙人沙發 | SVG 白卡文字 | 2×1 | 非場景家具 | 奶油布面雙人座、木腳、像素縫線 | 四方向 | seat | customer-seat | 與 2×1 對齊 |
| P0 | pawSofa | 貓掌造型沙發 | SVG 白卡文字 | 2×1 | 非等角圖示 | 暖粉貓掌靠背沙發、可辨識座面 | 四方向 | seat | customer-seat | 招牌造型但不過度飽和 |
| P0 | coffeeMachine | 專業咖啡機 | SVG 白卡文字 | 1×1 | 功能示意圖 | 金屬機身、沖煮頭、杯盤與操作面 | 四方向 | coffee-machine | staff-use | P0 首批營業設備 |
| P0 | oven | 烘焙烤箱 | SVG 白卡文字 | 1×1 | 功能示意圖 | 暖金屬烤箱、玻璃門、把手與控制面 | 四方向 | oven | staff-use | 不得鏡像把手／光源 |
| P0 | washStation | 洗滌工作台 | SVG 白卡文字 | 2×1 | 功能示意圖 | 雙槽木金屬工作台、水龍頭與下櫃 | 四方向 | prep-table | staff-use | 2×1 工作面 |
| P0 | smartOrder | 智慧點餐機 | SVG 白卡文字 | 1×1 | 功能示意圖 | 木框點餐終端、低亮螢幕、固定底座 | 四方向 | cashier | staff-use, customer-pay | 螢幕不畫可讀文字 |
| P1 | cardboardNest | 紙箱小窩 | SVG 白卡文字 | 1×1 | 圖卡 | 可愛摺邊紙箱、毛毯與貓腳印 | 四方向 | cat-bed | cat-rest | 低矮、貓尺寸 |
| P1 | scratchPost | 貓抓柱 | SVG 白卡文字 | 1×1 | 圖卡 | 麻繩柱、木底座、小吊球 | 四方向 | cat-play | cat-play | 清楚接地 |
| P1 | windowHammock | 窗邊吊床 | SVG 白卡文字 | 1×1 | 無牆面透視 | 木／布牆掛吊床、支架與投影 | 左右牆方向 | cat-bed | cat-rest | wallObject，不阻擋行走 |
| P1 | doubleCatTree | 雙層貓跳台 | SVG 白卡文字 | 1×2 | 比例與方向不足 | 雙平台麻柱、洞屋與安全底座 | 四方向 | cat-play | cat-play | 高度 tall，1×2 footprint |
| P1 | catTent | 貓咪小帳篷 | SVG 白卡文字 | 1×1 | 圖卡 | 奶油布帳篷、暖色墊與入口陰影 | 四方向 | cat-bed | cat-rest | 低矮、不遮鄰格中心 |
| P1 | catCastle | 大型貓咪城堡 | SVG 白卡文字 | 2×2 | 尺寸不符 | 多層貓城堡、平台、洞口與梯板 | 四方向 | cat-play | cat-play | 2×2 清楚量體 |
| P1 | pawRug | 貓掌圓毯 | SVG 白卡文字 | 2×2 | 非等角地毯 | 2:1 菱形貓掌織毯、透明外圍 | 可鏡像 | decoration | 無 | walkBlocking false |
| P1 | creamPlaidRug | 奶油格紋地毯 | SVG 白卡文字 | 3×2 | 非等角地毯 | 3×2 奶油格紋織毯、短流蘇 | 可鏡像 | decoration | 無 | 完整覆蓋合理 footprint |
| P1 | starNightRug | 星夜地毯 | SVG 白卡文字 | 3×2 | 非等角地毯 | 深藍暖金星點織毯、低飽和 | 可鏡像 | decoration | 無 | walkBlocking false |
| P2 | welcomeSign | 木製歡迎牌 | SVG 白卡文字 | 1×1 | 素材內文字 | 原木立牌、貓掌刻紋，不畫可讀字 | 四方向 | decoration | 無 | 入口裝飾 |
| P2 | dryFlower | 乾燥花瓶 | SVG 白卡文字 | 1×1 | 圖卡與白底 | 小陶瓶、暖黃乾燥花、細枝輪廓 | 四方向 | decoration | 無 | 避免圖像過小 |
| P2 | monsterPlant | 大型龜背芋 | SVG 白卡文字 | 1×1 | 向量卡片 | 大葉龜背芋、陶盆與葉片暗面 | 四方向 | decoration | 無 | tall，盆底接地 |
| P2 | photoBackdrop | 貓咪拍照背板 | SVG 白卡文字 | 2×1 | 無牆面方向 | 暖木相框背板、貓耳輪廓與小燈串 | 左右牆方向 | decoration | 無 | wallObject，不阻擋行走 |
| P2 | aquarium | 大型水族箱 | SVG 白卡文字 | 2×1 | 功能卡片 | 木櫃底座、玻璃水箱、少量魚與水草 | 四方向 | decoration | 無 | tall、控制透明高光 |
| P2 | childrenPlayArea | 兒童遊戲區 | SVG 白卡幾何 | 3×2 | 無文字但仍為卡片 | 柔色遊戲墊、積木、矮隧道，清楚 3×2 | 四方向 | decoration | 無 | 不新增角色 AI |

## 優先級統計與交付順序

- P0：10 件，先建立正式座位與營業設備，優先 `coffeeMachine`、`oven`、`washStation`、`smartOrder`、`squareCafeTable`。
- P1：9 件，完成貓咪互動家具及三張正式地毯。
- P2：6 件，完成裝飾與拍照／親子概念。

每件交付需通過 Art Bible 的透明背景、2:1 等角、統一光源、腳底 Anchor、footprint 比例、方向、socket 與授權檢查。

