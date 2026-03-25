"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiFileTextLine, RiCheckLine, RiCloseLine, RiTimeLine,
  RiEditLine, RiDeleteBinLine, RiFlaskLine, RiCalendarCheckLine, RiAlertLine,
  RiSearchLine, RiFilterLine, RiMoreLine, RiSendPlaneLine, RiAddLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type HWStatus = "PENDING" | "SUBMITTED" | "REVIEWED";
interface Member { id: string; name: string; email: string }
interface Task {
  id: string; title: string; description: string | null; homework: string | null;
  status: HWStatus; deadline: string | null; finalScore: number | null;
  member: Member | null;
  submission: { id: string; submittedAt: string; body: string } | null;
  _count: { drafts: number };
}
interface Session {
  id: string; title: string; scheduledAt: string;
  cluster: { id: string; name: string };
  tasks: Task[];
  _count: { attendance: number };
}

const STATUS_CFG: Record<HWStatus, { label: string; cls: string }> = {
  PENDING:   { label: "Open",     cls: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50" },
  SUBMITTED: { label: "Submitted",cls: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50" },
  REVIEWED:  { label: "Reviewed", cls: "bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50" },
};

const INP = "w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

// ─── Assign Task Modal ─────────────────────────────────────────────────────────
function AssignModal({ session, onClose, onCreated }: {
  session: Session; onClose: () => void; onCreated: (task: Task) => void;
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
      const res = await fetch(`/api/teacher/tasks/sessions/${session.id}/assign`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc || undefined, homework: homework || undefined, deadline: deadline || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onCreated(data.data);
      onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[14.5px] font-bold text-foreground">Assign Task / Homework</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{session.title} · {session.cluster.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Task title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Attention Mechanism Summary" className={INP} />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Task details…"
              className="w-full rounded-xl px-4 py-3 text-[13.5px] leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Homework note <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input value={homework} onChange={e => setHomework(e.target.value)} placeholder="e.g. Read chapter 5, submit summary" className={INP} />
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

export default function HomeworkManagementPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [assignTarget, setAssignTarget] = useState<Session | null>(null);

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
      {assignTarget && (
        <AssignModal
          session={assignTarget}
          onClose={() => setAssignTarget(null)}
          onCreated={(task) => {
            setSessions(prev => prev.map(s => s.id === assignTarget.id
              ? { ...s, tasks: [task, ...s.tasks] } : s));
          }}
        />
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Sessions</span>
        </div>
        <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Homework Management</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Assign tasks and homework to session; view submission status</p>
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
        Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-32" />)
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <RiFileTextLine className="text-3xl text-muted-foreground/25 mx-auto mb-2" />
          <p className="text-[13.5px] text-muted-foreground">No sessions found</p>
        </div>
      ) : (
        filtered.map(session => (
          <div key={session.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Session header */}
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
              <div>
                <p className="text-[14px] font-bold text-foreground">{session.title}</p>
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />{session.cluster.name}</span>
                  <span className="flex items-center gap-1"><RiCalendarCheckLine className="text-xs" />{new Date(session.scheduledAt).toLocaleDateString()}</span>
                  <span>{session._count.attendance} attended</span>
                </div>
              </div>
              <button onClick={() => setAssignTarget(session)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[12.5px] font-bold transition-all">
                <RiAddLine /> Assign task
              </button>
            </div>

            {/* Tasks */}
            {session.tasks.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground italic">No tasks assigned yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {session.tasks.map(t => {
                  const st = STATUS_CFG[t.status] ?? STATUS_CFG.PENDING;
                  const overdue = t.deadline && new Date(t.deadline) < new Date() && t.status === "PENDING";
                  return (
                    <div key={t.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                      <div className={cn("mt-0.5 w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm border", st.cls)}>
                        <RiFileTextLine />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[13.5px] font-semibold text-foreground">{t.title}</span>
                          <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", st.cls)}>{st.label}</span>
                          {overdue && <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50">Overdue</span>}
                        </div>
                        {t.homework && <p className="text-[12px] text-amber-600 dark:text-amber-400 font-medium">HW: {t.homework}</p>}
                        <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-muted-foreground">
                          {t.deadline && <span className="flex items-center gap-0.5"><RiTimeLine className="text-xs" />{new Date(t.deadline).toLocaleDateString()}</span>}
                          {t.submission && <span className="text-teal-600 dark:text-teal-400 font-medium">Submitted</span>}
                          {t.finalScore != null && <span className="text-violet-600 dark:text-violet-400 font-medium">Score: {t.finalScore}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}