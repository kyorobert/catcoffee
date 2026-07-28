# V0577E 正交家具視覺重構第一階段驗收

## 自動化 Gate

| 項目 | 結果 |
|---|---|
| `pinkTableLong` axis2 水平／垂直比例差 | 通過 |
| `pinkTableLong` 兩步 round-trip | 通過 |
| `chair` South→West→North→East 順時針 | 通過 |
| `chair` 四向 silhouette 與四椅環 | 通過 |
| `counter` 顧客面／工作面／左右側 | 通過 |
| `dessert` 展示面／服務背面／左右側 | 通過 |
| Entity／Ghost／Preview／commit 同 resolver | 通過 |
| 390／393／430 touch toolbar | 通過 |
| iso／flat／invalid fallback | 通過 |
| Browser pageerror／failed request | 0／0 |
| save key/schema/migration | `catCafePhaserV0540`／5401／5402 |

## Browser Smoke

- 真實本機 Chrome。
- 390×844、393×852、430×932、844×390、1024×768、1366×768、
  1440×900、1650×930。
- fresh／legacy save、orthogonal／alias／demo／artDebug／invalid projection。
- Canvas 1、CafeScene active、170 furniture textures loaded、missing texture 0。
- 同一組 Browser Smoke 與 rotation-browser 已從
  `dist/cat_cafe_v0577e_git_deploy/` 部署樹再次啟動並通過，不依賴工作樹專用素材。

## 人工 Gate

- iPhone Safari 真機：**pending**。
- 實機需確認：桌椅縮小後辨識、連續旋轉手感、safe area、地址列變化與 pinch/pan。
- 第二批 35 件：**未核准、未開始**。

因此版本維持 alpha，不以 Chrome 自動化宣稱 iPhone Safari 產品驗收完成。
