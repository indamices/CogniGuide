# 3D知识图谱 - 快速开始

## 安装依赖

所有必要的依赖已安装到package.json：

```bash
npm install three @types/three 3d-force-graph
```

## 使用方式

### 1. 基本使用

在Dashboard中点击"查看脑图"按钮即可打开知识图谱。

### 2. 切换2D/3D视图

在知识图谱窗口顶部，有两个按钮：
- 📊 **2D 视图** - 传统的树形图谱（D3.js）
- 🌐 **3D 视图** - 新的交互式3D图谱（Three.js）

### 3. 3D视图控制

| 操作 | 功能 |
|------|------|
| 鼠标左键拖拽 | 旋转视角 |
| 鼠标滚轮 | 缩放 |
| 鼠标右键拖拽 | 平移 |
| 点击节点 | 聚焦高亮 |
| 右键点击 | 重置视图 |

### 4. 功能按钮

**控制面板（右上角）：**
- 🔄 自动旋转 - 开启/关闭自动旋转
- 🎯 重置视图 - 恢复初始视角
- 📷 导出图片 - 保存当前视图为PNG
- 🔳 全屏 - 全屏模式

## 技术架构

### 文件结构
```
components/
├── KnowledgeMap.tsx           # 2D D3.js图谱（保留）
├── OptimizedKnowledgeMap.tsx  # 优化版2D图谱
├── KnowledgeMap3D.tsx         # 新的3D图谱
└── KnowledgeMapSwitcher.tsx   # 2D/3D切换器

utils/
├── graphLayout.ts             # 布局算法
└── graphVisuals.ts            # 视觉效果
```

### 数据流程
```
App.tsx
  └─ Dashboard.tsx
      └─ KnowledgeMapSwitcher.tsx
          ├─ KnowledgeMap2D (OptimizedKnowledgeMap)
          └─ KnowledgeMap3D
              ├─ 3d-force-graph
              └─ Three.js
```

## 性能优化

### 1. 懒加载
3D组件按需加载，不影响初始页面加载速度。

### 2. 设备自适应
自动检测设备性能，低端设备自动优化：
- 减少粒子数量
- 降低节点分辨率
- 关闭阴影效果

### 3. LOD系统
大规模图谱自动使用LOD：
- 近距离：高精度
- 中距离：中等精度
- 远距离：低精度

## 自定义

### 修改颜色主题

编辑 `components/KnowledgeMap3D.tsx`：

```typescript
const masteryColors: Record<MasteryLevel, { main: string; glow: string; emissive: string }> = {
  [MasteryLevel.Expert]: {
    main: '#10b981',    // 修改这里
    glow: '#34d399',
    emissive: '#064e3b'
  },
  // ...
};
```

### 调整布局参数

编辑 `utils/graphLayout.ts`：

```typescript
const config: ForceLayoutConfig = {
  nodeCharge: -100,      // 节点排斥力
  linkDistance: 100,     // 连接距离
  linkStrength: 0.1,     // 连接强度
  iterations: 300        // 迭代次数
};
```

### 添加自定义效果

编辑 `utils/graphVisuals.ts`：

```typescript
export function createCustomEffect(scene: THREE.Scene) {
  // 你的自定义效果
}
```

## 浏览器要求

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要WebGL支持。

## 故障排除

### 3D图不显示
1. 检查浏览器控制台错误
2. 确认WebGL可用：访问 `chrome://gpu`
3. 更新显卡驱动

### 性能问题
1. 关闭自动旋转
2. 减少节点数量（筛选掌握度）
3. 使用2D视图作为备选

### 移动端显示异常
1. 使用最新的浏览器版本
2. 确保有足够内存
3. 关闭其他应用

## 下一步

- 查看 `docs/3D_KNOWLEDGE_GRAPH_GUIDE.md` 了解更多细节
- 探索 `utils/graphLayout.ts` 中的高级算法
- 自定义 `utils/graphVisuals.ts` 中的视觉效果

## 支持

如有问题，请创建Issue或联系开发团队。

---

**版本:** 1.0.0
**最后更新:** 2026-02-06
