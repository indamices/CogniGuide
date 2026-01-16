/**
 * Tests for storage utility functions
 */

import { describe, it, assert, runner } from './test-runner';
import safeStorage from '../utils/storage';

// Mock localStorage for testing
class MockStorage {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

describe('safeStorage', () => {
  let mockStorage: MockStorage;
  let originalWindow: any;

  // Setup mock before tests - this runs when describe is called
  mockStorage = new MockStorage();
  originalWindow = (global as any).window;
  
  // Mock window.localStorage properly for Node.js environment
  if (typeof (global as any).window === 'undefined') {
    (global as any).window = {} as any;
  }
  
  // Set up localStorage mock that mimics browser behavior
  Object.defineProperty((global as any).window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true
  });

  it('should get item from localStorage', () => {
    mockStorage.setItem('test_key', 'test_value');
    const result = safeStorage.getItem('test_key');
    assert.equal(result, 'test_value');
  });

  it('should return null for non-existent key', () => {
    const result = safeStorage.getItem('non_existent');
    assert.isNull(result);
  });

  it('should set item to localStorage', () => {
    const success = safeStorage.setItem('test_key', 'test_value');
    assert.isTrue(success);
    assert.equal(mockStorage.getItem('test_key'), 'test_value');
  });

  it('should remove item from localStorage', () => {
    mockStorage.setItem('test_key', 'test_value');
    const success = safeStorage.removeItem('test_key');
    assert.isTrue(success);
    assert.isNull(mockStorage.getItem('test_key'));
  });

  it('should handle JSON serialization', () => {
    const testData = { name: 'Test', value: 123 };
    const success = safeStorage.setJSON('test_key', testData);
    assert.isTrue(success);
    
    const result = safeStorage.getJSON('test_key');
    assert.deepEqual(result, testData);
  });

  it('should handle getJSON for non-existent key', () => {
    const result = safeStorage.getJSON('non_existent');
    assert.isNull(result);
  });

  it('should handle getJSON for invalid JSON', () => {
    mockStorage.setItem('invalid_json', 'not valid json{');
    const result = safeStorage.getJSON('invalid_json');
    // Should handle error gracefully and return null
    assert.isNull(result, '无效的JSON应该返回null');
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const throwingStorage = {
      getItem: () => { throw new Error('Storage quota exceeded'); },
      setItem: () => { throw new Error('Storage quota exceeded'); },
      removeItem: () => { throw new Error('Storage error'); }
    };
    
    (global as any).window.localStorage = throwingStorage;
    
    // Should not throw, but return null/false
    const getResult = safeStorage.getItem('test');
    assert.isNull(getResult);
    
    const setResult = safeStorage.setItem('test', 'value');
    assert.isFalse(setResult);
    
    const removeResult = safeStorage.removeItem('test');
    assert.isFalse(removeResult);
    
    // Restore mock storage
    (global as any).window.localStorage = mockStorage;
  });

  it('should handle missing window object (SSR)', () => {
    const savedWindow = (global as any).window;
    delete (global as any).window;
    
    const getResult = safeStorage.getItem('test');
    assert.isNull(getResult);
    
    const setResult = safeStorage.setItem('test', 'value');
    assert.isFalse(setResult);
    
    const removeResult = safeStorage.removeItem('test');
    assert.isFalse(removeResult);
    
    // Restore window
    (global as any).window = savedWindow || { localStorage: mockStorage };
  });
});

if (import.meta.url === `file://${process.argv[1]}`) {
  runner.run().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
