import React, { useState, useEffect, useCallback, useRef } from 'react';
import CodeEditor from './CodeEditor';
import CodeConsole from './CodeConsole';
import LanguageSelector from './LanguageSelector';
import {
  CodeLanguage,
  CodeSandboxTab,
  ConsoleMessage,
  ConsoleLogLevel,
  CodeExecutionResult,
} from '../types';
import { executeCode, preloadPyodide } from '../utils/codeExecutor';

interface CodeSandboxProps {
  initialCode?: string;
  initialLanguage?: CodeLanguage;
  onCodeChange?: (code: string, language: CodeLanguage) => void;
  readOnly?: boolean;
  showLanguageSelector?: boolean;
  height?: string;
}

const CodeSandbox: React.FC<CodeSandboxProps> = ({
  initialCode = '',
  initialLanguage = CodeLanguage.JavaScript,
  onCodeChange,
  readOnly = false,
  showLanguageSelector = true,
  height = '600px',
}) => {
  const [tabs, setTabs] = useState<CodeSandboxTab[]>([
    {
      id: '1',
      title: 'Main',
      language: initialLanguage,
      code: initialCode,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const pyodidePreloaded = useRef(false);

  // Preload Pyodide on mount (lazy load)
  useEffect(() => {
    if (!pyodidePreloaded.current) {
      preloadPyodide().then(() => {
        pyodidePreloaded.current = true;
        console.log('Pyodide preloaded');
      });
    }
  }, []);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Add console message
  const addConsoleMessage = useCallback(
    (level: ConsoleLogLevel, content: string) => {
      const newMessage: ConsoleMessage = {
        id: `${Date.now()}-${Math.random()}`,
        level,
        content,
        timestamp: Date.now(),
      };
      setConsoleMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  // Update code in active tab
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (!activeTab) return;

      const updatedCode = value || '';
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId ? { ...tab, code: updatedCode } : tab
        )
      );

      onCodeChange?.(updatedCode, activeTab.language);
    },
    [activeTab, activeTabId, onCodeChange]
  );

  // Change language
  const handleLanguageChange = useCallback(
    (language: CodeLanguage) => {
      if (!activeTab) return;

      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTabId ? { ...tab, language } : tab))
      );

      // Clear console and preview when language changes
      setConsoleMessages([]);
      setHtmlPreview('');
      setShowPreview(false);
    },
    [activeTabId, activeTab]
  );

  // Execute code
  const handleExecute = useCallback(async () => {
    if (!activeTab || isRunning) return;

    setIsRunning(true);
    setConsoleMessages([]);
    setHtmlPreview('');

    // Add execution start message
    addConsoleMessage(
      ConsoleLogLevel.Info,
      `Running ${activeTab.language} code...`
    );

    try {
      const result: CodeExecutionResult = await executeCode(
        activeTab.code,
        activeTab.language,
        10000 // 10s timeout
      );

      if (result.output) {
        addConsoleMessage(ConsoleLogLevel.Log, result.output);
      }

      if (result.error) {
        addConsoleMessage(ConsoleLogLevel.Error, result.error);
      }

      // For HTML, show preview
      if (
        activeTab.language === CodeLanguage.HTML &&
        result.success &&
        result.output
      ) {
        setHtmlPreview(result.output);
        setShowPreview(true);
      }

      // Log execution time
      if (result.executionTime) {
        addConsoleMessage(
          ConsoleLogLevel.Info,
          `Execution time: ${result.executionTime}ms`
        );
      }

      if (result.success) {
        addConsoleMessage(ConsoleLogLevel.Info, '✅ Execution completed');
      }
    } catch (error) {
      addConsoleMessage(
        ConsoleLogLevel.Error,
        `Unexpected error: ${(error as Error).message}`
      );
    } finally {
      setIsRunning(false);
    }
  }, [activeTab, isRunning, addConsoleMessage]);

  // Clear console
  const handleClearConsole = useCallback(() => {
    setConsoleMessages([]);
    setHtmlPreview('');
    setShowPreview(false);
  }, []);

  // Create new tab
  const handleNewTab = useCallback(() => {
    const newTab: CodeSandboxTab = {
      id: `${Date.now()}`,
      title: `Tab ${tabs.length + 1}`,
      language: activeTab?.language || CodeLanguage.JavaScript,
      code: '',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs, activeTab]);

  // Close tab
  const handleCloseTab = useCallback(
    (tabId: string) => {
      if (tabs.length === 1) return; // Keep at least one tab

      const newTabs = tabs.filter((tab) => tab.id !== tabId);
      setTabs(newTabs);

      if (activeTabId === tabId) {
        setActiveTabId(newTabs[0].id);
      }
    },
    [tabs, activeTabId]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to execute
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExecute]);

  if (!activeTab) return null;

  return (
    <div className="flex flex-col space-y-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-bold text-slate-800">Code Sandbox</h3>
          {showLanguageSelector && (
            <LanguageSelector
              selectedLanguage={activeTab.language}
              onLanguageChange={handleLanguageChange}
              disabled={readOnly || isRunning}
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!readOnly && (
            <>
              {/* New Tab Button */}
              <button
                onClick={handleNewTab}
                disabled={isRunning}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                title="New tab"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              {/* Run Button */}
              <button
                onClick={handleExecute}
                disabled={isRunning || !activeTab.code.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Run</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* HTML Preview Toggle */}
          {(activeTab.language === CodeLanguage.HTML ||
            activeTab.language === CodeLanguage.CSS) && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {showPreview ? '🙈 Hide Preview' : '👁️ Show Preview'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex items-center space-x-1 border-b border-slate-200">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${
                tab.id === activeTabId
                  ? 'bg-indigo-50 text-indigo-700 border-t-2 border-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.title}</span>
              {!readOnly && tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                  className="hover:text-red-600 transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editor and Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {activeTab.title} ({activeTab.language})
            </span>
            <span className="text-xs text-slate-500">
              {activeTab.code.split('\n').length} lines
            </span>
          </div>
          <CodeEditor
            language={activeTab.language}
            value={activeTab.code}
            onChange={handleCodeChange}
            readOnly={readOnly || isRunning}
            height={height}
            minimap={false}
          />
        </div>

        {/* Console or Preview */}
        <div className="space-y-2">
          {showPreview && htmlPreview ? (
            <>
              <span className="text-sm font-medium text-slate-700">
                Live Preview
              </span>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={htmlPreview}
                  title="HTML Preview"
                  className="w-full bg-white"
                  style={{ height }}
                  sandbox="allow-scripts"
                />
              </div>
            </>
          ) : (
            <CodeConsole
              messages={consoleMessages}
              onClear={handleClearConsole}
              maxHeight={height}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-3">
        <span>
          ⌨️ Shortcuts: Ctrl+Enter to run | Scroll for more
        </span>
        {activeTab.code.trim() && (
          <span>
            {activeTab.code.length} chars | {activeTab.code.split('\n').length}{' '}
            lines
          </span>
        )}
      </div>
    </div>
  );
};

export default CodeSandbox;
