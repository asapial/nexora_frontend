"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RiArrowRightLine, RiCheckLine, RiSparklingFill } from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
export interface UseCaseStat {
  value: string;
  label: string;
}

export interface UseCaseFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface UseCaseStep {
  number: string;
  title: string;
  description: string;
}

export interface UseCaseTestimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export interface UseCaseConfig {
  // Hero
  eyebrow: string;
  headline: string;
  headlineAccent: string; // the teal-gradient word(s)
  subheadline: string;
  heroIcon: React.ReactNode;
  heroAccentColor: string; // Tailwind color for decorative elements

  // Stats bar
  stats: UseCaseStat[];

  // Problem / Solution split
  problemHeadline: string;
  problems: string[];
  solutionHeadline: string;
  solutions: string[];

  // Features
  featuresHeadline: string;
  featuresSubtext: string;
  features: UseCaseFeature[];

  // Workflow
  workflowHeadline: string;
  workflowSubtext: string;
  steps: UseCaseStep[];

  // Testimonial
  testimonial: UseCaseTestimonial;

  // CTA
  ctaHeadline: string;
  ctaSubtext: string;
  ctaPrimary: { text: string; href: string };
  ctaSecondary: { text: string; href: string };
}

// ─── Scroll-reveal hook ───────────────────────────────────
export function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Gradient headline span ───────────────────────────────
export function TealSpan({ children }: { children: React.ReactNode }) {
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

// ─── Section eyebrow label ────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
      <RiSparklingFill className="animate-pulse text-base" />
      {children}
    </div>
  );
}

