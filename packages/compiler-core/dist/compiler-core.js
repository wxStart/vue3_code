// packages/compiler-core/src/runtimeHelpers.ts
var TO_DISPLAY_STRING = Symbol("TO_DISPLAY_STRING");
var CREATE_TEXT_VNODE = Symbol("CREATE_TEXT_VNODE");
var CREATE_ELEMENT_VNODE = Symbol("CREATE_ELEMENT_VNODE");
var OPEN_BLOCK = Symbol("OPEN_BLOCK");
var CREATE_ELEMENT_BLOCK = Symbol("CREATE_ELEMENT_BLOCK");
var Fragment = Symbol("Fragment");
var helperMap = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_TEXT_VNODE]: "createTextVnode",
  [CREATE_ELEMENT_VNODE]: "createElementVnode",
  [OPEN_BLOCK]: "openBlock",
  [CREATE_ELEMENT_BLOCK]: "createElementBlock",
  [Fragment]: "Fragment"
};

// packages/compiler-core/src/ast.ts
function createCallExpression(context, arg) {
  const name = context.helper(CREATE_TEXT_VNODE);
  return {
    type: 14 /* JS_CALL_EXPRESSION */,
    // create
    arguments: arg,
    callee: name
  };
}
function createVnodeCall(context, tag, prosp, children) {
  let name = tag;
  if (tag !== Fragment) {
    name = context.helper(CREATE_ELEMENT_VNODE);
  }
  return {
    type: 13 /* VNODE_CALL */,
    tag,
    prosp,
    children,
    callee: name
  };
}
function createObjectExpression(properies) {
  return {
    type: 15 /* JS_OBJECT_EXPRESSION */,
    properies
  };
}

