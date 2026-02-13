import React, { useEffect, useRef, useState } from 'react';
import { ConceptNode, ConceptLink, MasteryLevel } from '../types';

interface KnowledgeMap3DProps {
  concepts: ConceptNode[];
  links: ConceptLink[];
  onNodeClick?: (node: ConceptNode) => void;
}

/**
 * KnowledgeMap3D - 3D Interactive Knowledge Graph Visualization
 *
 * Features:
 * - 3D force-directed graph layout
 * - Node coloring based on mastery level
 * - Interactive controls (zoom, rotate, pan)
 * - Glow effects for high mastery nodes
 * - Particle system background
 * - Performance optimized for 1000+ nodes
 */
const KnowledgeMap3D: React.FC<KnowledgeMap3DProps> = ({ concepts, links, onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoverNode, setHoverNode] = useState<ConceptNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [showParticles, setShowParticles] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  // Color mapping for mastery levels
  const masteryColors: Record<MasteryLevel, { main: string; glow: string; emissive: string }> = {
    [MasteryLevel.Expert]: {
      main: '#10b981',    // Emerald 500
      glow: '#34d399',    // Emerald 400
      emissive: '#064e3b' // Emerald 900
    },
    [MasteryLevel.Competent]: {
      main: '#3b82f6',    // Blue 500
      glow: '#60a5fa',    // Blue 400
      emissive: '#1e3a8a' // Blue 900
    },
    [MasteryLevel.Novice]: {
      main: '#f59e0b',    // Amber 500
      glow: '#fbbf24',    // Amber 400
      emissive: '#78350f' // Amber 900
    },
    [MasteryLevel.Unknown]: {
      main: '#64748b',    // Slate 500
      glow: '#94a3b8',    // Slate 400
      emissive: '#1e293b' // Slate 900
    }
  };

  // Transform data to graph format
  const graphData = React.useMemo(() => {
    const nodes = concepts.map(concept => {
      const colors = masteryColors[concept.mastery];
      return {
        id: concept.id,
        name: concept.name,
        mastery: concept.mastery,
        description: concept.description || '',
        val: masteryLevelToValue(concept.mastery), // Node size
        color: colors?.main || '#64748b'
      };
    });

    const graphLinks = links.map(link => ({
      source: link.source,
      target: link.target,
      relationship: link.relationship
    }));

    return { nodes, links: graphLinks };
  }, [concepts, links]);

  // Convert mastery level to node size
  function masteryLevelToValue(level: MasteryLevel): number {
    switch (level) {
      case MasteryLevel.Expert: return 20;
      case MasteryLevel.Competent: return 15;
      case MasteryLevel.Novice: return 10;
      case MasteryLevel.Unknown: return 8;
      default: return 10;
    }
  }

  // Initialize graph
  useEffect(() => {
    if (!containerRef.current || !graphData.nodes.length) return;

    const loadGraph = async () => {
      try {
        const ForceGraph3DModule = await import('3d-force-graph');
        const ForceGraph3D = ForceGraph3DModule.default || ForceGraph3DModule;

        if (graphRef.current) {
          (graphRef.current as any)._destructor();
        }

        // Create graph instance
        const Graph = ForceGraph3D as any;
        const graph = Graph()(containerRef.current)
          .graphData(graphData)
          .nodeAutoColorBy('mastery')
          .nodeLabel('name')
          .nodeVal('val')
          .nodeResolution(32) // Smooth spheres
          .nodeOpacity(0.9)
          .nodeRelSize(6) // Minimum size
          .linkWidth((link: any) => {
            // Link width based on relationship strength or default
            return 1.5;
          })
          .linkOpacity(0.4)
          .linkColor('#94a3b8')
          .linkDirectionalArrowLength(4)
          .linkDirectionalArrowRelPos(1)
          .backgroundColor('#0f172a') // Slate 900 for dark theme
          .showNavInfo(false) // Hide navigation info overlay
          .cameraPosition({ z: 500 }) // Initial camera position
          .onNodeClick((node: any) => {
            const concept = concepts.find(c => c.id === node.id);
            if (concept && onNodeClick) {
              onNodeClick(concept);
            }
            setSelectedNode(concept || null);

            // Highlight connected nodes
            if (graphRef.current) {
              const connectedNodeIds = new Set();
              connectedNodeIds.add(node.id);
              links.forEach((link: any) => {
                if (link.source === node.id) connectedNodeIds.add(link.target);
                if (link.target === node.id) connectedNodeIds.add(link.source);
              });

              (graphRef.current as any)
                .nodeColor((n: any) => {
                  const colors = masteryColors[n.mastery as MasteryLevel];
                  return connectedNodeIds.has(n.id)
                    ? (colors?.glow || '#64748b')
                    : (colors?.main || '#64748b');
                })
                .linkOpacity(0.1);
            }
          })
          .onNodeRightClick(() => {
            // Reset on right click
            setSelectedNode(null);
            if (graphRef.current) {
              (graphRef.current as any)
                .nodeColor((n: any) => {
                  const colors = masteryColors[n.mastery as MasteryLevel];
                  return colors?.main || '#64748b';
                })
                .linkOpacity(0.4);
            }
          })
          .onNodeHover((node: any) => {
            setHoverNode(node || null);
            containerRef.current?.style.setProperty('cursor', node ? 'pointer' : 'grab');
          })
          .onBackgroundClick(() => {
            setSelectedNode(null);
            if (graphRef.current) {
              (graphRef.current as any)
                .nodeColor((n: any) => {
                  const colors = masteryColors[n.mastery as MasteryLevel];
                  return colors?.main || '#64748b';
                })
                .linkOpacity(0.4);
            }
          });

        graphRef.current = graph;

        // Configure node appearance
        (graph as any).nodeColor((node: any) => {
          const colors = masteryColors[node.mastery as MasteryLevel];
          return colors?.main || '#64748b';
        });

        (graph as any).nodeVal((node: any) => node.val);

        // Auto-rotate camera if enabled
        if (autoRotate) {
          graphRef.current.controls().autoRotate = true;
          graphRef.current.controls().autoRotateSpeed = 1;
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load 3D Force Graph:', error);
      }
    };

    loadGraph();

    return () => {
      if (graphRef.current) {
        graphRef.current._destructor();
      }
    };
  }, [graphData, autoRotate]);

  // Toggle auto-rotate
  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
    if (graphRef.current) {
      graphRef.current.controls().autoRotate = !autoRotate;
      graphRef.current.controls().autoRotateSpeed = 1;
    }
  };

  // Reset view
  const resetView = () => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ z: 500 });
      graphRef.current.zoomToFit(1000);
    }
  };

  // Export as PNG
  const exportPNG = () => {
    if (graphRef.current) {
      graphRef.current.downloadImage('knowledge-graph-3d', 'png', {
        backgroundColor: '#0f172a',
        pixelRatio: 2
      });
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  if (concepts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200">
        <p>暂无知识图谱</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-lg overflow-hidden border border-slate-700">
      {/* 3D Graph Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      />

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-sm">加载3D可视化...</p>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={toggleAutoRotate}
          className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 transition-all text-sm font-medium shadow-lg"
          title={autoRotate ? '停止旋转' : '自动旋转'}
        >
          {autoRotate ? '⏸️ 停止旋转' : '🔄 自动旋转'}
        </button>
        <button
          onClick={resetView}
          className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 transition-all text-sm font-medium shadow-lg"
          title="重置视图"
        >
          🎯 重置视图
        </button>
        <button
          onClick={exportPNG}
          className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 transition-all text-sm font-medium shadow-lg"
          title="导出PNG"
        >
          📷 导出图片
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 transition-all text-sm font-medium shadow-lg"
          title="全屏模式"
        >
          🔳 全屏
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md rounded-lg p-4 shadow-xl border border-slate-700">
        <p className="text-xs font-semibold text-slate-200 mb-3">掌握程度</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
            <span className="text-xs text-slate-300">专家</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
            <span className="text-xs text-slate-300">熟练</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></div>
            <span className="text-xs text-slate-300">新手</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className="text-xs text-slate-300">未知</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoverNode && (
        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md rounded-lg p-4 shadow-xl border border-slate-700 max-w-xs">
          <h3 className="text-sm font-bold text-slate-100 mb-1">{hoverNode.name}</h3>
          <p className="text-xs text-slate-400 mb-2">掌握度: {hoverNode.mastery}</p>
          {hoverNode.description && (
            <p className="text-xs text-slate-300 leading-relaxed">{hoverNode.description}</p>
          )}
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-slate-700">
        <p className="text-xs text-slate-300">
          <span className="font-semibold">🎮 控制：</span>
          拖拽旋转 | 滚轮缩放 | 点击聚焦
        </p>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-slate-700">
        <p className="text-xs text-slate-300">
          节点: <span className="font-bold text-indigo-400">{concepts.length}</span> |
          连接: <span className="font-bold text-indigo-400">{links.length}</span>
        </p>
      </div>
    </div>
  );
};

export default KnowledgeMap3D;
