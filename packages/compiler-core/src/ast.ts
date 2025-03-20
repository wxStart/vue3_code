import {
  CREATE_ELEMENT_VNODE,
  CREATE_TEXT_VNODE,
  Fragment,
} from './runtimeHelpers';

export enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION, // 简单表达式 1+1
  INTERPOLATION, // {{ name }}
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION, // {{name}} + 'abc
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT,
}

export function createCallExpression(context, arg) {
  const name = context.helper(CREATE_TEXT_VNODE);

  return {
    type: NodeTypes.JS_CALL_EXPRESSION, // create
    arguments: arg,
    callee: name,
  };
}

export function createVnodeCall(context, tag, prosp, children) {
  // createElementVnode()
  let name = tag;
  if (tag !== Fragment) {
    name = context.helper(CREATE_ELEMENT_VNODE);
  }
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    prosp,
    children,
    callee: name,
  };
}

export function createObjectExpression(properies) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properies,
  };
}
