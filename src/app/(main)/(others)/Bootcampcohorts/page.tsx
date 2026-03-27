"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  RiCodeBoxLine, RiArrowRightLine, RiCheckLine, RiSparklingFill,
  RiTimeLine, RiTrophyLine, RiGroupLine, RiCalendarCheckLine,
  RiBarChartBoxLine, RiNotificationLine, RiGraduationCapLine, RiFileTextLine,
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
  { icon: <RiBarChartBoxLine />,  title: "Cluster Health Score",    body: "Auto-calculated 0–100 score from submission rate, attendance, and activity. At-risk flagged instantly." },
  { icon: <RiTimeLine />,         title: "Deadline Countdown",       body: "Live countdown on every student's dashboard. Push alerts 24h and 1h before deadline." },
  { icon: <RiNotificationLine />, title: "Inactive Member Alerts",   body: "Auto-flag students with zero activity. Re-engagement emails with a single click." },
  { icon: <RiTrophyLine />,       title: "Milestone Badges",         body: "Custom milestones auto-awarded: '5 sprints submitted', 'Perfect attendance', and more." },
  { icon: <RiGroupLine />,        title: "Peer Study Groups",        body: "Students form groups of up to 5 with a shared folder and discussion thread." },
  { icon: <RiGraduationCapLine />,title: "Graduation Certificates",  body: "Branded PDFs with unique verification URLs. Students share to LinkedIn in one click." },
  { icon: <RiCalendarCheckLine />,title: "Task Draft History",        body: "Students' work auto-saves. Full version history before final submission — no lost work." },
  { icon: <RiFileTextLine />,     title: "Session Agendas",          body: "Publish structured agendas before each session so students arrive prepared." },
];

// Kanban columns — all teal shades to match Nexora theme
const KANBAN = [
  { label: "Not started", dot: "bg-zinc-400 dark:bg-zinc-600",   border: "border-l-zinc-300 dark:border-l-zinc-600", items: ["Read Ch. 4 — React Patterns", "Sprint 8 Writeup"] },
  { label: "In progress",  dot: "bg-teal-400",                    border: "border-l-teal-400",                         items: ["Portfolio Review", "Async/Await Deep Dive"] },
  { label: "Submitted",    dot: "bg-teal-500",                    border: "border-l-teal-500",                         items: ["CSS Grid Challenge", "REST API Project"] },
  { label: "Reviewed",     dot: "bg-teal-600 dark:bg-teal-400",  border: "border-l-teal-600 dark:border-l-teal-400",  items: ["Git Workflow Task", "DOM Manipulation"] },
];

