/**
 * Graph Layout Algorithms
 *
 * This module provides various layout algorithms for knowledge graph visualization.
 * These can be used with both 2D and 3D graph visualizations.
 */

import { ConceptNode, ConceptLink } from '../types';

export interface LayoutNode extends ConceptNode {
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

export interface LayoutLink {
  source: string | LayoutNode;
  target: string | LayoutNode;
  relationship: string;
}

export interface LayoutConfig {
  width: number;
  height: number;
  depth?: number;
  center?: { x: number; y: number; z?: number };
}

/**
 * Force-directed layout configuration
 */
export interface ForceLayoutConfig extends LayoutConfig {
  // Node attraction/repulsion
  nodeCharge?: number;
  linkDistance?: number | ((link: LayoutLink) => number);
  linkStrength?: number | ((link: LayoutLink) => number);

  // Collision detection
  collideRadius?: number | ((node: LayoutNode) => number);
  collideStrength?: number;

  // Centering force
  centerStrength?: number;

  // Iterations
  iterations?: number;
  alphaDecay?: number;
  velocityDecay?: number;
}

/**
 * Hierarchical layout configuration
 */
export interface HierarchicalLayoutConfig extends LayoutConfig {
  nodeSize?: [number, number, number]; // [width, height, depth]
  separation?: (a: any, b: any) => number;
  direction?: 'horizontal' | 'vertical' | 'radial';
}

/**
 * Community detection result
 */
export interface Community {
  id: string;
  nodes: string[];
  color: string;
}

/**
 * Calculate default force-directed layout
 */
export function calculateForceLayout(
  nodes: ConceptNode[],
  links: ConceptLink[],
  config: ForceLayoutConfig
): { nodes: LayoutNode[]; links: LayoutLink[] } {
  const {
    width,
    height,
    depth = 300,
    nodeCharge = -100,
    linkDistance = 100,
    linkStrength = 0.1,
    collideRadius = 30,
    collideStrength = 0.7,
    centerStrength = 0.1,
    iterations = 300,
    alphaDecay = 0.028,
    velocityDecay = 0.4
  } = config;

  // Helper to get numeric values from potentially function parameters
  const getDistanceValue = (link: LayoutLink) => typeof linkDistance === 'function' ? (linkDistance as (l: LayoutLink) => number)(link) : linkDistance;
  const getStrengthValue = (link: LayoutLink) => typeof linkStrength === 'function' ? (linkStrength as (l: LayoutLink) => number)(link) : linkStrength;
  const getRadiusValue = (node: LayoutNode) => typeof collideRadius === 'function' ? (collideRadius as (n: LayoutNode) => number)(node) : collideRadius;

  const layoutNodes: LayoutNode[] = nodes.map(node => ({
    ...node,
    x: (Math.random() - 0.5) * width,
    y: (Math.random() - 0.5) * height,
    z: (Math.random() - 0.5) * depth,
    vx: 0,
    vy: 0,
    vz: 0
  }));

  const layoutLinks: LayoutLink[] = links.map(link => ({
    ...link,
    source: link.source,
    target: link.target
  }));

  // Simple force simulation (for custom implementations)
  let alpha = 1;
  for (let i = 0; i < iterations && alpha > 0.001; i++) {
    // Apply forces
    applyForces(layoutNodes, layoutLinks, {
      nodeCharge,
      linkDistance,
      linkStrength,
      collideRadius,
      collideStrength,
      centerStrength,
      alpha
    });

    // Update positions
    layoutNodes.forEach(node => {
      if (node.fx === null && node.vx !== undefined) node.vx *= velocityDecay;
      if (node.fy === null && node.vy !== undefined) node.vy *= velocityDecay;
      if (node.fz === null && node.vz !== undefined) node.vz *= velocityDecay;

      if (node.fx === null) node.x! += (node.vx || 0);
      if (node.fy === null) node.y! += (node.vy || 0);
      if (node.fz === null) node.z! += (node.vz || 0);
    });

    alpha *= (1 - alphaDecay);
  }

  return { nodes: layoutNodes, links: layoutLinks };
}

/**
 * Apply force-directed forces
 */
function applyForces(
  nodes: LayoutNode[],
  links: LayoutLink[],
  params: {
    nodeCharge: number;
    linkDistance: number | ((link: LayoutLink) => number);
    linkStrength: number | ((link: LayoutLink) => number);
    collideRadius: number | ((node: LayoutNode) => number);
    collideStrength: number;
    centerStrength: number;
    alpha: number;
  }
): void {
  const { nodeCharge, linkDistance, linkStrength, collideRadius, collideStrength, centerStrength, alpha } = params;

  // Helper functions to get numeric values from potentially function parameters
  const getDistanceValue = (link: LayoutLink) => typeof linkDistance === 'function' ? (linkDistance as (l: LayoutLink) => number)(link) : linkDistance;
  const getStrengthValue = (link: LayoutLink) => typeof linkStrength === 'function' ? (linkStrength as (l: LayoutLink) => number)(link) : linkStrength;
  const getRadiusValue = (node: LayoutNode) => typeof collideRadius === 'function' ? (collideRadius as (n: LayoutNode) => number)(node) : collideRadius;

  // Node charge (repulsion)
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = a.x! - b.x!;
      const dy = a.y! - b.y!;
      const dz = a.z! - b.z!;
      let dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const force = (nodeCharge * alpha) / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;

      if (a.fx === null) {
        a.vx = (a.vx || 0) + fx;
        a.vy = (a.vy || 0) + fy;
        a.vz = (a.vz || 0) + fz;
      }
      if (b.fx === null) {
        b.vx = (b.vx || 0) - fx;
        b.vy = (b.vy || 0) - fy;
        b.vz = (b.vz || 0) - fz;
      }
    }
  }

  // Link force (attraction)
  links.forEach(link => {
    const source = typeof link.source === 'string' ? nodes.find(n => n.id === link.source) : link.source;
    const target = typeof link.target === 'string' ? nodes.find(n => n.id === link.target) : link.target;
    if (!source || !target) return;

    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    const dz = target.z! - source.z!;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    // Use numeric values
    const distVal = getDistanceValue(link);
    const strengthVal = getStrengthValue(link);
    const force = ((dist - distVal) * strengthVal * alpha) / dist;

    const fx = dx * force;
    const fy = dy * force;
    const fz = dz * force;

    if (source.fx === null) { source.vx = (source.vx || 0) + fx; source.vy = (source.vy || 0) + fy; source.vz = (source.vz || 0) + fz; }
    if (target.fx === null) { target.vx = (target.vx || 0) - fx; target.vy = (target.vy || 0) - fy; target.vz = (target.vz || 0) - fz; }
  });

  // Centering force
  nodes.forEach(node => {
    if (node.fx === null) {
      node.vx = (node.vx || 0) - node.x! * centerStrength * alpha;
      node.vy = (node.vy || 0) - node.y! * centerStrength * alpha;
      node.vz = (node.vz || 0) - node.z! * centerStrength * alpha;
    }
  });
}

