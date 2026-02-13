import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import * as d3 from 'd3';
import { ConceptNode, ConceptLink, MasteryLevel } from '../types';
import { throttle } from '../utils/performance';

interface OptimizedKnowledgeMapProps {
  concepts: ConceptNode[];
  links: ConceptLink[];
}

/**
 * OptimizedKnowledgeMap - 优化版知识图谱组件
 * 使用React.memo、useCallback、useMemo、节流等优化性能
 */
const OptimizedKnowledgeMap: React.FC<OptimizedKnowledgeMapProps> = memo(({
  concepts,
  links
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 节流更新尺寸
  const updateDimensions = useCallback(
    throttle(() => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }, 200),
    []
  );

  // 使用useMemo缓存层次结构数据
  const hierarchyData = useMemo(() => {
    if (concepts.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return null;
    }

    // 1. 识别根节点（没有入链接的节点）
    const targets = new Set(links.map(l => l.target));
    const roots = concepts.filter(n => !targets.has(n.id));

    // 2. 构建邻接表
    const adjacency: Record<string, string[]> = {};
    links.forEach(l => {
      if (!adjacency[l.source]) adjacency[l.source] = [];
      adjacency[l.source].push(l.target);
    });

    // 3. 递归构建层次结构
    const buildHierarchy = (id: string, visited: Set<string>): any => {
      const node = concepts.find(n => n.id === id);
      if (!node && id !== 'virtual_root') return null;

      visited.add(id);
      const childrenIds = adjacency[id] || [];

      const children = childrenIds
        .filter(childId => !visited.has(childId))
        .map(childId => buildHierarchy(childId, visited))
        .filter(Boolean);

      return {
        name: node ? node.name : "知识根节点",
        mastery: node ? node.mastery : MasteryLevel.Expert,
        description: node ? node.description || "" : "",
        id: node ? node.id : id,
        isVirtual: !node,
        children: children.length > 0 ? children : undefined
      };
    };

    // 4. 处理多个根节点的情况
    if (roots.length > 1 || (roots.length === 0 && concepts.length > 0)) {
      const rootNodes = roots.length > 0 ? roots : [concepts[0]];
      adjacency['virtual_root'] = rootNodes.map(n => n.id);
      return buildHierarchy('virtual_root', new Set());
    } else if (roots.length === 1) {
      return buildHierarchy(roots[0].id, new Set());
    }

    return null;
  }, [concepts, links, dimensions]);

  // D3渲染逻辑 - 使用useCallback避免重复创建
  const renderGraph = useCallback(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0 || !hierarchyData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // 清除之前的渲染

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 40, right: 120, bottom: 40, left: 120 };

    const root = d3.hierarchy(hierarchyData);

    // 树形布局 - 横向布局
    const treeLayout = d3.tree()
      .nodeSize([80, 250])
      .separation((a, b) => {
        const siblings = a.parent?.children?.length || 1;
        const baseSeparation = siblings > 5 ? 1.5 : 1.2;
        return a.parent === b.parent ? baseSeparation : 1.5;
      });

    treeLayout(root);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${height / 2})`);

    // 计算树的实际尺寸
    let minY = Infinity, maxY = -Infinity;
    root.each((d: any) => {
      if (d.y < minY) minY = d.y;
      if (d.y > maxY) maxY = d.y;
    });
    const treeWidth = maxY - minY;
    const treeHeight = root.height * 80;

    // 居中树形图
    const xOffset = (width - margin.left - margin.right - treeWidth) / 2;
    const yOffset = (height - margin.top - margin.bottom - treeHeight) / 2;

    // 绘制链接
    g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5)
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y + xOffset)
        .y((d: any) => d.x + yOffset) as any
      );

    // 绘制节点
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y + xOffset},${d.x + yOffset})`)
      .style("cursor", "pointer");

    // 使用ForeignObject渲染HTML
    node.append("foreignObject")
      .attr("width", 200)
      .attr("height", 50)
      .attr("x", -100)
      .attr("y", -25)
      .html((d: any) => {
        if (d.data.isVirtual) {
          return `
            <div class="w-full h-full flex items-center justify-center">
              <div class="w-3 h-3 bg-slate-300 rounded-full"></div>
            </div>
          `;
        }

        const masteryColors: Record<string, { bg: string; text: string; border: string }> = {
          Expert: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
          Competent: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
          Novice: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
          Unknown: { bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-300" },
        };
        const colors = masteryColors[d.data.mastery] || masteryColors.Unknown;

        return `
          <div class="w-full h-full flex items-center justify-center px-2 py-1">
            <div class="${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 shadow-sm text-sm font-medium text-center whitespace-normal break-words leading-tight transition-all hover:scale-105 hover:shadow-md" title="${d.data.description || d.data.name}">
              ${d.data.name}
            </div>
          </div>
        `;
      });

    // 缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform as any);
      });

    svg.call(zoom as any);

    // 初始缩放和平移
    const initialScale = Math.min(
      (width - margin.left - margin.right) / treeWidth,
      (height - margin.top - margin.bottom) / treeHeight,
      1.0
    ) * 0.9;

    const initialX = (width - treeWidth * initialScale) / 2;
    const initialY = (height - treeHeight * initialScale) / 2;

    const initialTransform = d3.zoomIdentity
      .translate(initialX - margin.left, initialY - margin.top + height / 2)
      .scale(initialScale);

    svg.call(zoom.transform as any, initialTransform);
  }, [dimensions, hierarchyData]);

  // 更新尺寸
  useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // 渲染图谱
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  if (concepts.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200">
        <p>暂无知识图谱</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-lg overflow-hidden border border-slate-100 shadow-inner relative">
      <svg ref={svgRef} width="100%" height="100%" className="cursor-grab active:cursor-grabbing">
        {/* SVG 内容由 D3 动态生成 */}
      </svg>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200 z-10">
        <p className="text-xs font-semibold text-slate-700 mb-2">掌握程度</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" aria-hidden="true"></div>
            <span className="text-xs text-slate-600">专家</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" aria-hidden="true"></div>
            <span className="text-xs text-slate-600">熟练</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" aria-hidden="true"></div>
            <span className="text-xs text-slate-600">新手</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400" aria-hidden="true"></div>
            <span className="text-xs text-slate-600">未知</span>
          </div>
        </div>
      </div>

      {/* 缩放提示 */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-slate-200 z-10">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">💡 提示：</span> 鼠标滚轮缩放，拖拽平移
        </p>
      </div>
    </div>
  );
});

OptimizedKnowledgeMap.displayName = 'OptimizedKnowledgeMap';

export default OptimizedKnowledgeMap;
