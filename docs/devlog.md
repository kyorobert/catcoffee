# 開發日誌

## 2026-07-26：V0.57.6-alpha / ARCH-0575C

- 修改前 gate：`npm test`、`check:deploy`、`check:dev`（含 Chrome smoke）全數通過。
- 根因：V0575B shell 的淺色 `floorFill` 與 playable zone floor 太接近，造成「看起來是地板、實際 out-of-bounds」；不是第二套 Placement 規則。
- 新增 `ortho-room-skin.js`：wall/wainscot/trim/floor/reserved/shell/door/decor anchors 集中設定；Projection 移除 render metadata。
- `drawRoomOrtho()` 改由 Skin + live `isPlaceableCell()` 畫面：78 格 playable、2 格 reserved threshold、Grid 外 deep-wood fixed shell。
- 門改 Skin-owned geometry，新增 casing/lintel/cafe sign/窄 threshold；logical entrance metadata 與 save entrance 未改。
- `FurnitureDragController` 增加 candidate signature + shared evaluation；preview 與 unchanged commit 共用結果。
- 新增 `ortho-playable-area-skin.test.js`；擴充 drag preview/commit regression；browser smoke 讀 live skin tokens。
- Chrome 自動化：390/393/430、desktop、ortho/demo/artDebug/invalid fallback 通過；390 zoom1.3 real pan delta X104/Y98，pageerror/request failure 0。
- 證據：`docs/evidence/v0576/`；結果／驗收／比較文件已建立。
- 受保護契約：Camera 行為、ROOM_CONFIG/placeableMask、Grid/Occupancy/Placement、save key/schema、furniture ID/x/y/r/footprint、iso/Flat 不變。

每筆紀錄包含版本、目標、完成內容、驗證、已知限制與下一步。歷史版本若 repository 沒有完整日期或測試輸出，會明確標示為回溯摘要，不補造證據。

## 2026-07-26｜ARCH-0575A-ORTHOGONAL-ROOM-SHELL-FULLBLEED-AND-DOOR-SCALE

- 版本／Build：**V0.57.5-alpha｜正交房間外殼與門比例修正版** / **0575b**（由 0575a 升版；package 維持 0.57.5-alpha；存檔 key `catCafePhaserV0540`、schema 5401、migration 5401 皆不變）
- iPhone 驗收（0575a）：Zoom/Pan **通過**（凍結核心）；房間**外殼滿版未通過**（四周房外背景、像卡片）、**視覺門比例未通過**（近兩格深色矩形、像倉庫門）。小範圍修外殼與門，不重構 Camera、不重畫家具。
- 留白根因（已稽核）：主因是**房間視覺外殼只畫到邏輯 10×8 Grid 矩形**，Grid 邊界外即背景 → 卡片感；Camera framing 殘留極少（V0575 已壓到 ~18px）且核心凍結；非 CSS/DOM。
- A 外殼滿版：`ORTHOGONAL_ROOM_RENDER.shell={side84,top120,bottom132,floorFill}`；`drawRoomOrtho` 把地板外殼（中性淺色）＋牆面外殼（牆色）畫到超出 Grid 到 safe viewport 邊緣；取消粗矩形卡片外框，改細牆腳線/收邊（`playAreaLineWidth`）區分可玩區。**純視覺、不新增 placeable cells、不改 placeableMask/Grid/Occupancy/存檔**。real-browser 手機 390/393/430 首屏外圈背景 external margin ~18px→**~0px**。可 zoom-out 整房、zoom-in pan 外圍。
- B 門比例＋視覺：`logicalEntranceZone {x7,w2}` 維持兩格；新增較小 `visualDoorBounds {x:6.8,w:1.4}`（grid-coord、置中 x7-8、實測 123×124 world px、右緣 gridX 8.2≤8.5 → x9 牆）；`doorHeight 168→124`；門改分層繪製 `door={frame,leaf,glass,glassEdge,handle,panel,matFill}`——木門扇(非黑洞)＋玻璃格窗(muntins)＋黃銅門把＋門框＋下嵌板。entryPoint(8,0)/staging(8,1)/x9/舊存檔入口(8,7)(9,7) 不變。**visualDoorBounds ≠ 兩格 logical entrance。**
- Camera：**CameraController 核心未改**（viewCentre/pan/clamp 不動；非受保護、僅 `?v=` 隨版本升）。real-browser 真實指標拖曳仍 X/Y 可 pan、四邊 clamp、minZoom 整房。
- 修改檔案：`ortho-room-zones`（logicalEntranceZone＋縮小 visualDoorBounds）、`OrthogonalProjection`（shell/playAreaLineWidth/doorHeight/door 分層色）、`CafeScene.drawRoomOrtho`（外殼延伸＋細收邊＋分層門）。測試：`ortho-room-zones`（門幾何：logicalEntranceZone、visualDoorBounds<2格/置中/x9牆）、`ortho-projection`（shell 延伸、door leaf 非暗、glass>leaf>frame 層次、doorHeight~124）、`browser-smoke`（shell margin≈0、door 中央非暗塊、zoom-in pan 回歸）、`build-consistency`（版本）。Build 升版 0575a→0575b＋`check.js`（Build/APP_VERSION/obsolete `?v=0575a`/protected hash：OrthogonalProjection/ortho-room-zones/GridSystem/flat-presets/viewport-metrics；camera-framing 與 CameraController hash 不變/無 hash）；docs decisions(DEC-023)/current-state/roadmap/handoff/README ＋ V0575B 三份 ＋ evidence/v0575b(+metrics.json)。
- 驗證：`check:deploy` 通過（0575b、55 modules）；`check:dev` 通過（**本機真實 Chrome**，含 shell external margin≈0、door 非暗、zoom-in 真實拖曳 pan、x0/x9 非暗、demo 不寫存檔、invalid 回退）；`ortho-room-zones`/`ortho-projection`/`camera-framing`/`ortho-demo-layout`(23)/`grid-projection-compat`(iso/Flat golden 未改) 皆通過；18 張 real-browser 證據＋metrics.json 零 page error。
- 誠實判斷：外圈背景 ~18px→~0px（外殼填滿、不再卡片）、門由兩格深塊→1.4 格分層木門、Zoom/Pan 凍結且回歸通過皆達成；桌面左右邊距（手機優先）、門仍 Prototype、家具仍 Placeholder；最終以 iPhone 實機為準。
- 已知限制：家具/門仍 Placeholder/Prototype（ART-0576）；桌面邊距；分區僅視覺、無行為（ARCH-0576-STATION-REGISTRY）；手機實機驗收 pending；未 commit/push/部署；本環境無 `.git`。

## 2026-07-26｜ARCH-0575-ORTHOGONAL-FULLBLEED-PAN-AND-ZONE-CLEANUP

