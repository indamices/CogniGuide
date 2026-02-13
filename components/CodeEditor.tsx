import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { CodeLanguage } from '../types';

interface CodeEditorProps {
  language: CodeLanguage;
  value: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
  minimap?: boolean;
  fontSize?: number;
  theme?: 'vs-dark' | 'light';
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  value,
  onChange,
  readOnly = false,
  height = '400px',
  minimap = true,
  fontSize = 14,
  theme = 'vs-dark',
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize,
      fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
      fontLigatures: true,
      minimap: { enabled: minimap },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      readOnly,
      quickSuggestions: !readOnly,
      suggestOnTriggerCharacters: !readOnly,
    });

    // Add keyboard shortcuts
    if (!readOnly) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Prevent default save behavior
        console.log('Save shortcut triggered');
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        // Execute code shortcut
        const event = new CustomEvent('executeCode');
        window.dispatchEvent(event);
      });
    }
  };

  const getLanguageId = (): string => {
    switch (language) {
      case CodeLanguage.TypeScript:
        return 'typescript';
      case CodeLanguage.JavaScript:
        return 'javascript';
      case CodeLanguage.Python:
        return 'python';
      case CodeLanguage.HTML:
        return 'html';
      case CodeLanguage.CSS:
        return 'css';
      default:
        return 'javascript';
    }
  };

  return (
    <div className="relative border border-slate-300 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={getLanguageId()}
        value={value}
        onChange={onChange}
        theme={theme}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          fontSize,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          wordWrap: 'on',
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-slate-900 text-white">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor;
