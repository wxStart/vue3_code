import { PatchFlags } from '@vue/shared';
import { createCallExpression, NodeTypes } from '../ast';

export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
}

export function transformText(node, context) {
  // 处理文本
  if (node.type === NodeTypes.ELEMENT || node.type == NodeTypes.ROOT) {
    console.log('元素 中的文本', node);

    return function () {
      // 需要等  transformExprrssion 函数处理完毕才处理 所以放在了 return函数里面
      // 遇到多个连续的子节点 需要处理完成后 这时候才会去处理父节点 重新改变他的children

      // <div>{{abc}}  1234</div>
      // {{abc}} 1234    他们是两个节点需要合成一个  需要转化为   CNodeTypes.OMPOUND_EXPRESSION

      let container = null;
      let children = node.children;
      let hasText = false;
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (isText(child)) {
          hasText = true;
          // 看一下下一个孩子
          for (let j = i + 1; j < children.length; j++) {
            if (isText(child)) {
              let next = children[j];
              if (isText(next)) {
                if (!container) {
                  container = children[i] = {
                    type: NodeTypes.COMPOUND_EXPRESSION,
                    children: [child],
                  };
                }
                container.children.push('+', next); // 删除拼接的节点
                children.splice(j, 1);
                j--;
              } else {
                container = null;
                break;
              }
            }
          }
        }
      }

      // 如果文本 要看文本节点是不是只有一个  只有一个 不需要进行 createTextVnode

      if (!hasText || children.length == 1) {
        return;
      }

      for (let i =0; i < children.length; i++) {
        const child = children[i];
        if (isText(child) || child.type == NodeTypes.COMPOUND_EXPRESSION) {
          const args = [];
          args.push(child);
          if (child.type !== NodeTypes.TEXT) {
            // 说明是动态元素 插值语法的
            args.push(PatchFlags.TEXT);
          }
          children[i] = {
            type: NodeTypes.TEXT_CALL, // 标记说明需要 使用 createTextVnode
            content: child,
            codegenNode: createCallExpression(context, args), // createTextVnode(内容，args)
          };
        }
      }
      //
      //

      console.log('文本 延迟函数： 文本处理后', node);
    };
  }
}
