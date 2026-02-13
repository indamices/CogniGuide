import React from 'react';

/**
 * Skeleton - 骨架屏组件，用于加载状态展示
 * 提供比传统loading spinner更好的用户体验
 */

interface BaseSkeletonProps {
  className?: string;
}

// 基础骨架屏
export const Skeleton: React.FC<BaseSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded ${className}`}
      role="status"
      aria-label="加载中"
    >
      <span className="sr-only">加载中...</span>
    </div>
  );
};

// 文本骨架屏（多行）
interface TextSkeletonProps extends BaseSkeletonProps {
  lines?: number;
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="加载文本">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === lines - 1 ? 'w-3/4 h-4' : 'w-full h-4'}
        />
      ))}
    </div>
  );
};

// 圆形头像骨架屏
interface AvatarSkeletonProps extends BaseSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarSkeleton: React.FC<AvatarSkeletonProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <Skeleton
      className={`${sizeClasses[size]} rounded-full ${className}`}
      aria-label="加载头像"
    />
  );
};

// 卡片骨架屏
export const CardSkeleton: React.FC<BaseSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 p-4 space-y-3 ${className}`}
      role="status"
      aria-label="加载卡片"
    >
      <div className="flex items-start gap-3">
        <AvatarSkeleton size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      </div>
      <TextSkeleton lines={2} />
    </div>
  );
};

// 消息气泡骨架屏
interface MessageSkeletonProps extends BaseSkeletonProps {
  type?: 'user' | 'assistant';
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
  type = 'assistant',
  className = ''
}) => {
  return (
    <div
      className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} ${className}`}
      role="status"
      aria-label={type === 'user' ? '加载用户消息' : '加载AI消息'}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 ${
          type === 'user'
            ? 'bg-indigo-100'
            : 'bg-white border border-slate-200'
        }`}
      >
        <TextSkeleton lines={type === 'user' ? 2 : 4} />
      </div>
    </div>
  );
};

// Dashboard骨架屏
export const DashboardSkeleton: React.FC<BaseSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="加载仪表板">
      {/* 教学阶段监控 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
        <Skeleton className="w-32 h-4" />
        <div className="flex justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="w-8 h-3" />
            </div>
          ))}
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-3/4 h-4" />
        </div>
      </div>

      {/* 知识掌握度 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-12 h-6" />
        </div>
        <Skeleton className="w-full h-2 rounded-full" />
      </div>

      {/* 学习笔记 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-12 h-4" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="w-5 h-5 flex-shrink-0" />
              <Skeleton className="flex-1 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 历史会话列表骨架屏
export const SessionListSkeleton: React.FC<BaseSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="加载会话列表">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center p-3 rounded-lg border border-transparent"
        >
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 知识图谱骨架屏
export const KnowledgeMapSkeleton: React.FC<BaseSkeletonProps> = ({
  className = ''
}) => {
  return (
    <div
      className={`w-full h-full bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-lg border border-slate-100 flex items-center justify-center ${className}`}
      role="status"
      aria-label="加载知识图谱"
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-sm text-slate-600">正在生成知识图谱...</p>
      </div>
    </div>
  );
};

export default Skeleton;
