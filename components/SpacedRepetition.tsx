import React, { useState, useEffect, useCallback } from 'react';
import { QualityRating, ReviewCard, ReviewStatistics } from '../types';
import Flashcard from './Flashcard';
import AnkiImporter from './AnkiImporter';
import {
  isCardDue,
  getDueCards,
  getTimeUntilReview,
  getMemoryStrength,
  sortCardsByPriority,
  processCardReview,
  calculateStatistics
} from '../utils/spacedRepetition';

interface SpacedRepetitionProps {
  cards: ReviewCard[];
  onUpdateCards: (cards: ReviewCard[]) => void;
  sessionId?: string;
}

/**
 * 间隔重复学习组件
 * 功能：
 * - 查看到期复习卡片
 * - Flashcard 翻转模式
 * - 评分按钮 (1-5级)
 * - 进度追踪
 * - 批量复习模式
 * - 统计数据展示
 * - 导出 Anki 格式
 */
const SpacedRepetition: React.FC<SpacedRepetitionProps> = ({
  cards,
  onUpdateCards,
  sessionId
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [showAllCards, setShowAllCards] = useState(false);

  // 过滤当前会话的卡片
  const sessionCards = sessionId
    ? cards.filter(c => c.sessionId === sessionId)
    : cards;

  const dueCards = getDueCards(sessionCards);
  const sortedCards = sortCardsByPriority(showAllCards ? sessionCards : dueCards);
  const currentCard = sortedCards[currentCardIndex];

  // 更新统计数据
  useEffect(() => {
    setStatistics(calculateStatistics(sessionCards));
  }, [sessionCards]);

  // 开始复习模式
  const startReview = useCallback(() => {
    if (dueCards.length === 0) return;
    setIsReviewMode(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setReviewStartTime(Date.now());
  }, [dueCards.length]);

  // 退出复习模式
  const exitReview = useCallback(() => {
    setIsReviewMode(false);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  }, []);

  // 处理导入
  const handleImportCards = useCallback((importedCards: ReviewCard[]) => {
    onUpdateCards(importedCards);
  }, [onUpdateCards]);

  // 处理评分
  const handleRating = useCallback((quality: QualityRating) => {
    if (!currentCard) return;

    const timeTaken = Date.now() - reviewStartTime;
    const updatedCard = processCardReview(currentCard, quality, timeTaken);

    // 更新卡片列表
    const updatedCards = cards.map(c =>
      c.id === currentCard.id ? updatedCard : c
    );
    onUpdateCards(updatedCards);

    // 移动到下一张卡片
    if (currentCardIndex < sortedCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
      setReviewStartTime(Date.now());
    } else {
      // 复习完成
      exitReview();
    }
  }, [currentCard, reviewStartTime, currentCardIndex, sortedCards.length, cards, onUpdateCards, exitReview]);

  // 评分按钮组件
  const RatingButtons = () => (
    <div className="flex gap-2 mt-6">
      <button
        onClick={() => handleRating(1)}
        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-md"
      >
        <div className="text-lg mb-1">😫</div>
        <div className="text-xs">完全忘记</div>
        <div className="text-xs opacity-75">1分钟</div>
      </button>
      <button
        onClick={() => handleRating(2)}
        className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-md"
      >
        <div className="text-lg mb-1">😕</div>
        <div className="text-xs">不记得</div>
        <div className="text-xs opacity-75">10分钟</div>
      </button>
      <button
        onClick={() => handleRating(3)}
        className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-md"
      >
        <div className="text-lg mb-1">😐</div>
        <div className="text-xs">困难回忆</div>
        <div className="text-xs opacity-75">1天</div>
      </button>
      <button
        onClick={() => handleRating(4)}
        className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md"
      >
        <div className="text-lg mb-1">😊</div>
        <div className="text-xs">正确但犹豫</div>
        <div className="text-xs opacity-75">2-3天</div>
      </button>
      <button
        onClick={() => handleRating(5)}
        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors shadow-md"
      >
        <div className="text-lg mb-1">😎</div>
        <div className="text-xs">轻松记住</div>
        <div className="text-xs opacity-75">4+天</div>
      </button>
    </div>
  );

  // 统计卡片
  const StatisticsCard = () => {
    if (!statistics) return null;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
          学习统计
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statistics.totalCards}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">总卡片</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {statistics.dueCards}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">待复习</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statistics.reviewedToday}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">今日已复习</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {statistics.averageQuality.toFixed(1)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">平均质量</div>
          </div>
        </div>

        {/* 记忆强度分布 */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">记忆强度分布</div>
          <div className="flex gap-1 h-6">
            <div
              className="bg-red-500 rounded-l"
              style={{ width: `${(statistics.memoryStrengthDistribution.weak / statistics.totalCards) * 100}%` }}
              title={`弱: ${statistics.memoryStrengthDistribution.weak}`}
            />
            <div
              className="bg-yellow-500"
              style={{ width: `${(statistics.memoryStrengthDistribution.medium / statistics.totalCards) * 100}%` }}
              title={`中: ${statistics.memoryStrengthDistribution.medium}`}
            />
            <div
              className="bg-green-500 rounded-r"
              style={{ width: `${(statistics.memoryStrengthDistribution.strong / statistics.totalCards) * 100}%` }}
              title={`强: ${statistics.memoryStrengthDistribution.strong}`}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-1">
            <span>弱: {statistics.memoryStrengthDistribution.weak}</span>
            <span>中: {statistics.memoryStrengthDistribution.medium}</span>
            <span>强: {statistics.memoryStrengthDistribution.strong}</span>
          </div>
        </div>
      </div>
    );
  };

  // 卡片列表视图
  const CardListView = () => (
    <div className="space-y-3">
      {sortedCards.slice(0, 20).map((card, index) => {
        const isDue = isCardDue(card);
        const memoryStrength = getMemoryStrength(card);
        const timeUntilReview = getTimeUntilReview(card);

        return (
          <div
            key={card.id}
            className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 ${
              isDue ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-1 rounded ${
                    isDue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {isDue ? '需要复习' : timeUntilReview}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    强度: {memoryStrength}%
                  </span>
                </div>
                <h4 className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                  {card.question}
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>EF: {card.easeFactor.toFixed(2)}</span>
              <span>·</span>
              <span>已复习 {card.repetitions} 次</span>
              {card.tags.length > 0 && (
                <>
                  <span>·</span>
                  <div className="flex gap-1">
                    {card.tags.map((tag, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // 复习模式
  if (isReviewMode && currentCard) {
    const progress = ((currentCardIndex + 1) / sortedCards.length) * 100;

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                复习进度
              </span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {currentCardIndex + 1} / {sortedCards.length}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 卡片 */}
          <div className="mb-6">
            <Flashcard
              card={currentCard}
              showAnswer={showAnswer}
              onFlip={() => setShowAnswer(!showAnswer)}
            />
          </div>

          {/* 评分按钮 */}
          {showAnswer && <RatingButtons />}

          {/* 退出按钮 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={exitReview}
              className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              退出复习
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 正常视图
  return (
    <div className="space-y-4">
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          间隔重复学习
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllCards(!showAllCards)}
            className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            {showAllCards ? '仅显示待复习' : '显示全部'}
          </button>
          <AnkiImporter
            cards={sessionCards}
            onImportCards={handleImportCards}
            sessionId={sessionId}
          />
        </div>
      </div>

      {/* 统计卡片 */}
      <StatisticsCard />

      {/* 开始复习按钮 */}
      {dueCards.length > 0 && (
        <button
          onClick={startReview}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium text-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          开始复习 ({dueCards.length} 张卡片待复习)
        </button>
      )}

      {/* 卡片列表 */}
      {sessionCards.length > 0 ? (
        <CardListView />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-600 dark:text-slate-400 mb-2">还没有创建任何学习卡片</p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            继续与 AI 对话，它会自动为您提取重要知识点
          </p>
        </div>
      )}
    </div>
  );
};

export default SpacedRepetition;
