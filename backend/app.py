import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import base64
import io
import os
import tempfile
import threading

from flask import Flask, request, jsonify
from flask_cors import CORS

import numpy as np
import librosa
import soundfile as sf

# =========================
# FLASK APP
# =========================
app = Flask(__name__)

# ENABLE CORS
CORS(app)

# =========================
# LOAD MODEL
# =========================
MODEL_PATH = "cough_model.tflite"

try:
    from tflite_runtime.interpreter import Interpreter
except ImportError:
    try:
        from tensorflow.lite.python.interpreter import Interpreter
    except ImportError:
        try:
            from tensorflow.lite import Interpreter
        except ImportError:
            import tensorflow as tf
            Interpreter = tf.lite.Interpreter

interpreter = Interpreter(
    model_path=MODEL_PATH
)

interpreter.allocate_tensors()

# Lock to prevent concurrent inference crashes in Gunicorn
prediction_lock = threading.Lock()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

INPUT_SHAPE = input_details[0]["shape"]

IMG_HEIGHT = INPUT_SHAPE[1]
IMG_WIDTH = INPUT_SHAPE[2]

# IMPORTANT:
# TRY BOTH ORDERS IF PREDICTION IS WRONG
CLASS_NAMES = ["Healthy", "COVID"]  # swap and test

# =========================
# FEATURE EXTRACTION
# =========================
def extract_features(file):

    # Save to a temporary file
    temp_fd, temp_path = tempfile.mkstemp(suffix=".wav")
    try:
        # Reset pointer and write to temp file
        file.seek(0)
        with os.fdopen(temp_fd, 'wb') as temp_file:
            temp_file.write(file.read())

        # Load audio using soundfile directly to prevent audioread hangs
        data, samplerate = sf.read(temp_path)
        
        # Convert to mono if stereo/multichannel
        if len(data.shape) > 1:
            y = np.mean(data, axis=1)
        else:
            y = data
            
        # Resample to 22050 if needed
        if samplerate != 22050:
            y = librosa.resample(y, orig_sr=samplerate, target_sr=22050)
            sr = 22050
        else:
            sr = samplerate
            
        # Limit to max 6 seconds
        max_len = int(6.0 * sr)
        if len(y) > max_len:
            y = y[:max_len]
            
    finally:
        # Clean up temporary file
        try:
            os.remove(temp_path)
        except OSError:
            pass

    # VALIDATION
    if y is None or len(y) == 0:
        raise ValueError(
            "Invalid or empty audio file"
        )

    mel = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_mels=IMG_HEIGHT,
        fmax=8000
    )

    # CONVERT TO DB
    mel_db = librosa.power_to_db(
        mel,
        ref=np.max
    )

    # FIX WIDTH
    if mel_db.shape[1] < IMG_WIDTH:

        pad = IMG_WIDTH - mel_db.shape[1]

        mel_db = np.pad(
            mel_db,
            ((0, 0), (0, pad)),
            mode="constant",
            constant_values=np.min(mel_db)
        )

    else:

        mel_db = mel_db[:, :IMG_WIDTH]

    return mel_db, y, sr


# =========================
# CREATE SPECTROGRAM IMAGE
# =========================
def create_spectrogram_image(mel_db):

    fig, ax = plt.subplots(
        figsize=(8, 3)
    )

    ax.imshow(
        mel_db,
        aspect="auto",
        origin="lower",
        cmap="magma"
    )

    ax.set_title("Spectrogram")

    ax.axis("off")

    img_buffer = io.BytesIO()

    plt.savefig(
        img_buffer,
        format="png",
        bbox_inches="tight",
        pad_inches=0.1
    )

    plt.close(fig)

    img_buffer.seek(0)

    return base64.b64encode(
        img_buffer.getvalue()
    ).decode("utf-8")


# =========================
# CREATE WAVEFORM IMAGE
# =========================
def create_waveform_image(y, sr):

    fig, ax = plt.subplots(
        figsize=(10, 3)
    )

    # TIME AXIS
    time = np.linspace(
        0,
        len(y) / sr,
        num=len(y)
    )

    # PLOT
    ax.plot(
        time,
        y,
        linewidth=1
    )

    ax.set_title("Waveform")

    ax.set_xlabel("Time (s)")

    ax.set_ylabel("Amplitude")

    ax.grid(alpha=0.3)

    img_buffer = io.BytesIO()

    plt.savefig(
        img_buffer,
        format="png",
        bbox_inches="tight"
    )

    plt.close(fig)

    img_buffer.seek(0)

    return base64.b64encode(
        img_buffer.getvalue()
    ).decode("utf-8")


