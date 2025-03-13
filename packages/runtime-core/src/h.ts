import { isObject, } from '@vue/shared';
import { createVnode, isVnode } from './createVnode';


// 两个参数
//    第二参数对象类型的
//       可能是属性  h('h1',{})
//       可能是虚拟节点  h('h1',h('h2',{}))
//    第二参数数组类型的  直接是children   h('h1',[h('h2',{})])
//    第二参数非对象说明传的事文本  直接是children   h('h1','哈哈是')
// 三个参数 及以上
//    第二个参数一定是属性
//h('h1',{})
export function h(type, propsOrChildren?, children?) {
  let len = arguments.length;

  if (len == 2) {
    if (isObject(propsOrChildren)) {
      if (Array.isArray(propsOrChildren)) {
        return createVnode(type, null, propsOrChildren);
      }
      if (isVnode(propsOrChildren)) {
        // 是虚拟节点
        return createVnode(type, null, [propsOrChildren]);
      } else {
        // 属性
        return createVnode(type, propsOrChildren);
      }
    } else {
      // 是文本
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (len > 3) {
      children = Array.from(arguments).slice(2);
    }
    if(len ==3 && isVnode(children)){
        children =[children]
    }
    console.log('children: ', children);

    return createVnode(type, propsOrChildren, children);
  }
}


