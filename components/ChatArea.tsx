import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, MessageRole, TeachingMode } from '../types';
import MessageContent from './MessageContent';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  topic?: string;
  onRequestChangeTopic: (newTopic: string) => void; 
  selectedModel: string;
  onModelChange: (model: string) => void;
  teachingMode: TeachingMode;
  onTeachingModeChange: (mode: TeachingMode) => void;
  onToggleSidebar: () => void;
  sessionTitle: string;
  onUpdateSessionTitle: (newTitle: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  topic, 
  onRequestChangeTopic,
  selectedModel,
  onModelChange,
  teachingMode,
  onTeachingModeChange,
  onToggleSidebar,
  sessionTitle,
  onUpdateSessionTitle
}) => {
  const [input, setInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // 移除自动滚动，改为用户手动控制
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  useEffect(() => {
    setEditTitleInput(sessionTitle || topic || '');
  }, [sessionTitle, topic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onRequestChangeTopic(input);
    setInput('');
  };

  const handleTitleBlur = () => {
    if (editTitleInput.trim() && editTitleInput !== sessionTitle) {
      onUpdateSessionTitle(editTitleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setEditTitleInput(sessionTitle || topic || '');
      setIsEditingTitle(false);
    }
  };

  const availableModels = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
    { id: 'V3.2', name: 'DeepSeek V3.2' },
    { id: 'V3.2Think', name: 'DeepSeek V3.2 Think' },
  ];

  const teachingModes = [
    { id: TeachingMode.Auto, name: '🤖 智能适应 (推荐)', desc: 'AI 自动分析并切换策略' },
    { id: TeachingMode.Socratic, name: '❓ 苏格拉底模式', desc: '深度提问，引导思考' },
    { id: TeachingMode.Narrative, name: '📖 叙事讲解模式', desc: '故事化，类比，历史背景' },
    { id: TeachingMode.Lecture, name: '🎓 讲授模式', desc: '直接解释，清晰定义' },
  ];

  if (!topic) {
    return (
      <div className="flex flex-col h-full bg-white md:rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <button 
             onClick={onToggleSidebar}
             className="absolute top-4 left-4 p-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
        >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
             </svg>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            {/* Restored Branding Header */}
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                CogniGuide
                {/* Version badge removed here */}
            </h1>
            
            <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                新一代动态自适应学习引擎。<br />
                它可以是你的严师（苏格拉底），也可以是你的益友（叙事者）。
            </p>

            <form onSubmit={handleTopicSubmit} className="w-full max-w-2xl mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">今天探索什么知识？</label>
            <div className="flex gap-2">
                <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTopicSubmit(e as any);
                  }
                }}
                placeholder="例如：相对论, 印象派, 递归算法...&#10;（Shift+Enter 换行，Enter 发送）"
                className="flex-1 px-4 py-3 min-h-[120px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow resize-y text-sm md:text-base"
                autoFocus
                rows={4}
                />
                <button
                type="submit"
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors self-start"
                >
                启程
                </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">💡 提示：支持多行输入，Shift+Enter 换行，Enter 发送</p>
            </form>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-left max-w-md w-full">
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">教学模式</label>
                    <select 
                        value={teachingMode} 
                        onChange={(e) => onTeachingModeChange(e.target.value as TeachingMode)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {teachingModes.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">AI 模型</label>
                    <select 
                        value={selectedModel} 
                        onChange={(e) => onModelChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {availableModels.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white md:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm flex justify-between items-center min-h-[60px]">
        <div className="flex items-center gap-3 overflow-hidden">
             <button 
                onClick={onToggleSidebar}
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors md:hidden"
             >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
             </button>
             
             <div className="min-w-0">
               <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">当前探索</h2>
               {isEditingTitle ? (
                 <input
                   type="text"
                   value={editTitleInput}
                   onChange={(e) => setEditTitleInput(e.target.value)}
                   onBlur={handleTitleBlur}
                   onKeyDown={handleTitleKeyDown}
                   autoFocus
                   className="text-base font-bold text-slate-800 bg-white border border-indigo-300 rounded px-1.5 py-0.5 -ml-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                 />
               ) : (
                 <div 
                    className="group flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsEditingTitle(true)}
                    title="点击修改标题"
                 >
                    <p className="text-base font-bold text-slate-800 truncate">{sessionTitle || topic}</p>
                    <svg className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                 </div>
               )}
             </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            {/* Mode Selector (Compact) */}
            <div className="relative group hidden md:block">
                 <select 
                    value={teachingMode} 
                    onChange={(e) => onTeachingModeChange(e.target.value as TeachingMode)}
                    className="appearance-none bg-indigo-50 text-indigo-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    {teachingModes.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-600">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>

            <div className="flex items-center">
                <select 
                    value={selectedModel} 
                    onChange={(e) => onModelChange(e.target.value)}
                    className="text-xs bg-transparent border-none text-slate-500 hover:text-indigo-600 cursor-pointer focus:ring-0 text-right md:pr-6 max-w-[80px] md:max-w-none truncate"
                >
                    {availableModels.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>
            <button 
                onClick={() => onRequestChangeTopic('')} 
                className="hidden md:block text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
            >
                新话题
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === MessageRole.User ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-5 py-4 leading-relaxed shadow-sm ${
                msg.role === MessageRole.User
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
              }`}
            >
              <MessageContent 
                content={msg.content || ''} 
                role={msg.role === MessageRole.User ? 'user' : 'model'}
              />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 rounded-bl-none flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <span className="text-xs text-slate-400 ml-2">动态思考策略中...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder="输入你的想法...（Shift+Enter 换行，Enter 发送）"
            disabled={isLoading}
            className="w-full pl-5 pr-12 py-3.5 min-h-[60px] max-h-[200px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base resize-y"
            rows={2}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;