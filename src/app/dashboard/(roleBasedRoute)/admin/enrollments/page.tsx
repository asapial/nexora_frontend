"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiRefreshLine, RiSearchLine, RiGroupLine, RiBookOpenLine,
  RiCheckLine, RiCloseLine, RiCalendarLine, RiMoneyDollarCircleLine, RiFilterLine,
  RiLoader4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "../../../../../lib/api";
import { toast } from "sonner";

const fmtUSD  = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

type PayStatus = "all" | "PAID" | "PENDING" | "FAILED";

const PAY_STATUS_CFG: Record<string, string> = {
  PAID:    "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70",
  PENDING: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/70",
  FAILED:  "bg-red-100/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70",
  FREE:    "bg-sky-100/70 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200/70",
};

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [payFilter,   setPayFilter]   = useState<PayStatus>("all");

  // date range filters
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p: any = {};
      if (payFilter !== "all") p.paymentStatus = payFilter;
      if (fromDate) p.from = fromDate;
      if (toDate)   p.to   = toDate;
      const r = await adminApi.getAllEnrollments(p);
      const raw = r.data;
      setEnrollments(Array.isArray(raw) ? raw : (raw as any).data ?? []);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, [payFilter, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const filtered = enrollments.filter(e => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      e.course?.title?.toLowerCase().includes(s) ||
      e.user?.name?.toLowerCase().includes(s) ||
      e.user?.email?.toLowerCase().includes(s)
    );
  });

  const totalPaid = enrollments.filter(e => e.paymentStatus === "PAID" || e.course?.isFree).length;
  const totalRev  = enrollments
    .filter(e => e.paymentStatus === "PAID")
    .reduce((s, e) => s + (e.amount ?? e.course?.price ?? 0), 0);

  const INP = "h-9 px-3 rounded-xl text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

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
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Enrollments</h1>
            <p className="text-[13px] text-muted-foreground mt-1">All course enrollments across the platform</p>
          </div>
          <button onClick={load} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex-shrink-0">
            <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: <RiGroupLine />,               l: "Total Enrollments", v: enrollments.length.toLocaleString(), cls: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/40" },
          { icon: <RiCheckLine />,               l: "Paid / Free",       v: totalPaid.toLocaleString(),          cls: "text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40" },
          { icon: <RiMoneyDollarCircleLine />,   l: "Revenue",           v: fmtUSD(totalRev),                    cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/40" },
        ].map(s => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", s.cls)}>{s.icon}</div>
            <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{s.v}</p>
            <p className="text-[12px] font-medium text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-sm" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student or course…"
              className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
          </div>
          {/* Date range */}
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={INP} placeholder="From" />
            <span className="text-muted-foreground text-sm">–</span>
            <input type="date" value={toDate}   onChange={e => setToDate(e.target.value)}   className={INP} placeholder="To" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "PAID", "PENDING", "FAILED"] as PayStatus[]).map(f => (
            <button key={f} onClick={() => setPayFilter(f)}
              className={cn("h-8 px-3 rounded-xl text-[12px] font-semibold border transition-all",
                payFilter === f ? "bg-teal-600 text-white border-teal-600" : "border-border text-muted-foreground hover:bg-muted/40")}>
              {f === "all" ? "All payments" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_1fr_120px_100px_100px] gap-4 px-5 py-3 border-b border-border bg-muted/20">
          {["Student", "Course", "Enrolled", "Amount", "Payment"].map(h => (
            <p key={h} className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_120px_100px_100px] gap-4 px-5 py-3.5 border-b border-border/60 animate-pulse">
              {Array.from({ length: 5 }).map((_, j) => <div key={j} className="h-3 bg-muted rounded" />)}
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <RiGroupLine className="text-4xl text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No enrollments found</p>
          </div>
        ) : filtered.map((e, i) => {
          const payStatus = e.paymentStatus ?? (e.course?.isFree ? "FREE" : "PENDING");
          const payCls = PAY_STATUS_CFG[payStatus] ?? "border-border text-muted-foreground";
          return (
            <div key={e.id ?? i} className="grid grid-cols-[1fr_1fr_120px_100px_100px] gap-4 px-5 py-3.5 hover:bg-muted/15 transition-colors border-b border-border/60 last:border-0 items-center">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{e.user?.name ?? e.student?.user?.name ?? "—"}</p>
                <p className="text-[11.5px] text-muted-foreground truncate">{e.user?.email ?? e.student?.user?.email ?? ""}</p>
              </div>
              <p className="text-[13px] font-medium text-foreground truncate">{e.course?.title ?? "—"}</p>
              <p className="text-[12.5px] text-muted-foreground">{e.enrolledAt ? fmtDate(e.enrolledAt) : "—"}</p>
              <p className="text-[13px] font-semibold text-foreground tabular-nums">
                {e.course?.isFree ? "Free" : fmtUSD(e.amount ?? e.course?.price ?? 0)}
              </p>
              <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border w-fit", payCls)}>
                {payStatus.toLowerCase()}
              </span>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-[12px] text-muted-foreground text-center">Showing {filtered.length} of {enrollments.length} enrollments</p>
      )}
    </div>
  );
}
