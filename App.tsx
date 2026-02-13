import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ChatArea from './components/ChatArea';
import Dashboard from './components/Dashboard';
import HistorySidebar from './components/HistorySidebar';
import EmptyState from './components/EmptyState';
import KeyboardNav from './components/KeyboardNav';
import ConfirmDialog from './components/ConfirmDialog';
import ExportDialog from './components/ExportDialog';
import NotificationSystem, { NotificationType } from './components/NotificationSystem';
import ThemeToggle from './components/ThemeToggle';
import UndoRedoToolbar from './components/UndoRedoToolbar';
import LearningAnalytics from './components/LearningAnalytics';
import APIKeyManager from './components/APIKeyManager';
import { useTheme } from './components/ThemeProvider';
import OfflineIndicator from './components/OfflineIndicator';
import SyncStatus from './components/SyncStatus';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useServiceWorker } from './utils/useServiceWorker';
import { ChatMessage, MessageRole, LearningState, ConceptNode, ConceptLink, SavedSession, TeachingMode, TeachingStage, TutorResponse, ReviewCard } from './types';
import { sendMessageToTutor } from './services/geminiService';
import { sendMessageToDeepSeek } from './services/deepseekService';
import { sendMessageToGLM } from './services/glmService';
import { sendMessageToMiniMax } from './services/minimaxService';
import safeStorage from './utils/storage';
import { mergeConceptsSmart, mergeLinksSmart, evolveTreeStructure, enforceTreeStructure, simplifyTreeStructure } from './utils/mindMapHelpers';
import { Recommendation } from './utils/recommendationEngine';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  autoClose?: boolean;
  duration?: number;
}

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  autoClose?: boolean;
  duration?: number;
}

// 修复：确保 process.env 可用（仅在客户端/构建时）
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
  interface Process {
    env: NodeJS.ProcessEnv;
  }
}

// Define Application Version
const APP_VERSION = 'v1.0.6';

