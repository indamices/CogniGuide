import { useEffect, useState, useCallback, useRef } from 'react';

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  isOffline: boolean;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    registration: null,
    updateAvailable: false,
    isOffline: !navigator.onLine
  });
  const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    // Check online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/service-worker.js', { type: 'module' })
        .then((registration) => {
          console.log('[SW] Registered successfully:', registration);

          setState(prev => ({ ...prev, registration }));

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available
                  setWaitingServiceWorker(newWorker);
                  setState(prev => ({ ...prev, updateAvailable: true }));
                  console.log('[SW] New content is available; please refresh.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshingRef.current) {
          refreshingRef.current = true;
          window.location.reload();
        }
      });

      return () => {
        // Cleanup
      };
    }
  }, []);

  const skipWaiting = useCallback(() => {
    if (waitingServiceWorker) {
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingServiceWorker]);

  const clearCache = useCallback(async () => {
    if (state.registration) {
      state.registration.active?.postMessage({ type: 'CLEAR_CACHE' });
    }
  }, [state.registration]);

  const syncData = useCallback(async () => {
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype || {})) {
      try {
        await (state.registration as any)?.sync.register('sync-data');
        console.log('[SW] Sync registered');
        return true;
      } catch (error) {
        console.error('[SW] Sync registration failed:', error);
        return false;
      }
    } else {
      // Fallback: manually sync
      console.log('[SW] Background sync not supported, syncing manually');
      window.dispatchEvent(new Event('online'));
      return false;
    }
  }, [state.registration]);

  return {
    ...state,
    skipWaiting,
    clearCache,
    syncData
  };
};
