import { DirtyLevels } from './constants';

export function effect(fn, options?) {
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

export let activeEffet;

function preCleanEffect(effect) {
  effect._tackId++; // 执行一次加一次
  effect._depsLength = 0;
}

function postCleanEffect(effect) {
  //【falg， age， xxx ，abc】
  // [flag, name]

  if (effect.deps.length > effect._depsLength) {
    for (let index = effect._depsLength; index < effect.deps.length; index++) {
      cleanDepEffect(effect.deps[index], effect);
    }
    effect.deps.length = effect._depsLength;
  }
}
let eid = 0;
export class ReactiveEffect {
  _tackId = 0; // 用于记录effect执行了几次

  deps = [];
  _depsLength = 0;

  _runing = false;

  _dirtyLevel = DirtyLevels.Dirty; // 计算属性使用到的标记为

  public active = true;
  public eid = eid++;
  constructor(public fn, public scheduler) {}

  public get dirty() {
    return this._dirtyLevel == DirtyLevels.Dirty;
  }

  public set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }

  run() {
    this._dirtyLevel = DirtyLevels.NoDirty;

    if (!this.active) {
      return this.fn(); // 不是激活的 执行后什么都不做
    }

    let lastEffect = activeEffet; // effect 函授中还有effect  记录前一个effect
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
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect);
  if (dep.size == 0) {
    dep.cleanup();
  }
}

export function trackEffect(effect, dep) {
  //每次执行 需要重新去收集依赖
  if (dep.get(effect) !== effect._tackId) {
    // 同一个effect 里面多次取值避免effect多次收集 ，使用 _tackId  和dep使用effect作为key ,_tackId作为值
    dep.set(effect, effect._tackId);
    // 让effect和 dep关联起来
    // effect.deps[effect._depsLength++] = dep;

    // 第一次 effect中deps {falg，age}
    // 第二次 effect中deps {falg，name}
    // 执行effect时候  _depsLength已经被置位0
    let oldDep = effect.deps[effect._depsLength];
    if (oldDep != dep) {
      if (oldDep) {
        // 删除掉老的
        // debugger;
        cleanDepEffect(oldDep, effect); // 例子中oldDep是name对相应的effect Map
      }
      effect.deps[effect._depsLength++] = dep;
    } else {
      // 说明是同一个key所的effect 直接不进行动作
      effect._depsLength++;
    }
  }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty;
    }

    if (!effect._runing) {
      if (effect.scheduler) {
        effect.scheduler();
      }
    }
  }
}