- 版本／Build：**V0.57.5-alpha｜正交滿版操作修正版** / **0575a**（由 0574a 升版；存檔 key `catCafePhaserV0540`、schema 5401、migration 5401 皆不變）
- iPhone 回饋（V0574 未通過）：(1) 四周留白太多像展示卡片；(2) **放大後無法平移**（有 zoom 沒 pan，P0）；(3) 左右不明**深色直條**。方向與兩格門維持，先修 zoom/pan、滿版、分區視覺，家具重畫續延。
- **P0 根因（已稽核，非放寬 magic number）**：互動平移把 `camera.scrollX/Y` 直接位移後，`clampToContent` 以 **`camera.midPoint`** 重算中心再 `centerOn` 回去；Phaser `midPoint` 只在 `preRender` 更新，位移當下讀到**過期值** → 把剛平移量歸零 → pan 死。自動化證據當時用 `centerOn`（會同步更新 midPoint）故未暴露。**修正**：clamp 改由即時 `scrollX + width/2` 推導中心（新 `viewCentre()`），不讀過期 midPoint。real-browser 真實指標拖曳驗證：zoom-in 1.35 左/右 scrollX 289→880、上/下 scrollY 亦變、四邊 clamp、minZoom 整房。未建第二套 CameraController。
- 深色直條：來源 `zoneFloor.outer`（x0/x9）用暗色 `0x7f6549`。改**中性淺色地板** `0xe7c295`；全 zone tint 改低對比淺暖（luminance 皆>150）；`zoneAt` 未知 key 回退 `outer`；外圈為真實可行走/可擺放地板。browser-smoke 於 minZoom 取樣 x0/x9 空地板實際像素斷言非暗。
- 留白：根因門固定 x7-8 → 首屏 width-constrained，房高只填 ~87% canvas。三管齊下：`marginCss 10→8`；`toolbarReserveCss 78→40`（首屏無選取時整條保留是浪費、變上下留白）；背牆做成**有家具的較高背牆**（`wallHeight 155→260`/`coreTopStrip 138→220`/`doorHeight 118→168` ＋ wainscot 護牆板/molding ＋牆飾＋門）填滿上方而非空白牆；背景 `backdropFill 0xbfa079` 近地板暖色。上下留白 V0574 ~44px → **18/19/26px（390/393/430）**。cell 88×120 不變、門完整可見、可 zoom-out 整房、zoom-in 可 pan 看外圈。**誠實限制**：門在 x7-8＋88×120 無法在不裁門下 100% 填滿；~18px 略高於 8-16 目標；單件家具尺寸未放大。
- 分區：沿用 V0574 的 23 件成組 Demo（未改）；底色低飽和淺色 hint，辨識主靠家具（連續服務帶/兩組座位/集中貓咪）。
- 修改檔案：`CameraController`（viewCentre + clamp 修正）、`camera-framing`（margin/reserve）、`OrthogonalProjection`（wall/door/strip/zoneFloor/backdrop/wainscot）、`CafeScene.drawRoomOrtho`（backdrop+wainscot+zone 淺色）。測試新增/更新：`camera-framing`（zoom-in pan range>0 兩軸、view>room 鎖中心）、`ortho-projection`（zoneFloor 無暗帶/中性/backdrop 暖）、`browser-smoke`（真實拖曳 pan X/Y + x0/x9 非暗）、`build-consistency`（版本）、`camera-framing`（新 wall260 幾何）。版本機械升版 0574a→0575a＋`check.js`（版本/Build/obsolete `?v=0574a`/protected hash 更新 OrthogonalProjection/camera-framing/GridSystem/flat-presets/viewport-metrics）；docs decisions(DEC-022)/current-state/roadmap/handoff/README ＋ V0575 三份 ＋ evidence/v0575(+metrics.json)。`ortho-room-zones`/`ortho-demo-layout`/`scene-viewport`/`room-config`/`furniture-config` hash 未變；CameraController 非受保護。
- 驗證：`check:deploy` 通過（0575a、55 modules）；`check:dev` 通過（**本機真實 Chrome**，含 zoom-in 真實指標拖曳 pan X/Y、x0/x9 非暗帶、demo 不寫存檔、invalid 回退）；`camera-framing`/`ortho-projection`/`ortho-demo-layout`(23)/`ortho-room-zones`/`grid-projection-compat`(iso/Flat golden 未改) 皆通過；16 張 real-browser 證據＋metrics.json 零 page error。
- 誠實判斷：P0 pan（X/Y 可、scroll 變、四邊 clamp、minZoom 整房）、深色直條清除、留白 44→18px（明顯降低）、門保留皆達成；留白 ~18px 略高於目標、單件家具未放大（幾何鎖定），最終以 iPhone 實機為準。
- 已知限制／未完成：家具仍 Placeholder（ART-0576）；情境列選取時短暫覆蓋底部（reserve 縮小取捨）；分區僅視覺、無行為（ARCH-0576-STATION-REGISTRY）；桌面左右邊距；手機實機驗收 pending；未 commit/push/部署；本環境無 `.git`。

## 2026-07-26｜ARCH-0574-ORTHOGONAL-PORTRAIT-COMPOSITION-AND-ZONING-REFINE

- 版本／Build：**V0.57.4-alpha｜正交營業區聚焦分區版** / **0574a**（由 0573a 升版；存檔 key `catCafePhaserV0540`、schema 5401、migration 5401 皆不變）
- iPhone 回饋：V0573 核心滿版但「周遭留白仍太多、看不出分區」（連續服務區/員工側vs顧客側/座位成組/貓咪集中皆看不出）。目標：首屏聚焦有效營業區、縮牆、分區一眼可辨。**本任務為構圖與分區精修，不是家具重畫（ART-0574）。**
- 根因（誠實）：門在 x7-8，首屏 core 必含 x8 → fit zoom 鎖在 ~0.526，無法在不裁門下放大單件家具。故不靠放大縮放，改三管齊下：縮牆＋加密 Demo＋分區底色。
- A 縮牆聚焦：`ORTHOGONAL_ROOM_RENDER` wallHeight 200→155、coreTopStrip 140→118、doorHeight 130→112。上方空牆變薄、門周邊不再大片空。首屏仍 core(x1-8) 滿版：safe 縱向 94%/93%/91%（較 V0573 96/95/93% 略降，換更少空牆），crop ~8%，可 zoom-out 看整房。
- C 分區底色（可辨關鍵）：新增 `ortho-room-zones.zoneAt(x,y)`（純格邏輯）＋`ORTHOGONAL_ROOM_RENDER.zoneFloor`（暖色）；`drawRoomOrtho` 依 zoneAt 為每格上分區底色（`shadeColor` 逐格二階明暗）。zone key `staff`→`work`（身份中性，維持投影 purity）。分區收斂為乾淨分割：`customerServiceZone`/`seatingZone`/`catZone` 收為 x1-6，與 x7-8 走道不重疊（zoneAt 核心 64 格：work12/counter6/service6/seating12/cat12/aisle16）。
- C Demo 重排（23 件，密度 28%→48%）：連續設備帶(coffeeMachine/oven/washStation/dessert/bookshelf 覆蓋 x1-6)＋連續櫃檯(counter/console/counter 覆蓋 x1-6)＋顧客前廳(smartOrder 左角)＋兩組座位(x1-2、x4-5 各在 rugStripe 上)＋集中貓咪角(doubleCatTree/catCastle/scratchPost/pawRug/creamSofa)。保留 y1 後走道、y3 前廳、x3/x6 直走道、x7-8 主走道；動線 入口→點餐→座位 不穿工作核心。Node 驗證全部合法、可達、工作側連續、主走道 12/12、設備帶+櫃檯各無縫覆蓋 x1-6。
- 修改檔案：改 `ortho-room-zones.js`/`OrthogonalProjection.js`/`CafeScene.js`(drawRoomOrtho+shadeColor)/`ortho-demo-layout.js`；更新 `ortho-room-zones`(zoneAt)/`ortho-demo-layout`(23件)/`camera-framing`(新wall/strip)/`ortho-projection`(身份中性)/`build-consistency` 測試。版本機械升版 0573a→0574a＋`check.js`（版本/Build/obsolete `?v=0573a`/protected hash 更新 OrthogonalProjection/ortho-room-zones/GridSystem/flat-presets/viewport-metrics）；docs decisions(DEC-021)/current-state/roadmap/handoff/README ＋ V0574 三份 ＋ evidence/v0574。`camera-framing`/`scene-viewport`/`SpatialGrid`/`room-config`/`furniture-config`/`projection-mode` hash 未變。
- 驗證：`check:deploy` 通過（0574a、55 modules）；`check:dev` 通過（**本機真實 Chrome** browser smoke）；`ortho-room-zones`/`ortho-demo-layout`(23)/`camera-framing`(94-91% fill)/`ortho-projection`/`grid-projection-compat`(iso/Flat golden 未改) 皆通過；15 張 real-browser 證據＋before/after 零 page error。
- 誠實判斷：#1門保留、#3連續服務區、#4工作/顧客側、#5座位成組、#6貓咪集中、#2留白（縮牆+密度+底色）皆明顯改善，應可通過分區辨識目標；單件家具尺寸與 V0573 相同（幾何鎖定，非本版放大）；分區底色在小螢幕差異偏微妙可再調。最終以 iPhone 實機為準。
- 已知限制／未完成：家具仍 Placeholder（ART-0574）；分區僅空間/視覺、無行為（ARCH-0575-STATION-REGISTRY）；桌面左右有邊距；手機實機驗收 pending；未 commit/push/部署；本環境無 `.git`。

