<div align="center">
  <h1>CogniGuide</h1>
  <p>动态自适应学习引擎 & 知识架构师</p>

  <img src="public/icon.svg" alt="CogniGuide Logo" width="120" height="120">

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
</div>

---

## CogniGuide 简介

**CogniGuide** 是一个智能自适应学习引擎，可以根据您的学习状态和知识掌握程度，动态调整教学策略。它不仅是一个AI对话助手，更是一个完整的知识管理系统。

### 核心特性

- **多AI模型支持** - 集成 Gemini、DeepSeek、GLM-4.7、MiniMax 等多个AI服务
- **动态教学模式** - 支持自动适应、苏格拉底式、叙事讲解、讲授式四种教学模式
- **知识图谱可视化** - 自动构建思维导图，帮助理解知识结构
- **间隔重复学习** - 内置闪卡系统，科学记忆管理
- **语音交互** - 支持语音输入和语音输出
- **PWA离线支持** - 可作为离线应用安装使用
- **代码沙盒** - 支持代码执行和演示
- **LaTeX公式** - 完美支持数学公式渲染
- **学习分析** - 详细的学习进度追踪和推荐

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装

```bash
# 克隆仓库
git clone https://github.com/indamices/CogniGuide.git
cd CogniGuide

# 安装依赖
npm install
```

### 配置 API Key

CogniGuide 支持多个 AI 提供商，您需要配置至少一个 API Key：

#### 方式一：通过 UI 配置（推荐）

启动应用后，点击侧边栏的 "API Key 管理" 按钮，在界面中输入您的 API Key。

#### 方式二：通过环境变量配置

创建 `.env.local` 文件：

```env
# Gemini (Google AI Studio)
VITE_GEMINI_API_KEY=your_gemini_api_key

# DeepSeek
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key

# GLM (智谱AI)
VITE_GLM_API_KEY=your_glm_api_key

# MiniMax
VITE_MINIMAX_API_KEY=your_minimax_api_key
VITE_MINIMAX_GROUP_ID=your_group_id  # 可选
```

#### 获取 API Key

- **Gemini**: [Google AI Studio](https://aistudio.google.com/app/apikey) (免费)
- **DeepSeek**: [DeepSeek Platform](https://platform.deepseek.com/)
- **GLM**: [智谱AI开放平台](https://open.bigmodel.cn/)
- **MiniMax**: [MiniMax 开放平台](https://www.minimaxi.com/)

### 运行

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

访问 http://localhost:5173 开始使用。

---

## 功能说明

### 1. 教学模式

CogniGuide 提供四种教学模式：

| 模式 | 描述 | 适用场景 |
|------|------|---------|
| 🤖 智能适应 | AI自动分析并选择最佳策略 | 日常学习 |
| ❓ 苏格拉底式 | 通过提问引导思考 | 深度理解 |
| 📖 叙事讲解 | 用故事和类比解释 | 新概念入门 |
| 🎓 讲授式 | 直接给出定义和步骤 | 复习巩固 |

### 2. 知识图谱

右侧思维导图自动展示知识结构：
- 概念节点按掌握程度着色
- 支持树状结构可视化
- 可导出为 Markdown 格式

### 3. 间隔重复系统

- 自动生成复习卡片
- 基于遗忘曲线的提醒
- 支持导入 Anki 卡组

### 4. 语音功能

- 语音输入：按空格键开始/停止
- 语音输出：播放 AI 回复
- 支持多声音选择和语速调节

### 5. 代码执行

- 支持多种编程语言
- 实时代码沙盒环境
- 语法高亮和错误提示

---

## 项目结构

```
CogniGuide/
├── components/       # React 组件
├── services/        # AI 服务集成
├── hooks/          # 自定义 Hooks
├── utils/          # 工具函数
├── docs/           # 文档
├── public/         # 静态资源
└── types.ts        # TypeScript 类型定义
```

---

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **UI**: TailwindCSS
- **状态管理**: React Hooks
- **存储**: localStorage + IndexedDB
- **可视化**: D3.js, React Flow
- **PWA**: Workbox

---

## 更新日志

### v1.0.6 (最新)

- 添加 MiniMax M2 系列模型支持
- 新增 API Key 管理器
- 添加语音识别和合成功能
- 添加间隔重复学习系统
- 添加 3D 知识图谱可视化
- 添加代码沙盒功能
- 优化性能和加载速度
- 完善 PWA 离线支持

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

## 许可证

[MIT License](LICENSE)

---

## 联系方式

- GitHub Issues: [提交问题](https://github.com/indamices/CogniGuide/issues)
- Email: indamices@github.com

---

<div align="center">
  <p>用 ❤️ 和 AI 打造</p>
  <p>Powered by Claude, Gemini, DeepSeek, GLM & MiniMax</p>
</div>
