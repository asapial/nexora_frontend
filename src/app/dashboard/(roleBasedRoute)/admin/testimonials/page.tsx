"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RiSparklingFill,
  RiStarFill,
  RiStarLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiLoaderLine,
  RiUserLine,
  RiMessageLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import RefreshIcon from "@/components/shared/RefreshIcon";

// ─── Types ────────────────────────────────────────────────
interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { id: string; name: string; email: string; image?: string | null };
}

// ─── Star row ─────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <RiStarFill key={s} className="text-amber-400 text-[11px]" />
        ) : (
          <RiStarLine key={s} className="text-zinc-300 dark:text-zinc-700 text-[11px]" />
        )
      )}
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────
function TestimonialRow({
  item,
  tab,
  onApprove,
  onDelete,
  approving,
  deleting,
}: {
  item: Testimonial;
  tab: "submitted" | "approved";
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  approving: string | null;
  deleting: string | null;
}) {
  const initials = item.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {item.user?.image ? (
          <img src={item.user.image} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center text-[12px] font-bold">
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1 mb-1">
          <span className="text-[13.5px] font-bold text-zinc-900 dark:text-zinc-50">{item.name}</span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-500">{item.role}</span>
          <StarRow rating={item.rating} />
        </div>
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed italic mb-2">"{item.quote}"</p>
        <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400 dark:text-zinc-600">
          <span className="flex items-center gap-1"><RiUserLine /> {item.user?.email}</span>
          <span>{new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {tab === "submitted" && (
          <button
            id={`approve-testimonial-${item.id}`}
            onClick={() => onApprove(item.id)}
            disabled={approving === item.id || deleting === item.id}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold",
              "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400",
              "border border-teal-200/60 dark:border-teal-800/60",
              "hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors",
              (approving === item.id) && "opacity-60 cursor-not-allowed"
            )}
          >
            {approving === item.id ? <RiLoaderLine className="animate-spin" /> : <RiCheckboxCircleLine />}
            Approve
          </button>
        )}
        <button
          id={`delete-testimonial-${item.id}`}
          onClick={() => onDelete(item.id)}
          disabled={approving === item.id || deleting === item.id}
          className={cn(
            "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold",
            "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
            "border border-red-200/60 dark:border-red-800/60",
            "hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors",
            (deleting === item.id) && "opacity-60 cursor-not-allowed"
          )}
        >
          {deleting === item.id ? <RiLoaderLine className="animate-spin" /> : <RiDeleteBinLine />}
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <RiMessageLine className="text-4xl text-zinc-300 dark:text-zinc-700 mb-3" />
      <p className="text-[14px] font-semibold text-zinc-400 dark:text-zinc-600">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function AdminTestimonialsPage() {
  const [tab, setTab] = useState<"submitted" | "approved">("submitted");
  const [submitted, setSubmitted] = useState<Testimonial[]>([]);
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [loadingSubmitted, setLoadingSubmitted] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubmitted = useCallback(async () => {
    setLoadingSubmitted(true);
    try {
      const res = await fetch("/api/testimonials/admin/pending", { credentials: "include" });
      const data = await res.json();
      if (data.success) setSubmitted(data.data?.data || []);
    } catch { /* silent */ }
    finally { setLoadingSubmitted(false); }
  }, []);

  const fetchApproved = useCallback(async () => {
    setLoadingApproved(true);
    try {
      const res = await fetch("/api/testimonials/admin/approved", { credentials: "include" });
      const data = await res.json();
      if (data.success) setApproved(data.data?.data || []);
    } catch { /* silent */ }
    finally { setLoadingApproved(false); }
  }, []);

  useEffect(() => {
    fetchSubmitted();
    fetchApproved();
  }, [fetchSubmitted, fetchApproved]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/testimonials/admin/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Testimonial approved!");
      fetchSubmitted();
      fetchApproved();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve testimonial");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/testimonials/admin/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Testimonial deleted.");
      fetchSubmitted();
      fetchApproved();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete testimonial");
    } finally {
      setDeletingId(null);
    }
  };

  const items = tab === "submitted" ? submitted : approved;
  const loading = tab === "submitted" ? loadingSubmitted : loadingApproved;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RiSparklingFill className="text-teal-500" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Testimonials</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage user-submitted testimonials for the homepage.</p>
        </div>
        <RefreshIcon onClick={() => { fetchSubmitted(); fetchApproved(); }} loading={loading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 w-fit mb-6">
        {(["submitted", "approved"] as const).map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 capitalize flex items-center gap-1.5",
              tab === t
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {t === "submitted" ? "Submitted" : "Approved"}
            <span className={cn(
              "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
              tab === t
                ? "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-400"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
            )}>
              {t === "submitted" ? submitted.length : approved.length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <EmptyState label={tab === "submitted" ? "No pending testimonials to review." : "No approved testimonials yet."} />
        ) : (
          items.map((item) => (
            <TestimonialRow
              key={item.id}
              item={item}
              tab={tab}
              onApprove={handleApprove}
              onDelete={handleDelete}
              approving={approvingId}
              deleting={deletingId}
            />
          ))
        )}
      </div>
    </div>
  );
}
