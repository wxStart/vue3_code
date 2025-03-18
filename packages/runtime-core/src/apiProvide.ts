import { currentInstance } from './component';

export function provide(key, value) {
  // 子用的是父亲的  子提供的不能影响父亲
  // 父 ：{a:1}  子：{a:1: b:2 } 父亲只能是 {a:1}

  if (!currentInstance) return; //  说明不在setup里面使用

  const parentProvides = currentInstance.parent?.provides; // 获取父亲的 provides
  let provides = currentInstance.provides;
  if (provides == parentProvides) {
    //  createComponentInstance 里面 孩子直接引用了父亲的 provides

    // 在子组件中 使用provide 需要copy父父亲的
    provides = currentInstance.provides = Object.create(provides);
  }
  provides[key] = value;
}

export function inject(key, defaultValue) {
  if (!currentInstance) return; //  说明不在setup里面使用
  let provides = currentInstance.parent.provides; //! 儿子只能去取爸爸的  因为自己里面有可能去provide(key,value)
  if (provides && key in provides) {
    return provides[key];
  }
  return defaultValue;
}
