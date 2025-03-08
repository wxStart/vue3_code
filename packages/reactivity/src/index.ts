import { isObject } from '@vue/shared';

enum reactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

const reactiveMap = new WeakMap();

const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === reactiveFlags.IS_REACTIVE) {
      return true;
    }
  },

  set(target, key, value, recevier) {
    return true;
  },
};

function createReactiveObj(target) {
  if (!isObject(target)) {
    return target;
  }

  if (target[reactiveFlags.IS_REACTIVE]) {
    // 被代理过的对象才有这个属性 才会走到get里面
    return target;
  }

  const exitsProxy = reactiveMap.get(target);
  console.log('exitsProxy: ', exitsProxy);
  if (exitsProxy) {
    return exitsProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);

  return proxy;
}

export function reactive(target) {
  return createReactiveObj(target);
}
