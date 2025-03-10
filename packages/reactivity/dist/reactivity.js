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
  return _effect;
}
var activeEffet;
function preCleanEffect(effect2) {
  effect2._tackId++;
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
    this.active = true;
    this.eid = eid++;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffet;
    try {
      activeEffet = this;
      preCleanEffect(this);
      return this.fn();
    } finally {
      activeEffet = lastEffect;
    }
  }
  stop() {
    this.active = false;
  }
};
function trackEffect(effect2, dep) {
  if (dep.get(effect2) !== effect2._tackId) {
    dep.set(effect2, effect2._tackId);
    effect2.deps[effect2._depsLength++] = dep;
  }
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2.scheduler) {
      effect2.scheduler();
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
    return Reflect.get(target, key, recevier);
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
export {
  activeEffet,
  effect,
  reactive,
  trackEffect,
  triggerEffects
};
//# sourceMappingURL=reactivity.js.map
