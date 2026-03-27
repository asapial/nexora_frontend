"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiMoneyDollarCircleLine, RiArrowRightLine,
  RiPercentLine, RiBookOpenLine, RiGroupLine, RiSearchLine,
  RiArrowUpLine, RiArrowDownLine, RiTrophyLine, RiRefreshLine,
  RiAlertLine, RiLoader4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { courseApi } from "../../../../../../lib/api";

// ─── Ambient ──────────────────────────────────────────────
function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.09) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="absolute -top-40 left-1/4 w-[600px] h-[400px] rounded-full bg-teal-500/[0.05] blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[110px]" />
      {/* Decorative horizontal line */}
      <div className="absolute top-[220px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/10 to-transparent" />
    </div>
  );
}

const fmtCurrency = (n: number, compact = false) => {
  if (compact && n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
};
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// ─── Sparkline ────────────────────────────────────────────
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i}
          className={cn("flex-1 rounded-sm transition-all duration-700", i === values.length - 1 ? "bg-teal-500" : "bg-teal-500/40 dark:bg-teal-500/30")}
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, sub, trend, accent, loading }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  trend?: number; accent: "teal" | "amber" | "blue"; loading?: boolean;
}) {
  const clr = {
    teal:  "bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400",
    amber: "bg-amber-100/70 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400",
    blue:  "bg-blue-100/70 dark:bg-blue-950/50 border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="relative rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-5 py-5 flex flex-col gap-3 hover:border-teal-200/50 dark:hover:border-teal-800/40 transition-colors overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-teal-500/[0.015] pointer-events-none" />
      <div className="flex items-start justify-between relative z-10">
        <div className={cn("w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg border", clr[accent])}>{icon}</div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-[11.5px] font-bold px-2 py-1 rounded-lg",
            trend >= 0 ? "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30" : "text-red-500 bg-red-50/60 dark:bg-red-950/20")}>
            {trend >= 0 ? <RiArrowUpLine className="text-xs" /> : <RiArrowDownLine className="text-xs" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        {loading ? <div className="h-7 w-20 rounded-lg bg-muted/60 animate-pulse mb-1" />
          : <p className="text-[26px] font-extrabold text-foreground leading-none tracking-tight tabular-nums">{value}</p>}
        <p className="text-[12.5px] text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Course Bar ───────────────────────────────────────────
function CourseBar({ title, earning, enrollments, revenuePercent, max, onClick }: {
  title: string; earning: number; enrollments: number; revenuePercent: number; max: number; onClick: () => void;
}) {
  const pct = max > 0 ? (earning / max) * 100 : 0;
  return (
    <div onClick={onClick}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-border bg-card/90 backdrop-blur-sm hover:border-teal-200/60 dark:hover:border-teal-800/50 hover:shadow-md hover:shadow-teal-500/5 cursor-pointer transition-all duration-200">
      <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-base"><RiBookOpenLine /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[13.5px] font-bold text-foreground truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{title}</p>
          <p className="text-[13.5px] font-extrabold text-foreground flex-shrink-0 ml-3 tabular-nums">{fmtCurrency(earning)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11.5px] text-muted-foreground flex-shrink-0">{enrollments} students</span>
          <span className="text-[11.5px] text-muted-foreground flex-shrink-0">{revenuePercent}%</span>
        </div>
      </div>
      <RiArrowRightLine className="text-muted-foreground text-sm flex-shrink-0 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function EarningsDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPages, setTxPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const fetchSummary = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await courseApi.getEarnings(); setSummary(r.data); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(PER_PAGE) };
      if (search) params.search = search;
      const r = await courseApi.getTransactions(params);
      setTransactions(r.data.data);
      setTxTotal(r.data.total);
      setTxPages(r.data.totalPages);
    } catch { }
    finally { setTxLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const totalEarned = summary?.totalEarned ?? 0;
  const perCourse: any[] = summary?.perCourse ?? [];
  const maxCourseEarning = Math.max(...perCourse.map((c: any) => c._sum?.teacherEarning ?? 0), 1);
  // Mock sparkline until real monthly data endpoint exists
  const sparklineData = [820, 1200, 960, 1540, 1380, 2100, 1760, Math.round(totalEarned / 10) || 2480];

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full min-h-screen">
      <AmbientBg />

      {/* Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Earnings</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Earnings Dashboard</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">Track your revenue across all courses and transactions.</p>
        </div>
        <button onClick={fetchSummary} disabled={loading}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50" title="Refresh">
          <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
          <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
          <p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p>
          <button onClick={fetchSummary} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline flex-shrink-0">Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<RiMoneyDollarCircleLine />} label="Total earned" value={fmtCurrency(totalEarned)} sub="All time" trend={14} accent="teal" loading={loading} />
        <StatCard icon={<RiTrophyLine />} label="Paid enrollments" value={String(transactions.filter(t => t.teacherEarning > 0).length)} accent="amber" loading={loading} />
        <StatCard icon={<RiGroupLine />} label="Total students" value={String(perCourse.reduce((a: number, c: any) => a + (c._count?.id ?? 0), 0))} accent="blue" loading={loading} />
        <StatCard icon={<RiPercentLine />} label="Avg. revenue cut" value="70%" sub="Platform-set per course" accent="teal" loading={loading} />
      </div>

      {/* Sparkline chart */}
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-6 py-5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-teal-500/[0.02] pointer-events-none" />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <p className="text-[14px] font-bold text-foreground">Monthly earnings trend</p>
            <p className="text-[12px] text-muted-foreground">Last 8 months</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-extrabold text-foreground tabular-nums">{fmtCurrency(sparklineData[7])}</p>
            <p className="text-[11.5px] text-muted-foreground">This month</p>
          </div>
        </div>
        <div className="relative z-10">
          <Sparkline values={sparklineData} />
          <div className="flex justify-between mt-2">
            {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map(m => <span key={m} className="text-[10.5px] text-muted-foreground/50">{m}</span>)}
          </div>
        </div>
      </div>

      {/* Per-course breakdown */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-foreground">Per-course breakdown</p>
          <button onClick={() => router.push("/teacher/courses")} className="flex items-center gap-1.5 text-[12px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            View all courses <RiArrowRightLine className="text-xs" />
          </button>
        </div>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />)
          : perCourse.length === 0
            ? <div className="rounded-2xl border border-border bg-card/80 py-10 flex flex-col items-center gap-2"><p className="text-[13px] text-muted-foreground">No course data yet</p></div>
            : perCourse.map((c: any, i: number) => (
                <CourseBar key={c.courseId ?? i}
                  title={c.courseTitle ?? `Course ${i + 1}`}
                  earning={c._sum?.teacherEarning ?? 0}
                  enrollments={c._count?.id ?? 0}
                  revenuePercent={70}
                  max={maxCourseEarning}
                  onClick={() => router.push(`/teacher/courses/${c.courseId}`)} />
              ))
        }
      </div>

      {/* Transaction history */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-foreground">Transaction history</p>
          <div className="relative w-56">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm pointer-events-none" />
            <input type="text" placeholder="Search…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 rounded-xl text-[12.5px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border bg-muted/20">
            {["Student", "Course", "Total", "Your cut", "Date"].map(h => <p key={h} className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{h}</p>)}
          </div>
          {txLoading
            ? <div className="divide-y divide-border">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 animate-pulse">{Array.from({ length: 5 }).map((_, j) => <div key={j} className="h-4 rounded-full bg-muted/50" />)}</div>)}</div>
            : (
              <div className="divide-y divide-border">
                {transactions.length === 0
                  ? <div className="py-10 text-center"><p className="text-[13px] text-muted-foreground">No transactions found</p></div>
                  : transactions.map((tx: any) => (
                      <div key={tx.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors">
                        <p className="text-[13px] font-semibold text-foreground truncate">{tx.studentName ?? "—"}</p>
                        <p className="text-[12.5px] text-muted-foreground truncate">{tx.courseTitle ?? "—"}</p>
                        <p className="text-[13px] font-bold text-foreground tabular-nums">
                          {tx.totalAmount > 0 ? fmtCurrency(tx.totalAmount) : <span className="text-teal-600 dark:text-teal-400">Free</span>}
                        </p>
                        <p className={cn("text-[13px] font-bold tabular-nums", tx.teacherEarning > 0 ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground")}>
                          {tx.teacherEarning > 0 ? fmtCurrency(tx.teacherEarning) : "—"}
                        </p>
                        <p className="text-[12.5px] text-muted-foreground">{fmtDate(tx.transactedAt)}</p>
                      </div>
                    ))
                }
              </div>
            )
          }
        </div>

        {/* Pagination */}
        {txPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] text-muted-foreground">Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, txTotal)} of {txTotal}</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3.5 rounded-lg border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Previous</button>
              {Array.from({ length: Math.min(txPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-[12.5px] font-bold transition-all", page === p ? "bg-teal-600 dark:bg-teal-500 text-white" : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>{p}</button>
              ))}
              <button disabled={page === txPages} onClick={() => setPage(p => p + 1)} className="h-8 px-3.5 rounded-lg border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}