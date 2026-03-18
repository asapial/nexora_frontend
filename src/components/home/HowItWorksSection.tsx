"use client";

import { useEffect, useRef, useState } from "react";
import {
  RiUserAddLine,
  RiGroupLine,
  RiCalendarCheckLine,
  RiCheckboxCircleLine,
  RiBarChartBoxLine,
  RiGraduationCapLine,
  RiSparklingFill,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface Step {
  id: string;
  number: string;                // "01" – "06"
  tag: string;                   // small eyebrow label
  icon: React.ReactNode;
  title: string;
  description: string;
  // Tailwind class bundles — fully swappable
  numberColor: string;           // step number badge bg
  numberText: string;            // step number badge text
  iconBg: string;                // icon circle bg
  iconColor: string;             // icon colour
  cardHoverBorder: string;       // card border on hover
  cardHoverShadow: string;       // card glow on hover
  tagBg: string;                 // tag pill bg
  tagText: string;               // tag pill text
  connectorColor: string;        // dashed connector line
  nodeBorder: string;            // outer node ring on hover
}

// ─── Step data ────────────────────────────────────────────
const STEPS: Step[] = [
  {
    id: "account",
    number: "01",
    tag: "Step 01",
    icon: <RiUserAddLine className="text-[22px]" />,
    title: "Create Your Account",
    description:
      "Sign up as a Teacher, join as a Student, or configure your platform as an Admin. Better Auth handles sessions, roles, and one-time credentials automatically — no manual setup needed.",
    numberColor: "bg-teal-600 dark:bg-teal-500",
    numberText: "text-white",
    iconBg: "bg-teal-50 dark:bg-teal-950/60",
    iconColor: "text-teal-600 dark:text-teal-400",
    cardHoverBorder: "hover:border-teal-300/60 dark:hover:border-teal-700/60",
    cardHoverShadow: "hover:shadow-teal-500/10 dark:hover:shadow-teal-500/15",
    tagBg: "bg-teal-50 dark:bg-teal-950/50",
    tagText: "text-teal-700 dark:text-teal-400",
    connectorColor: "border-teal-200/40 dark:border-teal-900/60",
    nodeBorder: "group-hover:ring-teal-400/20 dark:group-hover:ring-teal-500/20",
  },
  {
    id: "cluster",
    number: "02",
    tag: "Step 02",
    icon: <RiGroupLine className="text-[22px]" />,
    title: "Build Your Cluster",
    description:
      "Name your group, add a batch tag, and invite members by email. Nexora auto-generates one-time passwords and emails credentials — zero friction for students on day one.",
    numberColor: "bg-violet-600 dark:bg-violet-500",
    numberText: "text-white",
    iconBg: "bg-violet-50 dark:bg-violet-950/50",
    iconColor: "text-violet-600 dark:text-violet-400",
    cardHoverBorder: "hover:border-violet-300/60 dark:hover:border-violet-700/60",
    cardHoverShadow: "hover:shadow-violet-500/10 dark:hover:shadow-violet-500/15",
    tagBg: "bg-violet-50 dark:bg-violet-950/50",
    tagText: "text-violet-700 dark:text-violet-400",
    connectorColor: "border-violet-200/40 dark:border-violet-900/60",
    nodeBorder: "group-hover:ring-violet-400/20 dark:group-hover:ring-violet-500/20",
  },
  {
    id: "session",
    number: "03",
    tag: "Step 03",
    icon: <RiCalendarCheckLine className="text-[22px]" />,
    title: "Schedule a Session",
    description:
      "Set the date, location, online link, and deadline. Attach a task template and Nexora instantly creates one task per active member — with email and in-app notifications sent automatically.",
    numberColor: "bg-amber-600 dark:bg-amber-500",
    numberText: "text-white",
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    cardHoverBorder: "hover:border-amber-300/60 dark:hover:border-amber-700/60",
    cardHoverShadow: "hover:shadow-amber-500/10 dark:hover:shadow-amber-500/15",
    tagBg: "bg-amber-50 dark:bg-amber-950/50",
    tagText: "text-amber-700 dark:text-amber-400",
    connectorColor: "border-amber-200/40 dark:border-amber-900/60",
    nodeBorder: "group-hover:ring-amber-400/20 dark:group-hover:ring-amber-500/20",
  },
  {
    id: "submit",
    number: "04",
    tag: "Step 04",
    icon: <RiCheckboxCircleLine className="text-[22px]" />,
    title: "Members Submit & Engage",
    description:
      "Students submit tasks with text or file attachments, browse the resource library, mark session attendance, and leave structured feedback — all from their personal dashboard.",
    numberColor: "bg-sky-600 dark:bg-sky-500",
    numberText: "text-white",
    iconBg: "bg-sky-50 dark:bg-sky-950/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    cardHoverBorder: "hover:border-sky-300/60 dark:hover:border-sky-700/60",
    cardHoverShadow: "hover:shadow-sky-500/10 dark:hover:shadow-sky-500/15",
    tagBg: "bg-sky-50 dark:bg-sky-950/50",
    tagText: "text-sky-700 dark:text-sky-400",
    connectorColor: "border-sky-200/40 dark:border-sky-900/60",
    nodeBorder: "group-hover:ring-sky-400/20 dark:group-hover:ring-sky-500/20",
  },
  {
    id: "review",
    number: "05",
    tag: "Step 05",
    icon: <RiBarChartBoxLine className="text-[22px]" />,
    title: "Review, Score & Grow",
    description:
      "Teachers rate submissions with rubric-based scoring, assign follow-up homework, and track radar-chart progress per member. Milestone badges auto-assign when criteria are met.",
    numberColor: "bg-emerald-600 dark:bg-emerald-500",
    numberText: "text-white",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    cardHoverBorder: "hover:border-emerald-300/60 dark:hover:border-emerald-700/60",
    cardHoverShadow: "hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/15",
    tagBg: "bg-emerald-50 dark:bg-emerald-950/50",
    tagText: "text-emerald-700 dark:text-emerald-400",
    connectorColor: "border-emerald-200/40 dark:border-emerald-900/60",
    nodeBorder: "group-hover:ring-emerald-400/20 dark:group-hover:ring-emerald-500/20",
  },
  {
    id: "certify",
    number: "06",
    tag: "Step 06 · Milestone",
    icon: <RiGraduationCapLine className="text-[22px]" />,
    title: "Certify & Export",
    description:
      "Members complete courses and receive branded PDF certificates with unique verification URLs. Admins export full cluster performance reports as PDF or CSV for stakeholders.",
    numberColor: "bg-rose-600 dark:bg-rose-500",
    numberText: "text-white",
    iconBg: "bg-rose-50 dark:bg-rose-950/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    cardHoverBorder: "hover:border-rose-300/60 dark:hover:border-rose-700/60",
    cardHoverShadow: "hover:shadow-rose-500/10 dark:hover:shadow-rose-500/15",
    tagBg: "bg-rose-50 dark:bg-rose-950/50",
    tagText: "text-rose-700 dark:text-rose-400",
    connectorColor: "border-rose-200/40 dark:border-rose-900/60",
    nodeBorder: "group-hover:ring-rose-400/20 dark:group-hover:ring-rose-500/20",
  },
];

// ─── Scroll-reveal hook ───────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─── Single Step Row ──────────────────────────────────────
function StepRow({ step, index }: { step: Step; index: number }) {
  const isLeft = index % 2 === 0; // even → card on left, odd → card on right
  const { ref, visible } = useReveal(0.2);

  const card = (
    <div
      className={cn(
        // Base card
        "relative group/card rounded-2xl border p-6 lg:p-7",
        "bg-white dark:bg-zinc-900",
        "border-zinc-200/80 dark:border-zinc-800/80",
        // Hover
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-xl",
        step.cardHoverBorder,
        step.cardHoverShadow,
        // Reveal animation
        "transition-[opacity,transform] duration-700",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: visible ? `${index * 80}ms` : "0ms" }}
    >
      {/* Tag */}
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full mb-4",
          "text-[10px] font-bold tracking-widest uppercase",
          step.tagBg,
          step.tagText
        )}
      >
        {step.tag}
      </span>

      {/* Title */}
      <h3 className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2.5 leading-snug">
        {step.title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {step.description}
      </p>

      {/* Bottom accent — appears on hover */}
      <div
        className={cn(
          "absolute bottom-0 left-6 right-6 h-[1.5px] rounded-full",
          "opacity-0 group-hover/card:opacity-100 transition-opacity duration-300",
          // Derive bg from the step's tagText colour
          step.iconColor.replace("text-", "bg-")
        )}
      />
    </div>
  );

  // ── Connector dashes ──────────────────────────────────
  const connector = (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 h-0",
        "border-t-[1.5px] border-dashed",
        step.connectorColor,
        isLeft
          ? "right-[calc(50%+32px)] left-0" // left card → right edge to node
          : "left-[calc(50%+32px)] right-0"  // right card → left edge to node
      )}
    />
  );

  return (
    <div ref={ref} className="relative group">
      {/* ── Desktop zigzag grid (3 cols: content | node | content) ── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_80px_1fr] lg:items-center lg:gap-0 relative">

        {/* Left slot */}
        <div className={cn("pr-10", isLeft ? "flex justify-end" : "")}>
          {isLeft ? card : <div />}
        </div>

        {/* Centre node */}
        <div className="flex items-center justify-center z-10 relative">
          <div
            className={cn(
              "relative flex items-center justify-center",
              "w-16 h-16 rounded-full",
              "bg-white dark:bg-zinc-900",
              "border border-zinc-200/80 dark:border-zinc-800/60",
              "ring-4 ring-transparent transition-all duration-300",
              step.nodeBorder
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex items-center justify-center w-11 h-11 rounded-full",
                "transition-transform duration-300 group-hover:scale-110",
                step.iconBg,
                step.iconColor
              )}
            >
              {step.icon}
            </div>

            {/* Number badge */}
            <span
              className={cn(
                "absolute -top-2 -right-2",
                "w-6 h-6 rounded-full flex items-center justify-center",
                "text-[10px] font-black border-2 border-white dark:border-zinc-950",
                step.numberColor,
                step.numberText
              )}
            >
              {step.number}
            </span>
          </div>

          {/* Dashed connectors */}
          {connector}
        </div>

        {/* Right slot */}
        <div className="pl-10">
          {!isLeft ? card : <div />}
        </div>
      </div>

      {/* ── Mobile — single column ── */}
      <div className="flex lg:hidden items-start gap-4">
        {/* Left spine + node column */}
        <div className="flex flex-col items-center flex-shrink-0">
          {/* Node */}
          <div
            className={cn(
              "relative flex items-center justify-center",
              "w-14 h-14 rounded-full flex-shrink-0",
              "bg-white dark:bg-zinc-900",
              "border border-zinc-200/80 dark:border-zinc-800/60"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full",
                step.iconBg,
                step.iconColor
              )}
            >
              {step.icon}
            </div>
            <span
              className={cn(
                "absolute -top-1.5 -right-1.5",
                "w-5 h-5 rounded-full flex items-center justify-center",
                "text-[9px] font-black border-2 border-white dark:border-zinc-950",
                step.numberColor,
                step.numberText
              )}
            >
              {step.number.slice(1)} {/* show just the digit on mobile */}
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 pb-2">{card}</div>
      </div>
    </div>
  );
}

