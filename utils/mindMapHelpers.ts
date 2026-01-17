import { ConceptNode, ConceptLink } from '../types';

/**
 * 标准化概念名称（用于相似度检测）
 * - 移除空格、标点符号
 * - 转为小写
 * - 移除常见修饰词
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\-_\.，。、；：]/g, '') // 移除空格、横线、下划线、点、中文标点
    .replace(/^(的|是|和|与|或|及)$/g, '') // 移除常见修饰词
    .trim();
}

/**
 * 计算两个名称的相似度（0-1之间）
 * 使用简单的字符匹配和编辑距离
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  // 修复：明确处理空字符串情况
  if (norm1.length === 0 && norm2.length === 0) return 1.0; // 两个空字符串相似度为1
  if (norm1.length === 0 || norm2.length === 0) return 0; // 一个为空，一个不为空，相似度为0
  
  if (norm1 === norm2) return 1.0;
  
  // 如果其中一个完全包含另一个，相似度较高
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const shorter = Math.min(norm1.length, norm2.length);
    const longer = Math.max(norm1.length, norm2.length);
    return shorter / longer;
  }
  
  // 计算共同字符的比例
  const set1 = new Set(norm1.split(''));
  const set2 = new Set(norm2.split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * 智能合并概念
 * - 通过ID精确匹配（保留原有逻辑）
 * - 通过名称相似度检测重复概念（新增）
 * - 避免重复添加相同概念
 */
export function mergeConceptsSmart(
  existing: ConceptNode[], 
  incoming: ConceptNode[]
): ConceptNode[] {
  // 1. 通过ID精确匹配（保留原有逻辑）
  const conceptMap = new Map<string, ConceptNode>();
  existing.forEach(c => conceptMap.set(c.id, c));
  
  // 2. 通过名称相似度检测重复（新增）
  const nameMap = new Map<string, ConceptNode>();
  existing.forEach(c => {
    const normalizedName = normalizeName(c.name);
    if (!nameMap.has(normalizedName)) {
      nameMap.set(normalizedName, c);
    }
  });
  
  // 3. 处理新概念
  incoming.forEach(newC => {
    // 精确ID匹配
    if (conceptMap.has(newC.id)) {
      const existing = conceptMap.get(newC.id)!;
      conceptMap.set(newC.id, { 
        ...existing, 
        ...newC,
        // 确保关键字段不为空
        name: newC.name || existing.name,
        mastery: newC.mastery || existing.mastery,
        description: newC.description || existing.description
      });
      return;
    }
    
    // 名称相似度检测（避免重复）
    const normalizedName = normalizeName(newC.name);
    if (nameMap.has(normalizedName)) {
      // 相同概念，更新但不重复添加
      const existing = nameMap.get(normalizedName)!;
      conceptMap.set(existing.id, { 
        ...existing, 
        ...newC, 
        id: existing.id, // 保持原有ID
        name: newC.name || existing.name,
        mastery: newC.mastery || existing.mastery,
        description: newC.description || existing.description
      });
      return;
    }
    
    // 检查是否有高度相似的概念（相似度 > 0.8）
    let foundSimilar = false;
    for (const [normName, existingC] of nameMap.entries()) {
      const similarity = calculateNameSimilarity(newC.name, existingC.name);
      if (similarity > 0.8) {
        // 高度相似，合并到现有概念
        conceptMap.set(existingC.id, {
          ...existingC,
          ...newC,
          id: existingC.id, // 保持原有ID
          name: newC.name || existingC.name,
          mastery: newC.mastery || existingC.mastery,
          description: newC.description || existingC.description
        });
        foundSimilar = true;
        break;
      }
    }
    
    if (!foundSimilar) {
      // 全新概念，添加
      conceptMap.set(newC.id, newC);
      nameMap.set(normalizedName, newC);
    }
  });
  
  return Array.from(conceptMap.values());
}

/**
 * 智能合并链接
 * - 基于合并后的概念列表重建链接
 * - 过滤无效链接（指向不存在的节点）
 * - 去重（检查相同的source-target对）
 */
export function mergeLinksSmart(
  existingLinks: ConceptLink[], 
  incomingLinks: ConceptLink[],
  mergedConcepts: ConceptNode[]
): ConceptLink[] {
  const conceptIds = new Set(mergedConcepts.map(c => c.id));
  const linkSet = new Set<string>();
  
  // 添加现有链接（过滤无效链接）
  const validLinks: ConceptLink[] = [];
  existingLinks.forEach(link => {
    if (conceptIds.has(link.source) && conceptIds.has(link.target)) {
      const linkKey = `${link.source}->${link.target}`;
      if (!linkSet.has(linkKey)) {
        linkSet.add(linkKey);
        validLinks.push(link);
      }
    }
  });
  
  // 添加新链接（过滤重复和无效链接）
  incomingLinks.forEach(link => {
    if (conceptIds.has(link.source) && conceptIds.has(link.target)) {
      const linkKey = `${link.source}->${link.target}`;
      if (!linkSet.has(linkKey)) {
        linkSet.add(linkKey);
        validLinks.push(link);
      }
    }
  });
  
  return validLinks;
}

