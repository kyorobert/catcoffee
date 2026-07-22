import {ToastManager} from '../systems/ToastManager.js?v=0551a';
import {StorePanel} from './StorePanel.js?v=0551a';
import {CarePanel} from './CarePanel.js?v=0551a';
import {CAT_PROFILES} from '../config/cat-config.js?v=0551a';

export class UiBridge {
  constructor(game, saveAdapter, furnitureConfig, {startup = null, dom} = {}) {
    if (!dom) throw new TypeError('UiBridge 需要已驗證的 DOM Contract');
    this.game = game;
    this.saveAdapter = saveAdapter;
    this.startup = startup;
    this.dom = dom;
    this.readyHandled = false;
    this.selectedCatId = null;
    this.destroyed = false;
    this.readyFrame = 0;
    this.abortController = new AbortController();
    this.gameListeners = [];
    this.toast = new ToastManager(dom.gameToast);
    this.store = new StorePanel(
      dom.storePanel, furnitureConfig, saveAdapter,
      type => this.scene()?.startPlacement(type)
    );
    this.care = new CarePanel(dom.carePanel, CAT_PROFILES, {
      select: catId => this.scene()?.selectCat(catId),
      start: (catId, mode) => this.scene()?.startCareInteraction(catId, mode),
      cancel: reason => this.scene()?.cancelCareInteraction(reason),
      finish: () => this.scene()?.finishCareInteraction()
    });
    this.bindEvents();
    this.bindButtons();
    this.renderState(saveAdapter.state);
    this.watchSceneReady();
  }

  scene() { return this.game.scene.getScene('CafeScene'); }

  onGame(event, handler, once = false) {
    this.game.events[once ? 'once' : 'on'](event, handler);
    this.gameListeners.push({event, handler});
  }

  bindEvents() {
    this.onGame('state-changed', state => {
      this.renderState(state);
      if (!this.store.element.classList.contains('hidden')) this.store.render();
    });
    this.onGame('selection-changed', selection => this.renderSelection(selection));
    this.onGame('cat-selection-changed', selection => this.renderCatSelection(selection));
    this.onGame('toast', payload => this.toast.show(payload.message, payload));
    this.onGame('daily-report', report => this.showReport(report));
    this.onGame('care-session-started', payload => this.care.begin(payload));
    this.onGame('care-session-completed', payload => this.care.complete(payload));
    this.onGame('care-session-cancelled', () => this.care.hide());
    this.onGame('care-session-finished', () => this.care.hide());
    this.onGame('care-session-failed', () => this.care.fail());
    this.onGame('boot-progress', value => this.startup?.setProgress(value));
    this.onGame('boot-file', file => this.startup?.setStatus(`載入素材：${file.key}`));
    this.onGame('boot-load-error', failure => {
      const current = [
        ...(this.game.registry.get('furniture-load-report')?.failed || []),
        ...(this.game.registry.get('cat-load-report')?.failed || [])
      ];
      this.startup?.setFailedAssets(current.length ? current : [failure]);
    });
    this.onGame('boot-failed', payload => this.startup?.fail(payload.error, payload.stage), true);
  }

  watchSceneReady() {
    this.onGame('scene-ready', () => this.markGameReady(), true);
    const check = () => {
      if (this.destroyed || this.readyHandled || this.startup?.state === 'error') return;
      const cafe = this.game.scene.getScene('CafeScene');
      if (this.game.registry.get('cafe-ready') === true || cafe?.sys?.isActive()) this.markGameReady();
      else this.readyFrame = requestAnimationFrame(check);
    };
    this.readyFrame = requestAnimationFrame(check);
  }

  markGameReady() {
    if (this.readyHandled) return;
    this.readyHandled = true;
    if (this.readyFrame) cancelAnimationFrame(this.readyFrame);
    this.startup?.ready();
  }

