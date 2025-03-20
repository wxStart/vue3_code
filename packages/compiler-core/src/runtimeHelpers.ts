export const TO_DISPLAY_STRING = Symbol('TO_DISPLAY_STRING');
export const CREATE_TEXT_VNODE = Symbol('CREATE_TEXT_VNODE');
export const CREATE_ELEMENT_VNODE = Symbol('CREATE_ELEMENT_VNODE');

export const OPEN_BLOCK = Symbol('OPEN_BLOCK');
export const CREATE_ELEMENT_BLOCK = Symbol('CREATE_ELEMENT_BLOCK');

export const Fragment = Symbol('Fragment');

export const helperMap = {
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_TEXT_VNODE]: 'createTextVnode',
  [CREATE_ELEMENT_VNODE]: 'createElementVnode',
  [OPEN_BLOCK]: 'openBlock',
  [CREATE_ELEMENT_BLOCK]: 'createElementBlock',
  [Fragment]: 'Fragment',
};
