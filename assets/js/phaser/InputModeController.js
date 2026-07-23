import {INPUT_MODE, canTransitionInputMode, stableInputMode} from '../core/input-state.js?v=0560a';

export class InputModeController {
  constructor({getSelectedItemId = () => null, onChange = null} = {}) {
    this.mode = INPUT_MODE.IDLE;
    this.context = Object.freeze({});
    this.activePointers = new Set();
    this.getSelectedItemId = getSelectedItemId;
    this.onChange = onChange;
  }

  getMode() { return this.mode; }
  isMode(mode) { return this.mode === mode; }

  setMode(nextMode, context = {}) {
    if (!canTransitionInputMode(this.mode, nextMode)) return false;
    this.mode = nextMode;
    this.context = Object.freeze({...context});
    this.onChange?.(this.mode, this.context);
    return true;
  }

  trackPointer(pointerId) { this.activePointers.add(pointerId); }
  releasePointer(pointerId) { this.activePointers.delete(pointerId); }
  getActivePointerCount() { return this.activePointers.size; }

  canStartCameraPan(_pointer, over = []) {
    return !over.length && [INPUT_MODE.IDLE, INPUT_MODE.FURNITURE_SELECTED].includes(this.mode);
  }

  canStartFurnitureDrag(entity, pointer) {
    return Boolean(entity?.item && pointer) && [INPUT_MODE.IDLE, INPUT_MODE.FURNITURE_SELECTED].includes(this.mode);
  }

  canStartPinch() {
    return this.activePointers.size >= 2 && ![INPUT_MODE.UI_BLOCKED, INPUT_MODE.CARE_INTERACTION].includes(this.mode);
  }

  releaseToStable() {
    const next = stableInputMode({selectedItemId: this.getSelectedItemId()});
    if (!this.setMode(next)) {
      this.mode = next;
      this.context = Object.freeze({});
      this.onChange?.(this.mode, this.context);
    }
    return this.mode;
  }

  reset() {
    this.activePointers.clear();
    this.mode = stableInputMode({selectedItemId: this.getSelectedItemId()});
    this.context = Object.freeze({});
    this.onChange?.(this.mode, this.context);
  }
}
