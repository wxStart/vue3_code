import { ShapeFlags } from '@vue/shared';

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

    let el = hostCreateElement(type);
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
      debugger
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };

  const patch = (n1, n2, container) => {
    if (n1 == n2) {
      return;
    }

    // n1 是null 说明是初次渲染
    if (n1 === null) {
      mountElement(n2, container);
    }
  };

  const render = (vnode, container) => {
    // 将虚拟节点变成真实节点
    // console.log('vnode, container: ', vnode, container);
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };

  return {
    render,
  };
}
