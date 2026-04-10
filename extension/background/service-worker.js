const DEFAULT_API_URL = 'http://localhost:8000/api';

// In-memory cache: { [url]: { risk, score, timestamp } }
// Prevents re-scanning the same URL within 5 minutes
const scanCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

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

function redirectToWarning(tabId, url, risk, score, context = 'page') {
  const params = new URLSearchParams({ url, risk, score, context });
  const warningUrl = chrome.runtime.getURL(`warning/warning.html?${params}`);
  chrome.tabs.update(tabId, { url: warningUrl });
}

async function saveToRecentScans(url, risk, score, context) {
  const { recentScans } = await chrome.storage.local.get({ recentScans: [] });
  const record = { url, risk, score, context, scannedAt: Date.now() };
  const updated = [record, ...recentScans].slice(0, 10); // keep last 10
  await chrome.storage.local.set({ recentScans: updated });
}

function isScannable(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

// ------------------------------------------------------------
// 1. Message from content script (link click)
// ------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'SCAN_URL') return;

  const { url } = message;
  const tabId = sender.tab?.id;

  (async () => {
    try {
      if (!(await isEnabled()) || !(isScannable(url)) || await isWhitelisted(url)) {
        sendResponse({ safe: true });
        return;
      }

      const data = await scanUrl(url);
      await saveToRecentScans(url, data.risk, data.score, 'link');

      if (data.risk === 'safe') {
        sendResponse({ safe: true });
      } else {
        redirectToWarning(tabId, url, data.risk, data.score, 'link');
        sendResponse({ safe: false });
      }
    } catch (err) {
      console.error('[ScamAware] Link scan failed:', err);
      sendResponse({ safe: true }); // fail open — don't block user on API errors
    }
  })();

  return true; // keep message channel open for async response
});

// ------------------------------------------------------------
// 2. Page visit scan (tabs.onUpdated)
// ------------------------------------------------------------

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  if (!tab.url || !isScannable(tab.url)) return;

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
// 3. Download scan (downloads.onCreated)
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

      // Open warning in a new tab since the current tab isn't navigating
      const params = new URLSearchParams({ url, risk: data.risk, score: data.score, context: 'download' });
      const warningUrl = chrome.runtime.getURL(`warning/warning.html?${params}`);
      chrome.tabs.create({ url: warningUrl });
    }
  } catch (err) {
    console.error('[ScamAware] Download scan failed:', err);
  }
});
