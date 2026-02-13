import React, { useState, useMemo, useCallback, memo } from 'react';
import { SavedSession } from '../types';
import { debounce } from '../utils/performance';

interface OptimizedHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onNewChat: () => void;
  version?: string;
}

// 会话项组件 - 使用memo优化
const SessionItem = memo(({
  session,
  isCurrent,
  isEditing,
  editTitle,
  onSelect,
  onStartEdit,
  onDelete,
  onRenameSubmit,
  onEditChange,
  onKeyDown
}: {
  session: SavedSession;
  isCurrent: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onRenameSubmit: () => void;
  onEditChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        group relative flex items-center p-3 rounded-lg cursor-pointer transition-all border border-transparent
        ${isCurrent
          ? 'bg-white border-slate-200 shadow-sm'
          : 'hover:bg-slate-100 hover:border-slate-100'}
      `}
    >
      <div className="flex-1 min-w-0 pr-8">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onRenameSubmit}
            onKeyDown={onKeyDown}
            autoFocus
            className="w-full px-1 py-0.5 bg-white border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <h3 className={`font-medium text-sm truncate ${isCurrent ? 'text-indigo-700' : 'text-slate-700'}`}>
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
        {!isEditing && (
          <>
            <button
              onClick={onStartEdit}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-md transition-colors"
              title="重命名"
              aria-label="重命名会话"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-200 rounded-md transition-colors"
              title="删除"
              aria-label="删除会话"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
});

SessionItem.displayName = 'SessionItem';

/**
 * OptimizedHistorySidebar - 优化版历史侧边栏
 * 使用React.memo、useMemo、useCallback、防抖等优化性能
 */
const OptimizedHistorySidebar: React.FC<OptimizedHistorySidebarProps> = memo(({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onNewChat,
  version = 'v1.0.0'
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModel, setFilterModel] = useState<string>('all');

  // 防抖搜索
  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
    }, 200),
    []
  );

  // 过滤和排序会话 - 使用useMemo缓存
  const filteredSessions = useMemo(() => {
    return sessions
      .filter(session => {
        // 搜索过滤
        const matchesSearch = searchQuery === '' ||
          session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.topic.toLowerCase().includes(searchQuery.toLowerCase());

        // 模型过滤
        const isGemini = session.model.includes('gemini');
        const isDeepSeek = session.model.includes('deepseek') || session.model.includes('V3') || session.model.includes('V2');

        let matchesModel = true;
        if (filterModel === 'gemini') matchesModel = isGemini;
        else if (filterModel === 'deepseek') matchesModel = isDeepSeek;

        return matchesSearch && matchesModel;
      })
      .sort((a, b) => b.lastModified - a.lastModified);
  }, [sessions, searchQuery, filterModel]);

  // 处理重命名 - useCallback优化
  const handleRenameSubmit = useCallback((id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  }, [editTitle, onRenameSession]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  }, [handleRenameSubmit]);

  const startEditing = useCallback((session: SavedSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  }, []);

  // 新会话处理
  const handleNewChat = useCallback(() => {
    onNewChat();
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  }, [onNewChat, onClose]);

  // 会话选择处理
  const handleSelectSession = useCallback((sessionId: string) => {
    onSelectSession(sessionId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  }, [onSelectSession, onClose]);

  // 搜索输入处理
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchQuery(e.target.value);
  }, [debouncedSetSearchQuery]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-50 border-r border-slate-200 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:shadow-none md:flex
        ${!isOpen && 'md:hidden'}
      `} role="complementary" aria-label="历史对话">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="font-bold text-slate-700">历史对话</h2>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600" aria-label="关闭侧边栏">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-colors font-medium"
            aria-label="开始新话题"
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
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索对话..."
              onChange={handleSearchChange}
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
          <div className="flex gap-1 mt-2" role="group" aria-label="模型筛选">
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
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200" role="list">
          {filteredSessions.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm px-4">
              {searchQuery || filterModel !== 'all' ? '没有找到匹配的对话' : '暂无历史记录'}
            </div>
          ) : (
            filteredSessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isCurrent={currentSessionId === session.id}
                isEditing={editingId === session.id}
                editTitle={editTitle}
                onSelect={() => handleSelectSession(session.id)}
                onStartEdit={(e) => startEditing(session, e)}
                onDelete={(e) => onDeleteSession(session.id, e)}
                onRenameSubmit={() => handleRenameSubmit(session.id)}
                onEditChange={setEditTitle}
                onKeyDown={(e) => handleKeyDown(e, session.id)}
              />
            ))
          )}
        </div>

        {/* Footer with Version */}
        <div className="p-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-medium">CogniGuide {version}</p>
        </div>
      </div>
    </>
  );
});

OptimizedHistorySidebar.displayName = 'OptimizedHistorySidebar';

export default OptimizedHistorySidebar;
