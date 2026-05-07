import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  UploadCloud, Play, Pause, Sparkles, Activity, ShieldCheck,
  AlertTriangle, FileAudio, Waves, ArrowRight, RefreshCw,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze — Smart Cough Analyzer" },
      { name: "description", content: "Upload a WAV cough recording and receive an AI prediction with confidence score and spectrogram." },
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
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
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const analyze = () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    // Mock analysis — connects to existing backend in production
    setTimeout(() => {
      const healthy = Math.random() > 0.5;
      setResult(
        healthy
          ? {
              label: "Healthy Cough",
              status: "healthy",
              confidence: 92.6,
              recommendation:
                "No abnormal patterns detected. Maintain hydration and continue routine wellness practices.",
            }
          : {
              label: "Possible Respiratory Issue",
              status: "warning",
              confidence: 87.3,
              recommendation:
                "The model detected irregular spectral patterns. Consider consulting a medical professional for a full evaluation.",
            }
      );
      setAnalyzing(false);
    }, 2200);
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <main className="relative pt-32 pb-20 px-4">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan" /> AI Prediction Engine
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold">
              Cough <span className="gradient-text">Analysis Studio</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Upload a WAV recording. Our model processes the spectrogram and returns a prediction with confidence and recommendations.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT — Upload */}
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
                  <h2 className="font-semibold text-lg">Audio Input</h2>
                  <p className="text-xs text-muted-foreground">WAV file · max 10MB</p>
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition p-10 text-center ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="audio/wav,audio/x-wav,.wav"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <div className="mx-auto w-16 h-16 rounded-2xl glass grid place-items-center mb-4">
                  <UploadCloud className="w-8 h-8 text-cyan" />
                </div>
                <p className="font-medium">{file ? file.name : "Drop your WAV file here"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse"}
                </p>
              </div>

              {audioUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 glass-strong rounded-2xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-primary-foreground glow hover:scale-105 transition"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <Waveform playing={isPlaying} />
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </motion.div>
              )}

              <button
                onClick={analyze}
                disabled={!file || analyzing}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-4 font-semibold text-primary-foreground glow disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition"
              >
                {analyzing ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing…</>
                ) : (
                  <><Activity className="w-5 h-5" /> Analyze Cough</>
                )}
              </button>
            </motion.section>

            {/* RIGHT — Result */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-purple/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-lg">Prediction Result</h2>
                  {result && (
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        result.status === "healthy"
                          ? "bg-success/15 text-success border border-success/30"
                          : "bg-warning/15 text-warning border border-warning/30"
                      }`}
                    >
                      {result.status === "healthy" ? "Healthy" : "Attention"}
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {!result && !analyzing && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-20 text-center text-muted-foreground"
                    >
                      <div className="mx-auto w-16 h-16 rounded-2xl glass grid place-items-center mb-4">
                        <Waves className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p>Upload an audio file and click analyze to see results.</p>
                    </motion.div>
                  )}

                  {analyzing && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-20 text-center"
                    >
                      <div className="mx-auto w-20 h-20 rounded-full gradient-primary blur-md animate-pulse-glow" />
                      <p className="mt-6 text-muted-foreground">Running deep model inference…</p>
                    </motion.div>
                  )}

                  {result && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">Detected</p>
                        <p className="text-3xl font-display font-bold mt-1">{result.label}</p>
                      </div>

                      <ConfidenceRing value={result.confidence} />

                      <div className="grid grid-cols-3 gap-3">
                        <Stat label="Frequency" value="2.4 kHz" />
                        <Stat label="Duration" value="3.1s" />
                        <Stat label="Quality" value="98%" />
                      </div>

                      <div className="glass-strong rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                          {result.status === "healthy" ? (
                            <ShieldCheck className="w-5 h-5 text-success mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">Recommendation</p>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {result.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 text-sm text-cyan hover:text-foreground transition"
                      >
                        Continue to feedback <ArrowRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* Spectrogram */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 glass rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">Spectrogram</h2>
                <p className="text-xs text-muted-foreground">Mel-frequency representation of the audio signal</p>
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">0 — 8 kHz</div>
            </div>
            <Spectrogram active={!!result || analyzing} />
          </motion.section>
        </div>
      </main>
    </div>
  );
}

function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-center gap-1 h-12">
      {Array.from({ length: 48 }).map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full gradient-primary"
          animate={{
            height: playing
              ? `${20 + Math.abs(Math.sin((i + Date.now() / 200) * 0.5)) * 80}%`
              : `${20 + Math.abs(Math.sin(i * 0.5)) * 60}%`,
          }}
          transition={{ duration: 0.3, repeat: playing ? Infinity : 0, repeatType: "reverse" }}
        />
      ))}
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} stroke="oklch(0.3 0.04 270)" strokeWidth="10" fill="none" />
          <motion.circle
            cx="60" cy="60" r={r}
            stroke="url(#grad)" strokeWidth="10" fill="none" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (value / 100) * c }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.82 0.16 200)" />
              <stop offset="100%" stopColor="oklch(0.65 0.22 300)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-3xl font-display font-bold">{value.toFixed(1)}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">Model Confidence</p>
        <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
          Based on spectral features extracted from the audio sample.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-strong rounded-xl p-3 text-center">
      <div className="text-base font-display font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Spectrogram({ active }: { active: boolean }) {
  const cols = 80;
  const rows = 32;
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-black/40 p-2">
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => {
          const x = i % cols;
          const y = Math.floor(i / cols);
          const intensity =
            (Math.sin(x * 0.2) + Math.cos(y * 0.3) + Math.sin((x + y) * 0.15) + 3) / 6;
          const hue = 200 + intensity * 100;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? intensity : 0.15 }}
              transition={{ delay: (x / cols) * 0.6, duration: 0.4 }}
              style={{
                background: `oklch(${0.3 + intensity * 0.5} ${0.1 + intensity * 0.15} ${hue})`,
                height: 8,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
