"use client";

import { RiSparklingFill, RiInformationLine } from "react-icons/ri";

export function FeatureRoadmap({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-3xl mx-auto w-full min-h-[60vh]">
      <div className="flex items-center gap-2 mb-1">
        <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm" />
        <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Roadmap</span>
      </div>
      <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">{title}</h1>
      <p className="text-[13.5px] text-muted-foreground leading-relaxed">{description}</p>
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-6 py-5">
        <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Planned capabilities</p>
        <ul className="flex flex-col gap-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-[13px] text-foreground/90 leading-snug">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500/80" />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-teal-200/50 dark:border-teal-800/40 bg-teal-50/40 dark:bg-teal-950/20 px-4 py-3 text-[12.5px] text-teal-800 dark:text-teal-300">
        <RiInformationLine className="text-base shrink-0 mt-0.5" />
        <span>Full implementation will ship in a future release. Related APIs and navigation are prepared for incremental delivery.</span>
      </div>
    </div>
  );
}
