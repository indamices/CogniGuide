/**
 * 性能工具函数集合
 * 提供防抖、节流、缓存等性能优化工具
 */

/**
 * 防抖函数 - 延迟执行，在指定时间内多次触发只执行最后一次
 * @param func 要执行的函数
 * @param wait 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * 节流函数 - 指定时间内只执行一次
 * @param func 要执行的函数
 * @param limit 时间间隔（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * 简单的LRU缓存实现
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // 重新插入以更新顺序
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // 删除旧值（如果存在）
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超过最大大小，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * 带TTL的缓存
 */
export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiry: number }>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  set(key: K, value: V, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期项
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  get size(): number {
    // 清理过期项后返回大小
    this.cleanup();
    return this.cache.size;
  }
}

/**
 * 异步函数缓存装饰器
 * 缓存异步函数的结果
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl: number = 60000
): T {
  const cache = new TTLCache<string, Awaited<ReturnType<T>>>(ttl);

  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached as Awaited<ReturnType<T>>;
    }

    const result = await func(...args);
    cache.set(key, result as Awaited<ReturnType<T>>);
    return result;
  }) as unknown as T;
}

/**
 * 批处理函数 - 将多次调用合并为一次执行
 */
export function batch<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0
): (...args: Parameters<T>) => void {
  let argsQueue: Parameters<T>[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    argsQueue.push(args);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (argsQueue.length > 0) {
        // 批量处理所有参数
        func.apply(this, [argsQueue] as any);
        argsQueue = [];
      }
      timeoutId = null;
    }, wait);
  };
}

/**
 * 性能监控 - 测量函数执行时间
 */
export class PerformanceMonitor {
  private marks: Map<string, number>;

  constructor() {
    this.marks = new Map();
  }

  /**
   * 开始计时
   */
  start(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * 结束计时并返回耗时（毫秒）
   */
  end(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`Performance mark "${name}" not found`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    this.marks.delete(name);

    return duration;
  }

  /**
   * 测量函数执行时间
   */
  measure<T extends (...args: any[]) => any>(
    name: string,
    func: T
  ): T {
    return ((...args: any[]) => {
      this.start(name);
      const result = func(...args);
      const duration = this.end(name);

      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

      return result;
    }) as T;
  }

  /**
   * 异步测量函数执行时间
   */
  async measureAsync<T extends (...args: any[]) => Promise<any>>(
    name: string,
    func: T
  ): Promise<ReturnType<T>> {
    this.start(name);
    const result = await func();
    const duration = this.end(name);

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    return result;
  }
}

/**
 * 虚拟滚动计算辅助函数
 */
export function calculateVisibleRange(
  scrollTop: number,
  viewportHeight: number,
  itemHeight: number,
  totalItems: number,
  buffer: number = 3
): { startIndex: number; endIndex: number; offsetY: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer
  );
  const offsetY = startIndex * itemHeight;

  return { startIndex, endIndex, offsetY };
}

/**
 * 格式化性能数据
 */
export function formatPerformanceData(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Web Vitals 监控
 */
export function reportWebVitals(metric: {
  name: string;
  value: number;
  id: string;
}): void {
  // 这里可以发送到分析服务
  console.log('[Web Vitals]', metric);

  // 也可以保存到sessionStorage用于调试
  try {
    const vitals = JSON.parse(sessionStorage.getItem('web_vitals') || '{}');
    vitals[metric.name] = {
      value: metric.value,
      id: metric.id,
      timestamp: Date.now()
    };
    sessionStorage.setItem('web_vitals', JSON.stringify(vitals));
  } catch (e) {
    console.warn('无法保存Web Vitals到sessionStorage');
  }
}

/**
 * 内存使用监控（仅部分浏览器支持）
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }
  return null;
}

/**
 * 检测设备性能等级
 */
export function getDevicePerformanceLevel(): 'low' | 'medium' | 'high' {
  // 硬件并发数
  const concurrency = navigator.hardwareConcurrency || 2;

  // 设备内存（仅部分浏览器支持）
  const memory = (navigator as any).deviceMemory || 4; // 默认假设4GB

  // 网络连接类型
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType; // 'slow-2g', '2g', '3g', '4g'

  // 简单评分
  let score = 0;

  // CPU核心数评分
  if (concurrency >= 8) score += 3;
  else if (concurrency >= 4) score += 2;
  else score += 1;

  // 内存评分
  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else score += 1;

  // 网络评分
  if (effectiveType === '4g') score += 3;
  else if (effectiveType === '3g') score += 2;
  else score += 1;

  // 总分范围 3-9
  if (score >= 7) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

/**
 * 根据设备性能调整配置
 */
export function getPerformanceConfig() {
  const level = getDevicePerformanceLevel();

  const configs = {
    low: {
      animationsEnabled: false,
      maxCacheSize: 50,
      debounceTime: 300,
      throttleTime: 200,
      virtualScrollEnabled: true,
      lazyLoadImages: true
    },
    medium: {
      animationsEnabled: true,
      maxCacheSize: 100,
      debounceTime: 200,
      throttleTime: 150,
      virtualScrollEnabled: true,
      lazyLoadImages: true
    },
    high: {
      animationsEnabled: true,
      maxCacheSize: 200,
      debounceTime: 100,
      throttleTime: 100,
      virtualScrollEnabled: false,
      lazyLoadImages: false
    }
  };

  return configs[level];
}
