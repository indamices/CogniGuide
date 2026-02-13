import React, { useEffect, useState } from 'react';
import { ReviewCard } from '../types';
import { getDueCards } from '../utils/spacedRepetition';

interface ReviewReminderProps {
  cards: ReviewCard[];
  sessionId?: string;
  onStartReview?: () => void;
}

/**
 * 复习提醒组件
 * 在有到期卡片时显示通知
 */
const ReviewReminder: React.FC<ReviewReminderProps> = ({
  cards,
  sessionId,
  onStartReview
}) => {
  const [dueCount, setDueCount] = useState(0);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    // 过滤当前会话的卡片
    const sessionCards = sessionId
      ? cards.filter(c => c.sessionId === sessionId)
      : cards;

    const dueCards = getDueCards(sessionCards);
    setDueCount(dueCards.length);

    // 如果有待复习卡片且用户尚未关闭提醒，显示通知
    if (dueCards.length > 0 && !showReminder) {
      // 延迟3秒显示提醒，避免打扰
      const timer = setTimeout(() => {
        setShowReminder(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [cards, sessionId]);

  if (dueCount === 0 || !showReminder) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40 max-w-sm animate-slide-in">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">复习提醒</h3>
            <p className="text-sm text-white/90 mb-3">
              您有 <span className="font-bold text-white">{dueCount}</span> 张卡片需要复习
            </p>
            <div className="flex gap-2">
              <button
                onClick={onStartReview}
                className="flex-1 px-3 py-2 bg-white text-blue-600 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
              >
                立即复习
              </button>
              <button
                onClick={() => setShowReminder(false)}
                className="px-3 py-2 bg-white/20 text-white rounded-lg font-medium text-sm hover:bg-white/30 transition-colors"
              >
                稍后
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowReminder(false)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReviewReminder;
