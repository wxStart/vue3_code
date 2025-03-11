import { isFunction } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { trackRefvalue, triggerRefValue } from './ref';

class ComputedRefImpl {
  public _vlaue;
  public effect;

  public dep;

  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(
      () => getter(this._vlaue),
      () => {
        //计算属性依赖变化执行这个函数
        // this.effect.dirty = true 也可以在   triggerEffects 中把 effect._dirtyLevel = DirtyLevels.Dirty;
        triggerRefValue(this) // 调度
      }
    );
  }
  get value() {
    if (this.effect.dirty) {
      this._vlaue = this.effect.run(); // 执行run 后  dirty就是false,   在getter里面访问值的时候会收集当前的这个effect ， 当依赖的属性变化时候就会执行这个effect的调度函数 triggerRefValue(this)
      trackRefvalue(this) // 这里只是为了把dep放到 计算属性对应的外围effect里面  外层的effect收集这计算属性ComputedRefImpl的 dep，同时dep里面也放着外围的effect 最后取值新 triggerRefValue函数 这时候就会执行外围函数的effect就会重新取计算属性了 
    }
    return this._vlaue;
  }
  set value(value) {
    this.setter();
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}