// packages/compiler-core/src/generate.ts
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
      newLine(context.level);
    }
  };
  function newLine(n) {
    context.push("\n" + `  `.repeat(n));
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
  push(")");
  debugger;
}
function genExpression(node, context) {
  context.push(node.content);
}
function genVnodeCall(node, context) {
  debugger;
  const { push, indent, deIndent, newLine, helper } = context;
  const { tag, props, children, isBlock } = node;
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(),`);
  }
  const h = isBlock ? CREATE_ELEMENT_BLOCK : CREATE_ELEMENT_VNODE;
  console.log("helper[h]: ", helper[h]);
  push(`${helper(h)}(`);
  push(`)`);
  if (isBlock) {
    push(`)`);
  }
}
function genNode(node, context) {
  const { push, indent, deIndent, newLine } = context;
  debugger;
  switch (node.type) {
    case 2 /* TEXT */:
      genText(node, context);
      break;
    case 5 /* INTERPOLATION */:
      genInterpolation(node, context);
      break;
    case 4 /* SIMPLE_EXPRESSION */:
      genExpression(node, context);
      break;
    case 13 /* VNODE_CALL */:
      genVnodeCall(node, context);
      break;
  }
}
function generate(ast) {
  debugger;
  const context = createCodegenContext(ast);
  getFunctionPreamble(ast, context);
  const { push, indent, deIndent, newLine, helper } = context;
  indent();
  push(`return `);
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context);
  } else {
    push(`null`);
  }
  deIndent();
  push(`}`);
  console.log("context.code: ");
  console.log(context.code);
  return context.code;
}

// packages/compiler-core/src/parser.ts
function createParserContext(content) {
  return {
    originalSource: content,
    source: content,
    // 操作的是这个字符串ƒ 不断解析
    line: 1,
    column: 1,
    offest: 0
  };
}
function isEnd(context) {
  const c = context.source;
  if (c.startsWith("</")) {
    return true;
  }
  return !context.source;
}
function advancePositionWithMutation(context, source, endIndex) {
  let linesCount = 0;
  let linePos = -1;
  for (let i = 0; i < endIndex; i++) {
    if (source.charCodeAt(i) == 10) {
      linesCount++;
      linePos = i;
      console.log("linePost: ", linePos);
    }
  }
  context.line += linesCount;
  context.offest += endIndex;
  context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos;
}
function advanceBy(context, endIndex) {
  let source = context.source;
  advancePositionWithMutation(context, source, endIndex);
  context.source = source.slice(endIndex);
}
function parseTextData(context, endIndex) {
  const content = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return content;
}
function getCursor(context) {
  const { line, column, offest } = context;
  return { line, column, offest };
}
function getSelection(context, start, end) {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offest, end.offest)
  };
}
function parseText(context) {
  let tonkens = ["<", "{{"];
  let endIndex = context.source.length;
  for (let i = 0; i < tonkens.length; i++) {
    const index = context.source.indexOf(tonkens[i]);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }
  let start = getCursor(context);
  let content = parseTextData(context, endIndex);
  return {
    type: 2 /* TEXT */,
    content,
    loc: getSelection(context, start)
  };
}
function parseInterpolation(context) {
  let start = getCursor(context);
  const colseIndex = context.source.indexOf("}}", "{{".length);
  advanceBy(context, 2);
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  const rawContentLength = colseIndex - 2;
  const preContent = parseTextData(context, rawContentLength);
  const content = preContent.trim();
  const startOffect = preContent.indexOf(content);
  if (startOffect > 0) {
    advancePositionWithMutation(innerStart, preContent, startOffect);
  }
  let endOffset = startOffect + content.length;
  advancePositionWithMutation(innerEnd, preContent, endOffset);
  advanceBy(context, 2);
  return {
    type: 5 /* INTERPOLATION */,
    content: {
      type: 4 /* SIMPLE_EXPRESSION */,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  };
}
function advanceBySpaces(context) {
  const match = /^[ \t\r\n\f]*/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}
function parseAttributeValue(context) {
  let quote = context.source[0];
  const isQuoted = quote === "'" || quote === '"';
  let content;
  if (isQuoted) {
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote, 1);
    content = parseTextData(context, endIndex);
    advanceBy(context, 1);
    advanceBySpaces(context);
  } else {
    console.log(
      "context.source.match(/([^ 	\r\n/>])+/): ",
      context.source.match(/([^ \t\r\n/>])+/)
    );
    content = context.source.match(/([^ \t\r\n/>])+/)[0];
    advanceBy(context, content.length);
    advanceBySpaces(context);
  }
  return content;
}
function parseAttribute(context) {
  const start = getCursor(context);
  let match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  console.log("parseAttribute match: ", match);
  const name = match[0];
  advanceBy(context, name.length);
  let vlaue;
  if (/^[ \t\r\n\f]*=/.test(context.source)) {
    advanceBySpaces(context);
    advanceBy(context, 1);
    advanceBySpaces(context);
    vlaue = parseAttributeValue(context);
  }
  const loc = getSelection(context, start);
  return {
    type: 6 /* ATTRIBUTE */,
    name,
    value: {
      type: 2 /* TEXT */,
      content: vlaue,
      loc
    },
    loc: getSelection(context, start)
  };
}
function parseAttributes(context) {
  const props = [];
  while (context.source.length > 0 && !context.source.startsWith(">")) {
    props.push(parseAttribute(context));
    advanceBySpaces(context);
  }
  return props;
}
function parseTag(context) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
  console.log("match: ", match);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBySpaces(context);
  let props = parseAttributes(context);
  console.log("props: ", props);
  let isSelfClosing = context.source.startsWith("/>");
  if (isSelfClosing) {
  }
  advanceBy(context, isSelfClosing ? 2 : 1);
  return {
    type: 1 /* ELEMENT */,
    tag,
    isSelfClosing,
    children: [],
    props,
    loc: getSelection(context, start)
  };
}
function parseElement(context) {
  let ele = parseTag(context);
  let children = parserChildren(context);
  ele.children = children;
  if (context.source.startsWith("</")) {
    parseTag(context);
  }
  ele.loc = getSelection(context, ele.loc.start);
  return ele;
}
function parserChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const c = context.source;
    let node;
    if (c.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (c[0] == "<") {
      node = parseElement(context);
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }
  console.log("nodes: 111", nodes);
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.type == 2 /* TEXT */) {
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        nodes[index] = null;
      } else {
        node.content = node.content.replace(/[\t\r\n\f ]+/g, " ");
      }
    }
  }
  return nodes.filter(Boolean);
}
function createRoot(children, loc) {
  return {
    type: 0 /* ROOT */,
    children,
    loc
  };
}
function parse(template) {
  const context = createParserContext(template);
  const start = getCursor(context);
  const children = parserChildren(context);
  return createRoot(children, getSelection(context, start));
}

// packages/compiler-core/src/transforms/transformElement.ts
function transformElement(node, context) {
  if (node.type === 1 /* ELEMENT */) {
    console.log("\u5143\u7D20", node);
    return function() {
      console.log("\u5143\u7D20 \u5EF6\u8FDF\u51FD\u6570\uFF1A \u6587\u672C\u5904\u7406\u540E", node);
      const { tag: vnodeTag, props, children } = node;
      let properties = [];
      for (let i = 0; i < props.length; i++) {
        properties.push({
          key: props[i].name,
          value: props[i].value.content
        });
      }
      const propsExpression = properties.length ? createObjectExpression(properties) : null;
      let vnodeChildren = null;
      if (children.length === 1) {
        vnodeChildren = children[0];
      } else if (children.length > 1) {
        vnodeChildren = children;
      }
      node.codegenNode = createVnodeCall(
        context,
        vnodeTag,
        propsExpression,
        vnodeChildren
      );
      debugger;
    };
  }
}

// packages/compiler-core/src/transforms/transformExprrssion.ts
function transformExprrssion(node, context) {
  if (node.type === 5 /* INTERPOLATION */) {
    debugger;
    let content = node.content.content;
    node.content.content = `_ctx.${content}`;
  }
}

// packages/compiler-core/src/transforms/transformText.ts
function isText(node) {
  return node.type === 5 /* INTERPOLATION */ || node.type === 2 /* TEXT */;
}
function transformText(node, context) {
  if (node.type === 1 /* ELEMENT */ || node.type == 0 /* ROOT */) {
    console.log("\u5143\u7D20 \u4E2D\u7684\u6587\u672C", node);
    return function() {
      let container = null;
      let children = node.children;
      let hasText = false;
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (isText(child)) {
          hasText = true;
          for (let j = i + 1; j < children.length; j++) {
            if (isText(child)) {
              let next = children[j];
              if (isText(next)) {
                if (!container) {
                  container = children[i] = {
                    type: 8 /* COMPOUND_EXPRESSION */,
                    children: [child]
                  };
                }
                container.children.push("+", next);
                children.splice(j, 1);
                j--;
              } else {
                container = null;
                break;
              }
            }
          }
        }
      }
      if (!hasText || children.length == 1) {
        return;
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child) || child.type == 8 /* COMPOUND_EXPRESSION */) {
          const args = [];
          args.push(child);
          if (child.type !== 2 /* TEXT */) {
            args.push(1 /* TEXT */);
          }
          children[i] = {
            type: 12 /* TEXT_CALL */,
            // 标记说明需要 使用 createTextVnode
            content: child,
            codegenNode: createCallExpression(context, args)
            // createTextVnode(内容，args)
          };
        }
      }
      console.log("\u6587\u672C \u5EF6\u8FDF\u51FD\u6570\uFF1A \u6587\u672C\u5904\u7406\u540E", node);
    };
  }
}

// packages/compiler-core/src/transform.ts
function createTransformContext(root) {
  const context = {
    currentNode: root,
    parent: null,
    transformNode: [transformElement, transformText, transformExprrssion],
    helpers: /* @__PURE__ */ new Map(),
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
    }
  };
  return context;
}
function traverseNode(node, context) {
  context.currentNode = node;
  const transforms = context.transformNode;
  const exits = [];
  for (let i2 = 0; i2 < transforms.length; i2++) {
    let exit = transforms[i2](node, context);
    exit && exits.push(exit);
  }
  switch (node.type) {
    case 0 /* ROOT */:
    case 1 /* ELEMENT */:
      for (let i2 = 0; i2 < node.children.length; i2++) {
        context.parent = node;
        traverseNode(node.children[i2], context);
      }
      break;
    case 5 /* INTERPOLATION */:
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
    if (child.type == 1 /* ELEMENT */) {
      ast.codegenNode = child.codegenNode;
      context.removeHelper(CREATE_ELEMENT_VNODE);
      context.helper(CREATE_ELEMENT_BLOCK);
      context.helper(OPEN_BLOCK);
      ast.codegenNode.isBlock = true;
    } else {
      ast.codegenNode = child;
    }
  } else if (children.length > 0) {
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
function transform(ast) {
  const context = createTransformContext(ast);
  traverseNode(ast, context);
  createRootCodegenNode(ast, context);
  ast.helpers = [...context.helpers.keys()];
}

// packages/compiler-core/src/index.ts
function compile(template) {
  const ast = parse(template);
  transform(ast);
  const code = generate(ast);
  return code;
}
export {
  compile,
  parse
};
//! 这里根据 tag, props, children, 再去生成内容 拼接等  就不写了 源码里面有很多生成 都没有写
//! 位置1111  (这里拿空格的) 这里拿到 插值语法中 name前面的空格 中第一个也就是 插值"{{"后面的位置  return { line, column, offest };
//! {{    name     }} 把{{ 和name之间的空进行偏移 就知道name的offest了
//# sourceMappingURL=compiler-core.js.map
