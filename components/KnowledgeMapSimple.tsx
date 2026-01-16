/**
 * Simple Knowledge Map Component (D3-free fallback)
 * 简单的知识图谱组件（不使用D3）
 */

import React from 'react';
import { ConceptNode, ConceptLink } from '../types';

interface KnowledgeMapSimpleProps {
  concepts: ConceptNode[];
  links: ConceptLink[];
}

const KnowledgeMapSimple: React.FC<KnowledgeMapSimpleProps> = ({ concepts, links }) => {
  if (concepts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-xl p-8 text-center">
        <div className="text-slate-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 4 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547z" />
          </svg>
          <p className="text-lg font-medium mb-2">知识图谱</p>
          <p className="text-sm">开始探索知识，构建你的知识网络</p>
        </div>
      </div>
    );
  }

  // 计算节点位置（简单布局）
  const nodePositions = React.useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(250, 50 + concepts.length * 20);
    
    concepts.forEach((node, index) => {
      const angle = (index / concepts.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.6;
      positions.set(node.id, { x, y });
    });
    
    return positions;
  }, [concepts]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-xl overflow-hidden relative">
      <svg className="w-full h-full" viewBox="0 0 800 600">
        {/* Draw links */}
        {links.map((link, index) => {
          const source = nodePositions.get(link.source);
          const target = nodePositions.get(link.target);
          
          if (!source || !target) return null;
          
          return (
            <line
              key={`link-${index}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#94a3b8"
              strokeWidth={2}
              strokeOpacity={0.6}
            />
          );
        })}
        
        {/* Draw nodes */}
        {concepts.map((node, index) => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;
          
          const masteryColors: Record<string, string> = {
            Expert: '#10b981',
            Competent: '#6366f1',
            Novice: '#f59e0b',
            Unknown: '#94a3b8'
          };
          
          const color = masteryColors[node.mastery] || '#94a3b8';
          
          return (
            <g key={`node-${index}`}>
              {/* Connection lines from this node */}
              {links
                .filter(l => l.source === node.id)
                .map(l => {
                  const targetPos = nodePositions.get(l.target);
                  if (!targetPos) return null;
                  
                  return (
                    <line
                      key={`link-${node.id}-${l.target}`}
                      x1={pos.x}
                      y1={pos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={color}
                      strokeWidth={2}
                      strokeOpacity={0.4}
                    />
                  );
                })}
              
              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={25}
                fill={color}
                stroke="#e2e8f0"
                strokeWidth={2}
              />
              
              {/* Node label */}
              <text
                x={pos.x + 30}
                y={pos.y + 5}
                fontSize="12"
                fill="#475569"
                textAnchor="start"
              >
                {node.name}
              </text>
              
              {/* Mastery indicator */}
              {node.description && (
                <text
                  x={pos.x + 30}
                  y={pos.y + 20}
                  fontSize="9"
                  fill="#64748b"
                  textAnchor="start"
                >
                  {node.description}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg border border-slate-200">
        <p className="text-xs font-semibold text-slate-700 mb-2">掌握程度</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-slate-600">专家</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
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

export default KnowledgeMapSimple;
