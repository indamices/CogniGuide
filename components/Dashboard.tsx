
import React, { useState } from 'react';
import { MasteryLevel, LearningState, TeachingStage } from '../types';
import KnowledgeMapSwitcher from './KnowledgeMapSwitcher';
import SpacedRepetition from './SpacedRepetition';
import CreateCardDialog from './CreateCardDialog';
import LearningPathRecommendations from './LearningPathRecommendations';
import { ReviewCard } from '../types';
import { extractKeyConceptsFromAI } from '../utils/spacedRepetition';
import { Recommendation } from '../utils/recommendationEngine';
import SyncStatus from './SyncStatus';

interface DashboardProps {
  state: LearningState;
  onExport: () => void;
  cards?: ReviewCard[];
  onUpdateCards?: (cards: ReviewCard[]) => void;
  sessionId?: string;
  sessions?: any[];
  onStartLearning?: (recommendation: Recommendation) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  state,
  onExport,
  cards = [],
  onUpdateCards,
  sessionId,
  sessions = [],
  onStartLearning
}) => {
  const [showMindMap, setShowMindMap] = useState(false);
  const [showSpacedRepetition, setShowSpacedRepetition] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'review' | 'recommendations'>('dashboard');

  const conceptCounts = {
    [MasteryLevel.Expert]: state.concepts.filter(c => c.mastery === MasteryLevel.Expert).length,
    [MasteryLevel.Competent]: state.concepts.filter(c => c.mastery === MasteryLevel.Competent).length,
    [MasteryLevel.Novice]: state.concepts.filter(c => c.mastery === MasteryLevel.Novice).length,
    [MasteryLevel.Unknown]: state.concepts.filter(c => c.mastery === MasteryLevel.Unknown).length,
  };

  const totalConcepts = state.concepts.length || 1;
  const masteryScore = Math.round(
    ((conceptCounts[MasteryLevel.Expert] * 100) + 
     (conceptCounts[MasteryLevel.Competent] * 60) + 
     (conceptCounts[MasteryLevel.Novice] * 20)) / totalConcepts
  );

  // Helper for Stage Progress
  const stages = [
    { id: TeachingStage.Introduction, label: '引入' },
    { id: TeachingStage.Construction, label: '构建' },
    { id: TeachingStage.Consolidation, label: '巩固' },
    { id: TeachingStage.Transfer, label: '迁移' },
    { id: TeachingStage.Reflection, label: '反思' },
  ];
  
  const currentStageIndex = stages.findIndex(s => s.id === state.currentStage);

  const handleCreateCard = (card: ReviewCard) => {
    if (onUpdateCards) {
      onUpdateCards([...cards, card]);
    }
  };

  // 从笔记中提取知识点并创建卡片
  const handleExtractCards = () => {
    if (!onUpdateCards || !sessionId) return;

    const lastSummary = state.summary.slice(-3).join('\n\n');
    if (!lastSummary) {
      alert('暂无笔记可用于提取');
      return;
    }

    const concepts = extractKeyConceptsFromAI(lastSummary, sessionId);
    if (concepts.length === 0) {
      alert('未找到明显的知识点，请继续学习后再试');
      return;
    }

    const newCards: ReviewCard[] = concepts.map(c => {
      const cardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: cardId,
        question: c.question,
        answer: c.answer,
        sessionId,
        createdDate: Date.now(),
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: Date.now(),
        tags: [...(c.tags || []), '自动提取'],
        reviewHistory: [],
        priority: c.priority
      };
    });

    onUpdateCards([...cards, ...newCards]);
    alert(`已创建 ${newCards.length} 张复习卡片！`);
  };

  return (
    <div className="h-full flex flex-col space-y-4 relative">
      {/* Tab 切换 */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          学习仪表板
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all relative ${
            activeTab === 'review'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          间隔重复
          {cards.filter(c => c.sessionId === sessionId && c.nextReviewDate <= Date.now()).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cards.filter(c => c.sessionId === sessionId && c.nextReviewDate <= Date.now()).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'recommendations'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          智能推荐
        </button>
      </div>

      {/* Sync Status */}
      <div className="mb-3 px-2">
        <SyncStatus className="text-xs" />
      </div>

      {/* 推荐模式 */}
      {activeTab === 'recommendations' ? (
        <div className="flex-1 overflow-hidden">
          <LearningPathRecommendations
            concepts={state.concepts}
            links={state.links}
            reviewCards={cards}
            sessionId={sessionId}
            sessions={sessions}
            onStartLearning={onStartLearning}
          />
        </div>
      ) : activeTab === 'review' ? (
        <div className="flex-1 overflow-y-auto">
          <SpacedRepetition
            cards={cards}
            onUpdateCards={onUpdateCards || (() => {})}
            sessionId={sessionId}
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowCreateCard(true)}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              手动创建卡片
            </button>
            <button
              onClick={handleExtractCards}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              从笔记提取
            </button>
          </div>
        </div>
      ) : (
        <>
      {/* 原有的 Dashboard 内容 */}
      {/* Mind Map Modal */}
      
      {/* Mind Map Modal */}
      {showMindMap && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-10">
          <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">知识图谱 (Knowledge Graph)</h3>
              <button onClick={() => setShowMindMap(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 relative bg-slate-50">
              <KnowledgeMapSwitcher
                concepts={state.concepts}
                links={state.links}
                height="100%"
              />
            </div>
          </div>
        </div>
      )}

      {/* Teaching Engine Monitor */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 opacity-50 blur-xl"></div>
        
        {/* Phase Tracker */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">当前教学阶段</h3>
            </div>
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-0"></div>
                {stages.map((stage, idx) => {
                    const isActive = idx === currentStageIndex;
                    const isPast = idx < currentStageIndex;
                    return (
                        <div key={stage.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                                isActive ? 'bg-indigo-600 border-indigo-600 scale-125' : 
                                isPast ? 'bg-indigo-400 border-indigo-400' : 'bg-white border-slate-300'
                            }`}></div>
                            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                                {stage.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Dynamic Strategy Card */}
        <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 flex items-start space-x-3">
             <div className="mt-1">
                 <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
             </div>
             <div>
                 <div className="text-[10px] font-bold text-indigo-400 uppercase">当前动态策略</div>
                 <div className="text-sm font-semibold text-indigo-900">{state.currentStrategy}</div>
                 <div className="text-xs text-indigo-600/70 mt-0.5">
                     {state.cognitiveLoad === 'High' ? '⚠️ 认知负荷较高，已自动降维' : '✅ 认知负荷处于最佳区间'}
                 </div>
             </div>
        </div>
      </div>

      {/* Mastery Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
         <div className="flex justify-between items-end mb-2">
            <h3 className="font-semibold text-slate-700 text-sm">知识掌握度</h3>
            <span className="text-xl font-bold text-slate-800">{isNaN(masteryScore) ? 0 : masteryScore}%</span>
         </div>
         <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
            <div style={{ width: `${(conceptCounts[MasteryLevel.Expert] / totalConcepts) * 100}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${(conceptCounts[MasteryLevel.Competent] / totalConcepts) * 100}%` }} className="bg-blue-500 h-full" />
            <div style={{ width: `${(conceptCounts[MasteryLevel.Novice] / totalConcepts) * 100}%` }} className="bg-amber-400 h-full" />
         </div>
      </div>

      {/* Summary Notes */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-700 text-sm">智能学习笔记</h3>
            <button onClick={onExport} className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors font-medium">
                导出
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] bg-white">
            {state.summary.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                    <p className="text-xs">随着学习的深入，<br/>关键知识点将自动生成...</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {state.summary.map((note, index) => (
                        <li key={index} className="flex items-start group">
                            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-indigo-200 font-mono text-[10px] mr-2 mt-0.5 group-hover:text-indigo-400 transition-colors border border-indigo-100 rounded">
                                {index + 1}
                            </span>
                            <p className="text-slate-700 text-sm leading-relaxed pb-1">
                                {note}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>

      </div>

      {/* Floating Mind Map Button - Fixed Position (Outside of scrollable container) */}
      <button
        onClick={() => setShowMindMap(true)}
        disabled={state.concepts.length === 0}
        className="fixed bottom-6 right-6 z-30 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 disabled:bg-indigo-400 disabled:hover:bg-indigo-400 disabled:cursor-not-allowed text-xs font-semibold flex items-center justify-center gap-2 backdrop-blur-sm"
        aria-label="查看知识图谱（右下角悬浮按钮）"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>查看脑图</span>
      </button>
        </>
      )}

      {/* 创建卡片对话框 */}
      <CreateCardDialog
        isOpen={showCreateCard}
        onClose={() => setShowCreateCard(false)}
        onCreateCard={handleCreateCard}
        sessionId={sessionId}
      />
    </div>
  );
};

export default Dashboard;
