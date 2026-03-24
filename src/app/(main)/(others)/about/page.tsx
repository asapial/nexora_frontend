"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  RiSparklingFill,
  RiGroupLine,
  RiLightbulbLine,
  RiShieldCheckLine,
  RiGlobalLine,
  RiHeartLine,
  RiArrowRightLine,
  RiLinkedinBoxLine,
  RiTwitterXLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Data ─────────────────────────────────────────────────
const STATS = [
  { value: "12,400+", label: "Active Clusters"     },
  { value: "89,000+", label: "Resources Shared"    },
  { value: "340,000+",label: "Sessions Held"       },
  { value: "28,000+", label: "Certificates Issued" },
];

const VALUES = [
  {
    icon: <RiLightbulbLine className="text-[22px]" />,
    title: "Knowledge First",
    description:
      "Every feature we build starts with one question: does this help knowledge travel faster between people? If not, we don't build it.",
    accent: "teal",
  },
  {
    icon: <RiGroupLine className="text-[22px]" />,
    title: "Mentorship at Scale",
    description:
      "The best learning happens in small, intentional groups. We build tools that make the teacher–student relationship richer, not more distant.",
    accent: "violet",
  },
  {
    icon: <RiShieldCheckLine className="text-[22px]" />,
    title: "Trust by Design",
    description:
      "Academic data is sensitive. We treat privacy as a first-class feature — not a compliance checkbox. GDPR-compliant, always.",
    accent: "amber",
  },
  {
    icon: <RiGlobalLine className="text-[22px]" />,
    title: "Globally Inclusive",
    description:
      "Great teaching happens in Dakar, Delhi, and Detroit equally. We build for every timezone, bandwidth, and institution size.",
    accent: "sky",
  },
  {
    icon: <RiHeartLine className="text-[22px]" />,
    title: "Human-Centred AI",
    description:
      "AI assists — it doesn't replace. Our AI tools surface insights and save time, but every review, every score, every decision stays human.",
    accent: "rose",
  },
  {
    icon: <RiSparklingFill className="text-[22px]" />,
    title: "Craft Over Speed",
    description:
      "We'd rather ship fewer features that work beautifully than many that frustrate. Every interaction is designed with intention.",
    accent: "emerald",
  },
];

const TEAM = [
  { name: "Dr. Priya Nair",    role: "Co-founder & CEO",         initials: "PN", color: "teal"   },
  { name: "Aryan Mehta",       role: "Co-founder & CTO",         initials: "AM", color: "violet" },
  { name: "Sara El-Amin",      role: "Head of Product",          initials: "SE", color: "amber"  },
  { name: "Lucas Ferreira",    role: "Lead Engineer",            initials: "LF", color: "sky"    },
  { name: "Dr. Fatima Hassan", role: "Head of Research",         initials: "FH", color: "rose"   },
  { name: "James Okonkwo",     role: "Head of Design",           initials: "JO", color: "emerald"},
];

const ACCENT: Record<string, { icon: string; bg: string; border: string }> = {
  teal:    { icon: "text-teal-600 dark:text-teal-400",    bg: "bg-teal-50 dark:bg-teal-950/50",    border: "border-teal-200/60 dark:border-teal-800/50"   },
  violet:  { icon: "text-violet-600 dark:text-violet-400",bg: "bg-violet-50 dark:bg-violet-950/50",border: "border-violet-200/60 dark:border-violet-800/50"},
  amber:   { icon: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/50",  border: "border-amber-200/60 dark:border-amber-800/50"  },
  sky:     { icon: "text-sky-600 dark:text-sky-400",      bg: "bg-sky-50 dark:bg-sky-950/50",      border: "border-sky-200/60 dark:border-sky-800/50"      },
  rose:    { icon: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-950/50",    border: "border-rose-200/60 dark:border-rose-800/50"    },
  emerald: { icon: "text-emerald-600 dark:text-emerald-400",bg:"bg-emerald-50 dark:bg-emerald-950/50",border:"border-emerald-200/60 dark:border-emerald-800/50"},
};

const AVATAR_COLORS: Record<string, string> = {
  teal:    "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400",
  violet:  "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400",
  amber:   "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  sky:     "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400",
  rose:    "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",
  emerald: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
};

// ─── Scroll-reveal hook ───────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Reusable section header ──────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
      <RiSparklingFill className="animate-pulse text-base" />
      {children}
    </div>
  );
}

