# ART-0577D 規格草案：Cardinal 家具重繪與連接（未核准，僅規格）

> 狀態：**草案／未核准**。本文件只描述後續美術任務的目標與邊界，供產品負責人決策。**不得**在未核准前開始重繪或改動 runtime。

## 背景
V0577C（[DEC-028](./decisions.md)）已把正交旋轉改為單一 resolver＋誠實 corner-pivot，並以 `ORTHOGONAL_CARDINAL_DIRECTION_MAP = {0:south,1:west,2:north,3:east}` 決定方位，暫時重用既有四張 iso 風格 authored 貼圖（south→down-right、west→down-left、north→up-left、east→up-right）。此為過渡：貼圖仍是 3/4 iso 視角，與正交場景不完全一致。

## 目標（若核准）
1. 為第一批 12 件正交核心家具（`counter, coffeeMachine, oven, washStation, dessert, smartOrder, pinkTableLong, roundTable, chair, creamSofa, doubleCatTree, scratchPost`）重繪**真正的正交四方位**（south/west/north/east）貼圖，取代 cardinal→iso-key 過渡對照。
2. 定義**連接語意**：長桌／櫃檯／沙發等相鄰同型家具在正交下的接縫、共用邊、轉角呈現規則（純視覺，不改 footprint/Occupancy）。
3. 每件家具四方位在 south/north、west/east 之間具可辨識差異（背面≠正面、左右不只是鏡像）。

## 硬邊界（不可跨越）
- 不改 furniture ID／price／footprint／entrance／Grid／`x/y/r` 語意／save key/schema/migration。
- 不改 resolver 的旋轉/占格數學；美術只換貼圖與 cardinal→texture 對照。
- 不新增 placeable cells、不改 iso/flat base visual。
- 連接規則僅影響繪製，不得引入第二套 Occupancy 或改變碰撞。

## 交付與驗收（規格）
- 12×4=48 張正交方位 PNG（透明角、canvas ≥ 既有尺寸）；集中式 cardinal→texture 對照更新。
- 測試：四方位 PNG 存在/透明/差異度；cardinal 對照仍 4 unique；resolver 幾何回歸不變；iso/flat golden 不變。
- 版本：Build 升版；`check.js` obsolete 前一版 `?v=`；protected hash 視情況。
- Gate：Chrome/Edge smoke＋**iPhone Safari 實機**（保留產品負責人）。

## 相依
- 前置：V0577C（本版）。
- 後續可與 [[ARCH-0578]] 貓咪互動並行，但美術與互動分開立卡。
