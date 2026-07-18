"""
Knowledge Base API — upload documents and re-index vector store.
"""
import os
import glob
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from config import get_settings
from auth.security import get_current_user_id
from rag.pipeline import ingest_knowledge_base
from models.schemas import KBFileInfo

router = APIRouter(prefix="/api/kb", tags=["kb"])

@router.get("/files", response_model=list[KBFileInfo])
async def list_files(user_id: str = Depends(get_current_user_id)):
    """List currently indexed files in the knowledge base directory."""
    settings = get_settings()
    kb_dir = settings.KNOWLEDGE_BASE_DIR
    
    paths = sorted(
        glob.glob(os.path.join(kb_dir, "*.txt"))
        + glob.glob(os.path.join(kb_dir, "*.pdf"))
    )
    
    files = []
    for path in paths:
        try:
            stat = os.stat(path)
            files.append(
                KBFileInfo(
                    filename=os.path.basename(path),
                    size_bytes=stat.st_size,
                    modified_at=datetime.fromtimestamp(stat.st_mtime)
                )
            )
        except Exception:
            pass
            
    return files

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload a new PDF or TXT document and trigger re-indexing."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".txt", ".pdf"]:
        raise HTTPException(status_code=400, detail="Only .txt and .pdf files are supported")
        
    settings = get_settings()
    kb_dir = settings.KNOWLEDGE_BASE_DIR
    os.makedirs(kb_dir, exist_ok=True)
    
    file_path = os.path.join(kb_dir, os.path.basename(file.filename))
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        # Rebuild index
        chunks_indexed = ingest_knowledge_base()
        
        return {
            "status": "success",
            "message": f"Successfully uploaded {file.filename} and re-indexed vector store.",
            "chunks_indexed": chunks_indexed
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
