# 🫁 Smart Cough Analyzer
AI-powered cough analysis system that predicts respiratory conditions using cough audio recordings.

---

## 📁 Project Structure
```
.tanstack/tmp/
├── backend/
│   ├── app.py                  ← Flask API server
│   ├── cough_model.tflite      ← TFLite model for inference
│   ├── README.md
│   └── requirements.txt        ← Python dependencies
│
├── node_modules/
│
├── src/
│   ├── assets/                 ← Static assets (images, icons)
│   ├── components/
│   │   ├── ui/                 ← Reusable UI components
│   │   └── Navbar.tsx          ← Navigation bar
│   ├── hooks/                  ← Custom React hooks
│   ├── lib/                    ← Utility functions
│   └── routes/
│       ├── __root.tsx          ← Root layout
│       ├── analyze.tsx         ← Main cough analysis page
│       ├── contact.tsx         ← Contact page
│       └── index.tsx           ← Home/landing page
│
├── .gitignore
├── .prettierignore
├── .prettierrc
├── bun.lock
├── components.json
├── eslint.config.js
├── package-lock.json
├── package.json
├── README.md
├── router.tsx                  ← TanStack Router config
├── routeTree.gen.ts            ← Auto-generated route tree
├── server.ts                   ← Server entry point
├── start.ts                    ← App start file
├── styles.css                  ← Global styles
├── tsconfig.json
├── vite.config.ts              ← Vite bundler config
└── wrangler.jsonc              ← Cloudflare Workers config
```

---

## 🚀 Frontend Setup
```bash
npm install
npm run dev
```
Frontend runs on:
```
http://localhost:8080
```

---

## ⚙️ Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Or install manually:
```bash
pip install flask flask-cors librosa matplotlib tensorflow numpy soundfile
```

Backend runs on:
```
http://127.0.0.1:5000
```

---

## ✨ Features
- Upload WAV cough audio
- AI prediction system (5-Fold Cross Validated)
- Mel Spectrogram visualization
- Waveform visualization
- Confidence score per class
- PDF report generation

---

## 🤖 AI Models Used

All models were trained on Mel Spectrogram images (224×224) converted from raw cough audio recordings.

### 📊 Model Performance — Cough Classification

| Rank | Model | Accuracy | Type |
|------|-------|----------|------|
| 🥇 1st | **CNN (Custom 2D)** | **93%** ⭐ Best | Deep Learning |
| 🥈 2nd | SVM | 85% | Machine Learning |
| 🥉 3rd | Random Forest | 84% | Machine Learning |
| 4th | KNN | 82% | Machine Learning |
| 5th | Logistic Regression | 76% | Machine Learning |
| 6th | EfficientNet | 50% | Transfer Learning |

> ✅ CNN achieved **93% accuracy** — exceeding the 90% target!

---

### Best Model — Custom 2D CNN ⭐
- **Accuracy**: 93%
- **Training Method**: 5-Fold Cross Validation
- **Input**: Mel Spectrogram images (224×224 RGB)
- **Output Classes**: Negative / Positive / Unknown
- **Optimizer**: AdamW (lr=1e-4, weight_decay=1e-4)
- **Scheduler**: CosineAnnealingLR
- **Dropout**: 0.3
- **Epochs per fold**: 15
- **Exported format**: TensorFlow Lite (`cough_model.tflite`)

### Training Pipeline
```
Raw Audio (.wav/.mp3)
        ↓
Mel Spectrogram Extraction (librosa)
        ↓
Data Augmentation (time stretch, pitch shift, add noise)
        ↓
Train & Compare Models
(CNN, EfficientNet, SVM, Random Forest, KNN, Logistic Regression)
        ↓
Evaluate (Accuracy, F1, Precision, Recall, ROC-AUC, Confusion Matrix)
        ↓
5-Fold Cross Validation on Best Model (CNN — 93%)
        ↓
Export to TFLite → Flask API → React Frontend
```

### Audio Feature Extraction
- **Sample Rate**: 22,050 Hz
- **Duration**: 5 seconds per clip
- **Mel Bands**: 128
- **Max Frequency**: 8,000 Hz
- **Image Size**: 224 × 224 RGB

---

## 🗂️ Dataset
- **Classes**: Negative, Positive, Unknown
- **Split**: 70% Train / 15% Validation / 15% Test
- **Validation Strategy**: 5-Fold Stratified Cross Validation

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- TanStack Router
- Vite

### Backend
- Flask
- TensorFlow Lite (`cough_model.tflite`)
- Librosa
- Matplotlib

### AI / ML
- PyTorch (model training)
- TorchVision (pretrained model weights)
- Scikit-learn (SVM, Random Forest, KNN, Logistic Regression)
- Grad-CAM (model explainability)
- ONNX (model conversion)
- TensorFlow Lite (production inference)

### DevOps
- Cloudflare Workers (`wrangler.jsonc`)
- ESLint + Prettier (code quality)

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Upload audio → get prediction |
| GET | `/health` | Check if backend is running |

### Example Request
```bash
curl -X POST http://127.0.0.1:5000/predict \
  -F "file=@cough_sample.wav"
```

### Example Response
```json
{
  "prediction": "Positive",
  "confidence": {
    "Negative": 0.05,
    "Positive": 0.91,
    "Unknown": 0.04
  },
  "spectrogram": "base64_image_string"
}
```

---

## ⚠️ Disclaimer
This tool is for **research purposes only** and is not intended as a substitute for professional medical diagnosis.
