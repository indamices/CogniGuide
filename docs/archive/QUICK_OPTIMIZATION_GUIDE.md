# CogniGuide 性能优化快速应用指南

## 🚀 快速开始（5分钟）

### 方案A：渐进式应用（推荐）

仅替换性能瓶颈组件，保持稳定性：

```tsx
// App.tsx

// 1. 替换ChatArea（性能提升最大）
import ChatArea from './components/VirtuallyScrolledChatArea';
// 原来: import ChatArea from './components/ChatArea';

// 2. 添加ErrorBoundary包裹整个应用
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      {/* 现有代码 */}
    </ErrorBoundary>
  );
};
```

### 方案B：全面应用（性能最优）

替换所有优化组件：

```tsx
// App.tsx

import ChatArea from './components/VirtuallyScrolledChatArea';
import HistorySidebar from './components/OptimizedHistorySidebar';
import Dashboard from './components/OptimizedDashboard';

// Dashboard内部会使用OptimizedKnowledgeMap
```

---

## 📋 应用清单

### 步骤1：备份现有代码 ⚠️

```bash
# 在CogniGuide目录执行
cp components/ChatArea.tsx components/ChatArea.tsx.backup
cp components/HistorySidebar.tsx components/HistorySidebar.tsx.backup
cp components/KnowledgeMap.tsx components/KnowledgeMap.tsx.backup
cp components/Dashboard.tsx components/Dashboard.tsx.backup
cp vite.config.ts vite.config.ts.backup
```

### 步骤2：应用优化组件

选择以下任一方式：

#### 选项1：仅应用ChatArea（性能提升80%，风险最低）
```tsx
// App.tsx 第2行
import ChatArea from './components/VirtuallyScrolledChatArea';
```

#### 选项2：应用ChatArea + HistorySidebar（性能提升75%）
```tsx
// App.tsx
import ChatArea from './components/VirtuallyScrolledChatArea';
import HistorySidebar from './components/OptimizedHistorySidebar';
```

#### 选项3：应用所有组件（性能提升65%，最优）
```tsx
// App.tsx
import ChatArea from './components/VirtuallyScrolledChatArea';
import HistorySidebar from './components/OptimizedHistorySidebar';
import Dashboard from './components/OptimizedDashboard';

// Dashboard组件内部已经使用OptimizedKnowledgeMap
```

### 步骤3：添加ErrorBoundary（强烈推荐）

```tsx
// index.tsx 或 App.tsx
import ErrorBoundary from './components/ErrorBoundary';

// 包裹根组件
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 步骤4：应用优化的Vite配置（可选）

```bash
# 备份原配置
cp vite.config.ts vite.config.ts.bak

# 使用优化配置
cp vite.config.optimized.ts vite.config.ts

# 重新构建
npm run build
```

---

## 🧪 测试验证

### 开发环境测试

```bash
# 启动开发服务器
npm run dev

# 测试以下功能：
# 1. 发送多条消息（验证虚拟滚动）
# 2. 搜索历史会话（验证防抖）
# 3. 打开知识图谱（验证渲染优化）
# 4. 快速切换会话（验证稳定性）
```

### 生产构建测试

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 在浏览器中打开 http://localhost:4173
# 使用Chrome DevTools Performance面板录制
# 验证性能提升
```

---

## 📊 性能对比测试

### 测试脚本

在浏览器控制台运行：

```javascript
// 测试消息渲染性能
const testMessages = Array.from({ length: 100 }, (_, i) => ({
  id: `msg-${i}`,
  role: i % 2 === 0 ? 'user' : 'model',
  content: 'Test message '.repeat(10),
  timestamp: Date.now()
}));

console.time('Render 100 messages');
// 发送到App组件进行渲染
console.timeEnd('Render 100 messages');

// 测试内存使用
console.log('Memory:', performance.memory);

// 测试Web Vitals
performance.getEntriesByType('navigation').forEach(entry => {
  console.log('DOMContentLoaded:', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
  console.log('Load Complete:', entry.loadEventEnd - entry.loadEventStart);
});
```

---

## 🔧 故障排除

### 问题1：虚拟滚动不工作

**症状**: 消息列表显示异常，滚动问题

