"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiFileTextLine, RiCheckLine, RiCloseLine, RiTimeLine,
  RiEditLine, RiDeleteBinLine, RiFlaskLine, RiCalendarCheckLine, RiAlertLine,
  RiSearchLine, RiSendPlaneLine, RiAddLine, RiUserLine, RiArrowRightLine,
  RiCheckboxCircleLine, RiLoader4Line, RiRefreshLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

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
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    if (!member.task) return;
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/tasks/tasks/${member.task.id}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) onDeleted(member);
    } finally { setDeleting(false); }
  };

  const st = member.task ? STATUS_CFG[member.task.status] : null;
  const initials = member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
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

              {/* Edit/Delete buttons (not for completed sessions) */}
              {!sessionCompleted && (
                <>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                    title="Edit task"
                  >
                    <RiEditLine className="text-xs" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-40"
                    title="Delete task"
                  >
                    {deleting ? <RiLoader4Line className="text-xs animate-spin" /> : <RiDeleteBinLine className="text-xs" />}
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              onClick={() => setShowAssign(true)}
              disabled={sessionCompleted}
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

// ─── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({ session }: { session: Session }) {
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
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">

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
          <button onClick={fetchData} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Refresh">
            <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          </button>
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
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}