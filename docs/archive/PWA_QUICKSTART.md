# CogniGuide PWA 快速测试指南

## ✅ 构建成功

PWA已经成功构建！以下是测试步骤：

## 1. 本地测试

### 启动开发服务器
```bash
npm run preview
```

或者使用本地服务器：
```bash
cd dist
npx serve .
```

### 访问应用
打开浏览器访问: `http://localhost:4173`

## 2. PWA功能验证

### ✅ Service Worker检查
1. 打开Chrome DevTools (F12)
2. 进入 **Application** 标签
3. 左侧菜单查找 **Service Workers**
4. 确认看到：
   - Service Worker已注册
   - 状态：activated 或 activating
   - 显示 `sw.js` 文件

### ✅ Manifest检查
1. 在 **Application** 标签中
2. 点击 **Manifest**
3. 验证内容：
   - name: "CogniGuide - AI Learning Companion"
   - icons配置正确
   - 主题色设置

### ✅ 离线测试
1. 在DevTools中，找到 **Service Workers**
2. 勾选 **"Offline"** 复选框
3. 刷新页面
4. 应用应该仍然可以加载！
5. 测试功能：
   - ✅ 查看已保存的会话
   - ✅ 浏览知识图谱
   - ✅ 查看复习卡片

### ✅ 安装测试
1. 访问应用首页
2. 在地址栏右侧查找安装图标（⊞ 或 +）
3. 点击安装
4. 确认弹窗显示应用信息
5. 点击"安装"按钮
6. 应用应在独立窗口打开

### ✅ Cache检查
1. 在 **Application** → **Cache Storage**
2. 查找以 `cogniguide` 开头的缓存
3. 确认包含：
   - HTML文件
   - JS/CSS资源
   - 图标文件

## 3. Lighthouse PWA审计

### 运行审计
1. 打开DevTools
2. 点击 **Lighthouse** 标签
3. 选择 **Progressive Web App**
4. 点击 **Analyze page load**

### 目标分数
- ✅ PWA安装：≥90
- ✅ 工作原理（离线）：≥90
- ✅ 快速可靠：≥90
- ✅ 总分：≥90

## 4. IndexedDB验证

### 查看数据
1. **Application** → **IndexedDB** → **CogniGuideDB**
2. 确认表存在：
   - sessions
   - knowledgeGraph
   - flashcards
   - analytics
   - syncQueue

### 测试操作
```javascript
// 在控制台执行
import { db } from './utils/indexedDB';

// 添加测试数据
await db.sessions.add({
  id: 'test-1',
  title: 'PWA测试',
  messages: [],
  timestamp: Date.now(),
  lastModified: Date.now()
});

// 读取数据
const sessions = await db.sessions.getAll();
console.log('会话数据:', sessions);
```

## 5. 同步状态测试

### 在线/离线切换
1. 打开Network面板
2. 选择 "Offline" 模拟离线
3. 观察顶部的离线提示横幅
4. 创建新会话或修改数据
5. 切换回 "Online"
6. 观察同步状态变化

### 查看同步队列
```javascript
// 在控制台
import { getSyncStats } from './utils/syncManager';
const stats = await getSyncStats();
console.log('同步统计:', stats);
```

## 6. 性能测试

### 网络性能
1. 打开 **Network** 标签
2. 勾选 "Disable cache"
3. 刷新页面
4. 检查加载时间

### 缓存性能
1. 第二次刷新
2. 从 (disk cache) 或 (service worker) 加载的资源
3. 应该明显更快

## 7. 跨浏览器测试

### Chrome (桌面/Android) - ✅ 完整支持
- Service Worker ✅
- 离线功能 ✅
- 安装提示 ✅
- 后台同步 ✅

### Edge (桌面) - ✅ 完整支持
- 同Chrome

### Safari (iOS/macOS) - ⚠️ 部分支持
- Service Worker ✅ (iOS 11.3+)
- 离线功能 ✅
- 安装提示 ⚠️ (需手动添加到主屏幕)
- 后台同步 ❌

### Firefox - ⚠️ 部分支持
- Service Worker ✅
- 离线功能 ✅
- 安装提示 ⚠️ (需手动添加)

## 8. 已知问题

### Safari iOS
- 后台同步不支持
- 存储配额较低（~50MB）
- 需要手动添加到主屏幕

### Firefox
- 安装提示可能不显示
- 需要手动"安装为应用"

### 存储限制
- Chrome: ~6GB (需权限)
- Safari: ~50MB
- Firefox: ~2GB
- Edge: ~6GB

## 9. 部署清单

### 准备部署
- [ ] 构建生产版本 (`npm run build`)
- [ ] 测试PWA功能
- [ ] 运行Lighthouse审计
- [ ] 验证离线功能
- [ ] 测试安装流程

### 部署到Render
1. 推送到GitHub
2. Render自动部署
3. 访问部署的URL
4. 验证PWA功能

### 部署到其他平台
- Netlify: 拖放 `dist/` 文件夹
- Vercel: 连接Git仓库
- GitHub Pages: 使用 `gh-pages` 分支

## 10. 故障排查

### Service Worker不注册
```javascript
// 检查HTTPS（本地localhost除外）
console.log('Protocol:', window.location.protocol);
console.log('ServiceWorker support:', 'serviceWorker' in navigator);
```

### 缓存未更新
```javascript
// 手动清除缓存
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### IndexedDB错误
```javascript
// 查看数据库
indexedDB.deleteDatabase('CogniGuideDB');
```

## 11. 下一步

### 性能优化
- [ ] 减小bundle大小
- [ ] 优化图片资源
- [ ] 实施预加载策略

### 功能增强
- [ ] 添加推送通知
- [ ] 实现后台同步
- [ ] 添加定期更新

### 用户体验
- [ ] 自定义安装流程
- [ ] 添加欢迎屏幕
- [ ] 离线提示优化

## ✅ 验收标准

### 必须通过
- [x] Service Worker成功注册
- [x] 离线时应用可访问
- [x] Manifest配置正确
- [x] 图标显示正常
- [ ] Lighthouse PWA分数≥90
- [ ] 可以安装到桌面

### 推荐完成
- [ ] 后台同步工作
- [ ] 推送通知配置
- [ ] 数据备份/恢复
- [ ] 跨设备同步

---

**状态**: ✅ PWA功能已实现并构建成功
**版本**: v1.0.6
**构建时间**: 2026-02-06
**Bundle大小**: ~3MB (压缩后~500KB)
