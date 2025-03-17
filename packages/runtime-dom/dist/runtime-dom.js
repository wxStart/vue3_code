// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function isFunction(value) {
  return typeof value == "function";
}
function isString(value) {
  return typeof value == "string";
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = (target, key) => hasOwnProperty.call(target, key);

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
    this._dirtyLevel = 4 /* Dirty */;
    // 计算属性使用到的标记为
    this.active = true;
    this.eid = eid++;
  }
  get dirty() {
    return this._dirtyLevel == 4 /* Dirty */;
  }
  set dirty(v) {
    this._dirtyLevel = v ? 4 /* Dirty */ : 0 /* NoDirty */;
  }
  run() {
    this._dirtyLevel = 0 /* NoDirty */;
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
    if (this.active) {
      this.active = false;
      preCleanEffect(this);
      postCleanEffect(this);
    }
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
    if (effect2._dirtyLevel < 4 /* Dirty */) {
      effect2._dirtyLevel = 4 /* Dirty */;
    }
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
function isReactive(value) {
  return value && value["__v_isReactive" /* IS_REACTIVE */];
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
  console.log(" ref.dep: ", ref2.dep);
  if (activeEffet) {
    trackEffect(
      activeEffet,
      ref2.dep = ref2.dep || createDep(() => {
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
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
    this.__v_isRef = true;
  }
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};
function toRef(obj, key) {
  return new ObjectRefImpl(obj, key);
}
function toRefs(obj) {
  const res = {};
  for (let key in obj) {
    res[key] = toRef(obj, key);
  }
  return res;
}
function proxyRefs(objectWithRef) {
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
    }
  });
}
function isRef(value) {
  return value && value.__v_isRef;
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = new ReactiveEffect(
      () => getter(this._vlaue),
      () => {
        triggerRefValue(this);
      }
    );
  }
  get value() {
    if (this.effect.dirty) {
      this._vlaue = this.effect.run();
      trackRefvalue(this);
    }
    return this._vlaue;
  }
  set value(value) {
    this.setter();
  }
};
function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/reactivity/src/watch.ts
function watch(source, cb, optipns = {}) {
  return doWatch(source, cb, optipns);
}
function watchEffect(source, optipns = {}) {
  return doWatch(source, null, optipns);
}
function traverse(source, depth, currentDepoth = 0, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepoth >= depth) {
      return source;
    }
    currentDepoth++;
  }
  if (seen.has(source)) {
    return source;
  }
  for (const key in source) {
    traverse(source[key], depth, currentDepoth, seen);
  }
  return source;
}
function doWatch(source, cb, { deep, immediate }) {
  const reactiveGetter = (data) => traverse(data, deep == false ? 1 : void 0);
  let getter;
  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldValue;
  const job = () => {
    if (cb) {
      const newValue = effect2.run();
      cb(newValue, oldValue);
      oldValue = newValue;
    } else {
      effect2.run();
    }
  };
  const effect2 = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect2.run();
    }
  } else {
    effect2.run();
  }
  const unwatch = () => {
    effect2.stop();
  };
  return unwatch;
  console.log("oldValue: 111", oldValue);
}

// packages/runtime-core/src/createVnode.ts
var Text = Symbol("Text");
var Fragment = Symbol("Fragment");
function isVnode(value) {
  return value?.__v_isVnode;
}
function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function createVnode(type, props, children) {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    key: props?.key,
    el: null,
    shapeFlag
  };
  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
    } else if (isObject(children)) {
      vnode.shapeFlag |= 32 /* SLOTS_CHILDREN */;
    } else {
      vnode.children = String(children);
      vnode.shapeFlag |= 8 /* TEXT_CHILDREN */;
    }
  }
  return vnode;
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  let len = arguments.length;
  if (len == 2) {
    if (isObject(propsOrChildren)) {
      if (Array.isArray(propsOrChildren)) {
        return createVnode(type, null, propsOrChildren);
      }
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      } else {
        return createVnode(type, propsOrChildren);
      }
    } else {
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (len > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (len == 3 && isVnode(children)) {
      children = [children];
    }
    console.log("children: ", children);
    return createVnode(type, propsOrChildren, children);
  }
}

// packages/runtime-core/src/seq.ts
function getSequence(arr) {
  const result = [0];
  let p = result.slice(0);
  const len = arr.length;
  let start = 0;
  let end = result.length - 1;
  let minddle;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      const resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        p[i] = result[result.length - 1];
        result.push(i);
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        minddle = (start + end) / 2 | 0;
        if (arr[result[minddle]] < arrI) {
          start = minddle + 1;
        } else {
          end = minddle;
        }
      }
      if (arrI < arr[result[start]]) {
        p[i] = result[start - 1];
        result[start] = i;
      }
    }
  }
  let rlen = result.length;
  let last = result[rlen - 1];
  while (rlen-- > 0) {
    result[rlen] = last;
    last = p[last];
  }
  return result;
}

