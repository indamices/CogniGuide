/**
 * 智能学习路径推荐引擎
 *
 * 核心功能：
 * 1. 依赖分析 - 识别知识点的前置依赖
 * 2. 难度评估 - 基于用户掌握度和知识复杂度
 * 3. 兴趣分析 - 分析用户学习主题偏好
 * 4. 遗忘曲线 - 结合间隔重复数据
 */

import { ConceptNode, ConceptLink, MasteryLevel, ReviewCard, TeachingStage } from '../types';
import { isCardDue, getMemoryStrength } from './spacedRepetition';

/**
 * 推荐类型
 */
export enum RecommendationType {
  NextToLearn = 'next_to_learn',        // 接下来应该学习
  WeakPoints = 'weak_points',           // 薄弱知识点强化
  RelatedTopics = 'related_topics',     // 相关主题拓展
  DueForReview = 'due_for_review',      // 今日复习
  RestBreak = 'rest_break',             // 休息建议
}

/**
 * 单个推荐项
 */
export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  reason: string;                    // 推荐理由（AI生成或规则生成）
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: number;            // 分钟
  concepts: string[];                // 涉及的概念ID
  confidenceScore: number;           // 0-1，推荐置信度

  // 可选字段
  relatedCards?: string[];           // 关联的复习卡片ID
  prerequisiteConcepts?: string[];   // 前置概念
  followUpConcepts?: string[];       // 后续概念
  suggestedQuestions?: string[];     // 建议的学习问题
}

/**
 * 用户学习偏好分析
 */
export interface LearningPreferences {
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  averageSessionLength: number;      // 分钟
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  strongTopics: string[];            // 擅长的主题关键词
  weakTopics: string[];              // 薄弱的主题关键词
  learningStreak: number;            // 连续学习天数
  lastStudyTime?: number;            // 上次学习时间
  fatigueLevel: 'low' | 'medium' | 'high'; // 学习疲劳度
}

/**
 * 知识图谱结构分析
 */
interface KnowledgeGraphAnalysis {
  roots: string[];                   // 根节点（无前置依赖）
  leaves: string[];                  // 叶节点（无后续依赖）
  chains: string[][];                // 学习链（有序的概念序列）
  clusters: string[][];              // 概念簇（相关的概念组）
  depthMap: Map<string, number>;     // 概念深度（距根节点的距离）
}

/**
 * 推荐引擎配置
 */
