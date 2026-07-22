export const APP_VERSION = 'V0.54.2-alpha';
export const PHASER_SAVE_KEY = 'catCafePhaserV0540';

export class StartupController {
  constructor({overlay = document.getElementById('bootOverlay'), version = APP_VERSION} = {}) {
    if (!overlay) throw new Error('找不到 bootOverlay');
    this.overlay = overlay;
    this.version = version;
    this.state = 'loading';
    this.lastStage = '初始化';
    this.progress = 0;
    this.failedAssets = [];
    this.timer = null;
    this.finished = false;
    this.statusElement = overlay.querySelector('[data-boot-status]');
    this.progressElement = overlay.querySelector('[data-boot-progress]');
    this.errorElement = overlay.querySelector('[data-boot-error]');
    this.stageElement = overlay.querySelector('[data-boot-stage]');
    this.versionElement = overlay.querySelector('[data-boot-version]');
    this.bindButtons();
    this.setStatus('初始化 Phaser…');
    this.setProgress(0);
  }

  bindButtons() {
    if (this.overlay.dataset.buttonsBound === '1') return;
    this.overlay.dataset.buttonsBound = '1';
    this.overlay.querySelector('[data-boot-reload]')?.addEventListener('click', () => location.reload());
    this.overlay.querySelector('[data-boot-clear]')?.addEventListener('click', () => {
      try { localStorage.removeItem(PHASER_SAVE_KEY); }
      catch (error) { console.warn('Unable to clear Phaser save', error); }
      location.reload();
    });
  }

  setStatus(message) {
    if (this.finished) return;
    this.lastStage = String(message || this.lastStage);
    if (this.statusElement) this.statusElement.textContent = this.lastStage;
    if (this.stageElement) this.stageElement.textContent = `階段：${this.lastStage}`;
    this.overlay.dataset.state = 'loading';
  }

  setProgress(value) {
    if (this.finished) return;
    this.progress = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.progressElement) {
      this.progressElement.value = this.progress;
      this.progressElement.setAttribute('aria-valuenow', String(Math.round(this.progress * 100)));
    }
  }

  setFailedAssets(failures = []) { this.failedAssets = [...failures]; }

  ready() {
    if (this.finished) return;
    this.finished = true;
    this.state = 'ready';
    this.clearTimeout();
    this.overlay.dataset.state = 'ready';
    this.overlay.classList.add('hidden');
    document.body.dataset.gameReady = '1';
  }

  fail(error, context = '啟動') {
    if (this.state === 'ready') return;
    this.finished = true;
    this.state = 'error';
    this.clearTimeout();
    const message = this.formatError(error);
    console.error(`[${context}]`, error);
    this.overlay.classList.remove('hidden');
    this.overlay.dataset.state = 'error';
    if (this.errorElement) this.errorElement.textContent = message;
    if (this.stageElement) this.stageElement.textContent = `發生階段：${context || this.lastStage}`;
    if (this.versionElement) this.versionElement.textContent = this.version;
    const detail = this.overlay.querySelector('[data-boot-failures]');
    if (detail) detail.textContent = `進度 ${Math.round(this.progress * 100)}% · 失敗素材 ${this.failedAssets.length}`;
    document.body.dataset.gameReady = '0';
    document.body.dataset.bootError = message;
  }

  formatError(error) {
    if (error instanceof Error) return error.message || error.name;
    if (typeof error === 'string') return error;
    try { return JSON.stringify(error); } catch { return '未知啟動錯誤'; }
  }

  startTimeout(milliseconds = 20000) {
    this.clearTimeout();
    this.timer = window.setTimeout(() => {
      this.fail(new Error(`超過 ${Math.round(milliseconds / 1000)} 秒仍未完成載入`), this.lastStage);
    }, milliseconds);
  }

  clearTimeout() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
