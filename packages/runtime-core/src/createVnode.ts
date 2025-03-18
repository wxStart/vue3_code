import { isObject, isString, ShapeFlags } from '@vue/shared';
import { isTeleport } from './Teleport';

export const Text = Symbol('Text');

export const Fragment = Symbol('Fragment');

export function isVnode(value) {
  return value?.__v_isVnode;
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

export function createVnode(type, props, children?) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isTeleport(type)  // isTeleport 也是一个对象
    ? ShapeFlags.TELEPORT
    : isObject(type) // 有状态的组件组件的时候是一个对象
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    key: props?.key,
    el: null,
    shapeFlag,
  };
  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      // 孩子是对象的时候说明是组件的 slot
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    } else {
      vnode.children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }
  return vnode;
}
