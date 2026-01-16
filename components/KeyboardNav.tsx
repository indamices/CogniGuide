/**
 * Keyboard Navigation Component
 * 全局键盘导航支持
 */

import React, { useState, useEffect } from 'react';

interface KeyboardNavProps {
  onNextSession?: () => void;
  onPrevSession?: () => void;
  onNewChat?: () => void;
}

const KeyboardNav: React.FC<KeyboardNavProps> = ({
  onNextSession,
  onPrevSession,
  onNewChat
}) => {
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState('');
  let timeout: NodeJS.Timeout | null = null;

  const showInfo = (text: string, duration = 2000) => {
    setInfo(text);
    setVisible(true);
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      setVisible(false);
      timeout = null;
    }, duration);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Alt + 右/左：切换会话
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        if (e.key === 'ArrowRight' && onNextSession) {
          e.preventDefault();
          showInfo('下一个会话 (Ctrl+Alt+→)');
          onNextSession();
        } else if (e.key === 'ArrowLeft' && onPrevSession) {
          e.preventDefault();
          showInfo('上一个会话 (Ctrl+Alt+←)');
          onPrevSession();
        }
      }
      
      // Ctrl/Cmd + N：新对话
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && onNewChat) {
        e.preventDefault();
        showInfo('开始新对话 (Ctrl+N)');
        onNewChat();
      }
      
      // Escape：关闭模态框或侧边栏（如果需要的话）
      if (e.key === 'Escape') {
        showInfo('关闭 (Escape)');
        setVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNextSession, onPrevSession, onNewChat]);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {visible && (
        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{info}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardNav;