// ─── Gradient headline ────────────────────────────────────
function GradH2({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function AboutPage() {
  const hero   = useReveal();
  const stats  = useReveal();
  const story  = useReveal();
  const values = useReveal();
  const team   = useReveal();
  const cta    = useReveal();

  return (
    <main className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(20,184,166,0.07),transparent)] pointer-events-none" />

        <div
          ref={hero.ref}
          className={cn(
            "relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center",
            "transition-[opacity,transform] duration-700",
            hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <SectionLabel>About Nexora</SectionLabel>
          <h1 className="text-[clamp(2.5rem,6vw,4.2rem)] font-extrabold tracking-tight leading-[1.07] mb-6">
            Where <GradH2>Knowledge</GradH2><br />meets Mentorship
          </h1>
          <p className="text-[clamp(1rem,2vw,1.2rem)] text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Nexora is a group management and knowledge-sharing platform built for teachers,
            researchers, and the people who learn from them. We believe the best ideas spread
            through intentional, structured communities — not noisy feeds.
          </p>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section className="py-14 border-y border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40">
        <div
          ref={stats.ref}
          className={cn(
            "max-w-5xl mx-auto px-4 sm:px-6",
            "grid grid-cols-2 lg:grid-cols-4 gap-8",
            "transition-[opacity,transform] duration-700",
            stats.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[2.2rem] font-extrabold text-teal-600 dark:text-teal-400 tabular-nums leading-none mb-1">{s.value}</p>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STORY ─────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div
          ref={story.ref}
          className={cn(
            "max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center",
            "transition-[opacity,transform] duration-700",
            story.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div>
            <SectionLabel>Our Story</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] mb-6">
              Built out of frustration<br />with scattered tools
            </h2>
            <div className="flex flex-col gap-4 text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              <p>
                Nexora was born in 2023 when Dr. Priya Nair — then running a 40-person research lab at a university — found herself juggling email threads, shared drives, spreadsheets, and WhatsApp groups just to run a single weekly session.
              </p>
              <p>
                She partnered with Aryan Mehta, a software engineer who had the same experience as a bootcamp instructor. Together they set out to build the one tool they always wished existed: a platform where a teacher can create a cluster, invite members, schedule a session, and have tasks, attendance, and feedback handled automatically.
              </p>
              <p>
                What started as a side project is now used by thousands of research groups, bootcamp cohorts, corporate training teams, and university seminars worldwide.
              </p>
            </div>
          </div>

          {/* Visual block */}
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(20,184,166,0.08),transparent)] rounded-3xl pointer-events-none" />
            <div className="relative rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 p-8 flex flex-col gap-4">
              {[
                { year: "2023", event: "Founded by Dr. Priya Nair & Aryan Mehta" },
                { year: "2024", event: "Launched publicly — 1,000 clusters in first month" },
                { year: "2024", event: "AI Study Companion & Resource Quizzes released" },
                { year: "2025", event: "12,000+ active clusters across 60+ countries" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 px-2 py-1 rounded-md mt-0.5 flex-shrink-0 tabular-nums">
                    {item.year}
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            ref={values.ref}
            className={cn(
              "text-center mb-14 transition-[opacity,transform] duration-700",
              values.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <SectionLabel>Our Values</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1]">
              What we stand for
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALUES.map((v, i) => {
              const a = ACCENT[v.accent];
              return (
                <div
                  key={v.title}
                  className={cn(
                    "rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                    "bg-white dark:bg-zinc-900",
                    "border-zinc-200/80 dark:border-zinc-800/80",
                    values.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  )}
                  style={{ transitionDelay: values.visible ? `${i * 60}ms` : "0ms" }}
                >
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4", a.bg, a.border, "border", a.icon)}>
                    {v.icon}
                  </div>
                  <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-50 mb-2">{v.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TEAM ──────────────────────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div
            ref={team.ref}
            className={cn(
              "text-center mb-14 transition-[opacity,transform] duration-700",
              team.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <SectionLabel>The Team</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1]">
              The people behind <GradH2>Nexora</GradH2>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TEAM.map((member, i) => (
              <div
                key={member.name}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl",
                  "border border-zinc-100 dark:border-zinc-800/60",
                  "hover:border-teal-200/60 dark:hover:border-teal-800/60",
                  "bg-zinc-50 dark:bg-zinc-900/50",
                  "transition-all duration-200 hover:-translate-y-1",
                  team.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: team.visible ? `${i * 70}ms` : "0ms" }}
              >
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-base font-extrabold border-2 border-white dark:border-zinc-900", AVATAR_COLORS[member.color])}>
                  {member.initials}
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50 leading-snug">{member.name}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-0.5">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section
        ref={cta.ref}
        className={cn(
          "py-20 text-center border-t border-zinc-100 dark:border-zinc-800/60",
          "transition-[opacity,transform] duration-700",
          cta.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
      >
        <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight mb-4">
          Ready to build your cluster?
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto text-base">
          Join thousands of teachers and researchers already growing on Nexora.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-bold text-[15px] transition-all hover:scale-[1.02]">
            Get started free <RiArrowRightLine />
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 h-12 px-7 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-[15px] hover:border-teal-400 dark:hover:border-teal-600 transition-colors">
            Talk to us
          </Link>
        </div>
      </section>
    </main>
  );
}