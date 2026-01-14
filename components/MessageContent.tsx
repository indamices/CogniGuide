import React, { ReactElement } from 'react';

interface MessageContentProps {
  content: string;
  role: 'user' | 'model';
}

/**
 * MessageContent - 格式化消息内容组件
 * 类似 Gemini 风格，支持 Markdown 格式、代码块等
 */
const MessageContent: React.FC<MessageContentProps> = ({ content, role }) => {
  // 格式化内容 - 支持代码块、粗体、换行等
  const formatContent = (text: string): ReactElement[] => {
    const elements: ReactElement[] = [];
    const lines = text.split('\n');
    let currentParagraph: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join('\n').trim();
        if (paraText) {
          elements.push(
            <p key={elements.length} className="mb-4 last:mb-0 leading-relaxed whitespace-pre-wrap">
              {renderInlineFormatting(paraText)}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        const code = codeBlockContent.join('\n');
        elements.push(
          <pre
            key={elements.length}
            className={`mb-4 last:mb-0 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre ${
              role === 'user'
                ? 'bg-indigo-900/20 text-indigo-100 border border-indigo-700/30'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            <code>{code}</code>
          </pre>
        );
        codeBlockContent = [];
      }
    };

    lines.forEach((line) => {
      // 代码块检测
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushParagraph();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // 空行
      if (line.trim() === '') {
        flushParagraph();
        return;
      }

      currentParagraph.push(line);
    });

    flushParagraph();
    flushCodeBlock();

    // 如果没有解析出任何元素，返回原始文本
    if (elements.length === 0) {
      return [
        <div key={0} className="whitespace-pre-wrap leading-relaxed">
          {renderInlineFormatting(text)}
        </div>,
      ];
    }

    return elements;
  };

  // 渲染内联格式（粗体、代码等）
  const renderInlineFormatting = (text: string): (string | ReactElement)[] => {
    const parts: (string | ReactElement)[] = [];
    let lastIndex = 0;
    let key = 0;

    // 匹配粗体 **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    const boldMatches: Array<{ start: number; end: number; content: string }> = [];
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
      boldMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }

    // 匹配代码 `code`
    const codeRegex = /`([^`]+)`/g;
    const codeMatches: Array<{ start: number; end: number; content: string }> = [];
    while ((match = codeRegex.exec(text)) !== null) {
      codeMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }

    // 合并并排序
    const allMatches = [...boldMatches, ...codeMatches].sort((a, b) => a.start - b.start);

    allMatches.forEach((m) => {
      if (m.start > lastIndex) {
        parts.push(text.substring(lastIndex, m.start));
      }

      const isCode = codeMatches.some((cm) => cm.start === m.start && cm.end === m.end);
      if (isCode) {
        parts.push(
          <code
            key={key++}
            className={`px-1.5 py-0.5 rounded text-sm font-mono ${
              role === 'user'
                ? 'bg-indigo-800/40 text-indigo-100'
                : 'bg-slate-200 text-slate-800'
            }`}
          >
            {m.content}
          </code>
        );
      } else {
        parts.push(
          <strong key={key++} className="font-semibold">
            {m.content}
          </strong>
        );
      }

      lastIndex = m.end;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  const formattedElements = formatContent(content);

  return <div className="message-content">{formattedElements}</div>;
};

export default MessageContent;
