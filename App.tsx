import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ChatArea from './components/ChatArea';
import Dashboard from './components/Dashboard';
import HistorySidebar from './components/HistorySidebar';
import { ChatMessage, MessageRole, LearningState, ConceptNode, ConceptLink, SavedSession, TeachingMode, TeachingStage, TutorResponse } from './types';
import { sendMessageToTutor } from './services/geminiService';
import { sendMessageToDeepSeek } from './services/deepseekService';
import safeStorage from './utils/storage';
import { mergeConceptsSmart, mergeLinksSmart } from './utils/mindMapHelpers';

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
  const [apiKey, setApiKey] = useState<string>('');
  const [deepSeekKey, setDeepSeekKey] = useState<string>('');
  
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
  
  const [learningState, setLearningState] = useState<LearningState>({
    concepts: [],
    links: [],
    currentStrategy: '等待主题...',
    currentStage: TeachingStage.Introduction,
    cognitiveLoad: 'Optimal',
    feedback: '',
    summary: []
  });

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

  const saveGeminiKey = (key: string) => {
    setApiKey(key);
    safeStorage.setItem('gemini_api_key', key);
  };

  const saveDeepSeekKey = (key: string) => {
    setDeepSeekKey(key);
    safeStorage.setItem('deepseek_api_key', key);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("确定要删除这个对话吗？")) return;

    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    safeStorage.setItem('cogniguide_sessions', JSON.stringify(newSessions));

    if (currentSessionId === id) {
      handleNewChat();
    }
  };

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

    try {
      const fullHistory = [...history, userMsg];

      let response: TutorResponse;

      // 修复：使用明确的模型列表检查
      const DEEPSEEK_MODELS = ['V3.2', 'V3.2Think', 'deepseek-chat', 'deepseek-reasoner'];
      if (DEEPSEEK_MODELS.includes(currentModel)) {
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
      
      // Update Learning State
      setLearningState(prev => {
        // Merge Concepts - 使用智能合并逻辑（名称相似度检测、去重）
        const mergedConcepts = response.updatedConcepts && response.updatedConcepts.length > 0
          ? mergeConceptsSmart(prev.concepts, response.updatedConcepts)
          : prev.concepts; // AI 没有返回概念，保持不变

        // Merge Links - 使用智能合并逻辑（基于合并后的概念、过滤无效链接）
        const mergedLinks = response.updatedLinks && response.updatedLinks.length > 0
          ? mergeLinksSmart(prev.links, response.updatedLinks, mergedConcepts)
          : prev.links; // AI 没有返回链接，保持不变
        
        // Merge Summary - Support multiple fragments
        const newSummary = [...prev.summary];
        if (response.summaryFragments && response.summaryFragments.length > 0) {
            newSummary.push(...response.summaryFragments);
        }

        return {
            concepts: mergedConcepts,
            links: mergedLinks,
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
        return;
      }

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
      // 只有在当前会话仍然是请求时的会话时才更新loading状态
      if (currentSessionIdRef.current === requestSessionId) {
        setIsLoading(false);
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
    return !DEEPSEEK_MODELS.includes(modelName);
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <HistorySidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
        onRenameSession={updateSessionTitle}
        onNewChat={handleNewChat}
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
                        placeholder="输入 Gemini API Key" 
                        className="text-xs border border-amber-300 rounded px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onChange={(e) => saveGeminiKey(e.target.value)}
                        value={apiKey}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && apiKey.trim().length > 0) {
                            e.currentTarget.blur();
                          }
                        }}
                    />
                  </div>
              </div>
          )}
          {!isGeminiModel(model) && !deepSeekKey && (
              <div className="absolute top-0 left-0 right-0 z-20 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shadow-sm">
                  <span className="text-xs text-amber-800 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    使用 DeepSeek 需配置 Key
                  </span>
                  <div className="flex gap-2">
                    <input 
                        type="password" 
                        placeholder="sk-..." 
                        className="text-xs border border-amber-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onChange={(e) => saveDeepSeekKey(e.target.value)}
                        value={deepSeekKey}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && deepSeekKey.trim().length > 0) {
                            e.currentTarget.blur();
                          }
                        }}
                    />
                  </div>
              </div>
          )}

          <ChatArea 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading}
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
          <Dashboard state={learningState} onExport={exportToClipboard} />
        </div>
      </div>
    </div>
  );
};

export default App;