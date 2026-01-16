/**
 * Simple Test Runner for CogniGuide
 * 自动化测试运行器
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface TestSuite {
  name: string;
  tests: Array<() => Promise<void> | void>;
}

class TestRunner {
  private suites: TestSuite[] = [];
  private results: TestResult[] = [];
  private passed = 0;
  private failed = 0;

  describe(name: string, callback: () => void) {
    const suite: TestSuite = { name, tests: [] };
    const originalIt = this.it.bind(this);
    
    // Create a scoped it function for this describe block
    const scopedIt = (testName: string, testFn: () => Promise<void> | void) => {
      suite.tests.push(async () => {
        const result: TestResult = {
          name: `${name} > ${testName}`,
          passed: false,
          duration: 0
        };
        const start = Date.now();
        try {
          const res = testFn();
          if (res instanceof Promise) {
            await res;
          }
          result.passed = true;
          result.duration = Date.now() - start;
          this.results.push(result);
          this.passed++;
        } catch (err: any) {
          result.error = err.message || String(err);
          result.duration = Date.now() - start;
          this.results.push(result);
          this.failed++;
        }
      });
    };
    
    // Temporarily override it for this describe block
    const originalItVar = this.it;
    this.it = scopedIt;
    
    try {
      callback();
    } finally {
      // Restore original it
      this.it = originalItVar;
    }
    
    this.suites.push(suite);
  }

  it(name: string, testFn: () => Promise<void> | void) {
    // This will be replaced by describe
    throw new Error(`it() called outside of describe(). Use it inside a describe block.`);
  }

  async run() {
    console.log('\n🧪 开始运行自动化测试...\n');
    
    for (const suite of this.suites) {
      console.log(`\n📦 ${suite.name}`);
      for (const test of suite.tests) {
        await test();
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果摘要');
    console.log('='.repeat(60));
    
    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(`${icon} ${result.name}`);
      console.log(`   ${status} (${result.duration}ms)`);
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`总计: ${this.passed + this.failed} 个测试`);
    console.log(`✅ 通过: ${this.passed}`);
    console.log(`❌ 失败: ${this.failed}`);
    console.log('='.repeat(60) + '\n');

    return this.failed === 0;
  }
}

// Assertion helpers
export const assert = {
  equal: (actual: any, expected: any, message?: string) => {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${expected}, but got ${actual}`
      );
    }
  },
  notEqual: (actual: any, expected: any, message?: string) => {
    if (actual === expected) {
      throw new Error(
        message || `Expected not ${expected}, but got ${actual}`
      );
    }
  },
  isTrue: (value: any, message?: string) => {
    if (!value) {
      throw new Error(message || `Expected true, but got ${value}`);
    }
  },
  isFalse: (value: any, message?: string) => {
    if (value) {
      throw new Error(message || `Expected false, but got ${value}`);
    }
  },
  isNull: (value: any, message?: string) => {
    if (value !== null) {
      throw new Error(message || `Expected null, but got ${value}`);
    }
  },
  isNotNull: (value: any, message?: string) => {
    if (value === null) {
      throw new Error(message || `Expected not null, but got null`);
    }
  },
  isUndefined: (value: any, message?: string) => {
    if (value !== undefined) {
      throw new Error(message || `Expected undefined, but got ${value}`);
    }
  },
  isDefined: (value: any, message?: string) => {
    if (value === undefined) {
      throw new Error(message || `Expected defined value, but got undefined`);
    }
  },
  throws: (fn: () => void, message?: string) => {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (e) {
      // Expected
    }
  },
  deepEqual: (actual: any, expected: any, message?: string) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
      );
    }
  }
};

export const runner = new TestRunner();
// Export bound methods
export function describe(name: string, callback: () => void) {
  runner.describe(name, callback);
}

export function it(name: string, testFn: () => Promise<void> | void) {
  runner.it(name, testFn);
}

// Export for use in test files
export default runner;
