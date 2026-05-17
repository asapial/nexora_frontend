"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiFileTextLine, RiCheckLine, RiCloseLine, RiTimeLine,
  RiEditLine, RiDeleteBinLine, RiFlaskLine, RiCalendarCheckLine, RiAlertLine,
  RiSearchLine, RiSendPlaneLine, RiAddLine, RiUserLine, RiArrowRightLine,
  RiCheckboxCircleLine, RiLoader4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import RefreshIcon from "@/components/shared/RefreshIcon";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

type HWStatus = "PENDING" | "SUBMITTED" | "REVIEWED";
type SessionStatus = "upcoming" | "ongoing" | "completed";

interface Submission { id: string; submittedAt: string; videoUrl?: string | null; textBody?: string | null; pdfUrl?: string | null }
interface MemberTask {
  id: string; title: string; description: string | null; homework: string | null;
  status: HWStatus; deadline: string | null; finalScore: number | null; reviewNote: string | null;
  submission: Submission | null;
}
interface Member {
  studentProfileId: string; userId: string | null; name: string; email: string; image: string | null;
  task: MemberTask | null;
}
interface Session {
  id: string; title: string; scheduledAt: string; status: SessionStatus;
  cluster: { id: string; name: string };
  tasks: MemberTask[];
  _count: { attendance: number };
}

const STATUS_CFG: Record<HWStatus, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50" },
  SUBMITTED: { label: "Submitted", cls: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50" },
  REVIEWED:  { label: "Reviewed",  cls: "bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50" },
};

