"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  RiArrowLeftLine,
  RiDashboardLine,
  RiSearchLine,
  RiHome4Line,
  RiBookOpenLine,
  RiCustomerService2Line,
  RiSignalWifiErrorLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Quick-nav links shown below the CTA buttons ───────────
const QUICK_LINKS = [
  { label: "Features",       href: "/#features"  },
  { label: "Documentation",  href: "/docs"        },
  { label: "Contact support",href: "/contact"     },
  { label: "Platform status",href: "/status"      },
];

// ─── Suggestion cards ──────────────────────────────────────
const SUGGESTIONS = [
  {
    icon: <RiHome4Line className="text-[18px]" />,
    label: "Homepage",
    desc:  "Return to the Nexora landing page",
    href:  "/",
    color: "teal",
  },
  {
    icon: <RiDashboardLine className="text-[18px]" />,
    label: "Dashboard",
    desc:  "Go to your personal dashboard",
    href:  "/dashboard",
    color: "violet",
  },
  {
    icon: <RiBookOpenLine className="text-[18px]" />,
    label: "Resources",
    desc:  "Browse the shared resource library",
    href:  "/resources",
    color: "amber",
  },
  {
    icon: <RiCustomerService2Line className="text-[18px]" />,
    label: "Support",
    desc:  "Open a support ticket with our team",
    href:  "/support",
    color: "sky",
  },
];

