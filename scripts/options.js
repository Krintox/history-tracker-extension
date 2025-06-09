// Load saved settings when options page opens
document.addEventListener('DOMContentLoaded', loadSettings);

// Save settings when button is clicked
document.getElementById('save').addEventListener('click', saveSettings);

// Load settings from storage
async function loadSettings() {
  const items = await chrome.storage.sync.get([
    'serverUrl',
    'syncFrequency',
    'enableWayback',
    'trackTime'
  ]);
  
  document.getElementById('server-url').value = items.serverUrl || 'http://localhost:5000/api';
  document.getElementById('sync-frequency').value = items.syncFrequency || 15;
  document.getElementById('enable-wayback').checked = items.enableWayback !== false;
  document.getElementById('track-time').checked = items.trackTime !== false;
}

// Save settings to storage
async function saveSettings() {
  const settings = {
    serverUrl: document.getElementById('server-url').value,
    syncFrequency: parseInt(document.getElementById('sync-frequency').value),
    enableWayback: document.getElementById('enable-wayback').checked,
    trackTime: document.getElementById('track-time').checked
  };
  
  await chrome.storage.sync.set(settings);
  
  // Show confirmation
  const status = document.createElement('div');
  status.textContent = 'Settings saved!';
  status.style.color = 'green';
  status.style.marginTop = '10px';
  document.body.appendChild(status);
  
  setTimeout(() => status.remove(), 2000);
}