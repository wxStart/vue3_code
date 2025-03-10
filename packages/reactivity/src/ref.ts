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

class ObjectRefImpl {
  __v_isRef = true;
  constructor(public _object, public _key) {}
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

export function toRef(obj, key) {
  return new ObjectRefImpl(obj, key);
}

export function toRefs(obj) {
  const res = {};
  for (let key in obj) {
    res[key] = toRef(obj, key);
  }
  return res;
}

export function proxyRefs(objectWithRef) {
  return new Proxy(objectWithRef, {
    get(target, key, recevier) {
      let r = Reflect.get(target, key, recevier);
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, value, recevier) {
      let oldValue = target[key];

      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, recevier);
      }
    },
  });
}