## 2026-07-26｜ARCH-0573-ORTHOGONAL-FULL-BLEED-AND-CORE-ZONING

- 版本／Build：**V0.57.3-alpha｜正交滿版營業區原型版** / **0573a**（由 0572a 升版；存檔 key `catCafePhaserV0540`、schema 5401、migration 5401 皆不變）
- iPhone 再驗收回饋：V0.57.2 比例＋背牆已改善占比，但仍「滿版感不足、上下留白」。根因：首屏 framing 仍以**整個房間**（含外圈 x0/x9 與整面高牆）contain，寬受限下高度必留白。目標：首屏改「核心營業區滿版」＋把分區升級為正式 metadata；不重畫家具、不做營運/角色系統、不改存檔。
- 取景（core/room 分離）：新增 roomBounds（整房＝地板＋整面背牆＋外圈，作 pan/zoom-out）與 coreGameplayBounds（首屏取景＝遊戲欄 x1–8＋短牆條 coreTopStrip 140）。`camera-framing.computeInitialFraming` 改收 `core`(fit)＋`room`(clamp/minZoom)，保留單一 `content` 舊路徑；`CameraController` 以 `getCoreBounds`(fit)＋`getRoomBounds`(pan/zoom-out) 取代單一 content，minZoom＝整房 fit。結果（safe viewport＝canvas−78）：核心縱向占 **96%/95%/93%**（390/393/430），左右每側裁切 ~8%（皆外圈欄，關鍵分區 0 裁切）；zoom-out 可見整房、0 裁切。**未改 cell 尺寸**（以取景達標，非把 120 硬拉大）。
- 兩格門：`ORTHOGONAL_ROOM_RENDER` 改為 `doorHeight=130`/`coreTopStrip=140`/`door` 顏色（移除舊角落單格 `entrance`）；`drawRoomOrtho` 由 `ortho-room-zones.visualDoorBounds` 畫 **x7–8 兩格**下牆門（x9 留牆、門不貼邊、落在 core 條內首屏完整可見）＋`customerEntryPoint(8,0)` 地墊。**logical 存檔入口 (8,7)/(9,7) 不變。**
- Zone metadata：新增 `assets/js/config/ortho-room-zones.js`（純格矩形＋純 helper：visualDoorBounds/customerEntryPoint/customerEntryStaging/staffWorkZone/serviceCounterLine/customerServiceZone/seatingZone/catZone/mainAisle/coreGameplayBounds；無 world pixel/Phaser/DOM/actor 身份、可 Node 測試；**非 StationRegistry、非 CustomerFlowSystem、無邏輯**）。三層服務：A 背牆設備帶＋B 員工工作區(後、連續)＋C 顧客服務區(前)，中隔櫃檯。
- Demo：`ortho-demo-layout.js` 依 zones 重排 **18 件**（設備 y0／櫃檯 y2／植栽 y3／兩桌組 y4–5／貓咪 y6–7；主走道 x7–8 全清），`ORTHO_DEMO_ENTRANCE` 取自 `customerEntryPoint`；display-only、不入存檔。Node 驗證：18 件合法無重疊、入口→服務/座位/貓咪可達、**主走道 12/12 全通**、顧客動線不穿員工工作區、員工工作區內部連續(8 格)。
- 修改檔案：新增 `ortho-room-zones.js`＋`tests/ortho-room-zones.test.js`；改 `OrthogonalProjection.js`/`camera-framing.js`/`CameraController.js`/`CafeScene.js`/`ortho-demo-layout.js`；更新 `ortho-demo-layout`/`camera-framing`/`ortho-projection`/`browser-smoke` 測試（browser-smoke 由「整房 fit＝minZoom/整寬可見」改為「核心滿版可見/外圈裁切/可 zoom-out 至整房」）。版本機械升版 0572a→0573a＋`check.js`（版本/Build/obsolete `?v=0572a`/protected hash 更新 OrthogonalProjection/camera-framing/GridSystem/flat-presets/viewport-metrics＋新增 ortho-room-zones／required＋test／`.gitattributes` 納入 root 與 ZIP root）；docs decisions(DEC-020)/current-state/roadmap/handoff/README ＋ V0573 三份 ＋ evidence/v0573。`SpatialGrid`/`room-config`/`furniture-config`/`projection-mode`/`scene-viewport` hash 未變。
- 驗證：`check:deploy` 通過（0573a、55 modules）；`check:dev` 通過（**本機真實 Chrome** browser smoke，含 ortho 核心滿版/外圈裁切/可 zoom-out 整房/demo boot/invalid 回退）；`ortho-room-zones`/`ortho-demo-layout`(18)/`camera-framing`(96-93% fill、8% crop)/`ortho-projection`/`build-consistency`/`grid-projection-compat`(iso/Flat golden 未改) 皆通過；15 張 real-browser 證據＋before/after 零 page error。
- 已知限制／未完成：家具仍 Placeholder（待 ART-0574）；三層服務僅空間 metadata、無行為邏輯（待 ARCH-0574-STATION-REGISTRY）；桌面左右有邊距（手機優先）；手機實機再驗收 pending；未 commit/push/部署；本環境無 `.git`。

## 2026-07-25｜ARCH-0572-ORTHOGONAL-PORTRAIT-DENSITY-AND-ROOM-ZONING

