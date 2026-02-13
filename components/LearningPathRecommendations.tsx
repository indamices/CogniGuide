/**
 * 学习路径推荐组件
 * 主组件，包含推荐类型切换和列表展示
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Recommendation,
  RecommendationType,
  generateRecommendations,
  exportRecommendationsAsPlan,
} from '../utils/recommendationEngine';
import { ConceptNode, ConceptLink, ReviewCard, SavedSession } from '../types';
import RecommendationCard from './RecommendationCard';
import LearningPathFlow from './LearningPathFlow';

interface LearningPathRecommendationsProps {
  concepts: ConceptNode[];
  links: ConceptLink[];
  reviewCards: ReviewCard[];
  sessionId?: string;
  sessions: SavedSession[];
  onStartLearning?: (recommendation: Recommendation) => void;
  isDark?: boolean;
}

const LearningPathRecommendations: React.FC<LearningPathRecommendationsProps> = ({
  concepts,
  links,
  reviewCards,
  sessionId,
  sessions,
  onStartLearning,
  isDark = false,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedType, setSelectedType] = useState<RecommendationType | 'all'>('all');
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [feedbackMap, setFeedbackMap] = useState<Map<string, boolean>>(new Map());
  const [showFlowView, setShowFlowView] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 生成推荐
  const refreshRecommendations = () => {
    setIsRefreshing(true);
    const newRecommendations = generateRecommendations(
      concepts,
      links,
      reviewCards,
      sessionId,
      sessions,
      {
        maxRecommendations: 8,
        enableRestBreaks: true,
        minConfidenceThreshold: 0.3,
        diversityFactor: 0.5,
      }
    );
    setRecommendations(newRecommendations);
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshRecommendations();
  }, [concepts, links, reviewCards, sessionId]);

  // 过滤推荐
  const filteredRecommendations = useMemo(() => {
    return recommendations
      .filter(rec => !skippedIds.has(rec.id))
      .filter(rec => selectedType === 'all' || rec.type === selectedType);
  }, [recommendations, skippedIds, selectedType]);

  // 统计各类推荐数量
  const typeCounts = useMemo(() => {
    const counts = new Map<RecommendationType, number>();
    recommendations.forEach(rec => {
      counts.set(rec.type, (counts.get(rec.type) || 0) + 1);
    });
    return counts;
  }, [recommendations]);

  // 处理开始学习
  const handleStartLearning = (rec: Recommendation) => {
    if (onStartLearning) {
      onStartLearning(rec);
    }
  };

  // 处理跳过
  const handleSkip = (recommendationId: string) => {
    setSkippedIds(prev => new Set([...prev, recommendationId]));
  };

  // 处理反馈
  const handleFeedback = (recommendationId: string, helpful: boolean) => {
    setFeedbackMap(prev => new Map([...prev, [recommendationId, helpful]]));

    // 保存到localStorage（可选）
    const feedbackHistory = JSON.parse(localStorage.getItem('cogniguide_recommendation_feedback') || '{}');
    feedbackHistory[recommendationId] = {
      helpful,
      timestamp: Date.now(),
    };
    localStorage.setItem('cogniguide_recommendation_feedback', JSON.stringify(feedbackHistory));
  };

  // 导出学习计划
  const handleExportPlan = () => {
    const plan = exportRecommendationsAsPlan(filteredRecommendations);

    // 复制到剪贴板
    navigator.clipboard.writeText(plan).then(() => {
      alert('学习计划已复制到剪贴板！');
    }).catch(() => {
      // 降级方案：显示模态框
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 class="font-bold text-lg">学习计划</h3>
            <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-6">
            <pre class="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">${plan}</pre>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    });
  };

  const typeFilters: Array<{ type: RecommendationType | 'all'; label: string; icon: string }> = [
    { type: 'all', label: '全部', icon: '📋' },
    { type: RecommendationType.NextToLearn, label: '接下来学习', icon: '📚' },
    { type: RecommendationType.WeakPoints, label: '薄弱强化', icon: '💪' },
    { type: RecommendationType.RelatedTopics, label: '相关拓展', icon: '🔗' },
    { type: RecommendationType.DueForReview, label: '今日复习', icon: '⏰' },
    { type: RecommendationType.RestBreak, label: '休息建议', icon: '☕' },
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">智能推荐</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFlowView(!showFlowView)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${showFlowView
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
              title="切换路径视图"
            >
              {showFlowView ? '📋 列表' : '🔀 路径'}
            </button>
            <button
              onClick={refreshRecommendations}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
              title="刷新推荐"
            >
              <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {typeFilters.map(filter => {
            const count = filter.type === 'all'
              ? filteredRecommendations.length
              : typeCounts.get(filter.type as RecommendationType) || 0;

            return (
              <button
                key={filter.type}
                onClick={() => setSelectedType(filter.type)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${selectedType === filter.type
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }
                  ${count === 0 ? 'opacity-50' : ''}
                `}
                disabled={count === 0}
              >
                <span className="mr-1">{filter.icon}</span>
                <span>{filter.label}</span>
                {count > 0 && (
                  <span className={`
                    ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]
                    ${selectedType === filter.type
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showFlowView ? (
          <LearningPathFlow
            recommendations={filteredRecommendations}
            concepts={concepts}
            links={links}
            onSelectRecommendation={handleStartLearning}
          />
        ) : (
          <div className="space-y-3">
            {filteredRecommendations.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
                <div className="text-slate-400 dark:text-slate-500 mb-3">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-sm">暂无推荐</p>
                  <p className="text-xs mt-1">继续学习后，系统将为您生成个性化推荐</p>
                </div>
                <button
                  onClick={refreshRecommendations}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  刷新推荐
                </button>
              </div>
            ) : (
              <>
                {filteredRecommendations.map((rec, index) => (
                  <div key={rec.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                    <RecommendationCard
                      recommendation={rec}
                      concepts={concepts}
                      onStartLearning={handleStartLearning}
                      onSkip={handleSkip}
                      onFeedback={handleFeedback}
                      isDark={isDark}
                    />
                  </div>
                ))}

                {/* Export Button */}
                {filteredRecommendations.length > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={handleExportPlan}
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      导出学习计划
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathRecommendations;
