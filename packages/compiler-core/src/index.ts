// 编译主要分为三步：
// 1. 需要将模版转化为ast语法树
// 2. 转化生成codegennode
// 3. 转化成render函数

import { parse } from './parser';

export { parse };
export function compile(template) {
  const ast = parse(template);
}
