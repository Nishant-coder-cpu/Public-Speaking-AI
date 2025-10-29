import os
import librosa
import soundfile as sf

SOURCE_DATASET = r"C:\Users\chint\OneDrive\Desktop\Audio dataset\augmented"
TARGET_DATASET = r"C:\Users\chint\OneDrive\Desktop\Audio dataset\segmented_5s"
SEG_LENGTH = 5  # seconds

os.makedirs(TARGET_DATASET, exist_ok=True)

for label in ["bad", "normal", "good"]:
    src_dir = os.path.join(SOURCE_DATASET, label)
    out_dir = os.path.join(TARGET_DATASET, label)
    os.makedirs(out_dir, exist_ok=True)

    for file in os.listdir(src_dir):
        if not file.endswith(".wav"):
            continue

        path = os.path.join(src_dir, file)
        y, sr = librosa.load(path, sr=16000)

        total_duration = len(y) / sr
        seg_id = 0
        t = 0

        while t < total_duration:
            start = int(t * sr)
            end = int(min((t + SEG_LENGTH) * sr, len(y)))
            segment = y[start:end]

            if len(segment) < sr * 2:
                break  # skip tiny tail segments

            out_file = os.path.join(out_dir, f"{file.replace('.wav','')}_seg{seg_id}.wav")
            sf.write(out_file, segment, sr)

            seg_id += 1
            t += SEG_LENGTH

print("✅ Dataset segmented into 5-second windows successfully.")
