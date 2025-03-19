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
    debugger;
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
  debugger;
  if (/^[ \t\r\n\f]*=/.test(context.source)) {
    advanceBySpaces(context);
    advanceBy(context, 1);
    advanceBySpaces(context);
    vlaue = parseAttributeValue(context);
  }
  debugger;
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
      debugger;
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
