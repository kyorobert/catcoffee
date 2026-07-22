import {BUILD_ID} from '../config/build-info.js?v=0551a';

export const REQUIRED_DOM_IDS = Object.freeze([
  'gameApp', 'gameHud', 'gameViewport', 'phaserGame', 'domOverlay',
  'bootOverlay', 'gameToast', 'gameBottomBar', 'openStoreBtn', 'helperBtn',
  'careBtn', 'reportBtn', 'settingsBtn', 'openDayBtn', 'nextPhaseBtn',
  'rotateBtn', 'storeBtn', 'sellBtn', 'cancelPlacementBtn', 'selectionBar',
  'selectionName', 'storePanel', 'carePanel', 'reportPanel', 'settingsPanel',
  'reportContent', 'hudCoins', 'hudReputation', 'hudLevel', 'hudXp',
  'hudEnergy', 'hudDay', 'hudPhase', 'hudRevenue', 'hudGuests'
]);

export const REQUIRED_NESTED_SELECTORS = Object.freeze({
  bootOverlay: Object.freeze({
    bootStatus: '[data-boot-status]',
    bootProgress: '[data-boot-progress]',
    bootError: '[data-boot-error]',
    bootStage: '[data-boot-stage]',
    bootFailures: '[data-boot-failures]',
    bootVersion: '[data-boot-version]',
    bootReload: '[data-boot-reload]',
    bootRefresh: '[data-boot-refresh]'
  }),
  storePanel: Object.freeze({
    storeClose: '[data-close]',
    storeTabs: '[data-store-tabs]',
    storeCatalog: '[data-store-catalog]'
  }),
  carePanel: Object.freeze({
    careClose: '[data-care-close]',
    careContent: '[data-care-content]'
  })
});

export class DomContractError extends Error {
  constructor({missingIds = [], missingSelectors = [], buildId = BUILD_ID} = {}) {
    const idText = missingIds.map(id => `#${id}`).join(', ');
    const selectorText = missingSelectors.join(', ');
    const details = [
      idText && `缺少 ID：${idText}`,
      selectorText && `缺少選擇器：${selectorText}`
    ].filter(Boolean).join('；');
    super(`介面結構不完整${details ? `（${details}）` : ''}`);
    this.name = 'DomContractError';
    this.missingIds = Object.freeze([...missingIds]);
    this.missingSelectors = Object.freeze([...missingSelectors]);
    this.buildId = buildId;
  }
}

export function resolveDomContract(root = document) {
  const missingIds = [];
  const missingSelectors = [];
  const dom = {};
  const getById = id => typeof root.getElementById === 'function'
    ? root.getElementById(id)
    : root.querySelector?.(`#${id}`);

  for (const id of REQUIRED_DOM_IDS) {
    const element = getById(id);
    if (!element) missingIds.push(id);
    else dom[id] = element;
  }

  for (const [parentId, selectors] of Object.entries(REQUIRED_NESTED_SELECTORS)) {
    const parent = dom[parentId];
    for (const [property, selector] of Object.entries(selectors)) {
      const element = parent?.querySelector?.(selector) || null;
      if (!element) missingSelectors.push(`#${parentId} ${selector}`);
      else dom[property] = element;
    }
  }

  if (missingIds.length || missingSelectors.length) {
    throw new DomContractError({missingIds, missingSelectors, buildId: BUILD_ID});
  }

  dom.panelCloseButtons = Object.freeze([
    ...(root.querySelectorAll?.('[data-close-panel]') || [])
  ]);
  return Object.freeze(dom);
}
