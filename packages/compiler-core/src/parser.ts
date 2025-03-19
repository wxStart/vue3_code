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
  console.log('end.offset: ', end.offest);
  console.log('start.offest: ', start.offest);

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

  const colseIndex = context.source.indexOf('}}','{{'.length); // 从‘{{” 字符位置开始查找
  

  advanceBy(context, 2); // 删除 {{

  //! 位置1111  (这里拿空格的) 这里拿到 插值语法中 name前面的空格 中第一个也就是 插值"{{"后面的位置  return { line, column, offest };
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  // 拿到原始的内容
  const rawContentLength = colseIndex - 2; // 已经移除了 {{  所以减去2

  const preContent = parseTextData(context, rawContentLength); // 可以拿到文本内容 并且可以更新位置信息
  console.log('preContent:111111 parseInterpolation ', preContent);

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
    content:{
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start),
  };
}

function parserChildren(context) {
  const nodes = [];

  while (!isEnd(context)) {
    const c = context.source;
    let node;
    if (c.startsWith('{{')) {
      // {{  xxx }}
      node = parseInterpolation(context);
      debugger
    } else if (c[0] == '<') {
      // 元素  </div>
    } else {
      // 文本   abd {{name}} 或者是 abd  <div></div>
      node = parseText(context);
      console.log('node: ', node);
    }
    nodes.push(node);
  }
  return nodes
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
