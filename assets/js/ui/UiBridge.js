import {ToastManager} from '../systems/ToastManager.js?v=0541a';
import {StorePanel} from './StorePanel.js?v=0541a';
import {CAT_PROFILES} from '../config/cat-config.js?v=0541a';

export class UiBridge {
  constructor(game, saveAdapter, furnitureConfig, {startup = null} = {}) {
    this.game = game;
    this.saveAdapter = saveAdapter;
    this.startup = startup;
    this.readyHandled = false;
    this.selectedCatId = null;
    this.toast = new ToastManager(document.getElementById('gameToast'));
    this.store = new StorePanel(
      document.getElementById('storePanel'), furnitureConfig, saveAdapter,
      type => this.scene()?.startPlacement(type)
    );
    this.bindEvents();
    this.bindButtons();
    this.renderState(saveAdapter.state);
    this.watchSceneReady();
  }

  scene() { return this.game.scene.getScene('CafeScene'); }

  bindEvents() {
    this.game.events.on('state-changed', state => {
      this.renderState(state);
      if (!this.store.element.classList.contains('hidden')) this.store.render();
    });
    this.game.events.on('selection-changed', selection => this.renderSelection(selection));
    this.game.events.on('cat-selection-changed', selection => this.renderCatSelection(selection));
    this.game.events.on('toast', payload => this.toast.show(payload.message, payload));
    this.game.events.on('daily-report', report => this.showReport(report));
    this.game.events.on('boot-progress', value => this.startup?.setProgress(value));
    this.game.events.on('boot-file', file => this.startup?.setStatus(`載入素材：${file.key}`));
    this.game.events.on('boot-load-error', failure => {
      const current = [
        ...(this.game.registry.get('furniture-load-report')?.failed || []),
        ...(this.game.registry.get('cat-load-report')?.failed || [])
      ];
      this.startup?.setFailedAssets(current.length ? current : [failure]);
    });
    this.game.events.once('boot-failed', payload => this.startup?.fail(payload.error, payload.stage));
  }

  watchSceneReady() {
    this.game.events.once('scene-ready', () => this.markGameReady());
    const check = () => {
      if (this.readyHandled || this.startup?.state === 'error') return;
      const cafe = this.game.scene.getScene('CafeScene');
      if (this.game.registry.get('cafe-ready') === true || cafe?.sys?.isActive()) this.markGameReady();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  markGameReady() {
    if (this.readyHandled) return;
    this.readyHandled = true;
    this.startup?.ready();
  }

  bindButtons() {
    document.getElementById('openStoreBtn').addEventListener('click', () => this.store.open());
    document.getElementById('helperBtn').addEventListener('click', () => this.scene()?.togglePlacementHelper());
    document.getElementById('careBtn').addEventListener('click', () => this.openPanel('carePanel'));
    document.getElementById('reportBtn').addEventListener('click', () => this.showReport());
    document.getElementById('settingsBtn').addEventListener('click', () => this.openPanel('settingsPanel'));
    document.querySelectorAll('[data-close-panel]').forEach(button => button.addEventListener('click', () => button.closest('.panel').classList.add('hidden')));
    document.querySelectorAll('[data-care]').forEach(button => button.addEventListener('click', () => {
      this.scene()?.careCat(button.dataset.care);
      this.closePanel('carePanel');
    }));
    document.getElementById('careCatList').addEventListener('click', event => {
      const card = event.target.closest('[data-cat-id]');
      if (card) this.scene()?.selectCat(card.dataset.catId);
    });
    document.getElementById('openDayBtn').addEventListener('click', () => this.scene()?.openStoreForDay());
    document.getElementById('nextPhaseBtn').addEventListener('click', () => this.scene()?.nextPhase());
    document.getElementById('rotateBtn').addEventListener('click', () => this.scene()?.rotateSelection());
    document.getElementById('storeBtn').addEventListener('click', () => this.scene()?.storeSelection());
    document.getElementById('sellBtn').addEventListener('click', () => this.scene()?.sellSelection());
    document.getElementById('cancelPlacementBtn').addEventListener('click', () => this.scene()?.cancelDrag());
  }

  openPanel(id) { document.getElementById(id).classList.remove('hidden'); }
  closePanel(id) { document.getElementById(id).classList.add('hidden'); }

  renderState(state) {
    document.getElementById('hudCoins').textContent = Number(state.coins || 0).toLocaleString('zh-TW');
    document.getElementById('hudReputation').textContent = Number(state.reputation || 0).toLocaleString('zh-TW');
    document.getElementById('hudLevel').textContent = state.shopLevel || 1;
    document.getElementById('hudXp').textContent = Number(state.xp || 0).toLocaleString('zh-TW');
    document.getElementById('hudEnergy').textContent = `${state.energy}/${state.maxEnergy}`;
    document.getElementById('hudDay').textContent = `Day ${state.day}`;
    document.getElementById('hudPhase').textContent = state.phaseLabel || state.phase;
    document.getElementById('hudRevenue').textContent = Number(state.dailyRevenue || 0).toLocaleString('zh-TW');
    document.getElementById('hudGuests').textContent = state.servedCustomers || 0;
    document.getElementById('helperBtn').classList.toggle('active', Boolean(state.placementHelper));
    document.getElementById('helperBtn').querySelector('span').textContent = `放置輔助：${state.placementHelper ? '開' : '關'}`;
    document.getElementById('openDayBtn').disabled = state.phase !== 'prep';
    document.getElementById('nextPhaseBtn').disabled = state.phase === 'prep';
    this.renderCats(state);
    document.body.dataset.hudState = 'received';
  }

  renderCats(state) {
    const list = document.getElementById('careCatList');
    list.innerHTML = CAT_PROFILES.map(cat => {
      const stats = state.catStats?.[cat.id] || {};
      const selected = this.selectedCatId === cat.id ? ' selected' : '';
      const duty = (state.dutyCats || []).includes(cat.id) ? '<i>值班</i>' : '';
      return `<button type="button" class="cat-card${selected}" data-cat-id="${cat.id}">
        <img src="${cat.portrait}" alt="${cat.name}大頭貼" width="54" height="54">
        <span><b>${cat.name} ${duty}</b><em>${cat.personality}</em>
        <small>飽足 ${stats.satiety || 0} · 心情 ${stats.mood || 0} · 羈絆 ${stats.bond || 0}</small></span>
      </button>`;
    }).join('');
  }

  renderCatSelection(selection) {
    this.selectedCatId = selection?.cat?.id || null;
    this.renderCats(this.saveAdapter.state);
  }

  renderSelection(selection) {
    const bar = document.getElementById('selectionBar');
    bar.classList.toggle('hidden', !selection);
    if (!selection) return;
    document.getElementById('selectionName').textContent = selection.definition.name + (selection.placing ? '（放置中）' : '');
    document.getElementById('storeBtn').disabled = selection.placing;
    document.getElementById('sellBtn').disabled = selection.placing;
  }

  showReport(report = null) {
    const state = this.saveAdapter.state;
    const data = report || {day: state.day, revenue: state.dailyRevenue, served: state.servedCustomers, reputation: state.dailyRep};
    document.getElementById('reportContent').innerHTML = `<div class="report-grid"><b>日期</b><span>Day ${data.day}</span><b>營收</b><span>☕ ${Number(data.revenue || 0).toLocaleString('zh-TW')}</span><b>顧客</b><span>${data.served || 0}</span><b>人氣</b><span>+${data.reputation || 0}</span></div>`;
    this.openPanel('reportPanel');
  }
}