- 版本／Build：**V0.57.2-alpha｜正交直立空間調整版** / **0572a**（由 V0.57.1-alpha / 0571a 升版；存檔 key `catCafePhaserV0540`、schema 5401、migration 5401 皆不變）
- iPhone 再驗收回饋：Orthogonal 方向保留，但 V0.57.1 房間內容太小、上下留白太多、缺乏手機直立滿版感、Demo 仍像家具展示。目標：手機直立滿版化 + 咖啡廳空間分區；不重畫家具、不做營運系統；iso 仍預設。
- 滿版化（Projection 比例）：`OrthogonalProjection` cellWidth 104→88、cellHeight 88→120（origin {312,252}→{384,140}、det 9152→10560；仍 axisX.y=0/axisY.x=0，完全水平/垂直、cell 在世界 bounds 內）。fit-to-width 於直立仍 width-constrained，更高 cell 直接增加房間螢幕高度。加**整面背牆** `ORTHOGONAL_ROOM_RENDER.wallHeight=200` 並納入 framing content bounds。結果：手機直立房間占 canvas 高度 ~44%→~78%，上下留白顯著減少，fit zoom 0.356→~0.42（家具更大）。「先 Camera、Camera 無法達成才調 Projection」——V0571 已確認 Camera 無法單獨消除固有留白，故本版調整比例。
- 入口/櫃檯：右上角顧客入口門（`ORTHOGONAL_ROOM_RENDER.entrance.cell=(9,0)`；drawRoomOrtho 畫門+入口地墊、移除底部 logical 入口高亮）；理由：服務帶置上方左至中、門置相對右上角避免穿越工作側，右欄+y1 形成門→櫃檯→座位路線。上方連續櫃檯/服務帶（收銀/出餐/咖啡/甜點/員工工作區方向）。**僅改 Demo/prototype 入口視覺與路線；logical 存檔入口 (8,7)/(9,7) 與存檔契約不變。**
- Demo：`ortho-demo-layout.js` 重排 17 件（服務帶 y0、兩桌組+rug、右植栽、前左貓咪區），`ORTHO_DEMO_ENTRANCE=(9,0)`；display-only、不改 state/coins、不觸發 save、存檔無 projection/demoLayout；BFS 入口→櫃檯前/座位/貓咪皆可達（reach 59、非迷宮）。
- 修改檔案：改 `OrthogonalProjection.js`、`CafeScene.js`（drawRoomOrtho 背牆+門、buildOrthoFraming content 含背牆）、`ortho-demo-layout.js`；更新 `ortho-projection.test.js`(新 dims pins)、`ortho-demo-layout.test.js`(17 件/入口/可達)、`camera-framing.test.js`(新 content)；版本機械升版 0571a→0572a、`check.js`（版本/Build/obsolete +`?v=0571a`/protected hash 更新 OrthogonalProjection/GridSystem/flat-presets/viewport-metrics）；docs decisions(DEC-019)/current-state/roadmap/handoff/README + V0572 三份 + evidence/v0572。Camera framing 純模組（scene-viewport/camera-framing）內容未變；`projection-mode`/`FlatProjection`/`IsoProjection`/`SpatialGrid`/`room-config`/`furniture-config` hash 未變。
- 驗證：`npm test`、`ortho-projection`、`ortho-demo-layout`、`camera-framing`、`projection-mode`、`flat-*`、`grid-projection-compat`（iso/Flat C golden 未改）、`build-consistency` 皆通過；`check:deploy` 通過（0572a、54 modules）；`check:dev` 通過（**本機 Chrome 實際 browser smoke**，含 ortho 首屏 fit=minZoom/整寬/無初始選取/情境列/invalid 回退）；14 張 real-browser 證據 + before/after 零 page error（首屏 390/393/430、pan 四邊界貼齊無空白、minzoom/zoomin、art-debug、桌面）。
- 已知限制／未完成：手機直立仍有少量房間基色邊距（已大幅減少、非黑）；家具仍 Placeholder（待 ART-0573）；桌面因房間改直立比例左右有邊距（手機優先）；手機實機再驗收 pending；未 commit/push/部署；本環境無 `.git`。
- 下一步：產品負責人依 `docs/evidence/v0572/` 與 [V0572 驗收](./V0572_ORTHOGONAL_PORTRAIT_ACCEPTANCE.md) 實機判斷；通過後才啟動 `ART-0573-CORE-ORTHOGONAL-FURNITURE`。

## 2026-07-25｜ARCH-0571-ORTHOGONAL-MOBILE-FRAMING-AND-LAYOUT

- 版本／Build：**V0.57.1-alpha｜正交手機構圖調整版** / **0571a**（由 V0.57.0-alpha / 0570a 升版；存檔 key `catCafePhaserV0540`、schema 5401、migration 5401 皆不變）
- iPhone 基線回饋：Orthogonal 正交方向正確，但 V0.57.0 手機首屏 Camera 過度放大（只見約 37% 房間寬）、需大量左右拖曳、拖到房間外露出大片背景、Demo 過鬆散。根因：CameraController 對 ortho 沿用 iso/flat 的 cover-zoom + world bounds。
- 目標：只修 Camera framing／safe viewport／房間有效邊界／Demo 構圖；不動投影數學、不重畫家具、不做營運系統；iso 仍預設。
- Safe viewport：新增純模組 `core/scene-viewport.js`（`deriveOverlayInsets` 只扣實際覆蓋 canvas 的浮動元件、依最近邊界歸位；`computeSafeViewport` 永不反轉）＋ DOM adapter `ui/viewport-metrics.js`（唯一讀 viewport DOM rect 處，`getBoundingClientRect`、不硬編碼裝置/工具列；情境列隱藏時保留底部 reserve 78）。canvas 尺寸沿用 Phaser RESIZE（已排除 HUD/底部列/上下 safe-area）＋ visualViewport（main.js 未改）。
- Camera fit：新增純模組 `core/camera-framing.js`（`computeFitZoom`＝min(safeW/contentW, safeH/contentH)、上限 maxInitialZoom、下限 minZoomFloor；`clampCenterToContent` 以相機中心表達、view≥content 置中否則夾房間內；`computeInitialFraming` 回 {zoom,centerX,centerY,minZoom}）。**定位改用 centerOn（world midpoint），修正 V0.57.0 首版誤把 scrollX/scrollY 當 world 左上角導致房間偏移的 bug。** content bounds＝房間視覺矩形（demo 與既有布局都用房間 bounds，不因家具少過度放大）。所有數值集中於 `ORTHO_FRAMING`，無 390/393/430 硬編碼。
- CameraController（非受保護）：新增 `applyFraming`/`clampToContent`；ortho 移除 world bounds、pan/pinch/wheel/resize 後 clamp 到房間；minZoom＝fit；iso/flat 分支完全不變。CafeScene 新增 `buildOrthoFraming`（content bounds＋getSafeInsets via ViewportMetrics），`drawRoomOrtho` 底填擴大到 world 3×3 避免黑邊。
- Demo：`ortho-demo-layout.js` 由 23→**16 件**緊湊分區（服務帶 y0、兩桌組+rug y3-4、貓咪角 y6-7、入口淨空、BFS 可達），仍 display-only、不改 state/coins、不觸發 save、存檔無 projection/demoLayout。
- 修改檔案：新增 `scene-viewport.js`、`camera-framing.js`、`viewport-metrics.js`、`tests/camera-framing.test.js`、`docs/V0571_*`（結果/驗收/比較 HTML）、`docs/evidence/v0571/`（17 新＋3 before）；改 `CameraController.js`、`CafeScene.js`、`ortho-demo-layout.js`、`ortho-demo-layout.test.js`、`browser-smoke.test.js`（+首屏 fit/整寬/無選取/情境列/invalid 斷言）；版本機械升版 0570a→0571a、`check.js`（版本/Build/obsolete +`?v=0570a`/protected hash 更新 GridSystem+flat-presets、**新增保護 scene-viewport/camera-framing/viewport-metrics**、required/tests）；docs decisions(DEC-018)/current-state/roadmap/handoff/README。`OrthogonalProjection`/`projection-mode`/`FlatProjection`/`IsoProjection`/`SpatialGrid`/`room-config`/`furniture-config` hash **未變**。
- 驗證：`npm test`、`camera-framing`、`ortho-demo-layout`、`ortho-projection`、`projection-mode`、`flat-*`、`grid-projection-compat`（iso/Flat C golden 未改）、`build-consistency` 皆通過；`npm run check:deploy` 通過（Build 0571a、54 modules）；`npm run check:dev` 通過（**本機 Chrome 實際 browser smoke**，含 ortho 首屏 fit=minZoom/整寬可見/無初始選取/情境列/invalid 回退）；17＋3 張 real-browser 證據零 page error（初始/pan 四邊界貼齊無空白/zoom/選取情境列不遮房間且 Camera 不跳/桌面/before-after）。
- 已知限制／未完成：手機直立房間上下有房間基色邊距（wide 房型於 tall 螢幕固有 letterbox，非黑、置中完整；依「camera 能解就不改投影」未動 cellHeight）；家具仍 Placeholder；手機實機再驗收 pending；未新增營運/角色系統；未 commit/push/部署；本環境無 `.git`。
- 下一步：產品負責人依 `docs/evidence/v0571/` 與 [V0571 驗收](./V0571_ORTHOGONAL_MOBILE_ACCEPTANCE.md) 實機判斷；通過後才啟動 `ART-0572-CORE-ORTHOGONAL-FURNITURE`。

