"use client";
// /admin/approvals/courses

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiCheckLine, RiCloseLine, RiAlertLine,
  RiBookOpenLine, RiFileTextLine, RiTimeLine, RiEyeLine,
  RiLoader4Line, RiUserLine, RiPriceTag3Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "../../../../../../lib/api";
import { toast } from "sonner";
import RefreshIcon from "@/components/shared/RefreshIcon";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtUSD  = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

// ─── Ambient BG ───────────────────────────────────────────
function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="absolute -top-40 left-1/4 w-[700px] h-[400px] rounded-full bg-teal-500/[0.05] blur-[130px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[110px]" />
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────
function RejectModal({ label, onClose, onReject }: {
  label: string; onClose: () => void; onReject: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!note.trim()) { setErr("Rejection note is required"); return; }
    setBusy(true);
    try { await onReject(note.trim()); onClose(); }
    catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-100/70 dark:bg-red-950/50 border border-red-200/60 dark:border-red-800/50 text-red-500 text-sm"><RiCloseLine /></div>
              <h3 className="text-[14px] font-extrabold text-foreground">Reject — {label}</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {err && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50">
                <RiAlertLine className="text-red-500 text-sm flex-shrink-0" />
                <p className="text-[12.5px] font-medium text-red-600 dark:text-red-400">{err}</p>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Rejection note <span className="text-red-500">*</span></label>
              <textarea rows={4} value={note} onChange={e => { setNote(e.target.value); setErr(""); }}
                placeholder="Explain why this is being rejected…"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all resize-none" />
            </div>
          </div>
          <div className="px-6 pb-5 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button onClick={submit} disabled={busy}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold transition-all disabled:opacity-60">
              {busy ? <RiLoader4Line className="animate-spin text-sm" /> : <RiCloseLine className="text-sm" />} Reject
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Approval Card ────────────────────────────────────────
function ApprovalCard({ course, onApprove, onReject, onView, approving }: {
  course: any; onApprove: () => void; onReject: () => void; onView: () => void; approving: boolean;
}) {
  return (
    <div className={cn(
      "group relative rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden",
      "hover:border-teal-200/60 dark:hover:border-teal-800/50",
      "hover:shadow-xl hover:shadow-teal-500/[0.06] transition-all duration-200"
    )}>
      {/* Top shimmer on hover */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-teal-950/80 via-slate-900 to-slate-950 border border-border">
          {course.thumbnailUrl
            ? <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />
            : <div className="w-full h-full flex items-center justify-center"><RiBookOpenLine className="text-xl text-teal-700/30" /></div>}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending Approval
            </span>
            <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold border",
              course.isFree ? "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50" : "text-muted-foreground bg-muted/40 border-border"
            )}>{course.isFree ? "Free" : fmtUSD(course.requestedPrice ?? course.price ?? 0)}</span>
          </div>

          <h3 className="text-[14.5px] font-extrabold text-foreground leading-snug">{course.title}</h3>
          {course.description && <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{course.description}</p>}

          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
            {course.teacher?.user && (
              <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <RiUserLine className="text-xs text-teal-600 dark:text-teal-400" /> {course.teacher.user.name}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" /> {course._count?.missions ?? 0} missions
            </span>
            {course.submittedAt && (
              <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <RiTimeLine className="text-xs text-teal-600 dark:text-teal-400" /> {fmtDate(course.submittedAt)}
              </span>
            )}
            {course.tags?.slice(0, 3).map((t: string) => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border text-[10.5px] font-semibold text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onView} title="Preview"
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300/50 dark:hover:border-teal-700/50 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all">
            <RiEyeLine className="text-sm" />
          </button>
          <button onClick={onReject}
            className="h-9 px-4 rounded-xl border border-red-200/60 dark:border-red-800/50 bg-red-50/40 dark:bg-red-950/20 text-[12.5px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100/60 transition-all">
            Reject
          </button>
          <button onClick={onApprove} disabled={approving}
            className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[12.5px] font-bold transition-all disabled:opacity-60 flex items-center gap-1.5">
            {approving ? <RiLoader4Line className="animate-spin text-sm" /> : <RiCheckLine className="text-sm" />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function CourseApprovalsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await adminApi.getPendingCourses(); setCourses(Array.isArray(r.data) ? r.data : r.data?.data ?? []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await adminApi.approveCourse(id);
      setCourses(p => p.filter(c => c.id !== id));
      toast.success("Course approved!", { position: "top-right" });
    } catch (e: any) { toast.error(e.message); }
    finally { setApproving(null); }
  };

  const handleReject = async (id: string, note: string) => {
    await adminApi.rejectCourse(id, note);
    setCourses(p => p.filter(c => c.id !== id));
    toast.success("Course rejected.", { position: "top-right" });
  };

  return (
    <>
      {rejectTarget && (
        <RejectModal label={rejectTarget.title} onClose={() => setRejectTarget(null)}
          onReject={(note) => handleReject(rejectTarget.id, note)} />
      )}

      <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-5xl mx-auto w-full min-h-screen">
        <AmbientBg />

        {/* Heading */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
              <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin · Approvals</span>
            </div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Course Approvals</h1>
            <p className="text-[13.5px] text-muted-foreground mt-1">Review and approve or reject courses submitted by teachers.</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshIcon onClick={load} loading={loading} />
            <div className="flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-100/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-[13px] font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> {courses.length} pending
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
            <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
            <p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p>
            <button onClick={load} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline">Retry</button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm py-24 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-2xl text-teal-600 dark:text-teal-400">
              <RiCheckLine />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-foreground">All caught up!</p>
              <p className="text-[13px] text-muted-foreground mt-1">No courses pending approval right now.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map(course => (
              <ApprovalCard key={course.id} course={course}
                approving={approving === course.id}
                onApprove={() => handleApprove(course.id)}
                onReject={() => setRejectTarget(course)}
                onView={() => router.push(`/admin/courses/${course.id}`)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}