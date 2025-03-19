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

// 截取位置
function advanceBy(context, n) {
  // 删除  context.source 前n个字符
  context.source = context.source.slice(n);
}

function parseTextData(context, endIndex) {
  const contnet = context.source.slice(0, endIndex);

  advanceBy(context, endIndex);

  return contnet;
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
  // 0 ~ endIndex  为文本内容
  let contnet = parseTextData(context, endIndex);
  console.log('contnet: ', contnet);
  return {
    type: NodeTypes.TEXT,
    contnet
  }
}

function parserChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const c = context.source;
    let node;
    if (c.startsWith('{{')) {
      // {{  xxx }}
    } else if (c[0] == '<') {
      // 元素  </div>
    } else {
      // 文本   abd {{name}} 或者是 abd  <div></div>
      node = parseText(context);
      debugger
    }
    nodes.push(node);
  }
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
