import {APP_VERSION, BUILD_ID, SAVE_KEY} from '../config/build-info.js?v=0551a';

const safeText = value => {
  if (value instanceof Error) return value.message || value.name;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return '未知的載入錯誤'; }
};

const errorFingerprint = (error, context, diagnostics) => [
  safeText(error), context || '', diagnostics.filename || '',
  diagnostics.line || diagnostics.lineno || '', diagnostics.column || diagnostics.colno || ''
].join('|');

export {APP_VERSION, BUILD_ID, SAVE_KEY};

export class StartupController {
  constructor({overlay = document.getElementById('bootOverlay'), version = APP_VERSION} = {}) {
    this.overlay = overlay || null;
    this.version = version;
    this.state = 'loading';
    this.lastStage = '準備啟動';
    this.progress = 0;
    this.failedAssets = [];
    this.timer = null;
    this.finished = false;
    this.fingerprints = new Set();
    this.dom = null;
    this.captureElements();
    this.bindButtons();
    this.setStatus('載入 Phaser 咖啡館…');
    this.setProgress(0);
  }

  useDomContract(dom) {
    this.dom = dom;
    this.overlay = dom.bootOverlay;
    this.statusElement = dom.bootStatus;
    this.progressElement = dom.bootProgress;
    this.errorElement = dom.bootError;
    this.stageElement = dom.bootStage;
    this.failuresElement = dom.bootFailures;
    this.versionElement = dom.bootVersion;
    this.reloadButton = dom.bootReload;
    this.refreshButton = dom.bootRefresh;
    this.diagnosticsElement = this.overlay.querySelector('[data-boot-diagnostics]');
    this.bindButtons();
  }

  captureElements() {
    const query = selector => this.overlay?.querySelector?.(selector) || null;
    this.statusElement = query('[data-boot-status]');
    this.progressElement = query('[data-boot-progress]');
    this.errorElement = query('[data-boot-error]');
    this.stageElement = query('[data-boot-stage]');
    this.failuresElement = query('[data-boot-failures]');
    this.versionElement = query('[data-boot-version]');
    this.reloadButton = query('[data-boot-reload]');
    this.refreshButton = query('[data-boot-refresh]');
    this.diagnosticsElement = query('[data-boot-diagnostics]');
  }

  bindButtons() {
    if (!this.overlay || this.overlay.dataset.buttonsBound === '1') return;
    this.overlay.dataset.buttonsBound = '1';
    this.reloadButton?.addEventListener('click', () => location.reload());
    this.refreshButton?.addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.set('_reload', String(Date.now()));
      location.replace(url.href);
    });
  }

  setStatus(message) {
    if (this.finished) return;
    this.lastStage = String(message || this.lastStage);
    if (this.statusElement) this.statusElement.textContent = this.lastStage;
    if (this.stageElement) this.stageElement.textContent = `發生階段：${this.lastStage}`;
    if (this.overlay) this.overlay.dataset.state = 'loading';
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
    if (this.overlay) {
      this.overlay.dataset.state = 'ready';
      this.overlay.classList.add('hidden');
    }
    if (document.body) document.body.dataset.gameReady = '1';
  }

  fail(error, context = '啟動流程', diagnostics = {}) {
    if (this.state === 'ready') return false;
    const detail = this.buildDiagnostics(error, context, diagnostics);
    const fingerprint = errorFingerprint(error, context, detail);
    if (this.fingerprints.has(fingerprint)) return false;
    this.fingerprints.add(fingerprint);
    this.finished = true;
    this.state = 'error';
    this.clearTimeout();
    console.error(`[${context}]`, error, detail);
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      this.overlay.dataset.state = 'error';
    }
    if (this.errorElement) this.errorElement.textContent = this.formatError(error);
    if (this.stageElement) this.stageElement.textContent = `發生階段：${context || this.lastStage}`;
    if (this.versionElement) this.versionElement.textContent = `${this.version}｜Build ${BUILD_ID}`;
    if (this.failuresElement) {
      this.failuresElement.textContent = `進度 ${Math.round(this.progress * 100)}%｜失敗素材 ${this.failedAssets.length}`;
    }
    if (this.diagnosticsElement) this.diagnosticsElement.textContent = JSON.stringify(detail, null, 2);
    if (document.body) {
      document.body.dataset.gameReady = '0';
      document.body.dataset.bootError = this.formatError(error);
    }
    return true;
  }

  buildDiagnostics(error, context, diagnostics) {
    return {
      name: error?.name || typeof error,
      message: this.formatError(error),
      context,
      filename: diagnostics.filename || error?.fileName || '',
      line: diagnostics.line || diagnostics.lineno || error?.lineNumber || '',
      column: diagnostics.column || diagnostics.colno || error?.columnNumber || '',
      stack: error?.stack || diagnostics.stack || '',
      missingIds: error?.missingIds || diagnostics.missingIds || [],
      missingSelectors: error?.missingSelectors || diagnostics.missingSelectors || [],
      htmlBuildId: diagnostics.htmlBuildId || window.__CAT_CAFE_HTML_BUILD_ID__ || '',
      jsBuildId: diagnostics.jsBuildId || BUILD_ID,
      readyState: document.readyState,
      pathname: location.pathname,
      viewport: {width: innerWidth, height: innerHeight},
      userAgent: navigator.userAgent,
      progress: this.progress,
      failedAssets: this.failedAssets.length,
      time: new Date().toISOString()
    };
  }

  formatError(error) { return safeText(error); }

  startTimeout(milliseconds = 20000) {
    this.clearTimeout();
    this.timer = window.setTimeout(() => {
      this.fail(new Error(`超過 ${Math.round(milliseconds / 1000)} 秒仍未完成啟動`), this.lastStage);
    }, milliseconds);
  }

  clearTimeout() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
