// 编译主要分为三步：
// 1. 需要将模版转化为ast语法树
// 2. 转化生成codegennode
// 3. 转化成render函数

import { generate } from './generate';
import { parse } from './parser';
import { transform } from './transform';

export { parse };

export function compile(template) {
  const ast = parse(template);

  //  这里转化要进行收集所需要的方法  createElementVnode
  transform(ast);

  const code = generate(ast);
  return code;
}