/**
 * 验证树形结构
 * - 检查是否有循环引用
 * - 检查所有链接的source和target是否都存在
 * - 返回true如果结构有效
 */
export function validateTreeStructure(
  concepts: ConceptNode[], 
  links: ConceptLink[]
): boolean {
  const conceptIds = new Set(concepts.map(c => c.id));
  
  // 检查所有链接的节点是否都存在
  for (const link of links) {
    if (!conceptIds.has(link.source) || !conceptIds.has(link.target)) {
      console.warn('Invalid link: node not found', link);
      return false;
    }
  }
  
  // 检查循环（使用DFS）
  // 修复：即使没有根节点（如双向链接），也要检查所有节点的循环
  const visited = new Set<string>();
  
  const hasCycle = (nodeId: string, recStack: Set<string>): boolean => {
    if (recStack.has(nodeId)) {
      return true; // 发现循环
    }
    if (visited.has(nodeId)) {
      return false; // 已访问过，但不是当前路径的循环
    }
    
    visited.add(nodeId);
    recStack.add(nodeId);
    
    const children = links
      .filter(l => l.source === nodeId)
      .map(l => l.target);
    
    for (const childId of children) {
      if (hasCycle(childId, recStack)) {
        return true;
      }
    }
    
    recStack.delete(nodeId);
    return false;
  };
  
  // 检查所有根节点（没有父节点的节点）
  const targets = new Set(links.map(l => l.target));
  const roots = concepts.filter(c => !targets.has(c.id));
  
  // 如果有根节点，从根节点开始检查
  if (roots.length > 0) {
    for (const root of roots) {
      const recStack = new Set<string>();
      if (hasCycle(root.id, recStack)) {
        console.warn('Cycle detected in tree structure starting from root:', root.id);
        return false;
      }
    }
  } else {
    // 如果没有根节点（可能是循环结构），检查所有节点
    // 修复：双向链接和循环结构都会被检测
    for (const concept of concepts) {
      if (!visited.has(concept.id)) {
        const recStack = new Set<string>();
        if (hasCycle(concept.id, recStack)) {
          console.warn('Cycle detected in tree structure (no root nodes):', concept.id);
          return false;
        }
      }
    }
    
    // 如果没有根节点，但有点和链接，可能是问题（但不算错误）
    if (concepts.length > 0 && links.length > 0) {
      console.warn('No root nodes found, but nodes and links exist. This might indicate a cycle or disconnected components.');
    }
  }
  
  return true;
}

/**
 * 进化式重构树结构：基于所有概念重新组织，而非简单合并
 * 允许概念移动、类别重组、层级调整
 */
export function evolveTreeStructure(
  allConcepts: ConceptNode[],
  allLinks: ConceptLink[],
  newConcepts: ConceptNode[],
  newLinks: ConceptLink[]
): { concepts: ConceptNode[]; links: ConceptLink[] } {
  
  // 1. 合并所有概念（去重和相似度合并）
  const mergedConcepts = mergeConceptsSmart(
    allConcepts,
    newConcepts
  );

  // 2. 合并所有链接（去重，但保留多个链接以便后续重组）
  const allLinksCombined = [...allLinks, ...newLinks];
  const conceptIds = new Set(mergedConcepts.map(c => c.id));
  
  // 3. 构建父节点映射（一个节点可能有多个父节点候选，需要选择最优的）
  const parentCandidates = new Map<string, Array<{ parentId: string; relationship: string }>>();
  
  allLinksCombined.forEach(link => {
    if (conceptIds.has(link.source) && conceptIds.has(link.target)) {
      if (!parentCandidates.has(link.target)) {
        parentCandidates.set(link.target, []);
      }
      parentCandidates.get(link.target)!.push({
        parentId: link.source,
        relationship: link.relationship
      });
    }
  });

  // 4. 为每个节点选择最优父节点（单一父节点规则）
  // 策略：优先选择层级更高的父节点，或关系更明确的
  const finalLinks: ConceptLink[] = [];
  
  // 先处理没有父节点的节点（根节点候选）
  mergedConcepts.forEach(concept => {
    const candidates = parentCandidates.get(concept.id);
    if (!candidates || candidates.length === 0) {
      // 可能是根节点，暂时不处理
      return;
    }
    
    // 选择第一个候选作为父节点（AI应该已经返回最优结构）
    // 如果有多个，选择关系最明确的（包含"属于"、"包含"等关键词的）
    const bestCandidate = candidates.sort((a, b) => {
      const aScore = a.relationship.includes('属于') || a.relationship.includes('包含') ? 1 : 0;
      const bScore = b.relationship.includes('属于') || b.relationship.includes('包含') ? 1 : 0;
      return bScore - aScore;
    })[0];
    
    finalLinks.push({
      source: bestCandidate.parentId,
      target: concept.id,
      relationship: bestCandidate.relationship
    });
  });

  // 5. 强制应用树结构规则：单一父节点、无循环
  return enforceTreeStructure(mergedConcepts, finalLinks);
}

