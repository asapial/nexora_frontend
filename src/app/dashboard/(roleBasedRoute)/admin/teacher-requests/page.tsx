"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RiGraduationCapLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiLoaderLine,
  RiRefreshLine,
  RiUserLine,
  RiMailLine,
  RiPhoneLine,
  RiBriefcaseLine,
  RiBuildingLine,
  RiTimeLine,
  RiLinkedinBoxLine,
  RiGlobalLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
interface Application {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  designation?: string;
  institution?: string;
  department?: string;
  specialization?: string;
  experience?: number;
  bio?: string;
  linkedinUrl?: string;
  website?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  createdAt: string;
  user: { id: string; name: string; email: string; image?: string | null };
}

// ─── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: Application["status"] }) {
  const configs = {
    PENDING:  { cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60", label: "Pending" },
    APPROVED: { cls: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60", label: "Approved" },
    REJECTED: { cls: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/60", label: "Rejected" },
  };
  const cfg = configs[status];
  return (
    <span className={cn("px-2 py-0.5 text-[11px] font-bold rounded-full border", cfg.cls)}>{cfg.label}</span>
  );
}

// ─── Reject modal ─────────────────────────────────────────
function RejectModal({ app, onClose, onConfirm, loading }: { app: Application; onClose: () => void; onConfirm: (note: string) => void; loading: boolean }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xl p-6">
        <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-50 mb-2">Reject Application</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Provide a reason for rejecting <strong>{app.fullName}</strong>'s application (optional).
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="e.g. Insufficient teaching experience or incomplete information."
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-400/40 resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60"
          >
            {loading ? <RiLoaderLine className="animate-spin" /> : <RiCloseCircleLine />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Application card ─────────────────────────────────────
function ApplicationCard({
  app,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
}: {
  app: Application;
  onApprove: (id: string) => void;
  onReject: (app: Application) => void;
  approvingId: string | null;
  rejectingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 overflow-hidden transition-colors hover:border-zinc-200 dark:hover:border-zinc-700">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center text-[12px] font-bold flex-shrink-0">
          {app.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-50">{app.fullName}</span>
            <StatusBadge status={app.status} />
          </div>
          <div className="flex flex-wrap gap-x-3 text-[11.5px] text-zinc-500 dark:text-zinc-500 mt-0.5">
            <span className="flex items-center gap-1"><RiMailLine />{app.email}</span>
            {app.designation && <span className="flex items-center gap-1"><RiBriefcaseLine />{app.designation}</span>}
            {app.institution && <span className="flex items-center gap-1"><RiBuildingLine />{app.institution}</span>}
            <span>{new Date(app.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {app.status === "PENDING" && (
            <>
              <button
                id={`approve-app-${app.id}`}
                onClick={() => onApprove(app.id)}
                disabled={approvingId === app.id || rejectingId === app.id}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold",
                  "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400",
                  "border border-teal-200/60 dark:border-teal-800/60",
                  "hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors",
                  approvingId === app.id && "opacity-60 cursor-not-allowed"
                )}
              >
                {approvingId === app.id ? <RiLoaderLine className="animate-spin" /> : <RiCheckboxCircleLine />}
                Approve
              </button>
              <button
                id={`reject-app-${app.id}`}
                onClick={() => onReject(app)}
                disabled={approvingId === app.id || rejectingId === app.id}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold",
                  "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
                  "border border-red-200/60 dark:border-red-800/60",
                  "hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors",
                  rejectingId === app.id && "opacity-60 cursor-not-allowed"
                )}
              >
                {rejectingId === app.id ? <RiLoaderLine className="animate-spin" /> : <RiCloseCircleLine />}
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {expanded ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800/60 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {app.phone && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 flex items-center gap-1 mb-1"><RiPhoneLine />Phone</p>
              <p className="text-[13px] text-zinc-700 dark:text-zinc-300">{app.phone}</p>
            </div>
          )}
          {app.department && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 mb-1">Department</p>
              <p className="text-[13px] text-zinc-700 dark:text-zinc-300">{app.department}</p>
            </div>
          )}
          {app.specialization && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 mb-1">Specialization</p>
              <p className="text-[13px] text-zinc-700 dark:text-zinc-300">{app.specialization}</p>
            </div>
          )}
          {app.experience !== undefined && app.experience !== null && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 flex items-center gap-1 mb-1"><RiTimeLine />Experience</p>
              <p className="text-[13px] text-zinc-700 dark:text-zinc-300">{app.experience} years</p>
            </div>
          )}
          {app.linkedinUrl && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 flex items-center gap-1 mb-1"><RiLinkedinBoxLine />LinkedIn</p>
              <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-teal-600 dark:text-teal-400 hover:underline truncate block">{app.linkedinUrl}</a>
            </div>
          )}
          {app.website && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 flex items-center gap-1 mb-1"><RiGlobalLine />Website</p>
              <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-[13px] text-teal-600 dark:text-teal-400 hover:underline truncate block">{app.website}</a>
            </div>
          )}
          {app.bio && (
            <div className="sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 mb-1">Bio</p>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{app.bio}</p>
            </div>
          )}
          {app.adminNote && (
            <div className="sm:col-span-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/60">
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-500 mb-1">Admin Note</p>
              <p className="text-[13px] text-red-700 dark:text-red-400">{app.adminNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function AdminTeacherRequestsPage() {
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [pending, setPending] = useState<Application[]>([]);
  const [all, setAll] = useState<Application[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await fetch("/api/teacher-applications/admin/pending", { credentials: "include" });
      const data = await res.json();
      if (data.success) setPending(data.data?.data || []);
    } catch { /* silent */ }
    finally { setLoadingPending(false); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/teacher-applications/admin/all", { credentials: "include" });
      const data = await res.json();
      if (data.success) setAll(data.data?.data || []);
    } catch { /* silent */ }
    finally { setLoadingAll(false); }
  }, []);

  useEffect(() => { fetchPending(); fetchAll(); }, [fetchPending, fetchAll]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/teacher-applications/admin/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Application approved! Teacher account created.");
      fetchPending(); fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve application");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectConfirm = async (note: string) => {
    if (!rejectTarget) return;
    setRejectingId(rejectTarget.id);
    try {
      const res = await fetch(`/api/teacher-applications/admin/${rejectTarget.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Application rejected.");
      setRejectTarget(null);
      fetchPending(); fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject application");
    } finally {
      setRejectingId(null);
    }
  };

  const items = tab === "pending" ? pending : all;
  const loading = tab === "pending" ? loadingPending : loadingAll;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {rejectTarget && (
        <RejectModal
          app={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          loading={rejectingId === rejectTarget.id}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RiGraduationCapLine className="text-teal-500 text-lg" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Teacher Requests</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Review and manage teacher role applications from users.</p>
        </div>
        <button
          onClick={() => { fetchPending(); fetchAll(); }}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <RiRefreshLine /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 w-fit mb-6">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            id={`tab-teacher-${t}`}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 capitalize flex items-center gap-1.5",
              tab === t
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {t === "pending" ? "Pending" : "All Applications"}
            <span className={cn(
              "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
              tab === t
                ? "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-400"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
            )}>
              {t === "pending" ? pending.length : all.length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RiUserLine className="text-4xl text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-[14px] font-semibold text-zinc-400 dark:text-zinc-600">
              {tab === "pending" ? "No pending applications." : "No applications found."}
            </p>
          </div>
        ) : (
          items.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              approvingId={approvingId}
              rejectingId={rejectingId}
            />
          ))
        )}
      </div>
    </div>
  );
}
