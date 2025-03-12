function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  invoker.value = value;
  return invoker;
}

export function patchEvent(el: HTMLElement, name, nextValue) {
  //@ts-ignore
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();

  const existingInvokers = invokers[name]; // 前一个事件invoker
  // 如果前一个事件存在  直接改变事件的invoker 的value
  if (existingInvokers && nextValue) {
    return (existingInvokers.value = nextValue);
  }

  if (nextValue) {
    // 如果前一个事件的invoker 不存在  绑定事件
    const invoker = (invokers[name] = createInvoker(nextValue));
    return el.addEventListener(eventName, invoker);
  }
  if (existingInvokers) {
    // 如果前一个事件的invoker存在  并且新的不存在就解绑事件
    return el.removeEventListener(eventName, existingInvokers);
  }
}
