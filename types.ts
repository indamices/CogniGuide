
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