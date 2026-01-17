import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ConceptNode, ConceptLink, MasteryLevel } from '../types';

interface KnowledgeMapProps {
  concepts: ConceptNode[];
  links: ConceptLink[];
}

/**
 * KnowledgeMap - 力导向布局的知识图谱组件
 * 使用 D3 的力导向布局算法，自动优化节点位置，避免重叠和连接线交叉
 */
const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ concepts, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const simulationRef = useRef<d3.Simulation<ConceptNode & d3.SimulationNodeDatum, ConceptLink> | null>(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0 || concepts.length === 0) return;

    // 清理之前的模拟
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 20, right: 20, bottom: 80, left: 20 };

    const adjustedWidth = width - margin.left - margin.right;
    const adjustedHeight = height - margin.top - margin.bottom;

    // 创建力导向模拟
    const simulation = d3.forceSimulation<ConceptNode & d3.SimulationNodeDatum>(concepts)
      .force("link", d3.forceLink<ConceptNode & d3.SimulationNodeDatum, ConceptLink>(links)
        .id((d: ConceptNode) => d.id)
        .distance((d: any) => {
          // 根据掌握程度调整连接距离
          const source = d.source as ConceptNode;
          const target = d.target as ConceptNode;
          let baseDistance = 150;
          
          // 如果节点掌握程度高，距离可以更近
          if (source.mastery === MasteryLevel.Expert || target.mastery === MasteryLevel.Expert) {
            baseDistance = 120;
          }
          
          return baseDistance;
        })
        .strength(0.5) // 连接强度
      )
      .force("charge", d3.forceManyBody()
        .strength((d: any) => {
          // 根据节点掌握程度调整排斥力
          const node = d as ConceptNode;
          switch (node.mastery) {
            case MasteryLevel.Expert:
              return -800; // 专家节点排斥力更强，占据更多空间
            case MasteryLevel.Competent:
              return -600;
            case MasteryLevel.Novice:
              return -400;
            default:
              return -500;
          }
        })
      )
      .force("center", d3.forceCenter(adjustedWidth / 2, adjustedHeight / 2))
      .force("collision", d3.forceCollide()
        .radius((d: any) => {
          // 根据节点名称长度调整碰撞半径
          const node = d as ConceptNode;
          const nameLength = node.name.length;
          return Math.max(60, nameLength * 5); // 最小60px，根据文字长度增加
        })
        .strength(0.8)
      );

    // 识别根节点（没有入边的节点）
    const rootNodes = concepts.filter(node => 
      !links.some(link => link.target === node.id)
    );
    
    // 如果有根节点，添加径向力，让根节点靠近中心
    if (rootNodes.length > 0 && rootNodes.length <= 3) {
      const radialForce = d3.forceRadial<ConceptNode & d3.SimulationNodeDatum>(
        (d: ConceptNode) => {
          // 根节点更靠近中心
          if (rootNodes.some(r => r.id === d.id)) {
            return Math.min(adjustedWidth, adjustedHeight) * 0.15;
          }
          return Math.min(adjustedWidth, adjustedHeight) * 0.35;
        },
        adjustedWidth / 2,
        adjustedHeight / 2
      );
      radialForce.strength(0.15); // 较弱的径向力，不强制
      simulation.force("radial", radialForce);
    }

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 添加箭头标记定义
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "#94a3b8")
      .attr("opacity", 0.4);

    // 绘制连接线（使用曲线路径）
    const link = g.append("g")
      .attr("class", "links")
      .selectAll<SVGPathElement, ConceptLink>("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.4)
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)");

    // 绘制节点组
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, ConceptNode>("g")
      .data(concepts)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, ConceptNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // 节点背景圆（用于更好的视觉层次）
    node.append("circle")
      .attr("r", (d) => {
        const nameLength = d.name.length;
        return Math.max(25, nameLength * 3);
      })
      .attr("fill", (d) => {
        switch (d.mastery) {
          case MasteryLevel.Expert:
            return "#10b981";
          case MasteryLevel.Competent:
            return "#6366f1";
          case MasteryLevel.Novice:
            return "#f59e0b";
          default:
            return "#94a3b8";
        }
      })
      .attr("fill-opacity", 0.2)
      .attr("stroke", (d) => {
        switch (d.mastery) {
          case MasteryLevel.Expert:
            return "#10b981";
          case MasteryLevel.Competent:
            return "#6366f1";
          case MasteryLevel.Novice:
            return "#f59e0b";
          default:
            return "#94a3b8";
        }
      })
      .attr("stroke-width", 2);

    // 节点文本（使用 ForeignObject 支持 HTML）
    node.append("foreignObject")
      .attr("width", (d) => Math.max(100, d.name.length * 7))
      .attr("height", 45)
      .attr("x", (d) => -Math.max(50, d.name.length * 3.5))
      .attr("y", -22.5)
      .html((d) => {
        const masteryColors: Record<string, { bg: string; text: string; border: string }> = {
          Expert: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
          Competent: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
          Novice: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
          Unknown: { bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-300" },
        };
        const colors = masteryColors[d.mastery] || masteryColors.Unknown;

        return `
          <div class="w-full h-full flex items-center justify-center px-1 py-0.5">
            <div class="${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-2 py-1 shadow-sm text-xs font-medium text-center whitespace-normal break-words leading-tight" title="${d.description || d.name}">
              ${d.name}
            </div>
          </div>
        `;
      });

    // 更新函数：在每次模拟 tick 时更新位置
    function ticked() {
      // 更新连接线路径（使用二次贝塞尔曲线）
      link.attr("d", (d: any) => {
        const source = d.source as ConceptNode & { x: number; y: number };
        const target = d.target as ConceptNode & { x: number; y: number };
        
        if (!source || !target || source.x === undefined || target.x === undefined) {
          return "";
        }

        // 使用二次贝塞尔曲线，更平滑
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // 计算控制点，使曲线更平滑
        const curvature = 0.3;
        const cx = (source.x + target.x) / 2 + curvature * dy;
        const cy = (source.y + target.y) / 2 - curvature * dx;
        
        return `M${source.x},${source.y}Q${cx},${cy} ${target.x},${target.y}`;
      });

      // 更新节点位置，确保在画布内
      node.attr("transform", (d: any) => {
        // 确保节点在画布内
        const x = Math.max(50, Math.min(adjustedWidth - 50, d.x || adjustedWidth / 2));
        const y = Math.max(50, Math.min(adjustedHeight - 50, d.y || adjustedHeight / 2));
        return `translate(${x},${y})`;
      });
    }

    // 拖拽函数
    function dragstarted(event: d3.D3DragEvent<SVGGElement, ConceptNode, any>, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, ConceptNode, any>, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, ConceptNode, any>, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 绑定 tick 事件
    simulation.on("tick", ticked);

    // 调整 alpha 衰减，让布局更稳定
    simulation.alphaDecay(0.02);
    simulation.velocityDecay(0.4);

    // 保存 simulation 引用以便清理
    simulationRef.current = simulation;

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [concepts, links, dimensions]);

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
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-slate-600">专家</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-600">熟练</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs text-slate-600">新手</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span className="text-xs text-slate-600">未知</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeMap;
