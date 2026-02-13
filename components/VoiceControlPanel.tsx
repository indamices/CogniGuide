import React, { useState } from 'react';
import { VoiceConfig } from '../types';

interface VoiceControlPanelProps {
  voiceConfig: VoiceConfig;
  onConfigChange: (config: Partial<VoiceConfig>) => void;
  availableVoices: SpeechSynthesisVoice[];
  isOpen: boolean;
  onClose: () => void;
}

const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({
  voiceConfig,
  onConfigChange,
  availableVoices,
  isOpen,
  onClose,
}) => {
  const [localConfig, setLocalConfig] = useState<VoiceConfig>(voiceConfig);

  const handleRateChange = (rate: number) => {
    const newRate = Math.round(rate * 10) / 10;
    setLocalConfig(prev => ({ ...prev, rate: newRate }));
    onConfigChange({ rate: newRate });
  };

  const handlePitchChange = (pitch: number) => {
    const newPitch = Math.round(pitch * 10) / 10;
    setLocalConfig(prev => ({ ...prev, pitch: newPitch }));
    onConfigChange({ pitch: newPitch });
  };

  const handleVolumeChange = (volume: number) => {
    const newVolume = Math.round(volume * 10) / 10;
    setLocalConfig(prev => ({ ...prev, volume: newVolume }));
    onConfigChange({ volume: newVolume });
  };

  const handleVoiceChange = (voiceURI: string) => {
    setLocalConfig(prev => ({ ...prev, voiceURI }));
    onConfigChange({ voiceURI });
  };

  // 按语言分组声音
  const groupedVoices = availableVoices.reduce((acc, voice) => {
    const lang = voice.lang.split('-')[0]; // 获取主语言代码
    if (!acc[lang]) {
      acc[lang] = [];
    }
    acc[lang].push(voice);
    return acc;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 animate-in slide-in-from-right-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">语音控制面板</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          title="关闭"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Voice Selection */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          选择声音
        </label>
        <select
          value={localConfig.voiceURI || ''}
          onChange={(e) => handleVoiceChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
        >
          {!localConfig.voiceURI && <option value="">默认声音</option>}
          {Object.entries(groupedVoices).map(([lang, voices]) => (
            <optgroup key={lang} label={lang === 'zh' ? '中文' : lang === 'en' ? '英文' : lang}>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Rate Control */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">语速</label>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {localConfig.rate}x
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={localConfig.rate}
          onChange={(e) => handleRateChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0.5x (慢)</span>
          <span>1x (正常)</span>
          <span>2x (快)</span>
        </div>
      </div>

      {/* Pitch Control */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">音调</label>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {localConfig.pitch}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={localConfig.pitch}
          onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>低</span>
          <span>正常</span>
          <span>高</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">音量</label>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {Math.round(localConfig.volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={localConfig.volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>静音</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Presets */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          快速预设
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              onConfigChange({ rate: 0.8, pitch: 1.0, volume: 1.0 });
              setLocalConfig({ rate: 0.8, pitch: 1.0, volume: 1.0 });
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            慢速讲解
          </button>
          <button
            onClick={() => {
              onConfigChange({ rate: 1.0, pitch: 1.0, volume: 1.0 });
              setLocalConfig({ rate: 1.0, pitch: 1.0, volume: 1.0 });
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            正常
          </button>
          <button
            onClick={() => {
              onConfigChange({ rate: 1.5, pitch: 1.0, volume: 1.0 });
              setLocalConfig({ rate: 1.5, pitch: 1.0, volume: 1.0 });
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            快速
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceControlPanel;
