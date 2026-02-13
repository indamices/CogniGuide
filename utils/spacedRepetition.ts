/**
 * SuperMemo-2 间隔重复算法实现
 * 基于艾宾浩斯遗忘曲线的智能复习调度系统
 */

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

/**
 * 用户回答质量说明：
 * 5 - 完美记忆，毫不费力
 * 4 - 正确但稍有犹豫
 * 3 - 正确但很困难
 * 2 - 不正确，但看到答案后恍然大悟
 * 1 - 完全不记得
 */

/**
 * 计算 EF' (新的难度因子)
 * EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 * EF 最小值为 1.3
 */
export function calculateNewEaseFactor(
  currentEF: number,
  quality: QualityRating
): number {
  const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(1.3, newEF);
}

/**
 * 计算下次复习的间隔天数
 * I(1) = 1 (第一次复习间隔1天)
 * I(n) = I(n-1) * EF (后续复习间隔 = 上次间隔 * EF)
 *
 * 特殊规则：
 * - 如果评分 < 3，重置为复习次数为0，间隔为1天
 * - 如果评分 = 3，不增加复习次数，保持当前间隔
 */
export function calculateNextInterval(
  currentInterval: number,
  repetitions: number,
  quality: QualityRating,
  easeFactor: number
): { interval: number; repetitions: number } {
  // 评分低于3，重新开始学习
  if (quality < 3) {
    return { interval: 1, repetitions: 0 };
  }

  // 评分等于3，保持当前间隔
  if (quality === 3) {
    return { interval: currentInterval, repetitions };
  }

  // 评分4或5，增加间隔
  const newRepetitions = repetitions + 1;

  // 第一次成功复习：1天
  if (newRepetitions === 1) {
    return { interval: 1, repetitions: 1 };
  }

  // 第二次成功复习：6天
  if (newRepetitions === 2) {
    return { interval: 6, repetitions: 2 };
  }

  // 后续复习：I(n) = I(n-1) * EF
  const newInterval = Math.round(currentInterval * easeFactor);
  return { interval: newInterval, repetitions: newRepetitions };
}

/**
 * 处理卡片复习，更新所有参数
 */
export function processCardReview(
  card: ReviewCard,
  quality: QualityRating,
  timeTaken: number
): ReviewCard {
  const newEF = calculateNewEaseFactor(card.easeFactor, quality);
  const { interval: newInterval, repetitions: newRepetitions } =
    calculateNextInterval(card.interval, card.repetitions, quality, card.easeFactor);

  const now = Date.now();
  const nextReviewDate = now + newInterval * 24 * 60 * 60 * 1000;

  const reviewRecord: ReviewRecord = {
    date: now,
    quality,
    timeTaken
  };

  return {
    ...card,
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
    lastReviewDate: now,
    reviewHistory: [...card.reviewHistory, reviewRecord]
  };
}

/**
 * 创建新的复习卡片
 */
export function createCard(
  question: string,
  answer: string,
  sessionId: string,
  conceptId?: string,
  priority: 'low' | 'medium' | 'high' = 'medium',
  tags: string[] = []
): ReviewCard {
  const now = Date.now();

  return {
    id: `card-${now}-${Math.random().toString(36).substr(2, 9)}`,
    question,
    answer,
    sessionId,
    conceptId,
    easeFactor: 2.5, // 初始 EF
    interval: 0, // 新卡片，尚未复习
    repetitions: 0,
    nextReviewDate: now, // 立即可复习
    createdDate: now,
    priority,
    tags,
    reviewHistory: []
  };
}

/**
 * 检查卡片是否到期需要复习
 */
export function isCardDue(card: ReviewCard): boolean {
  return card.nextReviewDate <= Date.now();
}

/**
 * 计算距离下次复习的剩余时间（天/小时/分钟）
 */
