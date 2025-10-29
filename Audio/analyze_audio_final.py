import os
import json
import librosa
import numpy as np
import whisper
import joblib
import re
import soundfile as sf

# ====== MODEL PATHS ======
CLASSIFIER_MODEL = r"C:\Users\chint\OneDrive\Desktop\Public Speaking AI\Audio\Acoustic\confidence_model_xgb.pkl"
SCALER_MODEL = r"C:\Users\chint\OneDrive\Desktop\Public Speaking AI\Audio\Acoustic\feature_scaler.pkl"
ENCODER_MODEL = r"C:\Users\chint\OneDrive\Desktop\Public Speaking AI\Audio\Acoustic\label_encoder.pkl"

# ====== FILLER WORDS ======
FILLERS = {"um", "uh", "like", "basically", "you know", "so", "actually", "right"}

# ====== LOAD CLASSIFIER ======
clf = joblib.load(CLASSIFIER_MODEL)
scaler = joblib.load(SCALER_MODEL)
encoder = joblib.load(ENCODER_MODEL)

# ====== IMPORT FEATURE EXTRACTOR ======
from Acoustic.audio_features import extract_features


# ---------------- FILLER COUNT ----------------
def count_fillers(text):
    text = re.sub(r"[^\w\s]", "", text.lower())
    words = text.split()
    return sum(w in FILLERS for w in words)


# ---------------- PITCH + ENERGY ----------------
def compute_pitch_energy(y_seg, sr):
    f0, _, _ = librosa.pyin(y_seg, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
    f0 = f0[~np.isnan(f0)]
    pitch_mean = np.mean(f0) if len(f0) > 0 else 0.0
    pitch_std = np.std(f0) if len(f0) > 0 else 0.0

    rms = librosa.feature.rms(y=y_seg)[0]
    energy = rms / np.max(np.abs(rms)) if np.max(np.abs(rms)) != 0 else rms
    return pitch_mean, pitch_std, np.mean(energy), np.std(energy)


# ---------------- CLASSIFIER ----------------
def predict_quality_with_confidence(file_path):
    feature_vector = extract_features(file_path)
    x_scaled = scaler.transform([feature_vector])

    pred_idx = clf.predict(x_scaled)[0]
    label = encoder.inverse_transform([pred_idx])[0]

    prob_scores = clf.predict_proba(x_scaled)[0]
    class_names = encoder.inverse_transform(np.arange(len(prob_scores)))
    prob_dict = {str(cls): float(prob_scores[i]) for i, cls in enumerate(class_names)}

    return label, prob_dict


# ---------------- TEXT ALIGNMENT ----------------
def get_text_for_fixed_windows(whisper_segments, total_duration, window=5.0):
    """Assign each Whisper segment text to exactly one 5 s window."""
    num_windows = int(np.ceil(total_duration / window))
    window_texts = [""] * num_windows

    for seg in whisper_segments:
        midpoint = (seg["start"] + seg["end"]) / 2
        idx = int(midpoint // window)
        if 0 <= idx < num_windows:
            window_texts[idx] += " " + seg["text"].strip()

    return window_texts


# ---------------- MAIN ANALYSIS ----------------
def analyze_audio(audio_path):
    print("\n[INFO] Running Whisper ASR...")
    model = whisper.load_model("small")
    result = model.transcribe(audio_path, fp16=False)
    whisper_segments = result["segments"]
    transcript = result["text"].strip()

    y, sr = librosa.load(audio_path, sr=16000)
    print(f"[DEBUG] Loaded audio length: {len(y)/sr:.2f} sec (Expected full duration)")
    total_dur = len(y) / sr
    window = 5.0
    window_texts = get_text_for_fixed_windows(whisper_segments, total_dur, window=window)

    segment_data = []
    overall_fillers = 0
    total_words = 0
    all_pitch = []
    all_energy = []

    for i, text in enumerate(window_texts):
        t_start = i * window
        t_end = min((i + 1) * window, total_dur)
        s_i, e_i = int(t_start * sr), int(t_end * sr)
        y_seg = y[s_i:e_i]

        word_count = len(text.split())
        total_words += word_count
        duration = max(0.1, t_end - t_start)
        wpm = (word_count / duration) * 60

        fillers = count_fillers(text)
        overall_fillers += fillers

        pitch_mean, pitch_std, energy_mean, energy_std = compute_pitch_energy(y_seg, sr)
        all_pitch.append(pitch_mean)
        all_energy.append(energy_mean)

        tmp_path = "temp_seg.wav"
        sf.write(tmp_path, y_seg, sr)
        seg_label, seg_probs = predict_quality_with_confidence(tmp_path)
        os.remove(tmp_path)

        segment_data.append({
            "start": round(t_start, 2),
            "end": round(t_end, 2),
            "text": text.strip(),
            "wpm": round(wpm, 2),
            "fillers": int(fillers),
            "pitch_mean": round(pitch_mean, 2),
            "pitch_std": round(pitch_std, 2),
            "energy_mean": round(energy_mean, 3),
            "energy_std": round(energy_std, 3),
            "speaking_quality": seg_label,
            "quality_confidence": {k: float(v) for k, v in seg_probs.items()}
        })

    # ----- OVERALL METRICS -----
    overall_wpm = round((total_words / total_dur) * 60, 2)
    avg_pitch = round(float(np.nanmean(all_pitch)), 2)
    avg_energy = round(float(np.nanmean(all_energy)), 3)

    full_label, full_probs = predict_quality_with_confidence(audio_path)

    output = {
        "overall_speaking_quality": full_label,
        "overall_confidence_scores": {k: float(v) for k, v in full_probs.items()},
        "overall_transcript": transcript,
        "overall_metrics": {
            "duration_sec": round(total_dur, 2),
            "average_wpm": overall_wpm,
            "total_fillers": int(overall_fillers),
            "average_pitch": avg_pitch,
            "average_energy": avg_energy
        },
        "segments": segment_data
    }

    return output


# ---------------- SAFE JSON CONVERSION ----------------
def make_json_safe(obj):
    """Recursively convert numpy and non-serializable types into JSON-safe Python types."""
    import numpy as np
    if isinstance(obj, dict):
        return {str(k): make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.str_):
        return str(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (set, tuple)):
        return [make_json_safe(v) for v in obj]
    else:
        return obj


# ---------------- ENTRY POINT ----------------
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("❌ No input file provided. Please pass an audio or video file path.")
        sys.exit(1)

    path = sys.argv[1]
    output = analyze_audio(path)

    # ✅ Make JSON safe
    safe_output = make_json_safe(output)

    # ✅ Automatically save (replace) single JSON file
    save_dir = r"C:\Users\chint\OneDrive\Desktop\Public Speaking AI\Audio"
    os.makedirs(save_dir, exist_ok=True)
    json_path = os.path.join(save_dir, "audio_analysis.json")

    try:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(safe_output, f, ensure_ascii=False, indent=4)
        print(f"\n[INFO] Full analysis saved (replaced previous file):\n{json_path}")
    except Exception as e:
        print(f"\n❌ Failed to save JSON: {e}")

    print("\n[INFO] Analysis complete. Latest results are stored in audio_analysis.json.")
