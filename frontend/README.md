# Frontend — TechMart Support UI

Next.js 14 chat UI connected to the FastAPI backend at `NEXT_PUBLIC_API_BASE_URL`.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Ensure the backend is running:

```bash
cd ../backend
uvicorn main:app --reload --port 8000
```

## Backend integration

| Feature | Frontend | Backend endpoint |
|---------|----------|------------------|
| Register / login | `hooks/useAuth.ts` | `POST /api/auth/register`, `/login` |
| User profile | `fetchMe()` | `GET /api/auth/me` |
| Send message | `hooks/useChat.ts` | `POST /api/chat` |
| Conversation history | `fetchHistory()` | `GET /api/chat/{session_id}/history` |
| Session list (signed-in) | `fetchSessions()` | `GET /api/chat/sessions` |
| Health / status | `BackendStatus` | `GET /api/health` |

Auth tokens are stored in `localStorage` and attached automatically via the Axios interceptor in `services/api.ts`.

Guest mode sets `techmart_guest=1` and skips auth; signed-in users get session history synced from the backend.

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The backend `ALLOWED_ORIGINS` must include your frontend URL (default: `http://localhost:3000`).

## Design

- **Signature element — Agent Pulse Strip**: a row of all five specialist
  agents (Billing, Technical, Product, Complaint, FAQ) that light up in real
  time as they're invoked for the current query — making the multi-agent
  architecture visible instead of hiding it behind a generic spinner.
- **Context drawer**: shows the RAG-retrieved passages and intent confidence
  behind the latest answer, for transparency into why the assistant said
  what it said.
- Color per agent is functional, not decorative — the same five colors are
  used consistently across the pulse strip, message badges, and sidebar
  legend, so color always means "which agent."
- Type: Space Grotesk (display), Inter (body), IBM Plex Mono (session IDs,
  retrieval scores).

## Structure

```
frontend/
├── app/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── chat/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── AgentPulseStrip.tsx   # signature live-status component
│   ├── MessageBubble.tsx
│   ├── TypingIndicator.tsx
│   ├── ContextDrawer.tsx
│   └── Sidebar.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useChat.ts
├── services/
│   └── api.ts                # typed Axios client for the FastAPI backend
└── tailwind.config.ts
```

## Setup

```bash
npm install
cp .env.local.example .env.local   # point at your backend, defaults to localhost:8000
npm run dev
```

Visit http://localhost:3000 — it redirects to `/chat`, which redirects to
`/login` if you're not signed in. "Continue as guest" skips auth entirely
for quick demoing (chat still works; history just isn't tied to an account).

## Connecting to the backend

Make sure the FastAPI backend (`../backend`) is running on the URL in
`.env.local` and that its `ALLOWED_ORIGINS` includes `http://localhost:3000`
(it does, by default).

## Deployment

Deploy to Vercel as usual (`vercel deploy`); set
`NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL as an environment
variable in the Vercel project settings.
