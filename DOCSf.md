# ScamAware — Project Documentation

> For setup and run instructions see [README.md](README.md).

---

## 1. Overview

### Problem
Every day, people encounter suspicious links in emails, text messages with phishing language, unknown phone numbers from scam callers, and files that may contain malware. Most users have no quick, accessible way to verify whether something is safe before engaging with it.

### Solution
ScamAware is a web tool that lets anyone submit a link, message, phone number, or file and receive an instant risk verdict — safe, suspicious, or dangerous — with an explanation of why.

### Target Users
- General consumers who received a suspicious email, SMS, or call
- Small business employees handling unknown attachments or vendor links
- Anyone who wants a second opinion before clicking or responding

---

## 2. Features

### 2.1 Link Analysis
Submit any URL and get a risk assessment.

- Checks the URL against threat intelligence feeds (e.g. Google Safe Browsing, VirusTotal, OpenPhish)
- Detects lookalike domains, URL shorteners hiding destinations, and known malicious hosts
- Returns a risk level, confidence score, and a list of matched threat categories

### 2.2 Text / Message Scan
Paste an email body, SMS, or any block of text.

- Extracts embedded URLs and scans them
- Detects phishing language patterns (urgency, impersonation, credential requests)
- Flags suspicious sender claims and social engineering tactics
- Highlights the specific phrases or links that triggered flags

### 2.3 File / Attachment Scan
Upload a file (PDF, Office doc, image, archive, etc.).

- Computes a hash and checks against known malware signature databases (e.g. VirusTotal)
- Detects suspicious macro content in Office files
- Returns a list of matched threats or a clean verdict
- Max file size: 10 MB

### 2.4 Phone Number Lookup
Enter a phone number to check its reputation.

- Looks up carrier and geographic information
- Cross-references against scam reporting databases
- Returns the number of community-reported scam incidents and common scam types associated with it

---

## 3. User Flows

### Link Analysis
1. User navigates to the **Link** tab
2. Pastes a URL into the input field
3. Clicks **Scan**
4. Frontend calls `POST /api/scan/link`
5. Result card appears showing: risk badge, score, matched threat categories, and safe-browsing details

### Text / Message Scan
1. User navigates to the **Message** tab
2. Pastes text into the textarea
3. Clicks **Scan**
4. Frontend calls `POST /api/scan/text`
5. Result card highlights flagged phrases inline and lists detected signals (e.g. "Urgent language", "Credential request", "Suspicious link: bit.ly/xxx")

### File / Attachment Scan
1. User navigates to the **File** tab
2. Drags and drops or selects a file
3. Clicks **Scan**
4. Frontend submits `POST /api/scan/file` as multipart form
5. Result card shows: verdict, file hash, threats found (or "No threats detected")

### Phone Number Lookup
1. User navigates to the **Phone** tab
2. Enters a phone number
3. Clicks **Lookup**
4. Frontend calls `POST /api/scan/phone`
5. Result card shows: carrier, location, scam report count, and common scam types

---

## 4. API Contract

All endpoints are prefixed with `/api`.

### `GET /api/health`
Liveness check.

**Response**
```json
{ "status": "ok" }
```

---

### `POST /api/scan/link`
Analyze a URL for risk.

**Request**
```json
{ "url": "https://example.com/suspicious-page" }
```

**Response**
```json
{
  "risk": "dangerous",
  "score": 0.94,
  "details": {
    "matched_feeds": ["Google Safe Browsing", "OpenPhish"],
    "threat_types": ["phishing", "malware"],
    "redirects_to": null
  }
}
```

`risk` values: `"safe"` | `"suspicious"` | `"dangerous"`

---

### `POST /api/scan/text`
Scan a block of text for scam signals.

**Request**
```json
{ "content": "Your account has been compromised. Click here to verify: http://bit.ly/abc123" }
```

**Response**
```json
{
  "risk": "suspicious",
  "score": 0.75,
  "flags": [
    { "type": "urgency_language", "excerpt": "Your account has been compromised" },
    { "type": "suspicious_link",  "excerpt": "http://bit.ly/abc123", "link_risk": "dangerous" }
  ]
}
```

---

### `POST /api/scan/file`
Scan an uploaded file.

**Request**: `multipart/form-data` with field `file`.

**Response**
```json
{
  "risk": "safe",
  "score": 0.02,
  "file_hash": "d41d8cd98f00b204e9800998ecf8427e",
  "threats": []
}
```

---

### `POST /api/scan/phone`
Look up a phone number's scam reputation.