## 2026-07-25｜ARCH-0570-ORTHOGONAL-ROOM-PROTOTYPE

- 版本／Build：**V0.57.0-alpha｜正交平面咖啡廳原型版** / **0570a**（由 V0.56.1-alpha / 0561a 升版；存檔 key `catCafePhaserV0540`、schema 5401、migration 5401 皆不變）
- 目標：產品負責人拒絕 Flat A／B／C（整體歪斜、方向不清），改採手機直立、水平／垂直、正向閱讀的平面咖啡廳。停止斜投影微調，建立單一 `OrthogonalProjection`（正交平面）原型；iso 仍為預設。
- 產品決策落檔：Flat A/B/C = Rejected；DEC-016 = Superseded；DEC-017（正交方向、房間水平/垂直、核心家具可重作、不再以沿用全部等角家具為前提）= Accepted；DEC-008 部分更新（保留邏輯/投影分離，取代「淺斜為最終/不採正交」）。
- OrthogonalProjection（新增，自足、受保護 hash）：`axisX={104,0}`、`axisY={0,88}`（`axisX.y=0`、`axisY.x=0`，無 skew/shear/rotation）；det 9152；origin 由 centroid 推導置中（`gridToWorld(4.5,3.5)=(780,560)`）；`getCellDiamond` 回傳矩形 `[TL,TR,BR,BL]`；cellWidth/cellHeight 集中於 `ORTHOGONAL_PROJECTION_PARAMS`（依 10×8 房間、1560×1120 world、手機直立可讀性選定，經截圖驗證）。介面與 iso/flat 相容，經 GridSystem Facade 共用同一 SpatialGrid。
- Resolver/URL：`projection-mode.js` 加 `ortho` 與別名 `orthogonal`（純函式、非法回退 iso、不寫 localStorage/存檔）；`GridSystem` 第三參數選投影、不讀 URL、舊二參仍 iso；預設 iso。
- 正交房間 rendering（`drawRoomOrtho`，僅視覺、深度 -1000）：水平/垂直矩形地板、水平上牆、房間基色填滿側/下邊界（無黑區/非斜棋盤）、入口標示；全由投影幾何推導、非固定畫面座標、非 CSS transform；iso/flat branch 未動。
- Demo Layout（非存檔）：`ortho-demo-layout.js` 純資料 fixture（23 件現有家具，服務/座位/貓咪分區，入口淨空、走道可達），`?projection=ortho&demoLayout=1` opt-in、display-only；**不改 state.items/inventory/coins、不觸發 save、存檔不含 projection/demoLayout**（測試 + real-browser 驗證）。
- 家具相容：47 件在 ortho 無 Runtime error；ID/`x/y/r`/footprint/layer/rotation/price/socket/walkBlocking 不變；Entity/Ghost/ArtDebug 共用同一 Orthogonal anchor；**未加 override、未逐件校準、未重畫**（等角 sprite 為 Placeholder，待 ART-0571）。
- 修改檔案：新增 `OrthogonalProjection.js`、`ortho-demo-layout.js`、`tests/ortho-projection.test.js`、`tests/ortho-demo-layout.test.js`、`docs/V0570_*`（結果/驗收/家具重作計畫/比較 HTML）、`docs/evidence/v0570/`（13 張）；改 `GridSystem.js`、`CafeScene.js`（ortho 分支 + demo 接線）、`projection-mode.js`（+ortho）、擴充 `projection-mode.test.js` 與 `browser-smoke.test.js`（ortho boot + invalid 回退）；版本機械升版 0561a→0570a（含 CAT/FURNITURE_REDRAW 版本、index.html、manifest、package/lock）、`check.js`（版本/Build/obsolete +`?v=0561a`/protected hash 更新 GridSystem/projection-mode/flat-presets + 新增 OrthogonalProjection/required/tests）；docs decisions/current-state/roadmap/handoff/README。`FlatProjection`/`IsoProjection`/`SpatialGrid`/`room-config`/`furniture-config` hash 未變。
- 驗證：`npm test`、`ortho-projection`、`ortho-demo-layout`、`projection-mode`、`flat-*`、`grid-projection-compat`（iso/Flat C golden 未改）、`build-consistency` 皆通過；`npm run check:deploy` 通過（Build 0570a、51 modules）；`npm run check:dev` 通過（**本機 Chrome 實際 browser smoke**，含 ortho/ortho-demo boot、demo 隔離、invalid 回退）；13 張 real-browser 截圖零 page error，Art Debug 矩形 footprint 對齊 cell。
- 已知限制／未完成：Orthogonal 未設正式預設；等角家具透視為 Placeholder（待重作，本版不校準）；上牆較薄、手機因固定 landscape world 只顯示中央垂直帶需左右 pan；未新增營運/角色系統；手機實機驗收 pending；本環境無 `.git`（未 git init/commit/push/部署）。
- 下一步：產品負責人依 `docs/evidence/v0570/`、[比較 HTML](./V0570_ORTHOGONAL_COMPARISON.html) 與 [V0570 驗收](./V0570_ORTHOGONAL_ROOM_ACCEPTANCE.md) 判斷方向；通過後才啟動 `ART-0571-CORE-ORTHOGONAL-FURNITURE`（核心 10～12 件）。

## 2026-07-24｜ARCH-0563-FLAT-VISUAL-PRESET-COMPARISON

