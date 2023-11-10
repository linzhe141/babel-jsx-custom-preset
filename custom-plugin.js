module.exports = function ({ types: t }) {
  return {
    visitor: {
      // 处理 JSXElement
      JSXElement(path) {
        // 得到当前 JSX的节点结构
        const node = path.node;
        const { openingElement } = node;
        // 获取这个JSX标签的名字
        const tagName = openingElement.name.name;
        const propsList = openingElement.attributes.reduce((result, item) => {
          result.push(
            t.objectProperty(
              t.identifier(item.name.name),
              t.stringLiteral(item.value.value)
            )
          );
          return result;
        }, []);
        const creaateIdentifier = t.identifier("Dom");
        // 生成Dom('div', {class:'xxx'}, '123')
        const args = [t.stringLiteral(tagName), t.objectExpression(propsList)];
        const callRCExpression = t.callExpression(creaateIdentifier, args);
        callRCExpression.arguments = callRCExpression.arguments.concat(
          path.node.children
        );
        path.replaceWith(callRCExpression, path.node);
      },
      // 处理 JSXText 节点
      JSXText(path) {
        const nodeText = path.node.value; // 直接用 string 替换 原来的节点
        path.replaceWith(t.stringLiteral(nodeText), path.node);
      },
    },
  };
};
