import { NodeTypes } from "../ast";

export function transformExprrssion(node, context) {
  // 处理表达式
  if (node.type === NodeTypes.INTERPOLATION) {
    debugger;
    let content = node.content.content;
    node.content.content = `_ctx.${content}`;
  }
}
