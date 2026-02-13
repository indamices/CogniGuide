import React, { useState, lazy, Suspense } from 'react';
import { ConceptNode, ConceptLink } from '../types';

// Lazy load both components
const KnowledgeMap2D = lazy(() => import('./OptimizedKnowledgeMap').then(mod => ({ default: mod.default })));
const KnowledgeMap3D = lazy(() => import('./KnowledgeMap3D').then(mod => ({ default: mod.default })));

type ViewMode = '2d' | '3d';

interface KnowledgeMapSwitcherProps {
  concepts: ConceptNode[];
  links: ConceptLink[];
  onNodeClick?: (node: ConceptNode) => void;
  height?: string;
}

/**
 * KnowledgeMapSwitcher - Unified 2D/3D Knowledge Graph Component
 *
 * Features:
 * - Switch between 2D and 3D visualizations
 * - Lazy loading for performance
 * - Shared state and interactions
 * - Responsive design
 * - Mobile-optimized controls
 */
const KnowledgeMapSwitcher: React.FC<KnowledgeMapSwitcherProps> = ({
  concepts,
  links,
  onNodeClick,
  height = '100%'
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [isLoading, setIsLoading] = useState(false);

  const handleViewChange = async (mode: ViewMode) => {
    if (mode === viewMode) return;
    setIsLoading(true);
    setViewMode(mode);
    // Reset loading after component transition
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="relative w-full h-full" style={{ height }}>
      {/* View Toggle Button */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        <button
          onClick={() => handleViewChange('2d')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-lg ${
            viewMode === '2d'
              ? 'bg-indigo-600 text-white shadow-indigo-600/50'
              : 'bg-white/90 text-slate-700 hover:bg-white'
          } backdrop-blur-md border border-slate-200`}
          aria-pressed={viewMode === '2d'}
          aria-label="切换到2D视图"
        >
          📊 2D 视图
        </button>
        <button
          onClick={() => handleViewChange('3d')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-lg ${
            viewMode === '3d'
              ? 'bg-indigo-600 text-white shadow-indigo-600/50'
              : 'bg-white/90 text-slate-700 hover:bg-white'
          } backdrop-blur-md border border-slate-200`}
          aria-pressed={viewMode === '3d'}
          aria-label="切换到3D视图"
        >
          🌐 3D 视图
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm rounded-lg">
          <div className="bg-white/95 backdrop-blur-md rounded-lg px-6 py-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-700">
                切换到{viewMode === '2d' ? '2D' : '3D'}视图...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Graph Container */}
      <div className="w-full h-full">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50/20 rounded-lg border border-slate-200">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">加载可视化组件...</p>
              </div>
            </div>
          }
        >
          {viewMode === '2d' ? (
            <KnowledgeMap2D concepts={concepts} links={links} />
          ) : (
            <KnowledgeMap3D concepts={concepts} links={links} onNodeClick={onNodeClick} />
          )}
        </Suspense>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-lg px-4 py-2 shadow-lg border border-slate-200">
          <p className="text-xs text-slate-600">
            <span className="font-semibold">节点: {concepts.length}</span> |{' '}
            <span className="font-semibold">连接: {links.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeMapSwitcher;
