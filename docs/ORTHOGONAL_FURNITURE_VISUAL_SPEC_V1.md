# Orthogonal 家具視覺規格 v1

版本基線：`V0.57.7-alpha`／Build `0577e`  
適用範圍：Orthogonal projection 的 projection-specific furniture override。

本規格只約束畫面素材與方向語意。家具 ID、footprint、`x/y/r`、價格、Station、
Socket、Occupancy、Placement 與存檔契約仍由既有資料與 0577d rotation policy
負責，不得由美術反向修改。

## 1. 主要可視面

- `front / south`：玩家面或顧客面是主視覺；操作面、展示面或裝飾面必須清楚。
- `back / north`：工作面、背板、層架或維修面是主視覺；不得把 front 圖改名重用。
- `right / west` 與 `left / east`：使用窄側面，顯示家具深度、側板、腳位與前後關係。
- 水平／垂直家具的主軸必須真的互換；不得靠移動同一張橫圖冒充旋轉。

## 2. 桌面、椅面與檯面層級

1. 桌子以桌面為最大、最亮且最先讀到的面；裙板與側板只作結構。
2. 椅子以椅背方向與椅面深度共同表達朝向；左右側面須顯示椅背厚度及前後腳。
3. 吧台以檯面連接所有方向；顧客面封閉、店員面開放，兩者不可混淆。
4. 展示櫃以玻璃展示面為正面，服務門／背板為背面，左右為窄玻璃端面。

## 3. Cardinal 語意

| rotation | 玩家語意 | Texture direction |
|---:|---|---|
| `r0` | South / front | `down-right` |
| `r1` | West / right side | `down-left` |
| `r2` | North / back | `up-left` |
| `r3` | East / left side | `up-right` |

`r + 1` 是玩家感知的順時針 90 度。`axis2` 只使用 r0 水平與 r1 垂直；legacy
r2/r3 僅顯示等價，不改寫存檔。

## 4. 接地、陰影與像素密度

- 直立家具使用 `(0.5, 1)` 底部中心 anchor；四向共用畫布尺寸與腳底基準線。
- 陰影只表達接地，使用短、低透明、暖褐像素橢圓；不得改碰撞或 footprint。
- 外輪廓以 1–2 source pixel 暖深褐為主；禁止純黑大面積與半透明白邊。
- Runtime 使用透明 RGBA PNG、整數畫布、Phaser `pixelArt/roundPixels`。
- 同一家具四向使用同一色盤、材質、結構比例與可見高度。

## 5. Footprint 視覺基準

- `1×1`：正／背寬於側面；主體應落在單格中央，不擴張成鄰格大小。
- `2×1`：水平視圖明顯橫跨兩格，視覺寬度至少為同系列 1×1 的約 1.7 倍。
- `1×2`：垂直視圖以明顯深度與窄正投影表達；不得仍顯示成 2×1 橫圖。
- 四向畫布可保留相同尺寸，但透明邊距必須對稱且底部中心一致。
- 並排的相同家具必須保持同高、同桌面厚度、同邊緣角度與同像素密度。

## 6. 家具與貓咪尺度

- 現有貓咪可見高度約 42–56 world px；椅面約落在貓咪肩背附近。
- 餐桌／吧台檯面應高於貓咪背部，且不超過高櫃的視覺量級。
- 1×1 椅子的可見寬度不應大於 2×1 餐桌的一半以上。
- 此比例只作視覺驗收；本階段不新增貓咪家具互動節點或行為 Runtime。

## 7. Phase 1 套用

Build 0577e 依本規格重畫：

- `pinkTableLong`：水平／垂直兩軸，四個 authored 檔案。
- `chair`：front/right/back/left 真四向。
- `counter`：顧客封閉面／左右窄側／店員開放層架面。
- `dessert`：甜點玻璃展示面／左右窄側／後方服務門。

其餘第一批 8 件仍使用 ART-0577 素材；其餘 35 件仍使用 base visual。第二批未核准。
