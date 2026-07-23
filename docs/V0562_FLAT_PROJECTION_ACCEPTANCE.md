# V0.56.0-alpha Flat Projection 人工驗收

- 任務：`ARCH-0562-FLAT-PROJECTION-PROTOTYPE`｜Build `0560a`｜存檔 key `catCafePhaserV0540`
- 相關：[實作結果](./V0562_FLAT_PROJECTION_RESULT.md)｜截圖證據 `docs/evidence/v0562/`

> 本清單由產品負責人逐項勾選。**未經實機執行的項目不得勾選。** 「自動證據」欄僅標示本次已由 real-browser（Chrome headless）截圖／程式驗證的基線，供參考；仍需人工在實際裝置確認手感與觸控。

## 啟動 URL（可直接複製）

本機 HTTP：`py -m http.server 8765` → 於瀏覽器開啟：

- 預設（iso）：`http://127.0.0.1:8765/` 或 `http://127.0.0.1:8765/?projection=iso`
- Flat：`http://127.0.0.1:8765/?projection=flat`
- Flat + Art Debug：`http://127.0.0.1:8765/?projection=flat&artDebug=1`
- 非法值（應回退 iso）：`http://127.0.0.1:8765/?projection=abc`

## 桌面

### iso（回歸對照）1440×900 `?projection=iso`
- [ ] 正常啟動、無錯誤畫面、無 Console fatal（自動證據：已截圖 `desktop-iso.png`，gameReady、無 pageerror；一則 favicon.ico 404 為瀏覽器自動請求，非致命）
- [ ] 畫面與 V0.55.2 iso 一致（家具位置、anchor、Camera）

### flat 1440×900 `?projection=flat`
- [ ] 正常啟動、無空白場景、無 Runtime error（自動證據：`desktop-flat.png`，projectionMode=flat，pageerror=0）
- [ ] 地板、後方牆面、房間邊界、入口可辨識（自動證據：截圖可見平行四邊形地板＋後牆＋邊界）
- [ ] 家具位於合法格、不漂離 footprint（自動證據：截圖家具在格）
- [ ] 貓咪顯示正常（自動證據：截圖可見多隻貓）

## 手機直立

### 390×844 `?projection=flat`
- [ ] 正常啟動、無錯誤、直立可讀（自動證據：`mobile-390-flat.png`，pageerror=0）
- [ ] 地板／牆面／入口在窄畫面易辨識

### 393×852 `?projection=flat`
- [ ] 正常啟動、無錯誤、直立可讀（**無自動證據，需人工**）

### 430×932 `?projection=flat`
- [ ] 正常啟動、無錯誤、直立可讀（自動證據：`mobile-430-flat.png`，pageerror=0）
- [ ] safe area 與底部操作列正常

### Art Debug 390×844 `?projection=flat&artDebug=1`
- [ ] Art Debug 格線、footprint、anchor、socket 與 flat grid 對齊（自動證據：`mobile-390-flat-art-debug.png`，polygon/anchor/socket 對齊）

## 互動（需人工實機，無自動證據）

- [ ] 家具可選取
- [ ] 家具可旋轉，旋轉後 footprint 與圖片方向合理
- [ ] 家具可拖曳，ghost 與 footprint polygon 對齊
- [ ] 放下後位置與 ghost 一致
- [ ] 家具可放置 / 取消
- [ ] 不會放到牆面或不可放置格
- [ ] Camera 可拖曳與縮放
- [ ] 家具拖曳與 Camera 輸入互斥正常（單指拖曳不誤移 Camera，反之亦然）
- [ ] 觸控拖曳落點精度可接受（如偏移明顯，回報以評估 projection-aware pointer 調整）
- [ ] 貓咪可漫遊、不走牆
- [ ] 顧客 placeholder 於營業階段可顯示與移動

## 存檔與切換（需人工實機）

- [ ] 載入 V0.55.1／舊存檔後，家具 ID／數量／位置／rotation 不變
- [ ] flat 模式重整後家具 x／y／r 不變、不重新扣款
- [ ] flat 不寫入存檔（重整後是否 flat 只由網址參數決定）
- [ ] 由 `?projection=flat` 切回預設（移除參數）後，畫面恢復為原 iso

## 視覺方向決策

- [ ] 是否核准 Flat（淺斜／淺俯視）作為後續正式方向候選
- [ ] 是否核准將 Flat 排入「逐件家具校準」（`ART-0563-FLAT-FURNITURE-CALIBRATION`）
- [ ] 需要重畫或調整的家具分類（請填）：＿＿＿＿＿＿＿＿

## 測試紀錄

- 測試日期：＿＿＿＿＿＿＿＿
- 測試人：＿＿＿＿＿＿＿＿
- 部署網址／Build：＿＿＿＿＿＿＿＿（應為 `0560a`）
- 發現問題：＿＿＿＿＿＿＿＿

> 注意：本 Prototype **尚未**成為正式預設；家具尚未完成 flat 正式美術；手機實機驗收未完成前不得宣稱通過。
