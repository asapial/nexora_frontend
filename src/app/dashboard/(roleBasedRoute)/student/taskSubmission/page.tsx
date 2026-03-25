"use client";

import { useEffect, useState } from "react";
import {
  RiSparklingFill,
  RiTaskLine,
  RiFileUploadLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiFlaskLine,
  RiEdit2Line,
  RiStarLine,
  RiBookLine,
  RiSendPlaneLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type TaskStatus = "PENDING" | "SUBMITTED" | "REVIEWED";

interface TaskSubmission { id: string; body: string; fileUrl: string | null; submittedAt: string }
interface StudySession { id: string; title: string; scheduledAt: string; cluster: { id: string; name: string } }
interface Task {
  id: string;
  title: string;
  description: string | null;
  homework: string | null;
  status: TaskStatus;
  finalScore: number | null;
  reviewNote: string | null;
  deadline: string | null;
  submission: TaskSubmission | null;
  StudySession: StudySession;
}

const STATUS_STYLE: Record<TaskStatus, string> = {
  PENDING:   "bg-sky-100/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
  SUBMITTED: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  REVIEWED:  "bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50",
};

function formatDeadline(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  const h = Math.floor(diff / 3600000);
  if (h < 0) return "Overdue";
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

function TaskCard({ task, onRefresh }: { task: Task; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [body, setBody] = useState(task.submission?.body ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isEditable =
    task.status !== "REVIEWED" &&
    (!task.deadline || new Date(task.deadline).getTime() > Date.now());

  const handleSubmit = async () => {
    if (!body.trim()) { setErr("Submission body is required."); return; }
    setSubmitting(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append("body", body);
      if (file) fd.append("file", file);
      const method = task.submission ? "PATCH" : "POST";
      const res = await fetch(`/api/student/tasks/${task.id}/submit`, {
        method,
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submit failed");
      setExpanded(false);
      onRefresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusCls = STATUS_STYLE[task.status] ?? STATUS_STYLE.PENDING;
  const deadlineOverdue = task.deadline && new Date(task.deadline).getTime() < Date.now();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={cn("mt-0.5 w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base border", statusCls)}>
          {task.status === "REVIEWED" ? <RiStarLine /> : task.status === "SUBMITTED" ? <RiCheckboxCircleLine /> : <RiTaskLine />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-[13.5px] font-bold text-foreground">{task.title}</p>
            <span className={cn("flex-shrink-0 text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", statusCls)}>
              {task.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1"><RiFlaskLine className="text-xs" /> {task.StudySession.cluster.name}</span>
            <span className="flex items-center gap-1"><RiTaskLine className="text-xs" /> {task.StudySession.title}</span>
            {task.deadline && (
              <span className={cn("flex items-center gap-1", deadlineOverdue ? "text-red-500" : "text-muted-foreground")}>
                <RiTimeLine className="text-xs" />
                {formatDeadline(task.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Review result */}
      {task.status === "REVIEWED" && (
        <div className="mx-5 mb-3 rounded-xl border border-violet-200/70 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/30 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold text-violet-700 dark:text-violet-400">Review Result</span>
            {task.finalScore != null && (
              <span className="text-[13px] font-extrabold text-violet-700 dark:text-violet-400">
                {task.finalScore} / 100
              </span>
            )}
          </div>
          {task.reviewNote && <p className="text-[12px] text-muted-foreground">{task.reviewNote}</p>}
          {task.homework && (
            <div className="mt-2 flex items-start gap-1.5 text-[12px] text-amber-700 dark:text-amber-400">
              <RiBookLine className="text-sm flex-shrink-0 mt-0.5" />
              <span><span className="font-bold">Homework: </span>{task.homework}</span>
            </div>
          )}
        </div>
      )}

      {/* Expand: submission form */}
      {expanded && isEditable && (
        <div className="px-5 pb-5 border-t border-border">
          <p className="text-[12.5px] font-semibold text-foreground mt-4 mb-2">
            {task.submission ? (
              <span className="flex items-center gap-1.5"><RiEdit2Line /> Edit Submission</span>
            ) : (
              <span className="flex items-center gap-1.5"><RiSendPlaneLine /> Submit Task</span>
            )}
          </p>
          {task.description && (
            <p className="text-[12px] text-muted-foreground mb-3 p-3 rounded-lg bg-muted/50 border border-border">{task.description}</p>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Write your submission here…"
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 resize-vertical focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-400/60 transition-colors"
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
            <RiFileUploadLine />
            <span>{file ? file.name : "Attach a file (optional)"}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {err && <p className="text-[12px] text-red-500 mt-2">{err}</p>}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-[13px] font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              <RiSendPlaneLine />
              {submitting ? "Submitting…" : task.submission ? "Update" : "Submit"}
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="px-4 py-2 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Already submitted (not editable) */}
      {expanded && task.submission && task.status === "SUBMITTED" && (
        <div className="px-5 pb-5 border-t border-border">
          <p className="text-[12.5px] font-semibold text-foreground mt-4 mb-2">Your Submission</p>
          <p className="text-[13px] text-muted-foreground p-3 rounded-xl bg-muted/40 border border-border whitespace-pre-wrap">
            {task.submission.body}
          </p>
          {task.submission.fileUrl && (
            <a href={task.submission.fileUrl} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              <RiFileUploadLine /> View attached file
            </a>
          )}
          <p className="text-[11px] text-muted-foreground/55 mt-1.5">
            Submitted {new Date(task.submission.submittedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    setLoading(true);
    fetch("/api/student/tasks", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setTasks(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const pending   = tasks.filter((t) => t.status === "PENDING");
  const submitted = tasks.filter((t) => t.status === "SUBMITTED");
  const reviewed  = tasks.filter((t) => t.status === "REVIEWED");

  function Section({ title, items, accent }: { title: string; items: Task[]; accent: string }) {
    if (items.length === 0) return null;
    return (
      <div>
        <p className={cn("text-[10.5px] font-bold tracking-[.12em] uppercase mb-3", accent)}>
          {title} · {items.length}
        </p>
        <div className="flex flex-col gap-3">
          {items.map((t) => <TaskCard key={t.id} task={t} onRefresh={fetchTasks} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
            Tasks
          </span>
        </div>
        <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">
          Task Management
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Submit tasks, edit before deadline, and view teacher feedback
        </p>
      </div>

      {/* Stats strip */}
      {!loading && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
          {[
            { label: "Pending", count: pending.length, cls: "text-sky-600 dark:text-sky-400" },
            { label: "Submitted", count: submitted.length, cls: "text-teal-600 dark:text-teal-400" },
            { label: "Reviewed", count: reviewed.length, cls: "text-violet-600 dark:text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className={cn("text-[1.25rem] font-extrabold tabular-nums", s.cls)}>{s.count}</span>
              <span className="text-[12px] font-medium text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RiTaskLine className="text-4xl text-muted-foreground/30 mb-3" />
          <p className="text-[14px] font-semibold text-foreground mb-1">No tasks yet</p>
          <p className="text-[12.5px] text-muted-foreground">Tasks assigned by your teacher will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Section title="Pending" items={pending} accent="text-sky-600 dark:text-sky-400" />
          <Section title="Submitted" items={submitted} accent="text-teal-600 dark:text-teal-400" />
          <Section title="Reviewed" items={reviewed} accent="text-violet-600 dark:text-violet-400" />
        </div>
      )}
    </div>
  );
}
