/**
 * Safe LocalStorage Access Utility
 * 提供对 localStorage 的安全访问，处理可能的异常（如隐身模式、浏览器限制等）
 */

const safeStorage = {
  /**
   * 安全地从 localStorage 获取数据
   */
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') {
        console.warn('Cannot access localStorage: window is not defined (SSR or test environment)');
        return null;
      }
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`Failed to get localStorage item "${key}":`, e);
      return null;
    }
  },

  /**
   * 安全地设置 localStorage 数据
   */
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') {
        console.warn('Cannot access localStorage: window is not defined (SSR or test environment)');
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`Failed to set localStorage item "${key}":`, e);
      return false;
    }
  },

  /**
   * 安全地从 localStorage 删除数据
   */
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') {
        console.warn('Cannot access localStorage: window is not defined (SSR or test environment)');
        return false;
      }
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`Failed to remove localStorage item "${key}":`, e);
      return false;
    }
  },

  /**
   * 获取并解析 JSON 数据
   */
  getJSON: <T>(key: string): T | null => {
    try {
      const item = safeStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`Failed to parse JSON from localStorage item "${key}":`, e);
      return null;
    }
  },

  /**
   * 将对象序列化并存储到 localStorage
   */
  setJSON: (key: string, value: any): boolean => {
    try {
      const serialized = JSON.stringify(value);
      return safeStorage.setItem(key, serialized);
    } catch (e) {
      console.warn(`Failed to serialize and set localStorage item "${key}":`, e);
      return false;
    }
  }
};

export default safeStorage;
