// State management
let activeTabId = null;
let startTime = null;
let currentUrl = null;
let tabSwitchCount = 0;
let lastTabSwitchTime = null;

// Load settings from storage
let settings = {
  serverUrl: 'http://localhost:5000/api',
  syncFrequency: 15,
  enableWayback: true,
  trackTime: true
};

// Load settings when extension starts
chrome.storage.sync.get(Object.keys(settings), (loadedSettings) => {
  settings = { ...settings, ...loadedSettings };
  setupAlarms();
});

// Track tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (!settings.trackTime) return;
  
  const now = Date.now();
  activeTabId = activeInfo.tabId;
  
  // Track focus changes for focus score
  if (lastTabSwitchTime && (now - lastTabSwitchTime) < 30000) {
    tabSwitchCount++;
  }
  lastTabSwitchTime = now;
  
  // Get tab info and track visit
  chrome.tabs.get(activeTabId, (tab) => {
    if (tab.url) {
      trackVisit(tab.url, tab.title);
    }
  });
  
  // Reset timer for new tab
  startTime = new Date();
});

// Track URL changes in active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!settings.trackTime || tabId !== activeTabId || !changeInfo.url) return;
  
  const endTime = new Date();
  const timeSpent = (endTime - startTime) / 1000; // in seconds
  
  if (currentUrl && timeSpent > 5) { // Ignore very quick redirects
    trackTimeSpent(currentUrl, timeSpent);
  }
  
  currentUrl = changeInfo.url;
  startTime = new Date();
  trackVisit(changeInfo.url, tab.title);
});

// Track window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (!settings.trackTime) return;
  
  const now = new Date();
  
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Window lost focus - record time spent
    if (currentUrl && startTime) {
      const timeSpent = (now - startTime) / 1000;
      if (timeSpent > 5) {
        trackTimeSpent(currentUrl, timeSpent);
      }
    }
  } else {
    // Window gained focus - reset timer
    startTime = now;
  }
});

// Track visits to new URLs
function trackVisit(url, title) {
  currentUrl = url;
  
  chrome.storage.sync.get(['userId'], (result) => {
    if (!result.userId) return;
    
    fetch(`${settings.serverUrl}/history/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: result.userId,
        url,
        title
      })
    }).catch(console.error);
  });
}

// Track time spent on URLs
function trackTimeSpent(url, timeSpent) {
  chrome.storage.sync.get(['userId'], (result) => {
    if (!result.userId) return;
    
    fetch(`${settings.serverUrl}/history/time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: result.userId,
        url,
        timeSpent,
        tabSwitches: tabSwitchCount
      })
    }).then(() => {
      tabSwitchCount = 0; // Reset after sync
    }).catch(console.error);
  });
}

// Setup periodic sync
function setupAlarms() {
  chrome.alarms.create('syncHistory', {
    periodInMinutes: settings.syncFrequency
  });
}

// Handle sync alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncHistory') {
    syncHistory();
  }
});

// Full history sync
function syncHistory() {
  chrome.storage.sync.get(['userId', 'lastSync'], (result) => {
    if (!result.userId) return;
    
    fetch(`${settings.serverUrl}/history/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: result.userId,
        lastSync: result.lastSync || 0
      })
    }).then(() => {
      chrome.storage.sync.set({ lastSync: Date.now() });
    }).catch(console.error);
  });
}