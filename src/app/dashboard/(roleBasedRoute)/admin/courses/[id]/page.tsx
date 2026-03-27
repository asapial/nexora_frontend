"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiStarLine, RiStarFill,
  RiGroupLine, RiFileTextLine, RiMoneyDollarCircleLine, RiCheckLine,
  RiCloseLine, RiAlertLine, RiRefreshLine, RiLoader4Line, 
  RiShieldCheckLine, RiEditLine, RiUserLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "../../../../../../lib/api";
import { toast } from "sonner";
import { Trash } from "lucide-react";

interface Mission {
  id: string; title: string; status: string; _count: { contents: number };
}
interface Course {
  id: string; title: string; description: string | null;
  status: string; isFeatured: boolean; isFree: boolean; price: number;
  teacherRevenuePercent: number; tags: string[];
  teacher?: { user: { name: string; email: string } };
  _count?: { enrollments: number; missions: number };
  rejectedNote?: string | null;
  missions?: Mission[];
}

const STATUS_MAP: Record<string, string> = {
  DRAFT:            "text-muted-foreground bg-muted/40 border-border",
  PENDING_APPROVAL: "text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50",
  PUBLISHED:        "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50",
  CLOSED:           "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/50",
  REJECTED:         "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50",
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending Approval", PUBLISHED: "Published", CLOSED: "Closed", REJECTED: "Rejected",
};

