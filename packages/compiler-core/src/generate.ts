 // 这个文件的目的就是把 模版转化成 render函数
//  模版转化网站 https://template-explorer.vuejs.org/

import { NodeTypes } from './ast';
import {
  CREATE_ELEMENT_BLOCK,
  CREATE_ELEMENT_VNODE,
  helperMap,
  OPEN_BLOCK,
  TO_DISPLAY_STRING,
} from './runtimeHelpers';

function createCodegenContext(ast) {
  const context = {
    code: ``,
    level: 0,
    helper(name) {
      return `_${helperMap[name]}`;
    },
    push(code) {
      context.code += code;
    },
    indent() {
      newLine(++context.level);
    },
    deIndent(noNewLine = false) {
      if (noNewLine) {
        --context.level;
      } else {
        newLine(--context.level);
      }
    },

    newLine() {
      // 换行
      newLine(context.level);
    },
  };

  // 换行缩进
  function newLine(n) {
    context.push('\n' + `  `.repeat(n));
  }

  return context;
}

function getFunctionPreamble(ast, context) {
  const { push, indent, deIndent, newLine, helper } = context;

  if (ast.helpers.length > 0) {
    push(
      `const { ${ast.helpers.map(
        (item) => `${helperMap[item]}:${helper(item)}`
      )} }  = Vue`
    );
    // 相当于从 Vue
    // const { createElementVnode:_createElementVnode,Fragment:_Fragment,createElementBlock:_createElementBlock,openBlock:_openBlock }  = Vue

    newLine();
    newLine();
  }

  push(`return function render(_ctx){`);
}

function genText(node, context) {
  context.push(JSON.stringify(node.content));
}

function genInterpolation(node, context) {
  const { push, indent, deIndent, newLine, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(')');
  debugger;
}

function genExpression(node, context) {
  context.push(node.content);
}

function genVnodeCall(node, context) {
    debugger
  const { push, indent, deIndent, newLine, helper } = context;
  const { tag, props, children, isBlock } = node;
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(),`);
  }
  const h = isBlock ? CREATE_ELEMENT_BLOCK : CREATE_ELEMENT_VNODE;
  console.log('helper[h]: ', helper[h]);

  push(`${helper(h)}(`);

  //! 这里根据 tag, props, children, 再去生成内容 拼接等  就不写了 源码里面有很多生成 都没有写
  push(`)`);
  if (isBlock) {
    push(`)`);
  }
}
function genNode(node, context) {
  const { push, indent, deIndent, newLine } = context;
  debugger;
  switch (node.type) {
    case NodeTypes.TEXT:
      // let template = `123`;
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.VNODE_CALL:
      genVnodeCall(node, context);
      break;
  }
}
export function generate(ast) {
  debugger;
  const context = createCodegenContext(ast);

  getFunctionPreamble(ast, context);

  const { push, indent, deIndent, newLine, helper } = context;

  indent();
  push(`return `);
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context);
  } else {
    //       let template = ``;
    push(`null`);
  }
  deIndent();
  push(`}`);
  console.log('context.code: ');
  console.log(context.code);

  return context.code;
}
