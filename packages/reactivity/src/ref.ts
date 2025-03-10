import { activeEffet, trackEffect, triggerEffects } from './effect';
import { toReactive } from './reactive';
import { createDep } from './reactiveEffect';

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  __v_isRef = true;
  _value;

  dep = []; // 用于收集对应的effect
  constructor(public rawValue) {
    this._value = toReactive(this.rawValue);
  }

  get value() {
    trackRefvalue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = newValue;
      triggerRefValue(this);
    }
  }
}

function trackRefvalue(ref) {
  if (activeEffet) {
    trackEffect(
      activeEffet,
      (ref.dep = createDep(() => {
        ref.dep = undefined;
      }, 'undefined'))
    );
  }
}

function triggerRefValue(ref) {
  const dep = ref.dep;
  if (dep) {
    triggerEffects(dep);
  }
}