  bindButtons() {
    const options = {signal: this.abortController.signal};
    this.dom.openStoreBtn.addEventListener('click', () => this.store.open(), options);
    this.dom.helperBtn.addEventListener('click', () => this.scene()?.togglePlacementHelper(), options);
    this.dom.careBtn.addEventListener('click', () => this.care.open(this.saveAdapter.state, this.selectedCatId), options);
    this.dom.reportBtn.addEventListener('click', () => this.showReport(), options);
    this.dom.settingsBtn.addEventListener('click', () => this.openPanel('settingsPanel'), options);
    this.dom.openDayBtn.addEventListener('click', () => this.scene()?.openStoreForDay(), options);
    this.dom.nextPhaseBtn.addEventListener('click', () => this.scene()?.nextPhase(), options);
    this.dom.rotateBtn.addEventListener('click', () => this.scene()?.rotateSelection(), options);
    this.dom.storeBtn.addEventListener('click', () => this.scene()?.storeSelection(), options);
    this.dom.sellBtn.addEventListener('click', () => this.scene()?.sellSelection(), options);
    this.dom.cancelPlacementBtn.addEventListener('click', () => this.scene()?.cancelDrag(), options);
    for (const button of this.dom.panelCloseButtons) {
      button.addEventListener('click', () => this.closePanel(button.closest('.panel')?.id), options);
    }
  }

  panelFor(id) {
    return ({storePanel: this.dom.storePanel, carePanel: this.dom.carePanel,
      reportPanel: this.dom.reportPanel, settingsPanel: this.dom.settingsPanel})[id] || null;
  }

  openPanel(id) { this.panelFor(id)?.classList.remove('hidden'); }
  closePanel(id) { this.panelFor(id)?.classList.add('hidden'); }

  renderState(state) {
    this.dom.hudCoins.textContent = Number(state.coins || 0).toLocaleString('zh-TW');
    this.dom.hudReputation.textContent = Number(state.reputation || 0).toLocaleString('zh-TW');
    this.dom.hudLevel.textContent = state.shopLevel || 1;
    this.dom.hudXp.textContent = Number(state.xp || 0).toLocaleString('zh-TW');
    this.dom.hudEnergy.textContent = `${state.energy}/${state.maxEnergy}`;
    this.dom.hudDay.textContent = `Day ${state.day}`;
    this.dom.hudPhase.textContent = state.phaseLabel || state.phase;
    this.dom.hudRevenue.textContent = Number(state.dailyRevenue || 0).toLocaleString('zh-TW');
    this.dom.hudGuests.textContent = state.servedCustomers || 0;
    this.dom.helperBtn.classList.toggle('active', Boolean(state.placementHelper));
    const helperLabel = this.dom.helperBtn.querySelector('span');
    if (helperLabel) helperLabel.textContent = `放置輔助：${state.placementHelper ? '開' : '關'}`;
    this.dom.openDayBtn.disabled = state.phase !== 'prep';
    this.dom.nextPhaseBtn.disabled = state.phase === 'prep';
    this.care.updateState(state);
    document.body.dataset.hudState = 'received';
  }

  renderCatSelection(selection) { this.selectedCatId = selection?.cat?.id || null; }

  renderSelection(selection) {
    this.dom.selectionBar.classList.toggle('hidden', !selection);
    this.dom.selectionBar.classList.toggle('placing', Boolean(selection?.placing));
    if (!selection) return;
    this.dom.selectionName.textContent = selection.definition.name + (selection.placing ? '（放置中）' : '');
    this.dom.storeBtn.disabled = selection.placing;
    this.dom.sellBtn.disabled = selection.placing;
  }

  showReport(report = null) {
    const state = this.saveAdapter.state;
    const data = report || {day: state.day, revenue: state.dailyRevenue, served: state.servedCustomers, reputation: state.dailyRep};
    this.dom.reportContent.innerHTML = `<div class="report-grid"><b>日期</b><span>Day ${data.day}</span><b>營收</b><span>NT$ ${Number(data.revenue || 0).toLocaleString('zh-TW')}</span><b>顧客</b><span>${data.served || 0}</span><b>人氣</b><span>+${data.reputation || 0}</span></div>`;
    this.openPanel('reportPanel');
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abortController.abort();
    if (this.readyFrame) cancelAnimationFrame(this.readyFrame);
    for (const {event, handler} of this.gameListeners) this.game.events.off(event, handler);
    this.gameListeners.length = 0;
    this.store.destroy();
    this.care.destroy();
    this.toast.destroy();
  }
}
