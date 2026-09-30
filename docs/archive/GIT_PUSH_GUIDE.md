# Git 推送到 GitHub 指南

## 📋 推送步骤

由于 PowerShell 输出可能被抑制，以下是手动推送代码的步骤：

### 方法 1: 使用 Git 命令（推荐）

在项目根目录（`CogniGuide` 目录）执行以下命令：

```bash
# 1. 检查当前状态
git status

# 2. 添加所有更改的文件
git add .

# 3. 提交更改（使用描述性的提交信息）
git commit -m "fix: 修复 TypeScript 编译错误和所有已知 bug

- 修复 TypeScript 编译错误（process.env 和枚举类型）
- 添加 @types/node 依赖支持
- 修复 8 个已知 bug（严重/中等/轻微）
- 创建安全 localStorage 工具 (utils/storage.ts)
- 创建自动化测试套件 (tests/test-runner.js)
- 添加详细的测试报告和部署修复指南
- 优化代码质量和类型安全"

# 4. 推送到 GitHub
git push origin main
```

### 方法 2: 使用 GitHub Desktop（GUI）

1. 打开 GitHub Desktop
2. 选择 CogniGuide 仓库
3. 查看更改（所有修改的文件应该显示在左侧）
4. 填写提交信息
5. 点击"Commit to main"
6. 点击"Push origin"按钮

### 方法 3: 使用 VS Code 的 Git 功能

1. 打开 VS Code
2. 打开 CogniGuide 项目
3. 点击左侧的"源代码管理"图标（Source Control）
4. 在"更改"（Changes）区域查看所有修改的文件
5. 在消息框输入提交信息
6. 点击"提交"（✓ Commit）按钮
7. 点击"推送"（Push）按钮

---

## 📝 提交信息建议

如果你想要使用更简洁的提交信息，可以使用：

```bash
git commit -m "fix: 修复 TypeScript 编译错误和 bug"
```

或者更详细的：

```bash
git commit -m "fix: 修复 TypeScript 编译错误

- 添加 @types/node 依赖
- 修复枚举类型使用
- 修复 process.env 类型错误
- 修复所有已知 bug（8个）
- 添加安全工具和测试套件"
```

---

## 🔍 验证推送是否成功

推送完成后，你可以通过以下方式验证：

### 1. 检查 GitHub 网页

访问你的 GitHub 仓库：
```
https://github.com/indamices/CogniGuide
```

你应该能看到：
- ✅ 最新的提交记录
- ✅ 更新的文件列表
- ✅ 提交信息

### 2. 使用 Git 命令检查

```bash
# 检查远程分支状态
git fetch origin
git status

# 查看提交历史
git log --oneline -5

# 查看远程分支
git branch -r
```

---

## ⚠️ 常见问题

### 问题 1: 推送被拒绝（Push Rejected）

**原因**: 远程仓库有新的提交

**解决方法**:
```bash
# 先拉取远程更改
git pull origin main

# 解决冲突（如果有）
# ... 编辑冲突文件 ...

# 重新提交
git add .
git commit -m "merge: 合并远程更改"

# 再次推送
git push origin main
```

### 问题 2: 需要身份验证

**解决方法**:
- 使用 Personal Access Token (PAT)
- 或在 Git 配置中设置 SSH 密钥

```bash
# 配置 Git 用户信息（如果还没有）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 问题 3: 文件被忽略

检查 `.gitignore` 文件，确保需要提交的文件没有被忽略。

---

## 📦 本次推送包含的文件

以下文件应该被包含在本次提交中：

### 修改的文件
- ✅ `App.tsx` - 修复 process.env 和类型声明
- ✅ `components/HistorySidebar.tsx` - 添加 window 安全检查
- ✅ `components/KnowledgeMap.tsx` - 修复循环检测
- ✅ `services/deepseekService.ts` - 修复枚举类型使用
- ✅ `package.json` - 添加 @types/node 依赖
- ✅ `vite.config.ts` - 修复环境变量默认值

### 新增的文件
- ✅ `utils/storage.ts` - 安全 localStorage 工具
- ✅ `tests/test-runner.js` - 自动化测试套件
- ✅ `tests/test-runner.ts` - TypeScript 测试文件
- ✅ `TEST_REPORT.md` - 详细的 bug 修复报告
- ✅ `DEPLOY_FIX.md` - 部署修复指南
- ✅ `GIT_PUSH_GUIDE.md` - 本文件

---

## 🎯 下一步

推送成功后：

1. ✅ 检查 GitHub 仓库是否更新
2. ✅ 验证 Render 部署是否自动触发
3. ✅ 查看 Render 构建日志
4. ✅ 确认部署成功

---

## 📞 需要帮助？

如果遇到问题，请检查：

1. **Git 配置**
   ```bash
   git config --list
   ```

2. **远程仓库**
   ```bash
   git remote -v
   ```

3. **Git 版本**
   ```bash
   git --version
   ```

4. **网络连接**
   - 确保能访问 GitHub
   - 检查防火墙设置

---

## ✨ 快速命令参考

```bash
# 查看状态
git status

# 添加所有更改
git add .

# 提交更改
git commit -m "你的提交信息"

# 推送到 GitHub
git push origin main

# 查看提交历史
git log --oneline -10

# 查看远程仓库
git remote -v
```
