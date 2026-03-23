"use client";

import { useEffect, useRef, useState } from "react";
import {
  RiInformationLine,
  RiAlertLine,
  RiErrorWarningLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
export type BannerUrgency = "info" | "warning" | "critical" | "success";

export interface BannerData {
  text: string;
  urgency: BannerUrgency;
  ctaText?: string;
  ctaLink?: string;
  /** Set to 0 to disable auto-dismiss */
  autoDismissSeconds?: number;
}

// ─── Urgency config map ────────────────────────────────────
const BANNER_CONFIG: Record<
  BannerUrgency,
  {
    bg: string;
    border: string;
    text: string;
    ctaBg: string;
    icon: React.ReactNode;
    progressBar: string;
  }
> = {
  info: {
    bg:          "bg-sky-50/80 dark:bg-sky-950/30",
    border:      "border-sky-200/60 dark:border-sky-800/40",
    text:        "text-sky-800 dark:text-sky-200",
    ctaBg:
      "bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300",
    icon: (
      <RiInformationLine className="text-sky-500 dark:text-sky-400 text-lg flex-shrink-0" />
    ),
    progressBar: "bg-sky-400/60 dark:bg-sky-500/60",
  },
  warning: {
    bg:          "bg-amber-50/80 dark:bg-amber-950/30",
    border:      "border-amber-200/60 dark:border-amber-800/40",
    text:        "text-amber-800 dark:text-amber-200",
    ctaBg:
      "bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300",
    icon: (
      <RiAlertLine className="text-amber-500 dark:text-amber-400 text-lg flex-shrink-0" />
    ),
    progressBar: "bg-amber-400/60 dark:bg-amber-500/60",
  },
  critical: {
    bg:          "bg-red-50/80 dark:bg-red-950/30",
    border:      "border-red-200/60 dark:border-red-800/40",
    text:        "text-red-800 dark:text-red-200",
    ctaBg:
      "bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300",
    icon: (
      <RiErrorWarningLine className="text-red-500 dark:text-red-400 text-lg flex-shrink-0 animate-pulse" />
    ),
    progressBar: "bg-red-400/60 dark:bg-red-500/60",
  },
  success: {
    bg:          "bg-emerald-50/80 dark:bg-emerald-950/30",
    border:      "border-emerald-200/60 dark:border-emerald-800/40",
    text:        "text-emerald-800 dark:text-emerald-200",
    ctaBg:
      "bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
    icon: (
      <RiCheckboxCircleLine className="text-emerald-500 dark:text-emerald-400 text-lg flex-shrink-0" />
    ),
    progressBar: "bg-emerald-400/60 dark:bg-emerald-500/60",
  },
};

// ─── Default data ──────────────────────────────────────────
const DEFAULT_BANNER: BannerData = {
  text: "🎓 New course live: Mastering Research Methods — free for all members this week.",
  urgency: "info",
  ctaText: "Enroll now",
  ctaLink: "#courses",
  autoDismissSeconds: 8,
};

// ─── Component ─────────────────────────────────────────────
export default function BannerSection({
  data = DEFAULT_BANNER,
}: {
  data?: BannerData;
}) {
  const [visible, setVisible] = useState(true);
  // Increment to remount (and restart) the progress bar animation whenever
  // the urgency or text changes — without this a cached animation stays frozen.
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = BANNER_CONFIG[data.urgency];

  useEffect(() => {
    setVisible(true);
    setProgressKey((k) => k + 1);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (data.autoDismissSeconds && data.autoDismissSeconds > 0) {
      timerRef.current = setTimeout(
        () => setVisible(false),
        data.autoDismissSeconds * 1000
      );
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data.urgency, data.text, data.autoDismissSeconds]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "relative w-full border-b overflow-hidden transition-all duration-300",
        cfg.bg,
        cfg.border
      )}
    >
      {/* ── Auto-dismiss progress bar ── */}
      {data.autoDismissSeconds && data.autoDismissSeconds > 0 && (
        <>
          <style>{`@keyframes nexora-shrink { from { width: 100% } to { width: 0% } }`}</style>
          <div
            key={progressKey}
            className={cn(
              "absolute bottom-0 left-0 h-[2px] rounded-full",
              cfg.progressBar
            )}
            style={{
              width: "100%",
              animation: `nexora-shrink ${data.autoDismissSeconds}s linear forwards`,
            }}
          />
        </>
      )}

      {/* ── Content row ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">

        {/* Urgency icon */}
        {cfg.icon}

        {/* Message text */}
        <p
          className={cn(
            "flex-1 text-sm font-medium text-center leading-snug",
            cfg.text
          )}
        >
          {data.text}
        </p>

        {/* Optional CTA button */}
        {data.ctaText && data.ctaLink && (
          <a
            href={data.ctaLink}
            className={cn(
              "hidden sm:inline-flex items-center gap-1.5",
              "px-3 py-1.5 rounded-lg",
              "text-xs font-bold whitespace-nowrap flex-shrink-0",
              "transition-colors duration-150",
              cfg.ctaBg
            )}
          >
            {data.ctaText}
            <RiArrowRightLine className="text-sm" />
          </a>
        )}

        {/* Dismiss button */}
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss banner"
          className={cn(
            "flex-shrink-0 p-1 rounded-md",
            "text-zinc-400 dark:text-zinc-500",
            "hover:text-zinc-600 dark:hover:text-zinc-300",
            "hover:bg-black/5 dark:hover:bg-white/5",
            "transition-colors duration-150"
          )}
        >
          <RiCloseLine className="text-base" />
        </button>
      </div>
    </div>
  );
}