"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiGroupLine, RiFlaskLine, RiCalendarCheckLine,
  RiBookOpenLine, RiCheckboxCircleLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { teacherDashApi } from "@/lib/api";
import { toast } from "sonner";
import RefreshIcon from "@/components/shared/RefreshIcon";

type Totals = {
  clusters: number;
  sessions: number;
  resources: number;
  members: number;
  totalTasks: number;
  submittedTasks: number;
  submissionRate: number;
};

type MonthPoint = { month: string; rate?: number; count?: number };
type HourMap = Record<number, number>;

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base border mb-3", accent)}>
        {icon}
      </div>
      <p className="text-[1.5rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{value}</p>
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function BarChart({ data, dataKey, label, color }: {
  data: MonthPoint[];
  dataKey: "rate" | "count";
  label: string;
  color: string;
}) {
  const max = Math.max(...data.map(d => d[dataKey] ?? 0), 1);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-[14px] font-bold text-foreground">{label}</h2>
      </div>
      <div className="px-4 py-4 flex items-end gap-1.5 h-44">
        {data.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground self-center mx-auto">No data yet</p>
        ) : data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn("w-full rounded-t-sm transition-all duration-500", color)}
              style={{ height: `${((d[dataKey] ?? 0) / max) * 100}%`, minHeight: "2px" }}
              title={`${d.month}: ${d[dataKey]}`}
            />
            <span className="text-[8px] text-muted-foreground/50 rotate-45 origin-left">{d.month?.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatmapChart({ hourMap }: { hourMap: HourMap }) {
  const max = Math.max(...Object.values(hourMap), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-[14px] font-bold text-foreground">Resource Access Heatmap (by hour)</h2>
      </div>
      <div className="p-4 grid grid-cols-12 gap-1.5">
        {hours.map(h => {
          const count = hourMap[h] ?? 0;
          const intensity = count / max;
          return (
            <div
              key={h}
              className="rounded-md aspect-square flex items-center justify-center text-[8px] font-bold transition-all"
              style={{
                backgroundColor: `rgba(20, 184, 166, ${intensity * 0.7 + 0.05})`,
                color: intensity > 0.5 ? "white" : "var(--muted-foreground)",
              }}
              title={`${h}:00 — ${count} views`}
            >
              {h}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 animate-pulse space-y-2">
      <div className="w-9 h-9 bg-muted rounded-xl" />
      <div className="h-7 bg-muted rounded w-12" />
      <div className="h-3 bg-muted rounded w-20" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-border">
        <div className="h-4 bg-muted rounded w-40" />
      </div>
      <div className="px-4 py-4 flex items-end gap-1.5 h-44">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 bg-muted rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function TeacherAnalyticsPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [submissionTrend, setSubmissionTrend] = useState<MonthPoint[]>([]);
  const [memberGrowth, setMemberGrowth] = useState<MonthPoint[]>([]);
  const [hourMap, setHourMap] = useState<HourMap>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await teacherDashApi.getAnalytics();
      const d = r.data;
      setTotals(d?.totals ?? null);
      setSubmissionTrend(d?.submissionTrend ?? []);
      setMemberGrowth(d?.memberGrowth ?? []);
      setHourMap(d?.hourMap ?? {});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = totals ? [
    { icon: <RiFlaskLine />,         label: "Clusters",     value: totals.clusters,    accent: "text-violet-600 dark:text-violet-400 bg-violet-100/70 dark:bg-violet-950/50 border-violet-200/60 dark:border-violet-800/50" },
    { icon: <RiGroupLine />,         label: "Members",      value: totals.members,     accent: "text-teal-600 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50" },
    { icon: <RiBookOpenLine />,      label: "Resources",    value: totals.resources,   accent: "text-sky-600 dark:text-sky-400 bg-sky-100/70 dark:bg-sky-950/50 border-sky-200/60 dark:border-sky-800/50" },
    { icon: <RiCalendarCheckLine />, label: "Sessions",     value: totals.sessions,    accent: "text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/50" },
    { icon: <RiCheckboxCircleLine />,label: "Submission %", value: `${totals.submissionRate}%`, accent: "text-teal-600 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50" },
  ] : [];

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Teacher</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Analytics Dashboard</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Teaching activity overview with trends and heatmaps</p>
          </div>
          <RefreshIcon onClick={load} loading={loading} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map(s => (
              <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
            ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            <BarChart
              data={submissionTrend}
              dataKey="rate"
              label="Task Submission Rate (last 6 months)"
              color="bg-teal-500/70 dark:bg-teal-400/60"
            />
            <BarChart
              data={memberGrowth}
              dataKey="count"
              label="Member Growth (by month)"
              color="bg-violet-500/70 dark:bg-violet-400/60"
            />
          </>
        )}
      </div>

      {/* Heatmap */}
      {!loading && <HeatmapChart hourMap={hourMap} />}

      {!loading && totals && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[14px] font-bold text-foreground mb-4">Task Summary</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Total tasks assigned</span>
              <span className="text-[13px] font-bold tabular-nums text-foreground">{totals.totalTasks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Submitted / reviewed</span>
              <span className="text-[13px] font-bold tabular-nums text-foreground">{totals.submittedTasks}</span>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[13px] text-muted-foreground">Submission rate</span>
                <span className="text-[13px] font-bold tabular-nums text-foreground">{totals.submissionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    totals.submissionRate >= 70 ? "bg-teal-500" : totals.submissionRate >= 40 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  style={{ width: `${totals.submissionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
