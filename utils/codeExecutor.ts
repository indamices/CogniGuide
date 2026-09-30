import { CodeLanguage, CodeExecutionResult } from '../types';

// Python execution using Pyodide (lazy loaded)
let pyodide: any = null;
let pyodideLoading: Promise<any> | null = null;

/**
 * Initialize Pyodide (lazy load)
 */
async function initPyodide(): Promise<any> {
  if (pyodide) return pyodide;
  if (pyodideLoading) return pyodideLoading;

  pyodideLoading = (async () => {
    try {
      const { loadPyodide, version } = await import('pyodide');
      // indexURL 必须与 npm 包的版本一致，否则 Pyodide 会因版本不匹配拒绝加载
      pyodide = await loadPyodide({
        indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`,
      });

      // Redirect stdout
      pyodide.runPython(`
        import sys
        from io import StringIO
        sys.stdout = StringIO()
        sys.stderr = StringIO()
      `);

      return pyodide;
    } catch (error) {
      console.error('Failed to load Pyodide:', error);
      pyodideLoading = null;
      throw error;
    }
  })();

  return pyodideLoading;
}

/**
 * Execute JavaScript/TypeScript code in isolated context
 *
 * 代码在 sandbox="allow-scripts"（不含 allow-same-origin）的 iframe 中运行，
 * iframe 与主页面不同源，父页面无法直接读取其 window 属性，
 * 因此执行结果通过 postMessage 传回。
 */
export async function executeJavaScript(code: string, timeout: number = 10000): Promise<CodeExecutionResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    // Create isolated iframe for execution
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox = 'allow-scripts';

    // CSP to restrict dangerous operations
    const csp = "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline';";
    const metaCSP = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;

    // 用随机 token 标识本次执行，只接受来自本 iframe 且 token 匹配的消息
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // 防止用户代码中的 "</script>" 提前结束脚本标签
    const safeCode = code.replace(/<\/script/gi, '<\\/script');

    const script = `
      <html>
        <head>${metaCSP}</head>
        <body>
          <script>
            (function() {
              var logs = [];
              var posted = false;
              var originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info
              };

              ['log', 'warn', 'error', 'info'].forEach(function(logLevel) {
                console[logLevel] = function() {
                  var args = Array.prototype.slice.call(arguments);
                  logs.push({ level: logLevel, args: args.map(function(a) { return String(a); }) });
                  originalConsole[logLevel].apply(console, args);
                };
              });

              window.__cgSandboxPost = function(result) {
                if (posted) return;
                posted = true;
                result.logs = logs;
                parent.postMessage({ source: 'cogniguide-sandbox', token: ${JSON.stringify(token)}, result: result }, '*');
              };

              // 捕获语法错误等无法被 try/catch 捕获的错误
              window.addEventListener('error', function(event) {
                window.__cgSandboxPost({
                  success: false,
                  error: event.message,
                  stack: event.error && event.error.stack
                });
              });
            })();
          </script>
          <script>
            try {
              ${safeCode}
              ;window.__cgSandboxPost({ success: true });
            } catch (error) {
              window.__cgSandboxPost({
                success: false,
                error: error && error.message ? error.message : String(error),
                stack: error && error.stack
              });
            }
          </script>
        </body>
      </html>
    `;

    let settled = false;

    const finish = (result: CodeExecutionResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      resolve(result);
    };

    function handleMessage(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (!data || data.source !== 'cogniguide-sandbox' || data.token !== token) return;

      const result = data.result || {};
      const logs: { level: string; args: string[] }[] = Array.isArray(result.logs) ? result.logs : [];

      // Combine logs
      const output = logs
        .map((log) => `[${String(log.level).toUpperCase()}] ${(log.args || []).join(' ')}`)
        .join('\n');

      if (result.success) {
        finish({
          success: true,
          output: output || 'Code executed successfully (no output)',
          executionTime: Date.now() - startTime,
        });
      } else {
        finish({
          success: false,
          error: `${result.error}\n\nStack: ${result.stack || 'N/A'}`,
          output: output,
          executionTime: Date.now() - startTime,
        });
      }
    }

    // Timeout handler
    const timeoutId = setTimeout(() => {
      finish({
        success: false,
        error: `Execution timeout (${timeout}ms)`,
        executionTime: timeout,
      });
    }, timeout);

    window.addEventListener('message', handleMessage);

    iframe.onerror = () => {
      finish({
        success: false,
        error: 'Failed to load execution environment',
        executionTime: Date.now() - startTime,
      });
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = script;
  });
}

/**
 * Execute Python code using Pyodide
 */
export async function executePython(code: string, timeout: number = 10000): Promise<CodeExecutionResult> {
  const startTime = Date.now();

  try {
    await initPyodide();

    // Run Python code
    const result = await Promise.race([
      pyodide.runPythonAsync(code),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      ),
    ]);

    // Capture stdout
    const stdout = pyodide.runPython('sys.stdout.getvalue()');
    const stderr = pyodide.runPython('sys.stderr.getvalue()');

    // Clear buffers
    pyodide.runPython('sys.stdout = StringIO(); sys.stderr = StringIO()');

    const output = stdout || (result !== undefined ? String(result) : '');

    return {
      success: !stderr,
      output: output || 'Code executed successfully (no output)',
      error: stderr || undefined,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute HTML/CSS code (preview in iframe)
 */
export function executeHTML(code: string): CodeExecutionResult {
  const startTime = Date.now();

  try {
    // Validate HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');
    const parseError = doc.querySelector('parsererror');

    if (parseError) {
      return {
        success: false,
        error: 'Invalid HTML: ' + parseError.textContent,
        executionTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      output: code, // Return HTML for iframe preview
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Main execution dispatcher
 */
export async function executeCode(
  code: string,
  language: CodeLanguage,
  timeout: number = 10000
): Promise<CodeExecutionResult> {
  if (!code || !code.trim()) {
    return {
      success: false,
      error: 'No code to execute',
    };
  }

  switch (language) {
    case CodeLanguage.JavaScript:
    case CodeLanguage.TypeScript:
      return executeJavaScript(code, timeout);

    case CodeLanguage.Python:
      return executePython(code, timeout);

    case CodeLanguage.HTML:
    case CodeLanguage.CSS:
      return executeHTML(code);

    default:
      return {
        success: false,
        error: `Unsupported language: ${language}`,
      };
  }
}

/**
 * Preload Pyodide (call this early to avoid delays)
 */
export async function preloadPyodide(): Promise<void> {
  try {
    await initPyodide();
  } catch (error) {
    console.warn('Failed to preload Pyodide:', error);
  }
}

/**
 * Check if Pyodide is available
 */
export function isPyodideReady(): boolean {
  return pyodide !== null;
}
