# BongoShruti - Bengali Assistive Reader

An assistive OCR and Text-to-Speech application for Bengali text. Upload or capture an image containing Bengali script, and BongoShruti will extract the text and read it aloud with word-level navigation.

## Demo

A pre-built Windows executable is available in the [Releases](../../releases) section for quick testing without any setup.

## Features

- **Bengali OCR** - Extract Bengali text from images using Tesseract OCR
- **Text-to-Speech** - Convert extracted Bengali text to natural speech using a custom FastPitch + HiFi-GAN TTS pipeline
- **Word-level Navigation** - Jump between words, sentences, and paragraphs during audio playback
- **Webcam Capture** - Capture images directly from your webcam
- **Image Upload** - Upload existing images for processing
- **Keyboard-driven Playback** - Full keyboard control for accessibility:
  - `Space` - Play / Pause
  - `Arrow Right / Left` - Next / Previous Word
  - `Arrow Down / Up` - Next / Previous Sentence
  - `PageDown / PageUp` - Next / Previous Paragraph
  - `Shift + Arrow Right / Left` - Skip +5s / -5s
  - `= / -` - Increase / Decrease playback speed

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI server with OCR + TTS endpoints
│   │   ├── utils/
│   │   │   ├── ocr.py       # Bengali OCR with paragraph/sentence splitting
│   │   │   └── tts.py       # TTS engine, word-level timing, audio combining
│   │   └── models/          # Model config files (weights not included)
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── AudioPlayer.js    # Keyboard-navigable audio player
│   │   │   ├── ImageCapture.js   # Webcam + file upload component
│   │   │   ├── TextDisplay.js    # Extracted text display
│   │   │   └── VoiceGuidance.js  # Voice guidance overlay
│   │   └── services/
│   │       └── api.js            # API client
│   └── package.json
└── README.md
```

## Setup and Installation

### Prerequisites

- Python 3.9+
- Node.js 16+
- Tesseract OCR with Bengali language support
- TTS model weights (FastPitch + HiFi-GAN for Bengali)

### Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The API server starts at `http://localhost:8000`.

**Tesseract installation:**
- macOS: `brew install tesseract tesseract-lang`
- Ubuntu: `sudo apt install tesseract-ocr tesseract-ocr-ben`
- Windows: Download from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki) and add Bengali traineddata

**Model weights:** Place the TTS model files in `models/v1/bn/`:
- `fastpitch/best_model_fp.pth` + `speakers.pth`
- `hifigan/best_model.pth`

### Frontend

```bash
cd frontend
npm install
npm start
```

The React app starts at `http://localhost:3000` and proxies API requests to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ocr` | Extract text from an uploaded image |
| `POST` | `/ocr-tts` | OCR + TTS pipeline (returns audio URL + word-level metadata) |
| `GET` | `/download/{filename}` | Download generated audio file |

## Tech Stack

**Backend:** FastAPI, PyTesseract, Coqui TTS (FastPitch + HiFi-GAN), PyTorch, NumPy, SciPy

**Frontend:** React 18, Axios, React Webcam

## License

This project is for educational and research purposes.
