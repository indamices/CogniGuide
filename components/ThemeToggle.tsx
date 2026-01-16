/**
 * Theme Toggle Component
 * 主题切换和设置面板
 */

import React, { useState } from 'react';
import { useTheme } from './ThemeProvider';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'medium' | 'large';
type Density = 'compact' | 'comfortable' | 'spacious';

const ThemeToggle: React.FC = () => {
  const { theme, fontSize, density, setTheme, setFontSize, setDensity } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { label: string; value: Theme; icon: string }[] = [
    { label: '亮色', value: 'light', icon: '☀️' },
    { label: '暗色', value: 'dark', icon: '🌙' },
    { label: '跟随系统', value: 'system', icon: '🖥️' }
  ];

  const fontSizes: { label: string; value: FontSize }[] = [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' }
  ];

  const densities: { label: string; value: Density }[] = [
    { label: '紧凑', value: 'compact' },
    { label: '舒适', value: 'comfortable' },
    { label: '宽松', value: 'spacious' }
  ];

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="主题设置"
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="text-xl">{currentTheme?.icon}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50">
          {/* Theme Selection */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">主题</h4>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    theme === t.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  aria-pressed={theme === t.value}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">字体大小</h4>
            <div className="flex gap-2">
              {fontSizes.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFontSize(f.value)}
                  className={`flex-1 py-2 rounded-lg border-2 transition-all text-sm ${
                    fontSize === f.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                  aria-pressed={fontSize === f.value}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">布局密度</h4>
            <div className="flex gap-2">
              {densities.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDensity(d.value)}
                  className={`flex-1 py-2 rounded-lg border-2 transition-all text-sm ${
                    density === d.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                  aria-pressed={density === d.value}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
