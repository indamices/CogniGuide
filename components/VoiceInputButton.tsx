import React, { useState, useEffect } from 'react';

interface VoiceInputButtonProps {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled?: boolean;
  error?: string | null;
  className?: string;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isListening,
  transcript,
  interimTranscript,
  onStart,
  onStop,
  onReset,
  disabled = false,
  error = null,
  className = '',
}) => {
  const [pulsePhase, setPulsePhase] = useState(0);

  // 录音动画效果
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 1) % 3);
    }, 300);

    return () => clearInterval(interval);
  }, [isListening]);

  const handleClick = () => {
    if (disabled) return;

    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReset();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Button */}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative p-3 rounded-xl transition-all duration-300
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isListening ? '点击停止录音' : '点击开始语音输入'}
      >
        {/* Microphone Icon */}
        <svg
          className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>

        {/* Pulse Rings (when listening) */}
        {isListening && (
          <>
            <span
              className={`absolute inset-0 rounded-xl bg-red-400 animate-ping ${
                pulsePhase === 0 ? 'opacity-75' : 'opacity-0'
              }`}
            />
            <span
              className={`absolute inset-0 rounded-xl bg-red-300 animate-ping ${
                pulsePhase === 1 ? 'opacity-75' : 'opacity-0'
              }`}
              style={{ animationDelay: '150ms' }}
            />
          </>
        )}
      </button>

      {/* Status Indicator */}
      {isListening && (
        <div className="absolute -top-2 -right-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}

      {/* Transcript Popup */}
      {isListening && (transcript || interimTranscript) && (
        <div className="absolute bottom-full left-0 mb-3 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-700">正在聆听...</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-red-600 transition-colors"
              title="清空"
            >
              重置
            </button>
          </div>

          {/* Text Content */}
          <div className="min-h-[60px] max-h-[120px] overflow-y-auto">
            {transcript && (
              <p className="text-sm text-slate-800 mb-1">{transcript}</p>
            )}
            {interimTranscript && (
              <p className="text-sm text-slate-400 italic">{interimTranscript}</p>
            )}
          </div>

          {/* Footer Hint */}
          <p className="text-xs text-slate-400 mt-2">
            再次点击按钮完成输入
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && !isListening && (
        <div className="absolute bottom-full left-0 mb-3 w-64 bg-red-50 border border-red-200 rounded-lg p-3 animate-in slide-in-from-bottom-2">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInputButton;