**Request**
```json
{ "phone": "+15550001234" }
```

**Response**
```json
{
  "risk": "suspicious",
  "reports": 47,
  "carrier": "Verizon",
  "location": "United States",
  "scam_types": ["IRS impersonation", "robocall"]
}
```

---

## 5. Technical Architecture

### Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, Vite 8, Tailwind CSS v4   |
| Backend   | FastAPI, Python 3.10+, Uvicorn      |
| Config    | pydantic-settings, `.env`           |
| Packaging | pip + venv (backend), npm (frontend) |

### Request Flow

```
Browser
  └─ React (pages/, components/, hooks/)
       └─ services/api.js  →  POST /api/scan/*
            └─ FastAPI (app/api/routes/)
                 └─ Services layer (app/services/)
                      ├─ VirusTotal API
                      ├─ Google Safe Browsing API
                      ├─ OpenPhish feed
                      └─ NumVerify / Twilio (phone)
```

### Backend Layout

```
backend/app/
├── main.py           — app factory, CORS, router mount
├── core/
│   └── config.py     — Settings (app name, origins, API keys via .env)
├── api/
│   ├── router.py     — aggregates all route groups
│   └── routes/
│       ├── health.py — GET /api/health
│       ├── link.py   — POST /api/scan/link
│       ├── text.py   — POST /api/scan/text
│       ├── file.py   — POST /api/scan/file
│       └── phone.py  — POST /api/scan/phone
├── schemas/
│   └── scan.py       — Pydantic request/response models
├── services/
│   ├── link_scanner.py
│   ├── text_scanner.py
│   ├── file_scanner.py
│   └── phone_lookup.py
└── models/           — DB models (if persistence is added)
```

### Frontend Layout

```
frontend/src/
├── pages/
│   └── Home.jsx          — tab-based scan UI
├── components/
│   └── ui/
│       ├── Button.jsx
│       ├── Input.jsx      — (to be created)
│       ├── Textarea.jsx   — (to be created)
│       └── ResultCard.jsx — (to be created)
├── services/
│   └── api.js            — fetch wrapper, reads VITE_API_URL
├── hooks/
│   └── useApi.js         — generic GET data-fetching hook
└── lib/
    └── utils.js          — cn() class utility
```

### External Integrations

| Service              | Purpose                        | Docs                                      |
|----------------------|--------------------------------|-------------------------------------------|
| VirusTotal API       | URL, file, and hash scanning   | https://docs.virustotal.com               |
| Google Safe Browsing | URL threat lookup              | https://developers.google.com/safe-browsing |
| OpenPhish            | Phishing URL feed              | https://openphish.com                     |
| NumVerify            | Phone number validation & info | https://numverify.com                     |

API keys should be stored in `backend/.env` (see `.env.example`).

---

## 6. Data Schemas

Pydantic models to be defined in `backend/app/schemas/scan.py`:

```python
# Requests
class LinkScanRequest(BaseModel):
    url: HttpUrl

class TextScanRequest(BaseModel):
    content: str

class PhoneScanRequest(BaseModel):
    phone: str

# Shared
class RiskLevel(str, Enum):
    safe       = "safe"
    suspicious = "suspicious"
    dangerous  = "dangerous"

# Responses
class LinkScanResponse(BaseModel):
    risk: RiskLevel
    score: float          # 0.0 – 1.0
    details: dict

class TextFlag(BaseModel):
    type: str
    excerpt: str
    link_risk: RiskLevel | None = None

class TextScanResponse(BaseModel):
    risk: RiskLevel
    score: float
    flags: list[TextFlag]

class FileScanResponse(BaseModel):
    risk: RiskLevel
    score: float
    file_hash: str
    threats: list[str]

class PhoneScanResponse(BaseModel):
    risk: RiskLevel
    reports: int
    carrier: str | None
    location: str | None
    scam_types: list[str]
```

---

## 7. Running Locally

See [README.md](README.md) for full setup instructions.

Quick start:
```bash
# Backend
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend && npm run dev
```
---

## 8. Chrome Extension Feature

### 8.1 Overview

The ScamAware Chrome Extension is a real-time security companion that monitors your browser activity and warns or blocks you before you interact with suspicious content. It runs in the background and scans:

1. **Links you click** — checks the destination URL before navigation
2. **Websites you visit** — analyzes the page URL on load
3. **Files you download** — scans before saving to disk

When the extension detects a suspicious or dangerous URL/file, it displays an interstitial warning page giving users the option to proceed or go back.

---

### 8.2 How It Works: User Flows

