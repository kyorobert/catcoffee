# ART-0577J 家具共同比例、服務帶連續性與桌椅島精修 Gate 結果

任務：`ART-0577J-SHARED-SCALE-SERVICE-BAND-AND-SEATING-ISLAND-REFINEMENT-GATE`  
基線：`V0.57.7-alpha` / Build `0577e` / package `0.57.7-alpha`  
性質：概念 Gate；不是正式素材、Runtime、Build、Save 或部署卡  
狀態：`AWAITING_PRODUCT_REVIEW`

## 1. 本輪產品問題

ART-0577I 已證明固定高角度完整咖啡廳構圖可成立，但仍有五項失衡：

- chair 的厚座墊與寬輪廓像小床／平台。
- counter 尺度過大，壓過貓咪與相鄰設備。
- dessert 保留過多舊 3/4 高體積。
- coffee／wash 相對像玩具，使服務帶讀成散落物件。
- 桌椅島過度依靠大型粉／綠色塊分區。

本輪只在概念工作台修正共同比例與構圖，不碰正式素材或 Runtime。

## 2. 共同比例契約

所有證據使用同一份 `DISPLAY` 尺度表、同一個 `390×844` 高角度 Camera、同一
底部中心接地基線與同一組位置。正常版與編輯格線版只差 grid overlay。

現有貓咪是固定尺度基準，不為任何證據圖個別縮放。量測 proxy：

| 物件 | 顯示 bbox | 相對 88×120 cell | 相對貓咪高度 |
|---|---:|---:|---:|
| chair | 31×45 | 0.352×0.375 | 0.957 |
| counter | 118×58 | 1.341×0.483 | 1.234 |
| coffee | 50×48 | 0.568×0.400 | 1.021 |
| wash | 73×64 | 0.830×0.533 | 1.362 |
| dessert | 64×95 | 0.727×0.792 | 2.021 |
| current cat | 42×47 | 0.477×0.392 | 1.000 |

這些數字是比較 proxy，不是素材核准。完整資料見
`docs/evidence/v0577j-shared-scale-service-band/metrics.json`。

## 3. Chair 精修

- 第一張 ImageGen 候選仍像小床，已自我退回，沒有進入工作台。
- 第二稿縮成單人餐椅：近方形椅面、薄硬奶油座墊、窄座框與短腳。
- 貓耳椅背只作方向 cue；四方向仍保留完整座深，不做薄側片。
- 場景尺度座墊厚度 proxy 為 6px／總高 45px（0.133）。
- 與 ART-0577I 相比，桌邊距離收近，但不實作 Runtime 自動吸附。

概念來源與去背流程記錄於
`tools/v0577j-shared-scale-service-band-sources/generation-notes.md`。

## 4. Counter 精修

- 保留雙貓掌顧客面、開放員工收納面、奶油檯面與暖木材。
- 櫃體降低、減少壓迫感；檯面仍可用，左右端面仍有真實深度。
- 場景高度 58px，約為現行貓咪高度 1.234 倍。
- 與 coffee／wash 共用 365px 接地 baseline，不以個別垂直 offset 假裝連續。

## 5. Dessert 精修

- 保留高型蛋糕展示、三層甜點、玻璃及貓咪下櫃。
- 降低總體積與舊式 3/4 屋頂感，左右仍保有展示深度。
- 顧客展示面與員工服務背面可分辨。
- 場景高度 95px；dessert/counter 高度比由本輪契約固定為 1.638。

## 6. 服務帶 A／B／C

三個版本使用完全相同的素材、尺度、Camera 與接地線，只比較間距：

- A：最緊密連續。
- B：保留小型操作縫。
- C：Codex 提出的均衡操作構圖。

本文件**不替產品選案**。A／B／C 全部維持 pending，見
`service-band-options-a-b-c.png`。

## 7. 桌椅島

- SoftCute／HardCafe 維持兩種獨立產品方向。
- 椅子距桌 proxy 收斂為 10px／9px。
- 大型 UI 色塊改為略大於 footprint 的低透明小地毯，並以杯盤建立使用情境。
- 中央最窄主通道 proxy 為 38px（0.432 個 cell 寬）。
- 正常／編輯模式的家具、角色、Camera 與位置完全一致。
- 本卡沒有自動拼接、吸附、socket 或 Runtime layout 行為。

## 8. 完整場景判斷

本輪比 ART-0577I 更接近同一世界：

- counter 不再壟斷上側服務區。
- dessert 仍有高型商品辨識，但不再像獨立大型建築。
- coffee／wash 與 counter 的高度關係較連續。
- chair 已退出床／沙發輪廓，桌椅群更像實際座席。
- 分區提示退到裝飾層，主體改由距離、朝向、杯盤與動線形成。

但本輪只是概念合成，不能證明 Runtime placement、touch 或真機視覺已通過。

## 9. P0 貓咪移動稽核輸入

本卡沒有修改貓咪 Runtime。下一階段 P0 定義為
`ANIM-0578-CAT-LOCOMOTION-AND-DIRECTIONAL-STATE-AUDIT`：

- 缺可信左右側姿；水平移動常像正面 sprite 滑行。
- walk loop 腳步差、轉向／起步／停止過渡不足。
- 四足步態、方向 silhouette 及家具 socket 互動姿勢不足。

詳見 [稽核輸入](./ANIM-0578_CAT_LOCOMOTION_AND_DIRECTIONAL_STATE_AUDIT.md)。

## 10. 產物與保護邊界

- 重建腳本：`tools/build-v0577j-shared-scale-service-band.py`
- concept sources/workbench：`tools/v0577j-shared-scale-service-band-*`
- evidence：`docs/evidence/v0577j-shared-scale-service-band/`
- 比較頁：[ART-0577J comparison](./ART-0577J_SHARED_SCALE_AND_SERVICE_BAND_COMPARISON.html)
- 驗收表：[ART-0577J acceptance](./ART-0577J_SHARED_SCALE_AND_SERVICE_BAND_ACCEPTANCE.md)

本卡未覆寫 48 張正式 Orthogonal PNG，未修改 Runtime JS、Build、package、
module query、Save key、schema、migration、Grid、Camera、入口或其餘 35 件，
也未建立 dist／部署 ZIP。

