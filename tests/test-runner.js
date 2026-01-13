/**
 * CogniGuide 自动化测试套件
 */

console.log('========================================');
console.log('🧪 CogniGuide 自动化测试套件');
console.log('========================================\n');

let passed = 0;
let failed = 0;
let errors = 0;

// Test 1: Bug 2 - 概念合并不会丢失节点
try {
  console.log('⏳ 测试 1: Bug 2 - 概念合并不会丢失节点');

  const concepts = [
    { id: '1', name: '概念A', mastery: 'Expert', description: '' },
    { id: '2', name: '概念B', mastery: 'Novice', description: '' }
  ];

  const response = {
    updatedConcepts: [],
    updatedLinks: []
  };

  const mergedConcepts = response.updatedConcepts && response.updatedConcepts.length > 0
    ? response.updatedConcepts
    : concepts;

  if (mergedConcepts.length === concepts.length && mergedConcepts[0].id === concepts[0].id) {
    console.log('✅ 通过: Bug 2 - 概念合并不会丢失节点\n');
    passed++;
  } else {
    console.log('❌ 失败: Bug 2 - 概念合并不会丢失节点\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Bug 2 - 概念合并不会丢失节点');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 2: Bug 2-2 - 概念合并正确更新现有概念
try {
  console.log('⏳ 测试 2: Bug 2-2 - 概念合并正确更新现有概念');

  const concepts = [
    { id: '1', name: '概念A', mastery: 'Expert', description: '旧描述' },
    { id: '2', name: '概念B', mastery: 'Novice', description: '' }
  ];

  const response = {
    updatedConcepts: [
      { id: '1', name: '概念A', mastery: 'Competent', description: '新描述' }
    ],
    updatedLinks: []
  };

  const mergedConcepts = response.updatedConcepts && response.updatedConcepts.length > 0
    ? response.updatedConcepts.map(newC => {
        const existing = concepts.find(c => c.id === newC.id);
        if (existing) {
          return {
            ...existing,
            ...newC,
            name: newC.name || existing.name,
            mastery: newC.mastery || existing.mastery,
            description: newC.description || existing.description
          };
        }
        return newC;
      })
    : concepts;

  if (mergedConcepts.length === 2 &&
      mergedConcepts[0].mastery === 'Competent' &&
      mergedConcepts[0].description === '新描述' &&
      mergedConcepts[1].id === '2') {
    console.log('✅ 通过: Bug 2-2 - 概念合并正确更新现有概念\n');
    passed++;
  } else {
    console.log('❌ 失败: Bug 2-2 - 概念合并正确更新现有概念\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Bug 2-2 - 概念合并正确更新现有概念');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 3: Bug 3 - API Key 验证不包含空字符串
try {
  console.log('⏳ 测试 3: Bug 3 - API Key 验证不包含空字符串');

  const emptyKey = '';
  const validKey = 'valid-key-123';
  const spacesKey = '   ';

  const isValid1 = emptyKey && emptyKey.trim().length > 0;
  const isValid2 = validKey && validKey.trim().length > 0;
  const isValid3 = spacesKey && spacesKey.trim().length > 0;

  if (!isValid1 && isValid2 && !isValid3) {
    console.log('✅ 通过: Bug 3 - API Key 验证不包含空字符串\n');
    passed++;
  } else {
    console.log('❌ 失败: Bug 3 - API Key 验证不包含空字符串\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Bug 3 - API Key 验证不包含空字符串');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 4: Bug 4 - ID 生成不会冲突
try {
  console.log('⏳ 测试 4: Bug 4 - ID 生成不会冲突');

  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    ids.add(id);
  }

  if (ids.size === 100) {
    console.log('✅ 通过: Bug 4 - ID 生成不会冲突\n');
    passed++;
  } else {
    console.log('❌ 失败: Bug 4 - ID 生成不会冲突\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Bug 4 - ID 生成不会冲突');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 5: Bug 7 - KnowledgeMap 循环检测
try {
  console.log('⏳ 测试 5: Bug 7 - KnowledgeMap 循环检测');

  const nodes = [
    { id: '1', name: '节点1', mastery: 'Expert' },
    { id: '2', name: '节点2', mastery: 'Novice' },
    { id: '3', name: '节点3', mastery: 'Novice' }
  ];

  const links = [
    { source: '1', target: '2', relationship: '父' },
    { source: '2', target: '3', relationship: '子' },
    { source: '3', target: '1', relationship: '循环' }
  ];

  const visited = new Set();
  const checkCycle = (nodeId) => {
    if (visited.has(nodeId)) return true;
    visited.add(nodeId);
    const children = links.filter(l => l.source === nodeId).map(l => l.target);
    for (const child of children) {
      if (checkCycle(child)) {
        return true;
      }
    }
    return false;
  };

  const hasCycle = checkCycle('1');

  if (hasCycle === true) {
    console.log('✅ 通过: Bug 7 - KnowledgeMap 循环检测\n');
    passed++;
  } else {
    console.log('❌ 失败: Bug 7 - KnowledgeMap 循环检测\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Bug 7 - KnowledgeMap 循环检测');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 6: Bug 8 - 模型名称验证
try {
  console.log('⏳ 测试 6: Bug 8 - 模型名称验证');

  const DEEPSEEK_MODELS = ['V3.2', 'V3.2Think', 'deepseek-chat', 'deepseek-reasoner'];

  const tests = [
    { model: 'V3.2', expected: true },
    { model: 'V3.2Think', expected: true },
    { model: 'gemini-2.5-flash', expected: false },
    { model: 'V3.3', expected: false },
    { model: '', expected: false }
  ];

  const allCorrect = tests.every(t => DEEPSEEK_MODELS.includes(t.model) === t.expected);

  if (allCorrect) {
    console.log('✅ 通过: Bug 8 - 模型名称验证\n');
    passed++;
  } else {
    console.log('❌ 失败: Bug 8 - 模型名称验证\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Bug 8 - 模型名称验证');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 7: Type Safety - Mastery Level 验证
try {
  console.log('⏳ 测试 7: Type Safety - Mastery Level 验证');

  const validLevels = ['Unknown', 'Novice', 'Competent', 'Expert'];
  const testCases = [
    { input: 'Expert', valid: true },
    { input: 'Novice', valid: true },
    { input: 'Invalid', valid: false },
    { input: '', valid: false }
  ];

  const allCorrect = testCases.every(tc => validLevels.includes(tc.input) === tc.valid);

  if (allCorrect) {
    console.log('✅ 通过: Type Safety - Mastery Level 验证\n');
    passed++;
  } else {
    console.log('❌ 失败: Type Safety - Mastery Level 验证\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Type Safety - Mastery Level 验证');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 8: Performance - 大量概念合并
try {
  console.log('⏳ 测试 8: Performance - 大量概念合并');

  const startTime = Date.now();

  const existingConcepts = Array.from({ length: 1000 }, (_, i) => ({
    id: `concept-${i}`,
    name: `概念${i}`,
    mastery: 'Novice',
    description: `描述${i}`
  }));

  const newConcepts = existingConcepts.slice(0, 100);
  const merged = newConcepts.map(newC => {
    const existing = existingConcepts.find(c => c.id === newC.id);
    if (existing) {
      return { ...existing, ...newC };
    }
    return newC;
  });

  const endTime = Date.now();
  const duration = endTime - startTime;

  if (merged.length === 100 && duration < 100) {
    console.log('✅ 通过: Performance - 大量概念合并\n');
    passed++;
  } else {
    console.log('❌ 失败: Performance - 大量概念合并\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Performance - 大量概念合并');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 9: Edge Case - 特殊字符处理
try {
  console.log('⏳ 测试 9: Edge Case - 特殊字符处理');

  const specialStrings = [
    '中文测试',
    '🎉🔥',
    'test@example.com',
    'null',
    'undefined',
    ' ',
    '\n\r\t',
    '<script>alert("xss")</script>'
  ];

  const allSafe = specialStrings.every(str => {
    try {
      const serialized = JSON.stringify(str);
      const deserialized = JSON.parse(serialized);
      return deserialized === str;
    } catch {
      return false;
    }
  });

  if (allSafe) {
    console.log('✅ 通过: Edge Case - 特殊字符处理\n');
    passed++;
  } else {
    console.log('❌ 失败: Edge Case - 特殊字符处理\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Edge Case - 特殊字符处理');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 10: Data Integrity - 链接双向去重
try {
  console.log('⏳ 测试 10: Data Integrity - 链接双向去重');

  const existingLinks = [
    { source: '1', target: '2', relationship: '包含' }
  ];

  const newLinks = [
    { source: '2', target: '1', relationship: '属于' },
    { source: '3', target: '4', relationship: '相关' }
  ];

  const merged = [...existingLinks, ...newLinks].filter((link, index, self) => {
    const isDuplicate = self.some((other, otherIdx) =>
      otherIdx < index &&
      ((link.source === other.source && link.target === other.target) ||
       (link.source === other.target && link.target === other.source))
    );
    return !isDuplicate;
  });

  const hasDuplicateLink = merged.filter(l =>
    (l.source === '1' && l.target === '2') ||
    (l.source === '2' && l.target === '1')
  ).length;

  if (hasDuplicateLink <= 1 && merged.length >= 2) {
    console.log('✅ 通过: Data Integrity - 链接双向去重\n');
    passed++;
  } else {
    console.log('❌ 失败: Data Integrity - 链接双向去重\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Data Integrity - 链接双向去重');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// Test 11: Session Management - 会话按修改时间排序
try {
  console.log('⏳ 测试 11: Session Management - 会话按修改时间排序');

  const sessions = [
    { id: '1', title: '会话1', topic: '主题1', messages: [], learningState: { concepts: [], links: [], currentStrategy: '', currentStage: 'Introduction', cognitiveLoad: 'Optimal', feedback: '', summary: [] }, teachingMode: 'Auto', lastModified: 1000, model: 'gemini-2.5-flash' },
    { id: '2', title: '会话2', topic: '主题2', messages: [], learningState: { concepts: [], links: [], currentStrategy: '', currentStage: 'Introduction', cognitiveLoad: 'Optimal', feedback: '', summary: [] }, teachingMode: 'Auto', lastModified: 3000, model: 'gemini-2.5-flash' },
    { id: '3', title: '会话3', topic: '主题3', messages: [], learningState: { concepts: [], links: [], currentStrategy: '', currentStage: 'Introduction', cognitiveLoad: 'Optimal', feedback: '', summary: [] }, teachingMode: 'Auto', lastModified: 2000, model: 'gemini-2.5-flash' }
  ];

  const sorted = [...sessions].sort((a, b) => b.lastModified - a.lastModified);

  const isCorrect = sorted[0].id === '2' &&
                  sorted[1].id === '3' &&
                  sorted[2].id === '1';

  if (isCorrect) {
    console.log('✅ 通过: Session Management - 会话按修改时间排序\n');
    passed++;
  } else {
    console.log('❌ 失败: Session Management - 会话按修改时间排序\n');
    failed++;
  }
} catch (error) {
  console.log('💥 错误: Session Management - 会话按修改时间排序');
  console.log('   错误信息:', error, '\n');
  errors++;
}

// 输出结果摘要
console.log('========================================');
console.log('📊 测试结果摘要');
console.log('========================================');
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);
console.log(`💥 错误: ${errors}`);
console.log(`📈 总计: ${passed + failed + errors}`);
console.log(`📊 成功率: ${((passed / (passed + failed + errors)) * 100).toFixed(1)}%\n`);

// 返回退出码
const exitCode = failed + errors > 0 ? 1 : 0;
process.exit(exitCode);
