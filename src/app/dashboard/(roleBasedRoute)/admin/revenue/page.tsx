"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiMoneyDollarCircleLine, RiGroupLine,
  RiBookOpenLine, RiLineChartLine, RiCalendarLine, RiArrowUpLine,
  RiFileTextLine, RiUserLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "../../../../../lib/api";
import { toast } from "sonner";
import RefreshIcon from "@/components/shared/RefreshIcon";

const fmtUSD  = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AdminRevenuePage() {
  const [revenue, setRevenue]         = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [txLoading,    setTxLoading]  = useState(true);

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    try { const r = await adminApi.getRevenue(); setRevenue(r.data); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const r = await adminApi.getRevenueTransactions({ limit: "50" });
      const raw = r.data;
      setTransactions(Array.isArray(raw) ? raw : (raw as any).data ?? []);
    } catch { }
    finally { setTxLoading(false); }
  }, []);

  useEffect(() => { loadRevenue(); loadTransactions(); }, [loadRevenue, loadTransactions]);

  const platformEarnings   = revenue?.platformEarnings   ?? 0;
  const teacherPayouts     = revenue?.teacherPayouts      ?? 0;
  const grossRevenue       = revenue?.grossRevenue        ?? (platformEarnings + teacherPayouts);
  const perCourse          = (revenue?.perCourse         ?? []) as any[];
  const perTeacher         = (revenue?.perTeacher        ?? []) as any[];

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Revenue Overview</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Platform-wide earnings, per-course and per-teacher breakdown</p>
          </div>
          <RefreshIcon onClick={() => { loadRevenue(); loadTransactions(); }} loading={loading} />
        </div>
      </div>

      {/* Top revenue stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <RiMoneyDollarCircleLine />, l: "Gross Revenue",      v: fmtUSD(grossRevenue),      cls: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/40", desc: "Total paid by students" },
          { icon: <RiArrowUpLine />,           l: "Platform Earnings",  v: fmtUSD(platformEarnings),  cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/40", desc: "Platform's cut" },
          { icon: <RiUserLine />,              l: "Teacher Payouts",    v: fmtUSD(teacherPayouts),    cls: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40", desc: "Teachers' earnings" },
        ].map(s => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-base border mb-3", s.cls)}>{s.icon}</div>
            {loading ? (
              <div className="h-7 w-2/3 rounded-xl bg-muted animate-pulse mb-1" />
            ) : (
              <p className="text-[1.5rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{s.v}</p>
            )}
            <p className="text-[13px] font-semibold text-foreground">{s.l}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Per-course breakdown */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <RiBookOpenLine className="text-teal-600 dark:text-teal-400" />
            <p className="text-[14px] font-bold text-foreground">Per-Course Earnings</p>
            <span className="ml-auto text-[12px] text-muted-foreground">{perCourse.length} courses</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : perCourse.length === 0 ? (
            <p className="px-5 py-8 text-[13px] text-muted-foreground text-center italic">No course revenue data yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {perCourse.slice(0, 10).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/15 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{c.title ?? c.courseTitle ?? "—"}</p>
                    <p className="text-[11.5px] text-muted-foreground">{c.enrollments ?? 0} enrollments</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold text-foreground tabular-nums">{fmtUSD(c.revenue ?? c.total ?? 0)}</p>
                    <p className="text-[11px] text-muted-foreground/70">Platform: {fmtUSD(c.platformCut ?? 0)}</p>
                  </div>
                </div>
              ))}
              {perCourse.length > 10 && (
                <p className="px-5 py-3 text-[12px] text-muted-foreground text-center">+{perCourse.length - 10} more courses</p>
              )}
            </div>
          )}
        </div>

        {/* Per-teacher breakdown */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <RiUserLine className="text-amber-600 dark:text-amber-400" />
            <p className="text-[14px] font-bold text-foreground">Per-Teacher Earnings</p>
            <span className="ml-auto text-[12px] text-muted-foreground">{perTeacher.length} teachers</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : perTeacher.length === 0 ? (
            <p className="px-5 py-8 text-[13px] text-muted-foreground text-center italic">No teacher earnings data yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {perTeacher.slice(0, 10).map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/15 transition-colors">
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 text-sm">
                    <RiUserLine />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{t.name ?? t.teacherName ?? "—"}</p>
                    <p className="text-[11.5px] text-muted-foreground">{t.courses ?? 0} courses</p>
                  </div>
                  <p className="text-[13px] font-bold text-amber-600 dark:text-amber-400 tabular-nums flex-shrink-0">
                    {fmtUSD(t.earnings ?? t.total ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction log */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <RiFileTextLine className="text-teal-600 dark:text-teal-400" />
          <p className="text-[14px] font-bold text-foreground">Transaction Log</p>
          <span className="ml-auto text-[12px] text-muted-foreground">{transactions.length} records</span>
        </div>
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_120px_120px_100px] gap-4 px-5 py-3 border-b border-border bg-muted/20">
          {["Student", "Course", "Date", "Amount", "Status"].map(h => (
            <p key={h} className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>
        {txLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_120px_120px_100px] gap-4 px-5 py-3.5 border-b border-border/60 animate-pulse">
              {Array.from({ length: 5 }).map((_, j) => <div key={j} className="h-3 bg-muted rounded" />)}
            </div>
          ))
        ) : transactions.length === 0 ? (
          <div className="py-14 text-center">
            <RiFileTextLine className="text-4xl text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No transactions yet.</p>
          </div>
        ) : transactions.map((tx: any, i: number) => (
          <div key={tx.id ?? i} className="grid grid-cols-[1fr_1fr_120px_120px_100px] gap-4 px-5 py-3.5 hover:bg-muted/15 transition-colors border-b border-border/60 last:border-0 items-center">
            <p className="text-[12.5px] font-medium text-foreground truncate">{tx.user?.name ?? tx.studentName ?? "—"}</p>
            <p className="text-[12.5px] text-foreground truncate">{tx.course?.title ?? tx.courseTitle ?? "—"}</p>
            <p className="text-[12px] text-muted-foreground">{tx.transactedAt ? fmtDate(tx.transactedAt) : tx.createdAt ? fmtDate(tx.createdAt) : "—"}</p>
            <p className="text-[13px] font-bold text-foreground tabular-nums">{fmtUSD(tx.totalAmount ?? tx.amount ?? 0)}</p>
            <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border w-fit",
              tx.status === "PAID" || tx.status === "SUCCEEDED"
                ? "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70"
                : "bg-amber-100/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/70")}>
              {tx.status?.toLowerCase() ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