- 版本／Build：**V0.56.1-alpha｜淺俯視構圖比較版** / **0561a**（由 V0.56.0-alpha / 0560a 升版；存檔 key `catCafePhaserV0540` 不變）
- 目標：`ARCH-0562` Flat 技術可運作但過度扁平、家具像散落斜棋盤、後牆／空間感不足。建立三個「可同時比較」的 Flat 構圖 Preset（A｜Near Iso、B｜Balanced、C｜Current Flat），相同配置與鏡頭下提供桌面／手機截圖供產品負責人選定。**不自行選定正式方案。**
- 三 Preset：共用同一 `FlatProjection`，參數集中於**新增** `assets/js/config/flat-projection-presets.js`。以 iso 與現行 Flat 為端點插值後逐項驗證定案：
  - A `near-iso` axisX{78,22}/axisY{-37,48}/det 4558；B `balanced` axisX{93,13}/axisY{-10,63}/det 5989；C `current`＝`FLAT_PROJECTION_PARAMS`（axisX{112,0}/axisY{26,84}/det 9408，**以參照沿用、未調整**）。
  - determinant 單調 `iso<A<B<C`；每個 Preset 全 cell 在世界 bounds、round-trip 穩定、房間 centroid 皆對齊世界中心 `(780,560)`（取景公平）。
- URL／resolver：純函式 `resolveFlatPreset`/`flatPresetFromSearch`／`getFlatPreset`（`?projection=flat&flatPreset=near-iso|balanced|current`；無／未知／空→current；`projection` 非 flat 忽略 flatPreset；不寫 localStorage/存檔）；`GridSystem` 收已解析 id、不讀 URL；`CafeScene` 解析並公開 `grid.flatPreset`。**未**建立玩家可見 Preset 切換按鈕。
- 房間 rendering：`drawRoomFlat` 改 metadata 驅動（後牆高度、可選側牆、外框線寬、牆飾位置），全由投影幾何推導、僅視覺、深度 -1000；A/B 加左側牆＋後牆形成清楚牆角，C 重現 `ARCH-0562` 單一水平後牆；**iso branch 未動**。未改 cols/rows、placeableMask、entrance、家具 `x/y/r`、footprint、layer、rotation、Occupancy、Pathfinding、存檔。
- 修改檔案：新增 `flat-projection-presets.js`、`tests/flat-preset.test.js`、`.gitattributes`、`docs/evidence/v0563/`（14 張截圖）、`V0561_FLAT_PRESET_COMPARISON_RESULT.md`／`_ACCEPTANCE.md`；改 `GridSystem.js`、`CafeScene.js`；版本機械升版（build-info、index.html、manifest、package/lock、全 `assets/js` 模組 query、`CAT_ASSET_VERSION`/`FURNITURE_REDRAW_ASSET_VERSION`→0561a）、`check.js`（版本/Build/obsolete 新增 `?v=0560a`/import-query→0561a、protected hash 更新 GridSystem＋新增 presets 模組、required、tests）、`tests/build-consistency.test.js` 等測試 query、README/decisions（DEC-016）/current-state/roadmap。`FlatProjection`/`IsoProjection`/`SpatialGrid`/`projection-mode` hash **未變**。
- 驗證：`npm test` 通過；`tests/flat-preset.test.js`、`flat-projection`、`grid-projection-compat`（iso golden 未動）、`projection-mode`、`build-consistency` 皆通過；`npm run check:deploy` 通過（Build 0561a、49 modules）；`npm run check:dev` 通過（含**本機 Chrome 實際 browser smoke**）；三 Preset 桌面（1440）＋手機（390/430）＋Art Debug 共 14 張 real-browser 截圖，同一 viewport 下三 Preset 初始 Camera 完全相同、零 page error、projectionMode/preset 正確。
- 已知限制／未完成：**正式 Flat Preset 未選定**；未做家具 flat 逐件校準／override／重畫；未新增營運／角色系統；手機實機（iPhone Safari／Android Chrome）人工驗收仍 pending；本環境無 `.git`（未 git init、未部署、未 push）。
- 下一步：產品負責人依 `docs/evidence/v0563/` 與 [V0561 驗收](./V0561_FLAT_PRESET_COMPARISON_ACCEPTANCE.md) 選定 Preset；選定後才啟動 `ART-0563-FLAT-FURNITURE-CALIBRATION`（Codex 家具校準）。

## 2026-07-24｜DEPLOY-0560A-GITHUB-PACKAGE

- 版本／Build：V0.56.0-alpha｜淺俯視投影原型版 / `0560a`（未改動）
- 目標：為現行 V0.56.0-alpha 建立可直接上傳 GitHub Pages 的部署資料夾與 ZIP；僅打包，不改 Runtime。
- 完成：
  - 部署資料夾 `dist/cat_cafe_v0560a_git_deploy/`（先清空再重建）。
  - `cat_cafe_v0560a_git_deploy.zip`（專案根目錄，286 檔、約 7.03 MB、正斜線、無多包一層、無其他 ZIP）。
  - ZIP 根直接含 `index.html`、`manifest.webmanifest`、`.nojekyll`、`.gitignore`、根 `.md`、`check.js`、`package*.json`、`assets/`、`docs/`、`icons/`、`splash/`、`tests/`；含 `assets/js/systems/FlatProjection.js`、`assets/js/core/projection-mode.js` 與 100 張 redraw PNG、`docs/evidence/v0562/` 5 張截圖。
  - 排除 `node_modules/`、`legacy/`、`tools/`、`dist/`、舊 ZIP、備份/暫存。
  - 新增 `docs/V0560A_GITHUB_DEPLOY_PACKAGE.md`。
- 驗證：`npm test` 通過；`npm run check:deploy` 通過；`node check.js --deploy --zip cat_cafe_v0560a_git_deploy.zip` 通過；以本機 Chrome 服務**部署資料夾**逐一驗證 `/`、`?projection=iso`、`?projection=flat`、`?projection=flat&artDebug=1`、`?projection=invalid`（回退 iso）——全部 gameReady、projectionMode 正確、無 page error。
- 未修改：JavaScript／HTML／CSS／素材／存檔／版本／Build 皆未改（僅複製打包）。
- 已知限制：部署包內 `check.js`、`tests/`、`docs/` 為開發用途，靜態網站不會載入，保留供驗證與交接。
- 下一步：由專案負責人解壓縮後上傳 GitHub Pages 根目錄（勿直接上傳 ZIP），並完成 [V0562 Flat 人工驗收](./V0562_FLAT_PROJECTION_ACCEPTANCE.md)。

## 2026-07-24｜ARCH-0562-FLAT-PROJECTION-PROTOTYPE

