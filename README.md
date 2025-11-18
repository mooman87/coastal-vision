# Coastal Vision — Next.js 15 + FastAPI

A clean starter for a realtor site with a floating chatbot.

## Prereqs
- Node.js 20+
- Python 3.11+
- (Optional) Docker Desktop

## Option A — Docker (recommended)
```bash
docker compose up --build
```
- Web: http://localhost:3000
- API: http://localhost:8000/docs

## Option B — Local
### 1) API
```bash
cd api
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### 2) Web
```bash
cd ../web
npm install
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # Windows PowerShell: $env:NEXT_PUBLIC_API_BASE_URL='http://localhost:8000'
npm run dev
```

## Customize
- Branding: `app/layout.tsx`, Navbar text, brand colors in `tailwind.config.ts`
- Listings: `app/listings/page.tsx` or hook up a DB/CMS
- Chat: replace rule-based in `api/main.py` with an LLM endpoint later