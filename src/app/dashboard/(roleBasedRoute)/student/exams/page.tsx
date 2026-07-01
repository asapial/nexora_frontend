"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiCalendarCheckLine,
  RiCheckDoubleLine,
  RiCheckboxCircleLine,
  RiFileList3Line,
  RiHistoryLine,
  RiLoader4Line,
  RiRefreshLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamStatusBadge, MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { formatExamDate } from "@/lib/examShield";
import { cn } from "@/lib/utils";

type StudentAttempt = {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
  submittedAt?: string | null;
  percentage?: number | null;
};

type StudentExam = {
  id: string;
  title: string;
  description?: string | null;
  type: "MCQ" | "CQ" | "MIXED";
  examMode?: "REGULAR" | "PRO";
  startTime: string;
  endTime: string;
  durationMinutes?: number | null;
  resultsPublishedAt?: string | null;
  cluster: { id: string; name: string };
  attempts?: StudentAttempt[];
  _count: { questions: number };
};

type StudentAssignment = {
  id: string;
  exam: StudentExam;
};

type ExamPhase = "LIVE" | "UPCOMING" | "SUBMITTED" | "CLOSED";
type Filter = "ALL" | ExamPhase;

const phaseOf = (exam: StudentExam, now: number): ExamPhase => {
  const attempt = exam.attempts?.[0];
  if (attempt && attempt.status !== "IN_PROGRESS") return "SUBMITTED";
  if (now < new Date(exam.startTime).getTime()) return "UPCOMING";
  if (now < new Date(exam.endTime).getTime()) return "LIVE";
  return "CLOSED";
};

const timeUntil = (target: string, now: number) => {
  const difference = new Date(target).getTime() - now;
  if (difference <= 0) return "Now";
  const days = Math.floor(difference / 86_400_000);
  const hours = Math.floor((difference % 86_400_000) / 3_600_000);
  const minutes = Math.floor((difference % 3_600_000) / 60_000);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
};

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5">
      <div className="h-5 w-1/2 rounded bg-muted" />
      <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
      <div className="mt-6 h-16 rounded-xl bg-muted" />
      <div className="mt-4 h-10 rounded-xl bg-muted" />
    </div>
  );
}

