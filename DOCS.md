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
