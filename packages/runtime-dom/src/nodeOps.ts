// 节点增删改查
export const nodeOps = {
  insert(el: HTMLElement, container: HTMLElement, anchor: HTMLElement | null) {
    container.insertBefore(el, anchor);
  },
  remove(el: HTMLElement) {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },

  createElement(type) {
    return document.createElement(type);
  },

  createText(text) {
    return document.createTextNode(text);
  },
  setText: (node, text) => {
    return (node.nodeValue = text);
  },
  setElementText(el: HTMLElement, text) {
    el.textContent = text;
  },
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
};
