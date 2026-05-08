import { jsPDF } from "jspdf";

import {
  X,
  Download,
  UploadCloud,
  Play,
  Pause,
  Sparkles,
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileAudio,
  Waves,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze — Smart Cough Analyzer" },
      {
        name: "description",
        content:
          "Upload a WAV cough recording and receive an AI prediction with confidence score and spectrogram.",
      },
    ],
  }),

  component: Analyze,
});

type Result = {
  label: string;
  status: "healthy" | "warning";
  confidence: number;
  recommendation: string;
};

function Analyze() {
  const [file, setFile] = useState<File | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(
    null
  );

  const [isPlaying, setIsPlaying] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);

  const [result, setResult] = useState<Result | null>(null);

  const [spectrogram, setSpectrogram] = useState<string | null>(
    null
  );
  const [waveform, setWaveform] = useState<string | null>(
  null
);

  const [dragOver, setDragOver] = useState(false);

  const [showPdfModal, setShowPdfModal] =
    useState(false);

  const [userData, setUserData] = useState({
    name: "",
    age: "",
    gender: "Male",
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);

    setResult(null);

    setSpectrogram(null);

    setAudioUrl(URL.createObjectURL(f));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();

    setDragOver(false);

    const f = e.dataTransfer.files?.[0];

    if (f) handleFile(f);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  const analyze = () => {
    if (!file) return;

    setAnalyzing(true);

    setResult(null);

    const formData = new FormData();

    formData.append("file", file);

    fetch("http://localhost:5000/predict", {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setResult({
          label: data.label,
          status:
            data.label === "Healthy"
              ? "healthy"
              : "warning",
          confidence: data.confidence,
          recommendation: data.recommendation,
        });

        setSpectrogram(
  `data:image/png;base64,${data.spectrogram}`
);

if (data.waveform) {
  setWaveform(
    `data:image/png;base64,${data.waveform}`
  );
}
      })
      .catch((err) => {
        console.error(err);

        alert("Backend Error: " + err.message);
      })
      .finally(() => {
        setAnalyzing(false);
      });
  };

const generatePDF = () => {
  if (!result) return;

  const doc = new jsPDF();

  const now = new Date().toLocaleString();

  // ===== PAGE BACKGROUND =====
  doc.setFillColor(248, 248, 248);
  doc.rect(0, 0, 210, 297, "F");

  // ===== TITLE =====
  doc.setTextColor(65, 92, 255);

  doc.setFont("helvetica", "bold");

  doc.setFontSize(24);

  doc.text(
    "SmartCough AI - Clinical Screening",
    105,
    25,
    { align: "center" }
  );

  // ===== DATE =====
  doc.setTextColor(100, 100, 100);

  doc.setFont("helvetica", "italic");

  doc.setFontSize(11);

  doc.text(
    `Analysis Date: ${now}`,
    105,
    38,
    { align: "center" }
  );

  // ===== RESULT BOX =====
  doc.setFillColor(232, 235, 247);

  doc.roundedRect(15, 50, 180, 24, 3, 3, "F");

  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");

  doc.setFontSize(20);

  doc.text(
    `Assessment: ${result.label}`,
    105,
    65,
    { align: "center" }
  );

  // ===== CONFIDENCE =====
  doc.setFont("helvetica", "normal");

  doc.setFontSize(15);

  doc.text(
    `AI Confidence Score: ${result.confidence.toFixed(
      2
    )}%`,
    105,
    85,
    { align: "center" }
  );

  // ===== PATIENT DETAILS BOX =====
  doc.setFillColor(255, 255, 255);

  doc.roundedRect(15, 95, 180, 38, 3, 3, "F");

  doc.setDrawColor(220, 220, 220);

  doc.roundedRect(15, 95, 180, 38, 3, 3);

  doc.setTextColor(40, 40, 40);

  doc.setFont("helvetica", "bold");

  doc.setFontSize(14);

  doc.text("Patient Details", 20, 106);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(11);

  doc.text(`Name: ${userData.name}`, 20, 116);

  doc.text(`Age: ${userData.age}`, 105, 116);

  doc.text(`Gender: ${userData.gender}`, 20, 125);

  // ===== SPECTROGRAM =====
  if (spectrogram) {
    doc.setFont("helvetica", "bold");

    doc.setFontSize(15);

    doc.text("Spectrogram", 20, 145);

    doc.addImage(
      spectrogram,
      "PNG",
      20,
      150,
      170,
      45
    );
  }

  // ===== WAVEFORM =====
  if (waveform) {
    doc.setFont("helvetica", "bold");

    doc.setFontSize(15);

    doc.text("Waveform", 20, 208);

    doc.addImage(
      waveform,
      "PNG",
      20,
      213,
      170,
      45
    );
  }

  // ===== RECOMMENDATION =====
  doc.setFont("helvetica", "bold");

  doc.setFontSize(15);

  doc.text("Recommendation", 20, 268);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(11);

  const splitText = doc.splitTextToSize(
    result.recommendation,
    165
  );

  doc.text(splitText, 20, 276);

  // ===== SUGGESTIONS =====
  const suggestions = [
    "• Stay hydrated and drink warm fluids",
    "• Avoid smoking and polluted environments",
    "• Monitor symptoms regularly",
    "• Consult a doctor if symptoms worsen",
  ];

  let suggestionY = 288;

  doc.setFont("helvetica", "bold");

  doc.setFontSize(14);

  doc.text("Health Suggestions", 20, suggestionY);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(10);

  suggestions.forEach((s, i) => {
    doc.text(s, 25, suggestionY + 8 + i * 6);
  });

  // ===== OPEN PDF =====
  window.open(doc.output("bloburl"), "_blank");

  setShowPdfModal(false);
};

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <main className="relative pt-32 pb-20 px-4">
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan" />

              AI Prediction Engine
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold">
              Cough{" "}
              <span className="gradient-text">
                Analysis Studio
              </span>
            </h1>

            <p className="mt-3 text-muted-foreground max-w-2xl">
              Upload a WAV recording. Our AI model
              processes the spectrogram and predicts
              respiratory conditions with confidence.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT SIDE */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-3xl p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center">
                  <FileAudio className="w-5 h-5 text-primary-foreground" />
                </div>

                <div>
                  <h2 className="font-semibold text-lg">
                    Audio Input
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    WAV file · max 10MB
                  </p>
                </div>
              </div>

              {/* DROP ZONE */}
<div
  onDragOver={(e) => {
    e.preventDefault();
    setDragOver(true);
  }}
  onDragLeave={() => setDragOver(false)}
  onDrop={onDrop}
  onClick={(e) => {
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }}
  className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition p-10 text-center ${
    dragOver
      ? "border-primary bg-primary/5"
      : "border-border hover:border-primary/50 hover:bg-white/[0.02]"
  }`}
>
  <input
    ref={inputRef}
    type="file"
    accept=".wav"
    className="hidden"
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    }}
  />

                <div className="mx-auto w-16 h-16 rounded-2xl glass grid place-items-center mb-4">
                  <UploadCloud className="w-8 h-8 text-cyan" />
                </div>

                <p className="font-medium">
                  {file
                    ? file.name
                    : "Drop your WAV file here"}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  {file
                    ? `${(
                        file.size / 1024
                      ).toFixed(1)} KB`
                    : "or click to browse"}
                </p>
              </div>

              {/* AUDIO PLAYER */}
              {audioUrl && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-6 glass-strong rounded-2xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-primary-foreground glow hover:scale-105 transition"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1">
                      <Waveform
                        playing={isPlaying}
                      />
                    </div>
                  </div>

                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    className="hidden"
                    onEnded={() =>
                      setIsPlaying(false)
                    }
                  />
                </motion.div>
              )}

              {/* ANALYZE BUTTON */}
              <button
                onClick={analyze}
                disabled={!file || analyzing}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-4 font-semibold text-primary-foreground glow disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Analyze Cough
                  </>
                )}
              </button>
            </motion.section>

            {/* RIGHT SIDE */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-purple/20 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-lg">
                    Prediction Result
                  </h2>

                  {result && (
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        result.status ===
                        "healthy"
                          ? "bg-success/15 text-success border border-success/30"
                          : "bg-warning/15 text-warning border border-warning/30"
                      }`}
                    >
                      {result.status ===
                      "healthy"
                        ? "Healthy"
                        : "Warning"}
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {!result &&
                    !analyzing && (
                      <motion.div
                        key="empty"
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        className="py-20 text-center text-muted-foreground"
                      >
                        <div className="mx-auto w-16 h-16 rounded-2xl glass grid place-items-center mb-4">
                          <Waves className="w-8 h-8 text-muted-foreground" />
                        </div>

                        <p>
                          Upload audio and
                          click analyze.
                        </p>
                      </motion.div>
                    )}

                  {analyzing && (
                    <motion.div
                      key="loading"
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      className="py-20 text-center"
                    >
                      <div className="mx-auto w-20 h-20 rounded-full gradient-primary blur-md animate-pulse-glow" />

                      <p className="mt-6 text-muted-foreground">
                        Running AI
                        inference...
                      </p>
                    </motion.div>
                  )}

                  {result && (
                    <motion.div
                      key="result"
                      initial={{
                        opacity: 0,
                        y: 12,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      className="space-y-6"
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Detected
                        </p>

                        <p className="text-3xl font-display font-bold mt-1">
                          {result.label}
                        </p>
                      </div>

                      <ConfidenceRing
                        value={
                          result.confidence
                        }
                      />

                      <div className="grid grid-cols-3 gap-3">
                        <Stat
                          label="Frequency"
                          value="2.4 kHz"
                        />

                        <Stat
                          label="Duration"
                          value="3.1s"
                        />

                        <Stat
                          label="Quality"
                          value="98%"
                        />
                      </div>

                      <div className="glass-strong rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                          {result.status ===
                          "healthy" ? (
                            <ShieldCheck className="w-5 h-5 text-success mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                          )}

                          <div>
                            <p className="font-medium text-sm">
                              Recommendation
                            </p>

                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {
                                result.recommendation
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PDF BUTTON */}
                      <button
                        onClick={() =>
                          setShowPdfModal(
                            true
                          )
                        }
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 font-medium"
                      >
                        <Download className="w-5 h-5" />

                        Download PDF Report
                      </button>

                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 text-sm text-cyan hover:text-foreground transition"
                      >
                        Continue to
                        feedback{" "}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* SPECTROGRAM */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 glass rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">
                  Spectrogram
                </h2>

                <p className="text-xs text-muted-foreground">
                  Mel-frequency
                  representation of the
                  audio signal
                </p>
              </div>

              <div className="text-xs text-muted-foreground hidden sm:block">
                0 — 8 kHz
              </div>
            </div>

            <Spectrogram
              active={!!result || analyzing}
              image={spectrogram}
            />
            {/* WAVEFORM */}
<div className="mt-8">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="font-semibold text-lg">
        Waveform
      </h2>

      <p className="text-xs text-muted-foreground">
        Time-domain visualization of the cough signal
      </p>
    </div>
  </div>

  <WaveformImage image={waveform} />
</div>
{/* SUGGESTIONS */}
<div className="mt-8 glass-strong rounded-2xl p-6">
  <h2 className="font-semibold text-lg mb-4">
    Health Suggestions
  </h2>

  <div className="space-y-3 text-sm text-muted-foreground">
    <div>
      • Stay hydrated and drink warm fluids
    </div>

    <div>
      • Avoid exposure to smoke and dust
    </div>

    <div>
      • Monitor cough frequency regularly
    </div>

    <div>
      • Seek medical attention if symptoms persist
    </div>
  </div>
</div>
          </motion.section>
        </div>
      </main>

      {/* PDF MODAL */}
      <AnimatePresence>
        {showPdfModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setShowPdfModal(false)
              }
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* MODAL */}
            <motion.div
              initial={{
                scale: 0.9,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.9,
                opacity: 0,
              }}
              className="relative w-full max-w-md glass-strong rounded-3xl p-8 border border-white/10 shadow-2xl"
            >
              {/* CLOSE */}
              <button
                onClick={() =>
                  setShowPdfModal(false)
                }
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-3xl font-bold mb-2">
                Clinical Report
              </h2>

              <p className="text-sm text-muted-foreground mb-6">
                Enter patient details
                before downloading.
              </p>

              <div className="space-y-4">
                {/* NAME */}
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan"
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      name:
                        e.target.value,
                    })
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* AGE */}
                  <input
                    type="number"
                    placeholder="Age"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan"
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        age:
                          e.target.value,
                      })
                    }
                  />

                  {/* GENDER */}
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none text-white"
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        gender:
                          e.target.value,
                      })
                    }
                  >
                    <option
                      value="Male"
                      className="bg-slate-900"
                    >
                      Male
                    </option>

                    <option
                      value="Female"
                      className="bg-slate-900"
                    >
                      Female
                    </option>
                  </select>
                </div>

                {/* DOWNLOAD */}
                <button
                  onClick={generatePDF}
                  className="w-full mt-4 gradient-primary py-4 rounded-2xl font-bold text-white glow hover:scale-[1.01] transition"
                >
                  Download Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Waveform({
  playing,
}: {
  playing: boolean;
}) {
  return (
    <div className="flex items-center gap-1 h-12">
      {Array.from({ length: 48 }).map(
        (_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-full gradient-primary"
            animate={{
              height: playing
                ? `${
                    20 +
                    Math.abs(
                      Math.sin(
                        (
                          i +
                          Date.now() /
                            200
                        ) *
                          0.5
                      )
                    ) *
                      80
                  }%`
                : `${
                    20 +
                    Math.abs(
                      Math.sin(
                        i * 0.5
                      )
                    ) *
                      60
                  }%`,
            }}
            transition={{
              duration: 0.3,
              repeat: playing
                ? Infinity
                : 0,
              repeatType:
                "reverse",
            }}
          />
        )
      )}
    </div>
  );
}

