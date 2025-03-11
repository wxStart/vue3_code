import { isFunction, isObject } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { isRef } from './ref';
import { isReactive } from './reactive';

export function watch(source, cb, optipns: any = {}) {
  return doWatch(source, cb, optipns);
}

export function watchEffect(source, optipns: any = {}) {
  return doWatch(source, null, optipns);
}

function traverse(source, depth, currentDepoth = 0, seen = new Set()) {
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
    // 避免对象之间相互引用
    return source;
  }
  for (const key in source) {
    traverse(source[key], depth, currentDepoth, seen);
  }
  return source;
}

function doWatch(source, cb, { deep, immediate }) {
  const reactiveGetter = (data) =>
    traverse(data, deep == false ? 1 : undefined);

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
      const newValue = effect.run();
      cb(newValue, oldValue);
      oldValue = newValue;
    } else {
      effect.run();
    }
  };
  const effect = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    // watchEffect
    effect.run();
  }

  const unwatch = () => {
    effect.stop();
  };

  return unwatch;
  console.log('oldValue: 111', oldValue);
}
