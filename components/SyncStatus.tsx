import React, { useState, useEffect } from 'react';

interface SyncStatusProps {
  className?: string;
}

type SyncState = 'synced' | 'syncing' | 'error' | 'offline';

export const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [pendingItems, setPendingItems] = useState(0);

  useEffect(() => {
    // Listen for sync status updates from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_STATUS') {
        setSyncState(event.data.status);
        if (event.data.pendingItems !== undefined) {
          setPendingItems(event.data.pendingItems);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Check initial sync status
    checkSyncStatus();

    // Periodic sync status check
    const interval = setInterval(checkSyncStatus, 30000); // Every 30 seconds

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  const checkSyncStatus = async () => {
    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    try {
      // Check if there are pending items in IndexedDB
      const { db } = await import('../utils/indexedDB');
      const queue = await db.sync.getQueue();
      setPendingItems(queue.length);

      if (queue.length > 0) {
        setSyncState('syncing');
      } else {
        setSyncState('synced');
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
      setSyncState('error');
    }
  };

  const getStatusColor = () => {
    switch (syncState) {
      case 'synced':
        return 'text-green-500';
      case 'syncing':
        return 'text-blue-500';
      case 'error':
        return 'text-red-500';
      case 'offline':
        return 'text-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (syncState) {
      case 'synced':
        return 'All data synced';
      case 'syncing':
        return pendingItems > 0
          ? `Syncing ${pendingItems} item${pendingItems > 1 ? 's' : ''}...`
          : 'Syncing...';
      case 'error':
        return 'Sync error - retrying';
      case 'offline':
        return 'Offline - changes saved locally';
    }
  };

  const getStatusIcon = () => {
    switch (syncState) {
      case 'synced':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'syncing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'offline':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m12.728-12.728l-12.728 12.728" />
          </svg>
        );
    }
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
};

export default SyncStatus;
