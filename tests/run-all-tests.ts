/**
 * Main Test Runner
 * 运行所有测试套件
 */

import { runner } from './test-runner';

// Import all test files
import './mindMapHelpers.test';
import './storage.test';
import './app-logic.test';
// import './code-analysis.test'; // Requires fs module, may fail in browser context

// Run all tests
runner.run().then((success) => {
  if (success) {
    console.log('\n🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试失败，请检查上面的错误信息。');
    process.exit(1);
  }
}).catch((error) => {
  console.error('\n❌ 测试运行出错:', error);
  process.exit(1);
});