// ─── Spine between steps (desktop only) ──────────────────
function SpineSegment({ index }: { index: number }) {
  // Colour fades from one step's accent to the next
  return (
    <div className="hidden lg:flex justify-center py-0 relative z-0">
      <div className="w-px h-14 bg-gradient-to-b from-zinc-200 to-zinc-200 dark:from-zinc-800 dark:to-zinc-800" />
    </div>
  );
}

// ─── Mobile spine between steps ──────────────────────────
function MobileSpine() {
  return (
    <div className="flex lg:hidden items-start gap-4 py-0">
      <div className="flex flex-col items-center w-14 flex-shrink-0">
        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────
function SectionHeader() {
  const { ref, visible } = useReveal(0.1);

  return (
    <div
      ref={ref}
      className={cn(
        "text-center mb-20 space-y-5",
        "transition-[opacity,transform] duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60">
        <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-base animate-pulse" />
        How It Works
      </div>

      {/* Headline */}
      <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-50">
        Up and running{" "}
        <span
          style={{
            background:
              "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          in minutes
        </span>
      </h2>

      {/* Sub */}
      <p className="text-[clamp(1rem,1.8vw,1.15rem)] text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
        From signup to your first scored session — Nexora guides every step of
        the journey for teachers and members alike.
      </p>
    </div>
  );
}

// ─── End marker ───────────────────────────────────────────
function EndMarker() {
  const { ref, visible } = useReveal(0.2);
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center mt-12 gap-3",
        "transition-[opacity,transform] duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="w-px h-10 bg-gradient-to-b from-zinc-200 dark:from-zinc-800 to-transparent" />
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60 text-teal-600 dark:text-teal-400 text-xl">
        ✦
      </div>
      <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 tracking-widest uppercase mt-1">
        You're all set
      </p>
    </div>
  );
}

// ─── HOW IT WORKS SECTION (main export) ──────────────────
export default function HowItWorksSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-white dark:bg-zinc-950 overflow-hidden">

      {/* ── Background layers ── */}
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Radial centre glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(20,184,166,0.04),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(20,184,166,0.07),transparent)] pointer-events-none" />

      {/* ── Container ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <SectionHeader />

        {/* ── Desktop: spine runs behind the nodes ── */}
        <div className="relative">

          {/* Continuous spine (desktop) */}
          <div
            className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-px -translate-x-1/2 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(20,184,166,0.2) 5%, rgba(20,184,166,0.2) 95%, transparent 100%)",
            }}
          />

          {/* Steps */}
          <div className="flex flex-col gap-10 lg:gap-8">
            {STEPS.map((step, i) => (
              <StepRow key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>

        <EndMarker />
      </div>
    </section>
  );
}