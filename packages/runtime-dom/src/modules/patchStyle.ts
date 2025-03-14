export function patchStyle(el: HTMLElement, prevValue, nextValue = {}) {
    let style = el.style;
  
    for (let key in nextValue) {
      style[key] = nextValue[key];
    }
    if (prevValue) {
      for (let key in prevValue) {
        if (nextValue && !nextValue[key]) {
          style[key] = null;
        }
      }
    }
  }