import React from 'react';
import { CodeLanguage } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: CodeLanguage;
  onLanguageChange: (language: CodeLanguage) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
}) => {
  const languages = [
    { value: CodeLanguage.JavaScript, label: 'JavaScript', icon: '⚡' },
    { value: CodeLanguage.TypeScript, label: 'TypeScript', icon: '📘' },
    { value: CodeLanguage.Python, label: 'Python', icon: '🐍' },
    { value: CodeLanguage.HTML, label: 'HTML', icon: '🌐' },
    { value: CodeLanguage.CSS, label: 'CSS', icon: '🎨' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-slate-700">Language:</label>
      <div className="relative inline-block">
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value as CodeLanguage)}
          disabled={disabled}
          className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-300 transition-colors cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.icon} {lang.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
