const params  = new URLSearchParams(window.location.search);
const url     = params.get('url')     || '';
const risk    = params.get('risk')    || 'suspicious';
const score   = parseFloat(params.get('score') || '0');
const context = params.get('context') || 'page';
const prevUrl = params.get('prevUrl') || '';

// --- Populate risk badge ---
const badge = document.getElementById('risk-badge');
badge.classList.add(risk);
document.getElementById('risk-value').textContent = risk;
document.getElementById('risk-score').textContent =
  `Confidence: ${Math.round(score * 100)}/100`;

// --- Populate URL ---
document.getElementById('scanned-url').textContent = url || '(unknown)';

// --- Context note ---
const notes = {
  link:     'ScamAware intercepted this link before you navigated to it.',
  page:     'ScamAware detected a threat on the page you were loading.',
  download: 'ScamAware blocked a file download from this URL.',
};
document.getElementById('context-note').textContent = notes[context] || notes.page;

// --- Go Back ---
document.getElementById('btn-back').addEventListener('click', async () => {
  if (context === 'download') {
    window.close();
    return;
  }

  if (prevUrl) {
    // Bypass the scan for the page we're going back to so the user
    // isn't intercepted again immediately after clicking Go Back
    const { bypasses } = await chrome.storage.local.get({ bypasses: {} });
    bypasses[prevUrl] = Date.now();
    await chrome.storage.local.set({ bypasses });

    window.location.href = prevUrl;
  } else {
    chrome.tabs.create({});
  }
});

// --- Proceed Anyway ---
// Write the bypass directly to storage so the service worker sees it even
// if it went idle between redirecting here and the user clicking the button.
document.getElementById('btn-proceed').addEventListener('click', async () => {
  if (!url) return;

  const { bypasses } = await chrome.storage.local.get({ bypasses: {} });
  bypasses[url] = Date.now(); // timestamp used for 30s TTL in service worker
  await chrome.storage.local.set({ bypasses });

  window.location.href = url;
});
