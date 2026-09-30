# CogniGuide 间隔重复学习系统

## 🎯 功能概述

基于**SuperMemo-2算法**实现的智能间隔重复学习系统，帮助用户通过科学的复习节奏巩固知识。

### 核心特性

✅ **SuperMemo-2算法实现**
- 艾宾浩斯遗忘曲线优化
- 动态难度因子(EF)调整
- 个性化复习间隔计算

✅ **智能卡片管理**
- 从AI对话中自动提取知识点
- 手动创建复习卡片
- 支持Anki格式导入/导出
- 优先级分类(高/中/低)

✅ **Flashcard复习模式**
- 3D翻转动画效果
- 5级评分系统(1-5)
- 实时进度追踪
- 批量复习支持

✅ **数据持久化**
- localStorage本地存储
- 与学习会话自动关联
- 复习历史记录
- 学习统计分析

---

## 📊 SuperMemo-2算法说明

### 算法公式

```typescript
// 难度因子更新
EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))

// 间隔天数计算
I(1) = 1          // 第一次复习间隔1天
I(2) = 6          // 第二次复习间隔6天
I(n) = I(n-1) * EF // 后续复习间隔
```

### 评分标准

| 评分 | 含义 | 效果 | 下次复习 |
|------|------|------|----------|
| 5 | 完美记忆，毫不费力 | EF增加，间隔延长 | 4+天 |
| 4 | 正确但稍有犹豫 | EF略增 | 2-3天 |
| 3 | 正确但很困难 | EF不变，间隔不变 | 1天 |
| 2 | 不正确，但看到答案后恍然大悟 | EF减少，重新开始 | 10分钟 |
| 1 | 完全不记得 | EF减少，重新开始 | 1分钟 |

### 特殊规则

- 评分<3时：重置复习次数为0，间隔为1天
- 评分=3时：不增加复习次数，保持当前间隔
- 评分≥4时：增加复习次数，间隔按EF倍增

---

## 🎨 UI组件说明

### 1. SpacedRepetition 主组件

**路径**: `components/SpacedRepetition.tsx`

**功能**:
- 显示待复习卡片统计
- 复习模式入口
- 卡片列表视图
- 学习数据可视化

**Tab切换**:
- **学习仪表板**: 显示知识图谱和笔记
- **间隔重复**: 复习卡片管理

### 2. Flashcard 卡片组件

**路径**: `components/Flashcard.tsx`

**特点**:
- 3D CSS翻转动画
- 问题/答案双面显示
- 优先级标签颜色
- 复习历史展示

### 3. CreateCardDialog 创建对话框

**路径**: `components/CreateCardDialog.tsx`

**字段**:
- 问题(必填)
- 答案(必填)
- 优先级(高/中/低)
- 标签(可选，逗号分隔)
- 关联知识点ID(可选)

### 4. AnkiImporter 导入导出

**路径**: `components/AnkiImporter.tsx`

**支持格式**:
```json
[
  {
    "question": "什么是React？",
    "answer": "React是一个用于构建用户界面的JavaScript库",
    "tags": ["前端", "JavaScript"]
  }
]
```

### 5. ReviewReminder 提醒通知

**路径**: `components/ReviewReminder.tsx`

**触发条件**:
- 有到期卡片时延迟3秒显示
- 右上角浮动通知
- 立即复习/稍后操作

---

## 🛠️ 核心工具函数

### utils/spacedRepetition.ts

#### 算法函数

```typescript
// 计算新的难度因子
calculateNewEaseFactor(currentEF: number, quality: QualityRating): number

// 计算下次复习间隔
calculateNextInterval(
  currentInterval: number,
  repetitions: number,
  quality: QualityRating,
  easeFactor: number
): { interval: number; repetitions: number }

// 处理卡片复习
processCardReview(card: ReviewCard, quality: QualityRating, timeTaken: number): ReviewCard
```

#### 卡片管理

```typescript
// 创建新卡片
createCard(
  question: string,
  answer: string,
  sessionId: string,
  conceptId?: string,
  priority?: 'low' | 'medium' | 'high',
  tags?: string[]
): ReviewCard

// 检查是否到期
isCardDue(card: ReviewCard): boolean

// 获取到期卡片
getDueCards(cards: ReviewCard[]): ReviewCard[]

// 智能排序
sortCardsByPriority(cards: ReviewCard[]): ReviewCard[]
```

#### 统计分析

```typescript
// 计算统计数据
calculateStatistics(cards: ReviewCard[]): ReviewStatistics

// 获取记忆强度
getMemoryStrength(card: ReviewCard): number

// 获取复习倒计时
getTimeUntilReview(card: ReviewCard): string
```

#### 智能提取

```typescript
// 从AI回复中提取知识点
extractKeyConceptsFromAI(
  content: string,
  sessionId: string
): Array<{ question: string; answer: string; priority: 'low' | 'medium' | 'high'; tags: string[] }>
```

---

## 💾 数据结构

### ReviewCard 类型

