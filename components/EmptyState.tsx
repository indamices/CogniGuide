import React from 'react';

interface EmptyStateProps {
  type: 'chat' | 'history' | 'notes';
}

type EmptyStateConfig = {
  icon: string;
  title: string;
  subtitle: string;
  suggestions?: string[];
  action?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const emptyStates: Record<string, EmptyStateConfig> = {
    chat: {
      icon: '💭',
      title: '开始你的学习之旅',
      subtitle: '输入主题开始探索知识',
      suggestions: [
        '什么是机器学习？',
        '解释量子计算',
        'React hooks 原理'
      ]
    },
    history: {
      icon: '📚',
      title: '暂无历史记录',
      subtitle: '你的学习记录将显示在这里',
      action: '开始新对话'
    },
    notes: {
      icon: '📝',
      title: '笔记将自动生成',
      subtitle: '随着对话深入，关键知识点会自动整理'
    }
  };

  const state = emptyStates[type];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-white min-h-[300px]">
      <div className="animate-fade-in">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg mb-6 mx-auto">
          <span className="text-4xl">{state.icon}</span>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {state.title}
        </h2>
        
        <p className="text-slate-600 max-w-md mx-auto text-sm md:text-base leading-relaxed mb-6">
          {state.subtitle}
        </p>
        
        {state.suggestions && state.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
              尝试以下话题：
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {state.suggestions.map((suggestion: string, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    // 触发话题选择
                    const event = new CustomEvent('topic-suggestion', { detail: suggestion });
                    window.dispatchEvent(event);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md transition-all text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {state.action !== undefined && (
          <button
            onClick={() => {
              const event = new CustomEvent('start-new-chat', { detail: true });
              window.dispatchEvent(event);
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-colors font-medium"
          >
            {state.action}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