function ConfidenceRing({
  value,
}: {
  value: number;
}) {
  const r = 52;

  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r={r}
            stroke="oklch(0.3 0.04 270)"
            strokeWidth="10"
            fill="none"
          />

          <motion.circle
            cx="60"
            cy="60"
            r={r}
            stroke="url(#grad)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{
              strokeDashoffset: c,
            }}
            animate={{
              strokeDashoffset:
                c -
                (value / 100) * c,
            }}
            transition={{
              duration: 1.4,
              ease: "easeOut",
            }}
          />

          <defs>
            <linearGradient
              id="grad"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="oklch(0.82 0.16 200)"
              />

              <stop
                offset="100%"
                stopColor="oklch(0.65 0.22 300)"
              />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-3xl font-display font-bold">
              {value.toFixed(1)}%
            </div>

            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Confidence
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-sm text-muted-foreground">
          Model Confidence
        </p>

        <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
          Based on spectral
          features extracted from
          the audio sample.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="glass-strong rounded-xl p-3 text-center">
      <div className="text-base font-display font-bold">
        {value}
      </div>

      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Spectrogram({
  active,
  image,
}: {
  active: boolean;
  image?: string | null;
}) {

  console.log("IMAGE =", image);

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-black/40 p-4 min-h-[220px] flex items-center justify-center">

      {image ? (
        <img
          src={image}
          alt="Spectrogram"
          className="w-full rounded-xl"
        />
      ) : (
        <p className="text-muted-foreground">
          No spectrogram yet
        </p>
      )}

    </div>
  );
}
function WaveformImage({
  image,
}: {
  image?: string | null;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-black/40 p-4 min-h-[220px] flex items-center justify-center">
      {image ? (
        <img
          src={image}
          alt="Waveform"
          className="w-full rounded-xl"
        />
      ) : (
        <p className="text-muted-foreground">
          No waveform yet
        </p>
      )}
    </div>
  );
}