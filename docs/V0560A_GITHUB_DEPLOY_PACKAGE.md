# V0.56.0-alpha GitHub Pages 部署包

- 任務：`DEPLOY-0560A-GITHUB-PACKAGE`
- 日期：2026-07-24
- 相關：[V0562 結果](./V0562_FLAT_PROJECTION_RESULT.md)｜[V0562 驗收](./V0562_FLAT_PROJECTION_ACCEPTANCE.md)

> 本任務僅打包，未修改任何 Runtime、Projection、家具、存檔或介面。部署包由現有專案內容複製產生。

## 版本與 Build

| 項目 | 值 |
|---|---|
| 版本 | `V0.56.0-alpha｜淺俯視投影原型版` |
| Build | `0560a` |
| package version | `0.56.0-alpha` |
| Phaser | `3.90.0`（本地 `assets/vendor/phaser-3.90.0.min.js`，Canvas） |
| 存檔 key | `catCafePhaserV0540` |

## 交付物

| 交付物 | 路徑 |
|---|---|
| 部署資料夾 | `dist/cat_cafe_v0560a_git_deploy/` |
| 部署 ZIP | `cat_cafe_v0560a_git_deploy.zip`（專案根目錄） |

- ZIP 大小：`7,376,850` bytes（約 `7.03 MB`）
- ZIP 檔案數：`286` 個檔案項目
- ZIP 項目一律使用正斜線（`/`），無反斜線，無多包一層。

## ZIP 根目錄結構

解壓縮後根目錄**直接**看到（無外層資料夾）：

```
.gitignore
.nojekyll
CREDITS.md
README.md
THIRD_PARTY_NOTICES.md
check.js
index.html
manifest.webmanifest
package-lock.json
package.json
assets/
docs/
icons/
splash/
tests/
```

## 包含內容

- **Runtime 進入點與設定**：`index.html`、`manifest.webmanifest`、`.nojekyll`、`.gitignore`、`package.json`、`package-lock.json`、`check.js`、`README.md`、`CREDITS.md`、`THIRD_PARTY_NOTICES.md`。
- **Runtime 程式與素材（`assets/`）**：`assets/vendor/phaser-3.90.0.min.js`、`assets/js/`（含 `systems/SpatialGrid.js`、`systems/IsoProjection.js`、`systems/FlatProjection.js`、`core/projection-mode.js`、`systems/GridSystem.js`、`scenes/CafeScene.js`）、`assets/css/`、`assets/furniture/`（含 `redrawn/` 100 張四方向 PNG）、`assets/cats/`、`assets/environment/` 等 Runtime 實際引用素材。
- **PWA 素材**：`icons/`（4 檔，含 manifest 與 apple-touch-icon 引用）、`splash/`（7 檔）。
- **文件（`docs/`）**：ART_BIBLE、FURNITURE_AUDIT、PROTOTYPE_REDRAW_PLAN/RESULT/CONTACT_SHEET、V0552_MANUAL_BROWSER_ACCEPTANCE、V056_ARCHITECTURE_AUDIT、V056_IMPLEMENTATION_PLAN、V0561_IMPLEMENTATION_RESULT、V0562_FLAT_PROJECTION_RESULT、V0562_FLAT_PROJECTION_ACCEPTANCE、current-state、decisions、devlog、roadmap、`handoffs/`、`templates/`、以及 `evidence/v0562/` 的 5 張真實瀏覽器截圖。
- **測試（`tests/`）**：全部 `*.test.js` 與 `tests/helpers/`。

## 排除內容（已確認 ZIP 內不存在）

| 項目 | 狀態 |
|---|---|
| `node_modules/` | 排除 |
| `legacy/` | 排除 |
| `tools/` | 排除 |
| `dist/`（其他版本） | 排除 |
| `.git/` | 不存在（此環境無 git） |
| 其他 ZIP（含舊版 `*_git_deploy.zip`） | 排除 |
| `*_backup*`、備份/暫存檔 | 排除 |
| `.DS_Store`、`Thumbs.db` | 排除 |
| 本機絕對路徑／個人設定／瀏覽器資料 | 未包含 |

## 驗證結果

| 檢查 | 結果 |
|---|---|
| `npm test` | **通過**（Core tests passed） |
| `npm run check:deploy` | **通過**（Build 0560a、48 JavaScript modules） |
| `node check.js --deploy --zip cat_cafe_v0560a_git_deploy.zip` | **通過**（ZIP 根檔案齊全、無 node_modules/legacy/tools/.git/其他 zip、docs 與 redraw 素材齊全） |
| ZIP 根目錄多包一層 | **無** |
| `.nojekyll` 於 ZIP 根 | **有** |
| `assets/js/systems/FlatProjection.js` 於 ZIP | **有** |
| `assets/js/core/projection-mode.js` 於 ZIP | **有** |

### 從部署資料夾啟動（真實瀏覽器）

以本機 HTTP server 服務 `dist/cat_cafe_v0560a_git_deploy/`，並以本機 Chrome（headless）逐一驗證，全部 `gameReady`、無 page error、projectionMode 正確：

| URL | 期望 | 結果 |
|---|---|---|
| `/` | iso | ✅ ready、projectionMode=iso、無錯誤 |
| `/?projection=iso` | iso | ✅ |
| `/?projection=flat` | flat | ✅ |
| `/?projection=flat&artDebug=1` | flat | ✅ |
| `/?projection=invalid` | iso（安全回退） | ✅ |

> 未使用 `file://` 作為驗收；均以 HTTP 載入。手動指令：`cd dist/cat_cafe_v0560a_git_deploy && py -m http.server 8765`（或 `python -m http.server 8765`），再於瀏覽器開啟上列網址（將 `/` 換成 `http://127.0.0.1:8765/`）。

## Runtime 修改確認

- JavaScript 邏輯是否修改：**否**（僅複製）
- HTML／CSS 是否修改：**否**
- 素材是否修改：**否**
- 存檔是否修改：**否**（key/schema 不變）
- 版本／Build 是否修改：**否**（維持 0.56.0-alpha / 0560a）

## GitHub Pages 上傳方式

1. **先解壓縮** `cat_cafe_v0560a_git_deploy.zip`。
2. 將**解壓縮後的根目錄內容**（`index.html`、`assets/`、`docs/` … 等）上傳到 GitHub Repository 根目錄。
3. Repository 根目錄必須**直接看見 `index.html`**（不得多一層 `cat_cafe_v0560a_git_deploy/`）。
4. **不要**把 ZIP 檔本身當網站內容上傳；GitHub Pages 不會自動解壓縮。
5. `.nojekyll` 必須位於根目錄，確保 Pages 不以 Jekyll 處理 `assets/` 底線資料夾等。
6. 啟用 GitHub Pages（Settings → Pages → 由該分支根目錄部署）。

### 驗收網址（部署後）

- 預設 iso：`https://<user>.github.io/<repo>/` 或 `?projection=iso`
- Flat Prototype：`?projection=flat`
- Flat + Art Debug：`?projection=flat&artDebug=1`
- 非法值安全回退 iso：`?projection=invalid`

> 提醒：Flat 為 opt-in Prototype，**預設仍為 iso**；投影模式不寫入存檔。
