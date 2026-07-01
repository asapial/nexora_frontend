"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiAddLine, RiAlarmWarningLine, RiBarChartBoxLine, RiCalendarCheckLine,
  RiCheckLine, RiCheckboxCircleLine, RiCloseLine, RiDeleteBinLine,
  RiEditLine, RiFireLine, RiFocus3Line, RiLoader4Line, RiPauseLine,
  RiPlayLine, RiRefreshLine, RiSearchLine, RiSparklingFill, RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { studyPlannerApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "TODO" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type View = "BOARD" | "AGENDA";
type Goal = {
  id: string; title: string; target?: string | null; kanbanStatus: Status; isAchieved: boolean;
  subject?: string | null; priority: Priority; dueAt?: string | null; scheduledAt?: string | null;
  estimatedMinutes?: number | null; completedMinutes: number; recurrence: "NONE" | "DAILY" | "WEEKLY";
  tags: string[]; createdAt: string;
};
type Summary = { total: number; completed: number; today: number; overdue: number; upcoming: number; estimatedMinutes: number; completedMinutes: number };

const columns: { key: Status; label: string; style: string }[] = [
  { key: "TODO", label: "Planned", style: "border-sky-500/20 bg-sky-500/[.04]" },
  { key: "IN_PROGRESS", label: "In focus", style: "border-amber-500/20 bg-amber-500/[.04]" },
  { key: "DONE", label: "Completed", style: "border-teal-500/20 bg-teal-500/[.04]" },
];
const priorityStyle: Record<Priority, string> = {
  LOW: "bg-sky-500/10 text-sky-600", MEDIUM: "bg-violet-500/10 text-violet-600",
  HIGH: "bg-amber-500/10 text-amber-600", URGENT: "bg-rose-500/10 text-rose-600",
};
const dateInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : "";
const iso = (value: string) => value ? new Date(value).toISOString() : null;
const duration = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
const dueText = (goal: Goal) => {
  if (!goal.dueAt) return "No deadline";
  const diff = new Date(goal.dueAt).getTime() - Date.now();
  if (!goal.isAchieved && diff < 0) return "Overdue";
  const days = Math.ceil(diff / 86400000);
  return days <= 0 ? "Due today" : `Due in ${days}d`;
};

export default function StudyPlannerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, completed: 0, today: 0, overdue: 0, upcoming: 0, estimatedMinutes: 0, completedMinutes: 0 });
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("BOARD");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<Priority | "ALL">("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [focusGoal, setFocusGoal] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s, m] = await Promise.all([studyPlannerApi.getGoals(), studyPlannerApi.getStreak(), studyPlannerApi.getSummary()]);
      setGoals(Array.isArray(g.data) ? g.data : []);
      setStreak(s.data?.streak ?? 0);
      setSummary(m.data ?? {});
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Could not load planner"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => goals.filter((goal) => {
    const term = search.toLowerCase();
    return (!term || `${goal.title} ${goal.subject ?? ""} ${goal.tags.join(" ")}`.toLowerCase().includes(term))
      && (priority === "ALL" || goal.priority === priority);
  }), [goals, priority, search]);
  const today = useMemo(() => filtered.filter((goal) => goal.scheduledAt && new Date(goal.scheduledAt).toDateString() === new Date().toDateString()), [filtered]);
  const overdue = useMemo(() => filtered.filter((goal) => !goal.isAchieved && goal.dueAt && new Date(goal.dueAt).getTime() < Date.now()), [filtered]);

  const move = async (goal: Goal, status: Status) => {
    const done = status === "DONE";
    setGoals((items) => items.map((item) => item.id === goal.id ? { ...item, kanbanStatus: status, isAchieved: done } : item));
    try { await studyPlannerApi.updateGoal(goal.id, { kanbanStatus: status, isAchieved: done }); await load(); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Could not move goal"); await load(); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this study goal?")) return;
    await studyPlannerApi.deleteGoal(id); setGoals((items) => items.filter((item) => item.id !== id)); toast.success("Goal removed"); void load();
  };

  return <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-5 lg:p-7">
    <header className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-teal-500/[.06] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[.16em] text-violet-600"><RiSparklingFill /> Intelligent planning workspace</p><h1 className="mt-1 text-2xl font-black">Study Planner</h1><p className="mt-1 text-[11px] text-muted-foreground">Plan meaningful work, protect focus time, and stay ahead of deadlines.</p></div>
        <div className="flex items-center gap-2"><span className="flex h-10 items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 text-[10px] font-black text-orange-600"><RiFireLine />{streak} day streak</span><button onClick={() => { setEditing(null); setShowModal(true); }} className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-[10px] font-black text-white hover:bg-violet-700"><RiAddLine />Plan goal</button></div>
      </div>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={<RiCalendarCheckLine />} label="Scheduled today" value={summary.today} tone="teal" />
      <Metric icon={<RiAlarmWarningLine />} label="Overdue" value={summary.overdue} tone="rose" />
      <Metric icon={<RiTimeLine />} label="Active estimate" value={duration(summary.estimatedMinutes)} tone="violet" />
      <Metric icon={<RiFocus3Line />} label="Focus logged" value={duration(summary.completedMinutes)} tone="amber" />
      <Metric icon={<RiBarChartBoxLine />} label="Completion" value={`${summary.total ? Math.round(summary.completed / summary.total * 100) : 0}%`} tone="sky" />
    </section>

    {(today.length > 0 || overdue.length > 0) && <section className="grid gap-4 lg:grid-cols-2">
      <SmartList title="Today’s plan" note="Your scheduled focus blocks" goals={today} empty="Nothing scheduled today" onFocus={setFocusGoal} onEdit={(goal) => { setEditing(goal); setShowModal(true); }} />
      <SmartList title="Needs attention" note="Deadlines already passed" goals={overdue} empty="No overdue goals" onFocus={setFocusGoal} onEdit={(goal) => { setEditing(goal); setShowModal(true); }} danger />
    </section>}

    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
      <div className="relative min-w-56 flex-1"><RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search goal, subject, or tag" className="h-10 w-full rounded-xl border border-border bg-muted/20 pl-9 pr-3 text-[11px] outline-none focus:border-violet-500/50" /></div>
      <select value={priority} onChange={(event) => setPriority(event.target.value as Priority | "ALL")} className="h-10 rounded-xl border border-border bg-muted/20 px-3 text-[10px] font-bold outline-none"><option value="ALL">All priorities</option>{(["URGENT", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((item) => <option key={item}>{item}</option>)}</select>
      <div className="flex rounded-xl border border-border p-1">{(["BOARD", "AGENDA"] as View[]).map((item) => <button key={item} onClick={() => setView(item)} className={cn("h-8 rounded-lg px-3 text-[9px] font-black", view === item ? "bg-foreground text-background" : "text-muted-foreground")}>{item}</button>)}</div>
      <button onClick={() => void load()} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-muted"><RiRefreshLine /></button>
    </div>

    {view === "BOARD" ? <div className="grid gap-4 xl:grid-cols-3">{columns.map((column) => <section key={column.key} className={cn("min-h-72 rounded-2xl border p-4", column.style)}><div className="mb-3 flex items-center justify-between"><h2 className="text-[11px] font-black uppercase tracking-wider">{column.label}</h2><span className="rounded-full border border-border bg-card px-2 py-1 text-[8px] font-black">{filtered.filter((goal) => goal.kanbanStatus === column.key).length}</span></div><div className="space-y-3">{loading ? <Skeleton /> : filtered.filter((goal) => goal.kanbanStatus === column.key).map((goal) => <GoalCard key={goal.id} goal={goal} onMove={move} onEdit={(item) => { setEditing(item); setShowModal(true); }} onDelete={remove} onFocus={setFocusGoal} />)}</div></section>)}</div>
      : <Agenda goals={filtered} onFocus={setFocusGoal} onEdit={(goal) => { setEditing(goal); setShowModal(true); }} />}

    {showModal && <GoalModal goal={editing} onClose={() => setShowModal(false)} onSaved={async () => { setShowModal(false); await load(); }} />}
    {focusGoal && <FocusTimer goal={focusGoal} onClose={() => setFocusGoal(null)} onLogged={async () => { setFocusGoal(null); await load(); }} />}
  </div>;
}

function GoalCard({ goal, onMove, onEdit, onDelete, onFocus }: { goal: Goal; onMove: (goal: Goal, status: Status) => void; onEdit: (goal: Goal) => void; onDelete: (id: string) => void; onFocus: (goal: Goal) => void }) {
  const progress = goal.estimatedMinutes ? Math.min(100, Math.round(goal.completedMinutes / goal.estimatedMinutes * 100)) : 0;
  return <article className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-violet-500/30 hover:shadow-md"><div className="flex items-start gap-2"><div className="flex-1"><div className="flex flex-wrap gap-1.5"><span className={cn("rounded-full px-2 py-1 text-[7px] font-black", priorityStyle[goal.priority])}>{goal.priority}</span>{goal.subject && <span className="rounded-full bg-muted px-2 py-1 text-[7px] font-black text-muted-foreground">{goal.subject}</span>}</div><h3 className="mt-2 text-[12px] font-black leading-5">{goal.title}</h3></div><button onClick={() => onEdit(goal)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><RiEditLine /></button><button onClick={() => onDelete(goal.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"><RiDeleteBinLine /></button></div>{goal.target && <p className="mt-2 line-clamp-2 text-[9px] leading-4 text-muted-foreground">{goal.target}</p>}<div className="mt-3 flex flex-wrap gap-2 text-[8px] font-bold text-muted-foreground"><span>{dueText(goal)}</span>{goal.scheduledAt && <span>{new Date(goal.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}<span>{duration(goal.completedMinutes)} / {duration(goal.estimatedMinutes ?? 0)}</span></div>{goal.estimatedMinutes && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} /></div>}<div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3"><button onClick={() => onFocus(goal)} className="flex h-7 items-center gap-1 rounded-lg bg-violet-600 px-2.5 text-[8px] font-black text-white"><RiFocus3Line />Focus</button>{(["TODO", "IN_PROGRESS", "DONE"] as Status[]).filter((item) => item !== goal.kanbanStatus).map((item) => <button key={item} onClick={() => onMove(goal, item)} className="h-7 rounded-lg border border-border px-2 text-[7px] font-black text-muted-foreground hover:bg-muted">{item.replace("_", " ")}</button>)}</div></article>;
}

function SmartList({ title, note, goals, empty, onFocus, onEdit, danger }: { title: string; note: string; goals: Goal[]; empty: string; onFocus: (goal: Goal) => void; onEdit: (goal: Goal) => void; danger?: boolean }) {
  return <section className={cn("rounded-2xl border bg-card p-4", danger ? "border-rose-500/20" : "border-teal-500/20")}><h2 className="text-[11px] font-black">{title}</h2><p className="text-[8px] text-muted-foreground">{note}</p><div className="mt-3 space-y-2">{goals.length ? goals.slice(0, 5).map((goal) => <button key={goal.id} onClick={() => onEdit(goal)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/[.15] p-3 text-left hover:bg-muted/40"><span className={cn("h-2 w-2 rounded-full", danger ? "bg-rose-500" : "bg-teal-500")} /><span className="min-w-0 flex-1 truncate text-[10px] font-black">{goal.title}</span><span className="text-[8px] text-muted-foreground">{goal.estimatedMinutes ? duration(goal.estimatedMinutes) : "Flexible"}</span><span onClick={(event) => { event.stopPropagation(); onFocus(goal); }} className="rounded-lg bg-violet-600 px-2 py-1 text-[7px] font-black text-white">Focus</span></button>) : <p className="py-5 text-center text-[9px] text-muted-foreground">{empty}</p>}</div></section>;
}

function Agenda({ goals, onFocus, onEdit }: { goals: Goal[]; onFocus: (goal: Goal) => void; onEdit: (goal: Goal) => void }) {
  const scheduled = goals.filter((goal) => goal.scheduledAt || goal.dueAt).sort((a, b) => new Date(a.scheduledAt ?? a.dueAt!).getTime() - new Date(b.scheduledAt ?? b.dueAt!).getTime());
  return <section className="rounded-2xl border border-border bg-card p-4"><h2 className="text-[12px] font-black">Upcoming agenda</h2><div className="mt-4 space-y-2">{scheduled.length ? scheduled.map((goal) => <div key={goal.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"><div className="w-24"><p className="text-[9px] font-black">{new Date(goal.scheduledAt ?? goal.dueAt!).toLocaleDateString([], { month: "short", day: "numeric" })}</p><p className="text-[8px] text-muted-foreground">{goal.scheduledAt ? new Date(goal.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Deadline"}</p></div><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black">{goal.title}</p><p className="text-[8px] text-muted-foreground">{goal.subject ?? "Personal"} · {goal.priority}</p></div><button onClick={() => onEdit(goal)} className="rounded-lg border border-border px-3 py-2 text-[8px] font-black">Edit</button><button onClick={() => onFocus(goal)} className="rounded-lg bg-violet-600 px-3 py-2 text-[8px] font-black text-white">Start focus</button></div>) : <p className="py-16 text-center text-[10px] text-muted-foreground">Add a schedule or deadline to build your agenda.</p>}</div></section>;
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: string }) {
  const tones: Record<string, string> = { teal: "bg-teal-500/10 text-teal-600", rose: "bg-rose-500/10 text-rose-600", violet: "bg-violet-500/10 text-violet-600", amber: "bg-amber-500/10 text-amber-600", sky: "bg-sky-500/10 text-sky-600" };
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-base", tones[tone])}>{icon}</div><p className="mt-3 text-xl font-black">{value}</p><p className="text-[9px] font-bold text-muted-foreground">{label}</p></div>;
}

function Skeleton() { return <div className="space-y-3">{[1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-muted" />)}</div>; }

function GoalModal({ goal, onClose, onSaved }: { goal: Goal | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: goal?.title ?? "", target: goal?.target ?? "", subject: goal?.subject ?? "", priority: goal?.priority ?? "MEDIUM", dueAt: dateInput(goal?.dueAt), scheduledAt: dateInput(goal?.scheduledAt), estimatedMinutes: goal?.estimatedMinutes ? String(goal.estimatedMinutes) : "60", recurrence: goal?.recurrence ?? "NONE", tags: goal?.tags.join(", ") ?? "", kanbanStatus: goal?.kanbanStatus ?? "TODO" });
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => { if (!form.title.trim()) return; setSaving(true); const payload = { title: form.title, target: form.target, subject: form.subject, priority: form.priority, dueAt: iso(form.dueAt), scheduledAt: iso(form.scheduledAt), estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null, recurrence: form.recurrence, tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean), kanbanStatus: form.kanbanStatus }; try { if (goal) await studyPlannerApi.updateGoal(goal.id, payload); else await studyPlannerApi.createGoal(payload); toast.success(goal ? "Goal updated" : "Goal planned"); onSaved(); } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Could not save goal"); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-[8px] font-black uppercase tracking-wider text-violet-600">Advanced study plan</p><h2 className="mt-1 text-[14px] font-black">{goal ? "Edit goal" : "Plan a new goal"}</h2></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-muted"><RiCloseLine /></button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Goal title" wide><input value={form.title} onChange={(e) => set("title", e.target.value)} className={input} placeholder="What will you accomplish?" /></Field><Field label="Subject"><input value={form.subject} onChange={(e) => set("subject", e.target.value)} className={input} placeholder="e.g. Algorithms" /></Field><Field label="Priority"><select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={input}>{["LOW", "MEDIUM", "HIGH", "URGENT"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Scheduled focus"><input type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} className={input} /></Field><Field label="Deadline"><input type="datetime-local" value={form.dueAt} onChange={(e) => set("dueAt", e.target.value)} className={input} /></Field><Field label="Estimated minutes"><input type="number" min={5} value={form.estimatedMinutes} onChange={(e) => set("estimatedMinutes", e.target.value)} className={input} /></Field><Field label="Recurrence"><select value={form.recurrence} onChange={(e) => set("recurrence", e.target.value)} className={input}>{["NONE", "DAILY", "WEEKLY"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Status"><select value={form.kanbanStatus} onChange={(e) => set("kanbanStatus", e.target.value)} className={input}>{["TODO", "IN_PROGRESS", "DONE"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Tags" wide><input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={input} placeholder="exam, revision, chapter-5" /></Field><Field label="Plan notes" wide><textarea value={form.target} onChange={(e) => set("target", e.target.value)} rows={4} className={cn(input, "h-auto py-3")} placeholder="Resources, milestones, or definition of done" /></Field></div><div className="flex justify-end gap-2 border-t border-border p-4"><button onClick={onClose} className="h-10 rounded-xl border border-border px-4 text-[9px] font-black">Cancel</button><button disabled={saving || !form.title.trim()} onClick={save} className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-[9px] font-black text-white disabled:opacity-50">{saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}Save plan</button></div></div></div>;
}

function FocusTimer({ goal, onClose, onLogged }: { goal: Goal; onClose: () => void; onLogged: () => void }) {
  const [seconds, setSeconds] = useState(25 * 60); const [running, setRunning] = useState(false); const [logging, setLogging] = useState(false);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setSeconds((value) => { if (value <= 1) { setRunning(false); return 0; } return value - 1; }), 1000); return () => clearInterval(timer); }, [running]);
  const logged = Math.max(1, Math.round((25 * 60 - seconds) / 60));
  const save = async () => { setLogging(true); try { await studyPlannerApi.logFocus(goal.id, logged); toast.success(`${logged} focus minutes logged`); onLogged(); } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Could not log focus time"); } finally { setLogging(false); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-xl"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-7 text-center text-white shadow-2xl"><button onClick={onClose} className="ml-auto flex rounded-xl p-2 text-zinc-400 hover:bg-white/10"><RiCloseLine /></button><p className="text-[8px] font-black uppercase tracking-[.18em] text-violet-400">Deep focus session</p><h2 className="mt-2 text-[13px] font-black">{goal.title}</h2><p className="mt-8 font-mono text-6xl font-black tabular-nums">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</p><div className="mt-8 flex justify-center gap-2"><button onClick={() => setRunning((value) => !value)} className="flex h-12 items-center gap-2 rounded-xl bg-violet-600 px-6 text-[10px] font-black">{running ? <RiPauseLine /> : <RiPlayLine />}{running ? "Pause" : "Start focus"}</button><button disabled={logging || logged < 1} onClick={save} className="flex h-12 items-center gap-2 rounded-xl border border-white/15 px-5 text-[10px] font-black disabled:opacity-40"><RiCheckboxCircleLine />Log {logged}m</button></div><div className="mt-6 flex justify-center gap-2">{[15, 25, 50].map((minutes) => <button key={minutes} onClick={() => { setSeconds(minutes * 60); setRunning(false); }} className="rounded-lg border border-white/10 px-3 py-2 text-[8px] font-black text-zinc-400 hover:bg-white/10">{minutes} min</button>)}</div></div></div>;
}

const input = "h-10 w-full rounded-xl border border-border bg-muted/20 px-3 text-[10px] outline-none focus:border-violet-500/50";
function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={cn("block", wide && "sm:col-span-2")}><span className="mb-1.5 block text-[8px] font-black uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>; }
