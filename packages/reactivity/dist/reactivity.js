// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  let runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var activeEffet;
function preCleanEffect(effect2) {
  effect2._tackId++;
  effect2._depsLength = 0;
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let index = effect2._depsLength; index < effect2.deps.length; index++) {
      cleanDepEffect(effect2.deps[index], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
var eid = 0;
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._tackId = 0;
    // 用于记录effect执行了几次
    this.deps = [];
    this._depsLength = 0;
    this._runing = false;
    this.active = true;
    this.eid = eid++;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffet;
    try {
      this._runing = true;
      activeEffet = this;
      preCleanEffect(this);
      return this.fn();
    } finally {
      postCleanEffect(this);
      activeEffet = lastEffect;
      this._runing = false;
    }
  }
  stop() {
    this.active = false;
  }
};
function cleanDepEffect(dep, effect2) {
  dep.delete(effect2);
  if (dep.size == 0) {
    dep.cleanup();
  }
}
function trackEffect(effect2, dep) {
  if (dep.get(effect2) !== effect2._tackId) {
    dep.set(effect2, effect2._tackId);
    let oldDep = effect2.deps[effect2._depsLength];
    if (oldDep != dep) {
      if (oldDep) {
        cleanDepEffect(oldDep, effect2);
      }
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
  }
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (!effect2._runing) {
      if (effect2.scheduler) {
        effect2.scheduler();
      }
    }
  }
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
var createDep = (cleanup, key) => {
  const dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  dep.name = key;
  return dep;
};
function track(target, key) {
  if (activeEffet) {
    console.log(" target, key,activeEffet: ", target, key, activeEffet);
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = /* @__PURE__ */ new Map();
      targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
      dep = createDep(() => depsMap.delete(key), key);
      depsMap.set(key, dep);
    }
    trackEffect(activeEffet, dep);
    console.log("targetMap:1111 ", targetMap);
  }
}
function trigger(target, key, newValue, oldValue) {
  console.log(
    "\u89E6\u53D1\u66F4\u65B0\u4E86 target, key, newValue, oldValue: ",
    target,
    key,
    newValue,
    oldValue
  );
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    console.log("dep: 11111 ", dep);
    triggerEffects(dep);
  }
}

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, recevier) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    let res = Reflect.get(target, key, recevier);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, recevier) {
    let oldValue = target[key];
    const result = Reflect.set(target, key, value, recevier);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObj(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) {
    return exitsProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
function reactive(target) {
  return createReactiveObj(target);
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

// packages/reactivity/src/ref.ts
function ref(value) {
  return createRef(value);
}
function createRef(value) {
  return new RefImpl(value);
}
var RefImpl = class {
  // 用于收集对应的effect
  constructor(rawValue) {
    this.rawValue = rawValue;
    this.__v_isRef = true;
    this.dep = [];
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
};
function trackRefvalue(ref2) {
  if (activeEffet) {
    trackEffect(
      activeEffet,
      ref2.dep = createDep(() => {
        ref2.dep = void 0;
      }, "undefined")
    );
  }
}
function triggerRefValue(ref2) {
  const dep = ref2.dep;
  if (dep) {
    triggerEffects(dep);
  }
}
export {
  activeEffet,
  effect,
  reactive,
  ref,
  toReactive,
  trackEffect,
  triggerEffects
};
//# sourceMappingURL=reactivity.js.map
