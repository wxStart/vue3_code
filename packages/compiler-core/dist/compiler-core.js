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
  return !context.source;
}
function advanceBy(context, n) {
  context.source = context.source.slice(n);
}
function parseTextData(context, endIndex) {
  const contnet = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return contnet;
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
  let contnet = parseTextData(context, endIndex);
  console.log("contnet: ", contnet);
  return {
    type: 2 /* TEXT */,
    contnet
  };
}
function parserChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const c = context.source;
    let node;
    if (c.startsWith("{{")) {
    } else if (c[0] == "<") {
    } else {
      node = parseText(context);
      debugger;
    }
    nodes.push(node);
  }
}
function createRoot(children) {
  return {
    type: 0 /* ROOT */,
    children
  };
}
function parse(template) {
  const context = createParserContext(template);
  const children = parserChildren(context);
  return createRoot(children);
}

// packages/compiler-core/src/index.ts
function compile(template) {
  const ast = parse(template);
}
export {
  compile,
  parse
};
//# sourceMappingURL=compiler-core.js.map