// ─── UseCasePage Layout ───────────────────────────────────
export default function UseCasePage({ config }: { config: UseCaseConfig }) {
  const hero      = useReveal(0.1);
  const stats     = useReveal(0.1);
  const problems  = useReveal(0.1);
  const features  = useReveal(0.08);
  const workflow  = useReveal(0.08);
  const quote     = useReveal(0.15);
  const cta       = useReveal(0.15);

  return (
    <main className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(20,184,166,0.08),transparent)] pointer-events-none" />
        {/* Right orb */}
        <div className="absolute right-[-120px] top-[-60px] w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(20,184,166,.25) 0%, transparent 65%)", filter: "blur(50px)" }} />

        <div
          ref={hero.ref}
          className={cn(
            "relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8",
            "grid lg:grid-cols-[1fr_auto] items-center gap-12",
            "transition-[opacity,transform] duration-700",
            hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          {/* Left copy */}
          <div className="max-w-2xl">
            <SectionLabel>{config.eyebrow}</SectionLabel>

            <h1 className="text-[clamp(2.4rem,5.5vw,4rem)] font-extrabold tracking-tight leading-[1.06] mb-6">
              {config.headline}{" "}
              <TealSpan>{config.headlineAccent}</TealSpan>
            </h1>

            <p className="text-[clamp(1rem,1.8vw,1.2rem)] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10 max-w-xl">
              {config.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={config.ctaPrimary.href}
                className={cn(
                  "inline-flex items-center gap-2 h-12 px-7 rounded-xl",
                  "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                  "text-white font-bold text-[15px]",
                  "shadow-md shadow-teal-600/20",
                  "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {config.ctaPrimary.text}
                <RiArrowRightLine className="text-base" />
              </Link>
              <Link
                href={config.ctaSecondary.href}
                className={cn(
                  "inline-flex items-center gap-2 h-12 px-7 rounded-xl",
                  "border border-zinc-200 dark:border-zinc-700",
                  "text-zinc-700 dark:text-zinc-300 font-semibold text-[15px]",
                  "hover:border-teal-400/60 dark:hover:border-teal-600/60",
                  "hover:text-teal-700 dark:hover:text-teal-400",
                  "transition-all duration-200"
                )}
              >
                {config.ctaSecondary.text}
              </Link>
            </div>
          </div>

          {/* Right hero icon block */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-[220px] h-[220px]">
              {/* Outer pulse ring */}
              <div className="absolute inset-[-16px] rounded-full border border-teal-400/20 dark:border-teal-600/20 animate-pulse" />
              <div className="absolute inset-[-32px] rounded-full border border-teal-400/10 dark:border-teal-600/10" />
              {/* Icon container */}
              <div className="w-[220px] h-[220px] rounded-[40px] bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 relative overflow-hidden"
                style={{ boxShadow: "0 20px 60px -10px rgba(20,184,166,0.15)" }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.08),transparent)] pointer-events-none" />
                <span className="relative z-10 text-[72px]">{config.heroIcon}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════ */}
      <div className="border-y border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40 py-12">
        <div
          ref={stats.ref}
          className={cn(
            "max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-8",
            "transition-[opacity,transform] duration-700",
            stats.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {config.stats.map((s, i) => (
            <div
              key={s.label}
              className="text-center"
              style={{ transitionDelay: stats.visible ? `${i * 80}ms` : "0ms" }}
            >
              <p className="text-[2rem] font-extrabold text-teal-600 dark:text-teal-400 tabular-nums leading-none mb-1">
                {s.value}
              </p>
              <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          PROBLEM / SOLUTION SPLIT
      ══════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32">
        <div
          ref={problems.ref}
          className={cn(
            "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8",
            "grid lg:grid-cols-2 gap-8",
            "transition-[opacity,transform] duration-700",
            problems.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Problem column */}
          <div className="rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-[11.5px] font-bold tracking-wider uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              The Problem
            </div>
            <h2 className="text-[1.6rem] font-extrabold tracking-tight leading-[1.2] text-zinc-900 dark:text-zinc-50 mb-6">
              {config.problemHeadline}
            </h2>
            <ul className="flex flex-col gap-4">
              {config.problems.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-[14.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5 text-[11px] font-bold">✕</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Solution column */}
          <div className="rounded-3xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/50 p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_100%_0%,rgba(20,184,166,0.12),transparent)] pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 dark:bg-teal-950/60 border border-teal-300/60 dark:border-teal-700/50 text-teal-700 dark:text-teal-400 text-[11.5px] font-bold tracking-wider uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Nexora's Solution
            </div>
            <h2 className="text-[1.6rem] font-extrabold tracking-tight leading-[1.2] text-zinc-900 dark:text-zinc-50 mb-6">
              {config.solutionHeadline}
            </h2>
            <ul className="flex flex-col gap-4">
              {config.solutions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-[14.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5">
                    <RiCheckLine className="text-[11px]" />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={features.ref}
            className={cn(
              "text-center mb-14 transition-[opacity,transform] duration-700",
              features.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <SectionLabel>Features built for you</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] mb-4">
              {config.featuresHeadline}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-[clamp(1rem,1.6vw,1.1rem)] max-w-xl mx-auto">
              {config.featuresSubtext}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {config.features.map((f, i) => (
              <div
                key={f.title}
                className={cn(
                  "group rounded-2xl border p-6 bg-white dark:bg-zinc-900",
                  "border-zinc-200/80 dark:border-zinc-800/80",
                  "hover:border-teal-300/60 dark:hover:border-teal-700/60",
                  "hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/8 dark:hover:shadow-teal-500/10",
                  "transition-all duration-300",
                  features.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: features.visible ? `${i * 60}ms` : "0ms" }}
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-50 mb-2 leading-snug">{f.title}</h3>
                <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WORKFLOW STEPS
      ══════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={workflow.ref}
            className={cn(
              "text-center mb-14 transition-[opacity,transform] duration-700",
              workflow.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] mb-4">
              {config.workflowHeadline}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-[clamp(1rem,1.6vw,1.1rem)] max-w-xl mx-auto">
              {config.workflowSubtext}
            </p>
          </div>

          <div className="relative">
            {/* Connecting spine (desktop) */}
            <div className="hidden lg:block absolute left-[28px] top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-teal-400/30 dark:via-teal-600/30 to-transparent" />

            <div className="flex flex-col gap-8">
              {config.steps.map((step, i) => (
                <div
                  key={step.number}
                  className={cn(
                    "flex gap-6 items-start",
                    "transition-[opacity,transform] duration-700",
                    workflow.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                  )}
                  style={{ transitionDelay: workflow.visible ? `${i * 100}ms` : "0ms" }}
                >
                  {/* Step number bubble */}
                  <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl bg-teal-600 dark:bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-600/25 dark:shadow-teal-500/20">
                    <span className="text-white font-extrabold text-[15px] tabular-nums">{step.number}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2 pb-2">
                    <h3 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50 mb-1.5 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIAL
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-950">
        <div
          ref={quote.ref}
          className={cn(
            "max-w-3xl mx-auto px-4 sm:px-6 text-center",
            "transition-[opacity,transform] duration-700",
            quote.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="relative inline-block">
            <span className="text-[80px] leading-none font-serif text-teal-300/30 dark:text-teal-700/30 absolute -top-4 -left-6 select-none">"</span>
            <blockquote className="relative text-[1.2rem] font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed italic mb-8">
              {config.testimonial.quote}
            </blockquote>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950/60 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[13px] font-extrabold text-teal-700 dark:text-teal-400">
              {config.testimonial.initials}
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-zinc-900 dark:text-zinc-50 leading-none">{config.testimonial.name}</p>
              <p className="text-[12.5px] text-zinc-500 dark:text-zinc-500 mt-0.5">{config.testimonial.role}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════════ */}
      <section
        ref={cta.ref}
        className={cn(
          "relative py-24 lg:py-32 overflow-hidden",
          "transition-[opacity,transform] duration-700",
          cta.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
        style={{ background: "linear-gradient(135deg, #0d1117 0%, #0a1f1c 50%, #0d1117 100%)" }}
      >
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.035)_1px,transparent_1px)] bg-[size:52px_52px] pointer-events-none" />
        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(20,184,166,0.1),transparent)] pointer-events-none" />
        {/* Corner arcs */}
        <svg className="absolute top-0 left-0 pointer-events-none opacity-[0.06]" width="180" height="180" viewBox="0 0 180 180" fill="none">
          <circle cx="0" cy="0" r="140" stroke="#14b8a6" strokeWidth=".7"/>
          <circle cx="0" cy="0" r="90" stroke="#14b8a6" strokeWidth=".7"/>
          <circle cx="0" cy="0" r="45" stroke="#14b8a6" strokeWidth=".7"/>
        </svg>
        <svg className="absolute bottom-0 right-0 pointer-events-none opacity-[0.06] rotate-180" width="180" height="180" viewBox="0 0 180 180" fill="none">
          <circle cx="0" cy="0" r="140" stroke="#14b8a6" strokeWidth=".7"/>
          <circle cx="0" cy="0" r="90" stroke="#14b8a6" strokeWidth=".7"/>
        </svg>

        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-teal-500/10 border border-teal-500/25 text-teal-300 mb-6">
            <RiSparklingFill className="text-teal-400 animate-pulse" />
            Start free today
          </div>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tight leading-[1.1] text-white mb-5">
            {config.ctaHeadline}
          </h2>
          <p className="text-zinc-400 text-[clamp(1rem,1.6vw,1.1rem)] leading-relaxed mb-10 max-w-lg mx-auto">
            {config.ctaSubtext}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={config.ctaPrimary.href}
              className={cn(
                "inline-flex items-center gap-2 h-12 px-8 rounded-xl",
                "bg-teal-600 hover:bg-teal-700",
                "text-white font-bold text-[15px]",
                "shadow-lg shadow-teal-600/30",
                "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {config.ctaPrimary.text}
              <RiArrowRightLine className="text-base" />
            </Link>
            <Link
              href={config.ctaSecondary.href}
              className={cn(
                "inline-flex items-center gap-2 h-12 px-8 rounded-xl",
                "bg-white/[0.07] hover:bg-white/[0.12]",
                "border border-white/[0.1] hover:border-teal-500/40",
                "text-zinc-300 hover:text-teal-300",
                "font-semibold text-[15px]",
                "transition-all duration-200"
              )}
            >
              {config.ctaSecondary.text}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}