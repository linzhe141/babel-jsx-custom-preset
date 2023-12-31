# jsx 本质

`jsx`是 JavaScript 的一个类似 XML 的扩展，虽然最早是由 react 提出的，但实际上 JSX 语法并没有定义运行时语义，
并且能被编译成[各种不同的输出形式](https://cn.vuejs.org/guide/extras/render-function.html#jsx-tsx)，
`jsx`可以由很多工具进行转换为`js`，比如`Babel`和`TypeScript`，接下来就通过 babel 和 ts 创建属于自己的 jsx

<div className='flex'>
  <span>
    <Underline>
      <a href='https://github.com/linzhe141/babel-jsx-custom-preset'>
        <span>案例源码</span>
      </a>
    </Underline>
  </span>
</div>

### 1、TypeScript 转换

安装 typescript 依赖，并进行配置相关的准备工作

```bash
pnpm i -D typescript
```

编写 tsconfig.json，输入如下的简单配置，其中`jsx: preserve`，表示不对 jsx 进行转换，而是直接保留 jsx，
因为接下来我们可以通过`Babel`进行转换，为了让 ts 能够识别 jsx，需要编写对应的类型

- tsconfig.json

  ```json
  {
    "compilerOptions": {
      "strict": true,
      "target": "ES5",
      "module": "ESNext",
      "jsx": "preserve", // 保留原始jsx，不进行转换
      "outDir": "dist",
      "types": ["./type.d.ts"]
    },
    "include": ["input.tsx"]
  }
  ```

- type.d.ts：声明 jsx 类型，不然在编译 jsx 时会报错

  ```ts
  declare namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  ```

- input.tsx: 入口文件，只是通过 tsc 转换 jsx，不进行编译 jsx

  ```tsx
  const x = (
    <div class="xxx" id="test">
      <div class="list-1">1111</div>
      <div class="list-2">2222</div>
    </div>
  );
  ```

- `npx tsc`编译 input.tsx，输出如下

  ```jsx
  // dist/input.jsx
  "use strict";
  var x = (
    <div class="xxx" id="test">
      <div class="list-1">1111</div>
      <div class="list-2">2222</div>
    </div>
  );
  ```

### 2、通过 Babel 插件转换成自定义的 jsx

参考`React.createElement`，假设存在一个函数`Dom`，用来创建属于自己的虚拟节点

```ts
function Dom(tagName: string, props: Record<string, any>, ...children: CustomVNode[]): CustomVNode{
  ... // 实现不考虑，本文只考虑jsx的转换
}
```

安装 babel 相关依赖

```bash
pnpm i -D @babel/cli @babel/core @babel/plugin-syntax-jsx
```

- [编写自定义的 babel 插件](https://juejin.cn/post/6918555538628280333)

  ```js
  // custom-plugin.js
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
          const createIdentifier = t.identifier("Dom");
          const args = [
            t.stringLiteral(tagName),
            t.objectExpression(propsList),
          ];
          // Dom('div', {class:'xxx',id: 'test'})
          const callRCExpression = t.callExpression(createIdentifier, args);
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
  ```

- 配置 babel，使用刚刚编写的自定义插件(`custom-plugin.js`)

  ```json
  // .babelrc
  {
    "plugins": ["@babel/plugin-syntax-jsx", "./custom-plugin.js"]
  }
  ```

- 对 ts 编译后的产物，再次进行转换，就可以得到自定义的 jsx 了

  ```bash
  npx babel dist/input.jsx --out-file dist/output.js
  ```

  ```js
  // dist/output.js
  "use strict";
  var x = Dom(
    "div",
    {
      class: "xxx",
      id: "test",
    },
    "\n    ",
    Dom(
      "div",
      {
        class: "list-1",
      },
      "1111"
    ),
    "\n    ",
    Dom(
      "div",
      {
        class: "list-2",
      },
      "2222"
    ),
    "\n  "
  );
  ```
