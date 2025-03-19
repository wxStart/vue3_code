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
  const contnet = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return contnet;
}
function getCursor(context) {
  const { line, column, offest } = context;
  return { line, column, offest };
}
function getSelection(context, start, end) {
  end = end || getCursor(context);
  console.log("end.offset: ", end.offest);
  console.log("start.offest: ", start.offest);
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
  let contnet = parseTextData(context, endIndex);
  return {
    type: 2 /* TEXT */,
    contnet,
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
  console.log("preContent:111111 parseInterpolation ", preContent);
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
function parserChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const c = context.source;
    let node;
    if (c.startsWith("{{")) {
      node = parseInterpolation(context);
      debugger;
    } else if (c[0] == "<") {
    } else {
      node = parseText(context);
      console.log("node: ", node);
    }
    nodes.push(node);
  }
  return nodes;
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
//! 位置1111  (这里拿空格的) 这里拿到 插值语法中 name前面的空格 中第一个也就是 插值"{{"后面的位置  return { line, column, offest };
//! {{    name     }} 把{{ 和name之间的空进行偏移 就知道name的offest了
//# sourceMappingURL=compiler-core.js.map
