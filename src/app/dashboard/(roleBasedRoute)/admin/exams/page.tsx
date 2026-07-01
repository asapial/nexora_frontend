"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiBarChartBoxLine,
  RiBookOpenLine,
  RiCameraLine,
  RiCalendarCheckLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiCloseLine,
  RiFileList3Line,
  RiGroupLine,
  RiLoader4Line,
  RiRefreshLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiUserLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamStatusBadge, MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { formatExamDate } from "@/lib/examShield";
import { cn } from "@/lib/utils";

type ExamOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type ExamQuestion = {
  id: string;
  type: "MCQ" | "CQ";
  prompt: string;
  explanation?: string | null;
  marks: number;
  options: ExamOption[];
};

type PendingExam = {
  id: string;
  title: string;
  description?: string | null;
  type: "MCQ" | "CQ" | "MIXED";
  examMode?: "REGULAR" | "PRO";
  proctorPolicy?: {
    sensitivity: "RELAXED" | "STANDARD" | "STRICT";
    studentWarnings: boolean;
    roughPaperAllowed: boolean;
    evidenceRetentionDays: number;
  } | null;
  status: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number | null;
  questions: ExamQuestion[];
  cluster?: { id: string; name: string } | null;
  teacher: { user: { name: string; email: string } };
  _count: { assignments: number };
};

type AnalyticsExam = {
  id: string;
  title: string;
  status: string;
  startTime: string;
  cluster?: { id: string; name: string } | null;
  assigned: number;
  participated: number;
  participationRate: number;
  averageScore: number;
  violationCount: number;
};

type ClusterAnalytics = {
  id: string;
  name: string;
  exams: number;
  participationRate: number;
  averageScore: number;
  violationCount: number;
};

type ExamAnalytics = {
  exams: AnalyticsExam[];
  clusters: ClusterAnalytics[];
  upcoming: AnalyticsExam[];
};

const emptyAnalytics: ExamAnalytics = { exams: [], clusters: [], upcoming: [] };
type Workspace = "APPROVALS" | "SCHEDULE" | "ANALYTICS";
type ModeFilter = "ALL" | "REGULAR" | "PRO";
type TypeFilter = "ALL" | "MCQ" | "CQ" | "MIXED";

const timeToStart = (value: string) => {
  const difference = new Date(value).getTime() - Date.now();
  if (difference <= 0) return "Start time passed";
  const hours = Math.floor(difference / 3_600_000);
  if (hours < 24) return `Starts in ${Math.max(1, hours)}h`;
  return `Starts in ${Math.ceil(hours / 24)}d`;
};

function ModeBadge({ mode = "REGULAR" }: { mode?: "REGULAR" | "PRO" }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider", mode === "PRO" ? "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300")}>{mode === "PRO" ? <RiCameraLine /> : <RiShieldCheckLine />}{mode} Mode</span>;
}