#### Link Click Interception
1. Content script listens for all `<a>` tag click events on every page
2. On click: prevents default navigation, extracts the `href`
3. Sends `{ type: 'SCAN_URL', url: href }` to the service worker via `chrome.runtime.sendMessage`
4. Service worker calls `POST /api/scan/link` with the URL
5. If `risk === 'safe'`: service worker responds with `{ safe: true }` and content script allows navigation
6. If `risk === 'suspicious'` or `'dangerous'`: service worker redirects the current tab to `warning.html?url=<encoded_url>&risk=<risk>&score=<score>`
7. Warning page shows the risk verdict with the option to **Go Back** or **Proceed Anyway**

#### Page Visit Scan
1. Service worker listens to `chrome.tabs.onUpdated` (fires when `status === 'loading'` and a `url` is present)
2. Checks the URL against the whitelist stored in `chrome.storage.sync` — skips whitelisted domains
3. Calls `POST /api/scan/link` with the tab URL
4. If dangerous: immediately redirects the tab to `warning.html` before page content fully loads
5. If safe: does nothing — browsing continues normally

#### File Download Scan
1. Service worker listens to `chrome.downloads.onCreated`
2. Extracts the source URL from the download item
3. Calls `POST /api/scan/link` with the download URL (checking the source, not the file itself)
4. If dangerous: calls `chrome.downloads.cancel(downloadId)` and opens a new tab with `warning.html?context=download&url=<url>&risk=<risk>`
5. If safe: download proceeds uninterrupted

---

### 8.3 File Structure

