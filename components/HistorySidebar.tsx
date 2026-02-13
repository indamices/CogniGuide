import React, { useState, useMemo } from 'react';
import { SavedSession } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onNewChat: () => void;
  onOpenAPIKeyManager?: () => void;
  version?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onNewChat,
  onOpenAPIKeyManager,
  version = 'v1.0.0'
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModel, setFilterModel] = useState<string>('all');

  const startEditing = (session: SavedSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleRenameSubmit = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    return sessions
      .filter(session => {
        // Search filter
        const matchesSearch = searchQuery === '' ||
          session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.topic.toLowerCase().includes(searchQuery.toLowerCase());

        // Model filter
        const isGemini = session.model.includes('gemini');
        const isDeepSeek = session.model.includes('deepseek') || session.model.includes('V3') || session.model.includes('V2');
        
        let matchesModel = true;
        if (filterModel === 'gemini') matchesModel = isGemini;
        else if (filterModel === 'deepseek') matchesModel = isDeepSeek;

        return matchesSearch && matchesModel;
      })
      .sort((a, b) => b.lastModified - a.lastModified);
  }, [sessions, searchQuery, filterModel]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-50 border-r border-slate-200 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:shadow-none md:flex
        ${!isOpen && 'md:hidden'} 
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="font-bold text-slate-700">历史对话</h2>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (typeof window !== 'undefined' && window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>开始新话题</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索对话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="搜索历史对话"
              className="w-full pl-9 pr-8 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="清除搜索"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {/* Model Filter */}
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setFilterModel('all')}
              className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                filterModel === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
              aria-pressed={filterModel === 'all'}
            >
              全部
            </button>
            <button
              onClick={() => setFilterModel('gemini')}
              className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                filterModel === 'gemini'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
              aria-pressed={filterModel === 'gemini'}
            >
              Gemini
            </button>
            <button
              onClick={() => setFilterModel('deepseek')}
              className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                filterModel === 'deepseek'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
              aria-pressed={filterModel === 'deepseek'}
            >
              DeepSeek
            </button>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          {filteredSessions.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm px-4">
              {searchQuery || filterModel !== 'all' ? '没有找到匹配的对话' : '暂无历史记录'}
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768) onClose();
                }}
                className={`
                  group relative flex items-center p-3 rounded-lg cursor-pointer transition-all border border-transparent
                  ${currentSessionId === session.id 
                    ? 'bg-white border-slate-200 shadow-sm' 
                    : 'hover:bg-slate-100 hover:border-slate-100'}
                `}
              >
                <div className="flex-1 min-w-0 pr-8">
                  {editingId === session.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(session.id)}
                      onKeyDown={(e) => handleKeyDown(e, session.id)}
                      autoFocus
                      className="w-full px-1 py-0.5 bg-white border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <h3 className={`font-medium text-sm truncate ${currentSessionId === session.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {session.title || '未命名对话'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-1">
                        {new Date(session.lastModified).toLocaleDateString()} · {session.messages.length} 条消息
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          session.model.includes('gemini') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {session.model.includes('gemini') ? 'G' : 'D'}
                        </span>
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId !== session.id && (
                    <>
                      <button
                        onClick={(e) => startEditing(session, e)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-md transition-colors"
                        title="重命名"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => onDeleteSession(session.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-200 rounded-md transition-colors"
                        title="删除"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer with Version and API Key Manager */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          {onOpenAPIKeyManager && (
            <button
              onClick={onOpenAPIKeyManager}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
              title="管理 API Keys"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>API Key 管理</span>
            </button>
          )}
          <p className="text-xs text-slate-400 font-medium text-center">CogniGuide {version}</p>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;