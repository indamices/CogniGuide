import React, { useState, useRef } from 'react';
import { ReviewCard } from '../types';
import { importFromAnki, exportToAnki } from '../utils/spacedRepetition';

interface AnkiImporterProps {
  cards: ReviewCard[];
  onImportCards: (cards: ReviewCard[]) => void;
  sessionId?: string;
}

/**
 * Anki 格式导入/导出组件
 */
const AnkiImporter: React.FC<AnkiImporterProps> = ({
  cards,
  onImportCards,
  sessionId
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [importJson, setImportJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const ankiCards = exportToAnki(cards);
    const dataStr = JSON.stringify(ankiCards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cogniguide-anki-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        throw new Error('导入数据必须是数组格式');
      }

      const importedCards = importFromAnki(parsed, sessionId || 'imported-session');
      onImportCards([...cards, ...importedCards]);
      setImportJson('');
      setShowDialog(false);
      alert(`成功导入 ${importedCards.length} 张卡片！`);
    } catch (error: any) {
      alert(`导入失败: ${error.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  if (!showDialog) {
    return (
      <button
        onClick={() => setShowDialog(true)}
        className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Anki 导入/导出
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Anki 导入/导出
          </h2>
          <button
            onClick={() => setShowDialog(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 导出部分 */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
              导出为 Anki 格式
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              将所有卡片导出为 JSON 格式，可用于备份或导入到其他系统
            </p>
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              导出 JSON 文件
            </button>
          </div>

          {/* 导入部分 */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
              从 Anki 格式导入
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              支持 JSON 格式的卡片数据
            </p>

            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                选择 JSON 文件
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                    或
                  </span>
                </div>
              </div>

              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='粘贴 JSON 数据，例如：
[
  {
    "question": "什么是React？",
    "answer": "React是一个用于构建用户界面的JavaScript库...",
    "tags": ["前端", "JavaScript"]
  }
]'
                rows={6}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 resize-none font-mono text-sm"
              />

              <button
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导入卡片
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnkiImporter;
