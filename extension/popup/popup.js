const DEFAULT_API_URL = 'http://localhost:8000/api';

// ------------------------------------------------------------
// Enable / disable toggle
// ------------------------------------------------------------

const toggle      = document.getElementById('enabled-toggle');
const toggleLabel = document.getElementById('toggle-label');

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  toggle.checked    = enabled;
  toggleLabel.textContent = enabled ? 'On' : 'Off';
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  toggleLabel.textContent = enabled ? 'On' : 'Off';
  chrome.storage.sync.set({ enabled });
});

// ------------------------------------------------------------
// Current page status
// ------------------------------------------------------------

const statusDot  = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

function setStatus(state, message) {
  statusDot.className = `status-dot ${state}`;
  statusText.innerHTML = message;
}

chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
  if (!tab?.url || !tab.url.startsWith('http')) {
    setStatus('unknown', 'Not a scannable page');
    return;
  }

  setStatus('scanning', `<strong>Scanning...</strong>`);

  chrome.storage.local.get({ recentScans: [] }, ({ recentScans }) => {
    const match = recentScans.find((s) => s.url === tab.url);
    if (match) {
      const labels = { safe: 'Safe', suspicious: 'Suspicious', dangerous: 'Dangerous' };
      setStatus(match.risk, `This page is <strong>${labels[match.risk]}</strong>`);
    } else {
      setStatus('unknown', 'Not yet scanned — navigate to trigger a scan');
    }
  });
});

// ------------------------------------------------------------
// Recent scans list
// ------------------------------------------------------------

const scanList = document.getElementById('scan-list');

chrome.storage.local.get({ recentScans: [] }, ({ recentScans }) => {
  if (recentScans.length === 0) return;

  scanList.innerHTML = '';
  recentScans.forEach(({ url, risk }) => {
    const item = document.createElement('div');
    item.className = 'scan-item';

    let displayUrl;
    try {
      const parsed = new URL(url);
      displayUrl = parsed.hostname + parsed.pathname.slice(0, 30);
    } catch {
      displayUrl = url.slice(0, 40);
    }

    item.innerHTML = `
      <span class="scan-badge ${risk}">${risk}</span>
      <span class="scan-url" title="${url}">${displayUrl}</span>
    `;
    scanList.appendChild(item);
  });
});

// ------------------------------------------------------------
// Settings — load saved values
// ------------------------------------------------------------

const apiUrlInput    = document.getElementById('api-url-input');
const whitelistInput = document.getElementById('whitelist-input');

chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL, whitelist: [] }, ({ apiUrl, whitelist }) => {
  apiUrlInput.value    = apiUrl;
  whitelistInput.value = whitelist.join(', ');
});

// ------------------------------------------------------------
// Settings — save
// ------------------------------------------------------------

const saveBtn     = document.getElementById('save-btn');
const saveConfirm = document.getElementById('save-confirm');

saveBtn.addEventListener('click', () => {
  const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;
  const whitelist = whitelistInput.value
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  chrome.storage.sync.set({ apiUrl, whitelist }, () => {
    saveConfirm.textContent = 'Saved!';
    setTimeout(() => { saveConfirm.textContent = ''; }, 2000);
  });
});
