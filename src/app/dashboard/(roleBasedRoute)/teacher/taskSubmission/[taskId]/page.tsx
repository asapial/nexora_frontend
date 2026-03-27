"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiUserLine, RiFileTextLine,
  RiVideoLine, RiFilePdfLine, RiCheckboxCircleLine, RiTimeLine,
  RiStarLine, RiSendPlaneLine, RiLoader4Line, RiFlaskLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type TaskStatus = "PENDING" | "SUBMITTED" | "REVIEWED";

interface Submission {
  id: string; body: string;
  videoUrl: string | null; textBody: string | null; pdfUrl: string | null; fileSize: number | null;
  submittedAt: string;
}
interface StudentProfile {
  user: { id: string; name: string; email: string; image: string | null };
}
interface Task {
  id: string; title: string; description: string | null; homework: string | null;
  status: TaskStatus; finalScore: number | null; reviewNote: string | null;
  deadline: string | null; submission: Submission | null;
  studentProfile: StudentProfile;
  StudySession: { id: string; title: string; cluster: { name: string } };
}

const STATUS_STYLE: Record<TaskStatus, string> = {
  PENDING:   "bg-sky-100/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
  SUBMITTED: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  REVIEWED:  "bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50",
};

export default function TeacherSubmissionReviewPage() {
  const router = useRouter();
  const { taskId } = useParams() as { taskId: string };

  const [task, setTask]       = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [score, setScore]       = useState("");
  const [note, setNote]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/teacher/tasks/tasks/${taskId}/submission`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTask(d.data);
          if (d.data.finalScore != null) setScore(String(d.data.finalScore));
          if (d.data.reviewNote) setNote(d.data.reviewNote);
        } else setError(d.message || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseFloat(score);
    if (isNaN(s) || s < 0 || s > 10) { setSubmitErr("Score must be between 0 and 10."); return; }
    setSubmitting(true); setSubmitErr(null);
    try {
      const res = await fetch(`/api/teacher/tasks/tasks/${taskId}/review`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalScore: s, reviewNote: note || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Review failed");
      setTask(prev => prev ? { ...prev, status: "REVIEWED", finalScore: s, reviewNote: note } : prev);
    } catch (e: unknown) { setSubmitErr(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-5 lg:p-7 pt-6 max-w-3xl mx-auto w-full animate-pulse">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-8 w-2/3 rounded-xl bg-muted" />
        <div className="h-48 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center gap-4 p-10">
        <p className="text-red-500 font-bold">{error ?? "Task not found"}</p>
        <button onClick={() => router.back()} className="text-[13px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
          <RiArrowLeftLine /> Go back
        </button>
      </div>
    );
  }

  const statusCls = STATUS_STYLE[task.status] ?? STATUS_STYLE.PENDING;
  const stLabel = { PENDING: "Pending", SUBMITTED: "Submitted", REVIEWED: "Reviewed" }[task.status];
  const initials = task.studentProfile.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto w-full">
      {/* Back */}
      <button onClick={() => router.push("/dashboard/teacher/homeworkManagement")}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <RiArrowLeftLine /> Homework Management
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Submission Review</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-tight">{task.title}</h1>
          <span className={cn("flex-shrink-0 text-[10.5px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border", statusCls)}>
            {stLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1"><RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />{task.StudySession.cluster.name}</span>
          <span className="flex items-center gap-1"><RiFileTextLine className="text-xs" />{task.StudySession.title}</span>
          {task.deadline && (
            <span className="flex items-center gap-1"><RiTimeLine className="text-xs" />{new Date(task.deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Student info */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-card">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-teal-100/60 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
          {task.studentProfile.user.image
            ? <img src={task.studentProfile.user.image} alt={task.studentProfile.user.name} className="w-full h-full object-cover" />
            : <span>{initials}</span>
          }
        </div>
        <div>
          <p className="text-[14px] font-bold text-foreground">{task.studentProfile.user.name}</p>
          <p className="text-[12.5px] text-muted-foreground">{task.studentProfile.user.email}</p>
        </div>
        <div className="ml-auto">
          <RiUserLine className="text-muted-foreground/40 text-xl" />
        </div>
      </div>

      {/* Task description / homework */}
      {(task.description || task.homework) && (
        <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4 flex flex-col gap-2">
          {task.description && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Task Description</p>
              <p className="text-[13px] text-foreground/80">{task.description}</p>
            </div>
          )}
          {task.homework && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">Homework</p>
              <p className="text-[13px] text-amber-700 dark:text-amber-300">{task.homework}</p>
            </div>
          )}
        </div>
      )}

      {/* Submission content */}
      {task.submission ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <RiCheckboxCircleLine className="text-teal-600 dark:text-teal-400" />
            <p className="text-[13px] font-bold text-foreground">Student Submission</p>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {new Date(task.submission.submittedAt).toLocaleString()}
            </span>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {/* Text body */}
            {task.submission.textBody && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Written Response</p>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13.5px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {task.submission.textBody}
                </div>
              </div>
            )}
            {/* Video */}
            {task.submission.videoUrl && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Video Submission</p>
                <a href={task.submission.videoUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-200/60 dark:border-blue-800/50 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[13px] font-semibold hover:bg-blue-100/60 transition-colors w-fit">
                  <RiVideoLine /> Watch video
                </a>
              </div>
            )}
            {/* PDF */}
            {task.submission.pdfUrl && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">PDF Document</p>
                <a href={task.submission.pdfUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[13px] font-semibold hover:bg-amber-100/60 transition-colors w-fit">
                  <RiFilePdfLine /> View PDF {task.submission.fileSize && `(${(task.submission.fileSize / 1024).toFixed(0)} KB)`}
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-8 text-center">
          <p className="text-[13px] text-muted-foreground">No submission yet.</p>
        </div>
      )}

      {/* Already reviewed banner */}
      {task.status === "REVIEWED" && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/50">
          <RiStarLine className="text-violet-600 dark:text-violet-400 text-base mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-bold text-violet-700 dark:text-violet-300">Already reviewed — Score: {task.finalScore ?? "—"}/10</p>
            {task.reviewNote && <p className="text-[12.5px] text-violet-600/80 dark:text-violet-400/80 mt-0.5">{task.reviewNote}</p>}
          </div>
        </div>
      )}

      {/* Review form */}
      {task.submission && (
        <form onSubmit={handleReview} className="rounded-2xl border border-border bg-card px-5 py-5 flex flex-col gap-4">
          <p className="text-[14px] font-bold text-foreground">
            {task.status === "REVIEWED" ? "Update Review" : "Give Marks"}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Score (0–10) *</label>
              <input
                type="number" min="0" max="10" step="0.5"
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="e.g. 8.5"
                className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Review Note <span className="font-normal text-muted-foreground">(optional)</span></label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              placeholder="Feedback for the student…"
              className="w-full rounded-xl px-4 py-3 text-[13.5px] leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"
            />
          </div>

          {submitErr && <p className="text-[12.5px] text-red-500">{submitErr}</p>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.back()} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold shadow-sm transition-all disabled:opacity-60">
              {submitting ? <RiLoader4Line className="animate-spin" /> : <RiSendPlaneLine />}
              {task.status === "REVIEWED" ? "Update Review" : "Submit Review"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
