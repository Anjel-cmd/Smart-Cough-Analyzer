import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Heart, Send, Github, Twitter, Linkedin, Mail, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Stay Healthy — Smart Cough Analyzer" },
      { name: "description", content: "Thank you for using Smart Cough Analyzer. Get in touch with our team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ name: "", email: "", message: "" }); }, 3500);
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="absolute inset-0 gradient-hero-bg opacity-60 pointer-events-none" />

      <main className="relative pt-32 pb-20 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Thank you */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary glow mb-6"
            >
              <Heart className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h1 className="text-5xl sm:text-6xl font-bold">
              <span className="gradient-text">Stay Healthy</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
              Thank you for trusting Smart Cough Analyzer. We're here to make respiratory wellness smarter and more accessible — for everyone.
            </p>
          </motion.div>

          {/* Contact card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-strong rounded-3xl p-8 sm:p-12 grid md:grid-cols-2 gap-10 relative overflow-hidden"
          >
            <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full bg-purple/30 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl font-bold">Let's talk</h2>
              <p className="mt-3 text-muted-foreground">
                Questions, feedback, or research collaborations — reach out and we'll respond shortly.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <a href="mailto:hello@smartcough.ai" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
                  <div className="w-10 h-10 rounded-xl glass grid place-items-center"><Mail className="w-4 h-4 text-cyan" /></div>
                  hello@smartcough.ai
                </a>
              </div>

              <div className="mt-10">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Follow us</p>
                <div className="flex gap-3">
                  {[Github, Twitter, Linkedin].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="w-11 h-11 rounded-xl glass grid place-items-center hover:gradient-primary hover:scale-110 transition group"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground transition" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="relative space-y-4">
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="Jane Doe"
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                placeholder="jane@example.com"
              />
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can we help?"
                  className="mt-2 w-full glass rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition placeholder:text-muted-foreground/50"
                />
              </div>

              <button
                type="submit"
                disabled={sent}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-4 font-semibold text-primary-foreground glow hover:scale-[1.01] transition disabled:opacity-70"
              >
                {sent ? (
                  <><CheckCircle2 className="w-5 h-5" /> Message sent</>
                ) : (
                  <>Send Message <Send className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </motion.div>

          <p className="mt-12 text-center text-sm text-muted-foreground">
            Built with care for healthier breathing · © {new Date().getFullYear()} Smart Cough Analyzer
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
