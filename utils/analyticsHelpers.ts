import { SavedSession, MasteryLevel, TeachingStage } from '../types';

// ============== Type Definitions ==============

export interface TimeRange {
  label: string;
  days: number | null; // null for all time
}

export interface LearningStats {
  totalStudyTime: number; // in minutes
  totalSessions: number;
  totalConcepts: number;
  averageMastery: number; // 0-100
  activeTopics: number;
  totalMessages: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  studyTime: number; // minutes
  sessions: number;
  conceptsLearned: number;
  messages: number;
}

export interface MasteryDistribution {
  level: MasteryLevel;
  count: number;
  percentage: number;
  color: string;
}

export interface StageDistribution {
  stage: TeachingStage;
  count: number;
  percentage: number;
  label: string;
}

export interface TimeOfDayPattern {
  hour: number; // 0-23
  sessionCount: number;
  studyTime: number;
  label: string;
}

export interface LearningInsight {
  type: 'strength' | 'weakness' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  icon: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  goal?: number;
}

// ============== Constants ==============

export const TIME_RANGES: TimeRange[] = [
  { label: '今天', days: 1 },
  { label: '本周', days: 7 },
  { label: '本月', days: 30 },
  { label: '全部', days: null },
];

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  [MasteryLevel.Expert]: '#10b981', // emerald-500
  [MasteryLevel.Competent]: '#3b82f6', // blue-500
  [MasteryLevel.Novice]: '#f59e0b', // amber-500
  [MasteryLevel.Unknown]: '#94a3b8', // slate-400
};

export const STAGE_LABELS: Record<TeachingStage, string> = {
  [TeachingStage.Introduction]: '引入探索',
  [TeachingStage.Construction]: '构建理解',
  [TeachingStage.Consolidation]: '巩固练习',
  [TeachingStage.Transfer]: '迁移应用',
  [TeachingStage.Reflection]: '反思评价',
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    title: '初学者',
    description: '完成第一次学习会话',
    icon: '🎯',
    unlocked: false,
  },
  {
    id: 'session_10',
    title: '勤奋学习者',
    description: '完成10次学习会话',
    icon: '📚',
    unlocked: false,
    goal: 10,
  },
  {
    id: 'session_50',
    title: '学习达人',
    description: '完成50次学习会话',
    icon: '🏆',
    unlocked: false,
    goal: 50,
  },
  {
    id: 'concept_50',
    title: '知识收集者',
    description: '掌握50个知识点',
    icon: '💡',
    unlocked: false,
    goal: 50,
  },
  {
    id: 'concept_100',
    title: '知识大师',
    description: '掌握100个知识点',
    icon: '🌟',
    unlocked: false,
    goal: 100,
  },
  {
    id: 'expert_10',
    title: '专家之路',
    description: '在10个知识点上达到专家水平',
    icon: '🎓',
    unlocked: false,
    goal: 10,
  },
  {
    id: 'streak_7',
    title: '坚持不懈',
    description: '连续7天学习',
    icon: '🔥',
    unlocked: false,
    goal: 7,
  },
  {
    id: 'time_60',
    title: '专注一小时',
    description: '单次学习超过60分钟',
    icon: '⏰',
    unlocked: false,
    goal: 60,
  },
  {
    id: 'time_total_300',
    title: '学习积累',
    description: '累计学习达到5小时',
    icon: '⏳',
    unlocked: false,
    goal: 300,
  },
  {
    id: 'all_stages',
    title: '完整学习者',
    description: '经历所有5个学习阶段',
    icon: '🎨',
    unlocked: false,
  },
];

// ============== Helper Functions ==============

/**
 * Filter sessions by time range
 */
export function filterSessionsByTimeRange(
  sessions: SavedSession[],
  timeRange: TimeRange
): SavedSession[] {
  if (!timeRange.days) return sessions;

  const cutoffDate = Date.now() - timeRange.days * 24 * 60 * 60 * 1000;
  return sessions.filter(session => session.lastModified >= cutoffDate);
}

/**
 * Calculate total study time from sessions
 * Estimates based on message count and timestamps
 */
export function calculateStudyTime(sessions: SavedSession[]): number {
  let totalMinutes = 0;

  sessions.forEach(session => {
    const messages = session.messages || [];
    if (messages.length < 2) return;

    // Use actual timestamp difference if available
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const timeSpan = lastMessage.timestamp - firstMessage.timestamp;

    // Convert to minutes (at least 1 minute per session)
    const sessionMinutes = Math.max(1, Math.round(timeSpan / (1000 * 60)));
    totalMinutes += sessionMinutes;
  });

  return totalMinutes;
}

