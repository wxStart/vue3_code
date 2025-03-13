import { ShapeFlags } from '@vue/shared';
import { isSameVnode } from './createVnode';

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  const mountChildren = (children, container) => {
    for (let index = 0; index < children.length; index++) {
      // 暂时不考虑孩子是文本  这里只是html标签
      patch(null, children[index], container);
    }
  };
  const mountElement = (vnode, container) => {
    console.log('vnode: ', vnode);
    const { type, children, props, shapeFlag } = vnode;
    // 让虚拟节点和真实节点产生关联
    // 下次渲染可以继续使用郑愕节点
    let el = (vnode.el = hostCreateElement(type));
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 1|8  =9
    // 9&8 >0 说明9里面包含8
    // 1001
    // 1000
    // 1000

    // 9 & 2  <=0 说明这 9 里面不包含2
    // 1001
    // 0010
    // 0000
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };

  const processElement = (n1, n2, container) => {
    // n1 是null 说明是初次渲染
    if (n1 === null) {
      mountElement(n2, container);
    } else {
      patchElement(n1, n2, container);
    }
  };

  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const patchChildren = (n1, n2, container){};

  const patchElement = (n1, n2, container) => {
    /*
    1.比较元素的差异，肯定需要复用dom
     2.比较属性
    3.比较子节点
    */


     // 1.比较元素的差异，肯定需要复用dom
    let el = (n2.el = n1.el); // dom复用

    let oldProps = n1.props || {};
    let newProps = n2.props || {};
   // 2.比较属性
    patchProps(oldProps, newProps, el);
    // 3.比较子节点
    // todo  这次写到比较孩子的函数入口
    patchChildren(n1, n2, container);
  };
  const patch = (n1, n2, container) => {
    if (n1 == n2) {
      return;
    }
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null; // 这样就是直接走下面 mountElement 直接初次渲染n2
    }
    processElement(n1, n2, container);
  };

  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        // 第二次传入的节点是null 说明要移除改容器中的dom元素
        unmount(container._vnode);
      }
    }
    // 将虚拟节点变成真实节点
    // console.log('vnode, container: ', vnode, container);
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };

  return {
    render,
  };
}
