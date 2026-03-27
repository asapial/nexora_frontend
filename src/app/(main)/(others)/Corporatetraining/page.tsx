"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  RiBriefcaseLine, RiArrowRightLine, RiCheckLine, RiSparklingFill,
  RiLineChartLine, RiShieldCheckLine, RiGroupLine, RiFileTextLine,
  RiGraduationCapLine, RiNotificationLine, RiWebhookLine, RiBarChartBoxLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

function useReveal(t = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    obs.observe(el); return () => obs.disconnect();
  }, [t]);
  return { ref, v };
}

function TealText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background:"linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
      {children}
    </span>
  );
}

const FEATURES = [
  { icon: <RiLineChartLine />,    title: "Real-Time Analytics",         body: "Track submission rates, attendance, and score trends across all training clusters. CSV export for leadership." },
  { icon: <RiGraduationCapLine />,title: "Verifiable Certificates",     body: "Branded PDFs with unique verification URLs. Employees share them on LinkedIn and HR records." },
  { icon: <RiShieldCheckLine />,  title: "Consistent Grading Rubrics",  body: "Multi-criteria rubrics applied uniformly across all trainers and departments, every time." },
  { icon: <RiGroupLine />,        title: "Multi-Team Clusters",          body: "Separate clusters per department or programme, each with its own health score and analytics." },
  { icon: <RiFileTextLine />,     title: "Compliance Quiz Gating",       body: "Gate SOP and document downloads behind comprehension quizzes for trackable compliance." },
  { icon: <RiNotificationLine />, title: "Automated Deadline Reminders", body: "Email and in-app reminders 24h and 1h before submission deadlines. No manual chasing." },
  { icon: <RiWebhookLine />,      title: "Webhook & API Integration",    body: "Connect to HRIS, Slack, or Teams via HMAC-signed webhooks. API documentation included." },
  { icon: <RiBarChartBoxLine />,  title: "Bulk Member Management",       body: "Move, promote, or graduate employees in bulk. Filter by batch or join date." },
];

const BEFORE_AFTER = [
  ["Training admin per week",     "8+ hours of manual work",      "Under 3 hours — fully automated"],
  ["Completion tracking",         "Spreadsheet, always outdated", "Live dashboard, updates in real-time"],
  ["Certificate turnaround",      "2–3 days per batch",           "Instant, completely self-serve"],
  ["Compliance audit prep",       "Days of manual export",        "One-click export, always ready"],
  ["At-risk learner visibility",  "Quarterly review — too late",  "Automatically alerted within 7 days"],
  ["Cross-dept consistency",      "Varies by trainer or team",    "Enforced via shared rubrics platform-wide"],
];

