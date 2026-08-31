"""
Application entry point.

Run locally:
    uvicorn main:app --reload --port 8000

Docs available at /docs (Swagger) and /redoc.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database.mongo import ensure_indexes, ping
from api.auth import router as auth_router
from api.chat import router as chat_router
from api.analytics import router as analytics_router
from api.tickets import router as tickets_router
from api.kb import router as kb_router
from rag.pipeline import ingest_knowledge_base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if await ping():
        await ensure_indexes()
    chunks_indexed = ingest_knowledge_base()
    app.state.chunks_indexed = chunks_indexed
    yield
    # Shutdown (nothing to clean up currently)


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Multi-Agent AI Customer Support Assistant using RAG and LLMs — Capstone Edition",
    lifespan=lifespan,
)

# Parse allowed origins with defaults for local development
configured_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
default_dev_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]
allowed_origins = list(dict.fromkeys(configured_origins + default_dev_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(analytics_router)
app.include_router(tickets_router)
app.include_router(kb_router)


@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"])
async def health():
    db_ok = await ping()
    
    llm_model = "mock-model"
    if settings.LLM_PROVIDER == "groq":
        llm_model = settings.GROQ_MODEL
    elif settings.LLM_PROVIDER == "openai":
        llm_model = settings.OPENAI_MODEL
    elif settings.LLM_PROVIDER == "gemini":
        llm_model = "gemini-1.5-flash"

    return {
        "status": "ok",
        "database_connected": db_ok,
        "knowledge_base_chunks_indexed": getattr(app.state, "chunks_indexed", 0),
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": llm_model,
        "version": "2.0.0",
    }
