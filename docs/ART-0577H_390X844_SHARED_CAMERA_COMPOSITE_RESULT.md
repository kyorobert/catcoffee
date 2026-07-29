# ART-0577H｜390×844 共用鏡頭場景合成 Gate 結果

## 任務定位

- 狀態：`CONCEPT_GATE_AWAITING_PRODUCT_REVIEW`
- Runtime 基線：`V0.57.7-alpha`／Build `0577e`
- 本卡不升 Build、不產生部署 ZIP，也不建立正式商品資料。
- 本卡沒有覆寫 `assets/furniture/orthogonal/`、Runtime mapping、Save 或 rotation policy。

本 Gate 承接 ART-0577G 的部分核准：

- `pinkTableLong_softCute`：產品與觀看角度方向已核准。
- `pinkTableLong_hardCafe`：另一項獨立商品方向已核准。
- 兩款桌子仍只有概念方向，正式尺寸、ID、價格、Runtime 與素材覆寫均未核准。
- `chair`：ART-0577G 稿退回，本 Gate 重新建立固定上方鏡頭四向候選。
- `counter`：保留雙貓掌正面與員工收納背面的識別，本 Gate 重建共用鏡頭及較寬端面。
- `dessert`：保留高型蛋糕櫃、甜點陳列與貓咪下櫃識別，本 Gate 重建共用鏡頭及展示深度。

## 390×844 合成方法

1. 使用現行 Build 0577e 的真實 390×844 Runtime 截圖作為房間、HUD、牆面與底部列基線。
2. 依 `OrthogonalProjection` 的 `axisX={88,0}`、`axisY={0,120}` 建立場景空間參考。
3. 將背景家具弱化後，疊入兩款桌子、四向椅子、吧台、蛋糕櫃及現有 `bean`／`coal`／`snow` 貓咪。
4. 合成圖中的座標只供視覺 Gate 使用，不是 Runtime placement 或 mapping 資料。
5. 圖面明確標示 `CONCEPT OVERLAY - NOT RUNTIME ART`，避免被誤認為正式遊戲截圖。

## 新一輪候選摘要

### chair

- 四方向使用同一固定近俯視鏡頭。
- 四方向都保留完整寬椅面；左右方向不再是薄片。
- 椅背降低為遠端的小型方向 cue，椅面維持主要辨識面。
- 仍待產品在 390×844 場景中確認椅背語意與貓咪尺度。

### counter

- 四方向維持共用高角度鏡頭。
- 正面保留雙貓掌，背面保留員工收納。
- 左右端面改為 1×2 長軸檯面，不再只有狹窄立面。
- 仍待產品確認檯面比例、櫃體高度與正式像素密度。

### dessert

- 四方向維持共用高角度鏡頭及可見頂面。
- 正面保留甜點陳列與貓咪下櫃；左右方向保留玻璃櫃深度。
- 背面以服務滑門表達功能差異。
- 仍待產品確認高櫃高度是否與桌椅、貓咪同屬一套空間語言。

## Imagegen 來源紀錄

本 Gate 使用原創圖像生成候選，再以本地色鍵去背工具產生透明工作稿。提示方向如下：

- chair：`one fixed high near-overhead camera; four separated front/right/back/left rotations; the same complete broad seat remains visible; low backrest only as a far-edge direction cue; no thin side silhouette`
- counter：`one fixed high near-overhead camera; front paw panels, staff-storage back; horizontal 2x1 and vertical 1x2 top planes remain substantial; low counter, no tall cabinet side`
- dessert：`one fixed high near-overhead camera; tall glass cake case; visible top and shelf depth in all four rotations; cake display front, service back, substantial side views`

原始候選：

- `tools/v0577h-shared-camera-sources/chair-fixed-camera-source.png`
- `tools/v0577h-shared-camera-sources/counter-fixed-camera-source.png`
- `tools/v0577h-shared-camera-sources/dessert-fixed-camera-source.png`

透明工作稿：

- `tools/v0577h-shared-camera-workbench/chair-fixed-camera.png`
- `tools/v0577h-shared-camera-workbench/counter-fixed-camera.png`
- `tools/v0577h-shared-camera-workbench/dessert-fixed-camera.png`

所有檔案只存在 `tools/`，不屬正式 Runtime 素材。

## 驗收證據

- [390×844 咖啡廳合成 Gate](./evidence/v0577h-shared-camera-composite/390x844-cafe-composite.png)
- [固定鏡頭四向比較](./evidence/v0577h-shared-camera-composite/fixed-camera-direction-sheet.png)
- [家具與現有貓咪尺度](./evidence/v0577h-shared-camera-composite/furniture-with-current-cat-scale.png)
- [總覽](./evidence/v0577h-shared-camera-composite/shared-camera-gate-overview.png)
- [Metrics](./evidence/v0577h-shared-camera-composite/metrics.json)
- [Comparison HTML](./ART-0577H_390X844_SHARED_CAMERA_COMPOSITE_COMPARISON.html)

## 本 Gate 明確未做

- 未覆寫任何正式家具 PNG。
- 未修改 Runtime、visual mapping、Build、package、Save、schema 或 migration。
- 未核准正式尺寸、家具 ID 或價格。
- 未建立部署資料夾或 ZIP。
- 未開始其餘 35 件家具。

## 驗證結果

- 正式 Orthogonal PNG：48 張；對 0577e 備份 SHA-256 tree diff `0`。
- Runtime JS：58 個；對 0577e 備份 SHA-256 tree diff `0`。
- `npm test`：通過。
- `npm run test:build`：通過，Build `0577e`。
- `npm run test:ortho-furniture`：通過，12 IDs／48 PNG／iso-flat fallback 維持。
- `npm run test:entrance`：通過，migration `5402` 維持。
- `npm run test:ortho-area`：通過，Room Skin／placeable area 維持。
- `npm run test:ortho-rotation`：通過。
- `npm run test:rotation-state`：通過。
- `npm run check:deploy`：通過。
- `npm run check:dev`：通過，包含 Browser Smoke。
- Comparison HTML：4 個圖片引用全部存在。

## 等待產品判定

請只針對下列問題做下一輪判定：

1. chair 是否已符合「同一塊完整椅面四向旋轉、椅背只是次要 cue」？
2. counter 四方向是否已像同一個近俯視吧台，左右端面是否仍過窄？
3. dessert 四方向是否已像同一個高型蛋糕櫃，前後是否仍過度正立面化？
4. 兩款已核准桌型與上述三件候選、現有貓咪放在 390×844 場景後，是否屬同一鏡頭與空間語言？

產品核准前不得進正式素材整合。
