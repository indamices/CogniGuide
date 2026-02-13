/**
 * Data synchronization manager for CogniGuide PWA
 * Handles offline-to-online data synchronization
 */

import { db } from './indexedDB';

interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  syncOnOnline: boolean;
}

class SyncManager {
  private config: SyncConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    syncOnOnline: true
  };

  private isSyncing = false;
  private syncCallbacks: Set<() => void> = new Set();

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Listen for online events to trigger sync
    if (this.config.syncOnOnline) {
      window.addEventListener('online', () => {
        console.log('[SyncManager] Online detected, starting sync...');
        this.sync();
      });
    }

    // Listen for sync requests from service worker
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_REQUEST') {
        this.sync();
      }
    });
  }

  /**
   * Register a callback to be notified when sync completes
   */
  onSyncComplete(callback: () => void): () => void {
    this.syncCallbacks.add(callback);
    return () => this.syncCallbacks.delete(callback);
  }

  /**
   * Queue an operation for synchronization
   */
  async queueOperation(
    operation: 'create' | 'update' | 'delete',
    collection: string,
    data: any
  ): Promise<void> {
    await db.sync.addToQueue(operation, collection, data);
    console.log(`[SyncManager] Queued ${operation} operation for ${collection}`);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  /**
   * Perform synchronization
   */
  async sync(): Promise<boolean> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress');
      return false;
    }

    if (!navigator.onLine) {
      console.log('[SyncManager] Offline, skipping sync');
      return false;
    }

    this.isSyncing = true;
    console.log('[SyncManager] Starting sync...');

    try {
      const queue = await db.sync.getQueue();

      if (queue.length === 0) {
        console.log('[SyncManager] No items to sync');
        this.isSyncing = false;
        return true;
      }

      // Process each item in the queue
      for (const item of queue) {
        try {
          await this.processQueueItem(item);
          await db.sync.clearItem(item.id);
          console.log(`[SyncManager] Successfully synced item ${item.id}`);
        } catch (error) {
          console.error(`[SyncManager] Failed to sync item ${item.id}:`, error);

          // Increment retry count
          await db.sync.incrementRetry(item.id);

          // Remove if max retries exceeded
          if (item.retries >= this.config.maxRetries) {
            console.error(`[SyncManager] Max retries exceeded for item ${item.id}, removing from queue`);
            await db.sync.clearItem(item.id);
          }
        }
      }

      // Notify callbacks
      this.syncCallbacks.forEach(callback => callback());

      console.log('[SyncManager] Sync completed successfully');
      return true;
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: any): Promise<void> {
    const { operation, collection, data } = item;

    // In a real app, this would make API calls to sync with a server
    // For now, we'll simulate it and resolve conflicts locally
    console.log(`[SyncManager] Processing ${operation} on ${collection}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update local data with synced status
    try {
      const existing = await (db as any)[collection]?.get(data.id);
      if (existing) {
        await (db as any)[collection]?.update({
          ...data,
          syncStatus: 'synced'
        });
      }
    } catch (error) {
      // Item might not exist in local storage, that's ok
    }
  }

  /**
   * Resolve a data conflict between local and remote
   */
  async resolveConflict(
    collection: string,
    localData: any,
    remoteData: any
  ): Promise<any> {
    // Last Write Wins strategy
    if (localData.lastModified && remoteData.lastModified) {
      return localData.lastModified > remoteData.lastModified ? localData : remoteData;
    }

    // If no timestamps, use local data (user's changes take priority)
    return localData;
  }

  /**
   * Export data for backup
   */
  async exportData(): Promise<string> {
    const data = await db.backup.export();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from backup
   */
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      await db.backup.import(data);
      console.log('[SyncManager] Data imported successfully');
    } catch (error) {
      console.error('[SyncManager] Failed to import data:', error);
      throw new Error('Invalid backup file');
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    queuedItems: number;
    isSyncing: boolean;
    lastSync?: number;
  }> {
    const queue = await db.sync.getQueue();
    return {
      queuedItems: queue.length,
      isSyncing: this.isSyncing,
      lastSync: await this.getLastSyncTime()
    };
  }

  /**
   * Get the last successful sync time
   */
  private async getLastSyncTime(): Promise<number | undefined> {
    try {
      const lastSync = localStorage.getItem('last-successful-sync');
      return lastSync ? parseInt(lastSync) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Update the last successful sync time
   */
  private updateLastSyncTime(): void {
    localStorage.setItem('last-successful-sync', Date.now().toString());
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// Convenience functions for common sync operations
export const queueForSync = (
  operation: 'create' | 'update' | 'delete',
  collection: string,
  data: any
) => syncManager.queueOperation(operation, collection, data);

export const syncNow = () => syncManager.sync();

export const exportData = () => syncManager.exportData();

export const importData = (jsonData: string) => syncManager.importData(jsonData);

export const getSyncStats = () => syncManager.getSyncStats();
