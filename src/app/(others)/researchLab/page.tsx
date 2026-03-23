"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  RiArrowRightLine, RiCheckLine, RiSparklingFill,
  RiFilePaperLine, RiBarChartBoxLine, RiGroupLine,
  RiCalendarCheckLine, RiRobot2Line, RiShieldCheckLine,
  RiFileTextLine, RiLinksLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

/* ── scroll-reveal ─────────────────────────────────────── */
function useReveal(t = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setV(true); },
      { threshold: t }
    );
    obs.observe(el); return () => obs.disconnect();
  }, [t]);
  return { ref, v };
}

/* ── teal gradient text helper ─────────────────────────── */
function TealText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}>
      {children}
    </span>
  );
}

const FEATURES = [
  { icon: <RiFilePaperLine />,     title: "Resource Library + Quizzes",  body: "Upload papers with abstracts. Attach MCQ quizzes so members prove comprehension before downloading." },
  { icon: <RiCalendarCheckLine />, title: "Auto-Generated Tasks",         body: "Create a session — every RUNNING member gets a task automatically. Set deadlines and templates in seconds." },
  { icon: <RiBarChartBoxLine />,   title: "Radar-Chart Progress",         body: "Track each member across 5 axes: submissions, attendance, homework, participation, and scores." },
  { icon: <RiRobot2Line />,        title: "AI Study Companion",           body: "RAG-powered chat over any uploaded paper. Plain-language summaries and practice questions, 24/7." },
  { icon: <RiGroupLine />,         title: "Co-Supervisor Support",        body: "Invite a second supervisor with read-only or full-edit access. Perfect for co-mentored projects." },
  { icon: <RiFileTextLine />,      title: "Custom Grading Rubrics",       body: "Build multi-criteria rubrics (Clarity 30% + Depth 40% + Format 30%) attached to any session." },
  { icon: <RiShieldCheckLine />,   title: "Milestone Badges",             body: "Auto-award badges when members hit criteria like '5 tasks submitted' or '3 sessions attended'." },
  { icon: <RiLinksLine />,          title: "Session Replay Archive",       body: "Link Zoom recordings with timestamped notes. Members access everything from one place." },
];