export function getTimeUntilReview(card: ReviewCard): string {
  const now = Date.now();
  const diff = card.nextReviewDate - now;

  if (diff <= 0) {
    return '现在';
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days}天${hours}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

/**
 * 获取卡片记忆强度百分比（用于UI展示）
 * 基于 repetitions 和 easeFactor
 */
export function getMemoryStrength(card: ReviewCard): number {
  const baseStrength = Math.min(card.repetitions * 20, 60); // 最多60%
  const efBonus = (card.easeFactor - 1.3) / 1.2 * 40; // 最多40%
  return Math.round(baseStrength + efBonus);
}

/**
 * 智能排序复习卡片
 * 优先级：到期时间 > 优先级设置 > 记忆强度
 */
export function sortCardsByPriority(cards: ReviewCard[]): ReviewCard[] {
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  return [...cards].sort((a, b) => {
    // 首先按是否到期排序
    const aDue = isCardDue(a) ? 1 : 0;
    const bDue = isCardDue(b) ? 1 : 0;
    if (aDue !== bDue) return bDue - aDue;

    // 然后按优先级排序
    const aPriority = priorityWeight[a.priority];
    const bPriority = priorityWeight[b.priority];
    if (aPriority !== bPriority) return bPriority - aPriority;

    // 最后按记忆强度排序（弱的优先）
    const aStrength = getMemoryStrength(a);
    const bStrength = getMemoryStrength(b);
    return aStrength - bStrength;
  });
}

/**
 * 过滤需要复习的卡片
 */
export function getDueCards(cards: ReviewCard[]): ReviewCard[] {
  return cards.filter(isCardDue);
}

/**
 * 批量处理复习
 */
export function processBatchReview(
  cards: ReviewCard[],
  ratings: Array<{ cardId: string; quality: QualityRating; timeTaken: number }>
): ReviewCard[] {
  const ratingMap = new Map(ratings.map(r => [r.cardId, r]));

  return cards.map(card => {
    const rating = ratingMap.get(card.id);
    if (rating) {
      return processCardReview(card, rating.quality, rating.timeTaken);
    }
    return card;
  });
}

/**
 * 统计学习数据
 */
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

export function calculateStatistics(cards: ReviewCard[]): ReviewStatistics {
  const dueCards = getDueCards(cards);
  const today = Date.now();
  const oneDayAgo = today - 24 * 60 * 60 * 1000;

  // 今天复习的卡片
  const reviewedToday = cards.filter(card =>
    card.lastReviewDate && card.lastReviewDate > oneDayAgo
  ).length;

  // 平均质量
  const allQualities = cards.flatMap(card =>
    card.reviewHistory.map(r => r.quality)
  );
  const averageQuality = allQualities.length > 0
    ? allQualities.reduce((sum, q) => sum + q, 0) / allQualities.length
    : 0;

  // 平均EF
  const averageEaseFactor = cards.length > 0
    ? cards.reduce((sum, card) => sum + card.easeFactor, 0) / cards.length
    : 0;

  // 记忆强度分布
  const strengthDistribution = {
    weak: cards.filter(c => getMemoryStrength(c) <= 40).length,
    medium: cards.filter(c => getMemoryStrength(c) > 40 && getMemoryStrength(c) <= 70).length,
    strong: cards.filter(c => getMemoryStrength(c) > 70).length
  };

  return {
    totalCards: cards.length,
    dueCards: dueCards.length,
    reviewedToday,
    averageQuality: Math.round(averageQuality * 10) / 10,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
    memoryStrengthDistribution: strengthDistribution
  };
}

/**
 * 导出为 Anki 格式
 */
export interface AnkiCard {
  question: string;
  answer: string;
  tags: string[];
}

export function exportToAnki(cards: ReviewCard[]): AnkiCard[] {
  return cards.map(card => ({
    question: card.question,
    answer: card.answer,
    tags: card.tags
  }));
}

/**
 * 从 Anki 格式导入
 */
export function importFromAnki(
  ankiCards: AnkiCard[],
  sessionId: string
): ReviewCard[] {
  const now = Date.now();
  return ankiCards.map((ac, index) => ({
    id: `imported-${now}-${index}`,
    question: ac.question,
    answer: ac.answer,
    sessionId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: now,
    createdDate: now,
    priority: 'medium' as const,
    tags: ac.tags,
    reviewHistory: []
  }));
}

/**
 * 从 AI 回复中智能提取知识点
 * 使用启发式规则提取关键概念
 */
export function extractKeyConceptsFromAI(
  content: string,
  sessionId: string
): Array<{ question: string; answer: string; priority: 'low' | 'medium' | 'high'; tags: string[] }> {
  const concepts: Array<{ question: string; answer: string; priority: 'low' | 'medium' | 'high'; tags: string[] }> = [];

  // 分割成段落
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);

  // 检测定义模式（"X是..."、"X定义为..."等）
  const definitionPatterns = [
    /([^。！？\n]{2,20})是([^。！？\n]{10,200})。/g,
    /([^。！？\n]{2,20})定义为([^。！？\n]{10,200})。/g,
    /([^。！？\n]{2,20})：([^。！？\n]{10,200})/g
  ];

  paragraphs.forEach(paragraph => {
    definitionPatterns.forEach(pattern => {
      const matches = [...paragraph.matchAll(pattern)];
      matches.forEach(match => {
        const term = match[1].trim();
        const definition = match[2].trim();
        if (term.length > 1 && definition.length > 5) {
          concepts.push({
            question: `什么是${term}？`,
            answer: definition,
            priority: 'high',
            tags: ['定义']
          });
        }
      });
    });
  });

  // 检测列表模式（要点）
  const listPattern = /^\s*[-•]\s+([^。！？\n]{5,100})/gm;
  const listMatches = [...content.matchAll(listPattern)];
  listMatches.forEach(match => {
    const point = match[1].trim();
    if (point.length > 10) {
      concepts.push({
        question: `请简述：${point.substring(0, 30)}...`,
        answer: point,
        priority: 'medium',
        tags: ['要点']
      });
    }
  });

  // 去重并限制数量
  const uniqueConcepts = concepts.filter((concept, index, self) =>
    index === self.findIndex(c => c.question === concept.question)
  );

  return uniqueConcepts.slice(0, 5); // 最多提取5个概念
}