const SESSION_STATUS_CFG: Record<SessionStatus, { label: string; cls: string }> = {
  upcoming:  { label: "Upcoming",  cls: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70" },
  ongoing:   { label: "Ongoing",   cls: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70" },
  completed: { label: "Completed", cls: "bg-muted/60 text-muted-foreground border-border" },
};

const INP = "w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

// ─── Assign Task Modal (per member) ──────────────────────────────────────────
function AssignMemberModal({
  sessionId, member, onClose, onCreated,
}: {
  sessionId: string; member: Member; onClose: () => void;
  onCreated: (task: MemberTask) => void;
}) {
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [homework, setHomework] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr(null);
    try {
      const res = await fetch(
        `/api/teacher/tasks/sessions/${sessionId}/members/${member.studentProfileId}/assign`,
        {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: desc || undefined, homework: homework || undefined, deadline: deadline || undefined }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      // Return task shape matching MemberTask
      const t = data.data;
      onCreated({
        id: t.id, title: t.title, description: t.description, homework: t.homework,
        status: t.status, deadline: t.deadline, finalScore: t.finalScore, reviewNote: t.reviewNote,
        submission: t.submission ?? null,
      });
      onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[14.5px] font-bold text-foreground">Assign Task</p>
            <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <RiUserLine className="text-xs" />
              {member.name} · {member.email}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Task title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Summary" className={INP} />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Task details…"
              className="w-full rounded-xl px-4 py-3 text-[13.5px] leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Homework note <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input value={homework} onChange={e => setHomework(e.target.value)} placeholder="e.g. Read chapter 5" className={INP} />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Deadline <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className={INP} />
          </div>
          {err && <p className="text-[12.5px] text-red-500">{err}</p>}
          <div className="flex gap-3 justify-end pt-1 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold shadow-sm transition-all disabled:opacity-60">
              {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiSendPlaneLine />}
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Task Modal ───────────────────────────────────────────────────────────
function EditTaskModal({ task, onClose, onUpdated }: {
  task: MemberTask; onClose: () => void; onUpdated: (t: MemberTask) => void;
}) {
  const [title, setTitle]       = useState(task.title);
  const [desc, setDesc]         = useState(task.description ?? "");
  const [homework, setHomework] = useState(task.homework ?? "");
  const [deadline, setDeadline] = useState(
    task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr(null);
    try {
      const res = await fetch(`/api/teacher/tasks/tasks/${task.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc || undefined, homework: homework || undefined, deadline: deadline || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onUpdated({ ...task, title, description: desc || null, homework: homework || null, deadline: deadline || null });
      onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <p className="text-[14.5px] font-bold text-foreground">Edit Task</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Task title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={INP} />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              className="w-full rounded-xl px-4 py-3 text-[13.5px] leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Homework note</label>
            <input value={homework} onChange={e => setHomework(e.target.value)} className={INP} />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className={INP} />
          </div>
          {err && <p className="text-[12.5px] text-red-500">{err}</p>}
          <div className="flex gap-3 justify-end pt-1 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold shadow-sm transition-all disabled:opacity-60">
              {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiCheckLine />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Dialog (shadcn) ──────────────────────────────────────────────────
function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Confirm", loading, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border border-border bg-card shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-[13px] font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center"
          >
            {loading ? <RiLoader4Line className="animate-spin" /> : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deadline Display ────────────────────────────────────────────────────────────
function DeadlineDisplay({
  task,
  onEdit,
  onOpenCloseDialog,
}: {
  task: MemberTask;
  onEdit: () => void;
  onOpenCloseDialog: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!task.deadline) return;
    const update = () => {
      const diff = new Date(task.deadline!).getTime() - Date.now();
      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft("");
      } else {
        setIsOverdue(false);
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [task.deadline]);

  if (task.status === "SUBMITTED" || task.status === "REVIEWED") return null;
  if (!task.deadline) return null;

  if (isOverdue) {
    return (
      <div className="flex items-center gap-2 border-l border-border pl-2 ml-1">
        <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800/50 flex items-center">
          <RiAlertLine className="mr-1" /> Closed
        </span>
        <button onClick={onEdit} className="text-[10.5px] font-medium text-teal-600 dark:text-teal-400 hover:underline">
          Extend deadline
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-l border-border pl-2 ml-1">
      <span className="text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50 flex items-center">
        <RiTimeLine className="mr-1" /> {timeLeft}
      </span>
      <button onClick={onOpenCloseDialog} className="text-[10px] font-medium text-muted-foreground hover:text-red-500 transition-colors">
        Close now
      </button>
    </div>
  );
}

// ─── Member Row ────────────────────────────────────────────────────────────────
function MemberRow({
  member, sessionId, sessionCompleted,
  onAssigned, onUpdated, onDeleted,
}: {
  member: Member; sessionId: string; sessionCompleted: boolean;
  onAssigned: (m: Member, t: MemberTask) => void;
  onUpdated: (m: Member, t: MemberTask) => void;
  onDeleted: (m: Member) => void;
}) {
  const router = useRouter();
  const [showAssign, setShowAssign]         = useState(false);
  const [showEdit, setShowEdit]             = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [closing, setClosing]               = useState(false);
  const [showCloseDialog, setShowCloseDialog]   = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCloseNow = async () => {
    if (!member.task) return;
    setClosing(true);
    try {
      const now = new Date().toISOString();
      const res = await fetch(`/api/teacher/tasks/tasks/${member.task.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: now }),
      });
      if (res.ok) onUpdated(member, { ...member.task, deadline: now });
    } finally { setClosing(false); setShowCloseDialog(false); }
  };

  const handleDelete = async () => {
    if (!member.task) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/tasks/tasks/${member.task.id}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) onDeleted(member);
    } finally { setDeleting(false); setShowDeleteDialog(false); }
  };

  const st = member.task ? STATUS_CFG[member.task.status] : null;
  const initials = member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <ConfirmDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        title="Close homework submission"
        description={`Students will no longer be able to submit once the homework is closed for ${member.name}. You can reopen it by extending the deadline.`}
        confirmLabel="Close homework"
        loading={closing}
        onConfirm={handleCloseNow}
      />
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete this task?"
        description="This will permanently remove the task and any associated submissions. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
      {showAssign && (
        <AssignMemberModal
          sessionId={sessionId}
          member={member}
          onClose={() => setShowAssign(false)}
          onCreated={(t) => { onAssigned(member, t); setShowAssign(false); }}
        />
      )}
      {showEdit && member.task && (
        <EditTaskModal
          task={member.task}
          onClose={() => setShowEdit(false)}
          onUpdated={(t) => { onUpdated(member, t); setShowEdit(false); }}
        />
      )}
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-[13px]">
          {member.image ? (
            <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{member.name}</p>
          <p className="text-[11.5px] text-muted-foreground truncate">{member.email}</p>
        </div>

        {/* Task or Assign button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {member.task ? (
            <>
              {/* Status badge */}
              <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", st?.cls)}>
                {st?.label}
              </span>

              {/* View submission if submitted */}
              {member.task.submission && (
                <button
                  onClick={() => router.push(`/dashboard/teacher/taskSubmission/${member.task!.id}`)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  View <RiArrowRightLine className="text-xs" />
                </button>
              )}

              {/* Score if reviewed */}
              {member.task.finalScore != null && (
                <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                  {member.task.finalScore}/10
                </span>
              )}

              {/* Deadline Display */}
              <DeadlineDisplay
                task={member.task}
                onEdit={() => setShowEdit(true)}
                onOpenCloseDialog={() => setShowCloseDialog(true)}
              />

              {/* Edit/Delete buttons */}
              <button
                onClick={() => setShowEdit(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all ml-1"
                title="Edit task"
              >
                <RiEditLine className="text-xs" />
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                title="Delete task"
              >
                <RiDeleteBinLine className="text-xs" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-teal-300/60 dark:border-teal-700/50 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 text-[11px] font-semibold hover:bg-teal-100 dark:hover:bg-teal-950/50 transition-colors disabled:opacity-40"
            >
              <RiAddLine /> Assign
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Session Deadline Banner ──────────────────────────────────────────────────
function SessionDeadlineBanner({ session, onRefresh }: { session: Session; onRefresh: () => void }) {
  const allPending = session.tasks.filter(t => t.status === "PENDING");
  const pendingWithDeadline = allPending.filter(t => t.deadline);

  const earliest = pendingWithDeadline.reduce<MemberTask | null>((best, t) => {
    if (!best) return t;
    return new Date(t.deadline!) < new Date(best.deadline!) ? t : best;
  }, null);

  const [timeLeft, setTimeLeft]                   = useState("");
  const [isOverdue, setIsOverdue]                 = useState(false);
  const [closing, setClosing]                     = useState(false);
  const [extending, setExtending]                 = useState(false);
  const [showCloseDialog, setShowCloseDialog]     = useState(false);
  const [showExtendDialog, setShowExtendDialog]   = useState(false);
  const [newDeadline, setNewDeadline]             = useState("");

  useEffect(() => {
    if (!earliest?.deadline) { setIsOverdue(true); return; }
    const update = () => {
      const diff = new Date(earliest.deadline!).getTime() - Date.now();
      if (diff <= 0) {
        setIsOverdue(true); setTimeLeft("");
      } else {
        setIsOverdue(false);
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff / 3600000) % 24);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [earliest?.deadline]);

  const handleCloseAll = async () => {
    if (!allPending.length) return;
    setClosing(true);
    try {
      const now = new Date().toISOString();
      await Promise.all(allPending.map(t =>
        fetch(`/api/teacher/tasks/tasks/${t.id}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deadline: now }),
        })
      ));
      onRefresh();
    } finally { setClosing(false); setShowCloseDialog(false); }
  };

  const handleExtendAll = async () => {
    if (!allPending.length || !newDeadline) return;
    setExtending(true);
    try {
      const iso = new Date(newDeadline).toISOString();
      await Promise.all(allPending.map(t =>
        fetch(`/api/teacher/tasks/tasks/${t.id}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deadline: iso }),
        })
      ));
      onRefresh();
      setShowExtendDialog(false);
      setNewDeadline("");
    } finally { setExtending(false); }
  };

  // Don't show banner if no PENDING tasks at all
  if (!allPending.length) return null;
  // Don't show banner if no deadlines set yet
  if (!earliest?.deadline && !isOverdue) return null;

  return (
    <>
      {/* Close confirm dialog */}
      <ConfirmDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        title="Close homework for all?"
        description={`This will immediately close submissions for ${allPending.length} pending member(s). Students will no longer be able to submit.`}
        confirmLabel="Close all"
        loading={closing}
        onConfirm={handleCloseAll}
      />

      {/* Extend Deadline dialog — always mounted so state persists */}
      <Dialog open={showExtendDialog} onOpenChange={v => { setShowExtendDialog(v); if (!v) setNewDeadline(""); }}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-foreground">
              {isOverdue ? "Reopen & Extend Deadline" : "Extend Deadline"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1">
              Set a new deadline for all {allPending.length} pending member(s).{isOverdue ? " This will reopen submissions for them." : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">New Deadline</label>
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
              className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"
            />
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <button
              onClick={() => { setShowExtendDialog(false); setNewDeadline(""); }}
              className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all"
            >Cancel</button>
            <button
              onClick={handleExtendAll}
              disabled={extending || !newDeadline}
              className="flex-1 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-[13px] font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center"
            >
              {extending ? <RiLoader4Line className="animate-spin" /> : "Save Deadline"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banner */}
      {isOverdue ? (
        <div className="mx-4 mb-0 mt-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/70 dark:border-red-800/40">
          <RiAlertLine className="text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">Homework deadline passed — submission closed</p>
            <p className="text-[11px] text-red-500/70 dark:text-red-400/60">{allPending.length} pending member(s). Extend the deadline to reopen.</p>
          </div>
          <button
            onClick={() => { setNewDeadline(""); setShowExtendDialog(true); }}
            className="flex-shrink-0 h-7 px-3 rounded-lg text-[11px] font-semibold bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/40 hover:bg-teal-200 dark:hover:bg-teal-950/60 transition-colors"
          >Extend deadline →</button>
        </div>
      ) : (
        <div className="mx-4 mb-0 mt-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
          <RiTimeLine className="text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">
              Closes in <span className="font-mono">{timeLeft}</span>
            </p>
            <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60">{allPending.length} pending submission{allPending.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setNewDeadline(""); setShowExtendDialog(true); }}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold text-teal-600 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/40 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
            >Extend</button>
            <button
              onClick={() => setShowCloseDialog(true)}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-800/40 hover:bg-red-200 dark:hover:bg-red-950/60 transition-colors"
            >Close now</button>
          </div>
        </div>
      )}
    </>
  );
}



// ─── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({ session, onRefresh }: { session: Session; onRefresh: () => void }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadMembers = async () => {
    if (members !== null) { setExpanded(e => !e); return; }
    setLoading(true); setExpanded(true);
    try {
      const res = await fetch(`/api/teacher/tasks/sessions/${session.id}/members`, { credentials: "include" });
      const d = await res.json();
      if (d.success) setMembers(d.data);
    } finally { setLoading(false); }
  };

  const handleAssigned = (m: Member, t: MemberTask) => {
    setMembers(prev => prev?.map(mem => mem.studentProfileId === m.studentProfileId ? { ...mem, task: t } : mem) ?? prev);
  };
  const handleUpdated = (m: Member, t: MemberTask) => {
    setMembers(prev => prev?.map(mem => mem.studentProfileId === m.studentProfileId ? { ...mem, task: t } : mem) ?? prev);
  };
  const handleDeleted = (m: Member) => {
    setMembers(prev => prev?.map(mem => mem.studentProfileId === m.studentProfileId ? { ...mem, task: null } : mem) ?? prev);
  };

  const sessionCompleted = session.status === "completed";
  const ssCfg = SESSION_STATUS_CFG[session.status] ?? SESSION_STATUS_CFG.upcoming;
  const assignedCount = (members ?? session.tasks).length;
  const submittedCount = (members ?? session.tasks).filter((m: MemberTask | Member) => {
    if ("task" in m) return m.task?.status === "SUBMITTED" || m.task?.status === "REVIEWED";
    return (m as MemberTask).status === "SUBMITTED" || (m as MemberTask).status === "REVIEWED";
  }).length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Session header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-bold text-foreground truncate">{session.title}</p>
            <span className={cn("flex-shrink-0 text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", ssCfg.cls)}>
              {ssCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1"><RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />{session.cluster.name}</span>
            <span className="flex items-center gap-1"><RiCalendarCheckLine className="text-xs" />{new Date(session.scheduledAt).toLocaleDateString()}</span>
            <span className="text-[11px] text-muted-foreground/70">{assignedCount} assigned · {submittedCount} submitted</span>
          </div>
        </div>
        <button
          onClick={loadMembers}
          className="flex-shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
        >
          {loading ? <RiLoader4Line className="animate-spin" /> : null}
          {expanded ? "Hide members" : "View members"}
        </button>
      </div>

      {/* Deadline banner — always visible, no expand needed */}
      <SessionDeadlineBanner session={session} onRefresh={onRefresh} />

      {/* Bottom padding when banner shown but members hidden */}
      {!expanded && <div className="pb-3" />}

      {/* Members table */}
      {expanded && (
        <div>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-2.5 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : members && members.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground italic">No active members in this session.</p>
          ) : members ? (
            <div className="flex flex-col divide-y divide-border/60">
              {members.map(m => (
                <MemberRow
                  key={m.studentProfileId}
                  member={m}
                  sessionId={session.id}
                  sessionCompleted={sessionCompleted}
                  onAssigned={handleAssigned}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomeworkManagementPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/teacher/tasks/sessions", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setSessions(d.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = sessions.filter(s =>
    !search.trim() ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.cluster.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalTasks     = sessions.reduce((s, ss) => s + ss.tasks.length, 0);
  const pendingTasks   = sessions.reduce((s, ss) => s + ss.tasks.filter(t => t.status === "PENDING").length, 0);
  const submittedTasks = sessions.reduce((s, ss) => s + ss.tasks.filter(t => t.status === "SUBMITTED").length, 0);

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Sessions</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Homework Management</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Assign tasks per member; view submission status and review</p>
          </div>
          <RefreshIcon onClick={fetchData} loading={loading} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total tasks",  value: totalTasks,     accent: "teal"   },
          { label: "Pending",      value: pendingTasks,   accent: "amber"  },
          { label: "Submitted",    value: submittedTasks, accent: "violet" },
        ].map(card => {
          const a = {
            teal:   { i: "text-teal-600 dark:text-teal-400",   b: "bg-teal-100/70 dark:bg-teal-950/50",   br: "border-teal-200/70 dark:border-teal-800/50" },
            amber:  { i: "text-amber-600 dark:text-amber-400", b: "bg-amber-100/70 dark:bg-amber-950/50", br: "border-amber-200/70 dark:border-amber-800/50" },
            violet: { i: "text-violet-600 dark:text-violet-400",b: "bg-violet-100/70 dark:bg-violet-950/50",br: "border-violet-200/70 dark:border-violet-800/50" },
          }[card.accent]!;
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", a.b, a.br, a.i)}><RiFileTextLine /></div>
              <p className="text-[1.4rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{card.value}</p>
              <p className="text-[12px] font-medium text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-sm" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions or clusters…"
          className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
      </div>

      {/* Sessions */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-24" />)
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <RiFileTextLine className="text-3xl text-muted-foreground/25 mx-auto mb-2" />
          <p className="text-[13.5px] text-muted-foreground">No sessions found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(session => (
            <SessionCard key={session.id} session={session} onRefresh={fetchData} />
          ))}
        </div>
      )}
    </div>
  );
}