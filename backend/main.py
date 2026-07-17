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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(analytics_router)
app.include_router(tickets_router)


@app.get("/api/health", tags=["system"])
async def health():
    db_ok = await ping()
    return {
        "status": "ok",
        "database_connected": db_ok,
        "knowledge_base_chunks_indexed": getattr(app.state, "chunks_indexed", 0),
        "llm_provider": settings.LLM_PROVIDER,
        "version": "2.0.0",
    }
