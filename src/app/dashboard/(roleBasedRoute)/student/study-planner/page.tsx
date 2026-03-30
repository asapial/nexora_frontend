"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiAddLine, RiFireLine, RiCheckLine,
  RiLoader4Line, RiDeleteBinLine, RiEditLine, RiCheckboxCircleLine,
  RiCloseLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { studyPlannerApi } from "@/lib/api";
import { toast } from "sonner";

type KanbanStatus = "TODO" | "IN_PROGRESS" | "DONE";

type Goal = {
  id: string;
  title: string;
  target?: string;
  isAchieved: boolean;
  achievedAt?: string;
  kanbanStatus?: KanbanStatus;
  createdAt: string;
};

const COLUMNS: { key: KanbanStatus; label: string; color: string; bg: string }[] = [
  { key: "TODO",        label: "To Do",       color: "text-sky-600 dark:text-sky-400",    bg: "bg-sky-50/60 dark:bg-sky-950/20 border-sky-200/50 dark:border-sky-800/30" },
  { key: "IN_PROGRESS", label: "In Progress", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30" },
  { key: "DONE",        label: "Done",        color: "text-teal-600 dark:text-teal-400",   bg: "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200/50 dark:border-teal-800/30" },
];

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20">
      <RiFireLine className="text-orange-500 text-sm" />
      <span className="text-[12px] font-bold text-orange-700 dark:text-orange-400">{streak} day streak</span>
    </div>
  );
}

function GoalCard({
  goal,
  onMove,
  onDelete,
  onEdit,
}: {
  goal: Goal;
  onMove: (id: string, to: KanbanStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-2.5 group hover:border-teal-300/50 dark:hover:border-teal-700/50 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground leading-snug flex-1">{goal.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(goal)} className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
            <RiEditLine className="text-xs" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-50/60 transition-all">
            <RiDeleteBinLine className="text-xs" />
          </button>
        </div>
      </div>
      {goal.target && (
        <p className="text-[11.5px] text-muted-foreground leading-snug">{goal.target}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["TODO", "IN_PROGRESS", "DONE"] as KanbanStatus[]).filter(s => s !== (goal.kanbanStatus ?? "TODO")).map(s => (
          <button
            key={s}
            onClick={() => onMove(goal.id, s)}
            className="text-[10.5px] font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-teal-400/50 px-2 py-0.5 rounded-lg transition-all"
          >
            → {s === "IN_PROGRESS" ? "In Progress" : s === "DONE" ? "Done" : "To Do"}
          </button>
        ))}
      </div>
      {goal.isAchieved && (
        <span className="flex items-center gap-1 text-[10.5px] font-bold text-teal-600 dark:text-teal-400">
          <RiCheckboxCircleLine /> Achieved
        </span>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 animate-pulse space-y-2">
      <div className="h-3.5 bg-muted rounded w-4/5" />
      <div className="h-2.5 bg-muted rounded w-3/5" />
      <div className="flex gap-1.5 mt-1">
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded w-12" />
      </div>
    </div>
  );
}

export default function StudentStudyPlannerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [kanban, setKanban] = useState<KanbanStatus>("TODO");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s] = await Promise.all([studyPlannerApi.getGoals(), studyPlannerApi.getStreak()]);
      setGoals(Array.isArray(g.data) ? g.data : []);
      setStreak(s.data?.streak ?? 0);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setTarget("");
    setKanban("TODO");
    setShowModal(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setTitle(goal.title);
    setTarget(goal.target ?? "");
    setKanban(goal.kanbanStatus ?? "TODO");
    setShowModal(true);
  };

  const saveGoal = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await studyPlannerApi.updateGoal(editing.id, { title, target });
        toast.success("Goal updated");
      } else {
        await studyPlannerApi.createGoal({ title, target, kanbanStatus: kanban });
        toast.success("Goal created");
      }
      setShowModal(false);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const moveGoal = async (id: string, to: KanbanStatus) => {
    try {
      const isDone = to === "DONE";
      await studyPlannerApi.updateGoal(id, { kanbanStatus: to, isAchieved: isDone });
      // Optimistic update
      setGoals(prev => prev.map(g => g.id === id ? { ...g, kanbanStatus: to, isAchieved: isDone } : g));
      if (isDone) { toast.success("Goal marked as done! 🎉"); await load(); }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await studyPlannerApi.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success("Goal removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const goalsBy = (col: KanbanStatus) =>
    goals.filter(g => (g.kanbanStatus ?? "TODO") === col);

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-violet-500 dark:text-violet-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Student</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Study Planner</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Kanban-style goal tracker with streak rewards</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StreakBadge streak={streak} />
          <button
            onClick={openCreate}
            className="h-9 px-4 rounded-xl bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all"
          >
            <RiAddLine />
            New goal
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colGoals = goalsBy(col.key);
          return (
            <div key={col.key} className={cn("rounded-2xl border p-4 flex flex-col gap-3", col.bg)}>
              <div className="flex items-center justify-between mb-1">
                <h2 className={cn("text-[13px] font-extrabold uppercase tracking-wide", col.color)}>{col.label}</h2>
                <span className="text-[11px] font-bold text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full border border-border">
                  {colGoals.length}
                </span>
              </div>
              {loading
                ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
                : colGoals.length === 0
                ? (
                  <div className="py-8 text-center">
                    <p className="text-[12px] text-muted-foreground/50">No goals here yet</p>
                  </div>
                )
                : colGoals.map(g => (
                  <GoalCard key={g.id} goal={g} onMove={moveGoal} onDelete={deleteGoal} onEdit={openEdit} />
                ))
              }
              {col.key === "TODO" && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 hover:text-muted-foreground p-2 rounded-xl border border-dashed border-border/60 hover:border-border transition-all w-full justify-center"
                >
                  <RiAddLine /> Add goal
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total goals", val: goals.length, col: "text-foreground" },
            { label: "In progress", val: goalsBy("IN_PROGRESS").length, col: "text-amber-600 dark:text-amber-400" },
            { label: "Completed", val: goalsBy("DONE").length, col: "text-teal-600 dark:text-teal-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className={cn("text-[1.5rem] font-extrabold tabular-nums leading-none mb-1", s.col)}>{s.val}</p>
              <p className="text-[12px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-foreground">{editing ? "Edit goal" : "New study goal"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                <RiCloseLine />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Goal title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Complete Chapter 5 exercises"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-400/25 transition-all"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Target / notes</label>
                <textarea
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  rows={3}
                  placeholder="Daily target, resources to use, etc."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-400/25 transition-all resize-none"
                />
              </div>
              {!editing && (
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Start column</label>
                  <div className="flex gap-2">
                    {COLUMNS.map(c => (
                      <button
                        key={c.key}
                        onClick={() => setKanban(c.key)}
                        className={cn(
                          "flex-1 h-8 rounded-xl text-[11.5px] font-semibold border transition-all",
                          kanban === c.key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={saveGoal}
              disabled={saving || !title.trim()}
              className="h-11 rounded-xl bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
            >
              {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
              {editing ? "Save changes" : "Create goal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
