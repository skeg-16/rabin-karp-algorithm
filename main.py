from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import io
from pypdf import PdfReader

# Ini-import natin yung algorithm na ginawa natin kanina
from enhanced_rabinkarp import check_plagiarism

app = FastAPI(
    title="Enhanced Rabin-Karp API",
    description="Cross-Lingual Plagiarism Detection Backend for Tagalog-English text.",
    version="1.0.0"
)

# ─────────────────────────────────────────────────────────────────────────────
# CORS CONFIGURATION (Super important for React integration)
# ─────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Sa deployment, papalitan natin 'to ng exact URL ng React app mo.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
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
    return {"message": "Enhanced Rabin-Karp API is running. Go to /docs to test."}

@app.post("/api/analyze")
def analyze_text(request: PlagiarismRequest):
    """
    Tumatanggap ng Source at Suspect text mula sa Frontend,
    pinapadaan sa pre-processing, at ibinabalik ang similarity score.
    """
    # ENHANCEMENT: Word Count Limit (SOP Performance)
    # 2.5k words is equivalent to around 8-10 pages of academic text.
    WORD_LIMIT = 2500
    
    source_words = len(request.source_text.split())
    suspect_words = len(request.suspect_text.split())
    
    if source_words > WORD_LIMIT or suspect_words > WORD_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Word limit exceeded! Maximum allowed is {WORD_LIMIT} words. "
                   f"Your input: Source ({source_words} words), Suspect ({suspect_words} words)."
        )

    result = check_plagiarism(
        source=request.source_text,
        suspect=request.suspect_text,
        window=request.window_size
    )
    
    return result

@app.post("/api/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
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
        print(f"Extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF: {str(e)}")