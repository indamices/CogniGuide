# useSpeech Hook

## 概述

`useSpeech` 是一个功能强大的自定义 React Hook，为 CogniGuide 应用提供完整的语音交互能力，包括语音识别 (STT) 和语音合成 (TTS) 功能。

## 功能特性

### 语音识别 (Speech-to-Text)
- 持续语音识别模式
- 实时临时结果反馈
- 自动中文语言检测
- 浏览器兼容性检测
- 权限状态管理

### 语音合成 (Text-to-Speech)
- 多声音选择与切换
- 语速、音调、音量可调
- 暂停/恢复/取消控制
- 当前播放消息追踪

## API 参考

### 返回值

```typescript
interface UseSpeechReturn {
  // === 语音识别 ===
  isListening: boolean;                    // 是否正在监听
  transcript: string;                      // 最终识别结果
  interimTranscript: string;                // 临时识别结果
  startListening: () => void;              // 开始监听
  stopListening: () => void;               // 停止监听
  resetTranscript: () => void;             // 重置结果
  browserSupportsSpeechRecognition: boolean; // 浏览器是否支持
  recognitionPermissionStatus: VoicePermissionStatus; // 权限状态

  // === 语音合成 ===
  isSpeaking: boolean;                    // 是否正在播放
  isPaused: boolean;                      // 是否已暂停
  currentSpeakingMessageId: string | null; // 当前播放的消息ID
  speak: (text: string, messageId?: string) => void; // 播放语音
  pause: () => void;                      // 暂停播放
  resume: () => void;                     // 恢复播放
  cancel: () => void;                     // 取消播放
  browserSupportsSpeechSynthesis: boolean;  // 浏览器是否支持

  // === 配置 ===
  voiceConfig: VoiceConfig;                 // 当前配置
  updateVoiceConfig: (config: Partial<VoiceConfig>) => void; // 更新配置
  availableVoices: SpeechSynthesisVoice[]; // 可用声音列表
  error: string | null;                   // 错误信息
}
```

### 初始配置

```typescript
interface VoiceConfig {
  rate: number;        // 语速 (0.5 - 2.0)，默认 1.0
  pitch: number;       // 音调 (0 - 2.0)，默认 1.0
  volume: number;      // 音量 (0 - 1.0)，默认 1.0
  voiceURI?: string;   // 选中声音的 URI
}
```

## 使用示例

### 基本用法

```tsx
import { useSpeech } from '../hooks/useSpeech';

function VoiceChatComponent() {
  const {
    // 语音识别
    isListening,
    transcript,
    startListening,
    stopListening,
    // 语音合成
    isSpeaking,
    speak,
    pause,
    resume,
    cancel,
    // 配置
    voiceConfig,
    updateVoiceConfig,
    availableVoices,
    error
  } = useSpeech();

  return (
    <div>
      {/* 语音输入按钮 */}
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? '停止录音' : '开始录音'}
      </button>

      {/* 显示识别结果 */}
      <p>识别内容: {transcript}</p>

      {/* 语音输出按钮 */}
      <button onClick={() => speak('你好，我是CogniGuide')}>
        播放欢迎语
      </button>

      {/* 播放控制 */}
      {isSpeaking && (
        <div>
          <button onClick={pause}>暂停</button>
          <button onClick={resume}>继续</button>
          <button onClick={cancel}>取消</button>
        </div>
      )}

      {/* 错误显示 */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### 自定义配置

```tsx
const speech = useSpeech({
  rate: 0.8,      // 稍慢的语速
  pitch: 1.1,     // 稍高的音调
  volume: 0.9     // 90% 音量
});

// 动态更新配置
speech.updateVoiceConfig({ rate: 1.2 });
```

### 消息关联播放

```tsx
function ChatMessage({ message }) {
  const { speak, isSpeaking, currentSpeakingMessageId } = useSpeech();

  const isCurrentMessage = currentSpeakingMessageId === message.id;

  return (
    <div className={isCurrentMessage ? 'speaking' : ''}>
      <p>{message.content}</p>
      <button onClick={() => speak(message.content, message.id)}>
        {isCurrentMessage ? '播放中...' : '播放'}
      </button>
    </div>
  );
}
```

### 声音选择器

```tsx
function VoiceSelector() {
  const { availableVoices, voiceConfig, updateVoiceConfig } = useSpeech();

  // 优先显示中文声音
  const chineseVoices = availableVoices.filter(v => v.lang.includes('zh'));
  const otherVoices = availableVoices.filter(v => !v.lang.includes('zh'));

  return (
    <select
      value={voiceConfig.voiceURI || ''}
      onChange={(e) => updateVoiceConfig({ voiceURI: e.target.value })}
    >
      <optgroup label="中文声音">
        {chineseVoices.map(v => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name} ({v.lang})
          </option>
        ))}
      </optgroup>
      <optgroup label="其他声音">
        {otherVoices.map(v => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name} ({v.lang})
          </option>
        ))}
      </optgroup>
    </select>
  );
}
```

## 权限状态

```typescript
type VoicePermissionStatus =
  | 'granted'    // 已授权
  | 'denied'     // 已拒绝
  | 'prompt'      // 待请求
  | 'unsupported'; // 浏览器不支持
```

## 浏览器兼容性

| 功能 | Chrome | Edge | Safari | Firefox |
|------|---------|-------|--------|---------|
| 语音识别 | ✅ | ✅ | ⚠️ 部分 | ❌ |
| 语音合成 | ✅ | ✅ | ✅ | ✅ |

## 注意事项

1. **语音识别权限**: 首次使用需要用户授权麦克风权限
2. **HTTPS 要求**: 语音 API 通常只在 HTTPS 环境下工作
3. **持续模式**: 识别默认为持续模式，会自动重启直到手动停止
4. **声音加载**: 可用声音列表可能异步加载，需监听 `voiceschanged` 事件
5. **播放队列**: 同时只能播放一个语音，新播放会取消当前播放

## 错误处理

Hook 会自动处理常见错误：

| 错误类型 | 处理方式 |
|----------|----------|
| no-speech | 提示"未检测到语音" |
| audio-capture | 提示"未找到麦克风" |
| not-allowed | 提示"麦克风权限被拒绝" |
| network | 提示"网络错误" |

## 相关文件

- `hooks/useSpeech.ts` - Hook 实现
- `components/VoiceControl.tsx` - 语音控制组件
- `components/VoiceInput.tsx` - 语音输入组件
- `components/VoiceOutput.tsx` - 语音输出组件
