"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Globe,
  FileText,
  LayoutGrid,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const features = [
  { icon: LayoutGrid, title: "Kanban Pipeline", desc: "Drag-and-drop application tracking across 7 interview stages." },
  { icon: Brain, title: "AI Match Engine", desc: "Score resume-job fit with skill gap analysis and recommendations." },
  { icon: FileText, title: "Resume Parsing", desc: "Upload PDFs — AI extracts skills, experience, and education automatically." },
  { icon: Sparkles, title: "AI Message Generator", desc: "Draft follow-ups, referral requests, and thank-you emails instantly." },
  { icon: Globe, title: "LinkedIn Import", desc: "Chrome extension imports jobs from LinkedIn in one click." },
  { icon: BarChart3, title: "Executive Analytics", desc: "Funnel charts, conversion rates, and monthly trend analysis." },
  { icon: Target, title: "Interview Prep", desc: "AI-generated questions and study roadmaps per application." },
  { icon: Zap, title: "Activity Feed", desc: "Real-time timeline of every career milestone." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" suppressHydrationWarning>
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm">JT</div>
            JobTrackr
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link href="/register"><Button>Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <section className="gradient-hero pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              AI-Powered Career Operating System
            </span>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your job search,{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                supercharged
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Track applications, parse resumes with AI, match opportunities, generate messages,
              and analyze your pipeline — all in one production-grade platform.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">View Demo</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">Everything you need to land the role</h2>
            <p className="mt-2 text-muted-foreground">Built with production engineering — not tutorial code.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { stat: "10K+", label: "Applications Tracked" },
              { stat: "95%", label: "Resume Parse Accuracy" },
              { stat: "<2s", label: "AI Match Score" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-bold text-primary">{s.stat}</p>
                <p className="mt-1 text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to take control of your career?</h2>
          <p className="mt-4 text-muted-foreground">Join JobTrackr and turn your job search into a data-driven operation.</p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" className="gap-2">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} JobTrackr. Built with Next.js, PostgreSQL, and Gemini AI.
        </div>
      </footer>
    </div>
  );
}
