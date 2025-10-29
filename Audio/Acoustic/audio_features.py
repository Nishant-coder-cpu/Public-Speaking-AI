import os
import librosa
import numpy as np
import soundfile as sf
import tensorflow_hub as hub

# Load YAMNet
yamnet = hub.load("https://tfhub.dev/google/yamnet/1")

dataset_root = r"C:\Users\chint\OneDrive\Desktop\Audio dataset\segmented_5s"

def extract_features(file_path):
    y, sr = librosa.load(file_path, sr=16000)

    # ---- Prosody ----
    rms = librosa.feature.rms(y=y)[0]
    pitch, _, _ = librosa.pyin(y, fmin=80, fmax=300)
    pitch = np.nan_to_num(pitch)
    energy_std = np.std(rms)
    pitch_std = np.std(pitch)

    # ---- MFCC ----
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfcc, axis=1)

    # ---- YAMNet Embedding (emotion/tone) ----
    waveform = y.astype(np.float32)
    scores, embeddings, spectrogram = yamnet(waveform)
    yamnet_embedding = np.mean(embeddings, axis=0)

    # Combine into one feature vector
    return np.concatenate([
        mfcc_mean,
        [energy_std, pitch_std],
        yamnet_embedding
    ])

if __name__ == "__main__":
    X = []
    y = []

    for label in ["bad", "normal", "good"]:
        class_dir = os.path.join(dataset_root, label)
        for file in os.listdir(class_dir):
            if file.endswith(".wav"):
                file_path = os.path.join(class_dir, file)
                features = extract_features(file_path)
                X.append(features)
                y.append(label)

    X = np.array(X)
    y = np.array(y)
    np.save("X_audio.npy", X)
    np.save("y_audio.npy", y)

    print("✅ Feature Extraction Complete.")
    print("X shape:", X.shape)
    print("y shape:", y.shape)
