import { calculateFocusScore } from './utils.js';

// DOM elements
const scoreElement = document.getElementById('score');
const todayTimeElement = document.getElementById('today-time');
const productiveTimeElement = document.getElementById('productive-time');
const distractingTimeElement = document.getElementById('distracting-time');
const viewDashboardButton = document.getElementById('view-dashboard');
const settingsButton = document.getElementById('settings');

// Load stats when popup opens
document.addEventListener('DOMContentLoaded', loadStats);

// Button event listeners
viewDashboardButton.addEventListener('click', () => {
  chrome.tabs.create({ url: `${settings.serverUrl}/dashboard` });
});

settingsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Load stats from storage and backend
async function loadStats() {
  try {
    // Get locally cached stats first
    const { stats } = await chrome.storage.sync.get('stats');
    
    if (stats) {
      updateUI(stats);
    }
    
    // Then fetch fresh stats from backend
    const { userId } = await chrome.storage.sync.get('userId');
    if (!userId) return;
    
    const response = await fetch(`${settings.serverUrl}/stats/summary`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const freshStats = await response.json();
    updateUI(freshStats);
    
    // Cache the fresh stats
    await chrome.storage.sync.set({ stats: freshStats });
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Update the popup UI with stats
function updateUI(stats) {
  if (!stats) return;
  
  scoreElement.textContent = calculateFocusScore(stats.tabSwitches, stats.totalTime);
  todayTimeElement.textContent = Math.round(stats.totalTime / 60);
  
  const productiveTime = stats.timeByCategory.find(c => c.category === 'work')?.time || 0;
  const distractingTime = stats.timeByCategory.find(c => 
    ['social', 'entertainment'].includes(c.category)
  )?.time || 0;
  
  productiveTimeElement.textContent = Math.round(productiveTime / 60);
  distractingTimeElement.textContent = Math.round(distractingTime / 60);
}