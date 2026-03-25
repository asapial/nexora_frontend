"use client";

import { useEffect, useState } from "react";
import {
  RiFlaskLine,
  RiGroupLine,
  RiCalendarLine,
  RiTimeLine,
  RiArrowRightLine,
  RiSparklingFill,
  RiShieldCheckLine,
  RiAlertLine,
  RiHeartPulseLine,
} from "react-icons/ri";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type HealthStatus = "HEALTHY" | "AT_RISK" | "INACTIVE";

interface Cluster {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  batchTag: string | null;
  healthScore: number;
  healthStatus: HealthStatus;
  isActive: boolean;
  teacher: { name: string; email: string } | null;
  memberCount: number;
  sessionCount: number;
  upcomingSession: { id: string; title: string; scheduledAt: string } | null;
  joinedAt: string;
  subtype: string;
}

// ─── Token maps ───────────────────────────────────────────────────────────────
const HEALTH_BAR = (h: number) =>
  h >= 80 ? "bg-teal-500" : h >= 50 ? "bg-amber-400" : "bg-red-400";

const HEALTH_BADGE: Record<HealthStatus, string> = {
  HEALTHY:
    "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  AT_RISK:
    "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50",
  INACTIVE:
    "bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50",
};

const HEALTH_ICON: Record<HealthStatus, React.ReactNode> = {
  HEALTHY: <RiShieldCheckLine />,
  AT_RISK: <RiAlertLine />,
  INACTIVE: <RiHeartPulseLine />,
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ClusterSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
      <div className="mt-4 h-1.5 bg-muted rounded-full" />
      <div className="mt-3 flex gap-4">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-3 bg-muted rounded w-24" />
      </div>
    </div>
  );
}

// ─── ClusterCard ──────────────────────────────────────────────────────────────
function ClusterCard({ c }: { c: Cluster }) {
  const badgeCls = HEALTH_BADGE[c.healthStatus] ?? HEALTH_BADGE.INACTIVE;
  const statusLabel =
    c.healthStatus === "AT_RISK"
      ? "At Risk"
      : c.healthStatus.charAt(0) + c.healthStatus.slice(1).toLowerCase();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:shadow-black/[0.04] dark:hover:shadow-black/20 transition-shadow duration-200">
      {/* Top accent bar */}
      <div
        className={cn("h-1 w-full", HEALTH_BAR(c.healthScore))}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-[19px] bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-teal-600 dark:text-teal-400">
            <RiFlaskLine />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[14px] font-bold text-foreground leading-snug truncate">
                {c.name}
              </p>
              <span
                className={cn(
                  "flex-shrink-0 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                  badgeCls
                )}
              >
                {HEALTH_ICON[c.healthStatus]}
                {statusLabel}
              </span>
            </div>
            {c.batchTag && (
              <span className="text-[11px] text-muted-foreground/70 font-medium">
                {c.batchTag}
              </span>
            )}
          </div>
        </div>

        {/* Health bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", HEALTH_BAR(c.healthScore))}
              style={{ width: `${c.healthScore}%` }}
            />
          </div>
          <span className="text-[12px] font-bold tabular-nums text-foreground/60 w-7 text-right flex-shrink-0">
            {Math.round(c.healthScore)}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <RiGroupLine className="text-[13px] text-teal-500" />
            {c.memberCount} members
          </span>
          <span className="flex items-center gap-1.5">
            <RiCalendarLine className="text-[13px] text-violet-500" />
            {c.sessionCount} sessions
          </span>
        </div>

        {/* Teacher */}
        {c.teacher && (
          <p className="text-[11.5px] text-muted-foreground mb-3">
            <span className="text-foreground/50">Taught by </span>
            <span className="font-semibold text-foreground/70">{c.teacher.name}</span>
          </p>
        )}

        {/* Upcoming session */}
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground/70 mb-4">
          <RiTimeLine className="text-xs flex-shrink-0" />
          {c.upcomingSession
            ? `Next: ${formatDate(c.upcomingSession.scheduledAt)}`
            : "No upcoming session"}
        </div>

        {/* Link */}
        <Link
          href={`/dashboard/student/cluster/${c.id}`}
          className="flex items-center gap-1 text-[12.5px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          View cluster <RiArrowRightLine />
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentClusterPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/clusters", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClusters(d.data);
        else setError(d.message || "Failed to load clusters");
      })
      .catch(() => setError("Network error — could not load clusters"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
            My Learning
          </span>
        </div>
        <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">
          My Clusters
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          All study clusters you are enrolled in
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200/70 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-[13px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ClusterSkeleton key={i} />)
          : clusters.length === 0 && !error
          ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-teal-500 flex items-center justify-center text-3xl mb-4">
                <RiFlaskLine />
              </div>
              <p className="text-[14px] font-semibold text-foreground mb-1">
                No clusters yet
              </p>
              <p className="text-[12.5px] text-muted-foreground">
                You haven&apos;t been added to any cluster yet. Contact your teacher.
              </p>
            </div>
          )
          : clusters.map((c) => <ClusterCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}