# =========================
# HEALTH CHECK
# =========================
@app.route("/")
def home():

    return jsonify({
        "message": "Cough AI Backend Running",
        "class_names": CLASS_NAMES,
        "input_details_shape": [int(x) for x in input_details[0]["shape"]],
        "output_details_shape": [int(x) for x in output_details[0]["shape"]],
        "input_details_dtype": str(input_details[0]["dtype"]),
        "output_details_dtype": str(output_details[0]["dtype"])
    })


@app.route("/model_details")
def model_details():
    def serialize_val(val):
        if isinstance(val, dict):
            return {k: serialize_val(v) for k, v in val.items()}
        elif isinstance(val, (list, tuple)):
            return [serialize_val(x) for x in val]
        elif isinstance(val, np.ndarray):
            return val.tolist()
        elif isinstance(val, (np.integer, int)):
            return int(val)
        elif isinstance(val, (np.floating, float)):
            return float(val)
        elif isinstance(val, type):
            return val.__name__ if hasattr(val, "__name__") else str(val)
        try:
            return val
        except:
            return str(val)

    def serialize_details(details):
        serialized = []
        for d in details:
            item = {}
            for k, v in d.items():
                item[k] = serialize_val(v)
            serialized.append(item)
        return serialized

    return jsonify({
        "input_details": serialize_details(input_details),
        "output_details": serialize_details(output_details)
    })


