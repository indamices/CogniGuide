import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, MessageRole, TeachingMode } from '../types';
import MessageContent from './MessageContent';
import EmptyState from './EmptyState';
import useSpeech from '../hooks/useSpeech';
import VoiceInputButton from './VoiceInputButton';
import VoiceControlPanel from './VoiceControlPanel';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isStreaming?: boolean;
  loadingProgress?: number;
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
  isStreaming = false,
  loadingProgress = 0,
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
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // 语音功能
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsSpeechSynthesis,
    voiceConfig,
    updateVoiceConfig,
    availableVoices,
    isSpeaking,
    isPaused,
    currentSpeakingMessageId,
    speak,
    pause: pauseSpeech,
    resume: resumeSpeech,
    cancel: cancelSpeech,
    error: speechError,
  } = useSpeech();

  // 移除自动滚动，改为用户手动控制
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  useEffect(() => {
    setEditTitleInput(sessionTitle || topic || '');
  }, [sessionTitle, topic]);

  // 语音识别结果自动填充到输入框
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      if (textareaRef.current) {
        adjustTextareaHeight(textareaRef.current);
      }
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  // 加载输入历史记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cogniguide_input_history');
      if (saved) {
        inputHistoryRef.current = JSON.parse(saved);
      }
    } catch (err) {
      console.warn('无法加载输入历史:', err);
    }
  }, []);

  // 自动调整 textarea 高度
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 60;
    const maxHeight = 200;
    textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
  };

  // 处理输入变化，自动调整高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    
    // 保存到历史记录（最多保存50条）
    const trimmedInput = input.trim();
    if (trimmedInput && !inputHistoryRef.current.includes(trimmedInput)) {
      inputHistoryRef.current.unshift(trimmedInput);
      if (inputHistoryRef.current.length > 50) {
        inputHistoryRef.current = inputHistoryRef.current.slice(0, 50);
      }
      try {
        localStorage.setItem('cogniguide_input_history', JSON.stringify(inputHistoryRef.current));
      } catch (err) {
        console.warn('无法保存输入历史:', err);
      }
    }
    
    setInput('');
    historyIndexRef.current = -1;
    
    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 空格键语音输入（仅当输入框为空时）
    if (e.key === ' ' && !input.trim() && !isLoading && browserSupportsSpeechRecognition) {
      e.preventDefault();
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
      return;
    }

    // Enter 发送（无 Shift）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
      return;
    }

    // 快捷键：Ctrl+K 或 Cmd+K 清空输入
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setInput('');
      historyIndexRef.current = -1;
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      return;
    }

    // 历史记录导航：上箭头
    if (e.key === 'ArrowUp' && !e.shiftKey && inputHistoryRef.current.length > 0) {
      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      
      // 如果光标不在第一行，正常的上箭头行为
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      if (textBeforeCursor.includes('\n') || cursorPos > 0) {
        return; // 允许正常的上箭头行为
      }

      // 如果光标在第一行开头，加载历史记录
      if (cursorPos === 0 && textarea.value === '') {
        e.preventDefault();
        if (historyIndexRef.current < inputHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          const historyItem = inputHistoryRef.current[historyIndexRef.current];
          setInput(historyItem);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = historyItem.length;
            adjustTextareaHeight(textarea);
          }, 0);
        }
        return;
      }
      
      // 如果输入框不为空，且光标在第一行开头
      if (cursorPos === 0) {
        e.preventDefault();
        if (historyIndexRef.current < inputHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          const historyItem = inputHistoryRef.current[historyIndexRef.current];
          setInput(historyItem);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = historyItem.length;
            adjustTextareaHeight(textarea);
          }, 0);
        }
        return;
      }
    }

    // 历史记录导航：下箭头
    if (e.key === 'ArrowDown' && !e.shiftKey) {
      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      const textAfterCursor = textarea.value.substring(cursorPos);
      
      // 如果光标不在最后一行，正常的下箭头行为
      if (textAfterCursor.includes('\n') || cursorPos < textarea.value.length) {
        return; // 允许正常的下箭头行为
      }

      // 如果光标在最后，加载历史记录
      if (historyIndexRef.current > 0) {
        e.preventDefault();
        historyIndexRef.current--;
        const historyItem = inputHistoryRef.current[historyIndexRef.current];
        setInput(historyItem);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = historyItem.length;
          adjustTextareaHeight(textarea);
        }, 0);
      } else if (historyIndexRef.current === 0) {
        e.preventDefault();
        historyIndexRef.current = -1;
        setInput('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
      return;
    }
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
    { id: 'GLM-4.7-Flash', name: 'GLM-4 Flash ⚡' },
    { id: 'GLM-4.7-Plus', name: 'GLM-4 Plus 🚀' },
    // MiniMax M2 系列（旗舰模型）
    { id: 'MiniMax-M2.5', name: 'MiniMax M2.5 (旗舰)' },
    { id: 'MiniMax-M2.5-lightning', name: 'MiniMax M2.5 Lightning (闪电)' },
    { id: 'MiniMax-M2.1', name: 'MiniMax M2.1 (编程)' },
    { id: 'MiniMax-M2.1-ning', name: 'MiniMax M2.1-ning (均衡)' },
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
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTopicSubmit(e as any);
                  }
                  // Ctrl+K 清空
                  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    setInput('');
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                    }
                  }
                }}
                placeholder="例如：相对论, 印象派, 递归算法...&#10;（Shift+Enter 换行，Enter 发送，Ctrl+K 清空）"
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
            {/* Voice Control Toggle */}
            {browserSupportsSpeechSynthesis && (
              <button
                onClick={() => setShowVoicePanel(!showVoicePanel)}
                className={`hidden md:flex p-1.5 rounded-lg transition-colors ${
                  showVoicePanel
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="语音控制面板"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            )}

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
                messageId={msg.id}
                isSpeaking={currentSpeakingMessageId === msg.id ? isSpeaking : false}
                isPaused={currentSpeakingMessageId === msg.id ? isPaused : false}
                onSpeak={speak}
                onPause={pauseSpeech}
                onResume={resumeSpeech}
                onCancel={cancelSpeech}
              />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 rounded-bl-none flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-700">AI 正在思考</span>
                <span className="text-xs text-slate-500">
                  {loadingProgress > 0 && `已完成 ${loadingProgress}%`}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={browserSupportsSpeechRecognition
              ? "输入你的想法...（Shift+Enter 换行，Enter 发送，空格键语音输入，↑↓ 历史，Ctrl+K 清空）"
              : "输入你的想法...（Shift+Enter 换行，Enter 发送，↑↓ 历史，Ctrl+K 清空）"
            }
            disabled={isLoading}
            name="message-input"
            id="message-input"
            className="w-full pl-5 pr-28 py-3.5 min-h-[60px] max-h-[200px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base resize-none overflow-y-auto"
            rows={2}
          />

          {/* Voice Input Button */}
          {browserSupportsSpeechRecognition && (
            <div className="absolute right-12 bottom-2">
              <VoiceInputButton
                isListening={isListening}
                transcript={transcript}
                interimTranscript={interimTranscript}
                onStart={startListening}
                onStop={stopListening}
                onReset={resetTranscript}
                disabled={isLoading}
                error={speechError}
              />
            </div>
          )}

          {/* Send Button */}
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

        {/* Voice Control Panel */}
        <VoiceControlPanel
          voiceConfig={voiceConfig}
          onConfigChange={updateVoiceConfig}
          availableVoices={availableVoices}
          isOpen={showVoicePanel}
          onClose={() => setShowVoicePanel(false)}
        />
      </div>
    </div>
  );
};

export default ChatArea;