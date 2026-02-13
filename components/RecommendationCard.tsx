/**
 * 推荐卡片组件
 * 展示单个推荐项，包含反馈和交互功能
 */

import React, { useState } from 'react';
import { Recommendation, RecommendationType } from '../utils/recommendationEngine';
import { ConceptNode, MasteryLevel } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  concepts: ConceptNode[];
  onStartLearning: (recommendation: Recommendation) => void;
  onSkip: (recommendationId: string) => void;
  onFeedback?: (recommendationId: string, helpful: boolean) => void;
  isDark?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  concepts,
  onStartLearning,
  onSkip,
  onFeedback,
  isDark = false,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);

  const getTypeColor = (type: RecommendationType): string => {
    switch (type) {
      case RecommendationType.NextToLearn:
        return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400';
      case RecommendationType.WeakPoints:
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case RecommendationType.RelatedTopics:
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400';
      case RecommendationType.DueForReview:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case RecommendationType.RestBreak:
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  const getTypeLabel = (type: RecommendationType): string => {
    switch (type) {
      case RecommendationType.NextToLearn:
        return '📚 接下来学习';
      case RecommendationType.WeakPoints:
        return '💪 薄弱强化';
      case RecommendationType.RelatedTopics:
        return '🔗 相关拓展';
      case RecommendationType.DueForReview:
        return '⏰ 今日复习';
      case RecommendationType.RestBreak:
        return '☕ 休息建议';
      default:
        return '📝 学习建议';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getRelatedConcepts = (): ConceptNode[] => {
    return concepts.filter(c => recommendation.concepts.includes(c.id));
  };

  const handleStart = () => {
    onStartLearning(recommendation);
  };

  const handleSkip = () => {
    onSkip(recommendation.id);
  };

  const handleFeedback = (helpful: boolean) => {
    if (onFeedback) {
      onFeedback(recommendation.id, helpful);
      setHasFeedback(true);
      setShowFeedback(false);
    }
  };

  const relatedConcepts = getRelatedConcepts();
  const masterySummary = relatedConcepts.length > 0
    ? relatedConcepts.map(c => {
        const icon = c.mastery === MasteryLevel.Expert ? '🟢'
          : c.mastery === MasteryLevel.Competent ? '🔵'
          : c.mastery === MasteryLevel.Novice ? '🟠' : '⚪';
        return `${icon} ${c.name}`;
      }).join('、')
    : '';

  return (
    <div className={`
      bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700
      hover:shadow-md transition-all duration-200 overflow-hidden
      ${recommendation.type === RecommendationType.RestBreak ? 'border-purple-200 dark:border-purple-800' : ''}
    `}>
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium">
                {getPriorityIcon(recommendation.priority)}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getTypeColor(recommendation.type)}`}>
                {getTypeLabel(recommendation.type)}
              </span>
              {recommendation.confidenceScore >= 0.8 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  精准匹配
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {recommendation.title}
            </h3>
          </div>
          {recommendation.estimatedTime && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ml-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{recommendation.estimatedTime}分钟</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {recommendation.description}
        </p>

        {/* Related Concepts */}
        {masterySummary && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500 mt-0.5">
              相关概念：
            </span>
            <span className="text-slate-600 dark:text-slate-300 flex-1">
              {masterySummary}
            </span>
          </div>
        )}

        {/* Reason */}
        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
              {recommendation.reason}
            </p>
          </div>
        </div>

        {/* Suggested Questions */}
        {recommendation.suggestedQuestions && recommendation.suggestedQuestions.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              建议问题：
            </div>
            {recommendation.suggestedQuestions.slice(0, 2).map((question, index) => (
              <div
                key={index}
                className="text-xs text-slate-600 dark:text-slate-300 pl-3 border-l-2 border-indigo-200 dark:border-indigo-800"
              >
                {question}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleStart}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${recommendation.type === RecommendationType.RestBreak
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }
                shadow-sm hover:shadow-md
              `}
            >
              {recommendation.type === RecommendationType.RestBreak ? '知道了' : '开始学习'}
            </button>
            <button
              onClick={handleSkip}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              跳过
            </button>
          </div>

          {/* Feedback */}
          <div className="flex items-center gap-1">
            {!showFeedback && !hasFeedback ? (
              <button
                onClick={() => setShowFeedback(true)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                title="反馈这个推荐是否有用"
              >
                反馈
              </button>
            ) : showFeedback && !hasFeedback ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleFeedback(true)}
                  className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                  title="有用"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                  title="无用"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                </button>
              </div>
            ) : hasFeedback ? (
              <span className="text-xs text-green-600 dark:text-green-400">
                已反馈
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
