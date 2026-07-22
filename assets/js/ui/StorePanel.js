import {FURNITURE_VISUAL_CONFIG} from '../config/furniture-visual-config.js?v=0551a';
import {getPurchasableFurniture} from '../core/furniture-catalog-selector.js?v=0551a';

function requireElement(element, label) {
  if (!(element instanceof Element)) throw new TypeError(`${label} 必須是有效的 Element`);
  return element;
}

export class StorePanel {
  constructor(element, furnitureConfig, saveAdapter, onPlace) {
    this.element = requireElement(element, 'StorePanel element');
    this.closeButton = requireElement(element.querySelector('[data-close]'), 'StorePanel [data-close]');
    this.tabs = requireElement(element.querySelector('[data-store-tabs]'), 'StorePanel [data-store-tabs]');
    this.catalog = requireElement(element.querySelector('[data-store-catalog]'), 'StorePanel [data-store-catalog]');
    this.furniture = furnitureConfig;
    this.saveAdapter = saveAdapter;
    this.onPlace = onPlace;
    this.category = '全部';
    this.abortController = new AbortController();
    this.bind();
  }

  bind() {
    const options = {signal: this.abortController.signal};
    this.closeButton.addEventListener('click', () => this.close(), options);
    this.tabs.addEventListener('click', event => {
      const button = event.target.closest('button[data-category]');
      if (!button) return;
      this.category = button.dataset.category;
      this.render();
    }, options);
    this.catalog.addEventListener('click', event => {
      const card = event.target.closest('.store-card[data-id]');
      if (!card) return;
      this.onPlace(card.dataset.id);
      this.close();
    }, options);
  }

  open() { this.element.classList.remove('hidden'); this.render(); }
  close() { this.element.classList.add('hidden'); }

  render() {
    const visibleCatalog = getPurchasableFurniture({definitions:this.furniture,visualConfig:FURNITURE_VISUAL_CONFIG});
    const categories = ['全部', ...new Set(visibleCatalog.map(entry => entry.definition.cat))];
    if (!categories.includes(this.category)) this.category = '全部';
    this.tabs.innerHTML = categories.map(category => `<button class="${category === this.category ? 'active' : ''}" data-category="${category}">${category}</button>`).join('');
    const state = this.saveAdapter.state;
    const entries = getPurchasableFurniture({definitions:this.furniture,visualConfig:FURNITURE_VISUAL_CONFIG,category:this.category});
    this.catalog.innerHTML = entries.map(({id,definition:item}) => `
      <button class="store-card" data-id="${id}">
        <span class="owned">持有 ${state.inventory[id] || 0}</span>
        <img src="${item.texture}" alt="${item.name}">
        <b>${item.name}</b>
        <small>NT$ ${Number(item.price || 0).toLocaleString('zh-TW')}・${item.foot.join('×')}</small>
      </button>`).join('');
  }

  destroy() { this.abortController.abort(); }
}