function LoadingCard() {
  return <div className="h-36 animate-pulse rounded-2xl border border-border bg-muted/50" />;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-12 text-center">
      <RiCheckDoubleLine className="mx-auto text-3xl text-teal-500" />
      <p className="mt-3 text-[13px] font-extrabold">{title}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

function ReviewPanel({
  exam,
  busyAction,
  onClose,
  onApprove,
  onReject,
}: {
  exam: PendingExam;
  busyAction: string | null;
  onClose: () => void;
  onApprove: (exam: PendingExam) => void;
  onReject: (exam: PendingExam) => void;
}) {
  const totalMarks = exam.questions.reduce((sum, question) => sum + question.marks, 0);
  const mcqCount = exam.questions.filter((question) => question.type === "MCQ").length;
  const cqCount = exam.questions.length - mcqCount;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Review ${exam.title}`}>
      <button className="min-w-0 flex-1 cursor-default" aria-label="Close review" onClick={onClose} />
      <div className="flex h-full w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl">
        <div className="border-b border-border bg-card px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ExamStatusBadge value={exam.status} />
                <ModeBadge mode={exam.examMode} />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">{exam.type}</span>
              </div>
              <h2 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{exam.title}</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {exam.cluster?.name ?? "No cluster"} · {exam.teacher.user.name}
              </p>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Close review">
              <RiCloseLine />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Questions", exam.questions.length],
              ["Total marks", totalMarks],
              ["MCQ", mcqCount],
              ["Creative", cqCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3">
                <p className="text-lg font-black tabular-nums">{value}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Assessment details</p>
            <p className="mt-3 text-[12px] leading-relaxed text-foreground/80">{exam.description || "No student instructions provided."}</p>
            <div className="mt-4 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2"><RiCalendarCheckLine className="text-teal-600" /> Starts {formatExamDate(exam.startTime)}</p>
              <p className="flex items-center gap-2"><RiTimeLine className="text-teal-600" /> Ends {formatExamDate(exam.endTime)}</p>
              <p className="flex items-center gap-2"><RiUserLine className="text-teal-600" /> {exam._count.assignments} assigned students</p>
              <p className="flex items-center gap-2"><RiShieldCheckLine className="text-teal-600" /> {exam.durationMinutes ?? "Window-based"} minute duration</p>
            </div>
          </div>

          {exam.examMode === "PRO" && exam.proctorPolicy && (
            <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2"><RiCameraLine className="text-violet-600" /><p className="text-[11px] font-black text-violet-700 dark:text-violet-300">Pro Mode integrity policy</p></div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                <ReviewFact label="Sensitivity" value={exam.proctorPolicy.sensitivity} />
                <ReviewFact label="Warnings" value={exam.proctorPolicy.studentWarnings ? "Enabled" : "Silent"} />
                <ReviewFact label="Rough paper" value={exam.proctorPolicy.roughPaperAllowed ? "Allowed" : "Not allowed"} />
                <ReviewFact label="Retention" value={`${exam.proctorPolicy.evidenceRetentionDays} days`} />
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-black">Questions and answer key</p>
              <p className="text-[11px] text-muted-foreground">Correct MCQ answers are highlighted for admin review.</p>
            </div>
            <span className="rounded-full bg-teal-500/10 px-3 py-1 text-[10px] font-extrabold text-teal-700 dark:text-teal-300">{totalMarks} marks</span>
          </div>

          <div className="mt-4 space-y-4">
            {exam.questions.map((question, index) => (
              <article key={question.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Question {index + 1} · {question.type}</p>
                  <span className="text-[10px] font-extrabold text-muted-foreground">{question.marks} marks</span>
                </div>
                <div className="p-4">
                  <p className="text-[13px] font-bold leading-relaxed">{question.prompt}</p>
                  {question.type === "MCQ" ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={option.id} className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[11px]",
                          option.isCorrect
                            ? "border-teal-500/35 bg-teal-500/10 font-bold text-teal-800 dark:text-teal-200"
                            : "border-border bg-muted/15 text-muted-foreground",
                        )}>
                          <span className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black",
                            option.isCorrect ? "border-teal-500 bg-teal-500 text-white" : "border-border bg-card",
                          )}>
                            {option.isCorrect ? <RiCheckLine /> : String.fromCharCode(65 + optionIndex)}
                          </span>
                          {option.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-700 dark:text-sky-300">Expected answer guidance</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{question.explanation || "No answer guidance provided. Teacher will grade this response manually."}</p>
                    </div>
                  )}
                  {question.type === "MCQ" && question.explanation && (
                    <p className="mt-3 rounded-xl bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Explanation:</strong> {question.explanation}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border bg-card px-5 py-4 sm:px-7">
          <button disabled={Boolean(busyAction)} onClick={() => onReject(exam)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-500/30 px-4 text-[12px] font-bold text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50">
            {busyAction === "reject" ? <RiLoader4Line className="animate-spin" /> : <RiCloseLine />} Reject exam
          </button>
          <button disabled={Boolean(busyAction)} onClick={() => onApprove(exam)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-5 text-[12px] font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-50">
            {busyAction === "approve" ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} Approve exam
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-violet-500/15 bg-card/70 p-2.5"><p className="text-[8px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function RejectDialog({
  exam,
  submitting,
  onClose,
  onSubmit,
}: {
  exam: PendingExam;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Reject exam">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">Return for revision</p>
            <h3 className="mt-2 text-lg font-black">{exam.title}</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Give the teacher a clear, actionable reason for rejection.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground" aria-label="Close rejection dialog"><RiCloseLine /></button>
        </div>
        <textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} className="mt-5 min-h-32 w-full resize-y rounded-xl border border-border bg-muted/20 p-3 text-[12px] outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10" placeholder="For example: Question 4 has two correct answers. Please correct the answer key and resubmit." />
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="h-10 rounded-xl border border-border px-4 text-[12px] font-bold">Cancel</button>
          <button disabled={submitting || reason.trim().length < 3} onClick={() => onSubmit(reason.trim())} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-[12px] font-bold text-white disabled:opacity-50">
            {submitting && <RiLoader4Line className="animate-spin" />} Reject with reason
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminExamsPage() {
  const [pending, setPending] = useState<PendingExam[]>([]);
  const [analytics, setAnalytics] = useState<ExamAnalytics>(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState<PendingExam | null>(null);
  const [rejectingExam, setRejectingExam] = useState<PendingExam | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>("APPROVALS");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingResponse, analyticsResponse] = await Promise.all([examApi.pending(), examApi.analytics()]);
      setPending((pendingResponse.data ?? []) as PendingExam[]);
      setAnalytics((analyticsResponse.data ?? emptyAnalytics) as ExamAnalytics);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not load ExamShield approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPending = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pending
      .filter((exam) => modeFilter === "ALL" || (exam.examMode ?? "REGULAR") === modeFilter)
      .filter((exam) => typeFilter === "ALL" || exam.type === typeFilter)
      .filter((exam) => !query || [exam.title, exam.cluster?.name, exam.teacher.user.name, exam.teacher.user.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [modeFilter, pending, search, typeFilter]);

  const approve = async (exam: PendingExam) => {
    setBusyAction("approve");
    try {
      await examApi.approve(exam.id);
      toast.success(`${exam.title} approved`);
      setSelectedExam(null);
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not approve exam");
    } finally {
      setBusyAction(null);
    }
  };

  const reject = async (reason: string) => {
    if (!rejectingExam) return;
    setBusyAction("reject");
    try {
      await examApi.reject(rejectingExam.id, reason);
      toast.success(`${rejectingExam.title} returned to the teacher`);
      setRejectingExam(null);
      setSelectedExam(null);
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not reject exam");
    } finally {
      setBusyAction(null);
    }
  };

  const totalViolations = analytics.exams.reduce((sum, exam) => sum + exam.violationCount, 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 p-5 lg:p-8">
      <header className="overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/15 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-600"><RiShieldCheckLine /> Admin · ExamShield</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Exam review center</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">Inspect every question and private answer key, make confident approval decisions, and monitor platform-wide assessment integrity.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-teal-500/25 bg-card px-4 text-[12px] font-bold text-teal-700 shadow-sm dark:text-teal-300">
            <RiRefreshLine className={cn(loading && "animate-spin")} /> Refresh data
          </button>
        </div>
        <div className="mt-7 grid gap-3 rounded-2xl border border-teal-500/15 bg-card/65 p-3 backdrop-blur sm:grid-cols-3">
          {([
            ["APPROVALS", "Approval queue", `${pending.length} waiting`, RiFileList3Line],
            ["SCHEDULE", "Approved schedule", `${analytics.upcoming.length} upcoming`, RiCalendarCheckLine],
            ["ANALYTICS", "Integrity overview", `${analytics.clusters.length} clusters`, RiBarChartBoxLine],
          ] as const).map(([value, label, note, Icon]) => (
            <button key={value} onClick={() => setWorkspace(value)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition", workspace === value ? "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300" : "border-transparent hover:border-border hover:bg-muted/30")}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-sm"><Icon /></span>
              <span><span className="block text-[11px] font-black">{label}</span><span className="mt-0.5 block text-[9px] text-muted-foreground">{note}</span></span>
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Awaiting review" value={pending.length} note="Teacher submissions" icon={<RiFileList3Line />} accent="violet" />
        <MetricCard label="Upcoming exams" value={analytics.upcoming.length} note="Approved schedule" icon={<RiCalendarCheckLine />} />
        <MetricCard label="Platform exams" value={analytics.exams.length} note="All assessment records" icon={<RiBookOpenLine />} accent="sky" />
        <MetricCard label="Integrity events" value={totalViolations} note="Recorded violations" icon={<RiAlertLine />} accent="rose" />
      </div>

      {workspace === "APPROVALS" && <section className="rounded-3xl border border-border bg-card/90 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-black">Approval queue</h2>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">{pending.length} pending</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Open an exam to inspect questions and correct answers before deciding.</p>
          </div>
          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
            <label className="flex h-10 min-w-52 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 lg:w-64">
              <RiSearchLine className="text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" placeholder="Search approvals..." />
            </label>
            <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value as ModeFilter)} className="h-10 rounded-xl border border-border bg-muted/20 px-3 text-[10px] font-bold outline-none"><option value="ALL">All modes</option><option value="REGULAR">Regular</option><option value="PRO">Pro Mode</option></select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="h-10 rounded-xl border border-border bg-muted/20 px-3 text-[10px] font-bold outline-none"><option value="ALL">All formats</option><option value="MCQ">MCQ</option><option value="CQ">CQ</option><option value="MIXED">Mixed</option></select>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2"><LoadingCard /><LoadingCard /></div>
          ) : filteredPending.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredPending.map((exam) => {
                const totalMarks = exam.questions.reduce((sum, question) => sum + question.marks, 0);
                return (
                  <article key={exam.id} className="group rounded-2xl border border-border bg-background p-5 transition hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><ModeBadge mode={exam.examMode} /><span className="text-[10px] font-extrabold text-muted-foreground">{exam.type}</span></div>
                        <h3 className="mt-3 truncate text-[15px] font-black">{exam.title}</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">{exam.cluster?.name ?? "No cluster"} · by {exam.teacher.user.name}</p>
                      </div>
                      <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-right text-amber-700 dark:text-amber-300"><p className="text-[9px] font-extrabold uppercase tracking-wider">Priority</p><p className="mt-0.5 text-[10px] font-black">{timeToStart(exam.startTime)}</p></div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        [`${exam.questions.length}`, "questions"],
                        [`${totalMarks}`, "marks"],
                        [`${exam._count.assignments}`, "students"],
                      ].map(([value, label]) => (
                        <div key={label} className="rounded-xl bg-muted/30 px-2 py-2.5 text-center"><p className="text-[13px] font-black">{value}</p><p className="text-[9px] font-bold text-muted-foreground">{label}</p></div>
                      ))}
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground"><RiCalendarCheckLine className="text-teal-600" /> Starts {formatExamDate(exam.startTime)}</p>
                    <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                      <button onClick={() => setSelectedExam(exam)} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 text-[11px] font-bold text-white transition hover:bg-teal-700">Review & decide <RiArrowRightLine /></button>
                      <button onClick={() => setRejectingExam(exam)} title="Return to teacher with a reason" className="flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-500/25 px-3 text-[10px] font-bold text-rose-600 transition hover:bg-rose-500/10"><RiCloseLine /> Return</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title={search ? "No matching approvals" : "Approval queue is clear"} description={search ? "Try a different exam, teacher, or cluster name." : "New teacher submissions will appear here for review."} />
          )}
        </div>
      </section>}

      {workspace === "SCHEDULE" && <section>
        <div className="mb-4 flex items-center gap-2"><RiCalendarCheckLine className="text-teal-600" /><h2 className="text-[15px] font-black">Upcoming approved exams</h2></div>
        {loading ? <div className="grid gap-4 md:grid-cols-3"><LoadingCard /><LoadingCard /><LoadingCard /></div> : analytics.upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analytics.upcoming.slice(0, 6).map((exam) => (
              <article key={exam.id} className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4">
                <div className="flex items-start justify-between gap-3"><h3 className="text-[13px] font-extrabold">{exam.title}</h3><ExamStatusBadge value="UPCOMING" /></div>
                <p className="mt-1 text-[10px] text-muted-foreground">{exam.cluster?.name ?? "No cluster"}</p>
                <p className="mt-3 flex items-center gap-2 text-[10px] font-bold text-teal-700 dark:text-teal-300"><RiTimeLine /> {formatExamDate(exam.startTime)}</p>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No upcoming exams" description="Approved future exams will appear here." />}
      </section>}

      {workspace === "ANALYTICS" && <section>
        <div className="mb-4 flex items-center gap-2"><RiBarChartBoxLine className="text-teal-600" /><h2 className="text-[15px] font-black">Cluster integrity overview</h2></div>
        {loading ? <div className="grid gap-4 md:grid-cols-3"><LoadingCard /><LoadingCard /><LoadingCard /></div> : analytics.clusters.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analytics.clusters.map((cluster) => (
              <article key={cluster.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3"><div><h3 className="text-[14px] font-black">{cluster.name}</h3><p className="text-[10px] text-muted-foreground">{cluster.exams} exams</p></div><RiGroupLine className="text-lg text-teal-600" /></div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-teal-500/10 p-2"><b className="text-[12px] text-teal-700 dark:text-teal-300">{cluster.participationRate}%</b><p className="text-[9px] text-muted-foreground">participation</p></div>
                  <div className="rounded-xl bg-sky-500/10 p-2"><b className="text-[12px] text-sky-700 dark:text-sky-300">{cluster.averageScore}%</b><p className="text-[9px] text-muted-foreground">average</p></div>
                  <div className="rounded-xl bg-rose-500/10 p-2"><b className="text-[12px] text-rose-700 dark:text-rose-300">{cluster.violationCount}</b><p className="text-[9px] text-muted-foreground">violations</p></div>
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No cluster analytics yet" description="Analytics appear after students begin taking exams." />}
      </section>}

      {selectedExam && (
        <ReviewPanel
          exam={selectedExam}
          busyAction={busyAction}
          onClose={() => setSelectedExam(null)}
          onApprove={approve}
          onReject={setRejectingExam}
        />
      )}
      {rejectingExam && (
        <RejectDialog
          exam={rejectingExam}
          submitting={busyAction === "reject"}
          onClose={() => setRejectingExam(null)}
          onSubmit={reject}
        />
      )}
    </div>
  );
}