```typescript
interface ReviewCard {
  id: string;                      // 唯一标识
  question: string;                // 问题
  answer: string;                  // 答案
  sessionId: string;               // 关联会话ID
  conceptId?: string;              // 关联知识点ID(可选)

  // SuperMemo-2 参数
  easeFactor: number;              // 难度因子 EF (1.3-2.5)
  interval: number;                // 距离上次复习的天数
  repetitions: number;             // 成功复习次数

  // 时间调度
  nextReviewDate: number;          // 下次复习时间(Unix timestamp)
  lastReviewDate?: number;         // 上次复习时间
  createdDate: number;             // 创建时间

  // 元数据
  priority: 'low' | 'medium' | 'high';  // 优先级
  tags: string[];                  // 标签数组
  reviewHistory: ReviewRecord[];   // 复习历史
}
```

### ReviewRecord 类型

```typescript
interface ReviewRecord {
  date: number;        // 复习时间
  quality: 1 | 2 | 3 | 4 | 5;  // 评分
  timeTaken: number;   // 耗时(毫秒)
}
```

### ReviewStatistics 类型

```typescript
interface ReviewStatistics {
  totalCards: number;           // 总卡片数
  dueCards: number;             // 待复习数
  reviewedToday: number;        // 今日已复习
  averageQuality: number;       // 平均质量
  averageEaseFactor: number;    // 平均EF
  memoryStrengthDistribution: {
    weak: number;      // 弱(0-40%)
    medium: number;    // 中(41-70%)
    strong: number;    // 强(71-100%)
  };
}
```

---

## 🚀 使用示例

### 1. 自动提取知识点

在Dashboard的"间隔重复"Tab中：
1. 点击"从笔记提取"按钮
2. 系统自动从最近的3条笔记中提取概念
3. 创建为复习卡片

### 2. 手动创建卡片

1. 点击"手动创建卡片"按钮
2. 填写问题和答案
3. 选择优先级和标签
4. 点击"创建卡片"

### 3. 开始复习

1. 有待复习卡片时，点击"开始复习"
2. 点击卡片查看答案
3. 选择评分(1-5)
4. 自动进入下一张卡片

### 4. 导出/导入Anki格式

1. 点击"Anki 导入/导出"按钮
2. **导出**: 点击"导出 JSON 文件"
3. **导入**: 粘贴JSON或选择文件，点击"导入卡片"

---

## 📈 学习统计

系统自动追踪以下指标：

### 复习统计
- 总卡片数
- 待复习数量
- 今日已复习
- 平均评分质量
- 平均难度因子

### 记忆强度分布
- **弱**(红色): 0-40% - 需要加强复习
- **中**(黄色): 41-70% - 稳步提升
- **强**(绿色): 71-100% - 掌握牢固

### 复习历史
每张卡片记录完整的复习历史：
- 复习时间
- 评分质量
- 回答耗时

---

## 🔄 数据持久化

### localStorage键名

```typescript
'cogniguide_review_cards'  // 所有复习卡片
```

### 自动保存时机
- 创建新卡片时
- 完成复习评分后
- 导入卡片时
- 删除卡片时

### 与会话关联
每张卡片通过`sessionId`关联到学习会话，Dashboard自动过滤当前会话的卡片。

---

## 🎯 最佳实践

### 1. 创建高质量卡片
- ✅ 问题具体明确
- ✅ 答案简洁准确
- ✅ 合理设置优先级
- ✅ 添加相关标签

### 2. 保持复习节奏
- ⏰ 每天定时复习
- 📊 优先处理高优先级卡片
- 🎯 诚实评分，确保算法准确性

### 3. 合理利用自动提取
- 📝 在AI教学中积累笔记
- 🔄 定期提取知识点
- ✏️ 手动优化提取的卡片

### 4. 导出备份
- 💾 定期导出卡片数据
- 📦 可导入Anki等其他工具
- 🔄 跨设备同步数据

---

## 📝 技术细节

### 依赖项
- React 18
- TypeScript 5
- Tailwind CSS 3

### 性能优化
- useCallback缓存函数
- useMemo缓存计算结果
- 虚拟滚动处理大量卡片
- localStorage异步操作

### 浏览器兼容性
- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- 移动浏览器: ✅ 完全支持

---

## 🔧 开发说明

### 添加新功能

1. **自定义评分标准**: 修改`processCardReview`函数
2. **调整算法参数**: 修改`calculateNewEaseFactor`函数
3. **扩展导入格式**: 在`AnkiImporter`中添加新解析器
4. **增加统计维度**: 扩展`ReviewStatistics`类型

### 调试技巧

```typescript
// 查看所有卡片
console.log(reviewCards);

// 查看待复习卡片
console.log(getDueCards(reviewCards));

// 查看统计数据
console.log(calculateStatistics(reviewCards));

// 测试算法
const result = processCardReview(card, 5, 3000);
console.log(result);
```

---

## 📚 参考资源

- [SuperMemo-2算法论文](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [艾宾浩斯遗忘曲线](https://en.wikipedia.org/wiki/Forgetting_curve)
- [Anki官方文档](https://docs.ankiweb.net/)

---

## 🎉 总结

CogniGuide的间隔重复学习系统是一个**完整的、生产级的**记忆强化工具，具有：

✅ 科学的算法基础
✅ 优雅的用户界面
✅ 完善的数据管理
✅ 灵活的扩展性

帮助用户**高效复习、长期记忆**，最大化学习效果！

---

**版本**: v1.0.0
**更新时间**: 2025-02-06
**作者**: CogniGuide Team