// packages/runtime-core/src/schedule.ts
var queue = [];
var isFlushing = false;
var resolvePromise = Promise.resolve();
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach((job2) => {
        job2();
      });
      copy.length = 0;
    });
  }
}

// packages/runtime-core/src/component.ts
function createComponentInstance(vnode) {
  const instance = {
    data: null,
    // 组件的状态
    vnode,
    // 组件的虚拟节点
    subTree: null,
    // 子树
    isMounted: false,
    // 是否挂载完成
    update: null,
    // 组件的更新函数
    props: {},
    attrs: {},
    slots: {},
    // 插槽
    propsOptions: vnode.type.props,
    // 组件中接受的pops
    proxy: null
    // 代理原来的属性 方便用户取值
  };
  return instance;
}
var initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  const { propsOptions = {} } = instance;
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key];
      if (propsOptions[key]) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.props = reactive(props);
  instance.attrs = attrs;
};
var publicProperty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots
};
var handle = {
  get(target, key) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }
    const getters = publicProperty[key];
    if (getters) {
      return getters(target);
    }
  },
  set(target, key, value) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      console.warn("props \u5C5E\u6027\u662F\u53EA\u8BFB\u7684\uFF0C\u4E0D\u53EF\u8FDB\u884C\u4FEE\u6539");
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  }
};
var initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
    instance.slots = children;
  }
};
function setupComponent(instance) {
  const { vnode } = instance;
  initProps(instance, vnode.props);
  initSlots(instance, vnode.children);
  instance.proxy = new Proxy(instance, handle);
  const { data, render: render2, setup } = vnode.type;
  if (setup) {
    const setupContext = {
      // .. 四个参数
    };
    const setupResult = setup(instance.props, setupContext);
    console.log("setupResult: ", setupResult);
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else {
      instance.setupState = proxyRefs(setupResult);
    }
  }
  if (isFunction(data)) {
    instance.data = reactive(data.call(instance.proxy));
  } else {
    console.warn(" data options \u5FC5\u987B\u662F\u4E00\u4E2A\u51FD\u6570 ");
  }
  if (!instance.render) {
    instance.render = render2;
  }
}

