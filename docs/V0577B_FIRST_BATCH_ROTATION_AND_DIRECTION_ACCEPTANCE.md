# V0577B 第一批家具旋轉與方向驗收

## 自動驗收

- [x] 12 個 Orthogonal override ID 維持。
- [x] 48 張透明 PNG 維持；木椅四方向各為獨立 texture。
- [x] 木椅左右 silhouette 差異超過回歸門檻，前後方向亦不同。
- [x] 12 件在固定 `x/y` 的四個方向有相同 visual pivot。
- [x] 奶油粉餐桌、咖啡吧台、木椅、甜點櫃四向 texture 與 pivot 驗證。
- [x] FurnitureEntity、Ghost 與 snapping 共用 `getFurnitureVisualPosition()`。
- [x] iso／flat／invalid 不使用 Orthogonal override。
- [x] furniture ID／footprint／`x/y/r`／價格／station／socket／walkBlocking 未改。
- [x] Save key／schema／migration 未改。

## 真實瀏覽器

- [x] Chrome Browser Smoke。
- [x] Edge Browser Smoke。
- [x] 390×844 Orthogonal Demo 中四件代表家具四向 pivot 與 texture 實際 Scene 驗證。
- [x] root／iso／flat／ortho／orthogonal alias／demo／Art Debug／invalid fallback 啟動。

## 人工／實機 Gate

- [ ] 真實 iPhone Safari 直式：奶油粉餐桌連續旋轉不跳。
- [ ] 真實 iPhone Safari 直式：咖啡吧台連續旋轉不跳。
- [ ] 真實 iPhone Safari 直式：木椅連續旋轉不跳且四方向易辨。
- [ ] 真實 iPhone Safari 直式：甜點櫃／櫃類連續旋轉不跳。
- [ ] 拖曳中旋轉、放下、重載後視覺位置一致。
- [ ] pinch／pan／Safari 地址列變化不影響上述結果。

自動化通過不取代以上 iPhone Safari Gate。在產品核准前不得開始其餘 35 件家具。
