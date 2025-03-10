export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  return _effect;
}

export let activeEffet;

let eid = 0;
class ReactiveEffect {
  _tackId = 0; // 用于记录effect执行了几次

  deps = [];
  _depsLength = 0;
  public active = true;
  public eid = eid++;
  constructor(public fn, public scheduler) {}
  run() {
    if (!this.active) {
      return this.fn(); // 不是激活的 执行后什么都不做
    }

    let lastEffect = activeEffet; // effect 函授中还有effect  记录前一个effect
    try {
      activeEffet = this;
      return this.fn();
    } finally {
      activeEffet = lastEffect;
    }
  }

  stop() {
    this.active = false;
  }
}

export function trackEffect(effect, dep) {
  dep.set(effect, effect._tackId);
  // 让effect和 dep关联起来
  effect.deps[effect._depsLength++] = dep;
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if(effect.scheduler){
        effect.scheduler()
    }
  }
}