/**
 * Calculate hierarchical tree layout
 */
export function calculateHierarchicalLayout(
  nodes: ConceptNode[],
  links: ConceptLink[],
  config: HierarchicalLayoutConfig
): { nodes: LayoutNode[]; links: LayoutLink[] } {
  const {
    width,
    height,
    depth = 300,
    nodeSize = [100, 80, 50],
    separation = () => 1,
    direction = 'horizontal'
  } = config;

  // Build adjacency list
  const adjacency: Record<string, string[]> = {};
  links.forEach(link => {
    if (!adjacency[link.source]) adjacency[link.source] = [];
    adjacency[link.source].push(link.target);
  });

  // Find roots (nodes with no incoming links)
  const targets = new Set(links.map(l => l.target));
  const roots = nodes.filter(n => !targets.has(n.id));

  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]);
  }

  // Build hierarchy
  const buildTree = (nodeId: string, depth: number, visited: Set<string>): any => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const children = (adjacency[nodeId] || [])
      .map(childId => buildTree(childId, depth + 1, visited))
      .filter(Boolean);

    return {
      ...node,
      depth,
      children: children.length > 0 ? children : undefined
    };
  };

  // Position nodes
  const layoutNodes: LayoutNode[] = [];
  const layoutLinks: LayoutLink[] = links.map(link => ({ ...link, source: link.source, target: link.target }));

  let positionIndex = 0;
  const positionNode = (treeNode: any, x: number, y: number, z: number) => {
    if (!treeNode) return;

    layoutNodes.push({
      ...treeNode,
      x: direction === 'horizontal' ? y : x,
      y: direction === 'vertical' ? y : x,
      z: z
    });

    const children = treeNode.children || [];
    const totalHeight = children.length * nodeSize[1];
    let startY = y - totalHeight / 2;

    children.forEach((child: any, index: number) => {
      positionNode(
        child,
        x + nodeSize[0],
        startY + index * nodeSize[1],
        z
      );
    });
  };

  // Position all trees
  roots.forEach((root, index) => {
    const rootTree = buildTree(root.id, 0, new Set());
    if (rootTree) {
      positionNode(rootTree, 0, index * 200, 0);
    }
  });

  return { nodes: layoutNodes, links: layoutLinks };
}

