/**
 * Code Static Analysis Tests
 * 代码静态分析和潜在问题检测
 */

import { describe, it, assert, runner } from './test-runner';
import * as fs from 'fs';
import * as path from 'path';

describe('代码静态分析', () => {
  it('应该检查所有关键文件是否存在', () => {
    const files = [
      'App.tsx',
      'types.ts',
      'utils/storage.ts',
      'utils/mindMapHelpers.ts',
      'services/geminiService.ts',
      'services/deepseekService.ts'
    ];
    
    for (const file of files) {
      const filePath = path.join(process.cwd(), 'CogniGuide', file);
      assert.isTrue(fs.existsSync(filePath), `文件 ${file} 应该存在`);
    }
  });

  it('应该检查package.json配置', () => {
    const packagePath = path.join(process.cwd(), 'CogniGuide', 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(packageContent);
    
    assert.isDefined(pkg.name);
    assert.isDefined(pkg.version);
    assert.isDefined(pkg.scripts);
    assert.isDefined(pkg.dependencies);
  });

  it('应该检查tsconfig.json配置', () => {
    const tsconfigPath = path.join(process.cwd(), 'CogniGuide', 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(tsconfigContent);
      
      assert.isDefined(tsconfig.compilerOptions);
      // Check that tests are excluded
      if (tsconfig.exclude) {
        assert.isTrue(
          tsconfig.exclude.includes('tests') || tsconfig.exclude.includes('node_modules'),
          'tsconfig应该排除tests目录'
        );
      }
    }
  });
});

describe('潜在Bug检测', () => {
  it('应该检查App.tsx中的竞态条件处理', async () => {
    const appPath = path.join(process.cwd(), 'CogniGuide', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Check for race condition fixes
    assert.isTrue(
      appContent.includes('currentSessionIdRef'),
      '应该使用currentSessionIdRef来防止竞态条件'
    );
    assert.isTrue(
      appContent.includes('requestSessionId'),
      '应该捕获requestSessionId来验证响应'
    );
  });

  it('应该检查错误处理', () => {
    const appPath = path.join(process.cwd(), 'CogniGuide', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Check for error handling
    assert.isTrue(
      appContent.includes('try') && appContent.includes('catch'),
      '应该包含错误处理'
    );
  });

  it('应该检查API密钥验证', () => {
    const appPath = path.join(process.cwd(), 'CogniGuide', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Check for API key validation
    assert.isTrue(
      appContent.includes('apiKey') || appContent.includes('deepSeekKey'),
      '应该检查API密钥'
    );
  });
});

describe('性能优化检查', () => {
  it('应该检查useCallback和useMemo的使用', () => {
    const appPath = path.join(process.cwd(), 'CogniGuide', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Check for performance optimizations
    const hasUseCallback = appContent.includes('useCallback');
    const hasUseMemo = appContent.includes('useMemo');
    
    // Note: Not all functions need memoization, but important ones should
    console.log('  useCallback使用:', hasUseCallback);
    console.log('  useMemo使用:', hasUseMemo);
  });

  it('应该检查大型依赖数组', () => {
    const appPath = path.join(process.cwd(), 'CogniGuide', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Find useEffect with many dependencies (potential optimization)
    const useEffectMatches = appContent.match(/useEffect\([^)]*\[[^\]]+\]/g) || [];
    
    for (const match of useEffectMatches) {
      const deps = match.match(/\[([^\]]+)\]/)?.[1] || '';
      const depCount = deps.split(',').filter(d => d.trim()).length;
      
      if (depCount > 5) {
        console.warn(`  发现大量依赖的useEffect: ${depCount}个依赖`);
      }
    }
  });
});

if (import.meta.url === `file://${process.argv[1]}`) {
  runner.run().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
