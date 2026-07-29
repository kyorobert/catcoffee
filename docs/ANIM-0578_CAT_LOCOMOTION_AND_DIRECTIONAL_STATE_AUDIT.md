# ANIM-0578 貓咪移動與方向狀態稽核輸入

優先級：P0  
候選任務：`ANIM-0578-CAT-LOCOMOTION-AND-DIRECTIONAL-STATE-AUDIT`  
狀態：待產品另立 Task Card；ART-0577J 不實作

## 目前問題

1. 貓咪沒有可信的左右側姿；水平位移常沿用正面／背面 sprite，形成滑行感。
2. walk loop 的四足腳步差與重心轉移不足，方向 silhouette 不穩。
3. 起步、轉向、連續路徑節點及停止之間缺少顯示狀態過渡。
4. 現有 idle/walk/sit/sleep 動作不足以支撐桌椅島與服務帶的生活感。
5. 貓咪只把家具 occupancy 當阻擋，不消費 seat、cat-rest、cat-play、
   approach point 或服務 socket。
6. 缺少坐椅、上窩、靠近桌邊、使用貓抓柱等家具對應姿勢與保留狀態。

## 下一卡應先稽核

- 現行 spritesheet 的方向、frame、flipX 與動畫 state mapping。
- CatBehaviorController 在水平／垂直 segment 上的方向選擇。
- 連續 BFS 路徑中動畫是否被節點重啟。
- 起步／轉向／停止所需的最小狀態模型。
- 四足 walk cycle 的腳序、輪廓與手機 390×844 可讀性。
- furniture visual/socket、approach cell、cat reservation 與 Depth 的資料契約。
- 舊存檔中 cat ID、gridX/gridY、duty 與 stats 的相容邊界。

## 明確非目標

ART-0577J 沒有修改 CatEntity、CatBehaviorController、spritesheet、Pathfinding、
Occupancy、Save 或任何貓咪 Runtime。此文件只把產品可見缺陷轉成下一張架構／
動畫稽核卡的正式輸入。