export default function ResearchLabsPage() {
  const r1 = useReveal(0.08); const r2 = useReveal(0.08);
  const r3 = useReveal(0.06); const r4 = useReveal(0.1);

  return (
    <main className="overflow-x-hidden bg-background text-foreground">

      {/* ══════════════════════════════════════════
          HERO — dark cinematic, both modes
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden
                          bg-zinc-950 dark:bg-zinc-950">
        {/* Teal grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.035)_1px,transparent_1px)] bg-[size:52px_52px] pointer-events-none" />
        {/* Right teal glow */}
        <div className="absolute right-0 top-0 bottom-0 w-[50%] bg-gradient-to-l from-teal-950/30 to-transparent hidden lg:block pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(20,184,166,.08),transparent)] pointer-events-none" />
        {/* Corner arcs */}
        <svg className="absolute bottom-0 left-0 opacity-[0.06] pointer-events-none" width="300" height="300" viewBox="0 0 300 300" fill="none">
          <circle cx="0" cy="300" r="220" stroke="#14b8a6" strokeWidth="1"/>
          <circle cx="0" cy="300" r="140" stroke="#14b8a6" strokeWidth="1"/>
          <circle cx="0" cy="300" r="70"  stroke="#14b8a6" strokeWidth="1"/>
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-28 w-full">
          <div className="grid lg:grid-cols-[1fr_340px] gap-16 items-center">

            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                              bg-teal-500/10 border border-teal-500/25
                              text-teal-400 text-[11px] font-bold tracking-[.08em] uppercase mb-7">
                <RiSparklingFill className="animate-pulse" />
                Use case · Research Labs
              </div>

              <h1 className="text-[clamp(2.8rem,6.5vw,5.5rem)] font-black leading-[.96]
                             tracking-[-0.04em] text-white mb-6">
                Research groups<br />
                <TealText>deserve better</TealText><br />
                <span className="text-zinc-400">than email.</span>
              </h1>

              <div className="w-14 h-[3px] bg-teal-500 rounded-full mb-7" />

              <p className="text-[16px] text-zinc-300 leading-[1.75] max-w-[480px] mb-10">
                Nexora gives supervisors the infrastructure to manage weekly meetings,
                track every member's progress, share papers, and auto-assign tasks —
                without spreadsheets, WhatsApp groups, or scattered drives.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/register"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                             bg-teal-600 hover:bg-teal-700
                             text-white font-bold text-[15px]
                             shadow-lg shadow-teal-900/40
                             transition-all duration-200 hover:scale-[1.02]">
                  Start free <RiArrowRightLine />
                </Link>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                             border border-white/15 hover:border-teal-500/50
                             text-zinc-300 hover:text-teal-300
                             font-semibold text-[15px] transition-all duration-200">
                  Book a demo
                </Link>
              </div>
            </div>

            {/* Right — cluster preview cards */}
            <div className="hidden lg:flex flex-col gap-3">
              {[
                { tag: "Session 7 Task", name: "Attention Is All You Need", status: "Submitted",   accent: "bg-teal-500"   },
                { tag: "Resource",       name: "BERT Explained — 2018",     status: "Quiz passed", accent: "bg-teal-400"   },
                { tag: "Homework",       name: "Read Sections 3.2–3.3",     status: "Done",        accent: "bg-teal-300"   },
              ].map((card, i) => (
                <div key={i}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl
                             border border-white/[0.08] bg-white/[0.05] backdrop-blur-sm"
                  style={{ transform: `translateX(${i * 10}px)` }}>
                  <div className={cn("w-1.5 h-9 rounded-full flex-shrink-0", card.accent)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">{card.tag}</p>
                    <p className="text-[13.5px] text-zinc-200 font-semibold truncate">{card.name}</p>
                  </div>
                  <span className="text-[10.5px] font-bold text-teal-400
                                   bg-teal-950/60 border border-teal-800/50
                                   px-2.5 py-0.5 rounded-full flex-shrink-0">
                    {card.status}
                  </span>
                </div>
              ))}

              {/* Health gauge */}
              <div className="mt-1 px-5 py-4 rounded-2xl border border-teal-800/40 bg-teal-950/30">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cluster Health</span>
                  <span className="text-[26px] font-black text-teal-400 leading-none">94</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400" style={{ width: "94%" }} />
                </div>
                <p className="text-[11px] text-teal-500 font-semibold mt-2">Healthy · 8 active members</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════ */}
      <div className="border-y border-border bg-muted/40">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          {[["3 hrs","Saved / week / supervisor"],["94%","Avg submission rate"],["12×","Faster resource discovery"],["28k+","Certificates issued"]].map(([v, l], i) => (
            <div key={i} className="flex flex-col items-center py-10 px-4 text-center">
              <p className="text-[2.2rem] font-black text-teal-600 dark:text-teal-400 tabular-nums leading-none mb-1.5">{v}</p>
              <p className="text-[11.5px] font-semibold text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PROBLEM / SOLUTION — vertical split
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div ref={r1.ref}
          className={cn("max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r1.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Problem card */}
            <div className="rounded-3xl border border-border bg-card p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                              bg-red-50 dark:bg-red-950/30
                              border border-red-200 dark:border-red-800/50
                              text-red-600 dark:text-red-400
                              text-[11px] font-bold tracking-[.08em] uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                The problem
              </div>
              <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold leading-[1.15] tracking-tight text-foreground mb-7">
                Research admin is eating your week.
              </h2>
              <ul className="space-y-3.5">
                {["Updates scattered across WhatsApp, email, and Slack — always out of sync",
                  "Papers buried in shared drives with zero session structure",
                  "No way to know who's falling behind until it's far too late",
                  "Onboarding a new PhD student takes days of manual admin",
                  "Scheduling standups and attendance tracking is weekly drudgery",
                ].map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-muted-foreground leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/40
                                     border border-red-200 dark:border-red-800/50
                                     flex items-center justify-center flex-shrink-0 mt-0.5
                                     text-red-500 text-[11px] font-bold">✕</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution card */}
            <div className="rounded-3xl border border-teal-200/60 dark:border-teal-800/50
                            bg-teal-50/50 dark:bg-teal-950/20
                            p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40
                              bg-[radial-gradient(circle_at_100%_0%,rgba(20,184,166,.12),transparent)]
                              pointer-events-none" />
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                              bg-teal-100 dark:bg-teal-950/60
                              border border-teal-300/60 dark:border-teal-700/60
                              text-teal-700 dark:text-teal-400
                              text-[11px] font-bold tracking-[.08em] uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Nexora's answer
              </div>
              <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold leading-[1.15] tracking-tight text-foreground mb-7">
                One cluster. Every tool. Zero scattered data.
              </h2>
              <ul className="space-y-3.5">
                {["Create a cluster — credentials auto-sent to every member instantly",
                  "Schedule a session → tasks auto-generated for all active members",
                  "Radar chart surfaces at-risk members the moment they fall behind",
                  "Papers with quiz gates ensure members actually read before sessions",
                  "AI Companion answers questions about any uploaded paper at 2 AM",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-foreground/80 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950/60
                                     flex items-center justify-center flex-shrink-0 mt-0.5">
                      <RiCheckLine className="text-teal-600 dark:text-teal-400 text-[11px]" />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div ref={r2.ref}
            className={cn("mb-14 transition-[opacity,transform] duration-700",
              r2.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiSparklingFill className="animate-pulse" /> Purpose-built features
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight leading-[1.1] text-foreground">
              Built for academic rigour
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className={cn(
                  "group rounded-2xl border border-border bg-card p-6",
                  "hover:border-teal-300/70 dark:hover:border-teal-700/60",
                  "hover:shadow-lg hover:shadow-teal-500/[0.06] dark:hover:shadow-teal-500/[0.08]",
                  "transition-all duration-300 hover:-translate-y-1.5",
                  i === 0 && "lg:col-span-2",
                  r2.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: r2.v ? `${i * 50}ms` : "0ms" }}>
                <div className="w-11 h-11 rounded-xl
                                bg-teal-50 dark:bg-teal-950/50
                                border border-teal-200/60 dark:border-teal-800/50
                                flex items-center justify-center
                                text-teal-600 dark:text-teal-400
                                text-[18px] mb-4
                                group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-[15.5px] font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS — numbered rows
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <div ref={r3.ref}
            className={cn("transition-[opacity,transform] duration-700",
              r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiSparklingFill className="animate-pulse" /> How it works
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-12">
              Setup to first session in 10 min
            </h2>

            <div className="flex flex-col divide-y divide-border">
              {[["01","Create your research cluster","Name it, add a batch tag, paste student emails. Credentials auto-sent to every member."],
                ["02","Upload your reading list","Add papers with abstracts, tags, and year. Attach comprehension quizzes to any resource."],
                ["03","Schedule your first session","Set date, deadline. Tasks auto-created for every member. Notifications sent immediately."],
                ["04","Review, score, grow","Members submit. Review with rubric scores. Assign homework. Dashboard tracks everything."],
              ].map(([num, title, desc], i) => (
                <div key={num}
                  className={cn("flex gap-8 items-start py-8 transition-[opacity,transform] duration-500",
                    r3.v ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6")}
                  style={{ transitionDelay: r3.v ? `${i * 80}ms` : "0ms" }}>
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 dark:bg-teal-500
                                  flex items-center justify-center flex-shrink-0
                                  text-white font-black text-[17px]
                                  shadow-lg shadow-teal-600/25">
                    {num}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-[17px] font-bold text-foreground mb-1.5">{title}</h3>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIAL + CTA
      ══════════════════════════════════════════ */}
      <section className="bg-muted/30 border-t border-border py-24 lg:py-32">
        <div ref={r4.ref}
          className={cn("max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 grid lg:grid-cols-2 gap-16 transition-[opacity,transform] duration-700",
            r4.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>

          {/* Quote */}
          <div className="border-l-2 border-teal-500 pl-8">
            <span className="block text-[56px] leading-none font-serif text-teal-300/40 dark:text-teal-700/30 mb-2 select-none">"</span>
            <p className="text-[clamp(1rem,1.8vw,1.25rem)] font-medium text-foreground/80 leading-[1.8] italic mb-8">
              I used to spend half my Sunday evening tracking down who submitted what.
              Nexora eliminated that entirely. The quiz gate was the single most impactful change.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl
                              bg-teal-100 dark:bg-teal-950/60
                              border border-teal-200/60 dark:border-teal-800/60
                              flex items-center justify-center
                              text-[13px] font-extrabold text-teal-700 dark:text-teal-400">RM</div>
              <div>
                <p className="text-[14px] font-bold text-foreground">Dr. Riya Mehta</p>
                <p className="text-[12px] text-muted-foreground">Research Lead · NIT Trichy</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col justify-center gap-5">
            <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold tracking-tight leading-[1.1] text-foreground">
              Your research group deserves better tools.
            </h2>
            <p className="text-muted-foreground text-[15px]">Free forever · No credit card · Setup in 10 minutes.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                           bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600
                           text-white font-bold text-[15px]
                           shadow-md shadow-teal-600/20
                           transition-all duration-200 hover:scale-[1.02]">
                Start free <RiArrowRightLine />
              </Link>
              <Link href="/#features"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                           border border-border
                           text-foreground hover:border-teal-400 dark:hover:border-teal-600
                           hover:text-teal-700 dark:hover:text-teal-300
                           font-semibold text-[15px] transition-all duration-200">
                View all features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}