# BongoShruti — Bengali Assistive Reader

**An end-to-end assistive reading system that converts Bengali printed text into navigable speech.**

BongoShruti takes an image containing Bengali script — captured via webcam or uploaded as a file — runs OCR to extract the text, and synthesizes natural-sounding speech with precise word-level timing. The audio player supports full keyboard navigation across words, sentences, and paragraphs, making the system accessible to visually impaired users.

> Poster presented at **EMPOWER 2025**, IIT Delhi.
> Developed in collaboration with **Jadavpur University** and **IIT Kharagpur**.
> User studies conducted with **204 visually impaired students**.

---

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Architecture](#architecture)
- [Keyboard Controls](#keyboard-controls)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)
- [Authors](#authors)
- [License](#license)

---

## Demo

A pre-built **Windows executable** is available for quick testing — no setup required.

**Download:** [Releases page](../../releases)

---

## Features

| Feature | Description |
|---------|-------------|
| **Bengali OCR** | Extracts Bengali text from images using Tesseract with custom paragraph and sentence segmentation |
| **Neural TTS** | Converts Bengali text to speech using a FastPitch + HiFi-GAN pipeline trained on Bengali data |
| **Word-level Timing** | Computes per-word timestamps, enabling precise navigation within the generated audio |
| **Webcam Capture** | Capture images directly from the browser — no external tools needed |
| **Accessible Playback** | Fully keyboard-driven audio player designed for screen-reader compatibility |
| **Playback Speed Control** | Adjustable speech rate for comfortable listening |

---

## Architecture

```
                    +------------------+
                    |   React Frontend |
                    |   (port 3000)    |
                    +--------+---------+
                             |
                       Image upload /
                       Webcam capture
                             |
                    +--------v---------+
                    |   FastAPI Backend |
                    |   (port 8000)    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+          +--------v--------+
     |   Tesseract OCR  |          |   Coqui TTS     |
     |   (Bengali)       |          |   FastPitch +    |
     |                   |          |   HiFi-GAN       |
     +--------+--------+          +--------+--------+
              |                             |
              v                             v
     Paragraphs & Sentences       Word-level audio segments
              |                             |
              +-------------+---------------+
                            |
                            v
                  Combined audio + metadata
                  (word/sentence/paragraph timing)
```

---

## Keyboard Controls

The audio player is designed for accessibility-first interaction:

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Right Arrow` | Next word |
| `Left Arrow` | Previous word |
| `Down Arrow` | Next sentence |
| `Up Arrow` | Previous sentence |
| `Page Down` | Next paragraph |
| `Page Up` | Previous paragraph |
| `Shift + Right Arrow` | Skip forward 5 seconds |
| `Shift + Left Arrow` | Skip backward 5 seconds |
| `=` | Increase playback speed |
| `-` | Decrease playback speed |

---

## Project Structure

```
Bengali-Assistive-Reader/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI application with OCR and TTS endpoints
│   │   ├── utils/
│   │   │   ├── ocr.py             # Bengali OCR: text extraction, paragraph/sentence splitting
│   │   │   └── tts.py             # TTS engine: synthesis, word-level timing, audio merging
│   │   └── models/                # Model configuration files
│   ├── models/                    # Runtime model configs (weights not included in repo)
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main application component
│   │   ├── components/
│   │   │   ├── AudioPlayer.js     # Keyboard-navigable audio player with word tracking
│   │   │   ├── ImageCapture.js    # Webcam capture and file upload
│   │   │   ├── TextDisplay.js     # Extracted text display panel
│   │   │   └── VoiceGuidance.js   # Voice guidance overlay for accessibility
│   │   └── services/
│   │       └── api.js             # API client for backend communication
│   ├── public/
│   └── package.json
├── models/                        # Top-level model configs (referenced by TTS engine)
├── ocr_tts_fix.ipynb              # Development notebook for OCR/TTS pipeline experimentation
├── .gitignore
└── README.md
```

---

## Setup and Installation

### Prerequisites

- Python 3.9+
- Node.js 16+
- Tesseract OCR with Bengali language support
- TTS model weights (FastPitch + HiFi-GAN, trained on Bengali)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The API server starts at `http://localhost:8000`.

#### Tesseract Installation

| Platform | Command |
|----------|---------|
| **macOS** | `brew install tesseract tesseract-lang` |
| **Ubuntu/Debian** | `sudo apt install tesseract-ocr tesseract-ocr-ben` |
| **Windows** | Download from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki), then add the Bengali traineddata file |

#### Model Weights

Place the TTS model files in the following structure:

```
models/v1/bn/
├── fastpitch/
│   ├── best_model_fp.pth
│   └── speakers.pth
└── hifigan/
    └── best_model.pth
```

Model configuration files (`config.json`, `config_fp.json`) are included in the repository.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

The React app starts at `http://localhost:3000` and proxies API requests to the backend automatically.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/ocr` | Extract Bengali text from an uploaded image. Returns structured paragraphs and sentences. |
| `POST` | `/ocr-tts` | Full pipeline: OCR + TTS. Returns extracted text, audio URL, and word-level timing metadata. |
| `GET` | `/download/{filename}` | Download a generated audio file. |

### Example: OCR-TTS Request

```bash
curl -X POST http://localhost:8000/ocr-tts \
  -F "file=@image.png" \
  -F "speaker_name=female"
```

### Example: Response Structure

```json
{
  "file_id": "uuid",
  "text": "extracted Bengali text",
  "paragraphs": [ ... ],
  "audio_url": "/download/uuid_combined_audio.wav",
  "merged_data": {
    "words": [
      { "text": "word", "start_time_sec": 0.0, "end_time_sec": 0.5, "paragraph_idx": 0, "sentence_idx": 0 }
    ],
    "sentences": [ ... ],
    "paragraphs": [ ... ]
  }
}
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | FastAPI, PyTesseract, Coqui TTS (FastPitch + HiFi-GAN), PyTorch, NumPy, SciPy |
| **Frontend** | React 18, Axios, React Webcam |
| **OCR Engine** | Tesseract OCR (Bengali language pack) |
| **TTS Models** | FastPitch (spectrogram synthesis) + HiFi-GAN (vocoder) |
| **Audio Processing** | SciPy, Python wave module |

---

## Authors

- **Anish Sarkar** — [GitHub](https://github.com/ans036)

Developed during an internship at **Jadavpur University** and **IIT Kharagpur** (Feb 2025 -- Dec 2025).

---

## License

This project is for educational and research purposes.
