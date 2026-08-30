# Multi-Agent AI Customer Support Assistant — Deployment Guide

This guide documents the complete production deployment procedure for the **Multi-Agent AI Customer Support Assistant** across **Vercel** (Next.js Frontend), **Container Host** (FastAPI Backend on Render / Railway / Docker), **Supabase Auth**, and **MongoDB Atlas**.

---

## Architecture Overview

```
                                  [ USER BROWSER ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
         HTTPS (Page Requests)                       HTTPS (API Calls + Bearer JWT)
                   │                                           │
                   ▼                                           ▼
      ┌─────────────────────────┐                 ┌─────────────────────────┐
      │     VERCEL (Frontend)   │                 │     RENDER / RAILWAY    │
      │   - Next.js 14 (App)    │                 │    (FastAPI Backend)    │
      │   - Global Edge CDN     │                 │   - Multi-Agent Routing │
      │   - Client UI / SSR     │                 │   - CPU PyTorch / FAISS │
      └────────────┬────────────┘                 │   - JWT Verification    │
                   │                              └────────────┬────────────┘
         Supabase Auth SDK                                     │
                   │                                     Motor Async Driver
                   ▼                                           ▼
      ┌─────────────────────────┐                 ┌─────────────────────────┐
      │      SUPABASE AUTH      │                 │      MONGODB ATLAS      │
      │  - User Management      │                 │  - Free M0 Cluster      │
      │  - JWT Token Issuance   │                 │  - Sessions & Messages  │
      │  - Email Verification   │                 │  - Escalation Tickets   │
      └─────────────────────────┘                 └─────────────────────────┘
```

---

## 1. Prerequisites & Cloud Accounts

* **Supabase**: Free account (Auth enabled).
* **MongoDB Atlas**: Free M0 cluster created.
* **LLM Provider**: API key from Groq (recommended free tier), OpenAI, or Google Gemini.
* **Render / Railway / Fly.io**: Account for containerized backend hosting.
* **Vercel**: Account for Next.js frontend hosting.

---

## 2. Backend Deployment (Docker Container)

### A. Local Docker Build & Run (Testing)
```bash
# Build the production image
docker build -t multi-agent-ai-backend backend/

# Run container locally with environment file
docker run -d --name multi-agent-ai-backend -p 8000:8000 --env-file backend/.env multi-agent-ai-backend

# Check container health
curl http://localhost:8000/health
```

### B. Cloud Container Deployment (Render / Railway)
1. In your cloud container host (e.g. Render Web Services):
   - **Repository**: Connect your GitHub repository.
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Start Command**: Handled automatically by `Dockerfile` (`uvicorn main:app --host 0.0.0.0 --port $PORT`).
2. Configure **Environment Variables** in the dashboard:

| Variable | Required | Example / Description |
|---|---|---|
| `ENV` | Yes | `production` |
| `PORT` | Auto | Assigned automatically by cloud host |
| `MONGO_URI` | Yes | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority` |
| `MONGO_DB_NAME` | Yes | `customer_support_ai` |
| `SUPABASE_URL` | Yes | `https://<your-project-id>.supabase.co` |
| `SUPABASE_JWT_SECRET` | Recommended | JWT secret from Supabase Project Settings ➔ API |
| `SUPABASE_AUDIENCE` | Optional | `authenticated` |
| `LLM_PROVIDER` | Yes | `groq` (or `openai` / `gemini`) |
| `GROQ_API_KEY` | If Groq | `gsk_...` |
| `GROQ_MODEL` | If Groq | `llama-3.3-70b-versatile` |
| `ALLOWED_ORIGINS` | Yes | `https://<your-vercel-domain>.vercel.app` |

3. Copy your live backend URL once deployed (e.g., `https://customer-support-backend.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

1. Import your GitHub repository into **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Configure **Environment Variables** in Vercel:

| Variable | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://customer-support-backend.onrender.com` | Live deployed backend URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-id>.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOi...` | Supabase Anon Publishable Key |

4. Deploy. Vercel will automatically build and distribute the Next.js application across its global Edge CDN.

---

## 4. Post-Deployment Linking & Verification

1. **Update Backend CORS**:
   - Go to your backend container settings on Render/Railway.
   - Update `ALLOWED_ORIGINS` to match your production Vercel URL:
     ```
     ALLOWED_ORIGINS=https://customer-support-ai.vercel.app
     ```
2. **Verify Live Endpoints**:
   - **Health**: `https://<backend-url>/health` ➔ `200 OK`
   - **Swagger Docs**: `https://<backend-url>/docs` ➔ `200 OK`
   - **App Interface**: Open `https://<frontend-url>` in browser.
   - **Authentication**: Sign up or log in with Supabase Auth.
   - **Multi-Agent Chat**: Send questions across billing, technical, and product domains.
