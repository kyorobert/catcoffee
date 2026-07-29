# ART-0577I Shared-camera Café Composition Gate 結果

任務：`ART-0577I-SHARED-CAMERA-CAFE-COMPOSITION-GATE`  
基線：`V0.57.7-alpha` / Build `0577e` / package `0.57.7-alpha`  
性質：概念 Gate；不是正式素材整合、Runtime 接線、Build 升版或部署卡  
狀態：`AWAITING_PRODUCT_REVIEW`

## 1. 本輪回答的產品問題

本輪不再逐件家具孤立評估，而是在真實 `390 × 844` 手機框架中，以一個固定高角度鏡頭檢查：

- `pinkTableLong_softCute` 與 `pinkTableLong_hardCafe` 是否能在同一咖啡廳中維持獨立商品辨識。
- chair、counter、dessert 候選稿是否與兩款桌子、既有貓咪及房間外殼共用同一空間語言。
- 正常遊戲是否可以使用低對比材質地板，而將格線限制於編輯狀態。
- 服務帶、兩個桌椅島、側邊互動區及主要通道是否能共同形成「咖啡廳」，而非素材測試板。

## 2. 固定鏡頭與空間規則

概念合成使用現行 `390 × 844` Runtime capture 作為 App shell 與牆面參考，維持現行 `88 × 120` 空間比例。所有家具都使用同一個近俯視高角度，保留：

- 水平／垂直的正交擺放方向。
- 家具上表面與必要厚度。
- 共同的底部中心接地基線。
- 現有貓咪 spritesheet 的比例與腳底位置。

本輪所有家具位置都是驗收圖的 screen-space staging，不是 Runtime mapping，也不建立正式 ID、價格、footprint 或 placement 契約。

## 3. 完整咖啡廳構成

### 3.1 Service band

靠牆上側集中配置：

- counter 候選。
- 現有 coffee machine。
- 現有 wash station。
- dessert 候選。

這一列建立顧客區與工作區的基本方向，不以全場散放設備呈現。

### 3.2 Two table islands

- 左側為 SoftCute 橫向長桌島。
- 右側為 HardCafe 縱向長桌島。
- 椅子候選依固定鏡頭四方向擺放，用於檢查座面、椅背方向 cue 與桌邊關係。

兩款桌子在同一場景保留不同產品個性，但未取得正式尺寸、ID、價格或 Runtime 核准。

### 3.3 Side interaction / décor zone

右下側使用既有 cat bed、plant、double cat tree 與一隻貓形成低密度互動／裝飾區，避免把所有可愛物件塞進中央動線。

### 3.4 Main aisle

兩個桌島與右側互動區之間保留縱向主通道，讓入口、服務帶與貓咪活動區具有可讀動線。這只是構圖 Gate，不改 Occupancy、Pathfinding 或入口 mask。

## 4. 地板語言

正常版本使用低對比暖木地板：

- 地板首先被辨識為材質，不是棋盤。
- 木板接縫與木紋被降低對比，不與家具輪廓競爭。
- 不顯示全場 gameplay grid。

編輯版本在完全相同的場景與 Camera 上疊加半透明 `88:120` 比例輔助格。它只用於比較「正常」與「編輯」兩種資訊層級，不代表 Runtime 已接線。

低對比木地板來源由概念工作台生成，並由可重建腳本降飽和、降對比及混色；來源與 prompt 位於：

- `tools/v0577i-shared-camera-cafe-composition-sources/`

正式遊戲不依賴生成工具或該來源。

## 5. 產物

可重建腳本：

- `tools/build-v0577i-shared-camera-cafe-composition.py`

概念來源：

- `tools/v0577i-shared-camera-cafe-composition-sources/`

工作台 master：

- `tools/v0577i-shared-camera-cafe-composition-workbench/cafe-composition-master-normal.png`
- `tools/v0577i-shared-camera-cafe-composition-workbench/cafe-composition-master-edit-grid.png`

正式 Gate 證據：

- `docs/evidence/v0577i-shared-camera-cafe-composition/390x844-cafe-composition-normal.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/390x844-cafe-composition-edit-grid.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/cafe-composition-no-characters.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/cafe-composition-with-characters.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/service-band-closeup.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/table-islands-closeup.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/side-interaction-zone-closeup.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/furniture-with-current-cat-scale.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/composition-zones-overlay.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/floor-normal-vs-edit-grid.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/current-0577e-vs-new-composition.png`
- `docs/evidence/v0577i-shared-camera-cafe-composition/overview.png`

## 6. 稽核結果

本輪確認：

- 正常地板可以在不顯示棋盤格的情況下支撐家具辨識。
- 兩款桌子能在同一格局中被理解為不同產品方向。
- counter 與 dessert 能形成可讀的服務帶。
- 現有貓咪與候選家具可在同一手機畫面中維持基本尺度關係。
- 相較 0577H，畫面已由「候選物件散放測試台」進入「完整咖啡廳構圖」層級。

仍需產品判斷：

- chair 候選是否真的通過固定鏡頭與椅面優先要求。
- counter 左右端面是否仍太窄。
- dessert 正背面是否仍過度立面化。
- SoftCute 與 HardCafe 是否應同時進入下一個正式商品規格 Gate。

## 7. 保護邊界

本卡沒有：

- 覆寫 `assets/furniture/orthogonal/` 正式 PNG。
- 修改 Runtime JS、projection mapping 或 rotation policy。
- 修改 Build、package、module query、Save key、schema 或 migration。
- 修改 Grid、Room、Camera、Placement、Occupancy、Pathfinding 或入口。
- 建立 dist、部署 ZIP 或上傳 GitHub Pages。
- 開始其餘 35 件家具。

正式核准狀態仍為空；本文件只記錄概念 Gate 輸出。
