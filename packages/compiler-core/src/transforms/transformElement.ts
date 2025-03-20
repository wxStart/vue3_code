import { createObjectExpression, createVnodeCall, NodeTypes } from '../ast';

export function transformElement(node, context) {
  // 处理元素
  if (node.type === NodeTypes.ELEMENT) {
    console.log('元素', node);
    return function () {
      // 因为元素有可能需要文本处理结束后还需要处理东西
      // 做个延时处理
      console.log('元素 延迟函数： 文本处理后', node);

      const { tag: vnodeTag, props, children } = node;
      // 处理属性
      let properties = [];
      for (let i = 0; i < props.length; i++) {
        properties.push({
          key: props[i].name,
          value: props[i].value.content,
        });
      }
      const propsExpression = properties.length
        ? createObjectExpression(properties)
        : null;

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
