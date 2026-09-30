/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  // 与之前的 Tailwind CDN 默认行为保持一致：dark: 前缀跟随系统配色
  darkMode: 'media',
  theme: {
    extend: {},
  },
  plugins: [],
};
