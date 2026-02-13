/**
 * 学习路径可视化组件
 * 使用流程图展示推荐的学习路径
 */

import React, { useMemo } from 'react';
import { Recommendation, RecommendationType } from '../utils/recommendationEngine';
import { ConceptNode, ConceptLink, MasteryLevel } from '../types';

interface LearningPathFlowProps {
  recommendations: Recommendation[];
  concepts: ConceptNode[];
  links: ConceptLink[];
  onSelectRecommendation?: (recommendation: Recommendation) => void;
}

const LearningPathFlow: React.FC<LearningPathFlowProps> = ({
  recommendations,
  concepts,
  links,
  onSelectRecommendation,
}) => {
  // 构建路径结构
  const pathStructure = useMemo(() => {
    // 按优先级和类型分组
    const highPriority = recommendations.filter(r => r.priority === 'high');
    const mediumPriority = recommendations.filter(r => r.priority === 'medium');
    const lowPriority = recommendations.filter(r => r.priority === 'low');

    return {
      high: highPriority,
      medium: mediumPriority,
      low: lowPriority,
    };
  }, [recommendations]);

  // 获取节点颜色
  const getNodeColor = (type: RecommendationType): string => {
    switch (type) {
      case RecommendationType.NextToLearn:
        return 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300';
      case RecommendationType.WeakPoints:
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300';
      case RecommendationType.RelatedTopics:
        return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300';
      case RecommendationType.DueForReview:
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300';
      case RecommendationType.RestBreak:
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300';
    }
  };

  // 获取图标
  const getTypeIcon = (type: RecommendationType): string => {
    switch (type) {
      case RecommendationType.NextToLearn:
        return '📚';
      case RecommendationType.WeakPoints:
        return '💪';
      case RecommendationType.RelatedTopics:
        return '🔗';
      case RecommendationType.DueForReview:
        return '⏰';
      case RecommendationType.RestBreak:
        return '☕';
      default:
        return '📝';
    }
  };

  // 绘制推荐节点
  const renderNode = (rec: Recommendation, index: number) => {
    const colorClass = getNodeColor(rec.type);
    const icon = getTypeIcon(rec.type);

    return (
      <div
        key={rec.id}
        onClick={() => onSelectRecommendation?.(rec)}
        className={`
          relative cursor-pointer transition-all duration-200
          hover:scale-105 hover:shadow-lg
        `}
      >
        {/* 节点卡片 */}
        <div className={`
          ${colorClass} border-2 rounded-xl p-3 shadow-sm
          min-w-[180px] max-w-[200px]
        `}>
          {/* Icon and Title */}
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold leading-tight line-clamp-2">
                {rec.title}
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-[10px] opacity-75">
            <div className="flex items-center gap-1">
              {rec.estimatedTime && (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{rec.estimatedTime}m</span>
                </>
              )}
            </div>
            <div className="font-medium">
              {rec.confidenceScore >= 0.8 ? '精准' : rec.confidenceScore >= 0.6 ? '推荐' : '可选'}
            </div>
          </div>
        </div>

        {/* 连接箭头 */}
        {index < recommendations.length - 1 && (
          <div className="absolute left-1/2 -bottom-6 transform -translate-x-1/2 z-0">
            <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // 绘制路径
  const renderPath = (recs: Recommendation[], level: number) => {
    if (recs.length === 0) return null;

    return (
      <div className="mb-8">
        {/* Level Header */}
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className={`
            px-2 py-1 rounded text-xs font-semibold
            ${level === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : ''}
            ${level === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : ''}
            ${level === 2 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}
          `}>
            {level === 0 ? '🔴 高优先级' : level === 1 ? '🟡 中优先级' : '🟢 低优先级'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {recs.length} 个推荐
          </div>
        </div>

        {/* Path Nodes */}
        <div className="flex flex-col items-center gap-6 relative">
          {recs.map((rec, index) => (
            <div key={rec.id} className="relative">
              {renderNode(rec, index)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 绘制知识图谱概览
  const renderConceptMap = () => {
    const masteredCount = concepts.filter(c =>
      c.mastery === MasteryLevel.Expert || c.mastery === MasteryLevel.Competent
    ).length;
    const learningCount = concepts.filter(c =>
      c.mastery === MasteryLevel.Novice
    ).length;
    const unknownCount = concepts.filter(c =>
      c.mastery === MasteryLevel.Unknown
    ).length;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
          📊 知识图谱概览
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{masteredCount}</div>
            <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">已掌握</div>
          </div>
          <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{learningCount}</div>
            <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70">学习中</div>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="text-lg font-bold text-slate-600 dark:text-slate-400">{unknownCount}</div>
            <div className="text-[10px] text-slate-600/70 dark:text-slate-400/70">未接触</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto pb-8">
      {/* Knowledge Map Overview */}
      {concepts.length > 0 && renderConceptMap()}

      {/* Learning Path */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            🔀 学习路径
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            从上到下按优先级排序
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
            暂无推荐路径
          </div>
        ) : (
          <div className="space-y-6">
            {renderPath(pathStructure.high, 0)}
            {renderPath(pathStructure.medium, 1)}
            {renderPath(pathStructure.low, 2)}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          图例说明
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700"></span>
            <span className="text-slate-600 dark:text-slate-400">接下来学习</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"></span>
            <span className="text-slate-600 dark:text-slate-400">薄弱强化</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700"></span>
            <span className="text-slate-600 dark:text-slate-400">相关拓展</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"></span>
            <span className="text-slate-600 dark:text-slate-400">今日复习</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700"></span>
            <span className="text-slate-600 dark:text-slate-400">休息建议</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathFlow;
