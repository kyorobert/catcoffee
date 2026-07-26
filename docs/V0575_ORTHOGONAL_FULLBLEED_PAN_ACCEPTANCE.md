# V0.57.5-alpha 正交滿版取景與 Zoom/Pan 修正 人工驗收清單（ARCH-0575）

- 版本：`V0.57.5-alpha｜正交滿版操作修正版`｜Build `0575a`
- 決策：[DEC-022](./decisions.md#dec-022正交滿版取景zoompan-修正與分區視覺清理accepted)｜結果：[V0575 結果](./V0575_ORTHOGONAL_FULLBLEED_PAN_RESULT.md)
- 用途：產品負責人於**真實裝置**逐項勾選；未勾選前不得宣稱實機通過，也不得開始 `ART-0576` 家具重畫。**不得預先勾選。**

## 如何開啟

```powershell
cd "C:\Users\rober\Desktop\貓咪咖啡廳"
py -m http.server 8765
```

- 滿版 + 操作（Demo 構圖）：`http://<手機看得到的IP>:8765/?projection=ortho&demoLayout=1`
- 真實存檔（非 Demo）：`?projection=ortho`
- iso 回退（rollback）：`/` 或 `?projection=iso`

## 【滿版】

- ☐ 四周留白明顯少於 V0574。
- ☐ 咖啡廳不再像置中的展示卡片。
- ☐ 首屏不需先縮放。
- ☐ 入口、服務、座位與貓區皆可理解。

## 【Zoom/Pan】

- ☐ 放大後可向左移動。
- ☐ 放大後可向右移動。
- ☐ 放大後可向上移動。
- ☐ 放大後可向下移動。
- ☐ 四邊邊界合理（到房間邊緣才停）。
- ☐ 縮小可看完整房間（置中、無大片房外背景）。
- ☐ pinch 後不跳位。
- ☐ Safari 地址列變化後正常。

## 【分區】

- ☐ 左右不再有不明深色直條。
- ☐ 上方服務區連續。
- ☐ 員工側與顧客側可理解。
- ☐ 座位形成群組。
- ☐ 貓咪區集中。
- ☐ 分區顏色自然，不像陰影或禁區。

## 【操作】

- ☐ 家具選取。
- ☐ 家具拖曳。
- ☐ 家具旋轉。
- ☐ 放置與取消。
- ☐ 情境工具列不破壞 Camera。
- ☐ Demo 不影響存檔。

## 【產品決策】

- ☐ 通過，凍結場景與 Camera，進入核心家具正交重作。
- ☐ 只需低風險小修。
- ☐ 尚未通過。

## 裝置矩陣

| 裝置 / 瀏覽器 | 滿版 | zoom-in 四向 pan | 縮小整房 | 無深色直條 | 分區可辨 | 家具操作 | Demo 不寫存檔 |
|---|---|---|---|---|---|---|---|
| iPhone Safari 直立 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Android Chrome 直立 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 桌面 Chrome | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

> 參考截圖（自動化 real-browser，非實機）：`docs/evidence/v0575/`（首屏 390/393/430/1440、zoom-in center + pan 四向、minzoom、art-debug、before(V0574)/after(V0575)），每張指標見 `metrics.json`。實機驗收仍以本清單為準。
