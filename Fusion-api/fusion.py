from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import httpx
from pathlib import Path
import shutil
import asyncio

app = FastAPI(title="Unified Public Speaking Analyzer")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

AUDIO_API = "http://127.0.0.1:8080/analyze-audio"
VIDEO_API = "http://127.0.0.1:8002/analyze/"

@app.post("/analyze/")
async def analyze_combined(file: UploadFile = File(...)):
    try:
        # 1️⃣ Save the uploaded video file locally
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # 2️⃣ Run both analyses concurrently
        async with httpx.AsyncClient(timeout=None) as client:
            audio_task = client.post(AUDIO_API, files={"file": open(file_path, "rb")})
            video_task = client.post(VIDEO_API, files={"file": open(file_path, "rb")})
            audio_resp, video_resp = await asyncio.gather(audio_task, video_task)

        # 3️⃣ Parse responses
        audio_json = audio_resp.json()
        video_json = video_resp.json()

        # 4️⃣ Merge results into one JSON
        combined = {
            "status": "success",
            "input_video": str(file_path),
            "audio_analysis": audio_json,
            "video_analysis": video_json
        }

        return JSONResponse(content=combined)

    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)})
