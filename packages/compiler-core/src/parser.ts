import { NodeTypes } from './ast';

function createParserContext(content) {
  return {
    originalSource: content,
    source: content, // 操作的是这个字符串ƒ 不断解析
    line: 1,
    column: 1,
    offest: 0,
  };
}

function isEnd(context) {
  const c = context.source;
  if (c.startsWith('</')) {
    // 孩子遇到这种的时候也是结束的 <div><span></span></div>
    // 此要返回 sapn 处理完成了  source =  </div> 但是也是要返回的
    /**
     if (context.source.startsWith('</')) {
         parseTag(context); 
     } 
     */
    return true;
  }
  return !context.source; // 内容没有
}

function advancePositionWithMutation(context, source, endIndex) {
  let linesCount = 0;
  let linePos = -1;
  for (let i = 0; i < endIndex; i++) {
    if (source.charCodeAt(i) == 10) {
      // 10 是换行符
      linesCount++;
      linePos = i; // 换行的位置
      console.log('linePost: ', linePos);
    }
  }
  context.line += linesCount; // 确定行数
  context.offest += endIndex;
  context.column =
    linePos == -1 ? context.column + endIndex : endIndex - linePos;
}
// 截取位置
function advanceBy(context, endIndex) {
  let source = context.source;
  // 修改最新的偏移量量信息
  advancePositionWithMutation(context, source, endIndex);
  // 删除  context.source 前endIndex个字符
  context.source = source.slice(endIndex);
}

function parseTextData(context, endIndex) {
  const contnet = context.source.slice(0, endIndex);
  advanceBy(context, endIndex); // 删掉的位置
  return contnet;
}

function getCursor(context) {
  const { line, column, offest } = context;

  return { line, column, offest };
}
function getSelection(context, start, end?) {
  end = end || getCursor(context);

  return {
    start,
    end,
    source: context.originalSource.slice(start.offest, end.offest),
  };
}
function parseText(context) {
  let tonkens = ['<', '{{']; // 找到他两种离得最近的一个
  let endIndex = context.source.length;
  for (let i = 0; i < tonkens.length; i++) {
    const index = context.source.indexOf(tonkens[i]);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }
  // 创建信息 行列
  let start = getCursor(context);
  // 0 ~ endIndex  为文本内容
  let contnet = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    contnet,
    loc: getSelection(context, start),
  };
}

function parseInterpolation(context) {
  let start = getCursor(context); // 获取开始的位置

  const colseIndex = context.source.indexOf('}}', '{{'.length); // 从‘{{” 字符位置开始查找

  advanceBy(context, 2); // 删除 {{

  //! 位置1111  (这里拿空格的) 这里拿到 插值语法中 name前面的空格 中第一个也就是 插值"{{"后面的位置  return { line, column, offest };
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  // 拿到原始的内容
  const rawContentLength = colseIndex - 2; // 已经移除了 {{  所以减去2

  const preContent = parseTextData(context, rawContentLength); // 可以拿到文本内容 并且可以更新位置信息

  const content = preContent.trim();

  const startOffect = preContent.indexOf(content);

  if (startOffect > 0) {
    // 说明前面有空格  更新 innerStart 的信息  //! 更新 位置1111 innerStart = { line, column, offest }的信息
    advancePositionWithMutation(innerStart, preContent, startOffect); //! {{    name     }} 把{{ 和name之间的空进行偏移 就知道name的offest了
  }
  let endOffset = startOffect + content.length;
  //   更新 innerEnd 的信息  //! 更新 位置1111  innerEnd = { line, column, offest }的信息
  advancePositionWithMutation(innerEnd, preContent, endOffset);
  advanceBy(context, 2); // 删除 }}
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start),
  };
}

// 删除空格
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
    advanceBy(context, 1); // 去除第一个引号
    const endIndex = context.source.indexOf(quote, 1);
    content = parseTextData(context, endIndex);
    advanceBy(context, 1); // 去除值后面的引号
    advanceBySpaces(context);
  } else {
    console.log(
      'context.source.match(/([^ \t\r\n/>])+/): ',
      context.source.match(/([^ \t\r\n/>])+/)
    );debugger
    content = context.source.match(/([^ \t\r\n/>])+/)[0];
    advanceBy(context, content.length); // 去除值
    advanceBySpaces(context);
  }

  return content;
}
function parseAttribute(context) {
  const start = getCursor(context);
  let match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  console.log('parseAttribute match: ', match);
  const name = match[0]; // 属性名
  advanceBy(context, name.length);
  let vlaue;
  debugger
  if (/^[ \t\r\n\f]*=/.test(context.source)) {
    advanceBySpaces(context);
    advanceBy(context, 1); // 删=
    advanceBySpaces(context);
    vlaue = parseAttributeValue(context);
  }
  debugger

  const loc = getSelection(context, start); // 处理完属性 计算属性的位置信息
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: {
      type: NodeTypes.TEXT,
      content: vlaue,
      loc: loc,
    },
    loc: getSelection(context, start),
  };
}

function parseAttributes(context) {
  const props = [];

  while (context.source.length > 0 && !context.source.startsWith('>')) {
    props.push(parseAttribute(context));
    advanceBySpaces(context); // 去空格
  }

  return props;
}

function parseTag(context) {
  const start = getCursor(context);
  // https://regexper.com/
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
  console.log('match: ', match);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBySpaces(context);

  // 这里有可能有属性 <div  a="1" b='2' ></div>

  let props = parseAttributes(context);
  console.log('props: ', props);

  let isSelfClosing = context.source.startsWith('/>');
  if (isSelfClosing) {
  }
  advanceBy(context, isSelfClosing ? 2 : 1); // 看是删除 "/>"" 还是 ">"

  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    children: [],
    props,
    loc: getSelection(context, start),
  };
}

function parseElement(context) {
  // 解析标签 <br /> <div a="12" ></div>
  let ele = parseTag(context);

  // 这里是元素里面的孩子
  let children = parserChildren(context); // 处理儿子
  ele.children = children;

  if (context.source.startsWith('</')) {
    parseTag(context); // <div></div> 移除后续的</div>
  }
  ele.loc = getSelection(context, ele.loc.start); // 重新计算位置信息

  return ele;
}

function parserChildren(context) {
  const nodes = [];

  while (!isEnd(context)) {
    const c = context.source;
    let node;
    if (c.startsWith('{{')) {
      // {{  xxx }}
      node = parseInterpolation(context);
    } else if (c[0] == '<') {
      // 元素  </div>
      node = parseElement(context);
    } else {
      // 文本   abd {{name}} 或者是 abd  <div></div>
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}

export function parse(template) {
  // 根据template 产生一棵树  line  column  offest

  const context = createParserContext(template);
  const children = parserChildren(context);
  return createRoot(children);
}
