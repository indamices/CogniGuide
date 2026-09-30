# CogniGuide 智能学习路径推荐系统

## 概述

智能学习路径推荐系统是基于知识图谱和AI的个性化学习推荐引擎，通过分析用户学习数据、知识掌握度、遗忘曲线等，提供精准的下一步学习建议。

## 核心功能

### 1. 推荐算法

#### 依赖分析
- 识别知识点的前置依赖关系
- 构建知识图谱结构（根节点、叶节点、学习链）
- 计算概念深度和层次

#### 难度评估
- 基于用户当前掌握度（Expert/Competent/Novice/Unknown）
- 考虑知识复杂度（深度、连接数）
- 动态调整推荐难度

#### 兴趣分析
- 分析用户学习主题偏好
- 识别擅长和薄弱领域
- 追踪学习时间和模式

#### 遗忘曲线
- 集成SuperMemo-2间隔重复算法
- 根据复习到期时间推荐
- 优先推荐记忆薄弱的知识点

### 2. 推荐类型

#### 📚 接下来应该学习（Next to Learn）
- **触发条件**：用户当前学习进度，知识图谱依赖关系
- **推荐内容**：基于前置依赖的下一步知识点
- **优先级**：高
- **预期效果**：保持学习连贯性，避免知识断层

#### 💪 薄弱知识点强化（Weak Points）
- **触发条件**：掌握度 < 50% 的概念
- **推荐内容**：需要加强的基础知识
- **优先级**：高
- **预期效果**：弥补知识短板，巩固基础

#### 🔗 相关主题拓展（Related Topics）
- **触发条件**：已掌握概念的邻居节点
- **推荐内容**：基于知识图谱的相关知识
- **优先级**：中低
- **预期效果**：拓展知识广度，建立知识网络

#### ⏰ 今日复习（Due for Review）
- **触发条件**：间隔重复到期的卡片
- **推荐内容**：需要复习的知识点
- **优先级**：高
- **预期效果**：强化长期记忆，防止遗忘

#### ☕ 休息建议（Rest Break）
- **触发条件**：学习疲劳度高（连续学习 > 30分钟）
- **推荐内容**：休息提醒
- **优先级**：根据疲劳度动态调整
- **预期效果**：防止学习疲劳，保持学习效率

### 3. AI增强推荐

系统可以调用AI API分析用户学习模式，生成个性化推荐理由：

```typescript
// 生成AI增强推荐
const enhancedRecommendations = await generateAIEnhancedRecommendations(
  concepts,
  links,
  reviewCards,
  sessionId,
  sessions,
  aiGenerateFn  // AI生成函数
);

// 分析学习模式
const analysis = await analyzeLearningPatternWithAI(
  concepts,
  links,
  sessions,
  aiGenerateFn
);
```

## 组件结构

```
utils/
  └── recommendationEngine.ts       # 核心推荐算法引擎

components/
  ├── LearningPathRecommendations.tsx  # 推荐主组件
  ├── RecommendationCard.tsx           # 单个推荐卡片
  └── LearningPathFlow.tsx             # 路径可视化流程图

集成点：
  ├── Dashboard.tsx     # 添加"智能推荐"标签页
  └── App.tsx          # 添加推荐处理逻辑
```

## 使用方法

### 1. 在Dashboard中查看推荐

1. 打开CogniGuide
2. 在右侧Dashboard点击"智能推荐"标签
3. 系统会自动生成个性化推荐

### 2. 筛选推荐类型

- 点击顶部的筛选按钮：
  - 📋 全部推荐
  - 📚 接下来学习
  - 💪 薄弱强化
  - 🔗 相关拓展
  - ⏰ 今日复习
  - ☕ 休息建议

### 3. 查看学习路径

- 点击"🔀 路径"按钮切换到路径视图
- 可视化展示推荐优先级和顺序

### 4. 开始学习

- 点击推荐卡片上的"开始学习"按钮
- 系统会自动发送建议的问题到聊天区
- AI导师会根据推荐内容展开教学

### 5. 反馈推荐

- 点击"反馈"按钮
- 选择 👍 有用 或 👎 无用
- 帮助系统优化推荐算法

### 6. 跳过推荐

- 点击"跳过"按钮
- 该推荐将被隐藏
- 可以点击"刷新推荐"重新生成

## 推荐算法详解

