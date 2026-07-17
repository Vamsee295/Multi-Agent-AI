# 🤖 Multi-Agent AI Customer Support Assistant — Backend

FastAPI backend powering a multi-agent AI customer support system. Routes customer queries to specialized agents (Billing, Technical, Product, Complaint, FAQ) using intent detection, retrieves relevant company knowledge via RAG (FAISS + sentence-transformers), and synthesizes answers through a pluggable LLM layer.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Web Framework** | [FastAPI](https://fastapi.tiangolo.com/) `0.115` | REST API, OpenAPI docs, dependency injection |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) `0.30` | Async server for running FastAPI |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev/) + [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) | Request/response schemas, env config |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Motor](https://motor.readthedocs.io/) (async) | User accounts + conversation history |
| **Authentication** | [PyJWT](https://pyjwt.readthedocs.io/) + [passlib[bcrypt]](https://passlib.readthedocs.io/) | JWT access tokens, password hashing |
| **Embeddings** | [sentence-transformers](https://www.sbert.net/) (`all-MiniLM-L6-v2`) | Local, free, offline vector embeddings |
| **Vector Store** | [FAISS](https://faiss.ai/) (`faiss-cpu`) | In-process cosine-similarity search over knowledge base |
| **PDF Parsing** | [pypdf](https://pypdf.readthedocs.io/) | Reading PDF documents from the knowledge base |
| **LLM Providers** | [OpenAI](https://platform.openai.com/), [Google Gemini](https://ai.google.dev/), [Groq](https://groq.com/) | Pluggable answer generation (also has a built-in mock mode) |
| **Testing** | [pytest](https://docs.pytest.org/) | Unit tests for intent detection, RAG pipeline, router |

---

## 📁 Folder Structure

```
backend/
├── api/
│   ├── auth.py          # /api/auth/register, /login, /me
│   └── chat.py          # /api/chat (POST) + /api/chat/{id}/history (GET)
├── agents/
│   ├── intent_detection.py  # Keyword + LLM intent classifier
│   ├── router.py            # Routes to 1+ agents, aggregates answers
│   ├── aggregator.py        # LLM response synthesis for multi-agent queries
│   ├── prompts.py           # Centralized prompt templates
│   ├── base_agent.py        # Shared run() → RAG + LLM
│   ├── billing.py           # Billing specialist agent
│   ├── technical.py         # Technical support agent
│   ├── product.py           # Product info agent
│   ├── complaint.py         # Complaint & escalation agent
│   ├── faq.py               # General FAQ agent
│   ├── llm_client.py        # OpenAI / Gemini / Groq / Mock adapter
│   └── memory.py            # Conversation history summarizer
├── rag/
│   ├── pipeline.py          # Ingest knowledge base + retrieve top-k chunks
│   └── chunker.py           # Sliding-window text chunker
├── embeddings/
│   └── embedder.py          # sentence-transformers wrapper (lru_cache)
├── vectorstore/
│   └── faiss_store.py       # FAISS IndexFlatIP build/save/load/search
├── database/
│   └── mongo.py             # Motor async client + in-memory mock fallback
├── models/
│   ├── schemas.py           # Pydantic DTOs (ChatRequest, ChatResponse, etc.)
│   └── user.py              # MongoDB document helpers
├── auth/
│   └── security.py          # JWT encode/decode, bcrypt hash/verify
├── knowledge_base/          # .txt / .pdf documents (auto-ingested on startup)
│   ├── faq.txt
│   ├── pricing.txt
│   ├── products.txt
│   ├── refund_policy.txt
│   ├── shipping_policy.txt
│   ├── user_manual.txt
│   ├── installation_guide.txt
│   └── warranty.txt
├── tests/
│   ├── conftest.py          # Shared fixtures (mock embeddings)
│   ├── test_intent_detection.py
│   ├── test_rag_pipeline.py
│   └── test_router.py
├── scripts/
│   └── evaluate_retrieval.py # Precision@k evaluation script
├── main.py                  # App entry point + lifespan (startup/shutdown)
├── config.py                # Centralized settings via pydantic-settings
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.11+
- MongoDB 7 (optional — server falls back to an in-memory mock if unavailable)

### 1. Clone & Create a Virtual Environment

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` as needed. Key variables:

```env
# Required: change this before deploying!
JWT_SECRET_KEY=replace_with_a_long_random_secret

# MongoDB (leave as-is for local; server uses in-memory mock if unreachable)
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=customer_support_ai

# LLM Provider: mock (default) | openai | gemini | groq
LLM_PROVIDER=mock
OPENAI_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. (Optional) Start MongoDB with Docker

```bash
docker run -d -p 27017:27017 --name support-mongo mongo:7
```

> **Without MongoDB:** The server automatically falls back to an in-memory mock database. All features work, but data is lost when the server restarts.

---

## 🚀 Running the Server

```bash
# Development (auto-reload on file changes)
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

On startup, all documents in `knowledge_base/` are automatically chunked, embedded, and loaded into FAISS — no manual ingestion step needed.

| Endpoint | URL |
|---|---|
| Health Check | http://localhost:8000/api/health |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## 🐋 Running with Docker Compose

```bash
# From the backend directory
docker compose up --build
```

This spins up both the FastAPI server (port 8000) and MongoDB (port 27017).

---

## 🧪 Running Tests

```bash
# Run all tests (embeddings are mocked — works offline, no model download)
pytest tests/ -v

# Run a single test file
pytest tests/test_intent_detection.py -v

# Evaluate real retrieval quality (requires model + internet on first run)
python scripts/evaluate_retrieval.py
```

**Test coverage:**
- Intent detection (single and multi-intent queries)
- Text chunking with overlap
- RAG ingestion and top-k retrieval
- Agent routing, multi-agent aggregation
- Escalation logic

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Log in, returns a JWT |
| `GET` | `/api/auth/me` | Get current user profile (requires Bearer token) |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message (guest or authenticated) |
| `GET` | `/api/chat/sessions` | List chat sessions for the authenticated user |
| `GET` | `/api/chat/{session_id}/history` | Retrieve full conversation history (guest or owner) |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server + DB status, chunks indexed, LLM provider |

### Quick curl Examples

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login (save the token)
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Chat — multi-agent query (billing + technical)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"I paid yesterday but my Premium features are still locked"}'

# Chat — guest (no token needed)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is your refund policy?"}'
```

---

## 🧠 Architecture Notes

### AI Agent Pipeline

```
Customer message
      │
      ▼
Intent Detection Agent  (keyword offline / LLM when provider configured)
      │
      ▼
Agent Router  ──► Billing │ Technical │ Product │ Complaint │ FAQ
      │              (run in parallel via ThreadPoolExecutor)
      ▼
Each agent:  build_agent_query → RAG retrieve → format context → LLM generate
      │
      ▼
Response Aggregator  (LLM synthesis, or labeled sections in mock mode)
      │
      ▼
Final response (+ escalation flag if needed)
```

- **Intent detection** (`agents/intent_detection.py`): Keyword scoring for offline/mock mode. When `LLM_PROVIDER` is `openai`, `gemini`, or `groq`, uses LLM JSON classification (`INTENT_DETECTION_MODE=hybrid|llm|keyword`).
- **Specialized agents** (`agents/*.py`): Each agent has a domain-specific system prompt, preferred KB sources, and RAG query expansion via `build_agent_query()`.
- **Response aggregator** (`agents/aggregator.py`): Merges multi-agent answers into one reply. Real LLM providers get a synthesized answer; mock mode keeps visible `**Billing Agent:**` headers for demos.
- **Prompt templates** (`agents/prompts.py`): Centralized prompts for intent classification, all five agents, and aggregation.

### RAG Pipeline

- **Ingestion**: `knowledge_base/*.txt|*.pdf` → chunk → embed (sentence-transformers) → FAISS index. Hash-based manifest skips re-ingestion when files are unchanged.
- **Retrieval**: Cosine similarity search with agent-scoped source prioritization and optional `RETRIEVAL_SCORE_THRESHOLD` filtering.
- **Context formatting**: Retrieved chunks include source filename and relevance score so the LLM can cite policies accurately.
- **Mock mode**: Set `LLM_PROVIDER=mock` to run the full pipeline offline with no API keys. Responses summarize retrieved knowledge base passages with source attribution.
- **Escalation**: Automatically triggered when the complaint agent fires with low confidence, or when overall intent confidence is below 45%. Open escalations are persisted in MongoDB (`escalations` collection).
- **Session access control**: Guest sessions remain accessible by session ID. Authenticated sessions require a matching bearer token to read history or continue the conversation.
- **Conversation memory**: Recent turns are passed verbatim to agents; older turns are summarized automatically after 14 turns.
