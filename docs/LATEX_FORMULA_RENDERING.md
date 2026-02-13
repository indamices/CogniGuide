# LaTeX 数学公式渲染功能

## 概述

CogniGuide 现已支持完整的 LaTeX 数学公式渲染功能，使用 KaTeX 库实现高性能的数学公式显示。

## 功能特性

### ✨ 支持的公式类型

1. **行内公式**（使用 `$...$`）
   - 示例：`$E = mc^2$`
   - 渲染效果：$E = mc^2$

2. **块级公式**（使用 `$$...$$`）
   ```latex
   $$
   \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
   $$
   ```

3. **复杂公式**
   - 积分、微分方程
   - 矩阵和行列式
   - 求和、极限
   - 分数、根号
   - 希腊字母和特殊符号

## 技术实现

### 依赖包

```json
{
  "dependencies": {
    "katex": "^0.16.28"
  },
  "devDependencies": {
    "@types/katex": "^0.16.8",
    "remark-math": "^6.0.0",
    "rehype-katex": "^7.0.1"
  }
}
```

### 核心组件修改

**文件：** `components/MessageContent.tsx`

```typescript
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// 在 ReactMarkdown 组件中添加插件
<ReactMarkdown
  remarkPlugins={[remarkMath]}
  rehypePlugins={[rehypeHighlight, rehypeKatex]}
  components={components}
>
  {content}
</ReactMarkdown>
```

### 样式配置

**文件：** `index.css`

添加了完整的 KaTeX 样式支持，包括：

- 深色/浅色主题自适应
- 行内公式和块级公式样式
- 用户消息和模型消息的不同样式
- 公式与代码混合显示的样式

## 使用示例

### 1. 基础数学公式

```markdown
行内公式：$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

块级公式：
$$
f(x) = \int_{-\infty}^{\infty} e^{-x^2} dx
$$
```

### 2. 矩阵运算

```markdown
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$
```

### 3. 微积分

```markdown
导数：$\frac{dy}{dx} = \lim_{\Delta x \to 0} \frac{\Delta y}{\Delta x}$

积分：
$$
\int_0^1 x^2 dx = \left[\frac{x^3}{3}\right]_0^1 = \frac{1}{3}
$$
```

### 4. 希腊字母和符号

```markdown
希腊字母：$\alpha, \beta, \gamma, \delta, \theta, \lambda, \mu, \pi, \sigma, \phi, \omega$

关系符号：$\leq, \geq, \neq, \approx, \equiv$

运算符：$\times, \div, \pm, \mp, \cdot$
```

### 5. 在对话中使用

在 CogniGuide 对话中，AI 可以直接返回包含 LaTeX 公式的 Markdown 内容：

**用户提问：**
```
解释一下二次方程的求根公式
```

**AI 回答：**
```markdown
一元二次方程 $ax^2 + bx + c = 0$ 的求根公式为：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

其中：
- $a, b, c$ 是方程的系数
- $\Delta = b^2 - 4ac$ 是判别式
- 当 $\Delta > 0$ 时，方程有两个不同的实数根
- 当 $\Delta = 0$ 时，方程有一个重根
- 当 $\Delta < 0$ 时，方程没有实数根
```

## 主题支持

### 浅色主题（模型消息）
```css
.message-content.text-slate-800 .katex {
  color: #1f2937;
}
```

### 深色主题（用户消息）
```css
.message-content.text-white .katex {
  color: #e5e7eb;
}
```

## 性能优化

1. **KaTeX 优势**
   - 比 MathJax 快 10 倍
   - 更小的文件体积
   - 无外部依赖
   - 更好的渲染质量

2. **渲染优化**
   - 服务端渲染（SSR）友好
   - 支持增量渲染
   - 自动缓存已渲染公式

## 错误处理

如果公式格式错误，KaTeX 会：
1. 在控制台输出错误信息
2. 显示原始 LaTeX 代码
3. 不影响其他内容的渲染

## 测试

### 测试文件位置
- HTML 测试页面：`tests/latex-test.html`
- Markdown 测试文件：`tests/latex-test.md`

### 运行测试

1. 在浏览器中打开 `tests/latex-test.html`
2. 检查各种公式是否正确渲染
3. 测试深色/浅色主题切换
4. 在 CogniGuide 应用中实际测试

### 测试用例

- ✅ 行内公式渲染
- ✅ 块级公式渲染
- ✅ 复杂公式（积分、矩阵、求和）
- ✅ 特殊符号和希腊字母
- ✅ 与代码混合显示
- ✅ 深色/浅色主题
- ✅ 用户消息和模型消息
- ✅ 错误处理

## 常见问题

### Q: 公式不显示怎么办？

**A:** 检查以下几点：
1. 确认已安装所有依赖包
2. 确保 `katex.min.css` 已正确导入
3. 检查浏览器控制台是否有错误信息
4. 验证 LaTeX 语法是否正确

### Q: 如何转义特殊字符？

**A:** 在 Markdown 中，如果 `$` 符号不需要渲染为公式，可以使用反斜杠转义：
```
价格：\$5.00（不会被渲染为公式）
```

### Q: 支持所有 LaTeX 命令吗？

**A:** KaTeX 支持大多数常用的 LaTeX 数学命令。完整支持列表请参考：
https://katex.org/docs/supported.html

### Q: 如何在代码块中使用 $ 符号？

**A:** 在代码块中的 `$` 符号不会被解析为公式：
````markdown
```javascript
const price = $5.00;  // 这不会被渲染为公式
```
````

## 维护和更新

### 版本信息
- KaTeX: ^0.16.28
- remark-math: ^6.0.0
- rehype-katex: ^7.0.1

### 更新建议
1. 定期检查 KaTeX 更新
2. 关注安全公告
3. 测试新版本的兼容性

## 相关资源

- [KaTeX 官方文档](https://katex.org/)
- [KaTeX 支持的函数](https://katex.org/docs/supported.html)
- [remark-math 文档](https://github.com/remarkjs/remark-math)
- [rehype-katex 文档](https://github.com/rehypejs/rehype-katex)

## 贡献

如果发现问题或需要改进，请：
1. 在 GitHub 上创建 Issue
2. 提供详细的复现步骤
3. 附上截图或错误信息

---

**最后更新：** 2026-02-06
**维护者：** CogniGuide 开发团队
