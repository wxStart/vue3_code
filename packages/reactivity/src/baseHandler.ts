// import { activeEffet } from './effect';

import { track, trigger } from './reactiveEffect';

export enum reactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === reactiveFlags.IS_REACTIVE) {
      return true;
    }
    // console.log('key, activeEffet: ', key, activeEffet);
    track(target, key);
    return Reflect.get(target, key, recevier);
  },

  set(target, key, value, recevier) {
    let oldValue = target[key];
    const result = Reflect.set(target, key, value, recevier);

    if (oldValue !== value) {
      // 值变了才会去触发页面更新
      trigger(target, key, value, oldValue);
    }

    return result;
  },
};
