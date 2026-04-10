const DEFAULT_API_URL = 'http://localhost:8000/api';

// In-memory cache: { [url]: { risk, score, timestamp } }
const scanCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Bypass TTL — how long a "Proceed Anyway" entry stays valid in storage
const BYPASS_TTL_MS = 30 * 1000;

// Last known safe URL per tab — used so the warning page can send the user back
const tabSafeUrl = new Map(); // tabId -> url

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function getApiUrl() {
  const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });
  return apiUrl;
}

async function isEnabled() {
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  return enabled;
}

async function isWhitelisted(url) {
  const { whitelist } = await chrome.storage.sync.get({ whitelist: [] });
  try {
    const hostname = new URL(url).hostname;
    return whitelist.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function getCached(url) {
  const entry = scanCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    scanCache.delete(url);
    return null;
  }
  return entry;
}

function setCache(url, risk, score) {
  scanCache.set(url, { risk, score, timestamp: Date.now() });
}

async function scanUrl(url) {
  const cached = getCached(url);
  if (cached) return cached;

  const apiUrl = await getApiUrl();
  const res = await fetch(`${apiUrl}/scan/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();

  setCache(url, data.risk, data.score);
  return data;
}

function redirectToWarning(tabId, url, risk, score, context = 'page', prevUrl = '') {
  const params = new URLSearchParams({ url, risk, score, context, prevUrl });
  const warningUrl = chrome.runtime.getURL(`warning/warning.html?${params}`);
  chrome.tabs.update(tabId, { url: warningUrl });
}

async function saveToRecentScans(url, risk, score, context) {
  const { recentScans } = await chrome.storage.local.get({ recentScans: [] });
  const record = { url, risk, score, context, scannedAt: Date.now() };
  const updated = [record, ...recentScans].slice(0, 10);
  await chrome.storage.local.set({ recentScans: updated });
}

function isScannable(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

async function consumeBypass(url) {
  const { bypasses } = await chrome.storage.local.get({ bypasses: {} });
  const ts = bypasses[url];
  if (!ts) return false;

  delete bypasses[url];
  await chrome.storage.local.set({ bypasses });

  return (Date.now() - ts) < BYPASS_TTL_MS;
}

// ------------------------------------------------------------
// 1. Track last safe URL when a tab finishes loading
// ------------------------------------------------------------

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && isScannable(tab.url)) {
    tabSafeUrl.set(tabId, tab.url);
  }
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabSafeUrl.delete(tabId);
});

// ------------------------------------------------------------
// 2. Messages from content script
// ------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'SCAN_URL') return;

  const { url, sourceUrl } = message;
  const tabId = sender.tab?.id;

  (async () => {
    try {
      if (!(await isEnabled()) || !isScannable(url) || await isWhitelisted(url)) {
        sendResponse({ safe: true });
        return;
      }

      const data = await scanUrl(url);
      await saveToRecentScans(url, data.risk, data.score, 'link');

      if (data.risk === 'safe') {
        sendResponse({ safe: true });
      } else {
        // sourceUrl is where the user clicked the link — always use it as prevUrl
        redirectToWarning(tabId, url, data.risk, data.score, 'link', sourceUrl);
        sendResponse({ safe: false });
      }
    } catch (err) {
      console.error('[ScamAware] Link scan failed:', err);
      sendResponse({ safe: true });
    }
  })();

  return true;
});

// ------------------------------------------------------------
// 3. Page visit scan (tabs.onUpdated)
// ------------------------------------------------------------

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  if (!tab.url || !isScannable(tab.url)) return;

  if (await consumeBypass(tab.url)) return;

  try {
    if (!(await isEnabled()) || await isWhitelisted(tab.url)) return;

    const data = await scanUrl(tab.url);
    await saveToRecentScans(tab.url, data.risk, data.score, 'page');

    if (data.risk !== 'safe') {
      redirectToWarning(tabId, tab.url, data.risk, data.score, 'page');
    }
  } catch (err) {
    console.error('[ScamAware] Page scan failed:', err);
  }
});

// ------------------------------------------------------------
// 4. Download scan (downloads.onCreated)
// ------------------------------------------------------------

chrome.downloads.onCreated.addListener(async (downloadItem) => {
  const { id, url } = downloadItem;
  if (!url || !isScannable(url)) return;

  try {
    if (!(await isEnabled()) || await isWhitelisted(url)) return;

    const data = await scanUrl(url);
    await saveToRecentScans(url, data.risk, data.score, 'download');

    if (data.risk !== 'safe') {
      chrome.downloads.cancel(id);

      const params = new URLSearchParams({ url, risk: data.risk, score: data.score, context: 'download' });
      const warningUrl = chrome.runtime.getURL(`warning/warning.html?${params}`);
      chrome.tabs.create({ url: warningUrl });
    }
  } catch (err) {
    console.error('[ScamAware] Download scan failed:', err);
  }
});
