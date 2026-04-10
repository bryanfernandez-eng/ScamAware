// Intercept all link clicks via event delegation on the document.
// Intentionally thin — no API calls, no risk logic. All decisions
// are made in the service worker.

document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a');
  if (!anchor || !anchor.href) return;

  const url = anchor.href;

  // Ignore non-navigating links
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  // Ignore links that open in a new tab — the page scan (tabs.onUpdated)
  // in the service worker will catch those when the new tab loads
  if (anchor.target === '_blank') return;

  e.preventDefault();

  chrome.runtime.sendMessage({ type: 'SCAN_URL', url, sourceUrl: window.location.href }, (response) => {
    if (chrome.runtime.lastError) {
      // Service worker not reachable — fail open
      window.location.href = url;
      return;
    }

    if (response?.safe) {
      window.location.href = url;
    }
    // If not safe, the service worker already redirected the tab
    // to the warning page — nothing to do here
  });
});
