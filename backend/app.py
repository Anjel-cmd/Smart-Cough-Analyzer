import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import base64
import io

from flask import Flask, request, jsonify
from flask_cors import CORS

import numpy as np
import librosa
import tensorflow as tf

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

interpreter = tf.lite.Interpreter(
    model_path=MODEL_PATH
)

interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

INPUT_SHAPE = input_details[0]["shape"]

IMG_HEIGHT = INPUT_SHAPE[1]
IMG_WIDTH = INPUT_SHAPE[2]

# IMPORTANT:
# TRY BOTH ORDERS IF PREDICTION IS WRONG
CLASS_NAMES = ["COVID", "Healthy"]  # swap and test

# =========================
# FEATURE EXTRACTION
# =========================
def extract_features(file):

    # RESET POINTER
    file.seek(0)

    # READ FILE
    audio_bytes = file.read()

    # CONVERT TO BUFFER
    audio_buffer = io.BytesIO(audio_bytes)

    # LOAD AUDIO
    y, sr = librosa.load(
        audio_buffer,
        sr=22050,
        mono=True
    )

    # VALIDATION
    if y is None or len(y) == 0:
        raise ValueError(
            "Invalid or empty audio file"
        )

    # CREATE MEL SPECTROGRAM
    mel = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_mels=IMG_HEIGHT
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
            mode="constant"
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
        "message": "Cough AI Backend Running"
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
        interpreter.set_tensor(
            input_details[0]["index"],
            features
        )

        interpreter.invoke()

        output = interpreter.get_tensor(
            output_details[0]["index"]
        )[0]

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

            "waveform": waveform_base64
        })

    except Exception as e:

        print("ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500


# =========================
# RUN APP
# =========================
if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )