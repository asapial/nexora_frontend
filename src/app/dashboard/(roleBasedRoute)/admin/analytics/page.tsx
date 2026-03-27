"use client";

import { useState, useEffect } from "react";
import {
  RiBarChartBoxLine, RiGroupLine, RiFlaskLine, RiCalendarCheckLine,
  RiBookOpenLine, RiSparklingFill, RiFileTextLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

const apiFetch = (url: string, opts?: RequestInit) =>
  fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...opts }).then(r => r.json());

export default function AdminAnalyticsPage() {
  const [totals,    setTotals]    = useState<any>(null);
  const [dau,       setDau]       = useState<any[]>([]);
  const [signups,   setSignups]   = useState<any[]>([]);
  const [revenue,   setRevenue]   = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/analytics/totals"),
      apiFetch("/api/admin/analytics/dau?days=30"),
      apiFetch("/api/admin/analytics/signups?days=30"),
      apiFetch("/api/admin/analytics/revenue"),
      apiFetch("/api/admin/analytics/breakdown"),
    ]).then(([t, d, s, r, b]) => {
      if (t.success) setTotals(t.data);
      if (d.success) setDau(d.data);
      if (s.success) setSignups(s.data);
      if (r.success) setRevenue(r.data);
      if (b.success) setBreakdown(b.data);
      setLoading(false);
    });
  }, []);

  const STAT_CARDS = totals ? [
    { label: "Total Users",  value: totals.users,       icon: <RiGroupLine />,         accent: "teal"   },
    { label: "Clusters",     value: totals.clusters,    icon: <RiFlaskLine />,          accent: "violet" },
    { label: "Sessions",     value: totals.sessions,    icon: <RiCalendarCheckLine />, accent: "amber"  },
    { label: "Resources",    value: totals.resources,   icon: <RiBookOpenLine />,       accent: "sky"    },
    { label: "Enrollments",  value: totals.enrollments, icon: <RiFileTextLine />,       accent: "teal"   },
  ] : [];

  const ACCENTS: Record<string, any> = {
    teal:   { i: "text-teal-600 dark:text-teal-400",     b: "bg-teal-100/70 dark:bg-teal-950/50",     br: "border-teal-200/70 dark:border-teal-800/50"   },
    violet: { i: "text-violet-600 dark:text-violet-400", b: "bg-violet-100/70 dark:bg-violet-950/50", br: "border-violet-200/70 dark:border-violet-800/50" },
    amber:  { i: "text-amber-600 dark:text-amber-400",   b: "bg-amber-100/70 dark:bg-amber-950/50",   br: "border-amber-200/70 dark:border-amber-800/50"  },
    sky:    { i: "text-sky-600 dark:text-sky-400",       b: "bg-sky-100/70 dark:bg-sky-950/50",       br: "border-sky-200/70 dark:border-sky-800/50"      },
  };

  const maxDau = Math.max(...dau.map(d => d.count), 1);
  const maxRev = Math.max(...revenue.map(r => r.revenue), 1);
  const maxSig = Math.max(...signups.map(s => s.count), 1);

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
        </div>
        <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Platform Analytics</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-teal-200 dark:border-teal-800 border-t-teal-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAT_CARDS.map(s => {
              const a = ACCENTS[s.accent];
              return (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base border mb-3", a.b, a.br, a.i)}>
                    {s.icon}
                  </div>
                  <p className="text-[1.5rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">
                    {s.value?.toLocaleString()}
                  </p>
                  <p className="text-[12px] font-medium text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* DAU chart */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-bold text-foreground">Daily Active Users (30d)</h2>
              </div>
              <div className="px-5 py-4 flex items-end gap-1 h-40">
                {dau.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-teal-500/70 dark:bg-teal-400/60 transition-all duration-500"
                      style={{ height: `${(d.count / maxDau) * 100}%`, minHeight: "2px" }}
                      title={`${d.date}: ${d.count}`}
                    />
                  </div>
                ))}
                {dau.length === 0 && (
                  <p className="text-[12.5px] text-muted-foreground self-center mx-auto">No data yet</p>
                )}
              </div>
            </div>

            {/* Signup trends */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-bold text-foreground">New Signups (30d)</h2>
              </div>
              <div className="px-5 py-4 flex items-end gap-1 h-40">
                {signups.map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-t-sm bg-violet-500/70 dark:bg-violet-400/60 transition-all duration-500"
                      style={{ height: `${(s.count / maxSig) * 100}%`, minHeight: "2px" }}
                      title={`${s.date}: ${s.count}`}
                    />
                  </div>
                ))}
                {signups.length === 0 && (
                  <p className="text-[12.5px] text-muted-foreground self-center mx-auto">No data yet</p>
                )}
              </div>
            </div>

            {/* Revenue */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-bold text-foreground">Monthly Revenue</h2>
              </div>
              <div className="px-5 py-4 flex items-end gap-2 h-40">
                {revenue.map((r, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-amber-500/70 dark:bg-amber-400/60"
                      style={{ height: `${(r.revenue / maxRev) * 100}%`, minHeight: "2px" }}
                      title={`${r.month}: $${r.revenue}`}
                    />
                    <span className="text-[9px] text-muted-foreground/60 rotate-45 origin-left">{r.month?.slice(5)}</span>
                  </div>
                ))}
                {revenue.length === 0 && (
                  <p className="text-[12.5px] text-muted-foreground self-center mx-auto">No revenue data</p>
                )}
              </div>
            </div>

            {/* Role breakdown */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-bold text-foreground">User Role Breakdown</h2>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3">
                {breakdown.map((b: any) => {
                  const total = breakdown.reduce((s: number, x: any) => s + x._count._all, 0);
                  const pct   = Math.round((b._count._all / total) * 100);
                  const colors: Record<string, string> = {
                    STUDENT: "bg-sky-500",
                    TEACHER: "bg-teal-500",
                    ADMIN:   "bg-violet-500",
                  };
                  return (
                    <div key={b.role}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{b.role}</span>
                        <span className="text-[13px] font-bold text-foreground">{b._count._all} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", colors[b.role] ?? "bg-zinc-500")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}