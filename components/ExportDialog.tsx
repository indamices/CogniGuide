/**
 * Export Dialog Component
 * 导出功能增强 - 支持多种格式
 */

import React, { useState } from 'react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  learningState: any;
  topic: string;
}

type ExportFormat = 'md' | 'json' | 'csv' | 'txt';

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  messages,
  learningState,
  topic
}) => {
  const [format, setFormat] = useState<ExportFormat>('md');
  const [isExporting, setIsExporting] = useState(false);

  const generateContent = (exportFormat: ExportFormat): string => {
    switch (exportFormat) {
      case 'md':
        return generateMarkdown(messages, learningState);
      case 'json':
        return JSON.stringify({ messages, learningState, topic }, null, 2);
      case 'csv':
        return generateCSV(messages);
      case 'txt':
        return generatePlainText(messages, learningState);
      default:
        return '';
    }
  };

  const generateMarkdown = (msgs: any[], state: any): string => {
    let md = `# ${topic || '学习记录'}\n\n`;
    
    // 添加学习总结
    if (state?.summary && state.summary.length > 0) {
      md += '## 📝 学习笔记\n\n';
      state.summary.forEach((note: string, index: number) => {
        md += `${index + 1}. ${note}\n`;
      });
      md += '\n';
    }
    
    // 添加知识掌握度
    if (state?.concepts) {
      md += '## 🎯 知识掌握度\n\n';
      state.concepts.forEach((concept: any) => {
        md += `- **${concept.name}** (${concept.mastery})\n`;
      });
      md += '\n';
    }
    
    // 添加对话内容
    md += '## 💬 对话记录\n\n';
    msgs.forEach((msg: any, index: number) => {
      const role = msg.role === 'user' ? '我' : 'AI';
      const timestamp = new Date(msg.timestamp).toLocaleString('zh-CN');
      md += `### ${role} (${timestamp})\n\n${msg.content}\n\n`;
    });
    
    return md;
  };

  const generateCSV = (msgs: any[]): string => {
    const headers = ['时间', '角色', '内容'];
    const rows = msgs.map((msg: any) => [
      new Date(msg.timestamp).toLocaleString('zh-CN'),
      msg.role === 'user' ? '我' : 'AI',
      `"${msg.content.replace(/"/g, '""')}"` // 转义双引号
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const generatePlainText = (msgs: any[], state: any): string => {
    let text = `${topic || '学习记录'}\n\n`;
    text += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    text += '=================================\n\n';
    
    msgs.forEach((msg: any, index: number) => {
      const role = msg.role === 'user' ? '我' : 'AI';
      text += `[${index + 1}] ${role}：\n${msg.content}\n\n`;
    });
    
    // 添加总结
    if (state?.summary) {
      text += '学习笔记：\n';
      state.summary.forEach((note: string) => {
        text += `- ${note}\n`;
      });
    }
    
    return text;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const content = generateContent(format);
      
      // 下载到本地文件
      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 
              format === 'csv' ? 'text/csv' : 
              'text/plain; charset=utf-8' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic || 'export'}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // 复制到剪贴板
      await navigator.clipboard.writeText(content);
      
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-slate-800">导出学习记录</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 格式选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择格式</label>
            <div className="grid grid-cols-2 gap-2">
              {(['md', 'json', 'csv', 'txt'] as ExportFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`p-3 border rounded-lg text-center transition-all ${
                    format === fmt
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 预览 */}
          <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre className="text-xs text-slate-600 whitespace-pre-wrap">
              {generateContent(format)}
            </pre>
          </div>

          {/* 导出按钮 */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isExporting ? '导出中...' : '导出并复制到剪贴板'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
