# 🎙️ Public Speaking AI

AI-powered platform for analyzing public speaking skills through **audio and video** signals — providing real-time, multimodal feedback on delivery, tone, and body language.  
Built with **FastAPI**, **Python**, and integrated with a **Next.js frontend**.

---

## 🧠 Overview

This system runs **three independent FastAPI servers** that work together:

| Component | Folder | Environment | Port | Description |
|------------|---------|-------------|-------|--------------|
| 🎧 **Audio Analysis API** | `/Audio` | `venv` | `8080` | Extracts pitch, energy, filler words, pauses |
| 🎥 **Video Analysis API** | `/Video` | `/Video/v_env` | `8002` | Analyzes posture, gestures, and facial cues |
| 🔗 **Fusion API** | `/Fusion-api` | `fusion-env` | `9000` | Combines both outputs into unified feedback |

---

## ⚙️ Prerequisites

- **Python** 3.10+
- **Node.js** 18+ (if connecting to frontend)
- **pip** and **virtualenv**
- **ffmpeg** installed (for audio/video processing)
- (Optional) **ngrok** for public tunneling to Vercel frontend

---

## 🧩 Environment Setup

### 1️⃣ Audio Environment — `/venv`

```bash
cd "C:\Users\chint\OneDrive\Desktop\Public Speaking AI"
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements_audio.txt
```

#### Run the Audio API
```bash
cd Audio
 uvicorn Fast-api-app.main:app --reload --port 8080
```

#### Core Dependencies
```
fastapi
uvicorn
librosa
numpy
whisper
pandas
soundfile
scikit-learn
xgboost
pydub
```

---

### 2️⃣ Video Environment — `/Video/v_env`

```bash
cd "C:\Users\chint\OneDrive\Desktop\Public Speaking AI\Video"
python -m venv v_env
v_env\Scripts\Activate.ps1
pip install -r requirements_video.txt
```

#### Run the Video API
```bash
cd Video
uvicorn app:app --reload --port 8002
```

#### Core Dependencies
```
fastapi
uvicorn
opencv-python
mediapipe
numpy
pandas
matplotlib
fer
torch
torchvision
```

---

### 3️⃣ Fusion Environment — `/fusion-env`

```bash
cd "C:\Users\chint\OneDrive\Desktop\Public Speaking AI"
python -m venv fusion-env
fusion-env\Scripts\activate
pip install -r requirements_fusion.txt
```

#### Run the Fusion API
```bash
cd Fusion-api
uvicorn fusion:app --reload --port 9000
```

#### Core Dependencies
```
fastapi
uvicorn
httpx
asyncio
shutil
pathlib
pydantic
```

---

## 🔗 FastAPI Endpoints

### 🎧 Audio API (`localhost:8080`)
**POST** `/analyze-audio`  
**Input:** `.wav` or `.mp4`  
**Output Example:**
```json
{
  "status": "success",
  "pitch_variance": 0.34,
  "energy_variance": 0.29,
  "filler_count": 5,
  "audio_score": "good"
}
```

---

### 🎥 Video API (`localhost:8002`)
**POST** `/analyze/`  
**Input:** `.mp4`  
**Output Example:**
```json
{
  "status": "success",
  "posture_score": "good",
  "gesture_activity": "moderate",
  "emotion": "confident"
}
```

---

### 🔗 Fusion API (`localhost:9000`)
**POST** `/analyze/`  
Combines both analyses into a single JSON response.

**Example Request:**
```bash
curl -X 'POST'   'http://127.0.0.1:9000/analyze/'   -H 'accept: application/json'   -H 'Content-Type: multipart/form-data'   -F 'file=@demo.mp4;type=video/mp4'
```

**Example Response:**
```json
{
  "status": "success",
  "input_video": "uploads/demo.mp4",
  "audio_analysis": {
    "pitch_variance": 0.34,
    "filler_count": 5,
    "audio_score": "good"
  },
  "video_analysis": {
    "gesture_activity": "moderate",
    "emotion": "confident"
  }
}
```

---

## 📁 Folder Structure

```
Public Speaking AI/
│
├── Audio/
│   ├── Acoustic/
│   ├── analyze_audio_final.py
│
├── Video/
│   ├── app.py
│   ├── multimodal_pipeline.py
│   ├── v_env/
│   └── requirements_video.txt  
│
├── Fusion-api/
│   ├── fusion_main.py
│
├── ORA-Speaker(Copy)
│
├── fusion-env/
├── venv/
├── requirements_audio.txt
└── requirements_fusion.txt

```

---

## 🧾 Notes

- All three APIs are **independent** — Fusion just coordinates them.  
- Keep environment paths correct (`venv`, `Video/v_env`, `fusion-env`).
- Use unique ports (`8080`, `8002`, `9000`).
- Swagger docs:
  - Audio → `http://127.0.0.1:8080/docs`
  - Video → `http://127.0.0.1:8002/docs`
  - Fusion → `http://127.0.0.1:9000/docs`

---

## 🧑‍💻 Contributors — Team ORA Farmer

- [@Nishant-coder-cpu](https://github.com/Nishant-coder-cpu)  
- [@Karancoderg](https://github.com/Karancoderg)  
- [@Harman-2005](https://github.com/Harman-2005)  
- [@Coding-yeager](https://github.com/Coding-yeager)  
- [@Ayush18-pixel](https://github.com/Ayush18-pixel)



---

## 🪪 License
MIT License © 2025 Public Speaking AI