- 版本／Build：**V0.56.0-alpha｜淺俯視投影原型版** / **0560a**（由 V0.55.2-alpha / 0552a 升版；存檔 key `catCafePhaserV0540` 不變）
- 目標：在 SpatialGrid/IsoProjection 骨架上建立第一個可見的淺斜／淺俯視 `FlatProjection` Prototype，透過 `?projection=flat` opt-in；預設仍 iso；不動家具邏輯座標、Occupancy、Placement、Pathfinding、存檔。
- FlatProjection 架構：可逆二維 basis 投影（`world=origin+gx·axisX+gy·axisY`），參數集中於 `FLAT_PROJECTION_PARAMS`（axisX(112,0)、axisY(26,84)），origin 由房間尺寸推導置中；`getCellDiamond` 回傳平行四邊形、`getFootprintPolygon`/`getAnchor` 沿用共同規則。與 iso 相同介面，經 GridSystem Facade 供既有消費者使用。
- Mode resolver：純函式 `projection-mode.js`（iso/flat、空/非法/非字串回退 iso、trim+lowercase、不依賴引擎/DOM/儲存/存檔）；URL 解析隔離於 `CafeScene.initializeGrid`；`GridSystem` 第三參數 `{mode}` 選投影，預設 iso，不讀 URL。
- 玩家可見變化：預設 iso **不變**；flat 僅在 `?projection=flat` 可見；**無新玩家 UI**、無存檔變化。
- 修改檔案：新增 `FlatProjection.js`、`projection-mode.js`、`tests/projection-mode.test.js`、`tests/flat-projection.test.js`；改 `GridSystem.js`、`CafeScene.js`（flat 房間 branch，iso branch 未動）；版本機械升版（build-info、index.html、manifest、package/lock、全 `assets/js` 模組 query、`CAT_ASSET_VERSION`/`FURNITURE_REDRAW_ASSET_VERSION`→0560a）、`check.js`（版本/Build/obsolete/import-query 斷言、protected hashes 更新 GridSystem＋新增 FlatProjection/projection-mode、required、tests、cat pin）、`tests/build-consistency.test.js`、`tests/browser-smoke.test.js`、README、docs。
- 測試結果：`npm test` 通過；`npm run check:deploy` 通過（Build 0560a、48 modules）；`npm run check:dev` 通過（含**本機 Chrome 實際 browser smoke**）；`tests/*.test.js` 逐一 25/25（Node，排除 browser-smoke）＋ browser-smoke 經 check:dev 通過；iso golden-master 期望值未改、通過。
- 家具顯示問題：家具 sprite 仍為 iso 透視，於較平 flat 地板上輕微視覺落差（Prototype 預期，逐件校準 = 候選 ART-0563）；本次未加任何 flat 顯示 override。
- 人工驗收狀態：本環境可啟動 Chrome，已產生 real-browser 截圖 `docs/evidence/v0562/`（iso 1440、flat 1440/390/430、flat+artDebug 390；皆 gameReady、flat pageerror=0、projectionMode 正確）；393×852、觸控互動、存檔重整、切回 iso 對照仍 **pending**（見 `V0562_FLAT_PROJECTION_ACCEPTANCE.md`）。**未**宣稱手機實機驗收通過、**未**宣稱 flat 為正式預設、**未**宣稱家具 flat 美術完成。
- 存檔影響：無（projection 不入存檔；schema/遷移版本/x/y/r 不變）。
- 下一步候選（未核准不執行）：`ART-0563-FLAT-FURNITURE-CALIBRATION`（Codex）、`ARCH-0563-ECONOMY-EXTRACT`、`ARCH-0563-STATION-REGISTRY`。詳見 `docs/V0562_FLAT_PROJECTION_RESULT.md`。

## 2026-07-24｜ARCH-0561-GRID-PROJECTION-SPLIT

- 版本：V0.55.2-alpha／Build `0552a`（未變動）
- 目標：純架構重構——把 `GridSystem` 的「邏輯格責任」與「2:1 等角畫面投影責任」拆開，為未來平面／淺俯視投影建立安全切換點；畫面、家具位置、貓咪移動、拖曳、放置、Camera 與存檔行為必須完全不變。
- 新增模組：
  - `assets/js/systems/SpatialGrid.js`：投影無關邏輯（cols/rows/placeableMask getter、getFootprintSize/Cells、isInsideGrid/isPlaceableCell）；不依賴引擎/DOM/世界座標/角色身份。
  - `assets/js/systems/IsoProjection.js`：2:1 等角投影（gridToWorld/worldToGrid/snapWorldToGrid/getCellCenter/getCellDiamond/getFootprintPolygon/getAnchor）；讀 SpatialGrid 邏輯，不保存家具/占用/角色狀態。
- 修改檔案：
  - `assets/js/systems/GridSystem.js`：改為組合 `SpatialGrid` + `IsoProjection` 的相容 Facade；public API 全數保留、對外委派，並公開唯讀 `spatialGrid`、`projection`。
  - `check.js`：更新 `GridSystem.js` 受保護雜湊（必要——否則 protected-core 檢查會擋），並新增 `SpatialGrid.js`、`IsoProjection.js` 至受保護清單（避免把核心公式移到未受保護檔案而弱化既有防護）；將新測試加入 deploy 測試清單。
  - `tests/grid-projection-compat.test.js`（新增）：golden-master 相容測試 + 責任拆分/單一來源結構檢查。
