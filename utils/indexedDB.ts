/**
 * IndexedDB wrapper for CogniGuide PWA
 * Provides persistent storage with offline support and sync capabilities
 */

interface DBSchema {
  sessions: {
    key: string;
    value: {
      id: string;
      title: string;
      messages: any[];
      timestamp: number;
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { timestamp: number };
  };
  knowledgeGraph: {
    key: string;
    value: {
      id: string;
      nodes: any[];
      edges: any[];
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
  };
  flashcards: {
    key: string;
    value: {
      id: string;
      front: string;
      back: string;
      box: number;
      nextReview: number;
      easeFactor: number;
      interval: number;
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { nextReview: number };
  };
  analytics: {
    key: string;
    value: {
      date: string;
      studyTime: number;
      cardsReviewed: number;
      accuracy: number;
      lastModified: number;
    };
    indexes: { date: string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      collection: string;
      data: any;
      timestamp: number;
      retries: number;
    };
  };
}

class IndexedDBHelper {
  private dbName = 'CogniGuideDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create knowledgeGraph store
        if (!db.objectStoreNames.contains('knowledgeGraph')) {
          db.createObjectStore('knowledgeGraph', { keyPath: 'id' });
        }

        // Create flashcards store
        if (!db.objectStoreNames.contains('flashcards')) {
          const cardStore = db.createObjectStore('flashcards', { keyPath: 'id' });
          cardStore.createIndex('nextReview', 'nextReview', { unique: false });
        }

        // Create analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'date' });
          analyticsStore.createIndex('date', 'date', { unique: true });
        }

        // Create syncQueue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };
    });
  }

  async add<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue management
  async addToSyncQueue(operation: 'create' | 'update' | 'delete', collection: string, data: any): Promise<void> {
    const syncItem = {
      id: `${collection}_${data.id}_${Date.now()}`,
      operation,
      collection,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    await this.add('syncQueue', syncItem);
  }

  async getSyncQueue(): Promise<any[]> {
    return await this.getAll('syncQueue');
  }

  async clearSyncQueueItem(id: string): Promise<void> {
    await this.delete('syncQueue', id);
  }

  async incrementRetryCount(id: string): Promise<void> {
    const item = await this.get<any>('syncQueue', id);
    if (item) {
      item.retries += 1;
      await this.put('syncQueue', item);
    }
  }

  // Conflict resolution: Last Write Wins
  async resolveConflict<T>(storeName: string, data: T): Promise<void> {
    const existing = await this.get(storeName, (data as any).id);
    if (existing && (existing as any).lastModified > (data as any).lastModified) {
      // Keep existing (it's newer)
      return;
    }
    // Use new data (it's newer or same)
    await this.put(storeName, { ...data, syncStatus: 'synced' });
  }

  // Export all data for backup
  async exportAllData(): Promise<any> {
    const sessions = await this.getAll('sessions');
    const knowledgeGraph = await this.getAll('knowledgeGraph');
    const flashcards = await this.getAll('flashcards');
    const analytics = await this.getAll('analytics');

    return {
      sessions,
      knowledgeGraph,
      flashcards,
      analytics,
      exportDate: new Date().toISOString()
    };
  }

  // Import data
  async importData(data: any): Promise<void> {
    if (data.sessions) {
      for (const session of data.sessions) {
        await this.put('sessions', session);
      }
    }
    if (data.knowledgeGraph) {
      for (const graph of data.knowledgeGraph) {
        await this.put('knowledgeGraph', graph);
      }
    }
    if (data.flashcards) {
      for (const card of data.flashcards) {
        await this.put('flashcards', card);
      }
    }
    if (data.analytics) {
      for (const analytic of data.analytics) {
        await this.put('analytics', analytic);
      }
    }
  }
}

// Singleton instance
export const dbHelper = new IndexedDBHelper();

// Helper functions for specific data types
export const db = {
  sessions: {
    add: (data: any) => dbHelper.add('sessions', { ...data, syncStatus: 'pending' as const }),
    update: (data: any) => dbHelper.put('sessions', { ...data, lastModified: Date.now(), syncStatus: 'pending' as const }),
    get: (id: string) => dbHelper.get('sessions', id),
    getAll: () => dbHelper.getAll('sessions'),
    delete: (id: string) => dbHelper.delete('sessions', id),
    getByTimestamp: (timestamp: number) => dbHelper.getByIndex('sessions', 'timestamp', timestamp)
  },
  knowledgeGraph: {
    add: (data: any) => dbHelper.add('knowledgeGraph', { ...data, syncStatus: 'pending' as const }),
    update: (data: any) => dbHelper.put('knowledgeGraph', { ...data, lastModified: Date.now(), syncStatus: 'pending' as const }),
    get: (id: string) => dbHelper.get('knowledgeGraph', id),
    getAll: () => dbHelper.getAll('knowledgeGraph'),
    delete: (id: string) => dbHelper.delete('knowledgeGraph', id)
  },
  flashcards: {
    add: (data: any) => dbHelper.add('flashcards', { ...data, syncStatus: 'pending' as const }),
    update: (data: any) => dbHelper.put('flashcards', { ...data, lastModified: Date.now(), syncStatus: 'pending' as const }),
    get: (id: string) => dbHelper.get('flashcards', id),
    getAll: () => dbHelper.getAll('flashcards'),
    delete: (id: string) => dbHelper.delete('flashcards', id),
    getDueCards: () => dbHelper.getByIndex('flashcards', 'nextReview', Date.now())
  },
  analytics: {
    add: (data: any) => dbHelper.add('analytics', { ...data, lastModified: Date.now() }),
    update: (data: any) => dbHelper.put('analytics', { ...data, lastModified: Date.now() }),
    get: (date: string) => dbHelper.get('analytics', date),
    getAll: () => dbHelper.getAll('analytics'),
    getByDateRange: (startDate: string, endDate: string) => {
      // This would need a more complex implementation with cursors
      return dbHelper.getAll('analytics').then((all: any[]) =>
        all.filter(a => a.date >= startDate && a.date <= endDate)
      );
    }
  },
  sync: {
    addToQueue: (operation: 'create' | 'update' | 'delete', collection: string, data: any) =>
      dbHelper.addToSyncQueue(operation, collection, data),
    getQueue: () => dbHelper.getSyncQueue(),
    clearItem: (id: string) => dbHelper.clearSyncQueueItem(id),
    incrementRetry: (id: string) => dbHelper.incrementRetryCount(id),
    resolveConflict: (storeName: string, data: any) => dbHelper.resolveConflict(storeName, data)
  },
  backup: {
    export: () => dbHelper.exportAllData(),
    import: (data: any) => dbHelper.importData(data)
  }
};
