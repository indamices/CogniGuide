import React, { ReactElement, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js';
import 'katex/dist/katex.min.css';
import CodeSandbox from './CodeSandbox';
import VoiceReader from './VoiceReader';
import { CodeLanguage } from '../types';

interface MessageContentProps {
  content: string;
  role: 'user' | 'model';
  messageId?: string;
  // 语音朗读相关 props
  isSpeaking?: boolean;
  isPaused?: boolean;
  onSpeak?: (text: string, messageId: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

/**
 * MessageContent - 格式化消息内容组件
 * 类似 Gemini 风格，支持完整的 Markdown 格式
 * - 代码块语法高亮（使用 highlight.js）
 * - LaTeX数学公式渲染（行内公式 $...$ 和块级公式 $$...$$）
 * - 列表（有序、无序）
 * - 链接
 * - 标题（H1-H6）
 * - 引用
 * - 粗体、斜体、内联代码
 * - 表格支持
 * - 语音朗读（仅AI回复）
 */
const MessageContent: React.FC<MessageContentProps> = ({
  content,
  role,
  messageId,
  isSpeaking = false,
  isPaused = false,
  onSpeak,
  onPause,
  onResume,
  onCancel
}) => {
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null);
  const [sandboxState, setSandboxState] = useState<{
    isOpen: boolean;
    code: string;
    language: CodeLanguage;
  } | null>(null);

  // 复制代码块内容
  const copyToClipboard = async (code: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeBlock(blockId);
      setTimeout(() => setCopiedCodeBlock(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 打开代码沙盒
  const openSandbox = (code: string, language: string) => {
    // Map common language names to CodeLanguage enum
    let mappedLanguage: CodeLanguage = CodeLanguage.JavaScript;
    const normalizedLang = language.toLowerCase();

    if (normalizedLang.includes('python')) {
      mappedLanguage = CodeLanguage.Python;
    } else if (normalizedLang.includes('typescript') || normalizedLang.includes('ts')) {
      mappedLanguage = CodeLanguage.TypeScript;
    } else if (normalizedLang.includes('javascript') || normalizedLang.includes('js')) {
      mappedLanguage = CodeLanguage.JavaScript;
    } else if (normalizedLang.includes('html')) {
      mappedLanguage = CodeLanguage.HTML;
    } else if (normalizedLang.includes('css')) {
      mappedLanguage = CodeLanguage.CSS;
    }

    setSandboxState({
      isOpen: true,
      code,
      language: mappedLanguage,
    });
  };

  // 检测是否为可执行代码语言
  const isExecutableLanguage = (language: string): boolean => {
    const executableLangs = ['javascript', 'typescript', 'python', 'html', 'css', 'js', 'ts', 'py'];
    return executableLangs.some(lang => language.toLowerCase().includes(lang));
  };

  // 自定义代码块渲染，添加复制按钮
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    const blockId = `code-${Math.random().toString(36).substr(2, 9)}`;

    if (inline) {
      return (
        <code
          className={`px-1.5 py-0.5 rounded text-sm font-mono ${
            role === 'user'
              ? 'bg-indigo-800/40 text-indigo-100'
              : 'bg-slate-200 text-slate-800'
          }`}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="relative group mb-4">
        <div className="flex items-center justify-between mb-1 px-2">
          {language && (
            <span className="text-xs text-slate-500 font-mono">{language}</span>
          )}
          <div className="flex items-center space-x-2">
            {/* Run in Sandbox button - only for executable languages and model messages */}
            {role === 'model' && language && isExecutableLanguage(language) && (
              <button
                onClick={() => openSandbox(codeString, language)}
                className="text-xs px-2 py-1 rounded transition-colors bg-green-100 text-green-700 hover:bg-green-200 font-medium"
                title="在沙盒中运行代码"
              >
                ▶ 运行
              </button>
            )}
            <button
              onClick={() => copyToClipboard(codeString, blockId)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                role === 'user'
                  ? 'text-indigo-300 hover:bg-indigo-800/40'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="复制代码"
            >
              {copiedCodeBlock === blockId ? '✓ 已复制' : '复制'}
            </button>
          </div>
        </div>
        <pre
          className={`mb-0 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre ${
            role === 'user'
              ? 'bg-indigo-900/20 text-indigo-100 border border-indigo-700/30'
              : 'bg-slate-100 text-slate-800 border border-slate-200'
          }`}
          {...props}
        >
          <code className={className}>{children}</code>
        </pre>
      </div>
    );
  };

  // 自定义组件映射
  const components = {
    // 代码块
    code: CodeBlock,
    // 段落
    p: ({ children }: any) => (
      <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
    ),
    // 标题
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold mb-4 mt-6 first:mt-0 border-b pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-bold mb-3 mt-5 first:mt-0 border-b pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold mb-3 mt-4 first:mt-0">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h4>
    ),
    h5: ({ children }: any) => (
      <h5 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h5>
    ),
    h6: ({ children }: any) => (
      <h6 className="text-sm font-semibold mb-2 mt-2 first:mt-0">{children}</h6>
    ),
    // 列表
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-1 ml-4">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 ml-4">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed">{children}</li>
    ),
    // 链接
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline hover:no-underline ${
          role === 'user' ? 'text-indigo-300 hover:text-indigo-200' : 'text-blue-600 hover:text-blue-800'
        }`}
      >
        {children}
      </a>
    ),
    // 引用
    blockquote: ({ children }: any) => (
      <blockquote
        className={`border-l-4 pl-4 my-4 italic ${
          role === 'user'
            ? 'border-indigo-500 bg-indigo-900/10 text-indigo-200'
            : 'border-slate-400 bg-slate-50 text-slate-700'
        }`}
      >
        {children}
      </blockquote>
    ),
    // 表格
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-slate-300">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead
        className={
          role === 'user'
            ? 'bg-indigo-900/30'
            : 'bg-slate-200'
        }
      >
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => (
      <tr
        className={`border-b ${
          role === 'user'
            ? 'border-indigo-700/30'
            : 'border-slate-300'
        }`}
      >
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th
        className={`px-4 py-2 text-left font-semibold border border-slate-300 ${
          role === 'user' ? 'text-indigo-100' : 'text-slate-800'
        }`}
      >
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td
        className={`px-4 py-2 border border-slate-300 ${
          role === 'user' ? 'text-indigo-100' : 'text-slate-800'
        }`}
      >
        {children}
      </td>
    ),
    // 水平线
    hr: () => (
      <hr
        className={`my-6 ${
          role === 'user' ? 'border-indigo-700/30' : 'border-slate-300'
        }`}
      />
    ),
    // 图片
    img: ({ src, alt, title }: any) => {
      const [imageError, setImageError] = React.useState(false);
      
      if (imageError) {
        return (
          <div className="my-4">
            <div className={`p-4 rounded-lg text-sm text-center ${
              role === 'user' 
                ? 'bg-indigo-900/20 text-indigo-300 border border-indigo-700/30' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              图片加载失败: {alt || src}
            </div>
            {alt && (
              <p className={`text-xs mt-2 text-center ${
                role === 'user' ? 'text-indigo-300' : 'text-slate-500'
              }`}>
                {alt}
              </p>
            )}
          </div>
        );
      }
      
      return (
        <div className="my-4">
          <img
            src={src}
            alt={alt || ''}
            title={title || alt || ''}
            className={`max-w-full h-auto rounded-lg shadow-md ${
              role === 'user' ? 'border border-indigo-700/30' : 'border border-slate-200'
            }`}
            loading="lazy"
            onError={() => setImageError(true)}
          />
          {alt && (
            <p className={`text-xs mt-2 text-center ${
              role === 'user' ? 'text-indigo-300' : 'text-slate-500'
            }`}>
              {alt}
            </p>
          )}
        </div>
      );
    },
    // 强调
    strong: ({ children }: any) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic">{children}</em>
    ),
  };

  return (
    <div className={`message-content ${role === 'user' ? 'text-white' : 'text-slate-800'}`}>
      {/* Voice Reader Button - Only for AI messages */}
      {role === 'model' && messageId && onSpeak && onPause && onResume && onCancel && (
        <div className="mb-2">
          <VoiceReader
            messageId={messageId}
            content={content}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            onSpeak={onSpeak}
            onPause={onPause}
            onResume={onResume}
            onCancel={onCancel}
            compact={true}
          />
        </div>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>

      {/* Code Sandbox Modal */}
      {sandboxState && sandboxState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">代码沙盒</h3>
                  <p className="text-xs text-slate-500">
                    安全的代码执行环境 ({sandboxState.language})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSandboxState(null)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body with Sandbox */}
            <div className="flex-1 overflow-auto p-6">
              <CodeSandbox
                initialCode={sandboxState.code}
                initialLanguage={sandboxState.language}
                height="500px"
                readOnly={false}
                showLanguageSelector={true}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>安全隔离</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>10s 超时保护</span>
                  </span>
                </div>
                <button
                  onClick={() => setSandboxState(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContent;
