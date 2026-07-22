export class ToastManager {
  constructor(element) {
    if (!(element instanceof Element)) throw new TypeError('ToastManager 需要有效的 #gameToast Element');
    this.element = element;
    this.current = null;
    this.cooldowns = new Map();
  }

  show(message, {key = message, priority = 0, duration = 1800, cooldown = 900} = {}) {
    const now = performance.now();
    if ((this.cooldowns.get(key) || 0) > now) return false;
    if (this.current && this.current.priority > priority) return false;
    clearTimeout(this.current?.timer);
    this.element.textContent = message;
    this.element.classList.add('show');
    const timer = setTimeout(() => {
      this.element.classList.remove('show');
      this.current = null;
    }, duration);
    this.current = {key, priority, timer};
    this.cooldowns.set(key, now + cooldown);
    return true;
  }

  destroy() {
    clearTimeout(this.current?.timer);
    this.current = null;
    this.element.classList.remove('show');
  }
}
