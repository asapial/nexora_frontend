"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiAlarmWarningLine, RiArrowLeftSLine, RiArrowRightSLine, RiFilter3Line,
  RiGridLine, RiLiveLine, RiRefreshLine, RiShieldCheckLine, RiTimeLine, RiUserLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, ExamStatusBadge, MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { ExamAttempt, ExamDetail, ExamSummary, ProctorEvent, examPhase, formatExamDate } from "@/lib/examShield";
import { cn } from "@/lib/utils";

const signalFilters = [
  ["ALL", "All suspicious signals"],
  ["PHONE_DETECTED", "Mobile detected"],
  ["HEAD_TURN_HORIZONTAL", "Horizontal head turn"],
  ["EYE_MOVEMENT_HORIZONTAL", "Horizontal eye movement"],
  ["MULTIPLE_FACES", "Multiple faces"],
  ["FACE_NOT_VISIBLE", "Face not visible"],
  ["CAMERA_INTERRUPTED", "Camera interrupted"],
  ["FULLSCREEN_EXIT", "Fullscreen exit"],
] as const;

export default function CombinedExamMonitoringPage() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ExamDetail | null>(null);
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);
  const [signalFilter, setSignalFilter] = useState("ALL");
  const [suspicionOnly, setSuspicionOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    examApi.teacherList()
      .then((response) => {
        const rows = (response.data as ExamSummary[]).filter((exam) => exam.status === "APPROVED");
        setExams(rows);
        setSelectedId(rows.find((exam) => examPhase(exam) === "LIVE")?.id ?? rows[0]?.id ?? "");
      })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not load exams"));
  }, []);

  const refresh = useCallback(async (quiet = false) => {
    if (!selectedId) return;
    if (!quiet) setRefreshing(true);
    try {
      const response = await examApi.teacherDetail(selectedId);
      setDetail(response.data as ExamDetail);
    } catch (error: unknown) {
      if (!quiet) toast.error(error instanceof Error ? error.message : "Could not refresh snapshot monitoring");
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, [selectedId]);

  useEffect(() => {
    setPage(1);
    setDetail(null);
    void refresh();
    const timer = window.setInterval(() => void refresh(true), 2000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const cards = useMemo(() => {
    const attempts = detail?.attempts.filter((attempt) => attempt.status === "IN_PROGRESS") ?? [];
    return attempts
      .map((attempt) => ({ attempt, events: visibleEvents(attempt), latest: latestEvidence(attempt, signalFilter) }))
      .filter(({ attempt, events }) => !suspicionOnly || attempt.suspicious || events.some((event) => event.reviewDecision !== "DISMISSED"))
      .filter(({ events }) => signalFilter === "ALL" || events.some((event) => event.type === signalFilter))
      .sort((a, b) => eventTime(b.latest) - eventTime(a.latest) || b.attempt.suspiciousCount - a.attempt.suspiciousCount);
  }, [detail?.attempts, signalFilter, suspicionOnly]);

  const pageCount = Math.max(1, Math.ceil(cards.length / pageSize));
  const visibleCards = cards.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  const active = detail?.attempts.filter((attempt) => attempt.status === "IN_PROGRESS").length ?? 0;
  const withWarnings = detail?.attempts.filter((attempt) => visibleEvents(attempt).some((event) => event.reviewDecision !== "DISMISSED")).length ?? 0;
  const confirmed = detail?.attempts.filter((attempt) => attempt.suspicious).length ?? 0;

  return <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-5 lg:p-8">
    <ExamShieldHeader
      eyebrow="ExamShield combined monitoring"
      title="Live snapshot wall"
      description="Monitor recent evidence snapshots across every active student without streaming or storing continuous video."
      action={{ label: "Open proctor console", href: "/dashboard/teacher/exams/proctoring" }}
    />

    <section className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"><RiLiveLine /></div>
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="min-w-[220px] flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-[12px] font-bold outline-none">
          <option value="">Select an approved exam</option>
          {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title} - {exam.cluster?.name ?? "No cluster"}</option>)}
        </select>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-muted/20 px-3"><RiFilter3Line className="text-muted-foreground" /><select value={signalFilter} onChange={(event) => { setSignalFilter(event.target.value); setPage(1); }} className="bg-transparent text-[10px] font-bold outline-none">{signalFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button onClick={() => setSuspicionOnly((value) => !value)} className={cn("h-11 rounded-xl border px-4 text-[10px] font-black transition-colors", suspicionOnly ? "border-rose-500/30 bg-rose-500/10 text-rose-600" : "border-border hover:bg-muted")}><RiAlarmWarningLine className="mr-1.5 inline" />Suspicion only</button>
        <button onClick={() => refresh()} disabled={!selectedId || refreshing} className="flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-[10px] font-bold hover:bg-muted disabled:opacity-40"><RiRefreshLine className={cn(refreshing && "animate-spin")} />Refresh</button>
      </div>
    </section>

    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label="Active students" value={active} note="Currently taking this exam" icon={<RiUserLine />} />
      <MetricCard label="Visible cards" value={cards.length} note="Matching current filters" icon={<RiGridLine />} accent="sky" />
      <MetricCard label="Students with warnings" value={withWarnings} note="Pending or confirmed review" icon={<RiAlarmWarningLine />} accent="rose" />
      <MetricCard label="Confirmed students" value={confirmed} note="Teacher-confirmed concerns" icon={<RiShieldCheckLine />} accent="violet" />
    </div>

    <section className="rounded-2xl border border-border bg-card/70 p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-[15px] font-black">{detail?.title ?? "Combined student observation"}</h2><p className="mt-1 text-[10px] text-muted-foreground">Snapshots update automatically every two seconds. No live student video is shown.</p></div>
        <div className="flex items-center gap-2"><span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Students per page</span>{[4, 9, 25].map((size) => <button key={size} onClick={() => { setPageSize(size); setPage(1); }} className={cn("h-8 min-w-9 rounded-lg border px-2 text-[10px] font-black", pageSize === size ? "border-teal-500/30 bg-teal-500/10 text-teal-600" : "border-border hover:bg-muted")}>{size}</button>)}</div>
      </div>

      {!selectedId ? <Empty text="Select an approved exam to begin combined monitoring." /> : visibleCards.length === 0 ? <Empty text={active ? "No active students match the current suspicion filters." : "No students are actively taking this exam."} /> : (
        <div className={cn("grid gap-4", pageSize === 4 ? "md:grid-cols-2" : pageSize === 9 ? "md:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5")}>
          {visibleCards.map(({ attempt, events, latest }) => <StudentSnapshotCard key={attempt.id} attempt={attempt} events={events} latest={latest} />)}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <p className="text-[10px] font-bold text-muted-foreground">Page {page} of {pageCount} - {cards.length} students</p>
        <div className="flex gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-[10px] font-bold disabled:opacity-40"><RiArrowLeftSLine />Previous</button><button onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} className="flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-[10px] font-bold disabled:opacity-40">Next<RiArrowRightSLine /></button></div>
      </div>
    </section>
  </div>;
}

function StudentSnapshotCard({ attempt, events, latest }: { attempt: ExamAttempt; events: ProctorEvent[]; latest: ProctorEvent | null }) {
  const warningCount = events.filter((event) => event.reviewDecision !== "DISMISSED" && event.reviewDecision !== "CONFIRMED_CONCERN").length;
  return <article className={cn("overflow-hidden rounded-2xl border bg-card shadow-sm", attempt.suspicious ? "border-rose-500/40" : warningCount ? "border-amber-500/30" : "border-border")}>
    <div className="relative aspect-video bg-zinc-950">
      {latest?.evidenceUrl ? <a href={latest.evidenceUrl} target="_blank" rel="noreferrer"><Image src={latest.evidenceUrl} alt={`${attempt.user.name} evidence`} fill unoptimized className="object-contain" /></a> : <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500"><RiGridLine className="text-3xl" /><p className="mt-2 text-[9px] font-bold">No snapshot evidence yet</p></div>}
      <span className={cn("absolute left-2 top-2 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-wider text-white", attempt.suspicious ? "bg-rose-600" : warningCount ? "bg-amber-500" : "bg-teal-600")}>{attempt.suspicious ? "Confirmed concern" : warningCount ? "Warning received" : "No warnings"}</span>
      {latest && <span className="absolute bottom-2 left-2 rounded-full bg-zinc-950/75 px-2 py-1 text-[7px] font-black uppercase text-white backdrop-blur">{latest.type.replaceAll("_", " ")}</span>}
    </div>
    <div className="p-3">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-[11px] font-black">{attempt.user.name}</h3><p className="mt-0.5 truncate text-[8px] text-muted-foreground">{attempt.user.email}</p></div><ExamStatusBadge value={attempt.status} /></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg bg-amber-500/10 px-2 py-1.5"><p className="text-[7px] font-black uppercase text-amber-600">Warnings</p><p className="text-[11px] font-black">{warningCount}</p></div><div className="rounded-lg bg-rose-500/10 px-2 py-1.5"><p className="text-[7px] font-black uppercase text-rose-600">Confirmed</p><p className="text-[11px] font-black">{attempt.suspiciousCount}</p></div></div>
      <div className="mt-3 flex items-center justify-between gap-2"><p className="flex items-center gap-1 text-[8px] text-muted-foreground"><RiTimeLine />{latest ? formatExamDate(latest.occurredAt) : "Awaiting evidence"}</p><Link href="/dashboard/teacher/exams/proctoring" className="text-[8px] font-black text-teal-600">Review feed</Link></div>
    </div>
  </article>;
}

function visibleEvents(attempt: ExamAttempt) {
  const clearedAt = attempt.proctorFeedClearedAt ? new Date(attempt.proctorFeedClearedAt).getTime() : 0;
  return attempt.proctorEvents.filter((event) => event.reviewDecision === "CONFIRMED_CONCERN" || new Date(event.occurredAt).getTime() > clearedAt);
}

function latestEvidence(attempt: ExamAttempt, filter: string) {
  return visibleEvents(attempt)
    .filter((event) => event.evidenceUrl && (filter === "ALL" || event.type === filter))
    .sort((a, b) => eventTime(b) - eventTime(a))[0] ?? null;
}

function eventTime(event: ProctorEvent | null) {
  return event ? new Date(event.occurredAt).getTime() : 0;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center"><RiGridLine className="mx-auto text-3xl text-muted-foreground" /><p className="mt-3 text-[12px] font-bold text-muted-foreground">{text}</p></div>;
}
