import {createGameConfig} from './config/game-config.js?v=0552a';
import {FURNITURE_CONFIG} from './config/furniture-config.js?v=0552a';
import {APP_VERSION, BUILD_ID, assertBuildConsistency} from './config/build-info.js?v=0552a';
import {resolveDomContract} from './ui/dom-contract.js?v=0552a';
import {SaveAdapter} from './systems/SaveAdapter.js?v=0552a';
import {StartupController} from './systems/StartupController.js?v=0552a';
import {UiBridge} from './ui/UiBridge.js?v=0552a';

window.__CAT_CAFE_JS_BUILD_ID__ = BUILD_ID;

async function waitForDomReady() {
  if (document.readyState !== 'loading') return;
  await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once: true}));
}

function firstEarlyError() {
  const item = window.__CAT_CAFE_EARLY_ERRORS__?.[0];
  if (!item) return null;
  const error = new Error(item.message || '早期啟動錯誤');
  error.name = item.name || 'EarlyBootError';
  if (item.stack) error.stack = item.stack;
  return {error, diagnostic: item};
}

async function bootstrap() {
  await waitForDomReady();

  const startup = new StartupController();
  window.__CAT_CAFE_STARTUP__ = startup;
  startup.startTimeout(20000);

  try {
    startup.setStatus('檢查介面版本…');
    const htmlBuildId = document.documentElement.dataset.buildId
      || window.__CAT_CAFE_HTML_BUILD_ID__
      || '';
    assertBuildConsistency(htmlBuildId, BUILD_ID);
    document.body.dataset.htmlBuildId = htmlBuildId;
    document.body.dataset.jsBuildId = BUILD_ID;

    startup.setStatus('檢查介面結構…');
    const dom = resolveDomContract(document);
    startup.useDomContract(dom);

    const early = firstEarlyError();
    if (early) {
      startup.fail(early.error, early.diagnostic.context || 'early-boot', early.diagnostic);
      return;
    }

    if (!window.Phaser) throw new Error('本地 Phaser 3.90.0 未成功載入');

    startup.setStatus('讀取存檔…');
    const saveAdapter = new SaveAdapter(FURNITURE_CONFIG);
    let ui = null;
    let game = null;

    startup.setStatus('建立 Phaser 遊戲…');
    game = new Phaser.Game(createGameConfig({
      preBoot(phaserGame) {
        phaserGame.registry.set('saveAdapter', saveAdapter);
        phaserGame.registry.set('startupController', startup);
        phaserGame.registry.set('buildId', BUILD_ID);
        ui = new UiBridge(phaserGame, saveAdapter, FURNITURE_CONFIG, {startup, dom});
      },
      postBoot(phaserGame) {
        phaserGame.registry.set('rendererName', 'Canvas');
        console.info(`Renderer: Canvas｜Build ${BUILD_ID}`);
      }
    }));

    const scene = () => game.scene.getScene('CafeScene');
    window.gameController = Object.freeze({
      openStore: () => ui?.store.open(),
      startPlacement: type => scene()?.startPlacement(type),
      rotateSelection: () => scene()?.rotateSelection(),
      storeSelection: () => scene()?.storeSelection(),
      sellSelection: () => scene()?.sellSelection(),
      cancelPlacement: () => scene()?.cancelDrag(),
      getState: () => structuredClone(saveAdapter.state)
    });
    window.__CAT_CAFE_GAME__ = game;

    let resizePending = false;
    function resizeGame(attempt = 0) {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => {
        resizePending = false;
        const width = dom.gameViewport.clientWidth || 0;
        const height = dom.gameViewport.clientHeight || 0;
        if (width <= 0 || height <= 0) {
          if (attempt < 60) {
            resizeGame(attempt + 1);
            return;
          }
          startup.fail(new Error(`遊戲 viewport 尺寸無效：${width}×${height}`), '初始 Resize');
          return;
        }
        game.scale.resize(width, height);
      });
    }

    const resize = () => resizeGame();
    window.addEventListener('resize', resize, {passive: true});
    window.visualViewport?.addEventListener('resize', resize, {passive: true});
    window.visualViewport?.addEventListener('scroll', resize, {passive: true});
    game.events.once(Phaser.Core.Events.DESTROY, () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('scroll', resize);
      ui?.destroy();
    });
    resizeGame();
  } catch (error) {
    startup.fail(error, error.name === 'BuildMismatchError' ? 'Build ID 檢查' : '啟動流程', {
      htmlBuildId: document.documentElement.dataset.buildId || window.__CAT_CAFE_HTML_BUILD_ID__ || '',
      jsBuildId: BUILD_ID,
      missingIds: error.missingIds || [],
      missingSelectors: error.missingSelectors || []
    });
  }
}

bootstrap().catch(error => {
  const startup = window.__CAT_CAFE_STARTUP__ || new StartupController();
  startup.fail(error, 'bootstrap Promise');
});

console.info(`${APP_VERSION}｜Build ${BUILD_ID}`);
