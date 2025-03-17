import { reactive, proxyRefs } from '@vue/reactivity';
import { hasOwn, isFunction, ShapeFlags } from '@vue/shared';

// 创建组件实例
export function createComponentInstance(vnode) {
  const instance = {
    data: null, // 组件的状态
    vnode, // 组件的虚拟节点
    subTree: null, // 子树
    isMounted: false, // 是否挂载完成
    update: null, // 组件的更新函数
    props: {},
    attrs: {},
    slots: {}, // 插槽
    propsOptions: vnode.type.props, // 组件中接受的pops
    proxy: null, // 代理原来的属性 方便用户取值
    exposed: null,
  };
  return instance;
}

const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};

  const { propsOptions = {} } = instance; // 组件实例里面定义接受的props
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key];
      if (propsOptions[key]) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.props = reactive(props);
  instance.attrs = attrs;
};

const publicProperty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots,
};

const handle = {
  get(target, key) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }
    // 对于一些无法修改的属性  $sloots  $attr
    const getters = publicProperty[key];
    if (getters) {
      return getters(target);
    }
  },
  set(target, key, value) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      // props
      console.warn('props 属性是只读的，不可进行修改');
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  },
};

const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  }
};
// 给实例赋值
export function setupComponent(instance) {
  const { vnode } = instance;
  initProps(instance, vnode.props); // vnode.props 是组件的props  { pA: 'paaa', pB: 'pb' }

  initSlots(instance, vnode.children);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handle);
  const { data, render, setup } = vnode.type;

  if (setup) {
    const setupContext = {
      // .. 四个参数
      slots: instance.slots,
      attrs: instance.attrs,
      expose(value) {
        instance.exposed = value;
      },
      emit(event: string, ...payload) {
        const eventName = `on${event[0].toLocaleUpperCase() + event.slice(1)}`;
        const handler = instance.vnode.props[eventName];
        if (handler) {
          handler(...payload);
        }
      },
    };
    const setupResult = setup(instance.props, setupContext);
    debugger;
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else {
      instance.setupState = proxyRefs(setupResult); // render 函数里面方位setup里面的ref值时候不需要访问.vlaue
    }
  }

  if (isFunction(data)) {
    instance.data = reactive(data.call(instance.proxy)); // data函数里面就可以访问 props
  } else {
    console.warn(' data options 必须是一个函数 ');
  }
  if (!instance.render) {
    instance.render = render;
  }
}
