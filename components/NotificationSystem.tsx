/**
 * Notification System Component
 * 全局通知系统
 */

import React, { useEffect, useState, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemove
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Set<string>>(new Set());

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  const getNotificationStyle = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-50 text-green-700';
      case 'error':
        return 'border-red-500 bg-red-50 text-red-700';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'info':
        return 'border-blue-500 bg-blue-50 text-blue-700';
      default:
        return 'border-slate-500 bg-slate-50 text-slate-700';
    }
  };

  // Store timeout IDs for cleanup
  useEffect(() => {
    const cleanupTimeouts = () => {
      notifications.forEach(notification => {
        if (notification.autoClose !== false && (notification as any)?._timeoutId) {
          clearTimeout((notification as any)._timeoutId);
        }
      });
    };

    return cleanupTimeouts;
  }, [notifications]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => {
        const isVisible = visibleNotifications.has(notification.id);
        
        return (
          <div
            key={notification.id}
            onMouseEnter={() => setVisibleNotifications(prev => new Set([...prev, notification.id]))}
            className={`
              transform transition-all duration-500
              ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
            `}
            onClick={() => {
              onRemove(notification.id);
              visibleNotifications.delete(notification.id);
            }}
          >
            <div className={`
              flex items-start gap-3 p-4 rounded-xl shadow-lg border
              ${getNotificationStyle(notification.type)}
            `}>
              <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-relaxed">{notification.message}</p>
                <span className="text-[10px] opacity-75 mt-1 block">
                  {new Date(notification.timestamp).toLocaleTimeString('zh-CN')}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                  visibleNotifications.delete(notification.id);
                }}
                className="text-sm opacity-50 hover:opacity-75 transition-opacity flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationSystem;
