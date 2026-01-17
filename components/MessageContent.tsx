import React, { ReactElement, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import hljs from 'highlight.js';

interface MessageContentProps {
  content: string;
  role: 'user' | 'model';
}

/**
 * MessageContent - 格式化消息内容组件
 * 类似 Gemini 风格，支持完整的 Markdown 格式
 * - 代码块语法高亮（使用 highlight.js）
 * - 列表（有序、无序）
 * - 链接
 * - 标题（H1-H6）
 * - 引用
 * - 粗体、斜体、内联代码
 * - 表格支持
 */
const MessageContent: React.FC<MessageContentProps> = ({ content, role }) => {
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null);

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
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;
