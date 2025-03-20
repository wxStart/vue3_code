import { createVnodeCall, NodeTypes } from './ast';
import {
  CREATE_ELEMENT_BLOCK,
  CREATE_ELEMENT_VNODE,
  OPEN_BLOCK,
  TO_DISPLAY_STRING,
  Fragment,
} from './runtimeHelpers';
import { transformElement } from './transforms/transformElement';
import { transformExprrssion } from './transforms/transformExprrssion';
import { transformText } from './transforms/transformText';

function createTransformContext(root) {
  const context = {
    currentNode: root,
    parent: null,
    transformNode: [transformElement, transformText, transformExprrssion],
    helpers: new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },

    removeHelper(name) {
      const count = context.helpers.get(name);
      if (count) {
        let c = count - 1;
        if (!c) {
          context.helpers.delete(name);
        } else {
          context.helpers.set(name, c);
        }
      }
    },
  };

  return context;
}

function traverseNode(node, context) {
  context.currentNode = node;
  const transforms = context.transformNode;

  const exits = []; // 【元素的延迟函数， 文本的延迟函数  表达式的延迟函数】

  for (let i = 0; i < transforms.length; i++) {
    let exit = transforms[i](node, context); // 对每一个节点尝试 三种处理方法
    exit && exits.push(exit);
  }

  switch (node.type) {
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      // 有儿子需要处理
      for (let i = 0; i < node.children.length; i++) {
        context.parent = node;
        traverseNode(node.children[i], context);
      }
      break;
    case NodeTypes.INTERPOLATION:
      // 对表达式的处理
      context.helper(TO_DISPLAY_STRING);
      break;
  }

  let i = exits.length;
  if (i) {
    while (i--) {
      exits[i]();
    }
  }
}

function createRootCodegenNode(ast, context) {
  let { children } = ast;
  if (children.length == 1) {
    let child = children[0];
    if (child.type == NodeTypes.ELEMENT) {
      /*
            let template = `<div a = 123    b='a' c = "123" >
        {{a123}}    asd {{name}}    asd
    </div>`;

      */
      ast.codegenNode = child.codegenNode;
      context.removeHelper(CREATE_ELEMENT_VNODE);
      context.helper(CREATE_ELEMENT_BLOCK);
      context.helper(OPEN_BLOCK);
      ast.codegenNode.isBlock = true;
    } else {
      /*
            let template = `DSADSAD`;

      */
      ast.codegenNode = child;
    }
  } else if (children.length > 0) {
    /*
            let template = `<div a='1'></div> <div b='2'></div>`;
    */
    // 产生一个 Fragment
    ast.codegenNode = createVnodeCall(
      context,
      context.helper(Fragment),
      null,
      children
    );
    context.helper(CREATE_ELEMENT_BLOCK);
    context.helper(OPEN_BLOCK);
    ast.codegenNode.isBlock = true;
  }
}

export function transform(ast) {
  const context = createTransformContext(ast);
  traverseNode(ast, context);
  /*
  对根节点的处理 ： 
  1.文苯  ：文本诶荣
  2. 一个元素：<div></div>  createElementVnode ---变为--->createElementBlock
  3. 多个元素 :  <div></div><div></div>    createElementBlock(Fragment)
*/

  createRootCodegenNode(ast, context);

  ast.helpers = [...context.helpers.keys()];
}
