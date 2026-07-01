"use client";

import Link from "next/link";
import { RiArrowRightLine, RiShieldCheckLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  APPROVED: "border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  LIVE: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  COMPLETED: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  UPCOMING: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  REJECTED: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  DRAFT: "border-zinc-500/25 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  PENDING_APPROVAL: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export function ExamStatusBadge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide", statusStyle[value] ?? statusStyle.DRAFT)}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function ExamShieldHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-600 dark:text-teal-400">
          <RiShieldCheckLine className="text-sm" />
          {eyebrow}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Link href={action.href} className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-5 text-[13px] font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700">
          {action.label}
          <RiArrowRightLine />
        </Link>
      )}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  note,
  icon,
  accent = "teal",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: React.ReactNode;
  accent?: "teal" | "violet" | "rose" | "sky";
}) {
  const accents = {
    teal: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    sky: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  };
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur-sm">
      <div className={cn("mb-4 flex h-10 w-10 items-center justify-center rounded-xl border text-lg", accents[accent])}>{icon}</div>
      <p className="text-2xl font-black tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-[12px] font-bold text-foreground/75">{label}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}
