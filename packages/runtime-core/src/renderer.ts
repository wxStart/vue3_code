import { ShapeFlags } from '@vue/shared';
import { isSameVnode } from './createVnode';
import { getSequence } from './seq';

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
  const mountElement = (vnode, container, anchor) => {
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
    hostInsert(el, container, anchor);
  };

  const processElement = (n1, n2, container, anchor) => {
    // n1 是null 说明是初次渲染
    if (n1 === null) {
      mountElement(n2, container, anchor);
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

  const unmountChildren = (children) => {
    for (let index = 0; index < children.length; index++) {
      const element = children[index];
      unmount(element);
    }
  };

  const patchKeyedChildren = (c1, c2, el) => {
    // 1.减少比对范围，先从头开始比，再从尾部开始比较，确定不一样的范围

    let i = 0; // 开始比对的索引
    let e1 = c1.length - 1; // end1
    let e2 = c2.length - 1; // end2

    // 从头比
    while (i <= e1 && i <= e2) {
      // 有一方训话结束了就要终止比较
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        console.log('z走到这里: ');
        break;
      }
      i++;
    }
    // 上一个循环结束就知道开始不同的位置在哪里
    // console.log('i: ', i, e1, e2);

    // 从尾部比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 乱序的情况

    if (i > e1) {
      // 特殊情况 只有新增
      /*
      情况1:  
       let arr1 = ['A', 'B'];
      let arr2 = ['A', 'B', 'C'];  
      ! i = 2  e1 = 1 e2 = 2  
      ! i > e1 && i <= e2
      */
      /*
      情况2:  
       let arr1 = ['A', 'B'];
      let arr2 = ['C','A', 'B'];

     !  i = 0  e1 = -1 e2 = 0 
     !  i > e1 && i <= e2
      */
      // 说明旧的全被复用了
      if (i <= e2) {
        // 说明剩下的都是新增的
        const nextPos = e2 + 1; //
        let anchor = c2[nextPos]?.el;
        console.log('anchor: ', anchor);
        // patch(null,c2[i])
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 特殊情况 只有减少

      /*
      情况1:  
       let arr1 = ['A', 'B','C'];
      let arr2 = ['A', 'B', ];  
      ! i = 2  e1 = 2  e2 = 1 
      !  i>e2 && i<=e1
      */
      /*
      情况1:  
       let arr1 = ['C','A', 'B',];
       let arr2 = ['A', 'B', ];  
      ! i = 0  e1 = 1  e2 = -1
      !  i>e2 && i<=e1
      */

      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    } else {
      /*
      ! 老的中间有一部分剩余的  新的中间也有一部分剩余的
      let arr1 = ['A', 'B','C','D','E','F','G'];
      let arr2 = ['A', 'B','E','C','D','H','F','G' ];  

      i= 2   el=4  e2=5

      */

      console.log('i: ', i, e1, e2);
      let s1 = i;
      let s2 = i;
      // 这里有点类似vue2了
      const keyToNewIndexMap = new Map(); // 做一个映射表，看看老的是在新的里面，没有就删除 有的话就更新

      let toBePatched = e2 - s2 + 1;
      let newIndextoOldMapIndex = new Array(toBePatched).fill(0); // 新的在老的位置的下标索引

      for (let index = s2; index <= e2; index++) {
        const vnode = c2[index];
        keyToNewIndexMap.set(vnode.key, index);
      }
      console.log('keyToNewIndexMap: ', keyToNewIndexMap);
      for (let index = s1; index <= e1; index++) {
        const oldVnode = c1[index];
        const newIndex = keyToNewIndexMap.get(oldVnode.key);

        if (newIndex == undefined) {
          // 新的里面没找到说明不存在了，要删除掉
          unmount(oldVnode);
        } else {
          // 说明找到了
          newIndextoOldMapIndex[newIndex - s2] = index + 1; // 避免index是0的情况， 是0的说明没有经过patch，是一个新节点
          patch(oldVnode, c2[newIndex], el); // 但是顺序不对
        }
      }
      console.log('newIndextoOldMapIndex: ', newIndextoOldMapIndex);
      // [5,3,4,0] ---> 根据最长子序列【2,3】对应的索引下标【1,2】

      const increasingSeq = getSequence(newIndextoOldMapIndex); // 找到不动的元素的下标数组
      console.log('increasingSeq: ', increasingSeq);

      let j = increasingSeq.length - 1;

      // 调整顺序  一定是倒序插入 因为用的insertBefore
      for (let index = toBePatched; index >= 0; index--) {
        let newIndex = s2 + index;
        let anchor = c2[newIndex + 1]?.el;
        const vnode = c2[newIndex];
        if (!vnode.el) {
          patch(null, vnode, el, anchor);
        } else {
          if (index == increasingSeq[j]) {
            j--; // 元素的复用 不需要移动位置
          } else {
            // el存在说明 是老的里面的 把老的移动到某个锚点位置
            hostInsert(vnode.el, el, anchor);
          }
        }
      }
    }

    // else if( i)
  };

  const patchChildren = (n1, n2, el) => {
    /**

    // 孩子可能是文本  数组  空
     1.  老的是数组  新的是文本或者是空  移除老的 插入新的
     2.  老的是数组  新的是数组 进行diff
     3.  老的是文本  新的是数组    移除文本 挂载新节点
     4.  老的是文本  新的是文或者是空   替换内容
     5.  老的是空  新的数组     挂载新节点
     6.  老的是空 新的是文本或者空  替换内容
    */

    let c1 = n1.children;
    let c2 = n2.children;
    let prevShapeFlag = n1.shapeFlag;
    let shapeFlag = n2.shapeFlag;

    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //2.  老的是数组  新的是数组 进行diff
        patchKeyedChildren(c1, c2, el);
      } else {
        // 1. 老的是数组  新的是文本（或者空）   移除老的 插入新的
        unmountChildren(c1);
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          hostSetElementText(el, '');
          mountChildren(c2, el);
        } else {
          // 4.  老的是文本  新的是文或者是空   替换内容
          if (c1 !== c2) {
            hostSetElementText(el, c2);
          }
        }
      } else {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 5.  老的是空  新的数组
          mountChildren(c2, el);
        } else {
          // 6.  老的是空  新的是文或者是空   替换内容
          if (c1 !== c2) {
            hostSetElementText(el, c2);
          }
        }
      }
    }
  };

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
    patchChildren(n1, n2, el);
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 == n2) {
      return;
    }
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null; // 这样就是直接走下面 mountElement 直接初次渲染n2
    }
    processElement(n1, n2, container, anchor);
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