- public API 相容結果：既有消費者（CafeScene、FurnitureEntity、FurnitureDragController、CatBehaviorController、ArtDebugRenderer、OccupancySystem、PlacementSystem、SaveAdapter.migrateIfNeeded）**未修改**，仍以 `grid.*` 呼叫。
- 測試結果：
  - 重構前基準 `npm test` 通過、`npm run check:deploy` 通過（44 modules）；tests/*.test.js 共 23 檔逐一執行全通過。
  - 重構後 `npm test` 通過、`npm run check:deploy` 通過（46 modules）；tests/*.test.js 共 24 檔（新增 1）逐一執行全通過、0 失敗、0 無法執行。
  - 相容以 golden-master 逐值驗證：gridToWorld/worldToGrid/snap（含 -0 邊界與浮點）、cellCenter/diamond（頂點與順序）、footprint size/cells（含 rotation 奇偶交換與順序）、footprint polygon、anchor（floorObject 腳底／floorDecoration 中心／wallObject 現行行為，rotation 0–3）、inside/placeable，全部與重構前一致。
- 人工瀏覽器驗收：本環境無瀏覽器，標示 **pending**；未宣稱 iso 像素一致已由人工確認。人工驗收步驟見 `docs/V0561_IMPLEMENTATION_RESULT.md`。
- Runtime 玩家可見行為是否改變：**否**（純內部重構，無新功能、無畫面/操作變更）。
- 存檔是否改變：**否**（未觸碰 SaveAdapter；key/schema/遷移版本不變）。
- 產品決策落檔：更新 `decisions.md`（DEC-008 → Accepted；新增 DEC-012 SceneProjection 抽離、DEC-013 actor-neutral 工作架構、DEC-014 顧客/訂單保存）與 `handoffs/V056_PRODUCT_DECISION.md`。
- 未實作（明確）：FlatProjection、projectionMode、平面顯示、店長、店員招募、ActorTaskSystem、StationRegistry、顧客/訂單、EconomySystem。
- 下一步候選（未核准不執行）：`ARCH-0562-FLAT-PROJECTION-PROTOTYPE` 或 `ARCH-0562-ECONOMY-EXTRACT`（比較見 `docs/V0561_IMPLEMENTATION_RESULT.md`）。

## 2026-07-23｜ARCH-0560-FLAT-CAFE-AUDIT

- 版本：V0.55.2-alpha／Build `0552a`（未變動）
- 目標：針對現行 V0.55.2 進行「平面化咖啡廳與營運生命感」架構稽核，產出方案比較、目標架構、MVP 與分階段實作計畫；不進行任何重構。
- 完成文件：
  - 新增 `docs/V056_ARCHITECTURE_AUDIT.md`（現況地圖、A–I 逐點分析、三方案比較表、Proposed 建議、待產品核准問題）。
  - 新增 `docs/V056_IMPLEMENTATION_PLAN.md`（目標架構、MVP 營運循環、Stage 0–10、測試/存檔/美術/效能/回復策略、Claude Code／Codex 任務拆分與相依）。
  - 新增 `docs/handoffs/V056_PRODUCT_DECISION.md`（給產品負責人的精簡決策文件）。
  - 更新本 devlog。`docs/decisions.md` 未變動：本次未形成 Accepted 決策，投影方向仍為 DEC-008 Proposed。
- 主要發現：
  - `CafeScene` 為 God object，經濟與「顧客流程」是 scene 內固定計時器（`maybeSpawnCustomer` 等 2.6 秒後 `+320` 營收）。
  - Grid 邏輯與 2:1 等角投影可乾淨拆分；`Occupancy`／`Placement`／`grid-pathfinder`／`SaveAdapter` 遷移／`Camera` 皆不依賴投影；家具以邏輯格 `x/y/r` 儲存 → 換投影不需搬家具或改存檔。
  - `furniture-visual-config.js` 已含完整 `stationType`／`interactionSockets` 資料，但**零 gameplay 消費者**；socket 無旋轉轉換與可到達性。
  - `walkBlocking` 由 `layer` 推導（非 stationType）；地毯/牆物不阻擋已正確。
  - 貓行為已用單一共享 update 迴圈（無每貓 Timer），但未使用 `catStats` 需求與家具 socket。
  - Reaction 只服務貓、無優先級/冷卻/上限；UI 已事件解耦、已有 bottom bar 與單一輸入 FSM。
  - 存檔 `{...defaults,...parsed}` 對新增頂層欄位前向相容；`care-interaction-core` 的 `committed` 旗標可作訂單防重複結帳範式。
  - Proposed 建議：方案 B（抽離 Projection、保留邏輯格與存檔、新增可切換平面/淺俯視）。
- 驗證：
  - 稽核前 `npm test`：通過（`Core tests passed…`）。
  - 稽核前 `npm run check:deploy`：通過（`Build 0552a, 35 DOM IDs, 13 nested selectors, 44 JavaScript modules`）。
  - 三份新文件互相連結，並連回 AGENTS/decisions/current-state/roadmap 等治理文件。
  - 本次未執行 Browser Smoke 或外部裝置實機驗收。
- 未核准事項：三種技術方案皆為 Proposed；投影方案、平面樣式、MVP staff 執行者、是否保存進行中流程、店長是否入場，均待產品負責人於 `V056_PRODUCT_DECISION.md` 核准。
- 本次未修改 Runtime：未動任何 JavaScript／HTML／CSS／Phaser 設定／家具或貓咪素材／存檔格式／版本號／Build ID／存檔 key／furniture ID／footprint／價格／rotation。
- 已知限制：專案根目錄無 `.git`，無法提供 `git status`／diff；V0552 人工瀏覽器驗收仍 pending。
- 下一步：待產品核准方案後，執行首張任務卡（B → `ARCH-0561-GRID-PROJECTION-SPLIT`；或生命感先行 → `ARCH-0562-ECONOMY-EXTRACT`）。

## 2026-07-23｜DOC-0552-CLAUDE-HANDOFF

- 版本：V0.55.2-alpha／Build `0552a`
- 目標：建立正式專案治理、決策、現況、路線圖、Task Card 與 Claude Code 交接文件。
- 完成：
  - 新增 `AGENTS.md`、`CLAUDE.md`。
  - 新增 decisions、devlog、current-state、roadmap、Task Card 與 V0552 handoff。
  - README 僅新增「專案治理與交接」連結。
- 驗證：
  - 修改前 `npm.cmd test`：通過；輸出為 Core tests passed。
  - 修改前 `npm.cmd run check:deploy`：通過；Build `0552a`、35 DOM IDs、13 nested selectors、44 JavaScript modules。
  - 文件完成後重跑上述兩項命令：均通過，輸出與基準一致。
  - README 內八個治理文件連結與治理文件間相對連結均可解析。
  - 本次未執行 Browser Smoke 或外部裝置實機驗收。
- 已知限制：專案根目錄沒有 `.git`，無法提供 `git status`／diff；V0552 人工瀏覽器驗收仍 pending。
- 下一步：依 `docs/handoffs/V0552_TO_CLAUDE.md` 先做架構稽核，不直接重構 Grid。

## 2026-07-23｜V0.55.2-alpha Prototype 家具全面重繪

- 版本：V0.55.2-alpha／Build `0552a`
- 目標：替換 V0.55.1 稽核出的白底／文字 Prototype。
- 完成：25 件家具、每件四方向，共 100 張透明 RGBA PNG；Runtime 分類為 42 `production`、5 `redraw`、0 `prototype`；`childrenPlayArea` 為可用 `redraw`。
- 驗證：靜態 PNG、方向、ID、footprint 與存檔相容性 Gate 已記錄於 `PROTOTYPE_REDRAW_RESULT.md` 與現有測試。
- 已知限制：`childrenPlayArea` 陰影邊緣待精修；`V0552_MANUAL_BROWSER_ACCEPTANCE.md` 的外部裝置項目尚未勾選。
- 下一步：完成人工瀏覽器／實機驗收；在任何投影調整前先做架構稽核。

## 2026-07-23｜V0.55.1-alpha 家具與美術稽核

- 版本：V0.55.1-alpha
- 目標：建立家具素材、方向、透明度、footprint 與商店狀態基線。
- 完成：稽核 47 個家具定義；識別 22 PNG 與 25 白底／文字 SVG Prototype；建立 Art Bible、完整清單與 Prototype 重繪計畫。
- 驗證：證據與逐件狀態保留於 `FURNITURE_AUDIT.md`。
- 已知限制：該文件的逐件表是 V0.55.1 基線，需配合其頂部 V0.55.2 Runtime 更新閱讀。
- 下一步：已由 V0.55.2 完成 25 件 Prototype Runtime 替換。

## 歷史日期未記錄｜V0.54.0 Phaser 架構重建

- 版本：V0.54.0 系列
- 目標：由舊單檔 DOM／Canvas Patch 遷移到 Phaser 3.90.0 模組化架構。
- 完成：建立本地 Phaser、Scene、Grid、Occupancy、Placement、Camera、Depth、SaveAdapter、Phaser 家具／貓咪與 DOM HUD 分工。
- 驗證：現行 Runtime、`legacy/legacy-notes.md` 與後續測試可證明架構存在；原始版本的完整測試紀錄未保留於目前文件。
- 已知限制：部分營運與顧客流程仍是簡化演出；不可回溯宣稱完整 AI。
- 下一步：後續版本持續補齊啟動安全、貓咪、拖曳、照顧與美術。

## 歷史日期未記錄｜V0.53.0 穩定場景核心

- 版本：V0.53.0
- 目標：建立單一 Canvas／Camera、穩定拖曳、縮放與 Safari resize 基線。
- 完成：依 `legacy/index-v0532.html` 內現存註解，背景與場景 DOM 曾共用 V0.53.0 Camera。
- 驗證：此為 legacy 原始碼與專案負責人提供的歷史摘要；目前沒有獨立測試報告可回溯。
- 已知限制：該舊執行路徑已退出正式 Runtime，不應作現行架構說明。
- 下一步：V0.54.0 已以 Phaser Main Camera 取代舊路徑。

## 歷史日期未記錄｜V0.50.4 手機直立方向

- 版本：V0.50.4 系列
- 目標：改善手機直立畫面的可用性與空白畫面問題。
- 完成：`legacy/index-v0532.html` 保留 `V0.50.4.1 mobile portrait blank-screen fix` 歷史註解；手機直立方向由專案負責人摘要確認。
- 驗證：目前沒有該版獨立測試輸出，不回溯宣稱特定裝置通過。
- 已知限制：舊 DOM/CSS Patch 不屬正式執行路徑。
- 下一步：手機直立持續作為現行產品優先視角。