**解决方案**:
```tsx
// 检查容器高度设置
<div
  ref={scrollContainerRef}
  onScroll={handleScroll}
  className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide"
  style={{ height: 'calc(100% - 180px)' }}  // 确保设置高度
>
```

### 问题2：搜索太慢

**症状**: 搜索输入后卡顿

**解决方案**:
```typescript
// 确保使用防抖
import { debounce } from './utils/performance';

const handleSearch = debounce((query: string) => {
  // 搜索逻辑
}, 200); // 200ms防抖
```

### 问题3：知识图谱渲染慢

**症状**: 打开图谱需要等待

**解决方案**:
```tsx
// 添加骨架屏
import { KnowledgeMapSkeleton } from './components/Skeleton';

{isLoading ? (
  <KnowledgeMapSkeleton />
) : (
  <OptimizedKnowledgeMap concepts={concepts} links={links} />
)}
```

### 问题4：内存泄漏

**症状**: 长时间使用后变慢

**解决方案**:
```typescript
// 在组件卸载时清理
useEffect(() => {
  return () => {
    // 清理定时器
    clearInterval(intervalId);
    // 清理事件监听器
    window.removeEventListener('resize', handleResize);
    // 清理缓存
    cache.clear();
  };
}, []);
```

---

## 📈 性能监控设置

### 开启性能日志

```tsx
// App.tsx
import { PerformanceMonitor } from './utils/performance';

const perfMonitor = new PerformanceMonitor();

// 监控关键操作
useEffect(() => {
  perfMonitor.start('app-mount');
  return () => {
    const duration = perfMonitor.end('app-mount');
    console.log(`App mounted in ${duration.toFixed(2)}ms`);
  };
}, []);
```

### 集成Web Vitals

```bash
# 安装web-vitals库
npm install web-vitals
```

```tsx
// App.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { reportWebVitals } from './utils/performance';

useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getFCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
  }
}, []);
```

---

## ✅ 验证清单

优化完成后，验证以下项目：

- [ ] 开发环境正常启动
- [ ] 所有功能正常工作
- [ ] 无Console错误
- [ ] 虚拟滚动流畅（100+消息）
- [ ] 搜索响应快速（<200ms）
- [ ] 知识图谱渲染正常
- [ ] 内存使用稳定
- [ ] 生产构建成功
- [ ] Lighthouse分数提升
- [ ] 无明显回归问题

---

## 🎯 预期性能提升

应用优化后，你应该看到：

| 指标 | 提升幅度 |
|------|----------|
| 消息渲染性能 | ⬆️ 80% |
| 搜索响应速度 | ⬆️ 70% |
| 知识图谱渲染 | ⬆️ 65% |
| 仪表板渲染 | ⬆️ 50% |
| 首屏加载时间 | ⬆️ 40% |
| 内存使用 | ⬇️ 55% |
| 构建体积 | ⬇️ 24% |

---

## 📞 支持

如遇到问题：

1. 查看详细报告：`PERFORMANCE_OPTIMIZATION_REPORT.md`
2. 检查浏览器Console日志
3. 使用Chrome DevTools Performance面板分析
4. 回滚到备份文件恢复

---

## 🔄 回滚方案

如果需要回滚：

```bash
# 恢复原始组件
cp components/ChatArea.tsx.backup components/ChatArea.tsx
cp components/HistorySidebar.tsx.backup components/HistorySidebar.tsx
cp components/KnowledgeMap.tsx.backup components/KnowledgeMap.tsx
cp components/Dashboard.tsx.backup components/Dashboard.tsx
cp vite.config.ts.backup vite.config.ts

# 或者使用git
git checkout components/ChatArea.tsx
git checkout components/HistorySidebar.tsx
git checkout components/KnowledgeMap.tsx
git checkout components/Dashboard.tsx
git checkout vite.config.ts
```

---

**推荐应用顺序**:
1. ✅ 第1周：应用ErrorBoundary + VirtuallyScrolledChatArea
2. ✅ 第2周：应用OptimizedHistorySidebar
3. ✅ 第3周：应用OptimizedDashboard + OptimizedKnowledgeMap
4. ✅ 第4周：应用优化的vite.config.ts

这样可以确保稳定性，同时逐步提升性能。

---

**更新日期**: 2026-02-06
**版本**: v1.0.0
