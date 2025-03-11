import { isObject } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { isRef } from './ref';
import { isReactive } from './reactive';

export function watch(source, cb, optipns: any = {}) {
  return doWatch(source, cb, optipns);
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

function doWatch(source, cb, { deep }) {
  const reactiveGetter = (data) =>
    traverse(data, deep == false ? 1 : undefined);

  let getter;
  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source.value;
  }
  let oldValue;

  const job = () => {
    const newValue = effect.run();
    cb(newValue, oldValue);
    oldValue = newValue;
  };
  const effect = new ReactiveEffect(getter, job);
  oldValue = effect.run();
  console.log('oldValue: 111', oldValue);
}
