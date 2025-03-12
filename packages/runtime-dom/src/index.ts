export * from '@vue/reactivity';

import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

import { createRenderer } from '@vue/runtime-core';

export const renderOptions = Object.assign(nodeOps, {
  patchProp,
});
// export function createRenderer() {}

export const render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};
export * from '@vue/reactivity';