### 知识图谱分析

```typescript
function analyzeKnowledgeGraph(
  concepts: ConceptNode[],
  links: ConceptLink[]
): KnowledgeGraphAnalysis
```

**输出结构：**
- `roots`: 根节点（无前置依赖）
- `leaves`: 叶节点（无后续依赖）
- `chains`: 学习链（从根到叶的路径）
- `clusters`: 概念簇（相关概念组）
- `depthMap`: 概念深度映射

### 学习偏好分析

```typescript
function analyzeLearningPreferences(
  sessions: SavedSession[],
  reviewCards: ReviewCard[],
  currentSessionId?: string
): LearningPreferences
```

**分析维度：**
- 偏好学习时间（早晨/下午/傍晚/夜晚）
- 平均会话时长
- 偏好难度（简单/中等/困难）
- 强项和弱项主题
- 学习连续天数
- 疲劳度评估

### 推荐生成流程

```
1. 分析知识图谱结构
   ↓
2. 分析用户学习偏好
   ↓
3. 生成各类推荐（5种类型）
   ↓
4. 过滤低置信度推荐
   ↓
5. 多样化处理（避免单调）
   ↓
6. 排序（优先级 > 置信度）
   ↓
7. 限制数量（默认最多8条）
```

## 配置选项

```typescript
interface RecommendationConfig {
  maxRecommendations: number;        // 最大推荐数量（默认8）
  enableRestBreaks: boolean;         // 是否启用休息建议（默认true）
  minConfidenceThreshold: number;    // 最低置信度阈值（默认0.3）
  fatigueThreshold: number;          // 疲劳度阈值（默认0.7）
  diversityFactor: number;           // 多样性因子（默认0.4）
}
```

## 推荐理由生成

### 规则生成（默认）

系统根据推荐类型、概念掌握度、知识图谱关系生成推荐理由：

```typescript
reason: `这是学习路径中的重要基础，掌握后将帮助你理解更多相关概念。`
```

### AI增强生成（可选）

调用AI API分析用户学习模式，生成个性化推荐理由：

```typescript
const aiReason = await aiGenerateFn(`
  基于以下学习数据，生成个性化推荐理由：
  - 推荐标题：${rec.title}
  - 用户掌握情况：${masteryData}
  - 要求：1-2句话，友好语气，说明为什么这个推荐有帮助
`);
```

## 导出学习计划

点击"导出学习计划"按钮，将推荐导出为Markdown格式的学习计划：

```markdown
# 个性化学习计划

生成时间：2026-02-06 14:30:00

## 学习建议总览

### 1. 学习：React Hooks
**类型**：next_to_learn
**优先级**：high
**推荐理由**：...

---
```

## 性能指标

- **推荐生成速度**：< 500ms（100个概念以内）
- **UI渲染时间**：< 100ms
- **内存占用**：< 5MB
- **推荐准确度**：基于置信度评分（0.3-0.95）

## 验收标准

- ✅ 推荐准确且有帮助
- ✅ 推荐理由清晰
- ✅ 不破坏学习自主性（可跳过、可反馈）
- ✅ 与5阶段学习模型兼容
- ✅ 性能流畅（<500ms计算）
- ✅ 支持手动调整推荐

## 未来改进方向

1. **协同过滤**：基于相似学习者的推荐
2. **深度学习**：使用神经网络优化推荐算法
3. **实时调整**：根据用户反馈动态调整推荐策略
4. **多模态推荐**：支持视频、练习题等多种学习资源
5. **社交学习**：推荐学习小组和讨论话题

## 技术债务

- [ ] 添加A/B测试框架验证推荐效果
- [ ] 实现推荐算法的离线评估
- [ ] 个性化推荐权重（用户可调）
- [ ] 推荐历史记录和分析

## 文件清单

- `utils/recommendationEngine.ts` - 核心算法引擎（800+行）
- `components/LearningPathRecommendations.tsx` - 推荐主组件（300+行）
- `components/RecommendationCard.tsx` - 推荐卡片组件（260行）
- `components/LearningPathFlow.tsx` - 路径可视化组件（280行）
- `components/Dashboard.tsx` - 集成推荐标签页
- `App.tsx` - 添加推荐处理逻辑

---

**开发者**: CogniGuide智能推荐开发团队
**版本**: v1.0.0
**最后更新**: 2026-02-06