export default function BootcampCohortsPage() {
  const r1 = useReveal(0.08); const r2 = useReveal(0.06);
  const r3 = useReveal(0.08); const r4 = useReveal(0.1);

  return (
    <main className="overflow-x-hidden bg-background text-foreground">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative pt-28 pb-0 overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        {/* Teal grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.03)_1px,transparent_1px)] bg-[size:52px_52px] pointer-events-none" />
        {/* Top teal bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-700 via-teal-500 to-teal-400" />
        {/* Ghost number */}
        <div className="absolute top-20 right-4 text-[22vw] font-black leading-none text-white/[0.03] select-none pointer-events-none tabular-nums hidden lg:block">
          45
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="max-w-3xl pt-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-500/10 border border-teal-500/25
                            text-teal-400 text-[11px] font-bold tracking-[.08em] uppercase mb-7">
              <RiSparklingFill className="animate-pulse" />
              Use case · Bootcamp Cohorts
            </div>

            <h1 className="text-[clamp(2.8rem,6.5vw,5.5rem)] font-black leading-[.96]
                           tracking-[-0.04em] text-white mb-7">
              Keep every<br />
              <TealText>cohort member</TealText><br />
              accountable.
            </h1>

            <p className="text-[16px] text-zinc-300 leading-[1.75] max-w-[520px] mb-10">
              Nexora is the operations layer bootcamp instructors have always needed —
              from auto-creating assignments every sprint to flagging at-risk students
              before it's too late to intervene.
            </p>

            <div className="flex flex-wrap gap-3 mb-16">
              <Link href="/register"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                           bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px]
                           shadow-lg shadow-teal-900/40
                           transition-all duration-200 hover:scale-[1.02]">
                Start your cohort <RiArrowRightLine />
              </Link>
              <Link href="/#features"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                           border border-white/15 hover:border-teal-500/50
                           text-zinc-300 hover:text-teal-300
                           font-semibold text-[15px] transition-all duration-200">
                See features
              </Link>
            </div>
          </div>
        </div>

        {/* Kanban board visual */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {KANBAN.map((col) => (
              <div key={col.label} className="bg-white/[0.04] rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07]">
                  <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{col.label}</span>
                  <span className="ml-auto text-[11px] font-bold text-zinc-600">{col.items.length}</span>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {col.items.map(item => (
                    <div key={item}
                      className={cn("px-3 py-2.5 bg-white/[0.06] rounded-xl border-l-[3px] text-[12.5px] font-semibold text-zinc-200", col.border)}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════ */}
      <div className="border-y border-border bg-muted/40">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          {[["87%","Avg submission rate"],["4×","Faster session prep"],["100%","Digital attendance"],["2 min","To onboard a member"]].map(([v, l], i) => (
            <div key={i} className="flex flex-col items-center py-10 px-4 text-center">
              <p className="text-[2.2rem] font-black text-teal-600 dark:text-teal-400 tabular-nums leading-none mb-1.5">{v}</p>
              <p className="text-[11.5px] font-semibold text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PROBLEM / SOLUTION
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div ref={r1.ref}
          className={cn("max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 grid lg:grid-cols-2 gap-6 transition-[opacity,transform] duration-700",
            r1.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>

          <div className="rounded-3xl border border-border bg-card p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                            bg-red-50 dark:bg-red-950/30
                            border border-red-200 dark:border-red-800/50
                            text-red-600 dark:text-red-400
                            text-[11px] font-bold tracking-[.08em] uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> The struggle
            </div>
            <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold leading-[1.15] tracking-tight text-foreground mb-7">
              Running a cohort on spreadsheets is a full-time job.
            </h2>
            <ul className="space-y-3.5">
              {["30+ students means 30+ Slack messages chasing submissions every week",
                "Progress tracking lives in a spreadsheet that's always out of date",
                "Students don't know their standing until demo day — far too late",
                "No alert when a student goes silent for two weeks straight",
                "Certificates require manual design and emailing per graduate",
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

          <div className="rounded-3xl border border-teal-200/60 dark:border-teal-800/50
                          bg-teal-50/50 dark:bg-teal-950/20 p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle_at_100%_0%,rgba(20,184,166,.1),transparent)] pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                            bg-teal-100 dark:bg-teal-950/60
                            border border-teal-300/60 dark:border-teal-700/60
                            text-teal-700 dark:text-teal-400
                            text-[11px] font-bold tracking-[.08em] uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> Nexora fixes this
            </div>
            <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold leading-[1.15] tracking-tight text-foreground mb-7">
              Automate the ops. Focus on teaching.
            </h2>
            <ul className="space-y-3.5">
              {["Invite 30+ students in seconds — credentials auto-sent instantly",
                "Schedule a sprint — tasks auto-create for every active student",
                "Health score flags at-risk students with a single colour indicator",
                "Inactive alerts fire automatically when a student goes quiet",
                "Auto-generate branded PDF certificates with LinkedIn-ready URLs",
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
              <RiCodeBoxLine /> Everything a cohort needs
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight leading-[1.1] text-foreground">
              Features built for fast-moving cohorts
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
      <section className="py-24 lg:py-32 bg-background">
        <div ref={r3.ref}
          className={cn("max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiSparklingFill className="animate-pulse" /> How it works
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3">
              Launch your cohort this afternoon
            </h2>
            <p className="text-muted-foreground text-[15.5px] max-w-md mx-auto">No IT department. No consultant. Just you and your students.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[["01","Create cohort cluster","Enter name, batch tag, student emails. Credentials and welcome emails auto-sent."],
              ["02","Set sprint template","Create a reusable task template so sessions auto-fill for all students."],
              ["03","Run your first sprint","Schedule. Tasks appear on every dashboard. Attendance in one click."],
              ["04","Monitor & graduate","Watch health score. Review submissions. Generate certificates."],
            ].map(([num, title, desc], i) => (
              <div key={num}
                className={cn("transition-[opacity,transform] duration-500", r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}
                style={{ transitionDelay: r3.v ? `${i * 90}ms` : "0ms" }}>
                <div className="w-14 h-14 rounded-2xl bg-teal-600 dark:bg-teal-500
                                flex items-center justify-center text-white font-black text-[17px] mb-4
                                shadow-lg shadow-teal-600/25">
                  {num}
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">{title}</h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIAL + CTA — dark cinematic strip
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(20,184,166,.05),transparent)] pointer-events-none" />
        <div ref={r4.ref}
          className={cn("relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-24 lg:py-32 grid lg:grid-cols-2 gap-14 items-center transition-[opacity,transform] duration-700",
            r4.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
          <div>
            <p className="text-[5rem] leading-none font-serif text-teal-500/20 select-none mb-2">"</p>
            <p className="text-[clamp(1rem,1.8vw,1.25rem)] font-medium text-zinc-300 leading-[1.8] italic mb-8">
              We were running a cohort of 45 students with three instructors. Before Nexora,
              half our time was admin. Now the platform handles reminders, attendance, and
              submissions tracking — we just teach.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-950 border border-teal-800/60
                              flex items-center justify-center text-[13px] font-extrabold text-teal-400">JO</div>
              <div>
                <p className="text-[14px] font-bold text-white">James Okonkwo</p>
                <p className="text-[12px] text-zinc-500">Lead Instructor · Lagos Code Academy</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold leading-[1.1] tracking-tight text-white">
              Your next cohort deserves a smarter system.
            </h2>
            <p className="text-zinc-400 text-[15px]">Free forever plan · No credit card · Live in under an hour.</p>
            <div className="flex flex-wrap gap-3 mt-2">
              <Link href="/register"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                           bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px]
                           transition-all duration-200 hover:scale-[1.02]">
                Start free <RiArrowRightLine />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                           border border-white/15 hover:border-teal-500/50
                           text-zinc-300 hover:text-teal-300 font-semibold text-[15px] transition-all">
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}