import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
        <nav className="glass rounded-2xl flex items-center justify-between px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 blur-md gradient-primary rounded-lg opacity-70 group-hover:opacity-100 transition" />
              <div className="relative gradient-primary rounded-lg p-1.5">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display font-semibold tracking-tight">Smart Cough</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition">Home</Link>
            <Link to="/analyze" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition">Analyze</Link>
            <Link to="/contact" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition">Contact</Link>
          </div>
          <Link
            to="/analyze"
            className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground gradient-primary hover:opacity-90 transition shadow-[0_0_30px_-8px_oklch(0.72_0.18_240/0.7)]"
          >
            Start Analysis
          </Link>
        </nav>
      </div>
    </header>
  );
}
