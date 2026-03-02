from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os, shutil, uuid
from app.utils.ocr import extract_text, build_paragraphs_and_sentences_from_text
from app.utils.tts import init_tts_engine, generate_word_level_tts, combine_word_level_segments

os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

app = FastAPI(title="OCR-TTS API", description="API for OCR and Text-to-Speech conversion")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tts_engine = None

@app.on_event("startup")
async def startup_event():
    global tts_engine
    try:
        tts_engine = init_tts_engine()
    except Exception as e:
        print(f"Warning: Could not initialize TTS engine: {e}")
        print("TTS functionality will be unavailable")

@app.get("/")
async def root():
    return {"message": "OCR-TTS API is running"}

@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    file_path = f"uploads/{file_id}_{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        extracted_text = extract_text(file_path)
        paragraphs = build_paragraphs_and_sentences_from_text(extracted_text)
        return {"file_id": file_id, "text": extracted_text, "paragraphs": paragraphs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing error: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/ocr-tts")
async def ocr_to_tts(file: UploadFile = File(...), speaker_name: str = "female"):
    if tts_engine is None:
        raise HTTPException(status_code=503, detail="TTS engine not available")
    file_id = str(uuid.uuid4())
    file_path = f"uploads/{file_id}_{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        extracted_text = extract_text(file_path)
        paragraphs = build_paragraphs_and_sentences_from_text(extracted_text)
        # Generate word-level TTS segments (each tagged with paragraph & sentence indices)
        sentence_meta = generate_word_level_tts(paragraphs, tts_engine, base_folder="tts_word_segments")
        # Combine all sentence audio segments into one WAV and compute detailed metadata
        output_audio, merged_metadata = combine_word_level_segments(
            sentence_meta, output_file=f"outputs/{file_id}_combined_audio.wav"
        )
        return {
            "file_id": file_id,
            "text": extracted_text,
            "paragraphs": paragraphs,
            "audio_url": f"/download/{file_id}_combined_audio.wav",
            "merged_data": merged_metadata
        }
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = f"outputs/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Range",
        "Accept-Ranges": "bytes",
        "Content-Disposition": f"attachment; filename={filename}"
    }
    return FileResponse(
        path=file_path,
        media_type="audio/wav",
        filename=filename,
        headers=headers
    )
