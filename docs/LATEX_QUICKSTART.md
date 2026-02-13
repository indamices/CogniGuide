# LaTeX 数学公式渲染 - 快速开始指南

## 🚀 快速测试

### 方法 1：浏览器测试（最简单）

直接在浏览器中打开测试页面：

```bash
# Windows
start tests/latex-test.html

# 或双击文件
tests/latex-test.html
```

测试页面包含：
- ✅ 8 个测试场景
- ✅ 深色/浅色主题切换按钮
- ✅ 各种数学公式示例

### 方法 2：应用内测试

1. **启动开发服务器**

```bash
npm run dev
```

2. **在浏览器中打开应用**

通常访问：http://localhost:5173

3. **测试公式渲染**

在对话中输入以下内容：

```
请解释二次方程的求根公式，并用 LaTeX 格式写出
```

或者直接输入包含公式的消息：

```
勾股定理：a² + b² = c²

用 LaTeX 表示：
$a^2 + b^2 = c^2$

块级公式：
$$
c = \sqrt{a^2 + b^2}
$$
```

## 📝 常用公式示例

### 基础运算

```
加法：$a + b$
减法：$a - b$
乘法：$a \times b$
除法：$\frac{a}{b}$
```

### 代数

```
一元二次方程：$ax^2 + bx + c = 0$
求根公式：$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
```

### 微积分

```
导数：$\frac{dy}{dx}$
积分：
$$
\int_0^1 x^2 dx = \left[\frac{x^3}{3}\right]_0^1 = \frac{1}{3}
$$
```

### 矩阵

```
矩阵乘法：
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

### 希腊字母

```
常用希腊字母：
$\alpha$ (alpha)
$\beta$ (beta)
$\gamma$ (gamma)
$\delta$ (delta)
$\theta$ (theta)
$\lambda$ (lambda)
$\mu$ (mu)
$\pi$ (pi)
$\sigma$ (sigma)
$\phi$ (phi)
$\omega$ (omega)
```

### 物理公式

```
质能方程：$E = mc^2$
牛顿第二定律：$F = ma$
万有引力：$F = G\frac{m_1 m_2}{r^2}$
```

## 🎨 主题测试

### 浅色主题（模型消息）

在对话中让 AI 回答时，公式会以深色显示在浅色背景上。

### 深色主题（用户消息）

当用户发送包含公式的消息时，公式会以浅色显示在深色背景上。

## 🔧 常见问题

### Q1: 公式不显示？

**解决方案：**

1. 检查依赖是否安装：
```bash
npm list katex remark-math rehype-katex
```

2. 重新安装依赖：
```bash
npm install
```

3. 检查浏览器控制台是否有错误

### Q2: 如何显示美元符号？

在 Markdown 中，如果 `$` 不需要渲染为公式，使用反斜杠转义：

```markdown
价格：\$5.00
```

### Q3: 代码块中的 $ 符号怎么办？

在代码块中的 `$` 不会被解析为公式：

````markdown
```javascript
const price = $5.00;  // 正常显示
```
````

### Q4: 公式太长怎么办？

使用块级公式（`$$...$$`），它们会自动换行：

```
$$
\text{很长的公式...}
$$
```

## 📚 更多示例

### 测试文件位置

- **HTML 测试**：`tests/latex-test.html`
- **Markdown 测试**：`tests/latex-test.md`
- **完整文档**：`docs/LATEX_FORMULA_RENDERING.md`

### 复制示例

从 `tests/latex-test.md` 中复制任何示例，粘贴到 CogniGuide 对话中测试。

## ✅ 验证清单

完成以下检查确保功能正常：

- [ ] 浏览器测试页面正常显示
- [ ] 应用中行内公式 `$...$` 正常渲染
- [ ] 应用中块级公式 `$$...$$` 正常渲染
- [ ] 深色主题下公式清晰可见
- [ ] 浅色主题下公式清晰可见
- [ ] 与代码混合显示正常
- [ ] 无 JavaScript 控制台错误

## 🎯 快速验证命令

```bash
# 1. 检查依赖
npm list katex remark-math rehype-katex

# 2. 打开测试页面
start tests/latex-test.html

# 3. 启动开发服务器
npm run dev

# 4. 在浏览器中测试
# 访问 http://localhost:5173
# 在对话中输入包含公式的消息
```

## 💡 提示

1. **学习 LaTeX 语法**
   - 从简单公式开始
   - 参考测试文件中的示例
   - 使用在线 LaTeX 编辑器练习

2. **最佳实践**
   - 复杂公式使用块级模式
   - 简单公式使用行内模式
   - 注意转义特殊字符

3. **性能考虑**
   - KaTeX 比 MathJax 快很多
   - 避免在一个消息中使用过多公式
   - 复杂公式可能需要更多渲染时间

---

**需要帮助？** 查看完整文档：`docs/LATEX_FORMULA_RENDERING.md`

**遇到问题？** 查看实施报告：`docs/LATEX_IMPLEMENTATION_REPORT.md`