/**
 * Calculate overall learning statistics
 */
export function calculateLearningStats(sessions: SavedSession[]): LearningStats {
  const totalStudyTime = calculateStudyTime(sessions);
  const totalSessions = sessions.length;
  const totalConcepts = sessions.reduce(
    (sum, s) => sum + (s.learningState?.concepts?.length || 0),
    0
  );

  // Calculate average mastery
  let totalMasteryScore = 0;
  let totalConceptsForMastery = 0;

  sessions.forEach(session => {
    const concepts = session.learningState?.concepts || [];
    concepts.forEach(concept => {
      let score = 0;
      switch (concept.mastery) {
        case MasteryLevel.Expert:
          score = 100;
          break;
        case MasteryLevel.Competent:
          score = 60;
          break;
        case MasteryLevel.Novice:
          score = 20;
          break;
        default:
          score = 0;
      }
      totalMasteryScore += score;
      totalConceptsForMastery++;
    });
  });

  const averageMastery = totalConceptsForMastery > 0
    ? Math.round(totalMasteryScore / totalConceptsForMastery)
    : 0;

  const activeTopics = new Set(sessions.map(s => s.topic)).size;
  const totalMessages = sessions.reduce(
    (sum, s) => sum + (s.messages?.length || 0),
    0
  );

  return {
    totalStudyTime,
    totalSessions,
    totalConcepts,
    averageMastery,
    activeTopics,
    totalMessages,
  };
}

/**
 * Group statistics by day
 */
