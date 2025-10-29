from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import shutil, os, uuid, json
from pathlib import Path
from multimodal_pipeline import analyze_video  # your analysis function

app = FastAPI(title="Multimodal Emotion & Body Analysis API")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.post("/analyze/")
async def analyze_endpoint(file: UploadFile = File(...)):
    """
    Upload a video → run model analysis → show JSON directly in Swagger UI.
    """
    try:
        # Save uploaded file
        file_id = uuid.uuid4().hex
        input_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"🔍 Running analysis on {input_path}")

        # Run the actual model (this blocks until it's done)
        json_path = analyze_video(str(input_path), model_path="pose_landmarker_full.task")

        # Ensure JSON output exists
        if not json_path or not os.path.exists(json_path):
            return JSONResponse({
                "status": "error",
                "message": "❌ No JSON generated or file not found."
            })

        # Read JSON content
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Return analysis result directly
        return JSONResponse({
            "status": "success",
            "video_name": file.filename,
            "analysis_result": data
        })

    except Exception as e:
        print(f"⚠ Error during analysis: {e}")
        return JSONResponse({
            "status": "error",
            "message": str(e)
        }, status_code=500)


@app.get("/")
def home():
    return {"message": "Multimodal Analysis API is running ✅"}