export default function CorporateTrainingPage() {
  const r1 = useReveal(0.08); const r2 = useReveal(0.06);
  const r3 = useReveal(0.08); const r4 = useReveal(0.1);

  return (
    <main className="overflow-x-hidden bg-background text-foreground">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.03)_1px,transparent_1px)] bg-[size:56px_56px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-700 via-teal-500 to-teal-400" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_50%,rgba(20,184,166,.07),transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid lg:grid-cols-[1fr_460px] gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                              bg-teal-500/10 border border-teal-500/25
                              text-teal-400 text-[11px] font-bold tracking-[.08em] uppercase mb-7">
                <RiSparklingFill className="animate-pulse" />
                Use case · Corporate Training
              </div>

              <h1 className="text-[clamp(2.6rem,5.5vw,4.8rem)] font-black leading-[.98]
                             tracking-[-0.035em] text-white mb-6">
                Transform L&D into a<br />
                <TealText>measurable ROI</TealText><br />
                for leadership.
              </h1>

              <p className="text-[16px] text-zinc-300 leading-[1.75] max-w-[480px] mb-10">
                Structured sessions, tracked completions, verifiable certificates, and
                real-time analytics — without enterprise software complexity or pricing.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/register"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                             bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px]
                             shadow-lg shadow-teal-900/40
                             transition-all duration-200 hover:scale-[1.02]">
                  Start your programme <RiArrowRightLine />
                </Link>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                             border border-white/15 hover:border-teal-500/50
                             text-zinc-300 hover:text-teal-300
                             font-semibold text-[15px] transition-all duration-200">
                  Talk to us
                </Link>
              </div>
            </div>

            {/* Metric table preview */}
            <div className="hidden lg:block rounded-3xl border border-white/[0.08]
                            bg-white/[0.04] backdrop-blur-sm overflow-hidden">
              <div className="grid grid-cols-3 border-b border-white/[0.07] px-5 py-3">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Metric</span>
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Before</span>
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">After Nexora</span>
              </div>
              {BEFORE_AFTER.slice(0, 4).map((row, i) => (
                <div key={i} className={cn("grid grid-cols-3 px-5 py-3.5 border-b border-white/[0.05] last:border-0 items-start",
                  i % 2 !== 0 && "bg-white/[0.03]")}>
                  <span className="text-[12.5px] font-semibold text-zinc-300 leading-snug pr-2">{row[0]}</span>
                  <span className="text-[12px] text-zinc-600">{row[1]}</span>
                  <span className="text-[12px] font-semibold text-teal-400">{row[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════ */}
      <div className="border-y border-border bg-muted/40">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          {[["68%","Admin time saved"],["4.8★","Learner satisfaction"],["100%","Verifiable certs"],["2 wks","Avg setup time"]].map(([v, l], i) => (
            <div key={i} className="flex flex-col items-center py-10 px-4 text-center">
              <p className="text-[2.2rem] font-black text-teal-600 dark:text-teal-400 tabular-nums leading-none mb-1.5">{v}</p>
              <p className="text-[11.5px] font-semibold text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BEFORE / AFTER TABLE
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div ref={r1.ref}
          className={cn("max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r1.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>

          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiBriefcaseLine /> The ROI case
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] text-foreground">
              Before and after Nexora
            </h2>
          </div>

          <div className="rounded-3xl border border-border overflow-hidden shadow-lg shadow-black/[0.04] dark:shadow-black/20 bg-card">
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-zinc-800 dark:bg-zinc-800 px-6 py-4">
              <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">Metric</span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">Before</span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-teal-400">With Nexora</span>
            </div>
            {BEFORE_AFTER.map((row, i) => (
              <div key={i}
                className={cn("grid grid-cols-[1fr_1fr_1fr] border-b border-border last:border-0 items-center transition-[opacity,transform] duration-400",
                  i % 2 !== 0 && "bg-muted/30",
                  r1.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
                style={{ transitionDelay: r1.v ? `${i * 60}ms` : "0ms" }}>
                <span className="px-6 py-4 text-[14px] font-semibold text-foreground">{row[0]}</span>
                <span className="px-6 py-4 text-[13.5px] text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-600 flex-shrink-0" />{row[1]}
                </span>
                <span className="px-6 py-4 text-[13.5px] font-semibold text-foreground flex items-center gap-2">
                  <RiCheckLine className="text-teal-600 dark:text-teal-400 flex-shrink-0 text-base" />{row[2]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
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
              <RiSparklingFill className="animate-pulse" /> Features
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight leading-[1.1] text-foreground">
              Enterprise-grade, minus the complexity
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
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50
                                border border-teal-200/60 dark:border-teal-800/50
                                flex items-center justify-center
                                text-teal-600 dark:text-teal-400 text-[18px] mb-4
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
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background border-y border-border">
        <div ref={r3.ref}
          className={cn("max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="text-center mb-14">
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3">
              From decision to first training in days
            </h2>
            <p className="text-muted-foreground text-[15.5px] max-w-md mx-auto">No implementation consultant. Your L&D team self-serves the entire setup.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-[34px] left-[60px] right-[60px] h-px border-t-2 border-dashed border-border" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[["01","Define programme","Create clusters per team with batch tags. Use department naming conventions."],
                ["02","Upload materials","Add SOPs, decks, compliance docs. Attach quizzes for mandatory comprehension."],
                ["03","Run first session","Publish agenda. Tasks auto-assign. Attendance tracked. Notifications automatic."],
                ["04","Report to leadership","Export reports: completion rates, scores, certificates. Prove ROI with data."],
              ].map(([num, title, desc], i) => (
                <div key={num}
                  className={cn("transition-[opacity,transform] duration-500", r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}
                  style={{ transitionDelay: r3.v ? `${i * 90}ms` : "0ms" }}>
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 dark:bg-teal-500
                                  flex items-center justify-center text-white font-black text-[17px] mb-4
                                  shadow-lg shadow-teal-600/25 relative z-10">
                    {num}
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-[13.5px] text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIAL + CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-28 bg-muted/30">
        <div ref={r4.ref}
          className={cn("max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 grid lg:grid-cols-[3fr_2fr] gap-16 items-center transition-[opacity,transform] duration-700",
            r4.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>

          <div>
            <div className="flex gap-1 mb-5">{[1,2,3,4,5].map(n => <span key={n} className="text-teal-500 text-lg">★</span>)}</div>
            <span className="block text-[56px] leading-none font-serif text-teal-300/30 dark:text-teal-700/30 mb-1 select-none">"</span>
            <p className="text-[clamp(1rem,1.8vw,1.25rem)] font-medium text-foreground/80 leading-[1.8] italic mb-8">
              We run compliance training for 200 employees across 8 departments. Nexora replaced
              a spreadsheet and three email chains. Leadership now gets a real-time dashboard
              instead of a quarterly report. That alone justified the cost.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950/60
                              border border-teal-200/60 dark:border-teal-800/60
                              flex items-center justify-center text-[13px] font-extrabold
                              text-teal-700 dark:text-teal-400">SE</div>
              <div>
                <p className="text-[14px] font-bold text-foreground">Sara El-Amin</p>
                <p className="text-[12px] text-muted-foreground">Head of L&D · Global Fintech Firm</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:border-l lg:border-border lg:pl-16">
            <h2 className="text-[clamp(1.7rem,2.8vw,2.2rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
              Make your training programme measurable.
            </h2>
            <p className="text-muted-foreground text-[15px]">Structured sessions · Tracked completions · Verified certificates.</p>
            <div className="flex flex-col gap-3 mt-2">
              <Link href="/register"
                className="inline-flex items-center justify-between h-12 px-6 rounded-xl
                           bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600
                           text-white font-bold text-[15px]
                           transition-all duration-200 hover:scale-[1.01] group">
                Start your programme <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center justify-between h-12 px-6 rounded-xl
                           border border-border text-foreground
                           hover:border-teal-400 dark:hover:border-teal-600
                           hover:text-teal-700 dark:hover:text-teal-300
                           font-semibold text-[15px] transition-all duration-200 group">
                Talk to our team <RiArrowRightLine className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}