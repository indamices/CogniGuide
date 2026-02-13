import React, { useState } from 'react';
import { ReviewCard } from '../types';

interface FlashcardProps {
  card: ReviewCard;
  showAnswer?: boolean;
  onFlip?: () => void;
  className?: string;
}

/**
 * 翻转式卡片组件
 * 支持3D翻转动画效果
 */
const Flashcard: React.FC<FlashcardProps> = ({
  card,
  showAnswer = false,
  onFlip,
  className = ''
}) => {
  const [isFlipped, setIsFlipped] = useState(showAnswer);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip();
  };

  const getPriorityColor = () => {
    switch (card.priority) {
      case 'high':
        return 'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700';
      case 'low':
        return 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700';
      default:
        return 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600';
    }
  };

  return (
    <div className={`flashcard-container ${className}`}>
      <div
        className={`flashcard cursor-pointer relative w-full h-80 perspective-1000 ${getPriorityColor()}`}
        onClick={handleFlip}
      >
        <div
          className={`flashcard-inner relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* 正面 - 问题 */}
          <div
            className="flashcard-front absolute w-full h-full backface-hidden rounded-lg shadow-lg p-6 border-2 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                card.priority === 'high' ? 'bg-red-500 text-white' :
                card.priority === 'medium' ? 'bg-yellow-500 text-white' :
                'bg-green-500 text-white'
              }`}>
                {card.priority === 'high' ? '高优先级' :
                 card.priority === 'medium' ? '中优先级' : '低优先级'}
              </span>
              {card.tags.length > 0 && card.tags.map((tag, idx) => (
                <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-center flex-1 flex flex-col items-center justify-center px-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                问题
              </p>
              <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                {card.question}
              </p>
            </div>

            <div className="absolute bottom-3 text-slate-400 dark:text-slate-500 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              点击查看答案
            </div>
          </div>

          {/* 背面 - 答案 */}
          <div
            className="flashcard-back absolute w-full h-full backface-hidden rounded-lg shadow-lg p-6 border-2 flex flex-col bg-white dark:bg-slate-800"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="absolute top-3 right-3 text-slate-400 dark:text-slate-500 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              点击返回问题
            </div>

            <div className="text-center flex-1 flex flex-col items-center justify-center px-4 overflow-auto">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                答案
              </p>
              <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {card.answer}
              </p>
            </div>

            {card.reviewHistory.length > 0 && (
              <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded px-2 py-1">
                已复习 {card.repetitions} 次 · EF: {card.easeFactor.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .flashcard-container {
          perspective: 1000px;
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flashcard-front,
        .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 0.75rem;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default Flashcard;