function ExamCard({
  exam,
  phase,
  now,
  onEnter,
}: {
  exam: StudentExam;
  phase: ExamPhase;
  now: number;
  onEnter: () => void;
}) {
  const attempt = exam.attempts?.[0];
  const phaseConfig = {
    LIVE: {
      accent: "border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-card to-card",
      icon: <RiShieldCheckLine />,
      iconClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      note: `Closes in ${timeUntil(exam.endTime, now)}`,
    },
    UPCOMING: {
      accent: "border-border bg-card",
      icon: <RiCalendarCheckLine />,
      iconClass: "bg-violet-500/10 text-violet-600 border-violet-500/20",
      note: `Starts in ${timeUntil(exam.startTime, now)}`,
    },
    SUBMITTED: {
      accent: "border-teal-500/20 bg-gradient-to-br from-teal-500/8 via-card to-card",
      icon: <RiCheckDoubleLine />,
      iconClass: "bg-teal-500/10 text-teal-600 border-teal-500/20",
      note: attempt?.status === "AUTO_SUBMITTED" ? "Automatically submitted" : "Successfully submitted",
    },
    CLOSED: {
      accent: "border-border bg-muted/10",
      icon: <RiHistoryLine />,
      iconClass: "bg-muted text-muted-foreground border-border",
      note: "Exam window has closed",
    },
  }[phase];

  return (
    <article className={cn("relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:shadow-lg", phaseConfig.accent)}>
      {phase === "LIVE" && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500" />}
      <div className="flex items-start gap-4">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg", phaseConfig.iconClass)}>
          {phaseConfig.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ExamStatusBadge value={phase} />
            <span className="text-[10px] font-extrabold text-muted-foreground">{exam.type} · {exam.examMode ?? "REGULAR"} Mode</span>
          </div>
          <h3 className="mt-3 truncate text-[15px] font-black">{exam.title}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{exam.cluster.name}</p>
        </div>
      </div>

      {exam.description && <p className="mt-4 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{exam.description}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted/35 p-2.5 text-center"><p className="text-[13px] font-black">{exam._count.questions}</p><p className="text-[9px] font-bold text-muted-foreground">questions</p></div>
        <div className="rounded-xl bg-muted/35 p-2.5 text-center"><p className="text-[13px] font-black">{exam.durationMinutes ?? "Window"}</p><p className="text-[9px] font-bold text-muted-foreground">{exam.durationMinutes ? "minutes" : "duration"}</p></div>
        <div className="rounded-xl bg-muted/35 p-2.5 text-center"><p className="truncate text-[13px] font-black">{exam.type}</p><p className="text-[9px] font-bold text-muted-foreground">format</p></div>
      </div>

      <div className="mt-4 space-y-2 text-[10px] text-muted-foreground">
        <p className="flex items-center gap-2"><RiCalendarCheckLine className="text-teal-600" /> {formatExamDate(exam.startTime)}</p>
        <p className={cn("flex items-center gap-2 font-bold", phase === "LIVE" ? "text-rose-600" : "text-muted-foreground")}><RiTimeLine /> {phaseConfig.note}</p>
      </div>

      {phase === "LIVE" ? (
        <button onClick={onEnter} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-[12px] font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700">
          {attempt?.status === "IN_PROGRESS" ? "Continue exam" : "Enter secure exam"} <RiArrowRightLine />
        </button>
      ) : phase === "SUBMITTED" && exam.resultsPublishedAt ? (
        <button onClick={onEnter} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 text-[11px] font-bold text-teal-700 dark:text-teal-300">
          <RiCheckDoubleLine /> View published result <RiArrowRightLine />
        </button>
      ) : (
        <div className={cn(
          "mt-5 flex h-10 items-center justify-center gap-2 rounded-xl border text-[11px] font-bold",
          phase === "SUBMITTED"
            ? "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300"
            : "border-border bg-muted/20 text-muted-foreground",
        )}>
          {phase === "UPCOMING" && <><RiCheckboxCircleLine /> Scheduled</>}
          {phase === "SUBMITTED" && <><RiCheckDoubleLine /> Submission received</>}
          {phase === "CLOSED" && <><RiHistoryLine /> Closed</>}
        </div>
      )}
    </article>
  );
}

export default function StudentExamsPage() {
  const router = useRouter();
  const [items, setItems] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await examApi.studentList();
      setItems((response.data ?? []) as StudentAssignment[]);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not load your exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const rows = useMemo(() => items.map(({ exam }) => ({ exam, phase: phaseOf(exam, now) })), [items, now]);
  const counts = useMemo(() => ({
    live: rows.filter((row) => row.phase === "LIVE").length,
    upcoming: rows.filter((row) => row.phase === "UPCOMING").length,
    submitted: rows.filter((row) => row.phase === "SUBMITTED").length,
    closed: rows.filter((row) => row.phase === "CLOSED").length,
  }), [rows]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => filter === "ALL" || row.phase === filter)
      .filter((row) => !query || [row.exam.title, row.exam.cluster.name, row.exam.type].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const priority: Record<ExamPhase, number> = { LIVE: 0, UPCOMING: 1, SUBMITTED: 2, CLOSED: 3 };
        return priority[a.phase] - priority[b.phase] || +new Date(a.exam.startTime) - +new Date(b.exam.startTime);
      });
  }, [filter, rows, search]);

  const nextExam = rows
    .filter((row) => row.phase === "UPCOMING")
    .sort((a, b) => +new Date(a.exam.startTime) - +new Date(b.exam.startTime))[0];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 p-5 lg:p-8">
      <header className="overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/15 via-card to-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-600"><RiShieldCheckLine /> Student · ExamShield</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Your exam command center</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">See what is live, prepare for upcoming assessments, and confirm your submissions from one calm, focused workspace.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-teal-500/25 bg-card px-4 text-[12px] font-bold text-teal-700 shadow-sm dark:text-teal-300">
            {loading ? <RiLoader4Line className="animate-spin" /> : <RiRefreshLine />} Refresh schedule
          </button>
        </div>

        {counts.live > 0 ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">Action required</p><p className="mt-1 text-[13px] font-black">{counts.live} exam{counts.live > 1 ? "s are" : " is"} live now</p></div>
            <button onClick={() => setFilter("LIVE")} className="inline-flex h-9 items-center gap-2 rounded-xl bg-rose-600 px-4 text-[11px] font-bold text-white">View live exams <RiArrowRightLine /></button>
          </div>
        ) : nextExam ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-500/20 bg-card/70 p-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Next assessment</p><p className="mt-1 text-[13px] font-black">{nextExam.exam.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{nextExam.exam.cluster.name} · starts in {timeUntil(nextExam.exam.startTime, now)}</p></div>
            <ExamStatusBadge value="UPCOMING" />
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Live now" value={counts.live} note="Available to enter" icon={<RiShieldCheckLine />} accent="rose" />
        <MetricCard label="Upcoming" value={counts.upcoming} note="Scheduled assessments" icon={<RiCalendarCheckLine />} accent="violet" />
        <MetricCard label="Submitted" value={counts.submitted} note="Submission confirmed" icon={<RiCheckDoubleLine />} />
        <MetricCard label="Closed" value={counts.closed} note="Missed or expired" icon={<RiHistoryLine />} accent="sky" />
      </div>

      <section className="rounded-3xl border border-border bg-card/80 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-muted/20 p-1">
            {([
              ["ALL", `All (${rows.length})`],
              ["LIVE", `Live (${counts.live})`],
              ["UPCOMING", `Upcoming (${counts.upcoming})`],
              ["SUBMITTED", `Submitted (${counts.submitted})`],
              ["CLOSED", `Closed (${counts.closed})`],
            ] as Array<[Filter, string]>).map(([value, label]) => (
              <button key={value} onClick={() => setFilter(value)} className={cn("whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold transition", filter === value ? "bg-teal-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{label}</button>
            ))}
          </div>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-background px-3 sm:w-72">
            <RiSearchLine className="text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" placeholder="Search exam or cluster..." />
          </label>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><LoadingCard /><LoadingCard /><LoadingCard /></div>
      ) : visible.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ exam, phase }) => <ExamCard key={exam.id} exam={exam} phase={phase} now={now} onEnter={() => router.push(phase === "SUBMITTED" && exam.resultsPublishedAt ? `/dashboard/student/exams/results/${exam.id}` : `/dashboard/student/exams/${exam.id}`)} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 px-5 py-20 text-center">
          {search || filter !== "ALL" ? <RiSearchLine className="mx-auto text-4xl text-muted-foreground/35" /> : <RiFileList3Line className="mx-auto text-4xl text-teal-500/60" />}
          <p className="mt-4 text-[14px] font-black">{search || filter !== "ALL" ? "No matching exams" : "No approved exams yet"}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{search || filter !== "ALL" ? "Try another search or select All exams." : "Your approved cluster exam schedule will appear here."}</p>
          {(search || filter !== "ALL") && <button onClick={() => { setSearch(""); setFilter("ALL"); }} className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-[11px] font-bold text-white">Clear filters</button>}
        </div>
      )}

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5">
        <div className="flex items-start gap-3">
          <RiAlertLine className="mt-0.5 shrink-0 text-lg text-amber-600" />
          <div><p className="text-[12px] font-black text-amber-900 dark:text-amber-100">Before entering a live exam</p><p className="mt-1 text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-200/80">Use a stable connection, close unrelated tabs, and allow fullscreen mode. Leaving fullscreen or switching tabs may be recorded as an integrity event.</p></div>
        </div>
      </section>
    </div>
  );
}
