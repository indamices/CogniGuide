import React, { useEffect, useRef } from 'react';
import { ConsoleMessage, ConsoleLogLevel } from '../types';

interface CodeConsoleProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  maxHeight?: string;
}

const CodeConsole: React.FC<CodeConsoleProps> = ({
  messages,
  onClear,
  maxHeight = '300px',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getLevelIcon = (level: ConsoleLogLevel): string => {
    switch (level) {
      case ConsoleLogLevel.Error:
        return '❌';
      case ConsoleLogLevel.Warn:
        return '⚠️';
      case ConsoleLogLevel.Info:
        return 'ℹ️';
      case ConsoleLogLevel.Log:
      default:
        return '💬';
    }
  };

  const getLevelColor = (level: ConsoleLogLevel): string => {
    switch (level) {
      case ConsoleLogLevel.Error:
        return 'text-red-600 bg-red-50 border-red-200';
      case ConsoleLogLevel.Warn:
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case ConsoleLogLevel.Info:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case ConsoleLogLevel.Log:
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <div className="flex flex-col border border-slate-300 rounded-lg overflow-hidden bg-white">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-slate-700">Console</span>
          <span className="text-xs text-slate-500">({messages.length} messages)</span>
        </div>
        <button
          onClick={onClear}
          disabled={messages.length === 0}
          className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>

      {/* Console Messages */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-sm"
        style={{ maxHeight }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No output yet...
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 px-3 py-2 rounded-md border ${getLevelColor(
                msg.level
              )} hover:shadow-sm transition-shadow`}
            >
              <span className="flex-shrink-0" aria-label={msg.level}>
                {getLevelIcon(msg.level)}
              </span>
              <span className="flex-shrink-0 text-xs opacity-60">
                {formatTimestamp(msg.timestamp)}
              </span>
              <pre className="flex-1 whitespace-pre-wrap break-words font-mono text-xs">
                {msg.content}
              </pre>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Console Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>💡 Tip: Use console.log() to output values</span>
        {messages.length > 0 && (
          <span>Last: {formatTimestamp(messages[messages.length - 1].timestamp)}</span>
        )}
      </div>
    </div>
  );
};

export default CodeConsole;
