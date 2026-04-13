"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiBookLine, RiCheckboxCircleLine, RiTimeLine,
  RiFlaskLine, RiArrowRightLine, RiSendPlaneLine, RiStarLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import RefreshIcon from "@/components/shared/RefreshIcon";

type TaskStatus = "PENDING" | "SUBMITTED" | "REVIEWED";

interface HomeworkTask {
  id: string; title: string; homework: string; status: TaskStatus;
  deadline: string | null; finalScore: number | null;
  submission: { id: string; submittedAt: string } | null;
  StudySession: {
    id: string; title: string; scheduledAt: string;
    cluster: { id: string; name: string };
  };
}

type DoneFilter = "all" | "done" | "pending";

function isEffectivelyDone(t: HomeworkTask) {
  return t.status === "SUBMITTED" || t.status === "REVIEWED";
}

export default function HomeworkPage() {
  const router = useRouter();
  const [tasks, setTasks]         = useState<HomeworkTask[]>([]);
  const [loading, setLoading]     = useState(true);
  const [doneFilter, setDoneFilter] = useState<DoneFilter>("all");

  const fetchHomework = useCallback(() => {
    setLoading(true);
    fetch("/api/student/homework", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setTasks(d.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHomework(); }, [fetchHomework]);

  const filtered = tasks.filter(t => {
    if (doneFilter === "done") return isEffectivelyDone(t);
    if (doneFilter === "pending") return !isEffectivelyDone(t);
    return true;
  });

  const doneCount    = tasks.filter(isEffectivelyDone).length;
  const pendingCount = tasks.length - doneCount;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto">
      {/* Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Study</span>
          </div>
          <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">Homework</h1>
          <p className="text-[13px] text-muted-foreground mt-1">All homework across your sessions</p>
        </div>
        <RefreshIcon onClick={fetchHomework} loading={loading} />
      </div>

      {/* Stats + filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[1.25rem] font-extrabold text-teal-600 dark:text-teal-400 tabular-nums">{doneCount}</span>
            <span className="text-[12px] text-muted-foreground font-medium">done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[1.25rem] font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">{pendingCount}</span>
            <span className="text-[12px] text-muted-foreground font-medium">pending</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "pending", "done"] as DoneFilter[]).map(f => (
            <button key={f} onClick={() => setDoneFilter(f)}
              className={cn("text-[11.5px] font-semibold px-3 py-1 rounded-full border capitalize transition-colors",
                doneFilter === f ? "bg-teal-600 text-white border-teal-600" : "border-border text-muted-foreground hover:bg-muted/40")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RiBookLine className="text-4xl text-muted-foreground/30 mb-3" />
          <p className="text-[14px] font-semibold text-foreground mb-1">
            {doneFilter === "pending" ? "All homework done! 🎉" : "No homework yet"}
          </p>
          <p className="text-[12.5px] text-muted-foreground">
            {doneFilter === "pending" ? "You've completed all your homework." : "Homework assigned by your teacher will show up here."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex flex-col divide-y divide-border">
            {filtered.map(t => {
              const done    = isEffectivelyDone(t);
              const overdue = t.deadline && new Date(t.deadline).getTime() < Date.now() && !done;

              return (
                <div key={t.id} className={cn("flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors", done && "opacity-70")}>
                  {/* Status icon */}
                  <div className={cn("mt-0.5 w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base border",
                    t.status === "REVIEWED"  ? "bg-violet-100/80 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border-violet-200/70" :
                    t.status === "SUBMITTED" ? "bg-teal-100/80 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-200/70" :
                    "bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60")}>
                    {t.status === "REVIEWED" ? <RiStarLine /> : t.status === "SUBMITTED" ? <RiCheckboxCircleLine /> : <RiBookLine />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[13.5px] font-bold leading-snug", done ? "line-through text-muted-foreground" : "text-foreground")}>
                      {t.title}
                    </p>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5 mb-1.5">{t.homework}</p>
                    <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground/70">
                      <span className="flex items-center gap-1"><RiFlaskLine className="text-xs" /> {t.StudySession.cluster.name}</span>
                      <span className="flex items-center gap-0.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/student/sessions/${t.StudySession.id}`)}>
                        {t.StudySession.title} <RiArrowRightLine className="text-xs" />
                      </span>
                      {t.deadline && (
                        <span className={cn("flex items-center gap-0.5", overdue ? "text-red-500" : "")}>
                          <RiTimeLine className="text-xs" />{new Date(t.deadline).toLocaleDateString()}{overdue && " (overdue)"}
                        </span>
                      )}
                    </div>
                    {/* Score shown if reviewed */}
                    {t.status === "REVIEWED" && t.finalScore != null && (
                      <p className="mt-1 text-[12px] font-bold text-violet-600 dark:text-violet-400">Score: {t.finalScore}/10</p>
                    )}
                  </div>

                  {/* Submit / Submitted badge */}
                  {!done ? (
                    <button
                      onClick={() => router.push(`/dashboard/student/taskSubmission?taskId=${t.id}`)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300/60 dark:border-teal-700/50 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 text-[11.5px] font-semibold hover:bg-teal-100 dark:hover:bg-teal-950/50 transition-colors"
                    >
                      <RiSendPlaneLine /> Submit
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/dashboard/student/taskSubmission?taskId=${t.id}`)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-[11.5px] font-medium hover:bg-muted/40 transition-colors"
                    >
                      View <RiArrowRightLine className="text-xs" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
