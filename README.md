# ScamAware

Detect and report scams.

## Project Structure

```
ScamAware/
├── backend/   FastAPI (Python)
└── frontend/  React + Vite + Tailwind
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+

---

## Backend

### Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Environment

```bash
cp .env.example .env
# Edit .env as needed
```

### Run

```bash
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

## Frontend

### Setup

```bash
cd frontend
npm install
```

### Environment

```bash
cp .env.example .env.local
# Edit .env.local as needed
```

### Run

```bash
npm run dev
```

App runs at `http://localhost:5173`

### Build

```bash
npm run build
```

---

## Running Both Together

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend && npm run dev
```
