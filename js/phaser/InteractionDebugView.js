export class InteractionDebugView {
  constructor(scene, {inputMode, furnitureDragController, catBehaviorController, cameraController} = {}) {
    this.scene = scene;
    this.inputMode = inputMode;
    this.furnitureDragController = furnitureDragController;
    this.catBehaviorController = catBehaviorController;
    this.cameraController = cameraController;
    this.enabled = new URLSearchParams(location.search).get('interactionDebug') === '1';
    this.element = null;
    this.nextUpdateAt = 0;
    if (this.enabled) this.create();
  }

  create() {
    this.element = document.createElement('pre');
    this.element.id = 'interactionDebug';
    Object.assign(this.element.style, {
      position: 'absolute', left: '6px', top: '6px', zIndex: '60', margin: '0',
      maxWidth: 'min(92%, 540px)', maxHeight: '65%', overflow: 'hidden',
      padding: '7px', borderRadius: '8px', color: '#eaffda', background: '#20140dcc',
      font: '10px/1.35 monospace', whiteSpace: 'pre-wrap', pointerEvents: 'none'
    });
    document.getElementById('domOverlay')?.appendChild(this.element);
  }

  update(time) {
    if (!this.element || time < this.nextUpdateAt) return;
    this.nextUpdateAt = time + 120;
    const camera = this.scene.cameras.main;
    const snapshot = {
      inputMode: this.inputMode.getMode(),
      activePointers: this.inputMode.getActivePointerCount(),
      camera: {zoom: camera.zoom, scrollX: camera.scrollX, scrollY: camera.scrollY, enabled: this.cameraController.isEnabled()},
      furniture: this.furnitureDragController.getDebugSnapshot(),
      cats: this.catBehaviorController.getDebugSnapshot()
    };
    this.element.textContent = JSON.stringify(snapshot, null, 2);
  }

  destroy() { this.element?.remove(); this.element = null; }
}