function RejectModal({ label, onClose, onReject }: { label: string; onClose: () => void; onReject: (n: string) => Promise<void> }) {
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async () => { if (!note.trim()) { setErr("Note required"); return; } setBusy(true); try { await onReject(note.trim()); onClose(); } catch { setErr("Reject failed"); setBusy(false); } };
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-foreground">Reject — {label}</p>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60"><RiCloseLine /></button>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {err && <p className="text-[12.5px] text-red-500">{err}</p>}
            <textarea rows={4} value={note} onChange={e => { setNote(e.target.value); setErr(""); }} placeholder="Reason for rejection…"
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 resize-none" />
          </div>
          <div className="px-6 pb-5 flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50">Cancel</button>
            <button onClick={submit} disabled={busy} className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold disabled:opacity-60">
              {busy ? <RiLoader4Line className="animate-spin text-sm" /> : <RiCloseLine className="text-sm" />} Reject
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminCourseDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [course, setCourse]         = useState<Course | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [approving, setApproving]   = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState(false);

  const fetchCourse = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { credentials: "include" });
      const d = await res.json();
      if (d.success) setCourse(d.data);
      else throw new Error(d.message || "Failed");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const handleApprove = async () => {
    setApproving(true);
    try { await adminApi.approveCourse(id); toast.success("Course approved!"); fetchCourse(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setApproving(false); }
  };

  const handleReject = async (note: string) => {
    await adminApi.rejectCourse(id, note); toast.success("Course rejected."); fetchCourse();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this course permanently? This cannot be undone.")) return;
    setDeleting(true);
    try { await adminApi.deleteCourse(id); toast.success("Course deleted."); router.push("/dashboard/admin/courses"); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Delete failed"); setDeleting(false); }
  };

  const handleToggleFeatured = async () => {
    setTogglingFeatured(true);
    try {
      const res = await fetch(`/api/admin/courses/${id}/featured`, { method: "POST", credentials: "include" });
      const d = await res.json();
      if (d.success) { fetchCourse(); toast.success("Featured status toggled."); }
    } catch { toast.error("Failed"); }
    finally { setTogglingFeatured(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full animate-pulse">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-8 w-2/3 rounded-xl bg-muted" />
        <div className="h-48 rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <RiAlertLine className="text-4xl text-red-500" />
        <p className="text-[14px] font-bold">{error ?? "Course not found"}</p>
        <button onClick={fetchCourse} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">
          <RiRefreshLine /> Retry
        </button>
      </div>
    );
  }

  const canApprove = course.status === "PENDING_APPROVAL";
  const canReject  = course.status === "PENDING_APPROVAL";

  return (
    <>
      {rejectModal && (
        <RejectModal label={course.title} onClose={() => setRejectModal(false)} onReject={handleReject} />
      )}
      <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">
        {/* Back */}
        <button onClick={() => router.push("/dashboard/admin/courses")}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
          <RiArrowLeftLine /> All Courses
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
              <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin · Course Detail</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-tight">{course.title}</h1>
              <span className={cn("text-[11px] font-bold tracking-wider uppercase px-3 py-0.5 rounded-full border", STATUS_MAP[course.status] ?? STATUS_MAP.DRAFT)}>
                {STATUS_LABELS[course.status] ?? course.status}
              </span>
              {course.isFeatured && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400"><RiStarFill className="text-xs" /> Featured</span>
              )}
            </div>
            {course.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {course.tags.map(t => <span key={t} className="px-2 py-0.5 rounded-md bg-muted/50 border border-border text-[11px] font-medium text-muted-foreground">{t}</span>)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {canApprove && (
              <button onClick={handleApprove} disabled={approving}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[12.5px] font-bold transition-all disabled:opacity-60">
                {approving ? <RiLoader4Line className="animate-spin text-xs" /> : <RiCheckLine className="text-xs" />} Approve
              </button>
            )}
            {canReject && (
              <button onClick={() => setRejectModal(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-red-200/60 dark:border-red-800/50 bg-red-50/40 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[12.5px] font-bold hover:bg-red-100/60 transition-all">
                <RiCloseLine className="text-xs" /> Reject
              </button>
            )}
            <button onClick={handleToggleFeatured} disabled={togglingFeatured}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[12.5px] font-semibold hover:bg-amber-100/60 transition-all disabled:opacity-60">
              <RiStarLine className="text-xs" /> {course.isFeatured ? "Unfeature" : "Feature"}
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-red-200/60 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[12.5px] font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-60">
              {deleting ? <RiLoader4Line className="animate-spin text-xs" /> : <Trash className="text-xs" />} Delete
            </button>
          </div>
        </div>

        {/* Rejection note */}
        {course.status === "REJECTED" && course.rejectedNote && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
            <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-red-600 dark:text-red-400">Rejected</p>
              <p className="text-[12.5px] text-red-600/80 dark:text-red-400/80 mt-0.5">{course.rejectedNote}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <RiGroupLine />, label: "Enrollments",  value: course._count?.enrollments ?? 0,              cls: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/40" },
            { icon: <RiFileTextLine />, label: "Missions",  value: course._count?.missions ?? 0,                 cls: "text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40" },
            { icon: <RiMoneyDollarCircleLine />, label: "Price",  value: course.isFree ? "Free" : `$${course.price}`, cls: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40" },
            { icon: <RiShieldCheckLine />, label: "Rev. Share", value: `${course.teacherRevenuePercent}%`,         cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/40" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", s.cls)}>{s.icon}</div>
              <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{s.value}</p>
              <p className="text-[12px] font-medium text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Description + teacher */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Description</p>
            <p className="text-[13px] text-foreground/80 leading-relaxed">{course.description || "No description."}</p>
          </div>
          {course.teacher && (
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Teacher</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <RiUserLine />
                </div>
                <div>
                  <p className="text-[13.5px] font-bold text-foreground">{course.teacher.user.name}</p>
                  <p className="text-[12px] text-muted-foreground">{course.teacher.user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Missions list */}
        {course.missions && course.missions.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[13px] font-bold text-foreground">Missions ({course.missions.length})</p>
            </div>
            <div className="flex flex-col divide-y divide-border/60">
              {course.missions.map(m => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-teal-600 dark:text-teal-400 text-sm"><RiFileTextLine /></div>
                  <p className="flex-1 text-[13px] font-semibold text-foreground truncate">{m.title}</p>
                  <span className="text-[11px] text-muted-foreground">{m._count.contents} items</span>
                  <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground">{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
