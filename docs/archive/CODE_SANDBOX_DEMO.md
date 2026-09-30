# 代码沙盒演示示例

## 1. JavaScript演示 - 排序算法

在聊天中输入：
```
展示一个快速排序算法的JavaScript实现
```

AI应该返回类似：
```javascript
function quickSort(arr) {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// 测试
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log('原数组:', numbers);
const sorted = quickSort(numbers);
console.log('排序后:', sorted);
```

**运行后预期输出:**
```
原数组: 64,34,25,12,22,11,90
排序后: 11,12,22,25,34,64,90
```

---

## 2. Python演示 - 数据处理

在聊天中输入：
```
用Python展示如何处理学生成绩数据
```

AI应该返回类似：
```python
# 学生成绩数据
students = [
    {"name": "张三", "math": 85, "english": 90, "science": 78},
    {"name": "李四", "math": 92, "english": 88, "science": 95},
    {"name": "王五", "math": 78, "english": 85, "science": 82}
]

# 计算每个学生的平均分
for student in students:
    average = (student["math"] + student["english"] + student["science"]) / 3
    student["average"] = round(average, 2)
    print(f'{student["name"]}: 平均分 {student["average"]}')

# 找出最高分
top_student = max(students, key=lambda x: x["average"])
print(f'\n最高分学生: {top_student["name"]} ({top_student["average"]}分)')
```

**运行后预期输出:**
```
张三: 平均分 84.33
李四: 平均分 91.67
王五: 平均分 81.67

最高分学生: 李四 (91.67分)
```

---

## 3. HTML演示 - 交互式卡片

在聊天中输入：
```
创建一个带悬停效果的卡片HTML页面
```

AI应该返回类似：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 400px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .card:hover {
      transform: translateY(-10px);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
    }

    .card h1 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 28px;
    }

    .card p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 16px;
      transition: transform 0.2s ease;
    }

    .btn:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 代码沙盒</h1>
    <p>
      这是一个完全交互式的代码执行环境。
      你可以在这里运行 JavaScript、Python 和 HTML 代码！
    </p>
    <button class="btn" onclick="alert('Hello from CogniGuide!')">
      点击测试
    </button>
  </div>
</body>
</html>
```

**预览效果:**
- 美观的渐变背景
- 白色卡片，圆角阴影
- 鼠标悬停时卡片上浮
- 点击按钮弹出提示

---

## 4. TypeScript演示 - 类型系统

在聊天中输入：
```
展示TypeScript的接口和类型检查
```

AI应该返回类似：
```typescript
// 定义用户接口
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // 可选属性
}

// 用户服务类
class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
    console.log(`用户 ${user.name} 已添加`);
  }

  findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  listUsers(): void {
    console.log('=== 用户列表 ===');
    this.users.forEach(user => {
      console.log(`${user.id}: ${user.name} (${user.email})`);
    });
  }
}

// 使用示例
const service = new UserService();

service.addUser({
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  age: 25
});

service.addUser({
  id: 2,
  name: '李四',
  email: 'lisi@example.com'
});

service.listUsers();

const found = service.findUserByEmail('zhangsan@example.com');
if (found) {
  console.log(`找到用户: ${found.name}`);
}
```

**运行后预期输出:**
```
用户 张三 已添加
用户 李四 已添加
=== 用户列表 ===
1: 张三 (zhangsan@example.com)
2: 李四 (lisi@example.com)
找到用户: 张三
```

---

## 5. 错误处理演示

在聊天中输入：
```
展示JavaScript中常见的错误及如何处理
```

AI应该返回类似：
```javascript
// 1. Try-Catch 错误处理
console.log('=== 1. Try-Catch 示例 ===');

try {
  // 故意引发错误
  const result = JSON.parse('{invalid json}');
} catch (error) {
  console.log('捕获到错误:', error.message);
}

// 2. Promise 错误处理
console.log('\n=== 2. Promise 错误处理 ===');

Promise.reject('操作失败')
  .catch(error => console.log('Promise错误:', error));

// 3. Async/Await 错误处理
console.log('\n=== 3. Async/Await 示例 ===');

async function fetchData() {
  try {
    // 模拟API调用失败
    throw new Error('网络连接失败');
  } catch (error) {
    console.log('异步错误:', error.message);
  }
}

fetchData();

// 4. 自定义错误
console.log('\n=== 4. 自定义错误 ===');

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateAge(age: number) {
  if (age < 0) {
    throw new ValidationError('年龄不能为负数');
  }
  if (age > 150) {
    throw new ValidationError('年龄不现实');
  }
  console.log('年龄验证通过');
}

try {
  validateAge(-5);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('验证错误:', error.message);
  }
}
```

**运行后预期输出:**
```
=== 1. Try-Catch 示例 ===
捕获到错误: Unexpected token i in JSON at position 1

=== 2. Promise 错误处理 ===
Promise错误: 操作失败

=== 3. Async/Await 示例 ===
异步错误: 网络连接失败

=== 4. 自定义错误 ===
验证错误: 年龄不能为负数
```

---

## 6. CSS演示 - 动画效果

在聊天中输入：
```
创建一个CSS动画效果的页面
```

AI应该返回类似：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a2e;
      margin: 0;
    }

    .container {
      text-align: center;
    }

    .box {
      width: 100px;
      height: 100px;
      background: linear-gradient(45deg, #ff6b6b, #feca57);
      border-radius: 10px;
      margin: 20px auto;
      animation: rotate 2s infinite, pulse 1s infinite;
    }

    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    h1 {
      color: white;
      font-family: Arial, sans-serif;
      animation: fadeIn 1s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 CSS 动画演示</h1>
    <div class="box"></div>
    <p style="color: #fff; font-family: Arial;">方框正在旋转和脉冲动画</p>
  </div>
</body>
</html>
```

**预览效果:**
- 深色背景
- 渐变色方块旋转
- 方块同时缩放脉冲
- 标题淡入动画

---

## 测试技巧

### 1. 快速测试流程
1. 在聊天中输入上述任一问题
2. 等待AI回复代码
3. 点击代码块上的"▶ 运行"按钮
4. 在沙盒中点击"Run"或按Ctrl+Enter
5. 查看控制台输出或HTML预览

### 2. 修改测试
- 在沙盒中修改代码
- 再次运行查看结果
- 尝试引入错误查看错误处理

### 3. 边界测试
- 空代码
- 超长代码
- 无限循环
- 内存密集型操作
- 网络请求（应该被阻止）

### 4. 性能观察
- 注意Pyodide首次加载时间
- 观察Monaco Editor加载速度
- 测量代码执行时间
- 检查内存使用情况

## 预期学习场景

1. **算法学习**: 运行排序、搜索算法
2. **数据处理**: 使用Python处理数据
3. **前端开发**: 实时预览HTML/CSS
4. **调试技能**: 学习错误处理
5. **类型系统**: 理解TypeScript类型

## 下一步

完成基本测试后，可以：
1. 尝试更复杂的代码示例
2. 结合AI进行代码调试
3. 探索不同编程语言
4. 创建个人代码库
5. 分享有趣的可视化效果
