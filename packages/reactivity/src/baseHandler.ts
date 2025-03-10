// import { activeEffet } from './effect';

import { isObject } from '@vue/shared';
import { track, trigger } from './reactiveEffect';
import { reactive } from './reactive';

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
      // 值变了才会去触发页面更新
      trigger(target, key, value, oldValue);
    }

    return result;
  },
};
