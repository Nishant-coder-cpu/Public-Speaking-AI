import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
import xgboost as xgb
import joblib

# Load extracted features
X = np.load("X_audio.npy")
y = np.load("y_audio.npy")

# Encode labels (bad=0, normal=1, good=2)
encoder = LabelEncoder()
y_enc = encoder.fit_transform(y)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)

# Scale features (important for prosody + MFCC)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Define XGBoost model
model = xgb.XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.9,
    colsample_bytree=0.9,
    eval_metric="mlogloss"
)

# Train
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)

print("\n✅ Classification Report:")
print(classification_report(y_test, y_pred, target_names=encoder.classes_))

print("\n✅ Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

SAVE_DIR = r"C:\Users\chint\OneDrive\Desktop\Public Speaking AI\Audio\Acoustic"

joblib.dump(model, f"{SAVE_DIR}/confidence_model_xgb.pkl")
joblib.dump(scaler, f"{SAVE_DIR}/feature_scaler.pkl")
joblib.dump(encoder, f"{SAVE_DIR}/label_encoder.pkl")

print("\n💾 Model, Scaler & Label Encoder Saved Successfully.")
