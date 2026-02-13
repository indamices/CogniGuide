# PWA Testing Checklist

## Pre-Deployment Checklist

### Lighthouse PWA Audit
- [ ] Run Lighthouse audit in Chrome DevTools
- [ ] Score ≥ 90 in all PWA categories
- [ ] Fix any failing audits
- [ ] Test on mobile device

### Manifest Validation
- [ ] manifest.json accessible at `/manifest.json`
- [ ] All icons exist and load
- [ ] Theme colors set correctly
- [ ] Shortcuts configured
- [ ] Categories defined

### Service Worker Testing
- [ ] Service worker registers successfully
- [ ] Activates on first load
- [ ] Caches static assets
- [ ] Updates on new version
- [ ] skipWaiting() works

### Offline Functionality
- [ ] App loads offline
- [ ] Can view saved sessions
- [ ] Can browse knowledge maps
- [ ] Can review flashcards
- [ ] Shows offline indicator
- [ ] Queues changes when offline

### Installation
- [ ] Install prompt appears
- [ ] Install button works
- [ ] App launches in standalone mode
- [ ] No browser UI visible
- [ ] Works after restart
- [ ] Uninstalls cleanly

### Data Sync
- [ ] Changes save when offline
- [ ] Sync queue processes online
- [ ] Conflicts resolve correctly
- [ ] No data loss on restart
- [ ] Export/Import works

### Cross-Browser Testing
- [ ] Chrome (Desktop + Mobile)
- [ ] Edge (Desktop + Mobile)
- [ ] Safari (iOS + macOS)
- [ ] Firefox (Desktop + Android)

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Cached load < 500ms
- [ ] Offline load < 300ms
- [ ] Bundle size < 1MB

## Manual Test Cases

### TC1: First Visit
1. Clear all data and cache
2. Navigate to app
3. Verify service worker installs
4. Verify app caches
5. Refresh and confirm fast load

### TC2: Offline Access
1. Load app online
2. Enable DevTools → Offline
3. Refresh page
4. Verify app loads
5. Test all features
6. Verify offline indicator shows

### TC3: Install App
1. Open app in Chrome
2. Look for install icon
3. Click install
4. Verify prompt appears
5. Complete install
6. Verify standalone window
7. Test all features

### TC4: Background Sync
1. Go offline
2. Make changes (new session, card)
3. Go online
4. Verify sync indicator
5. Check IndexedDB queue cleared

### TC5: Data Persistence
1. Create session
2. Add messages
3. Create flashcards
4. Close app
5. Clear site data except IndexedDB
6. Reopen app
7. Verify all data present

### TC6: Cache Updates
1. Update app version
2. Build and deploy
3. Load app
4. Verify new version detected
5. Accept update
6. Verify new content loads

### TC7: Cross-Device
1. Install on device A
2. Create data
3. Export backup
4. Install on device B
5. Import backup
6. Verify data restored

### TC8: Error Handling
1. Block network requests
2. Try API calls
3. Verify graceful fallback
4. Check error messages
5. Verify app remains functional

## Automated Tests

### Unit Tests
```bash
npm run test
```

### Service Worker Tests
- [ ] Registration
- [ ] Cache strategies
- [ ] Fetch handling
- [ ] Sync queue processing
- [ ] IndexedDB operations

### Integration Tests
- [ ] Offline workflow
- [ ] Install flow
- [ ] Sync workflow
- [ ] Update flow

## Browser Compatibility Matrix

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Install | ✅ | ✅ | ✅ | ⚠️ |
| Offline | ✅ | ✅ | ✅ | ✅ |
| Sync | ✅ | ✅ | ⚠️ | ⚠️ |
| Push | ✅ | ✅ | ⚠️ | ✅ |

✅ Full support
⚠️ Partial support
❌ Not supported

## Performance Benchmarks

### Target Metrics
- **First Load**: < 2s
- **Cached Load**: < 200ms
- **Offline Load**: < 300ms
- **Time to Interactive**: < 3s
- **Lighthouse PWA**: ≥ 90
- **Bundle Size**: < 1MB

### Measured Metrics
- First Load: _____ s
- Cached Load: _____ ms
- Offline Load: _____ ms
- TTI: _____ s
- Lighthouse: _____ /100
- Bundle: _____ KB

## Known Issues

### Safari (iOS)
- Background sync not supported
- Install flow different
- Cache limits lower
- Storage quota smaller

### Firefox
- Install prompt unreliable
- Need to manually add to home screen
- Some features experimental

### Edge (Legacy)
- Limited PWA support
- Consider upgrading to Chromium Edge

## Debugging

### Service Worker
```javascript
// Check registration
navigator.serviceWorker.getRegistration()

// Check controller
navigator.serviceWorker.controller

// Manually update
registration.update()
```

### IndexedDB
```javascript
// View contents
indexedDB.open('CogniGuideDB', 1)

// Check stores
// Use DevTools → Application → IndexedDB
```

### Cache
```javascript
// View cache
caches.keys()

// Clear cache
caches.delete('cogniguide-v1')
```

### Network
```javascript
// Check offline status
navigator.onLine

// Listen for changes
window.addEventListener('online', handler)
window.addEventListener('offline', handler)
```

## Test Data

### Sample Session
```json
{
  "id": "test-session-1",
  "title": "PWA Testing",
  "messages": [
    {
      "role": "user",
      "content": "Test message"
    }
  ],
  "timestamp": Date.now()
}
```

### Sample Flashcard
```json
{
  "id": "card-1",
  "front": "What is PWA?",
  "back": "Progressive Web App",
  "box": 0,
  "nextReview": Date.now()
}
```

## Sign-off

### Testing Completed By: ______________________
### Date: ______________________
### Browser Version: ______________________
### Device: ______________________
### Results: [ ] Pass [ ] Fail
### Notes: ______________________
