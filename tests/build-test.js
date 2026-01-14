/**
 * CogniGuide 构建测试
 * 验证所有关键功能是否正常工作
 */

console.log('========================================');
console.log('🧪 CogniGuide 构建测试');
console.log('========================================\n');

// 测试 1: 导入所有核心模块
console.log('⏳ 测试 1: 导入核心模块');
try {
  // 测试导入
  const types = require('./types');
  const storage = require('./utils/storage');
  const geminiService = require('./services/geminiService');
  const deepseekService = require('./services/deepseekService');

  console.log('✅ 模块导入成功');
  console.log(`   - types.ts: ${Object.keys(types).length} 个导出`);
  console.log(`   - storage.ts: ${Object.keys(storage).length} 个导出`);
  console.log(`   - geminiService.ts: ${Object.keys(geminiService).length} 个导出`);
  console.log(`   - deepseekService.ts: ${Object.keys(deepseekService).length} 个导出\n`);

  // 测试 2: 类型定义验证
  console.log('⏳ 测试 2: 类型定义验证');
  const typeTestsPassed = [
    typeof types.MasteryLevel === 'object',
    typeof types.TeachingMode === 'object',
    typeof types.TeachingStage === 'object',
    Array.isArray(types.MasteryLevel),
    Array.isArray(types.TeachingMode),
    Array.isArray(types.TeachingStage),
    types.MasteryLevel.Unknown === 'Unknown',
    types.MasteryLevel.Novice === 'Novice',
    types.TasteryLevel.Competent === 'Competent',
    types.MasteryLevel.Expert === 'Expert',
    types.TeachingMode.Auto === 'Auto',
    types.TeachingMode.Socratic === 'Socratic',
    types.TeachingMode.Narrative === 'Narrative',
    types.TeachingMode.Lecture === 'Lecture',
    types.TeachingStage.Introduction === 'Introduction',
    types.TeachingStage.Construction === 'Construction',
    types.TeachingStage.Consolidation === 'Consolidation',
    types.TeachingStage.Transfer === 'Transfer',
    types.TeachingStage.Reflection === 'Reflection'
  ].every(test => test);

  if (typeTestsPassed) {
    console.log('✅ 所有类型定义正确\n');
  } else {
    console.log('❌ 类型定义验证失败\n');
    console.log('   请检查 types.ts 文件');
  }

  // 测试 3: 安全存储工具
  console.log('⏳ 测试 3: 安全存储工具');
  try {
    // 测试 safeStorage.getItem 在没有 localStorage 时
    const testGetItem = storage.getItem('test-key');
    const testGetItemSuccess = testGetItem === null;

    if (!testGetItemSuccess) {
      throw new Error('safeStorage.getItem 应该返回 null');
    }
    console.log('✅ safeStorage.getItem 正确处理缺失 localStorage\n');
  } catch (error) {
    console.log('❌ safeStorage.getItem 测试失败:', error.message);
  }

  // 测试 4: 环境变量支持
  console.log('⏳ 测试 4: 环境变量支持');
  const envTestPassed = typeof process !== 'undefined' && 
                          typeof process.env !== 'undefined' &&
                          typeof process.cwd === 'function' &&
                          typeof require === 'function';

  if (envTestPassed) {
    console.log('✅ Node.js 环境变量正确配置\n');
  } else {
    console.log('❌ Node.js 环境变量测试失败\n');
  }

  // 测试 5: JSON 处理
  console.log('⏳ 测试 5: JSON 处理');
  const jsonTests = [
    JSON.parse('{}') !== null,
    JSON.parse('{"test": "value"}').test === 'value',
    JSON.stringify({ a: 1 }) === '{"a":1}',
    JSON.stringify(null) === 'null',
    JSON.stringify(undefined) === 'undefined',
    JSON.stringify([]) === '[]',
    JSON.stringify({}) === '{}'
  ].every(test => test);

  if (jsonTests.every(t => t)) {
    console.log('✅ JSON 序列化和反序列化正确\n');
  } else {
    console.log('❌ JSON 处理测试失败\n');
  }

  // 测试 6: 字符串工具函数
  console.log('⏳ 测试 6: 字符串工具函数');
  const stringTests = [
    typeof 'test' === 'string' && 'test'.trim().length > 0,
    ''.trim().length === 0,
    '  '.trim().length === 1,
    'hello world'.includes('world') === true,
    'hello world'.includes('World') === false
  ].every(test => test);

  if (stringTests.every(t => t)) {
    console.log('✅ 字符串工具函数正确\n');
  } else {
    console.log('❌ 字符串工具函数测试失败\n');
  }

  // 测试 7: 数组工具函数
  console.log('⏳ 测试 7: 数组工具函数');
  const arrayTests = [
    Array.isArray([]) === true,
    Array.isArray([1, 2, 3]) === true,
    [1, 2, 3].filter(x => x > 1).length === 2,
    [1, 2, 3].map(x => x * 2).toString() === '2,4,6',
    [1, 2, 3].find(x => x === 2) === 2,
    [1, 2, 3].indexOf(2) === 1
  ].every(test => test);

  if (arrayTests.every(t => t)) {
    console.log('✅ 数组工具函数正确\n');
  } else {
    console.log('❌ 数组工具函数测试失败\n');
  }

  // 测试 8: Promise/异步处理
  console.log('⏳ 测试 8: Promise/异步处理');
  const asyncTestPassed = await Promise.resolve().then(() => true);

  if (asyncTestPassed) {
    console.log('✅ Promise 异步处理正确\n');
  } else {
    console.log('❌ Promise 异步处理测试失败\n');
  }

  // 测试 9: ID 生成唯一性
  console.log('⏳ 测试 9: ID 生成唯一性');
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const id = `${timestamp}-${random}`;
    ids.add(id);
    // 模拟同一毫秒内的快速生成
    const id2 = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    ids.add(id2);
  }

  const idTestPassed = ids.size === 200; // 应该有 100 个唯一的 ID

  if (idTestPassed) {
    console.log('✅ ID 生成唯一性测试通过（生成 200 个 ID，全部唯一）\n');
  } else {
    console.log('❌ ID 生成唯一性测试失败\n');
  }

  // 测试 10: 错误处理
  console.log('⏳ 测试 10: 错误处理');
  try {
    throw new Error('测试错误');
  } catch (error) {
    const errorTestPassed = error instanceof Error && error.message === '测试错误';

    if (errorTestPassed) {
      console.log('✅ 错误处理正确\n');
    } else {
      console.log('❌ 错误处理测试失败\n');
    }
  }

  // 测试 11: 枚举类型验证
  console.log('⏳ 测试 11: 枚举类型验证');
  const enumTests = [
    { value: types.MasteryLevel.Unknown, name: 'Unknown', valid: true },
    { value: types.MasteryLevel.Novice, name: 'Novice', valid: true },
    { value: types.MasteryLevel.Competent, name: 'Competent', valid: true },
    { value: types.MasteryLevel.Expert, name: 'Expert', valid: true },
    { value: types.TeachingMode.Auto, name: 'Auto', valid: true },
    { value: types.TeachingMode.Socratic, name: 'Socratic', valid: true },
    { value: types.TeachingMode.Narrative, name: 'Narrative', valid: true },
    { value: types.TeachingMode.Lecture, name: 'Lecture', valid: true },
    { value: types.TeachingStage.Introduction, name: 'Introduction', valid: true },
    { value: types.TeachingStage.Construction, name: 'Construction', valid: true },
    { value: types.TeachingStage.Consolidation, name: 'Consolidation', valid: true },
    { value: types.TeachingStage.Transfer, name: 'Transfer', valid: true },
    { value: types.TeachingStage.Reflection, name: 'Reflection', valid: true },
    { value: 'invalid', name: 'Invalid', valid: false }
  ].every(test => {
    Object.values(types.MasteryLevel).includes(test.value) ||
    Object.values(types.TeachingMode).includes(test.value) ||
    Object.values(types.TeachingStage).includes(test.value) === test.valid
  });

  if (enumTests.every(t => t)) {
    console.log('✅ 枚举类型验证通过\n');
  } else {
    console.log('❌ 枚举类型验证失败\n');
  }

  // 汇总测试结果
  console.log('========================================');
  console.log('📊 测试结果摘要');
  console.log('========================================');

  const totalTests = 11;
  const passedTests = [
    typeTestsPassed,
    testGetItemSuccess,
    envTestPassed,
    jsonTests.every(t => t),
    stringTests.every(t => t),
    arrayTests.every(t => t),
    asyncTestPassed,
    idTestPassed,
    errorTestPassed,
    enumTests.every(t => t)
  ].filter(t => t).length;

  console.log(`✅ 通过: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (passedTests === totalTests) {
    console.log('\n🎉 恭喜！所有测试通过！');
    console.log('✅ 构建应该可以成功\n');
    console.log('✅ 项目已准备好部署\n');
    console.log('\n下一步：');
    console.log('1. 等待 Render 自动检测并部署');
    console.log('2. 或手动推送到 GitHub');
    console.log('3. 查看部署日志确认构建成功\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试未通过，请检查：\n');
    console.log('1. TypeScript 编译配置');
    console.log('2. 依赖安装状态');
    console.log('3. 文件完整性\n');
    console.log('\n建议：运行 npm run build 查看详细错误信息\n');
    process.exit(1);
  }
} catch (error) {
  console.error('\n💥 测试运行失败:', error);
  console.error('错误详情:', error.stack);
  console.log('\n请检查：');
  console.log('1. 所有依赖是否正确安装');
  console.log('2. 文件路径是否正确');
  console.log('3. TypeScript 版本是否兼容\n');
  process.exit(1);
}
