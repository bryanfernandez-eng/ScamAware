const params = new URLSearchParams(window.location.search);
const url     = params.get('url')     || '';
const risk    = params.get('risk')    || 'suspicious';
const score   = parseFloat(params.get('score') || '0');
const context = params.get('context') || 'page';

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
document.getElementById('context-note').textContent =
  notes[context] || notes.page;

// --- Go Back ---
document.getElementById('btn-back').addEventListener('click', () => {
  if (context === 'download') {
    // Warning was opened in a new tab — just close it
    window.close();
  } else if (history.length > 1) {
    history.back();
  } else {
    window.close();
  }
});

// --- Proceed Anyway ---
document.getElementById('btn-proceed').addEventListener('click', () => {
  if (url) window.location.href = url;
});
