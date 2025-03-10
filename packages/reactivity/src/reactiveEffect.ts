import { activeEffet, trackEffect, triggerEffects } from './effect';

let targetMap = new WeakMap();

export const createDep = (cleanup, key) => {
  const dep = new Map();
  // @ts-ignore
  dep.cleanup = cleanup;
  // @ts-ignore
  dep.name = key; // 自己加的属性 方便查看是哪个属性 的 dep
  return dep;
};

export function track(target, key) {
  if (activeEffet) {
    // 在effect中获取的属性才会进行收集
    console.log(' target, key,activeEffet: ', target, key, activeEffet);

    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = new Map();
      targetMap.set(target, depsMap);
    }

    let dep = depsMap.get(key);

    if (!dep) {
      dep = createDep(() => depsMap.delete(key), key); // 用于后面清理不需要的属性 移除对应属性的Map 比如name对相应的map
      depsMap.set(key, dep);
    }

    trackEffect(activeEffet, dep); // 将当前的effect 放入dep中 后续根据值变化执行里面的effect。run

    console.log('targetMap:1111 ', targetMap);
  }
}
/**
  targetMap 结构
  
  
Map:{
    obj:{
        属性： Map
    }
}

{
  {name:'xxx',age:30}: {
  
    age:{ // Set类型结构的数据  3.4后改为了 Map
        effect1,
        effect2,
    }

    name:{
        effect1
    }
  }

}

 */

export function trigger(target, key, newValue, oldValue) {
  console.log(
    '触发更新了 target, key, newValue, oldValue: ',
    target,
    key,
    newValue,
    oldValue
  );

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    console.log('dep: 11111 ', dep);
    triggerEffects(dep);
  }
}
