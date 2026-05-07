import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, BrainCircuit, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import heroImg from "@/assets/hero-lungs.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Cough Analyzer — AI Respiratory Health Prediction" },
      { name: "description", content: "AI-powered cough analysis for smart respiratory health prediction. Upload audio and get instant insights." },
      { property: "og:title", content: "Smart Cough Analyzer" },
      { property: "og:description", content: "AI-powered cough analysis for smart respiratory health prediction." },
    ],
  }),
  component: Landing,
});

const steps = [
  { icon: Upload, title: "Upload audio", desc: "Drop a WAV recording of a cough into the analyzer." },
  { icon: BrainCircuit, title: "AI analyzes cough", desc: "Our deep model extracts spectral signals and patterns." },
  { icon: FileText, title: "Get prediction", desc: "Receive a clear result with confidence and guidance." },
];

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-32 px-4">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute inset-0 gradient-hero-bg" />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/30 blur-[120px] animate-pulse-glow" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple/30 blur-[120px] animate-pulse-glow" />

        <div className="relative mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan" />
              AI Respiratory Intelligence
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05]">
              <span className="gradient-text">Smart Cough</span>
              <br />
              <span className="text-foreground">Analyzer</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              AI-powered cough analysis for smart respiratory health prediction. Upload a short audio clip and get instant, doctor-friendly insights.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/analyze"
                className="group relative inline-flex items-center gap-2 rounded-2xl gradient-primary px-7 py-4 text-base font-semibold text-primary-foreground glow hover:scale-[1.02] transition"
              >
                Start Analysis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-2xl glass px-7 py-4 text-base font-medium hover:bg-white/5 transition">
                How it works
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
              <div><div className="text-2xl font-display font-bold text-foreground">98.4%</div>Model accuracy</div>
              <div className="h-10 w-px bg-border" />
              <div><div className="text-2xl font-display font-bold text-foreground">&lt;3s</div>Analysis time</div>
              <div className="h-10 w-px bg-border hidden sm:block" />
              <div className="hidden sm:block"><div className="text-2xl font-display font-bold text-foreground">12k+</div>Samples trained</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 gradient-primary opacity-30 blur-3xl rounded-full" />
            <div className="relative glass rounded-3xl p-3 animate-float-slow">
              <img
                src={heroImg}
                alt="AI cough analysis visualization with glowing lungs and waveforms"
                width={1536}
                height={1280}
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-28 px-4">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-4">
              How it works
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">
              From sound to <span className="gradient-text">signal</span>, in seconds
            </h2>
            <p className="mt-4 text-muted-foreground">Three simple steps to a smarter respiratory check.</p>
          </motion.div>

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative glass rounded-3xl p-8 hover:border-primary/40 transition"
              >
                <div className="absolute top-6 right-6 text-6xl font-display font-bold text-white/5">0{i + 1}</div>
                <div className="relative w-14 h-14 rounded-2xl gradient-primary grid place-items-center mb-6 group-hover:scale-110 transition">
                  <s.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative pb-28 px-4">
        <div className="mx-auto max-w-5xl glass-strong rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero-bg opacity-60" />
          <div className="relative">
            <h3 className="text-3xl sm:text-4xl font-bold">Ready to analyze a cough?</h3>
            <p className="mt-3 text-muted-foreground">Upload a WAV file and get an AI-powered prediction in seconds.</p>
            <Link
              to="/analyze"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl gradient-primary px-7 py-4 font-semibold text-primary-foreground glow hover:scale-[1.02] transition"
            >
              Launch Analyzer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Smart Cough Analyzer · For research and educational use.
      </footer>
    </div>
  );
}
