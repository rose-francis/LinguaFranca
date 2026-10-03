# main.py
from fastapi import FastAPI, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
from auth import router as auth_router
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found")

# List of models to try in order (from fastest to most reliable)
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-pro-latest",
]

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_WHISPER_MODEL = "whisper-large-v3-turbo"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lingua-franca-frontend.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslateRequest(BaseModel):
    text: str
    source: str
    target: str

def call_gemini_with_retry(model_name: str, payload: dict, max_retries: int = 2) -> dict:
    """Try calling Gemini API with retries for rate limiting"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                url,
                params={"key": GEMINI_API_KEY},
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            
            # If 503 (overloaded) or 429 (rate limit), wait and retry
            if response.status_code in [503, 429] and attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2  # 2, 4 seconds
                logger.warning(f"Model {model_name} returned {response.status_code}, retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            # For other errors, raise immediately
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Gemini API error: {response.text}"
            )
            
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                logger.warning(f"Request failed, retrying: {str(e)}")
                time.sleep(2)
                continue
            raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    
    raise HTTPException(status_code=503, detail="Service temporarily unavailable")

@app.post("/translate")
def translate(req: TranslateRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    prompt = (
        f"Translate the following text from {req.source} to {req.target}. "
        f"Return ONLY the translated text without any explanations or notes.\n\n{req.text}"
    )

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    # Try each model in order until one works
    last_error = None
    
    for model_name in GEMINI_MODELS:
        try:
            logger.info(f"Trying model: {model_name}")
            data = call_gemini_with_retry(model_name, payload)
            
            # Parse the response
            if "candidates" not in data or not data["candidates"]:
                logger.warning(f"Model {model_name} returned no candidates")
                continue

            candidate = data["candidates"][0]
            
            if "content" not in candidate:
                finish_reason = candidate.get("finishReason", "UNKNOWN")
                logger.warning(f"Model {model_name} - No content. Reason: {finish_reason}")
                continue

            translated_text = candidate["content"]["parts"][0]["text"]
            logger.info(f"✅ Translation successful with {model_name}!")
            return {"translatedText": translated_text.strip()}
            
        except HTTPException as e:
            logger.warning(f"Model {model_name} failed: {e.detail}")
            last_error = e.detail
            # Try next model
            continue
        except Exception as e:
            logger.warning(f"Model {model_name} error: {str(e)}")
            last_error = str(e)
            continue
    
    # If all models failed
    raise HTTPException(
        status_code=503,
        detail=f"All models are currently unavailable. Please try again in a moment. Last error: {last_error}"
    )

@app.post("/speech")
async def speech_to_text(
    audio: UploadFile,
    source: str = Form(...),
    target: str = Form(...)
):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio file provided")

    data = {"model": GROQ_WHISPER_MODEL, "response_format": "json"}
    # Whisper auto-detects the language when none is given
    if source and source != "auto":
        data["language"] = source

    try:
        response = requests.post(
            GROQ_TRANSCRIBE_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            files={"file": (audio.filename or "speech.webm", audio_bytes, audio.content_type or "audio/webm")},
            data=data,
            timeout=60
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")

    if response.status_code != 200:
        logger.warning(f"Groq Whisper error {response.status_code}: {response.text}")
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Groq transcription error: {response.text}"
        )

    text = response.json().get("text", "")
    logger.info("✅ Transcription successful with Groq Whisper!")
    return {"transcript": text.strip()}


app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "Backend is running"}