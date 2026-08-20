from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import io
import os
import logging
from pypdf import PdfReader
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

# Ini-import natin yung algorithm na ginawa natin kanina
from api.enhanced_rabinkarp import check_plagiarism

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="Enhanced Rabin-Karp API",
    description="Cross-Lingual Plagiarism Detection Backend for Tagalog-English text.",
    version="1.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─────────────────────────────────────────────────────────────────────────────
# CORS CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
# Sa deployment, papalitan natin 'to ng exact URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# DATA MODELS (Pydantic)
# ─────────────────────────────────────────────────────────────────────────────
class PlagiarismRequest(BaseModel):
    source_text: str
    suspect_text: str
    window_size: int = 5

# ─────────────────────────────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "online", "message": "Enhanced Rabin-Karp API is secure and running."}

# @limiter.limit("10/minute")
@app.post("/api/analyze")
def analyze_text(request: Request, body: PlagiarismRequest):
    """
    Tumatanggap ng Source at Suspect text mula sa Frontend,
    pinapadaan sa pre-processing, at ibinabalik ang similarity score.
    """
    # Security: Strict validation for window_size
    window_size = body.window_size
    if not (1 <= window_size <= 10):
        raise HTTPException(status_code=400, detail="Window size must be between 1 and 10.")
    # ENHANCEMENT: Word Count Limit (SOP Performance)
    # 2.5k words is equivalent to around 8-10 pages of academic text.
    WORD_LIMIT = 2500
    
    source_words = len(body.source_text.split())
    suspect_words = len(body.suspect_text.split())
    
    if source_words > WORD_LIMIT or suspect_words > WORD_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Word limit exceeded! Maximum allowed is {WORD_LIMIT} words. "
                   f"Your input: Source ({source_words} words), Suspect ({suspect_words} words)."
        )

    result = check_plagiarism(
        source=body.source_text,
        suspect=body.suspect_text,
        window=window_size
    )
    
    return result

# @limiter.limit("5/minute")
@app.post("/api/extract-pdf")
async def extract_pdf(request: Request, file: UploadFile = File(...)):
    """
    Higit na mas mabilis kaysa sa client-side extraction.
    Ginagamit ang pypdf para basahin ang content ng PDF sa memory.
    """
    try:
        content = await file.read()
        pdf_reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        return {"text": text.strip()}
    except Exception as e:
        logging.error(f"Extraction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF: {str(e)}")