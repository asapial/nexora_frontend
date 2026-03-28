"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  RiSparklingFill,
  RiRefreshLine,
  RiBankCardLine,
  RiCheckLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiRefundLine,
  RiAlertLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PAID: {
    label: "Paid",
    cls: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
    icon: <RiCheckLine className="text-xs" />,
  },
  PENDING: {
    label: "Pending",
    cls: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50",
    icon: <RiTimeLine className="text-xs" />,
  },
  FAILED: {
    label: "Failed",
    cls: "bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50",
    icon: <RiCloseCircleLine className="text-xs" />,
  },
  REFUNDED: {
    label: "Refunded",
    cls: "bg-slate-100/80 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/50",
    icon: <RiRefundLine className="text-xs" />,
  },
};

export default function StudentPaymentHistoryPage() {
  const [summary, setSummary] = useState<{
    totalPaidUsd: number;
    totalAttempts: number;
    paidCount: number;
    pendingCount: number;
    failedCount: number;
    refundedCount: number;
  } | null>(null);
  const [payments, setPayments] = useState<
    Array<{
      id: string;
      courseId: string;
      courseTitle: string;
      amount: number;
      currency: string;
      status: string;
      stripePaymentIntentId: string;
      paidAt: string | null;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await studentApi.getPaymentHistory();
      setSummary(r.data.summary);
      setPayments(r.data.payments ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load payment history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-5xl mx-auto w-full min-h-screen">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Billing</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Payment history</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">
            Course purchases processed through Stripe. Free enrollments are not listed here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50"
          title="Refresh"
        >
          <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
          <RiAlertLine className="text-red-500 text-base mt-0.5 shrink-0" />
          <p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total paid", value: summary ? fmtUsd(summary.totalPaidUsd) : "—", sub: "Successful charges", accent: "teal" as const },
          { label: "Successful", value: summary ? String(summary.paidCount) : "—", sub: "Completed payments", accent: "emerald" as const },
          { label: "Pending", value: summary ? String(summary.pendingCount) : "—", sub: "Awaiting confirmation", accent: "amber" as const },
          { label: "Attempts", value: summary ? String(summary.totalAttempts) : "—", sub: "All payment rows", accent: "slate" as const },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-4 py-4 flex flex-col gap-1"
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className="text-[22px] font-extrabold text-foreground tabular-nums leading-none">{loading ? "…" : s.value}</p>
            <p className="text-[11px] text-muted-foreground/70">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/20">
          <RiBankCardLine className="text-teal-600 dark:text-teal-400 text-lg" />
          <span className="text-[14px] font-bold text-foreground">Transactions</span>
        </div>
        {loading ? (
          <div className="p-10 flex justify-center">
            <RiRefreshLine className="animate-spin text-2xl text-teal-500" />
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <p className="text-[13.5px] text-muted-foreground mb-4">No payment records yet.</p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Browse courses <RiArrowRightLine className="text-sm" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="px-4 py-3 font-bold text-muted-foreground">Course</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground hidden sm:table-cell">Stripe intent</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => {
                  const st = STATUS[p.status] ?? {
                    label: p.status,
                    cls: "bg-muted text-muted-foreground border-border",
                    icon: null,
                  };
                  const shortPi = p.stripePaymentIntentId.length > 14
                    ? `…${p.stripePaymentIntentId.slice(-10)}`
                    : p.stripePaymentIntentId;
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/student/courses/${p.courseId}`}
                          className="font-semibold text-foreground hover:text-teal-600 dark:hover:text-teal-400"
                        >
                          {p.courseTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-bold tabular-nums">{fmtUsd(p.amount)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border",
                            st.cls
                          )}
                        >
                          {st.icon}
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                        {shortPi}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {fmtDate(p.paidAt ?? p.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
