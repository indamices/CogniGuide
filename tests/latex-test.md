# LaTeX数学公式测试示例

## 行内公式测试

这是一个行内公式：$E = mc^2$，这是爱因斯坦的质能方程。

另一个行内公式：$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ 是一元二次方程的求根公式。

## 块级公式测试

### 积分公式

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### 矩阵公式

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

### 微分方程

$$
\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u
$$

### 求和公式

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

### 极限

$$
\lim_{x \to \infty} \left(1 + \frac{1}{x}\right)^x = e
$$

## 混合内容测试

在文本中使用多个公式：
- 圆的面积公式：$A = \pi r^2$
- 勾股定理：$a^2 + b^2 = c^2$
- 欧拉公式：$e^{i\pi} + 1 = 0$

## 复杂公式

### 麦克斯韦方程组

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}
$$

$$
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}
$$

### 泰勒级数展开

$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n
$$

### 概率密度函数（正态分布）

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}
$$

## 与代码混合测试

Python代码示例：

```python
import numpy as np

def calculate_energy(mass):
    c = 299792458  # 光速
    return mass * c**2

# 使用公式: E = mc^2
energy = calculate_energy(1.0)
print(f"能量: {energy} 焦耳")
```

数学公式在列表中：

1. 第一定律：$\oint \mathbf{E} \cdot d\mathbf{A} = \frac{Q}{\varepsilon_0}$
2. 第二定律：$\oint \mathbf{B} \cdot d\mathbf{A} = 0$
3. 第三定律：$\oint \mathbf{E} \cdot d\mathbf{l} = -\frac{d\Phi_B}{dt}$

## 分数和根号

- 简单分数：$\frac{1}{2}$
- 复杂分数：$\frac{\frac{a}{b}}{\frac{c}{d}} = \frac{ad}{bc}$
- 平方根：$\sqrt{x^2 + y^2}$
- n次方根：$\sqrt[n]{x}$

## 上下标和修饰

- 上标：$x^2, x^{2n}$
- 下标：$a_1, a_{i,j}$
- 组合：$x_{i}^{2}$
- 向量：$\vec{F} = m\vec{a}$
- 加粗：$\mathbf{A}$

## 特殊符号

- 希腊字母：$\alpha, \beta, \gamma, \delta, \epsilon, \theta, \lambda, \mu, \pi, \sigma, \phi, \omega$
- 集合符号：$\in, \notin, \subset, \subseteq, \cup, \cap, \emptyset$
- 箭头：$\rightarrow, \leftarrow, \Rightarrow, \Leftrightarrow$
- 关系符号：$\leq, \geq, \neq, \approx, \equiv$
- 运算符：$\times, \div, \pm, \mp, \cdot$
