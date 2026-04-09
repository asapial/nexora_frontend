"use client";

import { RiSparklingFill, RiArrowRightLine, RiPlayCircleLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import SectionContainer from "@/utils/SectionContainer";

// ─── Types ────────────────────────────────────────────────
export interface TrustItem {
  text: string;
}

export interface CtaButton {
  text: string;
  link: string;
  variant: "primary" | "ghost";
}

export interface CtaSectionData {
  badge?: string;
  headline: string;
  subtext: string;
  buttons: CtaButton[];
  trustItems?: TrustItem[];
  /** Solid hex color or CSS gradient string. Falls back to dark mesh. */
  backgroundColor?: string;
  /** Public image URL for background. If set, overrides backgroundColor. */
  backgroundImageUrl?: string;
  /** Optional overlay opacity 0–1 on top of the bg image */
  overlayOpacity?: number;
}

// ─── Default data ──────────────────────────────────────────
const DEFAULT_DATA: CtaSectionData = {
  badge: "Start for free today",
  headline: "Your cluster is\nwaiting to be built",
  subtext:
    "Join thousands of teachers and researchers who use Nexora to manage groups, track progress, and grow knowledge together.",
  buttons: [
    { text: "Create free account", link: "/auth/signup", variant: "primary" },
    { text: "Watch a demo", link: "/watch-demo", variant: "ghost" },
  ],
  trustItems: [
    { text: "No credit card" },
    { text: "Free forever plan" },
    { text: "GDPR compliant" },
    { text: "Cancel anytime" },
  ],
};

// ─── Section ───────────────────────────────────────────────
export default function CtaSection({ data = DEFAULT_DATA }: { data?: CtaSectionData }) {
  const hasImage = Boolean(data.backgroundImageUrl);
  const hasCustomColor = Boolean(data.backgroundColor);

  // Build the background style
  const bgStyle: React.CSSProperties = hasImage
    ? {
        backgroundImage: `url(${data.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : hasCustomColor
    ? { background: data.backgroundColor }
    : {};

  return (
    <div className="relative overflow-hidden">

      {/* ── Outer background ── */}
      <div
        className={cn(
          "relative py-24 lg:py-36",
          !hasImage && !hasCustomColor &&
            "bg-[linear-gradient(135deg,#0d1117_0%,#0f2027_40%,#0d1b1a_100%)]"
        )}
        style={bgStyle}
      >

        {/* ── Overlay on image ── */}
        {hasImage && (
          <div
            className="absolute inset-0 bg-zinc-950"
            style={{ opacity: data.overlayOpacity ?? 0.65 }}
          />
        )}

        {/* ── Mesh gradients (skip when custom solid color is set) ── */}
        {!hasCustomColor && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(20,184,166,0.12),transparent),radial-gradient(ellipse_40%_40%_at_20%_80%,rgba(13,148,136,0.08),transparent),radial-gradient(ellipse_40%_40%_at_80%_20%,rgba(20,184,166,0.06),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
          </>
        )}

        {/* ── Animated scan beam ── */}
        <div
          className="absolute top-0 bottom-0 w-[60%] bg-gradient-to-r from-transparent via-white/[0.025] to-transparent pointer-events-none"
          style={{ animation: "cta-scan 9s linear infinite" }}
        />

        <style>{`
          @keyframes cta-scan {
            from { left: -60% }
            to   { left: 120%  }
          }
        `}</style>

        {/* ── Decorative corner arcs ── */}
        <svg
          className="absolute top-0 left-0 w-48 h-48 pointer-events-none"
          style={{ opacity: 0.07 }}
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="0" cy="0" r="160" stroke="#14b8a6" strokeWidth=".7" />
          <circle cx="0" cy="0" r="100" stroke="#14b8a6" strokeWidth=".7" />
          <circle cx="0" cy="0" r="50"  stroke="#14b8a6" strokeWidth=".7" />
        </svg>
        <svg
          className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none"
          style={{ opacity: 0.07 }}
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="200" cy="200" r="160" stroke="#14b8a6" strokeWidth=".7" />
          <circle cx="200" cy="200" r="100" stroke="#14b8a6" strokeWidth=".7" />
          <circle cx="200" cy="200" r="50"  stroke="#14b8a6" strokeWidth=".7" />
        </svg>

        {/* ── Content ── */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">

          {/* Badge */}
          {data.badge && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-teal-500/10 border border-teal-500/25 text-teal-300 mb-7">
              <RiSparklingFill className="text-teal-400 animate-pulse text-base" />
              {data.badge}
            </div>
          )}

          {/* Headline */}
          <h2 className="text-[clamp(2.4rem,6vw,4rem)] font-extrabold tracking-tight leading-[1.07] text-white mb-5 whitespace-pre-line">
            {data.headline}
          </h2>

          {/* Subtext */}
          <p className="text-[clamp(1rem,1.8vw,1.15rem)] text-zinc-400 max-w-xl mx-auto leading-relaxed mb-10">
            {data.subtext}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            {data.buttons.map((btn, i) =>
              btn.variant === "primary" ? (
                <a
                  key={i}
                  href={btn.link}
                  className={cn(
                    "inline-flex items-center gap-2 h-12 px-7 rounded-xl",
                    "bg-teal-600 hover:bg-teal-700",
                    "text-white text-[15px] font-bold",
                    "shadow-lg shadow-teal-600/30",
                    "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {btn.text}
                  <RiArrowRightLine className="text-base" />
                </a>
              ) : (
                <a
                  key={i}
                  href={btn.link}
                  className={cn(
                    "inline-flex items-center gap-2 h-12 px-7 rounded-xl",
                    "bg-white/8 hover:bg-white/14",
                    "border border-white/14 hover:border-teal-500/40",
                    "text-zinc-200 hover:text-teal-300",
                    "text-[15px] font-bold",
                    "backdrop-blur-sm",
                    "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  <RiPlayCircleLine className="text-teal-400 text-base" />
                  {btn.text}
                </a>
              )
            )}
          </div>

          {/* Trust items */}
          {data.trustItems && data.trustItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {data.trustItems.map((item, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-zinc-500"
                >
                  <span className="text-teal-500">✓</span>
                  {item.text}
                  {i < (data.trustItems?.length ?? 0) - 1 && (
                    <span className="ml-3 w-1 h-1 rounded-full bg-zinc-700 hidden sm:inline-block" />
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}