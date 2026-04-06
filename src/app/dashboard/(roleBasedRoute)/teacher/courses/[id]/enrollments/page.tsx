"use client";


import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiSearchLine, RiDownloadLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiCheckboxCircleLine, RiRefreshLine,
RiPercentLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { courseApi } from "../../../../../../../lib/api";

import type { CourseEnrollment, PaymentStatus } from "../../../../../../../types/course.type";



const fmtCurrency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const PAYMENT_CFG: Record<PaymentStatus, { label: string; badge: string }> = {
  FREE:     { label: "Free",     badge: "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50" },
  PENDING:  { label: "Pending",  badge: "text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50" },
  PAID:     { label: "Paid",     badge: "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/50" },
  FAILED:   { label: "Failed",   badge: "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50" },
  REFUNDED: { label: "Refunded", badge: "text-muted-foreground bg-muted/40 border-border" },
};


// ─── Enrollments Page ─────────────────────────────────────
export default function EnrollmentsDetailPage() {
  const router = useRouter();
  const { id: courseId } = useParams() as { id: string };
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

    const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: "20" };
      if (search) params.search = search;
      if (filterPayment !== "ALL") params.paymentStatus = filterPayment;
      const [eRes, sRes] = await Promise.all([
        courseApi.getEnrollments(courseId, params),
        courseApi.getEnrollmentStats(courseId),
      ]);
      // Handle various response shapes
      const eData = eRes.data;
      const enrollmentList = Array.isArray(eData?.data) ? eData.data : Array.isArray(eData) ? eData : [];
      setEnrollments(enrollmentList);
      setTotalPages(eData?.totalPages ?? 1);
      setStats(sRes.data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [courseId, page, search, filterPayment]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full min-h-screen">

      <div>
        <button onClick={() => router.push(`/dashboard/teacher/courses/${courseId}`)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"><RiArrowLeftLine /> Back to course</button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
              <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Enrollments</span>
            </div>
            <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground">Enrollment Details</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Track every student enrolled in this course.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
            </button>
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex-shrink-0">
              <RiDownloadLine className="text-sm" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <RiGroupLine />, label: "Total enrolled", value: stats?.total ?? 0, a: "teal" },
          { icon: <RiMoneyDollarCircleLine />, label: "Paid", value: stats?.paid ?? 0, a: "blue" },
          { icon: <RiCheckboxCircleLine />, label: "Completed", value: stats?.completed ?? 0, a: "teal" },
          { icon: <RiPercentLine />, label: "Your earnings", value: fmtCurrency(stats?.teacherEarning ?? 0), a: "amber" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-border bg-card/90 backdrop-blur-sm">
            <div className={cn("w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base border",
              s.a === "amber" ? "bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400"
              : s.a === "blue" ? "bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400"
              : "bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400"
            )}>{s.icon}</div>
            <div>
              {loading ? <div className="h-5 w-12 rounded bg-muted/60 animate-pulse mb-1" />
                : <p className="text-[18px] font-extrabold text-foreground leading-none tabular-nums">{s.value}</p>}
              <p className="text-[11.5px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm pointer-events-none" />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
        </div>
        <select value={filterPayment} onChange={e => { setFilterPayment(e.target.value as any); setPage(1); }}
          className="h-10 px-3.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border appearance-none cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all">
          <option value="ALL">All payments</option>
          <option value="PAID">Paid</option>
          <option value="FREE">Free</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border bg-muted/20">
          {["Student", "Enrolled", "Payment", "Paid", "Progress"].map(h => <p key={h} className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{h}</p>)}
        </div>
        {loading
          ? <div className="divide-y divide-border">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 animate-pulse">{Array.from({ length: 5 }).map((_, j) => <div key={j} className="h-4 rounded-full bg-muted/50" />)}</div>)}</div>
          : (
            <div className="divide-y divide-border">
              {enrollments.length === 0
                ? <div className="py-14 flex flex-col items-center gap-2 text-center"><RiGroupLine className="text-2xl text-muted-foreground/30" /><p className="text-[13px] text-muted-foreground">No enrollments found</p></div>
                : enrollments.map(e => {
                    const pcfg = PAYMENT_CFG[e.paymentStatus];
                    return (
                      <div key={e.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-teal-700 dark:text-teal-300 border border-teal-200/40 dark:border-teal-800/40">
                            {e.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-foreground truncate">{e.user?.name}</p>
                            <p className="text-[11.5px] text-muted-foreground truncate">{e.user?.email}</p>
                          </div>
                        </div>
                        <p className="text-[12.5px] text-muted-foreground">{fmtDate(e.enrolledAt)}</p>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border w-fit", pcfg.badge)}>{pcfg.label}</span>
                        <p className="text-[13px] font-bold text-foreground">{e.amountPaid ? fmtCurrency(e.amountPaid) : "—"}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted/50"><div className="h-full rounded-full bg-teal-500" style={{ width: `${e.progress}%` }} /></div>
                          <span className={cn("text-[11px] font-bold flex-shrink-0", e.completedAt ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground")}>{e.progress}%</span>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12.5px] text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3.5 rounded-lg border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Previous</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 px-3.5 rounded-lg border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

