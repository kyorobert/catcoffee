import {CARE_ACTIONS} from '../core/care-interaction-core.js?v=0550a1';

const STAT_LABELS = Object.freeze({satiety: '飽足', mood: '心情', clean: '清潔', bond: '羈絆'});
const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));

export class CarePanel {
  constructor(element, profiles, callbacks = {}) {
    if (!(element instanceof Element)) throw new TypeError('CarePanel 需要有效的 #carePanel Element');
    const content = element.querySelector('[data-care-content]');
    const closeButton = element.querySelector('[data-care-close]');
    if (!(content instanceof Element)) throw new TypeError('CarePanel 缺少 [data-care-content]');
    if (!(closeButton instanceof Element)) throw new TypeError('CarePanel 缺少 [data-care-close]');
    this.element = element;
    this.profiles = profiles;
    this.profileMap = new Map(profiles.map(profile => [profile.id, profile]));
    this.callbacks = callbacks;
    this.state = null;
    this.selectedCatId = null;
    this.session = null;
    this.pending = false;
    this.content = content;
    this.closeButton = closeButton;
    this.onClick = event => this.handleClick(event);
    this.onKeyDown = event => { if (event.key === 'Escape' && this.isOpen()) this.close('escape'); };
    element.addEventListener('click', this.onClick);
    document.addEventListener('keydown', this.onKeyDown);
  }

  isOpen() { return !this.element.classList.contains('hidden'); }

  open(state, preferredCatId = null) {
    this.state = state;
    this.session = null;
    this.pending = false;
    this.selectedCatId = this.profileMap.has(preferredCatId)
      ? preferredCatId
      : (state.dutyCats || []).find(id => this.profileMap.has(id)) || this.profiles[0]?.id;
    this.element.classList.remove('hidden');
    this.element.dataset.phase = 'select';
    this.renderSelection();
    this.callbacks.select?.(this.selectedCatId);
  }

  updateState(state) {
    this.state = state;
    if (this.isOpen() && !this.session) this.renderSelection();
  }

  handleClick(event) {
    const close = event.target.closest('[data-care-close]');
    if (close) { this.close('button'); return; }
    const cat = event.target.closest('[data-care-cat]');
    if (cat && !this.session) {
      this.selectedCatId = cat.dataset.careCat;
      this.callbacks.select?.(this.selectedCatId);
      this.renderSelection();
      return;
    }
    const action = event.target.closest('[data-care-action]');
    if (action && !this.session && !this.pending) {
      this.pending = true;
      const result = this.callbacks.start?.(this.selectedCatId, action.dataset.careAction);
      if (!result?.started) this.pending = false;
      return;
    }
    if (event.target.closest('[data-care-finish]')) {
      this.callbacks.finish?.();
      this.hide();
    }
  }

  renderSelection() {
    const profile = this.profileMap.get(this.selectedCatId) || this.profiles[0];
    const stats = this.state?.catStats?.[profile?.id] || {};
    const catCards = this.profiles.map(cat => `
      <button class="care-cat-chip${cat.id === profile.id ? ' selected' : ''}" type="button" data-care-cat="${cat.id}">
        <img src="${cat.portrait}" alt="${cat.name}大頭照" width="48" height="48">
        <span><b>${cat.name}</b><small>${cat.personality}</small></span>
      </button>`).join('');
    const actionDescriptions = {
      feed: '提升飽足，也會讓心情稍微變好',
      groom: '整理毛髮，提升清潔與心情',
      play: '大幅提升心情，也會消耗少量飽足'
    };
    this.content.innerHTML = `
      <div class="care-cat-strip" aria-label="選擇貓咪">${catCards}</div>
      <section class="care-profile">
        <div class="care-profile-heading">
          <div class="care-portrait-frame"><img src="${profile.portrait}" alt="${profile.name}大頭照"><span>${profile.name.slice(0, 1)}</span></div>
          <div><small>今天想照顧誰？</small><h3>${profile.name}</h3><p>${profile.personality}，正期待你的陪伴。</p></div>
        </div>
        <div class="care-stats">${['satiety', 'mood', 'clean', 'bond'].map(key => this.statBar(key, stats[key])).join('')}</div>
      </section>
      <section class="care-actions" aria-label="選擇照顧方式">
        ${Object.values(CARE_ACTIONS).map(action => `<button type="button" data-care-action="${action.id}" class="care-action-card">
          <span class="care-action-icon ${action.icon}" aria-hidden="true"></span>
          <span><b>${action.name}</b><small>${actionDescriptions[action.id]}</small><em>體力 -${action.energyCost}</em></span>
        </button>`).join('')}
      </section>`;
    this.bindPortraitFallbacks();
  }

