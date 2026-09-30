/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 仅在本地开发（npm run dev）时读取，生产构建不会打包这些值
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_GLM_API_KEY?: string;
  readonly VITE_MINIMAX_API_KEY?: string;
  readonly VITE_MINIMAX_GROUP_ID?: string;
  readonly VITE_KIMI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