export function groupByDay(sessions: SavedSession[]): DailyStats[] {
  const dailyMap = new Map<string, DailyStats>();

  sessions.forEach(session => {
    const date = new Date(session.lastModified);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const existing = dailyMap.get(dateKey) || {
      date: dateKey,
      studyTime: 0,
      sessions: 0,
      conceptsLearned: 0,
      messages: 0,
    };

    // Estimate session time
    const messages = session.messages || [];
    let sessionMinutes = 1;
    if (messages.length >= 2) {
      const timeSpan = messages[messages.length - 1].timestamp - messages[0].timestamp;
      sessionMinutes = Math.max(1, Math.round(timeSpan / (1000 * 60)));
    }

    existing.studyTime += sessionMinutes;
    existing.sessions += 1;
    existing.conceptsLearned += session.learningState?.concepts?.length || 0;
    existing.messages += messages.length;

    dailyMap.set(dateKey, existing);
  });

  // Convert to array and sort by date
  return Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Calculate mastery distribution
 */
export function calculateMasteryDistribution(sessions: SavedSession[]): MasteryDistribution[] {
  const masteryCounts: Record<MasteryLevel, number> = {
    [MasteryLevel.Expert]: 0,
    [MasteryLevel.Competent]: 0,
    [MasteryLevel.Novice]: 0,
    [MasteryLevel.Unknown]: 0,
  };

  let totalConcepts = 0;

  sessions.forEach(session => {
    const concepts = session.learningState?.concepts || [];
    concepts.forEach(concept => {
      masteryCounts[concept.mastery]++;
      totalConcepts++;
    });
  });

  return Object.entries(masteryCounts).map(([level, count]) => ({
    level: level as MasteryLevel,
    count,
    percentage: totalConcepts > 0 ? Math.round((count / totalConcepts) * 100) : 0,
    color: MASTERY_COLORS[level as MasteryLevel],
  }));
}

/**
 * Calculate stage distribution
 */
export function calculateStageDistribution(sessions: SavedSession[]): StageDistribution[] {
  const stageCounts: Record<TeachingStage, number> = {
    [TeachingStage.Introduction]: 0,
    [TeachingStage.Construction]: 0,
    [TeachingStage.Consolidation]: 0,
    [TeachingStage.Transfer]: 0,
    [TeachingStage.Reflection]: 0,
  };

  sessions.forEach(session => {
    const stage = session.learningState?.currentStage;
    if (stage) {
      stageCounts[stage]++;
    }
  });

  const totalSessions = sessions.length || 1;

  return Object.entries(stageCounts).map(([stage, count]) => ({
    stage: stage as TeachingStage,
    count,
    percentage: Math.round((count / totalSessions) * 100),
    label: STAGE_LABELS[stage as TeachingStage],
  }));
}

/**
 * Analyze time-of-day patterns
 */
export function analyzeTimePatterns(sessions: SavedSession[]): TimeOfDayPattern[] {
  const hourMap = new Map<number, { count: number; time: number }>();

  sessions.forEach(session => {
    const hour = new Date(session.lastModified).getHours();
    const existing = hourMap.get(hour) || { count: 0, time: 0 };

    // Estimate session time
    const messages = session.messages || [];
    let sessionMinutes = 1;
    if (messages.length >= 2) {
      const timeSpan = messages[messages.length - 1].timestamp - messages[0].timestamp;
      sessionMinutes = Math.max(1, Math.round(timeSpan / (1000 * 60)));
    }

    existing.count++;
    existing.time += sessionMinutes;

    hourMap.set(hour, existing);
  });

  return Array.from({ length: 24 }, (_, hour) => {
    const data = hourMap.get(hour) || { count: 0, time: 0 };
    const period = hour < 6 ? '深夜' : hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上';
    return {
      hour,
      sessionCount: data.count,
      studyTime: data.time,
      label: `${hour}:00 (${period})`,
    };
  });
}

/**
 * Generate learning insights
 */
export function generateInsights(
  sessions: SavedSession[],
  stats: LearningStats,
  masteryDist: MasteryDistribution[],
  timePatterns: TimeOfDayPattern[]
): LearningInsight[] {
  const insights: LearningInsight[] = [];

  // Check for strengths
  const expertCount = masteryDist.find(m => m.level === MasteryLevel.Expert)?.count || 0;
  if (expertCount >= 5) {
    insights.push({
      type: 'strength',
      title: '知识专家',
      description: `您已在 ${expertCount} 个知识点上达到专家水平，继续保持！`,
      icon: '💪',
      priority: 'high',
    });
  }

  const competentCount = masteryDist.find(m => m.level === MasteryLevel.Competent)?.count || 0;
  if (competentCount >= 10) {
    insights.push({
      type: 'strength',
      title: '扎实基础',
      description: `您已熟练掌握 ${competentCount} 个知识点，基础非常扎实。`,
      icon: '🎯',
      priority: 'medium',
    });
  }

  // Check for weaknesses
  const noviceCount = masteryDist.find(m => m.level === MasteryLevel.Novice)?.count || 0;
  if (noviceCount > 10) {
    insights.push({
      type: 'weakness',
      title: '需要巩固',
      description: `有 ${noviceCount} 个知识点处于新手水平，建议多加练习。`,
      icon: '📝',
      priority: 'high',
    });
  }

  // Time-based insights
  const peakHour = timePatterns.reduce((max, p) =>
    p.sessionCount > max.sessionCount ? p : max, timePatterns[0]);
  if (peakHour && peakHour.sessionCount > 0) {
    insights.push({
      type: 'suggestion',
      title: '最佳学习时段',
      description: `您在 ${peakHour.hour}:00-${peakHour.hour + 1}:00 学习最活跃，建议安排重要内容。`,
      icon: '⏰',
      priority: 'medium',
    });
  }

  // Study frequency insights
  if (stats.totalSessions > 0 && stats.totalStudyTime / stats.totalSessions < 10) {
    insights.push({
      type: 'suggestion',
      title: '增加学习时长',
      description: '平均每次学习时间较短，建议每次学习至少15-30分钟以获得更好效果。',
      icon: '⏳',
      priority: 'medium',
    });
  }

  // Topic diversity
  if (stats.activeTopics >= 5) {
    insights.push({
      type: 'achievement',
      title: '博学多才',
      description: `您已学习 ${stats.activeTopics} 个不同主题，知识面非常广！`,
      icon: '🌟',
      priority: 'low',
    });
  }

  return insights;
}

/**
 * Check and update achievements
 */
export function checkAchievements(
  sessions: SavedSession[],
  stats: LearningStats
): Achievement[] {
  const achievements = ACHIEVEMENTS.map(a => ({ ...a }));

  // First session
  if (stats.totalSessions >= 1) {
    const ach = achievements.find(a => a.id === 'first_session');
    if (ach) ach.unlocked = true;
  }

  // Session milestones
  if (stats.totalSessions >= 10) {
    const ach = achievements.find(a => a.id === 'session_10');
    if (ach) ach.unlocked = true;
  }
  if (stats.totalSessions >= 50) {
    const ach = achievements.find(a => a.id === 'session_50');
    if (ach) ach.unlocked = true;
  }

  // Concept milestones
  if (stats.totalConcepts >= 50) {
    const ach = achievements.find(a => a.id === 'concept_50');
    if (ach) ach.unlocked = true;
  }
  if (stats.totalConcepts >= 100) {
    const ach = achievements.find(a => a.id === 'concept_100');
    if (ach) ach.unlocked = true;
  }

  // Expert concepts
  const expertCount = sessions.reduce(
    (sum, s) => sum + (s.learningState?.concepts?.filter(c => c.mastery === MasteryLevel.Expert).length || 0),
    0
  );
  if (expertCount >= 10) {
    const ach = achievements.find(a => a.id === 'expert_10');
    if (ach) ach.unlocked = true;
  }

  // Check for all stages
  const stagesSeen = new Set(sessions.map(s => s.learningState?.currentStage));
  if (stagesSeen.size >= 5) {
    const ach = achievements.find(a => a.id === 'all_stages');
    if (ach) ach.unlocked = true;
  }

  // Check study streak
  const streak = calculateStreak(sessions);
  if (streak >= 7) {
    const ach = achievements.find(a => a.id === 'streak_7');
    if (ach) ach.unlocked = true;
  }

  // Check for long session
  const maxSessionTime = Math.max(
    ...sessions.map(s => {
      const messages = s.messages || [];
      if (messages.length < 2) return 0;
      const timeSpan = messages[messages.length - 1].timestamp - messages[0].timestamp;
      return Math.round(timeSpan / (1000 * 60));
    })
  );
  if (maxSessionTime >= 60) {
    const ach = achievements.find(a => a.id === 'time_60');
    if (ach) ach.unlocked = true;
  }

  // Total study time
  if (stats.totalStudyTime >= 300) {
    const ach = achievements.find(a => a.id === 'time_total_300');
    if (ach) ach.unlocked = true;
  }

  // Update progress for locked achievements
  achievements.forEach(ach => {
    if (!ach.unlocked && ach.goal) {
      if (ach.id === 'session_10' || ach.id === 'session_50') {
        ach.progress = Math.min((stats.totalSessions / ach.goal) * 100, 100);
      } else if (ach.id === 'concept_50' || ach.id === 'concept_100') {
        ach.progress = Math.min((stats.totalConcepts / ach.goal) * 100, 100);
      } else if (ach.id === 'expert_10') {
        ach.progress = Math.min((expertCount / ach.goal) * 100, 100);
      } else if (ach.id === 'streak_7') {
        ach.progress = Math.min((streak / ach.goal) * 100, 100);
      } else if (ach.id === 'time_total_300') {
        ach.progress = Math.min((stats.totalStudyTime / ach.goal) * 100, 100);
      }
    }
  });

  return achievements;
}

/**
 * Calculate learning streak (consecutive days)
 */
export function calculateStreak(sessions: SavedSession[]): number {
  if (sessions.length === 0) return 0;

  // Get unique days
  const days = new Set(
    sessions.map(s => {
      const date = new Date(s.lastModified);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })
  );

  const sortedDays = Array.from(days).sort().reverse();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let streak = 0;
  let checkDate = new Date(today);

  // Check if streak starts from today or yesterday
  const hasToday = sortedDays.includes(todayKey);
  if (!hasToday) {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (!sortedDays.includes(yesterdayKey)) {
      return 0; // No active streak
    }
  }

  // Count consecutive days
  for (let i = 0; i < 365; i++) {
    const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (sortedDays.includes(dateKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Format time duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

/**
 * Export learning report as text
 */
export function exportLearningReport(
  stats: LearningStats,
  timeRange: TimeRange,
  masteryDist: MasteryDistribution[],
  insights: LearningInsight[],
  achievements: Achievement[]
): string {
  const report = `# CogniGuide 学习分析报告

生成时间: ${new Date().toLocaleString('zh-CN')}
统计范围: ${timeRange.label}

## 📊 学习统计

- 总学习时长: ${formatDuration(stats.totalStudyTime)}
- 学习会话: ${stats.totalSessions} 次
- 知识点数量: ${stats.totalConcepts} 个
- 平均掌握度: ${stats.averageMastery}%
- 活跃主题: ${stats.activeTopics} 个
- 总消息数: ${stats.totalMessages} 条

## 📈 知识掌握分布

${masteryDist.map(m => {
  const label = {
    Expert: '专家',
    Competent: '熟练',
    Novice: '新手',
    Unknown: '未知',
  }[m.level];
  return `- ${label}: ${m.count} 个 (${m.percentage}%)`;
}).join('\n')}

## 💡 学习洞察

${insights.map(i => `${i.icon} **${i.title}**\n${i.description}`).join('\n\n')}

## 🏆 成就系统

${achievements.filter(a => a.unlocked).map(a => `${a.icon} ${a.title}: ${a.description}`).join('\n')}

---
由 CogniGuide AI 学习伴侣生成
`;

  return report;
}