/**
 * Detect communities using label propagation
 */
export function detectCommunities(
  nodes: ConceptNode[],
  links: ConceptLink[],
  maxIterations: number = 100
): Community[] {
  // Initialize: each node is its own community
  const nodeCommunities = new Map<string, string>();
  nodes.forEach(node => nodeCommunities.set(node.id, node.id));

  // Build adjacency
  const adjacency: Record<string, string[]> = {};
  links.forEach(link => {
    if (!adjacency[link.source]) adjacency[link.source] = [];
    if (!adjacency[link.target]) adjacency[link.target] = [];
    adjacency[link.source].push(link.target);
    adjacency[link.target].push(link.source);
  });

  // Label propagation
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    nodes.forEach(node => {
      const neighbors = adjacency[node.id] || [];
      if (neighbors.length === 0) return;

      // Count neighbor labels
      const labelCounts = new Map<string, number>();
      neighbors.forEach(neighborId => {
        const label = nodeCommunities.get(neighborId) || neighborId;
        labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
      });

      // Find most common label
      let maxCount = 0;
      let newLabel = nodeCommunities.get(node.id)!;
      labelCounts.forEach((count, label) => {
        if (count > maxCount || (count === maxCount && label < newLabel)) {
          maxCount = count;
          newLabel = label;
        }
      });

      if (newLabel !== nodeCommunities.get(node.id)) {
        nodeCommunities.set(node.id, newLabel);
        changed = true;
      }
    });

    if (!changed) break;
  }

  // Group communities
  const communityGroups = new Map<string, string[]>();
  nodeCommunities.forEach((communityId, nodeId) => {
    if (!communityGroups.has(communityId)) {
      communityGroups.set(communityId, []);
    }
    communityGroups.get(communityId)!.push(nodeId);
  });

  // Generate colors
  const colors = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  return Array.from(communityGroups.entries()).map(([id, nodes], index) => ({
    id,
    nodes,
    color: colors[index % colors.length]
  }));
}

/**
 * Calculate path between two nodes
 */
export function findPath(
  startId: string,
  endId: string,
  links: ConceptLink[]
): string[] | null {
  // BFS to find shortest path
  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === endId) {
      // Reconstruct path
      const path: string[] = [endId];
      let node = endId;
      while (node !== startId) {
        node = parent.get(node)!;
        path.unshift(node);
      }
      return path;
    }

    // Find neighbors
    links.forEach(link => {
      let neighbor: string | null = null;
      if (link.source === current) neighbor = link.target;
      if (link.target === current) neighbor = link.source;

      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    });
  }

  return null; // No path found
}

/**
 * Filter nodes by mastery level
 */
export function filterByMastery(
  nodes: ConceptNode[],
  minMastery: string
): ConceptNode[] {
  const masteryOrder = ['Unknown', 'Novice', 'Competent', 'Expert'];
  const minIndex = masteryOrder.indexOf(minMastery);

  return nodes.filter(node => {
    const index = masteryOrder.indexOf(node.mastery);
    return index >= minIndex;
  });
}

/**
 * Get subgraph around a node (neighbors within distance)
 */
export function getSubgraph(
  nodeId: string,
  nodes: ConceptNode[],
  links: ConceptLink[],
  maxDepth: number = 2
): { nodes: ConceptNode[]; links: ConceptLink[] } {
  const visitedNodes = new Set<string>([nodeId]);
  const visitedLinks = new Set<string>();
  const currentLevel = new Set<string>([nodeId]);

  for (let depth = 0; depth < maxDepth; depth++) {
    const nextLevel = new Set<string>();

    currentLevel.forEach(currentId => {
      links.forEach(link => {
        let neighbor: string | null = null;
        if (link.source === currentId) neighbor = link.target;
        if (link.target === currentId) neighbor = link.source;

        if (neighbor && !visitedNodes.has(neighbor)) {
          visitedNodes.add(neighbor);
          nextLevel.add(neighbor);
        }

        if (link.source === currentId || link.target === currentId) {
          visitedLinks.add(`${link.source}-${link.target}`);
        }
      });
    });

    currentLevel.clear();
    nextLevel.forEach(id => currentLevel.add(id));
  }

  return {
    nodes: nodes.filter(n => visitedNodes.has(n.id)),
    links: links.filter(l => visitedLinks.has(`${l.source}-${l.target}`))
  };
}