// 修复：生成唯一 ID 的辅助函数，避免快速操作时 ID 冲突
const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const App: React.FC = () => {
  // PWA Service Worker
  const sw = useServiceWorker();

  const [apiKey, setApiKey] = useState<string>('');
  const [deepSeekKey, setDeepSeekKey] = useState<string>('');
  const [glmKey, setGlmKey] = useState<string>('');
  const [minimaxKey, setMiniMaxKey] = useState<string>('');
  const [minimaxGroupId, setMiniMaxGroupId] = useState<string>('');
  
  // Session State
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null); // 用于跟踪当前会话ID，解决异步闭包问题
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  
  // Current Active State
  const [topic, setTopic] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>(TeachingMode.Auto); // New: Teaching Mode
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [estimatedResponseTime, setEstimatedResponseTime] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  const [learningState, setLearningState] = useState<LearningState>({
    concepts: [],
    links: [],
    currentStrategy: '等待主题...',
    currentStage: TeachingStage.Introduction,
    cognitiveLoad: 'Optimal',
    feedback: '',
    summary: []
  });

  // History Stack for Undo/Redo
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Notification System
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Export Dialog
  const [exportDialog, setExportDialog] = useState(false);

  // Analytics Dialog
  const [showAnalytics, setShowAnalytics] = useState(false);

  // API Key Manager Dialog
  const [showAPIKeyManager, setShowAPIKeyManager] = useState(false);

  // Spaced Repetition System
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);

  // Recommendation System handler (定义在组件顶层，避免重复声明)
  const handleStartLearningRef = useRef<((recommendation: Recommendation) => void) | null>(null);

  // Notification helper
  const addNotification = useCallback((
    type: NotificationType,
    message: string,
    autoClose = true,
    duration = 5000
  ) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message, timestamp: Date.now(), autoClose, duration };
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    // 从 localStorage 加载保存的 API keys
    const storedGeminiKey = safeStorage.getItem('gemini_api_key');
    if (storedGeminiKey) {
      setApiKey(storedGeminiKey);
    } else {
      // 如果 localStorage 中没有，尝试从环境变量加载（向后兼容）
      const envApiKey = process.env.API_KEY as string | undefined;
      if (envApiKey && envApiKey.trim().length > 0) {
        setApiKey(envApiKey);
        safeStorage.setItem('gemini_api_key', envApiKey);
      }
    }

    // 修复：安全访问 localStorage
    const storedDSKey = safeStorage.getItem('deepseek_api_key');
    if (storedDSKey) {
        setDeepSeekKey(storedDSKey);
    }
    
    const storedGLMKey = safeStorage.getItem('glm_api_key');
    if (storedGLMKey) {
        setGlmKey(storedGLMKey);
    }

    const storedMiniMaxKey = safeStorage.getItem('minimax_api_key');
    if (storedMiniMaxKey) {
        setMiniMaxKey(storedMiniMaxKey);
    }

    const storedMiniMaxGroupId = safeStorage.getItem('minimax_group_id');
    if (storedMiniMaxGroupId) {
        setMiniMaxGroupId(storedMiniMaxGroupId);
    }

    // Load review cards
    const storedCards = safeStorage.getItem('cogniguide_review_cards');
    if (storedCards) {
      try {
        const parsedCards = JSON.parse(storedCards);
        setReviewCards(parsedCards);
      } catch (e) {
        console.error("Failed to parse review cards", e);
      }
    }

    // Load sessions
    let parsedSessions: SavedSession[] = [];
    const storedSessions = safeStorage.getItem('cogniguide_sessions');
    if (storedSessions) {
      try {
        parsedSessions = JSON.parse(storedSessions);
        setSessions(parsedSessions);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }

    // Restore last active
    let lastActiveId = safeStorage.getItem('cogniguide_last_active_id');
    if (lastActiveId && parsedSessions.length > 0) {
      const session = parsedSessions.find(s => s.id === lastActiveId);
      if (session) {
        setCurrentSessionId(session.id);
        currentSessionIdRef.current = session.id; // 同步更新 ref
        setTopic(session.topic);
        setSessionTitle(session.title);
        setMessages(session.messages);
        setLearningState(session.learningState);
        setModel(session.model || 'gemini-2.5-flash');
        setTeachingMode(session.teachingMode || TeachingMode.Auto);
      }
    }
  }, []);

  // --- Auto-Save Last Active ID ---
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId; // 同步更新 ref
    if (currentSessionId) {
      safeStorage.setItem('cogniguide_last_active_id', currentSessionId);
    } else {
      safeStorage.removeItem('cogniguide_last_active_id');
    }
  }, [currentSessionId]);

  // --- Auto-Save Session ---
  // 性能优化：使用useMemo缓存序列化的会话数据，减少不必要的保存操作
  const sessionDataToSave = useMemo(() => {
    if (!currentSessionId) return null;
    
    return {
      sessionId: currentSessionId,
      title: sessionTitle,
      topic: topic,
      messages: messages,
      learningState: learningState,
      model: model,
      teachingMode: teachingMode,
    };
  }, [currentSessionId, sessionTitle, topic, messages, learningState, model, teachingMode]);

  useEffect(() => {
    if (!sessionDataToSave || !sessionDataToSave.sessionId) return;

    setSessions(prevSessions => {
      const index = prevSessions.findIndex(s => s.id === sessionDataToSave.sessionId);
      if (index === -1) return prevSessions;

      const updatedSession: SavedSession = {
        ...prevSessions[index],
        title: sessionDataToSave.title || prevSessions[index].title,
        topic: sessionDataToSave.topic,
        messages: sessionDataToSave.messages,
        learningState: sessionDataToSave.learningState,
        model: sessionDataToSave.model,
        teachingMode: sessionDataToSave.teachingMode,
        lastModified: Date.now()
      };

      const newSessions = [...prevSessions];
      newSessions[index] = updatedSession;
      safeStorage.setItem('cogniguide_sessions', JSON.stringify(newSessions));
      return newSessions;
    });
  }, [sessionDataToSave]);

  // --- Auto-Save Review Cards ---
  useEffect(() => {
    safeStorage.setItem('cogniguide_review_cards', JSON.stringify(reviewCards));
  }, [reviewCards]);

  // 处理卡片更新
  const handleUpdateCards = useCallback((updatedCards: ReviewCard[]) => {
    setReviewCards(updatedCards);
  }, []);

  const saveGeminiKey = (key: string) => {
    setApiKey(key);
    safeStorage.setItem('gemini_api_key', key);
  };

  const saveDeepSeekKey = (key: string) => {
    setDeepSeekKey(key);
    safeStorage.setItem('deepseek_api_key', key);
  };

  const saveGLMKey = (key: string) => {
    setGlmKey(key);
    safeStorage.setItem('glm_api_key', key);
  };

  const saveMiniMaxKey = (key: string) => {
    setMiniMaxKey(key);
    safeStorage.setItem('minimax_api_key', key);
  };

  const saveMiniMaxGroupId = (groupId: string) => {
    setMiniMaxGroupId(groupId);
    safeStorage.setItem('minimax_group_id', groupId);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const session = sessions.find(s => s.id === id);
    if (!session) return;

    const confirmMessage = session 
      ? `确定要删除 "${session.title || session.topic}" 对话吗？\n\n包含 ${session.messages.length} 条消息\n删除后无法恢复`
      : '确定要删除这个对话吗？\n\n删除后无法恢复';
    
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    // 保存到历史栈以便撤销
    setHistoryStack(prev => [...prev, { type: 'delete_session', session, id: Date.now() }]);
    setRedoStack([]);

    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    safeStorage.setItem('cogniguide_sessions', JSON.stringify(newSessions));
    addNotification('info', `已删除对话: ${session.title || session.topic}`);

    if (currentSessionId === id) {
      if (!topic && !sessionTitle) {
        // 如果没有当前主题，直接重置
        setCurrentSessionId(null);
        currentSessionIdRef.current = null;
        setTopic('');
        setSessionTitle('');
        setMessages([]);
        setLearningState({
          concepts: [],
          links: [],
          currentStrategy: '等待主题...',
          currentStage: TeachingStage.Introduction,
          cognitiveLoad: 'Optimal',
          feedback: '',
          summary: []
        });
        setTeachingMode(TeachingMode.Auto);
        safeStorage.removeItem('cogniguide_last_active_id');
      } else {
        // 如果有主题，创建新对话
        handleNewChat();
      }
    }
  };

  const undo = useCallback(() => {
    if (historyStack.length === 0) {
      addNotification('warning', '没有可撤销的操作');
      return;
    }

    const lastAction = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastAction]);

    switch (lastAction.type) {
      case 'delete_session':
        // 恢复被删除的会话
        const newSessions = [...sessions, lastAction.session];
        setSessions(newSessions);
        safeStorage.setItem('cogniguide_sessions', JSON.stringify(newSessions));
        addNotification('success', `已恢复对话: ${lastAction.session.title || lastAction.session.topic}`);
        
        // 加载恢复的会话
        setCurrentSessionId(lastAction.session.id);
        currentSessionIdRef.current = lastAction.session.id;
        setTopic(lastAction.session.topic);
        setSessionTitle(lastAction.session.title);
        setMessages(lastAction.session.messages);
        setLearningState(lastAction.session.learningState);
        setModel(lastAction.session.model || 'gemini-2.5-flash');
        setTeachingMode(lastAction.session.teachingMode || TeachingMode.Auto);
        break;
      case 'switch_session':
        // 切换回上一个会话
        if (lastAction.previousId) {
          const session = sessions.find(s => s.id === lastAction.previousId) || lastAction.session;
          setCurrentSessionId(lastAction.previousId);
          currentSessionIdRef.current = lastAction.previousId;
          setTopic(session.topic);
          setSessionTitle(session.title);
          setMessages(session.messages);
          setLearningState(session.learningState);
          setModel(session.model || 'gemini-2.5-flash');
          setTeachingMode(session.teachingMode || TeachingMode.Auto);
          addNotification('info', `已切换回上一个会话`);
        }
        break;
    }
  }, [historyStack, sessions, addNotification]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) {
      addNotification('warning', '没有可重做的操作');
      return;
    }

    const lastAction = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setHistoryStack(prev => [...prev, lastAction]);

    switch (lastAction.type) {
      case 'delete_session':
        // 重新删除
        const newSessions = sessions.filter(s => s.id !== lastAction.session.id);
        setSessions(newSessions);
        safeStorage.setItem('cogniguide_sessions', JSON.stringify(newSessions));
        addNotification('info', `已重新删除对话: ${lastAction.session.title || lastAction.session.topic}`);
        
        // 删除后处理
        if (currentSessionId === lastAction.session.id) {
          setCurrentSessionId(null);
          currentSessionIdRef.current = null;
          setTopic('');
          setSessionTitle('');
          setMessages([]);
          setLearningState({
            concepts: [],
            links: [],
            currentStrategy: '等待主题...',
            currentStage: TeachingStage.Introduction,
            cognitiveLoad: 'Optimal',
            feedback: '',
            summary: []
          });
          setTeachingMode(TeachingMode.Auto);
          safeStorage.removeItem('cogniguide_last_active_id');
        }
        break;
      case 'switch_session':
        // 重新切换
        if (lastAction.session.id) {
          setCurrentSessionId(lastAction.session.id);
          currentSessionIdRef.current = lastAction.session.id;
          setTopic(lastAction.session.topic);
          setSessionTitle(lastAction.session.title);
          setMessages(lastAction.session.messages);
          setLearningState(lastAction.session.learningState);
          setModel(lastAction.session.model || 'gemini-2.5-flash');
          setTeachingMode(lastAction.session.teachingMode || TeachingMode.Auto);
          addNotification('info', `已重新切换会话`);
        }
        break;
    }
  }, [redoStack, sessions, currentSessionId, addNotification]);

  const updateSessionTitle = (id: string, newTitle: string) => {
    const newSessions = sessions.map(s =>
      s.id === id ? { ...s, title: newTitle, lastModified: Date.now() } : s
    );
    setSessions(newSessions);
    safeStorage.setItem('cogniguide_sessions', JSON.stringify(newSessions));
    
    if (currentSessionId === id) {
      setSessionTitle(newTitle);
    }
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;

    setCurrentSessionId(id);
    currentSessionIdRef.current = id; // 同步更新 ref
    setTopic(session.topic);
    setSessionTitle(session.title);
    setMessages(session.messages);
    setLearningState(session.learningState);
    setModel(session.model || 'gemini-2.5-flash');
    setTeachingMode(session.teachingMode || TeachingMode.Auto);

    // 修复：添加 window 对象检查
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  };

  const handleNewChat = () => {
    if (!currentSessionId && !topic) return;
    
    // 保存当前状态到历史栈
    if (currentSessionId) {
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession) {
        setHistoryStack(prev => [...prev, {
          type: 'switch_session',
          session: currentSession,
          previousId: currentSessionId
        }]);
        setRedoStack([]);
      }
    }
    
    setCurrentSessionId(null);
    currentSessionIdRef.current = null; // 同步更新 ref
    setTopic('');
    setSessionTitle('');
    setMessages([]);
    setLearningState({
      concepts: [],
      links: [],
      currentStrategy: '等待主题...',
      currentStage: TeachingStage.Introduction,
      cognitiveLoad: 'Optimal',
      feedback: '',
      summary: []
    });
    setTeachingMode(TeachingMode.Auto);
    safeStorage.removeItem('cogniguide_last_active_id');
  };

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z: 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: 重做
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const startNewTopic = async (newTopic: string) => {
    const newId = generateUniqueId();
    const initialMessage: ChatMessage = {
      id: generateUniqueId(),
      role: MessageRole.User,
      content: `我想学习关于 ${newTopic} 的内容。`,
      timestamp: Date.now()
    };

    const newSession: SavedSession = {
      id: newId,
      title: newTopic, 
      topic: newTopic,
      messages: [initialMessage],
      learningState: {
        concepts: [],
        links: [],
        currentStrategy: '初始化认知模型...',
        currentStage: TeachingStage.Introduction,
        cognitiveLoad: 'Optimal',
        feedback: '',
        summary: []
      },
      model: model,
      teachingMode: teachingMode,
      lastModified: Date.now()
    };

    setSessions(prev => {
      const updatedSessions = [newSession, ...prev];
      // 修复：使用更新后的会话列表保存到localStorage
      safeStorage.setItem('cogniguide_sessions', JSON.stringify(updatedSessions));
      return updatedSessions;
    });
    setCurrentSessionId(newId);
    currentSessionIdRef.current = newId; // 同步更新 ref
    setTopic(newTopic);
    setSessionTitle(newTopic);
    setMessages([initialMessage]);
    setLearningState(newSession.learningState);
    safeStorage.setItem('cogniguide_last_active_id', newId);

    await processMessage(initialMessage, [], model, newSession.learningState, teachingMode);
  };

  const processMessage = async (
    userMsg: ChatMessage,
    history: ChatMessage[],
    currentModel: string,
    currentLearningState: LearningState,
    currentMode: TeachingMode
  ) => {
      // 捕获当前会话ID，用于防止竞态条件（使用ref获取最新值）
      const requestSessionId = currentSessionIdRef.current;
      setIsLoading(true);
      setIsStreaming(true);
      setLoadingProgress(0);
      
      // 模拟加载进度（实际流式时会被真实数据更新覆盖）
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90));
      }, 100);

    try {
      const fullHistory = [...history, userMsg];

      let response: TutorResponse;

      // 修复：使用明确的模型列表检查
      const DEEPSEEK_MODELS = ['V3.2', 'V3.2Think', 'deepseek-chat', 'deepseek-reasoner'];
      const GLM_MODELS = ['GLM-4.7-Flash', 'GLM-4.7-Plus', 'GLM-4.7-Air', 'GLM-4.7-Bolt', 'glm-4-flash', 'glm-4-plus', 'GLM-4', 'GLM-4-flash', 'GLM-4-plus'];
      const MINIMAX_MODELS = [
        // M2 系列（旗舰模型）
        'MiniMax-M2.5', 'MiniMax-M2.5-lightning', 'MiniMax-M2.1', 'MiniMax-M2.1-ning'
      ];

      if (MINIMAX_MODELS.some(m => currentModel.toLowerCase().includes(m.toLowerCase()))) {
          // MiniMax models
          if (!minimaxKey) {
              throw new Error("请先在上方输入框中设置 MiniMax API Key");
          }
          response = await sendMessageToMiniMax(
            fullHistory,
            currentLearningState.concepts,
            currentLearningState.links,
            currentLearningState.summary,
            minimaxKey,
            currentModel,
            currentMode,
            minimaxGroupId
          );
      } else if (GLM_MODELS.some(m => currentModel.toLowerCase().includes(m.toLowerCase()))) {
          // GLM models
          if (!glmKey) {
              throw new Error("请先在上方输入框中设置 GLM API Key");
          }
          response = await sendMessageToGLM(
            fullHistory,
            currentLearningState.concepts,
            currentLearningState.links,
            currentLearningState.summary,
            glmKey,
            currentModel,
            currentMode
          );
      } else if (DEEPSEEK_MODELS.includes(currentModel)) {
          if (!deepSeekKey) {
              throw new Error("请先在上方输入框中设置 DeepSeek API Key");
          }
          response = await sendMessageToDeepSeek(
            fullHistory,
            currentLearningState.concepts,
            currentLearningState.links,
            currentLearningState.summary,
            deepSeekKey,
            currentModel,
            currentMode
          );
      } else {
          // Gemini models
          if (!apiKey) throw new Error("请先在上方输入框中设置 Gemini API Key");
          response = await sendMessageToTutor(
            fullHistory,
            currentLearningState.concepts,
            currentLearningState.links,
            currentLearningState.summary,
            apiKey,
            currentModel,
            currentMode 
          );
      }

      // 检查响应是否属于当前活跃的会话（防止切换话题后旧响应覆盖新话题）
      // 使用ref获取最新的会话ID，避免闭包问题
      if (currentSessionIdRef.current !== requestSessionId) {
        console.log('忽略旧会话的响应，已切换到新话题');
        clearInterval(progressInterval);
        setIsLoading(false);
        setIsStreaming(false);
        setLoadingProgress(0);
        return;
      }

      const aiMsg: ChatMessage = {
        id: generateUniqueId(),
        role: MessageRole.Model,
        content: response.conversationalReply || "（知识库已更新，请查看右侧笔记）", // Robust Fallback
        timestamp: Date.now()
      };

      // 再次检查会话ID（在状态更新前）
      if (currentSessionIdRef.current !== requestSessionId) {
        console.log('忽略旧会话的响应，在状态更新前检测到会话切换');
        return;
      }

      setMessages(prev => [...prev, aiMsg]);
      
      // Update Learning State - 进化式重构而非增量合并
      setLearningState(prev => {
        // 进化式重构：基于所有概念和链接，重新组织结构
        // 而不是简单地增量添加
        const allExistingConcepts = prev.concepts;
        const allExistingLinks = prev.links;
        
        // AI 返回的是基于所有笔记的优化结构（可能包含重组）
        const aiConcepts = response.updatedConcepts || [];
        const aiLinks = response.updatedLinks || [];

        // 使用进化式合并：允许重组、移动、优化
        const { concepts: evolvedConcepts, links: evolvedLinks } = evolveTreeStructure(
          allExistingConcepts,
          allExistingLinks,
          aiConcepts,
          aiLinks
        );

        // 应用树结构强制规则和简化
        const { concepts: finalConcepts, links: finalLinks } = simplifyTreeStructure(
          evolvedConcepts,
          evolvedLinks,
          4 // 最大深度4层
        );
        
        // Merge Summary - 去重：不添加已存在的笔记
        const newSummary = [...prev.summary];
        if (response.summaryFragments && response.summaryFragments.length > 0) {
          response.summaryFragments.forEach(fragment => {
            if (!newSummary.includes(fragment)) {
              newSummary.push(fragment);
            }
          });
        }

        return {
            concepts: finalConcepts,
            links: finalLinks,
            currentStrategy: response.appliedStrategy,
            currentStage: response.detectedStage || prev.currentStage,
            cognitiveLoad: response.cognitiveLoadEstimate,
            feedback: response.internalThought,
            summary: newSummary
        };
      });

    } catch (error: any) {
      // 检查错误响应是否属于当前活跃的会话
      if (currentSessionIdRef.current !== requestSessionId) {
        console.log('忽略旧会话的错误响应，已切换到新话题');
        clearInterval(progressInterval);
        setIsLoading(false);
        setIsStreaming(false);
        setLoadingProgress(0);
        return;
      }

      clearInterval(progressInterval);

      console.error(error);
      
      // 改进错误处理：区分不同类型的错误
      let errorMessage = "认知引擎连接异常。";
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase();
        
        // 网络错误
        if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('timeout')) {
          errorMessage = "网络连接失败，请检查网络后重试。";
        }
        // API限流错误
        else if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
          errorMessage = "请求频率过高 (429)。请稍后重试或切换轻量模型。";
        }
        // API密钥错误
        else if (errorMsg.includes('api key') || errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          errorMessage = "API Key 无效或已过期。请检查并更新您的 API Key。";
        }
        // JSON解析错误
        else if (errorMsg.includes('json') || errorMsg.includes('parse') || errorMsg.includes('syntax')) {
          errorMessage = "响应解析失败。请重试或联系技术支持。";
        }
        // 服务器错误
        else if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503') || errorMsg.includes('504')) {
          errorMessage = "服务器暂时不可用，请稍后重试。";
        }
        // 其他API错误
        else if (errorMsg.includes('400') || errorMsg.includes('403') || errorMsg.includes('404')) {
          errorMessage = `API 错误: ${error.message}`;
        }
        // 使用原始错误消息
        else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      const errorMsg: ChatMessage = {
        id: generateUniqueId(),
        role: MessageRole.Model,
        content: errorMessage,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      clearInterval(progressInterval);
      // 只有在当前会话仍然是请求时的会话时才更新loading状态
      if (currentSessionIdRef.current === requestSessionId) {
        setIsLoading(false);
        setIsStreaming(false);
        setLoadingProgress(0);
      }
    }
  };

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: generateUniqueId(),
      role: MessageRole.User,
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    processMessage(userMsg, messages, model, learningState, teachingMode);
  };

  // 创建 handleStartLearning 并保存到 ref
  const handleStartLearning = useCallback((recommendation: Recommendation) => {
    if (recommendation.suggestedQuestions && recommendation.suggestedQuestions.length > 0) {
      const question = recommendation.suggestedQuestions[0];
      handleSendMessage(question);
    } else if (recommendation.type === 'rest_break') {
      addNotification('info', '好的，记得适当休息放松！');
    } else {
      handleSendMessage(`我想学习：${recommendation.description}`);
    }
  }, [addNotification]);

  handleStartLearningRef.current = handleStartLearning;

  const exportToClipboard = useCallback(async () => {
    // 0. Defensive Check
    if (!messages || messages.length === 0) {
        alert("暂无对话记录可导出。");
        return;
    }

    // 1. Chat Transcript
    const chatSection = messages.map(m => {
        const role = m.role === MessageRole.User ? '👤 用户' : '🤖 CogniGuide';
        return `### ${role}:\n${m.content}`;
    }).join('\n\n');

    // 2. Learning Notes (Defensive)
    const notes = learningState.summary || [];
    const notesSection = notes.length > 0 
        ? notes.map(n => `- ${n}`).join('\n') 
        : "(暂无笔记)";

    // 3. Knowledge Graph (Defensive)
    const concepts = learningState.concepts || [];
    const links = learningState.links || [];
    
    const mapSection = concepts.length > 0
        ? concepts.map(c => {
            const children = links
                .filter(l => l.source === c.id)
                .map(l => {
                    const targetNode = concepts.find(n => n.id === l.target);
                    const targetName = targetNode ? targetNode.name : l.target;
                    return `  - [${l.relationship}] -> ${targetName}`;
                }).join('\n');
            const masteryIcon = c.mastery === 'Expert' ? '🟢' : c.mastery === 'Competent' ? '🔵' : '🟠';
            return `- ${masteryIcon} **${c.name}**\n  > ${c.description || '无定义'}\n${children}`;
          }).join('\n')
        : "(暂无结构)";

    const timestamp = new Date().toLocaleString();
    const currentTopic = sessionTitle || topic || '未命名会话';

    const fullContent = `# CogniGuide 学习导出
**主题**: ${currentTopic}
**时间**: ${timestamp}
**模式**: ${teachingMode}

---

## 1. 对话实录 (Transcript)
${chatSection}

---

## 2. 学习笔记 (Notes)
${notesSection}

---

## 3. 知识图谱 (Knowledge Graph)
${mapSection}
`;

    // Robust Copy Implementation
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(fullContent);
            alert("✅ 已复制到剪贴板！\n(Markdown 格式，可直接粘贴至 Notion/Obsidian)");
        } else {
            throw new Error("Clipboard API unavailable");
        }
    } catch (err) {
        console.warn("Standard copy failed, using fallback", err);
        try {
            const textArea = document.createElement("textarea");
            textArea.value = fullContent;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            textArea.setAttribute("readonly", "");
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                alert("✅ 已复制 (兼容模式)！");
            } else {
                throw new Error("Fallback failed");
            }
        } catch (finalErr) {
            console.error("All copy methods failed", finalErr);
            alert("❌ 复制失败，请检查浏览器权限。");
        }
    }
  }, [messages, learningState, sessionTitle, topic, teachingMode]);

  // Helper function to check if model is Gemini
  const isGeminiModel = (modelName: string): boolean => {
    const DEEPSEEK_MODELS = ['V3.2', 'V3.2Think', 'deepseek-chat', 'deepseek-reasoner'];
    const GLM_MODELS = ['GLM-4.7-Flash', 'GLM-4.7-Plus', 'GLM-4.7-Air', 'GLM-4.7-Bolt', 'glm-4-flash', 'glm-4-plus', 'GLM-4', 'GLM-4-flash', 'GLM-4-plus'];
    const MINIMAX_MODELS = ['MiniMax-abab6.5s', 'MiniMax-abab6.5g', 'MiniMax-abab6-chat', 'MiniMax-abab5.5s', 'abab6.5s-chat', 'abab6.5g-chat', 'abab6-chat', 'abab5.5s-chat', 'abab5.5-chat'];
    return !DEEPSEEK_MODELS.includes(modelName) && !GLM_MODELS.some(m => modelName.toLowerCase().includes(m.toLowerCase())) && !MINIMAX_MODELS.some(m => modelName.toLowerCase().includes(m.toLowerCase()));
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => {} })}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDialog}
        onClose={() => setExportDialog(false)}
        messages={messages}
        learningState={learningState}
        topic={topic || sessionTitle}
      />

      {/* Learning Analytics Dialog */}
      {showAnalytics && (
        <LearningAnalytics
          sessions={sessions}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* API Key Manager Dialog */}
      <APIKeyManager
        isOpen={showAPIKeyManager}
        onClose={() => setShowAPIKeyManager(false)}
        geminiKey={apiKey}
        deepSeekKey={deepSeekKey}
        glmKey={glmKey}
        minimaxKey={minimaxKey}
        minimaxGroupId={minimaxGroupId}
        onSaveGeminiKey={saveGeminiKey}
        onSaveDeepSeekKey={saveDeepSeekKey}
        onSaveGLMKey={saveGLMKey}
        onSaveMiniMaxKey={saveMiniMaxKey}
        onSaveMiniMaxGroupId={saveMiniMaxGroupId}
      />

      {/* Keyboard Navigation */}
      <KeyboardNav
        onNextSession={() => {
          const currentIndex = sessions.findIndex(s => s.id === currentSessionId);
          if (currentIndex > 0) {
            loadSession(sessions[currentIndex - 1].id);
          }
        }}
        onPrevSession={() => {
          const currentIndex = sessions.findIndex(s => s.id === currentSessionId);
          if (currentIndex < sessions.length - 1) {
            loadSession(sessions[currentIndex + 1].id);
          }
        }}
        onNewChat={handleNewChat}
      />

      <HistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
        onRenameSession={updateSessionTitle}
        onNewChat={handleNewChat}
        onOpenAPIKeyManager={() => setShowAPIKeyManager(true)}
        version={APP_VERSION}
      />

      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        <div className="flex-1 h-full p-0 md:p-4 lg:p-6 flex flex-col max-w-4xl mx-auto w-full min-w-0 relative">
          
          {/* API Key Warning/Input Overlay if selected but missing */}
          {isGeminiModel(model) && !apiKey && (
              <div className="absolute top-0 left-0 right-0 z-20 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shadow-sm">
                  <span className="text-xs text-amber-800 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    使用 Gemini 需配置 API Key
                  </span>
                  <div className="flex gap-2">
                    <input
                        type="password"
                        placeholder="快速输入 API Key"
                        className="text-xs border border-amber-300 rounded px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onChange={(e) => saveGeminiKey(e.target.value)}
                        value={apiKey}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && apiKey.trim().length > 0) {
                            e.currentTarget.blur();
                          }
                        }}
                    />
                    <button
                      onClick={() => setShowAPIKeyManager(true)}
                      className="px-2 py-1 text-xs font-medium text-amber-700 border border-amber-400 rounded hover:bg-amber-100 transition-colors"
                    >
                      管理
                    </button>
                  </div>
              </div>
          )}
          {(() => {
            const GLM_MODELS = ['GLM-4.7-Flash', 'GLM-4.7-Plus', 'GLM-4.7-Air', 'GLM-4.7-Bolt', 'glm-4'];
            const isGLMModel = GLM_MODELS.some(m => model.toLowerCase().includes(m.toLowerCase()));
            const DEEPSEEK_MODELS = ['V3.2', 'V3.2Think', 'deepseek-chat', 'deepseek-reasoner'];
            const isDeepSeekModel = DEEPSEEK_MODELS.includes(model);
            const MINIMAX_MODELS = ['MiniMax-M2.5', 'MiniMax-M2.5-lightning', 'MiniMax-M2.1', 'MiniMax-M2.1-ning', 'M2.5', 'M2.5-lightning', 'M2.1', 'M2.1-ning'];
            const isMiniMaxModel = MINIMAX_MODELS.some(m => model.toLowerCase().includes(m.toLowerCase()));
            
            if (isGLMModel && !glmKey) {
              return (
                <div className="absolute top-0 left-0 right-0 z-20 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shadow-sm">
                  <span className="text-xs text-amber-800 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    使用 GLM-4.7 需配置 API Key
                  </span>
                  <div className="flex gap-2">
                    <input
                        type="password"
                        placeholder="快速输入 API Key"
                        className="text-xs border border-amber-300 rounded px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onChange={(e) => saveGLMKey(e.target.value)}
                        value={glmKey}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && glmKey.trim().length > 0) {
                            e.currentTarget.blur();
                          }
                        }}
                    />
                    <button
                      onClick={() => setShowAPIKeyManager(true)}
                      className="px-2 py-1 text-xs font-medium text-amber-700 border border-amber-400 rounded hover:bg-amber-100 transition-colors"
                    >
                      管理
                    </button>
                  </div>
                </div>
              );
            } else if (isDeepSeekModel && !deepSeekKey) {
              return (
                <div className="absolute top-0 left-0 right-0 z-20 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shadow-sm">
                  <span className="text-xs text-amber-800 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    使用 DeepSeek 需配置 Key
                  </span>
                  <div className="flex gap-2">
                    <input
                        type="password"
                        placeholder="快速输入 Key"
                        className="text-xs border border-amber-300 rounded px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onChange={(e) => saveDeepSeekKey(e.target.value)}
                        value={deepSeekKey}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && deepSeekKey.trim().length > 0) {
                            e.currentTarget.blur();
                          }
                        }}
                    />
                    <button
                      onClick={() => setShowAPIKeyManager(true)}
                      className="px-2 py-1 text-xs font-medium text-amber-700 border border-amber-400 rounded hover:bg-amber-100 transition-colors"
                    >
                      管理
                    </button>
                  </div>
                </div>
              );
            } else if (isMiniMaxModel && !minimaxKey) {
              return (
                <div className="absolute top-0 left-0 right-0 z-20 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shadow-sm">
                  <span className="text-xs text-amber-800 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    使用 MiniMax 需配置 API Key
                  </span>
                  <div className="flex gap-2">
                    <input
                        type="password"
                        placeholder="快速输入 API Key"
                        className="text-xs border border-amber-300 rounded px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onChange={(e) => saveMiniMaxKey(e.target.value)}
                        value={minimaxKey}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && minimaxKey.trim().length > 0) {
                            e.currentTarget.blur();
                          }
                        }}
                    />
                    <button
                      onClick={() => setShowAPIKeyManager(true)}
                      className="px-2 py-1 text-xs font-medium text-amber-700 border border-amber-400 rounded hover:bg-amber-100 transition-colors"
                    >
                      管理
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <ChatArea 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading}
              isStreaming={isStreaming}
              loadingProgress={loadingProgress}
              topic={topic}
              onRequestChangeTopic={(t) => {
                  if (t === '') handleNewChat();
                  else startNewTopic(t);
              }}
              selectedModel={model}
              onModelChange={setModel}
              teachingMode={teachingMode}
              onTeachingModeChange={setTeachingMode}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              sessionTitle={sessionTitle}
              onUpdateSessionTitle={(t) => {
                  setSessionTitle(t);
                  if (currentSessionId) updateSessionTitle(currentSessionId, t);
              }}
          />
        </div>

        <div className="hidden lg:block w-80 xl:w-96 p-6 pl-0 h-full flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">学习仪表板</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAPIKeyManager(true)}
                className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600 hover:text-indigo-700"
                title="API Key 管理"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600 hover:text-indigo-700"
                title="学习分析"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              <UndoRedoToolbar
                canUndo={historyStack.length > 0}
                canRedo={redoStack.length > 0}
                onUndo={undo}
                onRedo={redo}
              />
              <ThemeToggle />
            </div>
          </div>
          <Dashboard
            state={learningState}
            onExport={() => setExportDialog(true)}
            cards={reviewCards}
            onUpdateCards={handleUpdateCards}
            sessionId={currentSessionId || undefined}
            sessions={sessions}
            onStartLearning={handleStartLearning}
          />
        </div>
      </div>

      {/* PWA Components */}
      <OfflineIndicator />
      <PWAInstallPrompt />
    </div>
  );
};

export default App;