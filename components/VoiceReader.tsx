import React, { useState, useEffect } from 'react';

interface VoiceReaderProps {
  messageId: string;
  content: string;
  isSpeaking: boolean;
  isPaused: boolean;
  onSpeak: (text: string, messageId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  compact?: boolean;
}

const VoiceReader: React.FC<VoiceReaderProps> = ({
  messageId,
  content,
  isSpeaking,
  isPaused,
  onSpeak,
  onPause,
  onResume,
  onCancel,
  compact = false,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isSpeaking) {
      setHasStarted(true);
    }
  }, [isSpeaking]);

  const handleMainAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasStarted) {
      onSpeak(content, messageId);
    } else if (isSpeaking) {
      if (isPaused) {
        onResume();
      } else {
        onPause();
      }
    } else {
      // 重新开始
      onSpeak(content, messageId);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
    setHasStarted(false);
  };

  if (compact) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Compact Voice Button */}
        <button
          onClick={handleMainAction}
          className={`
            p-1.5 rounded-lg transition-all duration-200
            ${isSpeaking
              ? 'bg-indigo-100 text-indigo-600'
              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
            }
          `}
          title={isSpeaking ? (isPaused ? '继续朗读' : '暂停朗读') : '朗读此消息'}
        >
          {isSpeaking ? (
            isPaused ? (
              // Play icon (resume)
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              // Pause icon
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )
          ) : (
            // Speaker icon
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          )}
        </button>

        {/* Wave Animation (when speaking) */}
        {isSpeaking && !isPaused && (
          <div className="absolute -top-1 -right-1 flex items-end space-x-0.5">
            <span className="block w-0.5 h-2 bg-indigo-500 animate-pulse" style={{ animationDelay: '0ms' }}></span>
            <span className="block w-0.5 h-3 bg-indigo-500 animate-pulse" style={{ animationDelay: '150ms' }}></span>
            <span className="block w-0.5 h-2 bg-indigo-500 animate-pulse" style={{ animationDelay: '300ms' }}></span>
          </div>
        )}
      </div>
    );
  }

  // Full version with expanded controls
  return (
    <div
      className="relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Main Button */}
      <button
        onClick={handleMainAction}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${isSpeaking
            ? 'bg-indigo-100 text-indigo-600 shadow-md'
            : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
          }
        `}
        title={isSpeaking ? (isPaused ? '继续朗读' : '暂停朗读') : '朗读此消息'}
      >
        {isSpeaking ? (
          isPaused ? (
            // Play icon (resume)
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            // Pause icon
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )
        ) : (
          // Speaker icon
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        )}
      </button>

      {/* Status Indicator */}
      {isSpeaking && !isPaused && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        </div>
      )}

      {/* Expanded Controls (on hover when speaking) */}
      {showControls && hasStarted && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-slate-200 p-2 flex items-center space-x-1 animate-in slide-in-from-bottom-1">
          {/* Progress Bar */}
          <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 animate-pulse w-full"></div>
          </div>

          <div className="w-px h-4 bg-slate-200"></div>

          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="停止朗读"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Speaking Label (when active) */}
      {isSpeaking && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-indigo-600 font-medium">
            {isPaused ? '已暂停' : '正在朗读...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceReader;
