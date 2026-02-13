import { CodeLanguage, CodeExecutionResult, ConsoleLogLevel } from '../types';

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
      const { loadPyodide } = await import('pyodide');
      pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
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

    // Capture console output
    const capturedLogs: { level: ConsoleLogLevel; messages: any[] }[] = [];

    const script = `
      <html>
        <head>${metaCSP}</head>
        <body>
          <script>
            (function() {
              const logs = [];
              const originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info
              };

              ['log', 'warn', 'error', 'info'].forEach((logLevel) => {
                console[logLevel] = function(...args) {
                  logs.push({ level: logLevel, args: args.map(a => String(a)) });
                  originalConsole[logLevel].apply(console, args);
                };
              });

              try {
                ${code}
                window.__executionResult = { success: true, logs: logs };
              } catch (error) {
                window.__executionResult = {
                  success: false,
                  error: error.message,
                  stack: error.stack,
                  logs: logs
                };
              }
            })();
          </script>
        </body>
      </html>
    `;

    // Timeout handler
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        error: `Execution timeout (${timeout}ms)`,
        executionTime: timeout,
      });
    }, timeout);

    function cleanup() {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }

    iframe.onload = () => {
      try {
        const result = (iframe.contentWindow as any).__executionResult;

        cleanup();
        clearTimeout(timeoutId);

        if (!result) {
          resolve({
            success: false,
            error: 'No execution result',
            executionTime: Date.now() - startTime,
          });
          return;
        }

        // Combine logs
        const output = result.logs
          .map((log: any) => `[${log.level.toUpperCase()}] ${log.args.join(' ')}`)
          .join('\n');

        if (result.success) {
          resolve({
            success: true,
            output: output || 'Code executed successfully (no output)',
            executionTime: Date.now() - startTime,
          });
        } else {
          resolve({
            success: false,
            error: `${result.error}\n\nStack: ${result.stack || 'N/A'}`,
            output: output,
            executionTime: Date.now() - startTime,
          });
        }
      } catch (error) {
        cleanup();
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: `Execution error: ${(error as Error).message}`,
          executionTime: Date.now() - startTime,
        });
      }
    };

    iframe.onerror = () => {
      cleanup();
      clearTimeout(timeoutId);
      resolve({
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
