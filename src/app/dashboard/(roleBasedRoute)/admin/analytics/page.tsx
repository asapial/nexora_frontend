"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiBarChartBoxLine, RiGroupLine, RiFlaskLine, RiCalendarCheckLine,
  RiBookOpenLine, RiSparklingFill, RiFileTextLine, RiRefreshLine,
  RiMoneyDollarCircleLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminPlatformApi, adminApi } from "@/lib/api";

function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: number | string; accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base border mb-3", accent)}>
        {icon}
      </div>
      <p className="text-[1.5rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 animate-pulse space-y-3">
      <div className="w-9 h-9 bg-muted rounded-xl" />
      <div className="h-7 bg-muted rounded w-16" />
      <div className="h-3 bg-muted rounded w-24" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-border"><div className="h-4 bg-muted rounded w-40" /></div>
      <div className="px-5 py-4 flex items-end gap-1 h-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 bg-muted rounded-t-sm" style={{ height: `${Math.random() * 70 + 15}%` }} />
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, getLabel, getValue, color, title }: {
  data: any[];
  getLabel: (d: any) => string;
  getValue: (d: any) => number;
  color: string;
  title: string;
}) {
  const max = Math.max(...data.map(getValue), 1);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-[14px] font-bold text-foreground">{title}</h2>
      </div>
      <div className="px-5 py-4 flex items-end gap-1 h-44">
        {data.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground self-center mx-auto">No data yet</p>
        ) : data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn("w-full rounded-t-sm transition-all duration-700", color)}
              style={{ height: `${(getValue(d) / max) * 100}%`, minHeight: "2px" }}
              title={`${getLabel(d)}: ${getValue(d)}`}
            />
            <span className="text-[8px] text-muted-foreground/50">{getLabel(d).slice(-5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [totals, setTotals]       = useState<any>(null);
  const [signupTrend, setSignup]  = useState<any[]>([]);
  const [storage, setStorage]     = useState<any[]>([]);
  const [revenue, setRevenue]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [platform, rev] = await Promise.all([
        adminPlatformApi.getAnalytics(),
        adminApi.getRevenue(),
      ]);
      const p = platform.data;
      setTotals(p?.totals ?? null);
      setSignup(p?.signupTrend ?? []);
      setStorage(p?.storageBreakdown ?? []);
      setRevenue(rev.data ?? null);
    } catch {
      // fail silently — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const STAT_CARDS = totals ? [
    { label: "Total Users",   value: totals.totalUsers,       icon: <RiGroupLine />,         accent: "text-teal-600 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50" },
    { label: "Teachers",      value: totals.teacherCount,     icon: <RiBarChartBoxLine />,   accent: "text-violet-600 dark:text-violet-400 bg-violet-100/70 dark:bg-violet-950/50 border-violet-200/60 dark:border-violet-800/50" },
    { label: "Students",      value: totals.studentCount,     icon: <RiFlaskLine />,          accent: "text-sky-600 dark:text-sky-400 bg-sky-100/70 dark:bg-sky-950/50 border-sky-200/60 dark:border-sky-800/50" },
    { label: "Clusters",      value: totals.totalClusters,    icon: <RiCalendarCheckLine />, accent: "text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/50" },
    { label: "Sessions",      value: totals.totalSessions,    icon: <RiBookOpenLine />,       accent: "text-teal-600 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50" },
    { label: "Resources",     value: totals.totalResources,   icon: <RiFileTextLine />,       accent: "text-violet-600 dark:text-violet-400 bg-violet-100/70 dark:bg-violet-950/50 border-violet-200/60 dark:border-violet-800/50" },
    { label: "Enrollments",   value: totals.totalEnrollments, icon: <RiGroupLine />,         accent: "text-sky-600 dark:text-sky-400 bg-sky-100/70 dark:bg-sky-950/50 border-sky-200/60 dark:border-sky-800/50" },
    { label: "Revenue (USD)", value: `$${(revenue?.totalRevenue ?? 0).toFixed(2)}`, icon: <RiMoneyDollarCircleLine />, accent: "text-teal-600 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50" },
  ] : [];

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Platform Analytics</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Live platform metrics, trends, and storage breakdown</p>
          </div>
          <button onClick={load}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : STAT_CARDS.map(s => (
              <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            <BarChart
              data={signupTrend}
              getLabel={d => d.date}
              getValue={d => d.count}
              color="bg-violet-500/70 dark:bg-violet-400/60"
              title="New Signups (last 30 days)"
            />
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-bold text-foreground">Storage Breakdown (by file type)</h2>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {storage.length === 0 ? (
                  <p className="text-[12.5px] text-muted-foreground">No resources yet</p>
                ) : storage.map((s: any, i: number) => {
                  const total = storage.reduce((acc: number, x: any) => acc + x.count, 0);
                  const pct = Math.round((s.count / total) * 100);
                  const colors = ["bg-teal-500", "bg-violet-500", "bg-amber-500", "bg-sky-500", "bg-rose-500"];
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[12.5px] font-semibold text-foreground">{s.fileType}</span>
                        <span className="text-[12.5px] font-bold text-foreground">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", colors[i % colors.length])} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {!loading && revenue && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[14px] font-bold text-foreground mb-4">Revenue Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Revenue", val: `$${(revenue.totalRevenue ?? 0).toFixed(2)}` },
              { label: "Teacher Earnings", val: `$${(revenue.totalTeacherEarning ?? 0).toFixed(2)}` },
              { label: "Platform Earnings", val: `$${(revenue.totalPlatformEarning ?? 0).toFixed(2)}` },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-muted/20 border border-border p-4 text-center">
                <p className="text-[1.25rem] font-extrabold tabular-nums text-foreground">{s.val}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}