  statBar(key, value, after = null) {
    const beforeValue = clamp(value);
    const afterValue = after === null ? beforeValue : clamp(after);
    const animated = after === null ? '' : ' animated';
    return `<div class="care-stat${animated}" style="--care-from:${beforeValue}%;--care-to:${afterValue}%"><span>${STAT_LABELS[key]}</span><div><i style="width:${afterValue}%"></i></div><b>${afterValue}</b></div>`;
  }

  begin(payload) {
    this.session = payload;
    this.pending = false;
    const profile = this.profileMap.get(payload.catId);
    const action = payload.result.action;
    this.element.dataset.phase = 'perform';
    this.content.innerHTML = `
      <section class="care-performance care-${payload.mode}" style="--care-duration:${action.duration}ms">
        <p class="care-stage-label">正在${action.name}…</p>
        <div class="care-performance-scene">
          <div class="care-large-portrait"><img src="${profile.portrait}" alt="${profile.name}"><span>${profile.name.slice(0, 1)}</span></div>
          <span class="care-prop ${action.icon}" aria-label="${action.name}道具"></span>
          <i class="care-sparkle one"></i><i class="care-sparkle two"></i>
        </div>
        <h3>${profile.name}</h3><blockquote>「${payload.result.reaction}」</blockquote>
        <div class="care-progress-track"><i></i></div>
        <small>請稍候，完成後會顯示照顧結果。</small>
      </section>`;
    this.bindPortraitFallbacks();
  }

  complete(payload) {
    this.session = payload;
    this.state = {...this.state, energy: payload.result.energyAfter};
    const profile = this.profileMap.get(payload.catId);
    const result = payload.result;
    const changed = Object.entries(result.changes).filter(([, amount]) => amount !== 0);
    this.element.dataset.phase = 'result';
    this.content.innerHTML = `
      <section class="care-result">
        <div class="care-result-badge">完成</div>
        <div class="care-large-portrait compact"><img src="${profile.portrait}" alt="${profile.name}"><span>${profile.name.slice(0, 1)}</span></div>
        <h3>${result.action.name}完成</h3>
        <blockquote>「${result.reaction}」</blockquote>
        <div class="care-result-bars">${changed.filter(([key]) => key !== 'bond').map(([key]) => this.statBar(key, result.before[key], result.after[key])).join('')}${this.statBar('bond', result.before.bond, result.after.bond)}</div>
        <div class="care-result-list">
          ${changed.map(([key, amount]) => `<div><span>${STAT_LABELS[key]}</span><b>${result.before[key]} → ${result.after[key]}</b><em>${amount > 0 ? '+' : ''}${amount}</em></div>`).join('')}
          <div><span>體力</span><b>${result.energyBefore} → ${result.energyAfter}</b><em>-${result.action.energyCost}</em></div>
        </div>
        <button class="care-finish" type="button" data-care-finish>完成</button>
      </section>`;
    this.bindPortraitFallbacks();
  }

  fail() { this.pending = false; }

  close(reason = 'close') {
    if (this.session?.phase === 'result' && this.session.committed) this.callbacks.finish?.();
    else if (this.session) this.callbacks.cancel?.(reason);
    this.hide();
  }

  hide() {
    this.element.classList.add('hidden');
    this.element.dataset.phase = 'closed';
    this.session = null;
    this.pending = false;
  }

  bindPortraitFallbacks() {
    this.content.querySelectorAll('img').forEach(image => image.addEventListener('error', () => {
      image.classList.add('is-error');
      image.setAttribute('aria-hidden', 'true');
    }, {once: true}));
  }

  destroy() {
    this.element.removeEventListener('click', this.onClick);
    document.removeEventListener('keydown', this.onKeyDown);
  }
}
