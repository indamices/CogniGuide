import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceConfig, VoiceState, VoicePermissionStatus } from '../types';

// 扩展 Window 接口以支持 Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    SpeechRecognitionEvent: any;
    webkitSpeechRecognitionEvent: any;
  }
}

interface UseSpeechReturn {
  // 语音识别 (STT)
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
  recognitionPermissionStatus: VoicePermissionStatus;

  // 语音合成 (TTS)
  isSpeaking: boolean;
  isPaused: boolean;
  currentSpeakingMessageId: string | null;
  speak: (text: string, messageId?: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  browserSupportsSpeechSynthesis: boolean;

  // 配置
  voiceConfig: VoiceConfig;
  updateVoiceConfig: (config: Partial<VoiceConfig>) => void;
  availableVoices: SpeechSynthesisVoice[];
  error: string | null;
}

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

export const useSpeech = (initialConfig?: Partial<VoiceConfig>): UseSpeechReturn => {
  // 语音识别状态
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);
  const [recognitionPermissionStatus, setRecognitionPermissionStatus] = useState<VoicePermissionStatus>('unsupported');

  // 语音合成状态
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeakingMessageId, setCurrentSpeakingMessageId] = useState<string | null>(null);
  const [browserSupportsSpeechSynthesis, setBrowserSupportsSpeechSynthesis] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // 配置
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({ ...DEFAULT_VOICE_CONFIG, ...initialConfig });
  const [error, setError] = useState<string | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const finalTranscriptRef = useRef('');
  const isRecognitionContinuousRef = useRef(false);

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        setBrowserSupportsSpeechRecognition(true);
        setRecognitionPermissionStatus('prompt');

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // 持续识别
        recognition.interimResults = true; // 返回临时结果
        recognition.lang = 'zh-CN'; // 默认中文，会自动切换

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);

          if (event.error === 'no-speech') {
            setError('未检测到语音，请重试');
          } else if (event.error === 'audio-capture') {
            setError('未找到麦克风');
            setRecognitionPermissionStatus('denied');
          } else if (event.error === 'not-allowed') {
            setError('麦克风权限被拒绝');
            setRecognitionPermissionStatus('denied');
          } else if (event.error === 'network') {
            setError('网络错误，请检查网络连接');
          } else {
            setError(`语音识别错误: ${event.error}`);
          }

          setIsListening(false);
        };

        recognition.onend = () => {
          // 如果是持续模式且没有主动停止，则重新启动
          if (isRecognitionContinuousRef.current && isListening) {
            try {
              recognition.start();
            } catch (err) {
              console.warn('Failed to restart recognition:', err);
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };

        recognition.onresult = (event: any) => {
          let interimText = '';
          let finalText = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalText += transcript;
            } else {
              interimText += transcript;
            }
          }

          if (finalText) {
            finalTranscriptRef.current += finalText;
            setTranscript(finalTranscriptRef.current);
          }

          setInterimTranscript(interimText);
        };

        recognitionRef.current = recognition;
      } else {
        setBrowserSupportsSpeechRecognition(false);
        setRecognitionPermissionStatus('unsupported');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore
        }
      }
    };
  }, [isListening]);

  // 初始化语音合成
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setBrowserSupportsSpeechSynthesis(true);

      // 加载可用声音
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // 优先选择中文或英文声音
        const zhVoice = voices.find(v => v.lang.includes('zh'));
        const enVoice = voices.find(v => v.lang.includes('en'));

        if (!voiceConfig.voiceURI) {
          setVoiceConfig(prev => ({
            ...prev,
            voiceURI: zhVoice?.voiceURI || enVoice?.voiceURI || voices[0]?.voiceURI,
          }));
        }
      };

      loadVoices();

      // 某些浏览器声音是异步加载的
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    } else {
      setBrowserSupportsSpeechSynthesis(false);
    }
  }, []);

  // 语音识别方法
  const startListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('浏览器不支持语音识别');
      return;
    }

    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    isRecognitionContinuousRef.current = true;

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('启动语音识别失败');
    }
  }, [browserSupportsSpeechRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      isRecognitionContinuousRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Failed to stop recognition:', err);
      }
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // 语音合成方法
  const speak = useCallback((text: string, messageId?: string) => {
    if (!browserSupportsSpeechSynthesis) {
      setError('浏览器不支持语音合成');
      return;
    }

    if (!text.trim()) return;

    // 取消当前正在播放的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // 应用配置
    utterance.rate = voiceConfig.rate;
    utterance.pitch = voiceConfig.pitch;
    utterance.volume = voiceConfig.volume;

    // 设置声音
    if (voiceConfig.voiceURI) {
      const voice = availableVoices.find(v => v.voiceURI === voiceConfig.voiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      if (messageId) {
        setCurrentSpeakingMessageId(messageId);
      }
      setError(null);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSpeakingMessageId(null);
    };

    utterance.onerror = (event: any) => {
      console.error('Speech synthesis error:', event);
      setError('语音合成出错');
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSpeakingMessageId(null);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [browserSupportsSpeechSynthesis, voiceConfig, availableVoices]);

  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isSpeaking, isPaused]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSpeakingMessageId(null);
  }, []);

  // 更新配置
  const updateVoiceConfig = useCallback((config: Partial<VoiceConfig>) => {
    setVoiceConfig(prev => ({ ...prev, ...config }));

    // 如果正在播放，应用新配置（需要重新开始）
    if (isSpeaking) {
      // 保存当前文本
      const currentText = utteranceRef.current?.text;
      const currentMessageId = currentSpeakingMessageId;

      // 取消当前播放
      window.speechSynthesis.cancel();

      // 使用新配置重新开始播放
      if (currentText) {
        setTimeout(() => {
          speak(currentText, currentMessageId || undefined);
        }, 100);
      }
    }
  }, [isSpeaking, currentSpeakingMessageId, speak]);

  return {
    // 语音识别
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    recognitionPermissionStatus,

    // 语音合成
    isSpeaking,
    isPaused,
    currentSpeakingMessageId,
    speak,
    pause,
    resume,
    cancel,
    browserSupportsSpeechSynthesis,

    // 配置
    voiceConfig,
    updateVoiceConfig,
    availableVoices,
    error,
  };
};

export default useSpeech;