# =========================
# PREDICT ROUTE
# =========================
@app.route("/predict", methods=["POST"])
def predict():

    try:

        # =========================
        # CHECK FILE
        # =========================
        if "file" not in request.files:

            return jsonify({
                "error": "No file uploaded"
            }), 400

        file = request.files["file"]

        if file.filename == "":

            return jsonify({
                "error": "No selected file"
            }), 400

        # Log file details
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0)
        print(f"UPLOADED FILE: {file.filename}, Content-Type: {file.content_type}, Size: {file_length} bytes")

        # =========================
        # EXTRACT FEATURES
        # =========================
        mel_db, y, sr = extract_features(
            file
        )

        # =========================
        # CREATE IMAGES
        # =========================
        spectrogram_base64 = (
            create_spectrogram_image(
                mel_db
            )
        )

        waveform_base64 = (
            create_waveform_image(
                y,
                sr
            )
        )

        # =========================
        # NORMALIZE FEATURES
        # =========================
        features = mel_db.astype(
            np.float32
        )

        max_value = np.max(
            np.abs(features)
        )

        if max_value != 0:

            features = (
                features / max_value
            )

        # =========================
        # CHANNEL HANDLING
        # =========================
        if INPUT_SHAPE[3] == 3:

            features = np.stack(
                [features] * 3,
                axis=-1
            )

        else:

            features = np.expand_dims(
                features,
                axis=-1
            )

        # =========================
        # ADD BATCH DIMENSION
        # =========================
        features = np.expand_dims(
            features,
            axis=0
        ).astype(np.float32)

        # =========================
        # MODEL PREDICTION
        # =========================
        with prediction_lock:
            interpreter.set_tensor(
                input_details[0]["index"],
                features
            )

            interpreter.invoke()

            output = interpreter.get_tensor(
                output_details[0]["index"]
            )[0]

        # =========================
        # TRY MULTIPLE NORMALIZATIONS
        # =========================
        norm_outputs = {}
        for norm_type in ["abs_max", "min_max_0_1", "min_max_80", "none", "z_score", "min_max_255", "db_255", "min_max_neg1_1", "imagenet", "raw_min_max_0_1", "raw_z_score"]:
            # Copy appropriate source features
            if norm_type.startswith("raw_"):
                temp_features = mel.copy().astype(np.float32)
            else:
                temp_features = mel_db.copy().astype(np.float32)
            
            if norm_type == "abs_max":
                mv = np.max(np.abs(temp_features))
                if mv != 0:
                    temp_features = temp_features / mv
            elif norm_type in ["min_max_0_1", "raw_min_max_0_1"]:
                min_v = np.min(temp_features)
                max_v = np.max(temp_features)
                if max_v - min_v != 0:
                    temp_features = (temp_features - min_v) / (max_v - min_v)
            elif norm_type == "min_max_80":
                temp_features = (temp_features + 80.0) / 80.0
                temp_features = np.clip(temp_features, 0.0, 1.0)
            elif norm_type == "none":
                pass
            elif norm_type in ["z_score", "raw_z_score"]:
                mean_v = np.mean(temp_features)
                std_v = np.std(temp_features)
                if std_v != 0:
                    temp_features = (temp_features - mean_v) / std_v
            elif norm_type == "min_max_255":
                min_v = np.min(temp_features)
                max_v = np.max(temp_features)
                if max_v - min_v != 0:
                    temp_features = 255.0 * (temp_features - min_v) / (max_v - min_v)
            elif norm_type == "db_255":
                temp_features = 255.0 * (temp_features + 80.0) / 80.0
                temp_features = np.clip(temp_features, 0.0, 255.0)
            elif norm_type == "min_max_neg1_1":
                min_v = np.min(temp_features)
                max_v = np.max(temp_features)
                if max_v - min_v != 0:
                    temp_features = (temp_features - min_v) / (max_v - min_v) * 2.0 - 1.0
            elif norm_type == "imagenet":
                min_v = np.min(temp_features)
                max_v = np.max(temp_features)
                if max_v - min_v != 0:
                    temp_features = (temp_features - min_v) / (max_v - min_v)
                # Stack first
                temp_features = np.stack([temp_features] * 3, axis=-1)
                mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
                std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
                temp_features = (temp_features - mean) / std
            
            # Channel handling (skip if already stacked in imagenet)
            if norm_type != "imagenet":
                if INPUT_SHAPE[3] == 3:
                    temp_features = np.stack([temp_features] * 3, axis=-1)
                else:
                    temp_features = np.expand_dims(temp_features, axis=-1)
                
            # Batch dimension
            temp_features = np.expand_dims(temp_features, axis=0).astype(np.float32)
            
            with prediction_lock:
                interpreter.set_tensor(input_details[0]["index"], temp_features)
                interpreter.invoke()
                norm_out = interpreter.get_tensor(output_details[0]["index"])[0]
                norm_outputs[norm_type] = [float(x) for x in norm_out]

        # DEBUG OUTPUT
        print(
            "RAW MODEL OUTPUT:",
            output
        )

        # =========================
        # PROCESS OUTPUT
        # =========================
        if len(output) == 1:

            probability = float(
                output[0]
            )

            if probability > 0.5:

                class_id = 1
                confidence = probability

            else:

                class_id = 0
                confidence = (
                    1 - probability
                )

        else:

            class_id = int(
                np.argmax(output)
            )

            confidence = float(
                np.max(output)
            )

        # =========================
        # LABEL
        # =========================
        label = CLASS_NAMES[
            class_id
        ]

        # =========================
        # RECOMMENDATIONS
        # =========================
        if label == "COVID":

            recommendation = (
                "Consult doctor, isolate, and take a COVID test."
            )

            suggestions = [
                "Wear a mask in public",
                "Stay hydrated",
                "Take proper rest",
                "Monitor oxygen levels",
                "Consult a healthcare professional"
            ]

        else:

            recommendation = (
                "You seem healthy. Maintain hydration and healthy habits."
            )

            suggestions = [
                "Drink warm fluids",
                "Maintain healthy sleep",
                "Exercise regularly",
                "Avoid smoking",
                "Stay hydrated"
            ]

        # =========================
        # RESPONSE
        # =========================
        return jsonify({

            "label": label,

            "confidence": round(
                confidence * 100,
                2
            ),

            "recommendation": recommendation,

            "suggestions": suggestions,

            "spectrogram": spectrogram_base64,

            "waveform": waveform_base64,
            
            "raw_output": [float(x) for x in output],
            
            "norm_outputs": norm_outputs
        })

    except Exception as e:

        error_msg = f"{type(e).__name__}: {str(e)}"
        print("ERROR:", error_msg)

        return jsonify({
            "error": error_msg
        }), 500


# =========================
# RUN APP
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )