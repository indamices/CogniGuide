/**
 * Undo/Redo Toolbar Component
 * 撤销重做功能
 */

import React from 'react';

interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const UndoRedoToolbar: React.FC<UndoRedoToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  return (
    <div className="flex items-center gap-2" role="toolbar" aria-label="撤销重做工具栏">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="撤销 (Ctrl+Z)"
        aria-disabled={!canUndo}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title="撤销 (Ctrl+Z)"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6 6l6 6"
          />
        </svg>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="重做 (Ctrl+Y)"
        aria-disabled={!canRedo}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title="重做 (Ctrl+Y)"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 10h-10a8 8 0 008 8v2M21 10l-6 6m6 6l-6 6"
          />
        </svg>
      </button>
    </div>
  );
};

export default UndoRedoToolbar;
