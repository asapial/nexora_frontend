"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiSendPlaneLine, RiLoader4Line,
  RiVideoLine, RiFilePdfLine, RiFileTextLine, RiCheckboxCircleLine,
  RiStarLine, RiTimeLine, RiFlaskLine, RiEditLine, RiBowlLine,
  RiTaxiLine, RiListUnordered,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type TaskStatus = "PENDING" | "SUBMITTED" | "REVIEWED";

interface Submission {
  id: string; body: string; videoUrl: string | null; textBody: string | null;
  pdfUrl: string | null; fileSize: number | null; submittedAt: string;
}
interface Task {
  id: string; title: string; description: string | null; homework: string | null;
  status: TaskStatus; finalScore: number | null; reviewNote: string | null;
  deadline: string | null; submission: Submission | null;
  StudySession: { id: string; title: string; cluster: { id: string; name: string } };
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

// Simple mini text formatting toolbar
function TextToolbar({ onInsert }: { onInsert: (tag: string) => void }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/20">
      <button type="button" onClick={() => onInsert("**")}
        className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition text-xs font-bold" title="Bold">
        <RiBowlLine />
      </button>
      <button type="button" onClick={() => onInsert("_")}
        className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition text-xs" title="Italic">
        <RiTaxiLine />
      </button>
      <button type="button" onClick={() => onInsert("\n- ")}
        className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition text-xs" title="List">
        <RiListUnordered />
      </button>
    </div>
  );
}

function SubmissionPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const taskId       = searchParams.get("taskId");

  const [task, setTask]         = useState<Task | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Submission fields
  const [activeTab, setActiveTab] = useState<"text" | "video" | "pdf">("text");
  const [textBody, setTextBody]   = useState("");
  const [videoUrl, setVideoUrl]   = useState("");
  const [pdfUrl, setPdfUrl]       = useState("");
  const [fileSize, setFileSize]   = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr]   = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  const fetchTask = useCallback(async () => {
    if (!taskId) { setError("No task ID provided."); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/student/tasks/${taskId}`, { credentials: "include" });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || "Task not found");
      const found = d.data as Task;
      setTask(found);
      // Pre-fill if already submitted
      if (found.submission) {
        setTextBody(found.submission.textBody ?? "");
        setVideoUrl(found.submission.videoUrl ?? "");
        setPdfUrl(found.submission.pdfUrl ?? "");
        setFileSize(found.submission.fileSize ? String(found.submission.fileSize) : "");
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  const handleInsert = (tag: string) => {
    setTextBody(prev => prev + tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    if (!textBody.trim() && !videoUrl.trim() && !pdfUrl.trim()) {
      setSubmitErr("Please provide at least one of: written response, video URL, or PDF URL.");
      return;
    }
    setSubmitting(true); setSubmitErr(null);
    const method = task?.submission ? "PATCH" : "POST";
    try {
      const res = await fetch(`/api/student/tasks/${taskId}/submit`, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textBody: textBody.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          pdfUrl: pdfUrl.trim() || undefined,
          fileSize: fileSize ? parseInt(fileSize) : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Submit failed");
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/student/homework"), 1500);
    } catch (e: unknown) { setSubmitErr(e instanceof Error ? e.message : "Submit failed"); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-8 w-2/3 rounded-xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-[14px] font-bold text-red-500">{error ?? "Task not found"}</p>
        <button onClick={() => router.push("/dashboard/student/homework")}
          className="flex items-center gap-2 text-[13px] text-teal-600 dark:text-teal-400 hover:underline">
          <RiArrowLeftLine /> Back to Homework
        </button>
      </div>
    );
  }

  const statusCls = STATUS_STYLE[task.status];
  const stLabel   = { PENDING: "Pending", SUBMITTED: "Submitted", REVIEWED: "Reviewed" }[task.status];
  const isEditable = task.status !== "REVIEWED" && (!task.deadline || new Date(task.deadline).getTime() > Date.now());
  const deadlineOverdue = task.deadline && new Date(task.deadline).getTime() < Date.now();

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      {/* Back */}
      <button onClick={() => router.push("/dashboard/student/homework")}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <RiArrowLeftLine /> Homework
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Task Submission</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-tight">{task.title}</h1>
          <span className={cn("flex-shrink-0 text-[10.5px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border mt-1", statusCls)}>
            {stLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1"><RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />{task.StudySession.cluster.name}</span>
          <span className="flex items-center gap-1"><RiFileTextLine className="text-xs" />{task.StudySession.title}</span>
          {task.deadline && (
            <span className={cn("flex items-center gap-1 font-medium", deadlineOverdue ? "text-red-500" : "")}>
              <RiTimeLine className="text-xs" />{formatDeadline(task.deadline)}
            </span>
          )}
        </div>
      </div>

      {/* Task info */}
      {(task.description || task.homework) && (
        <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4 flex flex-col gap-2">
          {task.description && <p className="text-[13px] text-foreground/80">{task.description}</p>}
          {task.homework && (
            <p className="text-[12.5px] text-amber-700 dark:text-amber-400 font-medium">📚 {task.homework}</p>
          )}
        </div>
      )}

      {/* Reviewed result */}
      {task.status === "REVIEWED" && (
        <div className="px-5 py-4 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold text-violet-700 dark:text-violet-400 flex items-center gap-1.5"><RiStarLine /> Reviewed by teacher</span>
            {task.finalScore != null && (
              <span className="text-[15px] font-extrabold text-violet-700 dark:text-violet-400">{task.finalScore}/10</span>
            )}
          </div>
          {task.reviewNote && <p className="text-[12.5px] text-muted-foreground">{task.reviewNote}</p>}
        </div>
      )}

      {/* Submission form */}
      {isEditable ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[14px] font-bold text-foreground">
              {task.submission ? <span className="flex items-center gap-2"><RiEditLine /> Update Submission</span> : <span className="flex items-center gap-2"><RiSendPlaneLine /> Submit Task</span>}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-border">
            {([
              { key: "text",  icon: <RiFileTextLine />, label: "Written" },
              { key: "video", icon: <RiVideoLine />,    label: "Video URL" },
              { key: "pdf",   icon: <RiFilePdfLine />,  label: "PDF URL" },
            ] as const).map(tab => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-semibold transition-all -mb-px",
                  activeTab === tab.key ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500" : "text-muted-foreground hover:text-foreground")}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 flex flex-col gap-4">
            {activeTab === "text" && (
              <div>
                <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Written Response <span className="font-normal text-muted-foreground">(optional, supports markdown)</span></label>
                <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                  <TextToolbar onInsert={handleInsert} />
                  <textarea
                    value={textBody}
                    onChange={e => setTextBody(e.target.value)}
                    rows={8}
                    placeholder="Write your response here… (supports **bold**, _italic_, - list)"
                    className="w-full px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 bg-transparent resize-vertical focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeTab === "video" && (
              <div>
                <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Video URL <span className="font-normal text-muted-foreground">(optional)</span></label>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=… or cloud link"
                  className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
                <p className="text-[11.5px] text-muted-foreground mt-1.5">Paste a YouTube, Vimeo, or any cloud video link.</p>
              </div>
            )}

            {activeTab === "pdf" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">PDF URL <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <input value={pdfUrl} onChange={e => setPdfUrl(e.target.value)}
                    placeholder="https://drive.google.com/… or PDF link"
                    className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
                </div>
                <div>
                  <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">File Size (bytes) <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <input type="number" min="0" value={fileSize} onChange={e => setFileSize(e.target.value)}
                    placeholder="e.g. 204800"
                    className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
                </div>
              </div>
            )}

            {submitErr && <p className="text-[12.5px] text-red-500">{submitErr}</p>}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 text-[13px] font-semibold">
                <RiCheckboxCircleLine /> Submitted! Redirecting…
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => router.push("/dashboard/student/homework")}
                className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold shadow-sm transition-all disabled:opacity-60">
                {submitting ? <RiLoader4Line className="animate-spin" /> : <RiSendPlaneLine />}
                {submitting ? "Submitting…" : task.submission ? "Update" : "Submit"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* View-only submitted content */
        task.submission && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <RiCheckboxCircleLine className="text-teal-600 dark:text-teal-400" />
              <p className="text-[13px] font-bold text-foreground">Your Submission</p>
              <span className="ml-auto text-[11px] text-muted-foreground">{new Date(task.submission.submittedAt).toLocaleString()}</span>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {task.submission.textBody && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Written Response</p>
                  <p className="text-[13px] text-foreground/80 whitespace-pre-wrap rounded-xl bg-muted/30 border border-border px-4 py-3">{task.submission.textBody}</p>
                </div>
              )}
              {task.submission.videoUrl && (
                <a href={task.submission.videoUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-200/60 dark:border-blue-800/50 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[13px] font-semibold hover:bg-blue-100/60 transition-colors w-fit">
                  <RiVideoLine /> Video submission
                </a>
              )}
              {task.submission.pdfUrl && (
                <a href={task.submission.pdfUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[13px] font-semibold hover:bg-amber-100/60 transition-colors w-fit">
                  <RiFilePdfLine /> PDF document {task.submission.fileSize && `(${(task.submission.fileSize / 1024).toFixed(0)} KB)`}
                </a>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function TaskSubmissionPage() {
  return (
    <Suspense fallback={<div className="flex-1 animate-pulse p-7"><div className="h-64 rounded-2xl bg-muted/60" /></div>}>
      <SubmissionPageInner />
    </Suspense>
  );
}
