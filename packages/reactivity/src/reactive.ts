import { isObject } from '@vue/shared';
import { mutableHandlers } from './baseHandler';
import { ReactiveFlags } from './constants';

const reactiveMap = new WeakMap();

function createReactiveObj(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target[ReactiveFlags.IS_REACTIVE]) {
    // 被代理过的对象才有这个属性 才会走到get里面
    return target;
  }

  // 进行缓存  避免同一个对象多次避免生成不同的代理对象
  const exitsProxy = reactiveMap.get(target);
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

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
