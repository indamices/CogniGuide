import React, { useState, useEffect } from 'react';

interface APIKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  geminiKey: string;
  deepSeekKey: string;
  glmKey: string;
  minimaxKey: string;
  minimaxGroupId: string;
  onSaveGeminiKey: (key: string) => void;
  onSaveDeepSeekKey: (key: string) => void;
  onSaveGLMKey: (key: string) => void;
  onSaveMiniMaxKey: (key: string) => void;
  onSaveMiniMaxGroupId: (groupId: string) => void;
}

interface KeyInfo {
  key: string;
  isVisible: boolean;
  isEditing: boolean;
  editValue: string;
}

const APIKeyManager: React.FC<APIKeyManagerProps> = ({
  isOpen,
  onClose,
  geminiKey,
  deepSeekKey,
  glmKey,
  minimaxKey,
  minimaxGroupId,
  onSaveGeminiKey,
  onSaveDeepSeekKey,
  onSaveGLMKey,
  onSaveMiniMaxKey,
  onSaveMiniMaxGroupId,
}) => {
  const [geminiInfo, setGeminiInfo] = useState<KeyInfo>({
    key: geminiKey,
    isVisible: false,
    isEditing: false,
    editValue: geminiKey,
  });

  const [deepSeekInfo, setDeepSeekInfo] = useState<KeyInfo>({
    key: deepSeekKey,
    isVisible: false,
    isEditing: false,
    editValue: deepSeekKey,
  });

  const [glmInfo, setGLMInfo] = useState<KeyInfo>({
    key: glmKey,
    isVisible: false,
    isEditing: false,
    editValue: glmKey,
  });

  const [minimaxInfo, setMiniMaxInfo] = useState<KeyInfo>({
    key: minimaxKey,
    isVisible: false,
    isEditing: false,
    editValue: minimaxKey,
  });

  const [minimaxGroupIdInfo, setMiniMaxGroupIdInfo] = useState<KeyInfo>({
    key: minimaxGroupId || '',
    isVisible: false,
    isEditing: false,
    editValue: minimaxGroupId || '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    provider: string;
    show: boolean;
  }>({ provider: '', show: false });

  // Update local state when props change
  useEffect(() => {
    setGeminiInfo(prev => ({ ...prev, key: geminiKey, editValue: geminiKey }));
    setDeepSeekInfo(prev => ({ ...prev, key: deepSeekKey, editValue: deepSeekKey }));
    setGLMInfo(prev => ({ ...prev, key: glmKey, editValue: glmKey }));
    setMiniMaxInfo(prev => ({ ...prev, key: minimaxKey, editValue: minimaxKey }));
    setMiniMaxGroupIdInfo(prev => ({ ...prev, key: minimaxGroupId || '', editValue: minimaxGroupId || '' }));
  }, [geminiKey, deepSeekKey, glmKey, minimaxKey, minimaxGroupId]);

  if (!isOpen) return null;

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••';
    return `${key.substring(0, 4)}${'•'.repeat(Math.min(12, key.length - 8))}${key.substring(key.length - 4)}`;
  };

  const handleSave = (provider: string, newValue: string) => {
    const trimmedValue = newValue.trim();

    if (!trimmedValue) {
      // Delete key if empty
      handleDelete(provider);
      return;
    }

    switch (provider) {
      case 'gemini':
        onSaveGeminiKey(trimmedValue);
        setGeminiInfo(prev => ({ ...prev, key: trimmedValue, isEditing: false, editValue: trimmedValue }));
        break;
      case 'deepseek':
        onSaveDeepSeekKey(trimmedValue);
        setDeepSeekInfo(prev => ({ ...prev, key: trimmedValue, isEditing: false, editValue: trimmedValue }));
        break;
      case 'glm':
        onSaveGLMKey(trimmedValue);
        setGLMInfo(prev => ({ ...prev, key: trimmedValue, isEditing: false, editValue: trimmedValue }));
        break;
      case 'minimax':
        onSaveMiniMaxKey(trimmedValue);
        setMiniMaxInfo(prev => ({ ...prev, key: trimmedValue, isEditing: false, editValue: trimmedValue }));
        break;
      case 'minimax-groupid':
        onSaveMiniMaxGroupId(trimmedValue);
        setMiniMaxGroupIdInfo(prev => ({ ...prev, key: trimmedValue, isEditing: false, editValue: trimmedValue }));
        break;
    }
  };

  const handleEdit = (provider: string) => {
    switch (provider) {
      case 'gemini':
        setGeminiInfo(prev => ({ ...prev, isEditing: true, editValue: prev.key }));
        break;
      case 'deepseek':
        setDeepSeekInfo(prev => ({ ...prev, isEditing: true, editValue: prev.key }));
        break;
      case 'glm':
        setGLMInfo(prev => ({ ...prev, isEditing: true, editValue: prev.key }));
        break;
      case 'minimax':
        setMiniMaxInfo(prev => ({ ...prev, isEditing: true, editValue: prev.key }));
        break;
      case 'minimax-groupid':
        setMiniMaxGroupIdInfo(prev => ({ ...prev, isEditing: true, editValue: prev.key }));
        break;
    }
  };

  const handleCancelEdit = (provider: string) => {
    switch (provider) {
      case 'gemini':
        setGeminiInfo(prev => ({ ...prev, isEditing: false, editValue: prev.key }));
        break;
      case 'deepseek':
        setDeepSeekInfo(prev => ({ ...prev, isEditing: false, editValue: prev.key }));
        break;
      case 'glm':
        setGLMInfo(prev => ({ ...prev, isEditing: false, editValue: prev.key }));
        break;
      case 'minimax':
        setMiniMaxInfo(prev => ({ ...prev, isEditing: false, editValue: prev.key }));
        break;
      case 'minimax-groupid':
        setMiniMaxGroupIdInfo(prev => ({ ...prev, isEditing: false, editValue: prev.key }));
        break;
    }
  };

  const handleDelete = (provider: string) => {
    switch (provider) {
      case 'gemini':
        onSaveGeminiKey('');
        setGeminiInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
        break;
      case 'deepseek':
        onSaveDeepSeekKey('');
        setDeepSeekInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
        break;
      case 'glm':
        onSaveGLMKey('');
        setGLMInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
        break;
      case 'minimax':
        onSaveMiniMaxKey('');
        setMiniMaxInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
        break;
      case 'minimax-groupid':
        onSaveMiniMaxGroupId('');
        setMiniMaxGroupIdInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
        break;
    }
    setShowDeleteConfirm({ provider: '', show: false });
  };

  const handleClearAll = () => {
    onSaveGeminiKey('');
    onSaveDeepSeekKey('');
    onSaveGLMKey('');
    onSaveMiniMaxKey('');
    onSaveMiniMaxGroupId('');
    setGeminiInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
    setDeepSeekInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
    setGLMInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
    setMiniMaxInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
    setMiniMaxGroupIdInfo({ key: '', isVisible: false, isEditing: false, editValue: '' });
    setShowDeleteConfirm({ provider: '', show: false });
  };

  const renderKeySection = (
    provider: string,
    displayName: string,
    description: string,
    keyInfo: KeyInfo,
    setKeyInfo: React.Dispatch<React.SetStateAction<KeyInfo>>
  ) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-800">{displayName}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex gap-2">
          {keyInfo.key && (
            <>
              {!keyInfo.isEditing ? (
                <>
                  <button
                    onClick={() => handleEdit(provider)}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm({ provider, show: true })}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    删除
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSave(provider, keyInfo.editValue)}
                    className="px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                    disabled={!keyInfo.editValue.trim()}
                  >
                    保存
                  </button>
                  <button
                    onClick={() => handleCancelEdit(provider)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                  >
                    取消
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {keyInfo.isEditing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={keyInfo.editValue}
              onChange={(e) => setKeyInfo(prev => ({ ...prev, editValue: e.target.value }))}
              placeholder={`输入 ${displayName} API Key`}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && keyInfo.editValue.trim()) {
                  handleSave(provider, keyInfo.editValue);
                } else if (e.key === 'Escape') {
                  handleCancelEdit(provider);
                }
              }}
            />
            <button
              onClick={() => handleSave(provider, keyInfo.editValue)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!keyInfo.editValue.trim()}
            >
              保存
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
              {keyInfo.key ? (
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono text-slate-700">
                    {keyInfo.isVisible ? keyInfo.key : maskKey(keyInfo.key)}
                  </code>
                  <button
                    onClick={() => setKeyInfo(prev => ({ ...prev, isVisible: !prev.isVisible }))}
                    className="ml-2 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {keyInfo.isVisible ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">未设置</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm.show && showDeleteConfirm.provider === provider && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-800 font-medium mb-2">
            确定要删除 {displayName} API Key 吗？
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(provider)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              确认删除
            </button>
            <button
              onClick={() => setShowDeleteConfirm({ provider: '', show: false })}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">API Key 管理</h2>
              <p className="text-sm text-slate-500 mt-1">
                管理您的 AI 模型 API Keys。您可以随时编辑、查看或删除。
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Gemini Section */}
          {renderKeySection(
            'gemini',
            'Google Gemini',
            '用于 Gemini 2.0 Flash / 2.5 Flash / 1.5 Pro 等模型',
            geminiInfo,
            setGeminiInfo
          )}

          {/* DeepSeek Section */}
          {renderKeySection(
            'deepseek',
            'DeepSeek',
            '用于 DeepSeek V3.2 / V3.2Think 等模型',
            deepSeekInfo,
            setDeepSeekInfo
          )}

          {/* GLM Section */}
          {renderKeySection(
            'glm',
            '智谱 GLM',
            '用于 GLM-4.7 Flash / Plus / Air / Bolt 等模型',
            glmInfo,
            setGLMInfo
          )}

          {/* MiniMax Section */}
          {renderKeySection(
            'minimax',
            'MiniMax',
            '用于 abab6.5s (超长文) / abab6.5g (通用) / abab5.5s (经济) 等模型',
            minimaxInfo,
            setMiniMaxInfo
          )}

          {/* MiniMax Group ID Section */}
          {renderKeySection(
            'minimax-groupid',
            'MiniMax Group ID',
            'MiniMax API 的群组 ID (可在官网账号信息中获取)',
            minimaxGroupIdInfo,
            setMiniMaxGroupIdInfo
          )}

          {/* Clear All Section */}
          {(geminiKey || deepSeekKey || glmKey || minimaxKey) && (
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowDeleteConfirm({ provider: 'all', show: true })}
                className="w-full px-4 py-2.5 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 rounded-lg transition-colors"
              >
                清除所有 API Keys
              </button>

              {/* Clear All Confirmation */}
              {showDeleteConfirm.show && showDeleteConfirm.provider === 'all' && (
                <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium mb-1">
                    确定要清除所有 API Keys 吗？
                  </p>
                  <p className="text-xs text-red-600 mb-3">
                    此操作将删除所有已保存的 API Keys，清除后需要重新输入才能使用相应的模型。
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                      确认清除所有
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({ provider: '', show: false })}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Section */}
          <div className="pt-4 border-t border-slate-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">如何获取 API Keys？</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Gemini:</strong> 访问 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google AI Studio</a> 创建免费 API Key</li>
                <li>• <strong>DeepSeek:</strong> 访问 <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">DeepSeek Platform</a> 注册并获取 API Key</li>
                <li>• <strong>GLM:</strong> 访问 <a href="https://open.bigmodel.cn/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">智谱AI开放平台</a> 获取 API Key</li>
                <li>• <strong>MiniMax:</strong> 访问 <a href="https://www.minimaxi.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">MiniMax 开放平台</a> 获取 API Key</li>
                <li className="text-slate-500 mt-1">支持 abab6.5s (245K超长文)、abab6.5g (通用)、abab5.5s (经济) 等模型</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

export default APIKeyManager;
