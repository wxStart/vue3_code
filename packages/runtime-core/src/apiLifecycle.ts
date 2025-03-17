import {
  currentInstance,
  setCurrentInstance,
  unsetCurrentInstance,
} from './component';

export enum LifeCytcle {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
}

function createHook(type) {
  return (hook, target = currentInstance) => {
    if (target) {
      // 钩子只能在组件中运行
      const hooks = target[type] || (target[type] = []);
      const hook1 = () => {
        setCurrentInstance(target);
        hook.call(target);
        unsetCurrentInstance();
      };
      hooks.push(hook1);
    }
  };
}

export const onBeforeMount = createHook(LifeCytcle.BEFORE_MOUNT);
export const onMounted = createHook(LifeCytcle.MOUNTED);
export const onBeforeUpdate = createHook(LifeCytcle.BEFORE_UPDATE);
export const onUpdated = createHook(LifeCytcle.UPDATED);

export function invokeArray(fns) {
  for (let index = 0; index < fns.length; index++) {
    fns[index]();
  }
}