```
extension/
├── manifest.json                — MV3 config: permissions, service worker, content scripts
├── background/
│   └── service-worker.js        — core logic: URL scanning, tab interception, download monitoring
├── content/
│   └── content.js               — injected into every page; intercepts link clicks
├── warning/
│   ├── warning.html             — interstitial warning page shown to user
│   └── warning.js               — reads URL params, renders risk info, handles proceed/go back
├── popup/
│   ├── popup.html               — browser action popup UI
│   └── popup.js                 — shows current page status, toggle, scan history, settings
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

### 8.4 manifest.json

```json
{
  "manifest_version": 3,
  "name": "ScamAware",
  "version": "1.0.0",
  "description": "Real-time scam and phishing protection for your browser.",
  "permissions": [
    "tabs",
    "webNavigation",
    "downloads",
    "storage",
    "scripting",
    "notifications"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "web_accessible_resources": [
    {
      "resources": ["warning/warning.html"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

---

### 8.5 Service Worker Logic (`background/service-worker.js`)

The service worker is the brain of the extension. It never touches the DOM — it only handles messages, tab events, download events, and API calls.

**Responsibilities:**

| Trigger | Action |
|---|---|
| `chrome.runtime.onMessage` (`SCAN_URL`) | Called by content script on link click; runs scan and responds |
| `chrome.tabs.onUpdated` | Scans page URL on navigation; redirects if dangerous |
| `chrome.downloads.onCreated` | Scans download source URL; cancels if dangerous |

**Key helpers to implement:**

```js
// Calls the ScamAware backend
async function scanUrl(url) { ... }

// Redirects a tab to the warning interstitial
function redirectToWarning(tabId, url, risk, score) { ... }

// Checks chrome.storage.sync for user-whitelisted domains
async function isWhitelisted(url) { ... }

// In-memory cache: { [url]: { risk, score, timestamp } }
// Prevents re-scanning the same URL within a short window (e.g. 5 minutes)
const scanCache = new Map();
```

**Scan cache:** Every URL result is cached in memory for 5 minutes. This prevents hammering the API when a user refreshes a page or a site has many internal links from the same domain.

---

### 8.6 Content Script Logic (`content/content.js`)

Injected into every page at `document_idle`. Listens for clicks on any `<a>` element using event delegation on `document`.

```js
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a');
  if (!anchor || !anchor.href) return;

  const url = anchor.href;
  if (!url.startsWith('http')) return; // ignore mailto:, javascript:, etc.

  e.preventDefault();

  chrome.runtime.sendMessage({ type: 'SCAN_URL', url }, (response) => {
    if (response?.safe) {
      window.location.href = url; // allow navigation
    }
    // if not safe, service worker already handled the redirect
  });
});
```

The content script is intentionally thin — no API calls, no risk logic. All decisions are made in the service worker.

---

### 8.7 Warning Page (`warning/warning.html` + `warning.js`)

A self-contained HTML page bundled inside the extension. It is shown by redirecting the current tab to:

```
chrome-extension://<extension-id>/warning/warning.html?url=<encoded_url>&risk=<risk>&score=<score>&context=<link|page|download>
```

**UI elements:**
- ScamAware logo and header
- Risk badge: color-coded (`safe` = teal, `suspicious` = amber, `dangerous` = red)
- The scanned URL displayed in a truncated monospace block
- Confidence score
- Two action buttons:
  - **Go Back** — calls `history.back()` or closes the tab (for downloads)
  - **Proceed Anyway** — navigates directly to the original URL, bypassing the scan

`warning.js` reads the query params via `URLSearchParams` and populates the page dynamically. No framework — plain JS only for fast load.

---

### 8.8 Popup (`popup/popup.html` + `popup.js`)

Opened when the user clicks the extension icon in the toolbar.

**Sections:**
1. **Current Page Status** — shows the risk badge for the active tab's URL (cached result, or "Not yet scanned")
2. **Enable / Disable toggle** — pauses all interception; stored in `chrome.storage.sync`
3. **Recent Scans** — last 10 URLs scanned with their risk level, stored in `chrome.storage.local`
4. **Settings link** — opens an options page or inline panel where the user can:
   - Change the API base URL (default: `http://localhost:8000/api`)
   - Manage the whitelist (add/remove domains)

---

### 8.9 Storage Schema

All stored via Chrome's `storage` API.

| Key | Storage | Type | Description |
|---|---|---|---|
| `enabled` | `sync` | `boolean` | Whether the extension is active |
| `apiUrl` | `sync` | `string` | Backend base URL |
| `whitelist` | `sync` | `string[]` | User-approved domains (e.g. `["google.com"]`) |
| `recentScans` | `local` | `ScanRecord[]` | Last 10 scan results |

```ts
type ScanRecord = {
  url: string;
  risk: 'safe' | 'suspicious' | 'dangerous';
  score: number;
  scannedAt: number; // unix ms timestamp
  context: 'link' | 'page' | 'download';
};
```

---

### 8.10 API Communication

The extension calls the same backend as the web app. The base URL is configurable and stored in `chrome.storage.sync` under `apiUrl`.

- **Default (dev):** `http://localhost:8000/api`
- **Default (prod):** set to the deployed backend URL before publishing

All calls from the service worker use `fetch`. No SDK or bundler is needed — the extension is plain JS (no build step required for MVP).

The only endpoint used by the extension at launch is:

```
POST <apiUrl>/scan/link   — used for link clicks, page visits, and download source URLs
```

File hash scanning (`POST /api/scan/file`) is a **v2 feature** — the extension currently checks the download source URL rather than hashing the file bytes (which would require reading the file after download via `chrome.downloads.search`).

---

### 8.11 Permissions Rationale

| Permission | Why it's needed |
|---|---|
| `tabs` | Read the active tab's URL to display status in the popup |
| `webNavigation` | (Optional) Fallback listener for page navigation events |
| `downloads` | Listen to `onCreated` to intercept file downloads |
| `storage` | Persist `enabled` toggle, API URL, whitelist, and scan history |
| `scripting` | Dynamically inject content scripts if needed |
| `notifications` | (Optional) Show a system notification when a download is blocked |
| `host_permissions: <all_urls>` | Required to call `fetch` from the service worker to any URL and to inject content scripts on all pages |

---

### 8.12 Development & Loading

```bash
# No build step required for MVP — the extension is plain JS

# 1. Open Chrome and navigate to:
chrome://extensions

# 2. Enable "Developer mode" (top-right toggle)

# 3. Click "Load unpacked" and select the /extension folder

# 4. Make sure the backend is running:
cd backend && uvicorn app.main:app --reload

# 5. The extension will call http://localhost:8000/api by default
#    Change the API URL in the popup settings if needed
```

After any change to `service-worker.js`, click the **refresh icon** on the extension card in `chrome://extensions` to reload the service worker.

---

### 8.13 Limitations & v2 Roadmap

| Limitation | v2 Plan |
|---|---|
| Only checks download source URL, not file content | After download completes, hash the file and call `POST /api/scan/file` |
| Warning page can be bypassed by typing the URL directly | Add a `declarativeNetRequest` ruleset for known-bad domains |
| Scan cache is in-memory and lost on service worker restart | Move cache to `chrome.storage.session` |
| No feedback mechanism | "Was this helpful?" button on warning page that sends signal to backend |
| Extension only supports Chrome | Port to Firefox using WebExtensions API (mostly compatible) |