const CARD_STYLES: Record<string, { icon: string; bg: string; border: string; hover: string }> = {
  teal:   { icon: "text-teal-600 dark:text-teal-400",     bg: "bg-teal-50/60 dark:bg-teal-950/30",    border: "border-teal-200/60 dark:border-teal-800/50",   hover: "hover:border-teal-300/70 dark:hover:border-teal-700/60" },
  violet: { icon: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50/60 dark:bg-violet-950/30", border: "border-violet-200/60 dark:border-violet-800/50", hover: "hover:border-violet-300/70 dark:hover:border-violet-700/60" },
  amber:  { icon: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50/60 dark:bg-amber-950/30",   border: "border-amber-200/60 dark:border-amber-800/50",   hover: "hover:border-amber-300/70 dark:hover:border-amber-700/60" },
  sky:    { icon: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-50/60 dark:bg-sky-950/30",       border: "border-sky-200/60 dark:border-sky-800/50",       hover: "hover:border-sky-300/70 dark:hover:border-sky-700/60" },
};

// ─── Animated glitch line ─────────────────────────────────
function GlitchLine({ top, delay, opacity }: { top: string; delay: number; opacity: number }) {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{
        top,
        height: "1.5px",
        background:
          "linear-gradient(90deg, transparent 0%, rgba(20,184,166,.5) 30%, rgba(20,184,166,.8) 50%, rgba(20,184,166,.5) 70%, transparent 100%)",
        opacity,
        animation: `nf-glitch ${6 + delay}s linear ${delay}s infinite`,
      }}
    />
  );
}

// ─── 404 Page ─────────────────────────────────────────────
export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after hydration
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-16">

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes nf-glitch {
          0%   { transform: scaleX(0) translateX(-100%); opacity: 0; }
          8%   { opacity: 1; transform: scaleX(1) translateX(0); }
          88%  { transform: scaleX(1) translateX(0); opacity: .7; }
          100% { transform: scaleX(1) translateX(100%); opacity: 0; }
        }
        @keyframes nf-reveal-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nf-scale-in {
          from { opacity: 0; transform: scale(.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes nf-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes nf-orb {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-18px,18px) scale(1.05); }
        }
      `}</style>

      {/* ── Background grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,184,166,.025) 1px,transparent 1px), linear-gradient(90deg,rgba(20,184,166,.025) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Radial glow ── */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 560, height: 320,
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background:
            "radial-gradient(ellipse, rgba(20,184,166,.07) 0%, transparent 65%)",
          filter: "blur(40px)",
          animation: "nf-orb 14s ease-in-out infinite",
        }}
      />

      {/* ── Corner arc decorations ── */}
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: 200, height: 200, opacity: 0.06 }}
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="0" cy="0" r="160" stroke="#14b8a6" strokeWidth=".8" />
        <circle cx="0" cy="0" r="100" stroke="#14b8a6" strokeWidth=".8" />
        <circle cx="0" cy="0" r="48"  stroke="#14b8a6" strokeWidth=".8" />
        <line x1="0" y1="100" x2="100" y2="0" stroke="#14b8a6" strokeWidth=".6" />
        <line x1="0" y1="160" x2="160" y2="0" stroke="#14b8a6" strokeWidth=".4" />
      </svg>
      <svg
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width: 200, height: 200, opacity: 0.06 }}
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="200" cy="200" r="160" stroke="#14b8a6" strokeWidth=".8" />
        <circle cx="200" cy="200" r="100" stroke="#14b8a6" strokeWidth=".8" />
        <circle cx="200" cy="200" r="48"  stroke="#14b8a6" strokeWidth=".8" />
        <line x1="200" y1="100" x2="100" y2="200" stroke="#14b8a6" strokeWidth=".6" />
      </svg>

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT COLUMN
      ═══════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">

        {/* ── Giant 404 ── */}
        <div
          className="relative select-none mb-2"
          style={{
            animation: mounted ? "nf-scale-in .7s cubic-bezier(.16,1,.3,1) both" : "none",
          }}
        >
          {/* The number */}
          <span
            className="block font-black leading-none"
            style={{
              fontSize: "clamp(96px,20vw,160px)",
              letterSpacing: "-.06em",
              background:
                "linear-gradient(180deg, rgba(20,184,166,.92) 0%, rgba(13,148,136,.55) 55%, rgba(20,184,166,.14) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip:       "text",
            }}
          >
            404
          </span>

          {/* Glitch scan lines sweeping across the 404 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-sm" aria-hidden="true">
            <GlitchLine top="28%"   delay={0}   opacity={0.5} />
            <GlitchLine top="52%"   delay={1.8} opacity={0.35} />
            <GlitchLine top="75%"   delay={3.5} opacity={0.25} />
          </div>

          {/* Floating icon above the number — the "broken cluster" metaphor */}
          <div
            className="absolute -top-5 left-1/2 -translate-x-1/2"
            style={{ animation: "nf-float 5s ease-in-out infinite" }}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-400 text-lg">
              <RiSignalWifiErrorLine />
            </div>
          </div>
        </div>

        {/* ── Eyebrow tag ── */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[.08em] uppercase mb-5 mt-1"
          style={{
            background: "rgba(20,184,166,.08)",
            border:     "1px solid rgba(20,184,166,.2)",
            color:      "#2dd4bf",
            animation:  mounted ? "nf-reveal-up .7s .1s both" : "none",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 opacity-80" />
          Page not found
        </div>

        {/* ── Headline ── */}
        <h1
          className="text-[clamp(1.5rem,3.5vw,2.2rem)] font-extrabold tracking-tight leading-[1.15] text-white mb-4"
          style={{
            animation: mounted ? "nf-reveal-up .7s .18s both" : "none",
          }}
        >
          This cluster doesn't exist
        </h1>

        {/* ── Sub-copy ── */}
        <p
          className="text-[14.5px] text-zinc-500 leading-relaxed max-w-sm mb-9"
          style={{
            animation: mounted ? "nf-reveal-up .7s .26s both" : "none",
          }}
        >
          The page you're looking for has been moved, deleted, or never existed. Let's get you back on track.
        </p>

        {/* ── CTA buttons ── */}
        <div
          className="flex flex-col sm:flex-row items-center gap-3 mb-10"
          style={{
            animation: mounted ? "nf-reveal-up .7s .34s both" : "none",
          }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[14px] font-bold shadow-lg shadow-teal-600/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RiArrowLeftLine className="text-base" />
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.09] hover:border-teal-500/30 text-zinc-300 hover:text-teal-300 text-[14px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RiDashboardLine className="text-base" />
            Go to dashboard
          </Link>
        </div>

        {/* ── Suggestion cards ── */}
        <div
          className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
          style={{
            animation: mounted ? "nf-reveal-up .7s .44s both" : "none",
          }}
        >
          {SUGGESTIONS.map((s) => {
            const st = CARD_STYLES[s.color];
            return (
              <Link
                key={s.label}
                href={s.href}
                className={cn(
                  "group flex flex-col items-center gap-2.5 px-3 py-4 rounded-2xl border",
                  "transition-all duration-200 hover:-translate-y-1",
                  st.bg, st.border, st.hover
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    "bg-white/60 dark:bg-zinc-900/60",
                    "border border-white/50 dark:border-zinc-800",
                    st.icon
                  )}
                >
                  {s.icon}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 leading-none mb-1">
                    {s.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-600 leading-snug">
                    {s.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Quick text links ── */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
          style={{
            animation: mounted ? "nf-reveal-up .7s .54s both" : "none",
          }}
        >
          {QUICK_LINKS.map((link, i) => (
            <span key={link.label} className="flex items-center gap-4">
              {i > 0 && (
                <span className="w-[3px] h-[3px] rounded-full bg-zinc-700" />
              )}
              <Link
                href={link.href}
                className="text-[12.5px] text-zinc-600 hover:text-teal-400 transition-colors duration-150"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </div>

        {/* ── Nexora branding footer ── */}
        <div
          className="mt-12 flex items-center gap-2 opacity-30"
          style={{
            animation: mounted ? "nf-reveal-up .7s .64s both" : "none",
          }}
        >
          <span className="text-teal-500 text-sm">⬡</span>
          <span className="text-[12px] font-bold tracking-tight text-zinc-500">Nexora</span>
        </div>
      </div>
    </div>
  );
}