export interface RecommendationConfig {
  maxRecommendations: number;        // 最大推荐数量
  enableRestBreaks: boolean;         // 是否启用休息建议
  minConfidenceThreshold: number;    // 最低置信度阈值
  fatigueThreshold: number;          // 疲劳度阈值（0-1）
  diversityFactor: number;           // 多样性因子（0-1，越高越多样化）
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: RecommendationConfig = {
  maxRecommendations: 5,
  enableRestBreaks: true,
  minConfidenceThreshold: 0.3,
  fatigueThreshold: 0.7,
  diversityFactor: 0.4,
};

/**
 * 分析知识图谱结构
 */
function analyzeKnowledgeGraph(
  concepts: ConceptNode[],
  links: ConceptLink[]
): KnowledgeGraphAnalysis {
  const conceptIds = new Set(concepts.map(c => c.id));
  const incomingLinks = new Map<string, string[]>();
  const outgoingLinks = new Map<string, string[]>();

  // 初始化
  concepts.forEach(c => {
    incomingLinks.set(c.id, []);
    outgoingLinks.set(c.id, []);
  });

  // 构建邻接表
  links.forEach(link => {
    if (conceptIds.has(link.source) && conceptIds.has(link.target)) {
      outgoingLinks.get(link.source)?.push(link.target);
      incomingLinks.get(link.target)?.push(link.source);
    }
  });

  // 找出根节点和叶节点
  const roots: string[] = [];
  const leaves: string[] = [];

  concepts.forEach(c => {
    const inDegree = incomingLinks.get(c.id)?.length || 0;
    const outDegree = outgoingLinks.get(c.id)?.length || 0;

    if (inDegree === 0 && outDegree > 0) {
      roots.push(c.id);
    }
    if (outDegree === 0 && inDegree > 0) {
      leaves.push(c.id);
    }
  });

  // 计算深度（BFS）
  const depthMap = new Map<string, number>();
  const visited = new Set<string>();

  roots.forEach(root => {
    depthMap.set(root, 0);
    const queue = [root];
    visited.add(root);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDepth = depthMap.get(current) || 0;
      const neighbors = outgoingLinks.get(current) || [];

      neighbors.forEach(neighbor => {
        const newDepth = currentDepth + 1;
        const existingDepth = depthMap.get(neighbor);

        if (!existingDepth || newDepth < existingDepth) {
          depthMap.set(neighbor, newDepth);
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
  });

  // 找出学习链（从根到叶的路径）
  const chains: string[][] = [];
  const findChains = (current: string, path: string[]) => {
    const newPath = [...path, current];
    const neighbors = outgoingLinks.get(current) || [];

    if (neighbors.length === 0) {
      chains.push(newPath);
    } else {
      neighbors.forEach(neighbor => {
        findChains(neighbor, newPath);
      });
    }
  };

  roots.forEach(root => findChains(root, []));

  // 找出概念簇（强连接组件）
  const clusters: string[][] = [];
  const processed = new Set<string>();

  concepts.forEach(concept => {
    if (!processed.has(concept.id)) {
      const cluster: string[] = [];
      const queue = [concept.id];
      processed.add(concept.id);

      while (queue.length > 0) {
        const current = queue.shift()!;
        cluster.push(current);

        const neighbors = [...(outgoingLinks.get(current) || []), ...(incomingLinks.get(current) || [])];
        neighbors.forEach(neighbor => {
          if (!processed.has(neighbor)) {
            processed.add(neighbor);
            queue.push(neighbor);
          }
        });
      }

      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
  });

  return { roots, leaves, chains, clusters, depthMap };
}

/**
 * 评估概念学习难度
 */
function estimateConceptDifficulty(
  concept: ConceptNode,
  graphAnalysis: KnowledgeGraphAnalysis,
  userMastery: MasteryLevel
): number {
  // 基础难度（0-1）
  let difficulty = 0.5;

  // 根据用户掌握度调整
  switch (userMastery) {
    case MasteryLevel.Unknown:
      difficulty += 0.3;
      break;
    case MasteryLevel.Novice:
      difficulty += 0.1;
      break;
    case MasteryLevel.Competent:
      difficulty -= 0.1;
      break;
    case MasteryLevel.Expert:
      difficulty -= 0.3;
      break;
  }

  // 根据深度调整（越深越难）
  const depth = graphAnalysis.depthMap.get(concept.id) || 0;
  difficulty += Math.min(depth * 0.1, 0.3);

  // 根据连接数调整（连接越多可能越复杂）
  // 这里需要links参数，暂时简化
  difficulty = Math.max(0, Math.min(1, difficulty));

  return difficulty;
}

/**
 * 分析用户学习偏好
 */
function analyzeLearningPreferences(
  sessions: any[],
  reviewCards: ReviewCard[],
  currentSessionId?: string
): LearningPreferences {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 计算学习连续天数
  let learningStreak = 0;
  const sessionDates = sessions
    .map(s => s.lastModified)
    .filter(d => d)
    .sort((a, b) => b - a);

  for (let i = 0; i < sessionDates.length; i++) {
    const current = sessionDates[i];
    const expected = now - i * dayMs;

    if (current && expected - current < dayMs) {
      learningStreak++;
    } else {
      break;
    }
  }

  // 计算平均会话时长（基于消息数量和创建时间）
  const averageSessionLength = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => {
        const duration = s.messages.length > 2
          ? (s.lastModified - s.messages[0].timestamp) / 60000 // 分钟
          : 5;
        return sum + Math.max(duration, 5);
      }, 0) / sessions.length)
    : 30;

  // 分析偏好时间（简化版，基于session时间戳）
  const hourCounts: { morning: number; afternoon: number; evening: number; night: number } = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  };
  sessions.forEach((s: any) => {
    if (s.lastModified) {
      const hour = new Date(s.lastModified).getHours();
      if (hour >= 6 && hour < 12) hourCounts.morning++;
      else if (hour >= 12 && hour < 18) hourCounts.afternoon++;
      else if (hour >= 18 && hour < 24) hourCounts.evening++;
      else hourCounts.night++;
    }
  });

  const preferredTimeOfDay = (Object.keys(hourCounts) as Array<keyof typeof hourCounts>).reduce((a, b) =>
    hourCounts[a] > hourCounts[b] ? a : b
  );

  // 分析当前疲劳度
  const currentSession = sessions.find((s: any) => s.id === currentSessionId);
  const lastStudyTime = currentSession?.lastModified || sessions[0]?.lastModified;
  const timeSinceLastStudy = lastStudyTime ? now - lastStudyTime : Infinity;
  const recentMessages = currentSession?.messages?.slice(-10) || [];
  const recentActivityCount = recentMessages.filter((m: { timestamp?: number }) =>
    m.timestamp && now - m.timestamp < 2 * 60 * 60 * 1000 // 2小时内
  ).length;

  let fatigueLevel: 'low' | 'medium' | 'high' = 'low';
  if (recentActivityCount > 20 || timeSinceLastStudy < 10 * 60 * 1000) {
    fatigueLevel = 'high';
  } else if (recentActivityCount > 10 || timeSinceLastStudy < 30 * 60 * 1000) {
    fatigueLevel = 'medium';
  }

  // 提取强项和弱项主题（基于session topic）
  const topicCounts = new Map<string, { mastered: number; total: number }>();
  sessions.forEach((s: any) => {
    if (!s.topic) return;

    const topicKey = s.topic.toLowerCase().split(/\s+/)[0]; // 取第一个词
    const stats = topicCounts.get(topicKey) || { mastered: 0, total: 0 };

    stats.total++;
    const concepts = s.learningState?.concepts || [];
    const expertCount = concepts.filter((c: ConceptNode) =>
      c.mastery === MasteryLevel.Expert
    ).length;
    const competentCount = concepts.filter((c: ConceptNode) =>
      c.mastery === MasteryLevel.Expert || c.mastery === MasteryLevel.Competent
    ).length || 0;
    const totalConcepts = concepts.length || 1;

    if (expertCount / totalConcepts > 0.6) {
      stats.mastered++;
    }

    topicCounts.set(topicKey, stats);
  });

  const strongTopics: string[] = [];
  const weakTopics: string[] = [];

  topicCounts.forEach((stats, topic) => {
    if (stats.total >= 2) {
      if (stats.mastered / stats.total > 0.6) {
        strongTopics.push(topic);
      } else if (stats.mastered / stats.total < 0.3) {
        weakTopics.push(topic);
      }
    }
  });

  // 偏好难度（基于当前掌握度）
  const allConcepts = sessions.flatMap(s => s.learningState?.concepts || []);
  const expertCount = allConcepts.filter(c => c.mastery === MasteryLevel.Expert).length;
  const totalConcepts = allConcepts.length || 1;
  const masteryRatio = expertCount / totalConcepts;

  let preferredDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (masteryRatio > 0.7) {
    preferredDifficulty = 'hard';
  } else if (masteryRatio < 0.3) {
    preferredDifficulty = 'easy';
  }

  return {
    preferredTimeOfDay,
    averageSessionLength,
    preferredDifficulty,
    strongTopics,
    weakTopics,
    learningStreak,
    lastStudyTime,
    fatigueLevel,
  };
}

/**
 * 生成"接下来应该学习"推荐
 */
function generateNextToLearnRecommendations(
  concepts: ConceptNode[],
  links: ConceptLink[],
  graphAnalysis: KnowledgeGraphAnalysis,
  preferences: LearningPreferences,
  config: RecommendationConfig
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 策略1：推荐未掌握的前置概念
  const unmasteredConcepts = concepts.filter(c =>
    c.mastery === MasteryLevel.Unknown || c.mastery === MasteryLevel.Novice
  );

  // 优先推荐根节点或浅层节点
  const shallowUnmastered = unmasteredConcepts
    .filter(c => {
      const depth = graphAnalysis.depthMap.get(c.id) || 0;
      return depth <= 1;
    })
    .slice(0, 3);

  shallowUnmastered.forEach(concept => {
    const difficulty = estimateConceptDifficulty(concept, graphAnalysis, concept.mastery);

    recommendations.push({
      id: `next-${concept.id}`,
      type: RecommendationType.NextToLearn,
      title: `学习：${concept.name}`,
      description: concept.description || '掌握这个基础知识',
      reason: `这是学习路径中的重要基础，掌握后将帮助你理解更多相关概念。`,
      priority: difficulty > 0.6 ? 'medium' : 'high',
      estimatedTime: Math.round(15 + difficulty * 20),
      concepts: [concept.id],
      confidenceScore: 0.8,
      suggestedQuestions: [
        `什么是${concept.name}？`,
        `如何理解${concept.name}的核心概念？`,
        `${concept.name}有哪些实际应用？`,
      ],
    });
  });

  // 策略2：基于当前学习阶段推荐
  if (unmasteredConcepts.length === 0 || shallowUnmastered.length === 0) {
    // 如果基础已掌握，推荐进阶内容
    const competentConcepts = concepts.filter(c => c.mastery === MasteryLevel.Competent);

    competentConcepts.slice(0, 2).forEach(concept => {
      recommendations.push({
        id: `advance-${concept.id}`,
        type: RecommendationType.NextToLearn,
        title: `深化：${concept.name}`,
        description: `从理解到精通，深化${concept.name}的理解`,
        reason: `你已经掌握了${concept.name}的基础，现在是深化理解的好时机。`,
        priority: 'medium',
        estimatedTime: 25,
        concepts: [concept.id],
        confidenceScore: 0.7,
        suggestedQuestions: [
          `能否举例说明${concept.name}的复杂应用？`,
          `${concept.name}与其他概念有什么深层联系？`,
        ],
      });
    });
  }

  return recommendations.slice(0, config.maxRecommendations);
}

/**
 * 生成"薄弱知识点强化"推荐
 */
function generateWeakPointsRecommendations(
  concepts: ConceptNode[],
  links: ConceptLink[],
  reviewCards: ReviewCard[],
  preferences: LearningPreferences,
  config: RecommendationConfig
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 识别薄弱概念（掌握度低且需要复习）
  const weakConcepts = concepts.filter(c =>
    c.mastery === MasteryLevel.Novice || c.mastery === MasteryLevel.Unknown
  );

  // 找出关联的复习卡片
  weakConcepts.slice(0, 3).forEach(concept => {
    const relatedCards = reviewCards.filter(card =>
      card.conceptId === concept.id || isCardDue(card)
    );

    if (relatedCards.length > 0) {
      recommendations.push({
        id: `weak-${concept.id}`,
        type: RecommendationType.WeakPoints,
        title: `强化：${concept.name}`,
        description: `通过复习巩固薄弱知识点`,
        reason: `检测到${concept.name}掌握度较低，建议通过复习卡片加强记忆。`,
        priority: 'high',
        estimatedTime: 10 * relatedCards.length,
        concepts: [concept.id],
        confidenceScore: 0.9,
        relatedCards: relatedCards.map(c => c.id),
      });
    } else {
      recommendations.push({
        id: `weak-${concept.id}`,
        type: RecommendationType.WeakPoints,
        title: `回顾：${concept.name}`,
        description: `重新学习这个薄弱知识点`,
        reason: `${concept.name}是你的薄弱环节，建议重新学习和练习。`,
        priority: 'high',
        estimatedTime: 20,
        concepts: [concept.id],
        confidenceScore: 0.8,
        suggestedQuestions: [
          `请重新解释${concept.name}的含义`,
          `我在${concept.name}方面有哪些理解误区？`,
        ],
      });
    }
  });

  return recommendations.slice(0, config.maxRecommendations);
}

/**
 * 生成"相关主题拓展"推荐
 */
function generateRelatedTopicsRecommendations(
  concepts: ConceptNode[],
  links: ConceptLink[],
  graphAnalysis: KnowledgeGraphAnalysis,
  preferences: LearningPreferences,
  config: RecommendationConfig
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 找出已掌握的概念的邻居
  const masteredConcepts = concepts.filter(c =>
    c.mastery === MasteryLevel.Competent || c.mastery === MasteryLevel.Expert
  );

  const linkMap = new Map<string, string[]>();
  links.forEach(link => {
    const sourceTargets = linkMap.get(link.source) || [];
    sourceTargets.push(link.target);
    linkMap.set(link.source, sourceTargets);

    const targetSources = linkMap.get(link.target) || [];
    targetSources.push(link.source);
    linkMap.set(link.target, targetSources);
  });

  const exploredIds = new Set<string>();

  masteredConcepts.slice(0, 2).forEach(concept => {
    const neighbors = (linkMap.get(concept.id) || [])
      .filter(id => {
        const neighbor = concepts.find(c => c.id === id);
        return neighbor && neighbor.mastery !== MasteryLevel.Expert;
      })
      .slice(0, 2);

    neighbors.forEach(neighborId => {
      if (exploredIds.has(neighborId)) return;
      exploredIds.add(neighborId);

      const neighbor = concepts.find(c => c.id === neighborId);
      if (!neighbor) return;

      const relationship = links.find(l =>
        (l.source === concept.id && l.target === neighborId) ||
        (l.target === concept.id && l.source === neighborId)
      )?.relationship || '相关';

      recommendations.push({
        id: `related-${neighbor.id}`,
        type: RecommendationType.RelatedTopics,
        title: `拓展：${neighbor.name}`,
        description: `基于你已掌握的${concept.name}，探索${relationship}内容`,
        reason: `你已经掌握了${concept.name}，可以顺势学习相关的${neighbor.name}。`,
        priority: 'low',
        estimatedTime: 15,
        concepts: [neighbor.id],
        prerequisiteConcepts: [concept.id],
        confidenceScore: 0.6,
        suggestedQuestions: [
          `${concept.name}与${neighbor.name}有什么关系？`,
          `如何从${concept.name}延伸到${neighbor.name}？`,
        ],
      });
    });
  });

  return recommendations.slice(0, Math.ceil(config.maxRecommendations / 2));
}

/**
 * 生成"今日复习"推荐
 */
function generateDueForReviewRecommendations(
  concepts: ConceptNode[],
  reviewCards: ReviewCard[],
  sessionId?: string,
  config: RecommendationConfig = DEFAULT_CONFIG
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 找出今日到期的卡片
  const dueCards = sessionId
    ? reviewCards.filter(c => c.sessionId === sessionId && isCardDue(c))
    : reviewCards.filter(isCardDue);

  if (dueCards.length === 0) {
    return [];
  }

  // 按优先级排序
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedCards = [...dueCards].sort((a, b) => {
    const aPriority = priorityWeight[a.priority];
    const bPriority = priorityWeight[b.priority];
    if (aPriority !== bPriority) return bPriority - aPriority;

    const aStrength = getMemoryStrength(a);
    const bStrength = getMemoryStrength(b);
    return aStrength - bStrength;
  });

  // 分组推荐（每次最多10张卡片）
  const batchSize = Math.min(sortedCards.length, 10);
  const batchCards = sortedCards.slice(0, batchSize);

  const weakCards = batchCards.filter(c => getMemoryStrength(c) < 40);
  const avgStrength = batchCards.reduce((sum, c) => sum + getMemoryStrength(c), 0) / batchCards.length;

  recommendations.push({
    id: `review-${Date.now()}`,
    type: RecommendationType.DueForReview,
    title: `今日复习：${batchCards.length}张卡片`,
    description: weakCards.length > 0
      ? `包含${weakCards.length}张记忆薄弱的卡片需要加强`
      : `保持记忆强度的定期复习`,
    reason: avgStrength < 50
      ? '检测到部分知识点记忆较弱，建议尽快复习'
      : '定期复习有助于长期记忆保持',
    priority: weakCards.length > 0 ? 'high' : 'medium',
    estimatedTime: batchSize * 2,
    concepts: [],
    confidenceScore: 0.95,
    relatedCards: batchCards.map(c => c.id),
  });

  return recommendations;
}

/**
 * 生成"休息建议"推荐
 */
function generateRestBreakRecommendations(
  preferences: LearningPreferences,
  config: RecommendationConfig
): Recommendation[] {
  if (!config.enableRestBreaks) {
    return [];
  }

  const recommendations: Recommendation[] = [];

  // 检测疲劳度
  if (preferences.fatigueLevel === 'high') {
    recommendations.push({
      id: `rest-${Date.now()}`,
      type: RecommendationType.RestBreak,
      title: '建议休息一下',
      description: '你已经学习较长时间，大脑需要休息来巩固记忆',
      reason: '根据学习科学，适当休息可以提高学习效率和记忆保持。建议休息10-15分钟，或换个活动放松一下。',
      priority: 'high',
      estimatedTime: 15,
      concepts: [],
      confidenceScore: 0.85,
    });
  } else if (preferences.fatigueLevel === 'medium') {
    recommendations.push({
      id: `rest-light-${Date.now()}`,
      type: RecommendationType.RestBreak,
      title: '可以稍作放松',
      description: '适度放松可以保持学习效率',
      reason: '你已经持续学习了一段时间，可以站起来走走，或喝杯水放松一下。',
      priority: 'low',
      estimatedTime: 5,
      concepts: [],
      confidenceScore: 0.6,
    });
  }

  return recommendations;
}

/**
 * 多样化推荐（避免单调）
 */
function diversifyRecommendations(
  recommendations: Recommendation[],
  diversityFactor: number
): Recommendation[] {
  if (recommendations.length <= 1) {
    return recommendations;
  }

  // 按类型分组
  const typeGroups = new Map<RecommendationType, Recommendation[]>();
  recommendations.forEach(r => {
    const group = typeGroups.get(r.type) || [];
    group.push(r);
    typeGroups.set(r.type, group);
  });

  // 轮询选择
  const diversified: Recommendation[] = [];
  const types = Array.from(typeGroups.keys());
  let typeIndex = 0;
  let round = 0;

  while (diversified.length < recommendations.length) {
    const currentType = types[typeIndex % types.length];
    const group = typeGroups.get(currentType) || [];

    if (group.length > round) {
      diversified.push(group[round]);
    }

    typeIndex++;

    // 如果遍历完所有类型且没有新项，结束
    if (typeIndex >= types.length && round >= Math.max(...Array.from(typeGroups.values()).map(g => g.length))) {
      break;
    }

    if (typeIndex >= types.length) {
      typeIndex = 0;
      round++;
    }
  }

  return diversified;
}

/**
 * 主推荐引擎
 */
export function generateRecommendations(
  concepts: ConceptNode[],
  links: ConceptLink[],
  reviewCards: ReviewCard[],
  sessionId: string | undefined,
  sessions: any[],
  config: Partial<RecommendationConfig> = {}
): Recommendation[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 分析知识图谱
  const graphAnalysis = analyzeKnowledgeGraph(concepts, links);

  // 分析用户偏好
  const preferences = analyzeLearningPreferences(sessions, reviewCards, sessionId);

  // 生成各类推荐
  let allRecommendations: Recommendation[] = [];

  // 1. 接下来应该学习
  if (concepts.length > 0) {
    allRecommendations.push(
      ...generateNextToLearnRecommendations(concepts, links, graphAnalysis, preferences, finalConfig)
    );
  }

  // 2. 薄弱知识点
  if (concepts.filter(c => c.mastery === MasteryLevel.Novice || c.mastery === MasteryLevel.Unknown).length > 0) {
    allRecommendations.push(
      ...generateWeakPointsRecommendations(concepts, links, reviewCards, preferences, finalConfig)
    );
  }

  // 3. 相关主题拓展
  if (concepts.length > 1 && links.length > 0) {
    allRecommendations.push(
      ...generateRelatedTopicsRecommendations(concepts, links, graphAnalysis, preferences, finalConfig)
    );
  }

  // 4. 今日复习
  allRecommendations.push(
    ...generateDueForReviewRecommendations(concepts, reviewCards, sessionId, finalConfig)
  );

  // 5. 休息建议
  allRecommendations.push(
    ...generateRestBreakRecommendations(preferences, finalConfig)
  );

  // 过滤低置信度推荐
  allRecommendations = allRecommendations.filter(
    r => r.confidenceScore >= finalConfig.minConfidenceThreshold
  );

  // 多样化
  if (finalConfig.diversityFactor > 0) {
    allRecommendations = diversifyRecommendations(allRecommendations, finalConfig.diversityFactor);
  }

  // 排序：优先级 > 置信度
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  allRecommendations.sort((a, b) => {
    const aPriority = priorityWeight[a.priority];
    const bPriority = priorityWeight[b.priority];
    if (aPriority !== bPriority) return bPriority - aPriority;
    return b.confidenceScore - a.confidenceScore;
  });

  // 限制数量
  return allRecommendations.slice(0, finalConfig.maxRecommendations);
}

/**
 * AI增强：生成个性化推荐理由
 * 可以调用AI API分析用户学习模式，生成更精准的推荐
 */
export async function generateAIEnhancedRecommendations(
  concepts: ConceptNode[],
  links: ConceptLink[],
  reviewCards: ReviewCard[],
  sessionId: string | undefined,
  sessions: any[],
  aiGenerateFn: (prompt: string) => Promise<string>
): Promise<Recommendation[]> {
  // 先获取基础推荐
  const baseRecommendations = generateRecommendations(
    concepts,
    links,
    reviewCards,
    sessionId,
    sessions
  );

  // 为每个推荐生成AI理由
  const enhancedRecommendations = await Promise.all(
    baseRecommendations.slice(0, 3).map(async (rec) => {
      const relatedConcepts = concepts.filter(c => rec.concepts.includes(c.id));
      const prompt = `基于以下学习数据，为这个学习推荐生成个性化的推荐理由（1-2句话）：

推荐标题：${rec.title}
推荐描述：${rec.description}
涉及概念：${relatedConcepts.map(c => c.name).join('、')}
用户掌握情况：${relatedConcepts.map(c => `${c.name}(${c.mastery})`).join('、')}

请用友好的语气，说明为什么这个推荐对用户当前的学习有帮助。要求：
1. 针对性强，基于用户当前掌握情况
2. 简洁明了，1-2句话即可
3. 鼓励性语言，激发学习动力

直接输出推荐理由文本，不要包含其他说明。`;

      try {
        const aiReason = await aiGenerateFn(prompt);
        return {
          ...rec,
          reason: aiReason || rec.reason,
        };
      } catch (error) {
        console.error('AI推荐理由生成失败:', error);
        return rec;
      }
    })
  );

  return enhancedRecommendations;
}

/**
 * 为推荐引擎生成AI分析的辅助函数
 * 分析用户学习模式并返回学习建议
 */
export async function analyzeLearningPatternWithAI(
  concepts: ConceptNode[],
  links: ConceptLink[],
  sessions: any[],
  aiGenerateFn: (prompt: string) => Promise<string>
): Promise<{
  summary: string;
  strongPoints: string[];
  weakPoints: string[];
  suggestions: string[];
}> {
  // 统计学习数据
  const conceptStats = {
    expert: concepts.filter(c => c.mastery === MasteryLevel.Expert).length,
    competent: concepts.filter(c => c.mastery === MasteryLevel.Competent).length,
    novice: concepts.filter(c => c.mastery === MasteryLevel.Novice).length,
    unknown: concepts.filter(c => c.mastery === MasteryLevel.Unknown).length,
    total: concepts.length,
  };

  const recentTopics = sessions.slice(-5).map(s => s.topic).filter(Boolean);

  const prompt = `作为智能学习助手，基于以下学习数据分析用户的学习模式：

**知识掌握情况：**
- 专家级：${conceptStats.expert} 个
- 熟练：${conceptStats.competent} 个
- 初学：${conceptStats.novice} 个
- 未接触：${conceptStats.unknown} 个
- 总计：${conceptStats.total} 个概念

**最近学习主题：**
${recentTopics.map((t, i) => `${i + 1}. ${t}`).join('\n') || '无'}

请分析并返回（JSON格式）：
{
  "summary": "整体学习状况总结（1句话）",
  "strongPoints": ["优势1", "优势2"],
  "weakPoints": ["待改进1", "待改进2"],
  "suggestions": ["建议1", "建议2", "建议3"]
}

要求：
1. 分析要具体，基于实际数据
2. 建议要可执行
3. 语气友好鼓励
4. 直接返回JSON，不要其他说明文字`;

  try {
    const response = await aiGenerateFn(prompt);
    const parsed = JSON.parse(response);

    return {
      summary: parsed.summary || '学习进展良好',
      strongPoints: parsed.strongPoints || [],
      weakPoints: parsed.weakPoints || [],
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    console.error('AI学习模式分析失败:', error);
    return {
      summary: '继续努力学习',
      strongPoints: [],
      weakPoints: [],
      suggestions: [],
    };
  }
}

/**
 * 导出推荐为学习计划
 */
export function exportRecommendationsAsPlan(recommendations: Recommendation[]): string {
  const plan = `# 个性化学习计划

生成时间：${new Date().toLocaleString()}

## 学习建议总览

${recommendations.map((rec, index) => `
### ${index + 1}. ${rec.title}

**类型**：${rec.type}
**优先级**：${rec.priority}
**预计用时**：${rec.estimatedTime || 10}分钟
**推荐理由**：${rec.reason}

${rec.suggestedQuestions && rec.suggestedQuestions.length > 0 ? `
**建议问题**：
${rec.suggestedQuestions.map(q => `- ${q}`).join('\n')}
` : ''}
`).join('\n---\n')}

## 执行建议

1. 按优先级从高到低执行
2. 每完成一项建议休息5分钟
3. 遇到困难及时调整，保持学习积极性

---

由 CogniGuide 智能学习系统生成
`;

  return plan;
}
