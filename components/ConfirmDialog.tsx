/**
 * Confirmation Dialog Component
 * 操作确认对话框
 */

import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  const typeStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  };

  const iconStyles = {
    danger: 'text-red-600 bg-red-100',
    warning: 'text-yellow-600 bg-yellow-100',
    info: 'text-indigo-600 bg-indigo-100'
  };

  const icons = {
    danger: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-fade-in-up">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${iconStyles[type]}`}>
            {icons[type]}
          </div>
        </div>

        {/* Title and Message */}
        <div className="text-center mb-6">
          <h3
            id="dialog-title"
            className="text-xl font-bold text-slate-800 mb-2"
          >
            {title}
          </h3>
          <p
            id="dialog-description"
            className="text-slate-600 text-sm leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-lg transition-colors font-medium ${typeStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
