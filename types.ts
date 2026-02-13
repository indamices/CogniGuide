
export enum MasteryLevel {
  Unknown = 'Unknown',
  Novice = 'Novice',
  Competent = 'Competent',
  Expert = 'Expert',
}

export enum MessageRole {
  User = 'user',
  Model = 'model',
}

// New: Teaching Modes for user control vs AI autonomy
export enum TeachingMode {
  Auto = 'Auto',         // AI decides based on the matrix
  Socratic = 'Socratic', // Force questioning
  Narrative = 'Narrative', // Force storytelling/history
  Lecture = 'Lecture',   // Force direct explanation
}

// New: The 5 Phases of Learning defined in your framework
export enum TeachingStage {
  Introduction = 'Introduction', // 引入探索期
  Construction = 'Construction', // 构建理解期
  Consolidation = 'Consolidation', // 巩固练习期
  Transfer = 'Transfer',         // 迁移应用期
  Reflection = 'Reflection',     // 反思评价期
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface ConceptNode {
  id: string;
  name: string;
  mastery: MasteryLevel;
  description?: string;
}

export interface ConceptLink {
  source: string;
  target: string;
  relationship: string;
}

export interface LearningState {
  concepts: ConceptNode[];
  links: ConceptLink[];
  currentStrategy: string; // Text description of strategy
  currentStage: TeachingStage; // The tracked phase
  cognitiveLoad: 'Low' | 'Optimal' | 'High';
  feedback: string;
  summary: string[]; 
}

export interface TutorResponse {
  conversationalReply: string;
  internalThought: string;
  updatedConcepts: ConceptNode[];
  updatedLinks: ConceptLink[];
  appliedStrategy: string;
  detectedStage: TeachingStage; // AI reports which stage it thinks we are in
  cognitiveLoadEstimate: 'Low' | 'Optimal' | 'High';
  summaryFragments: string[]; // Changed from single string to array for aggressive capture
}

export interface SavedSession {
  id: string;
  title: string;
  topic: string;
  messages: ChatMessage[];
  learningState: LearningState;
  teachingMode: TeachingMode; // Persist the mode preference
  lastModified: number;
  model: string;
}

// Spaced Repetition System Types
export type QualityRating = 1 | 2 | 3 | 4 | 5;

export interface ReviewCard {
  id: string;
  question: string;
  answer: string;
  sessionId: string; // 关联的学习会话
  conceptId?: string; // 可选：关联的知识节点

  // SuperMemo-2 算法参数
  easeFactor: number; // EF (1.3 - 2.5)
  interval: number; // 距离上次复习的天数
  repetitions: number; // 成功复习次数

  // 时间调度
  nextReviewDate: number; // Unix timestamp
  lastReviewDate?: number;
  createdDate: number;

  // 元数据
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  reviewHistory: ReviewRecord[];
}

export interface ReviewRecord {
  date: number;
  quality: QualityRating;
  timeTaken: number; // 毫秒
}

export interface ReviewStatistics {
  totalCards: number;
  dueCards: number;
  reviewedToday: number;
  averageQuality: number;
  averageEaseFactor: number;
  memoryStrengthDistribution: {
    weak: number; // 0-40%
    medium: number; // 41-70%
    strong: number; // 71-100%
  };
}

// Code Sandbox Types
export enum CodeLanguage {
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Python = 'python',
  HTML = 'html',
  CSS = 'css',
}

export enum ConsoleLogLevel {
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
  Info = 'info',
}

export interface ConsoleMessage {
  id: string;
  level: ConsoleLogLevel;
  content: string;
  timestamp: number;
  source?: string;
}

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface CodeSandboxTab {
  id: string;
  title: string;
  language: CodeLanguage;
  code: string;
}

export interface CodeSandboxState {
  tabs: CodeSandboxTab[];
  activeTabId: string;
  consoleMessages: ConsoleMessage[];
  isRunning: boolean;
  htmlPreview?: string;
}

// Voice Interaction Types
export interface VoiceConfig {
  rate: number;        // 语速 (0.5-2)
  pitch: number;       // 音调 (0-2)
  volume: number;      // 音量 (0-1)
  voiceURI?: string;   // 选中的声音
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  transcript: string;
  interimTranscript: string;
  currentSpeakingMessageId: string | null;
  error: string | null;
}

export type VoicePermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionError {
  error: string;
  message: string;
}