// packages/runtime-core/src/renderer.ts
function createRenderer(renderOptions2) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp
  } = renderOptions2;
  const mountChildren = (children, container) => {
    for (let index = 0; index < children.length; index++) {
      patch(null, children[index], container);
    }
  };
  const mountElement = (vnode, container, anchor) => {
    console.log("vnode: ", vnode);
    const { type, children, props, shapeFlag } = vnode;
    let el = vnode.el = hostCreateElement(type);
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  };
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      const textel = n2.el = hostCreateText(n2.children);
      hostInsert(textel, container);
    } else {
      if (n1.children !== n2.children) {
        const el = n2.el = n1.el;
        hostSetElementText(el, n2.children);
      }
    }
  };
  const processFragment = (n1, n2, container) => {
    if (n1 === null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const unmountChildren = (children) => {
    for (let index = 0; index < children.length; index++) {
      const element = children[index];
      unmount(element);
    }
  };
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        console.log("z\u8D70\u5230\u8FD9\u91CC: ");
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        let anchor = c2[nextPos]?.el;
        console.log("anchor: ", anchor);
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    } else {
      console.log("i: ", i, e1, e2);
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      let toBePatched = e2 - s2 + 1;
      let newIndextoOldMapIndex = new Array(toBePatched).fill(0);
      for (let index = s2; index <= e2; index++) {
        const vnode = c2[index];
        keyToNewIndexMap.set(vnode.key, index);
      }
      console.log("keyToNewIndexMap: ", keyToNewIndexMap);
      for (let index = s1; index <= e1; index++) {
        const oldVnode = c1[index];
        const newIndex = keyToNewIndexMap.get(oldVnode.key);
        if (newIndex == void 0) {
          unmount(oldVnode);
        } else {
          newIndextoOldMapIndex[newIndex - s2] = index + 1;
          patch(oldVnode, c2[newIndex], el);
        }
      }
      console.log("newIndextoOldMapIndex: ", newIndextoOldMapIndex);
      const increasingSeq = getSequence(newIndextoOldMapIndex);
      console.log("increasingSeq: ", increasingSeq);
      let j = increasingSeq.length - 1;
      for (let index = toBePatched; index >= 0; index--) {
        let newIndex = s2 + index;
        let anchor = c2[newIndex + 1]?.el;
        const vnode = c2[newIndex];
        if (!vnode.el) {
          patch(null, vnode, el, anchor);
        } else {
          if (index == increasingSeq[j]) {
            j--;
          } else {
            hostInsert(vnode.el, el, anchor);
          }
        }
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    let c1 = n1.children;
    let c2 = n2.children;
    let prevShapeFlag = n1.shapeFlag;
    let shapeFlag = n2.shapeFlag;
    if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
      if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        patchKeyedChildren(c1, c2, el);
      } else {
        unmountChildren(c1);
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      }
    } else {
      if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          hostSetElementText(el, "");
          mountChildren(c2, el);
        } else {
          if (c1 !== c2) {
            hostSetElementText(el, c2);
          }
        }
      } else {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(c2, el);
        } else {
          if (c1 !== c2) {
            hostSetElementText(el, c2);
          }
        }
      }
    }
  };
  const patchElement = (n1, n2, container) => {
    let el = n2.el = n1.el;
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    updateProps(instance, instance.props, next.props);
    debugger;
  };
  function setupRenderEffect(instance, container, anchor) {
    const { render: render3 } = instance;
    const componentUpdate = () => {
      if (!instance.isMounted) {
        const subTree = render3.call(instance.proxy, instance.proxy);
        patch(null, subTree, container, anchor);
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        debugger;
        const { next } = instance;
        if (next) {
          updateComponentPreRender(instance, next);
        }
        const subTree = render3.call(instance.proxy, instance.proxy);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
      }
    };
    const effect2 = new ReactiveEffect(componentUpdate, () => {
      queueJob(update);
    });
    const update = instance.update = () => effect2.run();
    update();
  }
  const mountComponent = (vnode, container, anchor) => {
    const instance = vnode.component = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container, anchor);
    console.log("\u770B\u770Battrs \u548Cprops \u5C5E\u6027\uFF1Ainstance ", instance);
  };
  const hasPropsChange = (prevProps, nextProps) => {
    let nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let index = 0; index < nextKeys.length; index++) {
      const key = nextKeys[index];
      if (nextProps[key] != prevProps[key]) {
        return true;
      }
    }
    return false;
  };
  const updateProps = (instance, prevProps, nextProps) => {
    if (hasPropsChange(prevProps, nextProps)) {
      for (const key in nextProps) {
        instance.props[key] = nextProps[key];
      }
      for (const key in prevProps) {
        if (!(key in nextProps)) {
          delete instance.props[key];
        }
      }
    }
  };
  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    if (prevChildren || nextChildren) return true;
    if (prevProps === nextProps) return false;
    debugger;
    return hasPropsChange(prevProps, nextProps);
  };
  const updateComponent = (n1, n2) => {
    const instance = n2.component = n1.component;
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2;
      instance.update();
    }
  };
  const processComponent = (n1, n2, continer, anchor) => {
    if (n1 == null) {
      mountComponent(n2, continer, anchor);
    } else {
      updateComponent(n1, n2);
    }
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 == n2) {
      return;
    }
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & 6 /* COMPONENT */) {
          processComponent(n1, n2, container, anchor);
        }
    }
  };
  const unmount = (vnode) => {
    if (vnode.type === Fragment) {
      unmountChildren(vnode.children);
    } else {
      hostRemove(vnode.el);
    }
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode;
    }
  };
  return {
    render: render2
  };
}

// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  insert(el, container, anchor) {
    container.insertBefore(el, anchor);
  },
  remove(el) {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },
  createElement(type) {
    return document.createElement(type);
  },
  createText(text) {
    return document.createTextNode(text);
  },
  setText: (node, text) => {
    return node.nodeValue = text;
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling
};

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
}

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  invoker.value = value;
  return invoker;
}
function patchEvent(el, name, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();
  const existingInvokers = invokers[name];
  if (existingInvokers && nextValue) {
    return existingInvokers.value = nextValue;
  }
  if (nextValue) {
    const invoker = invokers[name] = createInvoker(nextValue);
    return el.addEventListener(eventName, invoker);
  }
  if (existingInvokers) {
    return el.removeEventListener(eventName, existingInvokers);
  }
}

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prevValue, nextValue = {}) {
  let style = el.style;
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue && !nextValue[key]) {
        style[key] = null;
      }
    }
  }
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign(nodeOps, {
  patchProp
});
var render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};
export {
  Fragment,
  ReactiveEffect,
  Text,
  activeEffet,
  computed,
  createRenderer,
  createVnode,
  effect,
  h,
  isReactive,
  isRef,
  isSameVnode,
  isVnode,
  proxyRefs,
  reactive,
  ref,
  render,
  renderOptions,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  trackRefvalue,
  triggerEffects,
  triggerRefValue,
  watch,
  watchEffect
};
//# sourceMappingURL=runtime-dom.js.map