/**
 * 强制树结构：确保每个节点只有一个父节点，无循环
 */
export function enforceTreeStructure(
  concepts: ConceptNode[],
  links: ConceptLink[]
): { concepts: ConceptNode[]; links: ConceptLink[] } {
  const conceptIds = new Set(concepts.map(c => c.id));
  
  // 1. 过滤无效链接
  const validLinks = links.filter(
    link => conceptIds.has(link.source) && conceptIds.has(link.target)
  );

  // 2. 为每个节点只保留一个父节点（保留第一个遇到的）
  const parentMap = new Map<string, string>();
  const finalLinks: ConceptLink[] = [];
  const linkMap = new Map<string, ConceptLink>();

  validLinks.forEach(link => {
    if (!parentMap.has(link.target)) {
      parentMap.set(link.target, link.source);
      linkMap.set(link.target, link);
      finalLinks.push(link);
    } else {
      // 节点已有父节点，忽略此链接
      console.warn(`Removing duplicate parent for ${link.target}: keeping ${parentMap.get(link.target)}, ignoring ${link.source}`);
    }
  });

  // 3. 检查循环并移除
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const linksToRemove = new Set<string>();

  const detectCycle = (nodeId: string): boolean => {
    if (recStack.has(nodeId)) {
      // 发现循环，标记需要移除的链接
      const parentId = parentMap.get(nodeId);
      if (parentId) {
        linksToRemove.add(`${parentId}->${nodeId}`);
      }
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recStack.add(nodeId);

    const parentId = parentMap.get(nodeId);
    if (parentId) {
      if (detectCycle(parentId)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  };

  // 从所有节点检查循环
  concepts.forEach(c => {
    if (!visited.has(c.id)) {
      detectCycle(c.id);
    }
  });

  // 移除导致循环的链接
  const finalValidLinks = finalLinks.filter(link => {
    return !linksToRemove.has(`${link.source}->${link.target}`);
  });

  // 4. 确保至少有一个根节点
  const targets = new Set(finalValidLinks.map(l => l.target));
  const roots = concepts.filter(c => !targets.has(c.id));

  if (roots.length === 0 && concepts.length > 0) {
    // 没有根节点（可能是循环结构被全部移除），选择第一个概念作为根
    console.warn('No root nodes after cycle removal, structure may be disconnected');
  }

  return {
    concepts,
    links: finalValidLinks
  };
}

/**
 * 简化树结构：如果树太深，尝试压缩层级
 */
export function simplifyTreeStructure(
  concepts: ConceptNode[],
  links: ConceptLink[],
  maxDepth: number = 4
): { concepts: ConceptNode[]; links: ConceptLink[] } {
  // 计算每个节点的深度
  const depthMap = new Map<string, number>();
  const parentMap = new Map<string, string>();
  
  links.forEach(link => {
    parentMap.set(link.target, link.source);
  });

  const computeDepth = (nodeId: string): number => {
    if (depthMap.has(nodeId)) {
      return depthMap.get(nodeId)!;
    }
    const parentId = parentMap.get(nodeId);
    if (!parentId) {
      depthMap.set(nodeId, 0);
      return 0;
    }
    const depth = computeDepth(parentId) + 1;
    depthMap.set(nodeId, depth);
    return depth;
  };

  concepts.forEach(c => computeDepth(c.id));

  // 如果所有节点深度都在限制内，直接返回
  const maxCurrentDepth = Math.max(...Array.from(depthMap.values()), 0);
  if (maxCurrentDepth <= maxDepth) {
    return { concepts, links };
  }

  // 如果超过深度限制，将深层节点提升（简化树结构）
  // 这里可以添加自动压缩逻辑，但为了保持AI的控制权，我们先只做警告
  console.warn(`Tree depth ${maxCurrentDepth} exceeds maximum ${maxDepth}, consider simplifying structure`);

  return { concepts, links };
}
