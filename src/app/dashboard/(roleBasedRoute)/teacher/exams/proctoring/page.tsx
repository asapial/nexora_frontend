"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  RiAlarmWarningLine, RiCheckboxCircleLine, RiFocus3Line, RiLiveLine,
  RiCloseCircleLine, RiDeleteBinLine, RiFilter3Line, RiFlagLine, RiGridLine, RiNotification3Line, RiRefreshLine, RiShieldCheckLine, RiTimeLine, RiUserLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, ExamShieldRoleNav, ExamStatusBadge, MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { ExamAttempt, ExamDetail, ExamSummary, examPhase, formatExamDate, proctorSignalLabel } from "@/lib/examShield";
import { cn } from "@/lib/utils";

type ConnectionState = "CONNECTING" | "LIVE" | "FALLBACK";
const signalFilters = [
  ["ALL", "All signals"],
  ["PHONE_DETECTED", "Phone visible"],
  ["DEVICE_DETECTED", "Other device visible"],
  ["HEAD_TURN_HORIZONTAL", "Head movement"],
  ["EYE_MOVEMENT_HORIZONTAL", "Eye movement"],
  ["MULTIPLE_FACES", "Multiple faces"],
  ["FACE_NOT_VISIBLE", "Face not visible"],
  ["FULLSCREEN_EXIT", "Fullscreen exit"],
  ["TAB_HIDDEN", "Tab switch"],
] as const;
type LiveProctorEvent = ExamAttempt["proctorEvents"][number] & {
  action: "CREATED" | "REVIEWED" | "FEED_CLEARED" | "EVIDENCE_UPDATED";
  attemptId: string;
  student: string;
  studentEmail: string;
  suspicious?: boolean;
  suspiciousCount?: number;
  feedClearedAt?: string;
  deletedEventIds?: string[];
  evidenceDeletionFailures?: number;
};

export default function ExamProctoringPage() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewing, setReviewing] = useState("");
  const [clearing, setClearing] = useState("");
  const [selectedAttemptId, setSelectedAttemptId] = useState("");
  const [connectionState, setConnectionState] = useState<ConnectionState>("CONNECTING");
  const [signalFilter, setSignalFilter] = useState("ALL");

  useEffect(() => {
    examApi.teacherList()
      .then((response) => {
        const rows = response.data as ExamSummary[];
        const monitorable = rows.filter((exam) => exam.status === "APPROVED");
        setExams(monitorable);
        setSelectedId(monitorable.find((exam) => examPhase(exam) === "LIVE")?.id ?? monitorable[0]?.id ?? "");
      })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not load exams"))
      .finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(async (quiet = false) => {
    if (!selectedId) return;
    if (!quiet) setRefreshing(true);
    try {
      const response = await examApi.teacherDetail(selectedId);
      setDetail(response.data as ExamDetail);
    } catch (error: unknown) {
      if (!quiet) toast.error(error instanceof Error ? error.message : "Could not refresh proctoring data");
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    refresh();
    setConnectionState("CONNECTING");
    let socket: WebSocket | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let fallbackTimer: ReturnType<typeof setInterval> | undefined;
    const reconcileTimer = setInterval(() => refresh(true), 30000);
    const stopFallback = () => {
      if (fallbackTimer) clearInterval(fallbackTimer);
      fallbackTimer = undefined;
    };
    const startFallback = () => {
      if (!fallbackTimer) fallbackTimer = setInterval(() => refresh(true), 1500);
    };
    const onReady = () => {
      stopFallback();
      setConnectionState("LIVE");
    };
    const onEvent = (message: MessageEvent<string>) => {
      let payload: { action: string };
      try {
        payload = JSON.parse(message.data) as { action: string };
      } catch {
        refresh(true);
        return;
      }
      if (payload.action === "READY") {
        onReady();
        return;
      }
      const event = payload as LiveProctorEvent;
      setDetail((current) => {
        if (!current) return current;
        return {
          ...current,
          attempts: current.attempts.map((attempt) => {
            if (attempt.id !== event.attemptId) return attempt;
            if (event.action === "FEED_CLEARED") {
              return {
                ...attempt,
                proctorFeedClearedAt: event.feedClearedAt ?? attempt.proctorFeedClearedAt,
                proctorEvents: attempt.proctorEvents.filter((item) => !event.deletedEventIds?.includes(item.id)),
              };
            }
            if (event.action === "REVIEWED") {
              return {
                ...attempt,
                suspicious: event.suspicious ?? attempt.suspicious,
                suspiciousCount: event.suspiciousCount ?? attempt.suspiciousCount,
                proctorEvents: attempt.proctorEvents.map((item) => item.id === event.id ? { ...item, reviewDecision: event.reviewDecision, reviewNote: event.reviewNote } : item),
              };
            }
            if (event.action === "EVIDENCE_UPDATED") {
              return {
                ...attempt,
                proctorEvents: attempt.proctorEvents.map((item) => item.id === event.id ? { ...item, evidenceUrl: event.evidenceUrl } : item),
              };
            }
            if (attempt.proctorEvents.some((item) => item.id === event.id)) return attempt;
            return {
              ...attempt,
              proctorEvents: [event, ...attempt.proctorEvents],
            };
          }),
        };
      });
      if (event.action === "CREATED") toast.warning(`${event.student}: ${proctorSignalLabel(event.type, event.metadata)}`);
    };
    const connect = async () => {
      try {
        const response = await examApi.proctorSocketTicket(selectedId);
        if (disposed) return;
        socket = new WebSocket(response.data.socketUrl);
        socket.onopen = onReady;
        socket.onmessage = onEvent;
        socket.onerror = () => {
          setConnectionState("FALLBACK");
          startFallback();
        };
        socket.onclose = () => {
          if (disposed) return;
          setConnectionState("FALLBACK");
          startFallback();
          reconnectTimer = setTimeout(connect, 2000);
        };
      } catch {
        if (disposed) return;
        setConnectionState("FALLBACK");
        startFallback();
        reconnectTimer = setTimeout(connect, 2000);
      }
    };
    void connect();
    return () => {
      disposed = true;
      socket?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      stopFallback();
      clearInterval(reconcileTimer);
    };
  }, [refresh, selectedId]);

  const attempts = useMemo(() => detail?.attempts ?? [], [detail?.attempts]);
  useEffect(() => {
    if (!attempts.length) return setSelectedAttemptId("");
    if (!attempts.some((attempt) => attempt.id === selectedAttemptId)) setSelectedAttemptId(attempts[0].id);
  }, [attempts, selectedAttemptId]);
  const submitted = attempts.filter((attempt) => attempt.status !== "IN_PROGRESS").length;
  const violations = attempts.reduce((sum, attempt) => sum + attempt.suspiciousCount, 0);
  const warnings = attempts.reduce((sum, attempt) => sum + visibleProctorEvents(attempt).filter((event) => event.reviewDecision !== "CONFIRMED_CONCERN").length, 0);
  const active = attempts.filter((attempt) => attempt.status === "IN_PROGRESS").length;
  const selectedAttempt = attempts.find((attempt) => attempt.id === selectedAttemptId) ?? null;
  const selectedEvents = useMemo(() => {
    if (!selectedAttempt) return [];
    return visibleProctorEvents(selectedAttempt)
      .filter((event) => signalFilter === "ALL" || event.type === signalFilter)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [selectedAttempt, signalFilter]);
  const filteredAttempts = useMemo(() => attempts.filter((attempt) =>
    signalFilter === "ALL" || visibleProctorEvents(attempt).some((event) => event.type === signalFilter),
  ), [attempts, signalFilter]);

  const reviewEvent = async (eventId: string, decision: "DISMISSED" | "CONFIRMED_CONCERN") => {
    if (!selectedId) return;
    setReviewing(eventId);
    try {
      await examApi.reviewProctorEvent(selectedId, eventId, { decision });
      toast.success(decision === "DISMISSED" ? "Signal dismissed" : "Concern confirmed");
      await refresh(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not review event");
    } finally {
      setReviewing("");
    }
  };

  const clearFeed = async () => {
    if (!selectedId || !selectedAttempt) return;
    setClearing(selectedAttempt.id);
    try {
      const response = await examApi.clearProctorFeed(selectedId, selectedAttempt.id);
      const feedClearedAt = response.data.feedClearedAt as string | undefined;
      const deletedEventIds = response.data.deletedEventIds as string[];
      setDetail((current) => current ? {
        ...current,
        attempts: current.attempts.map((attempt) => attempt.id === selectedAttempt.id ? {
          ...attempt,
          proctorFeedClearedAt: feedClearedAt ?? attempt.proctorFeedClearedAt,
          proctorEvents: attempt.proctorEvents.filter((event) => !deletedEventIds.includes(event.id)),
        } : attempt),
      } : current);
      if (response.data.evidenceDeletionFailures) {
        toast.error(`${response.data.evidenceDeletionFailures} snapshots could not be deleted and remain in the warning feed.`);
      } else {
        toast.success(`${response.data.deletedWarnings} warnings and their snapshots deleted. ${response.data.preservedConfirmedViolations} confirmed violations preserved.`);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not clear warning feed");
    } finally {
      setClearing("");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:p-8">
      <ExamShieldHeader
        eyebrow="ExamShield live integrity"
        title="Proctoring console"
        description="A dedicated real-time view of active attempts, risk signals, and student integrity events."
      />
      <ExamShieldRoleNav role="teacher" />

      <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"><RiLiveLine /></div>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13px] font-bold outline-none focus:border-teal-500/50">
            <option value="">Select an approved exam</option>
            {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title} · {exam.cluster?.name ?? "No cluster"}</option>)}
          </select>
          <button onClick={() => refresh()} disabled={!selectedId || refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-[12px] font-bold hover:bg-muted disabled:opacity-40">
            <RiRefreshLine className={cn(refreshing && "animate-spin")} /> Refresh
          </button>
          <Link href="/dashboard/teacher/exams/monitoring" className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-[12px] font-bold text-white hover:bg-teal-700"><RiGridLine /> Snapshot wall</Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : !selectedId ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/70 px-5 py-16 text-center">
          <RiShieldCheckLine className="mx-auto mb-3 text-3xl text-muted-foreground" />
          <p className="text-[14px] font-extrabold">No approved exams available</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Approved exams will appear here for live monitoring.</p>
        </div>
      ) : detail && (
        <>
          <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card to-teal-500/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><div className="flex items-center gap-2"><ExamStatusBadge value={examPhase(detail)} /><span className="text-[10px] font-bold text-muted-foreground">{detail.type}</span><span className={cn("rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider", detail.examMode === "PRO" ? "bg-violet-500/10 text-violet-600" : "bg-muted text-muted-foreground")}>{detail.examMode} Mode</span></div><h2 className="mt-3 text-xl font-black">{detail.title}</h2><p className="mt-1 text-[11px] text-muted-foreground">{detail.cluster?.name ?? "No cluster"} · {formatExamDate(detail.startTime)} to {formatExamDate(detail.endTime)}</p></div>
              <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest", connectionState === "LIVE" ? "border-teal-500/20 bg-teal-500/10 text-teal-600" : "border-amber-500/20 bg-amber-500/10 text-amber-600")}>
                <span className={cn("h-2 w-2 animate-pulse rounded-full", connectionState === "LIVE" ? "bg-teal-500" : "bg-amber-500")} />
                {connectionState === "LIVE" ? "WebSocket connected" : connectionState === "FALLBACK" ? "Fast refresh fallback" : "Connecting WebSocket"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Active attempts" value={active} note="Students currently in exam" icon={<RiFocus3Line />} accent="rose" />
            <MetricCard label="Submitted" value={submitted} note="Completed attempts" icon={<RiCheckboxCircleLine />} />
            <MetricCard label="Warnings" value={warnings} note="Signals awaiting or cleared by review" icon={<RiNotification3Line />} accent="sky" />
            <MetricCard label="Confirmed violations" value={violations} note="Teacher-confirmed concerns only" icon={<RiAlarmWarningLine />} accent="rose" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
              <div className="mb-5"><h2 className="text-[15px] font-extrabold">Student feeds</h2><p className="mt-1 text-[11px] text-muted-foreground">Select a student to review their warnings separately.</p></div>
              <label className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3"><RiFilter3Line className="text-muted-foreground" /><select value={signalFilter} onChange={(event) => setSignalFilter(event.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-[10px] font-bold outline-none">{signalFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              {filteredAttempts.length === 0 ? <Empty text={attempts.length ? "No students match this suspicion filter." : "No students have started this exam yet."} /> : (
                <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                  {[...filteredAttempts].sort((a, b) => b.suspiciousCount - a.suspiciousCount || b.proctorEvents.length - a.proctorEvents.length).map((attempt) => <StudentRiskCard key={attempt.id} attempt={attempt} selected={attempt.id === selectedAttemptId} onSelect={() => setSelectedAttemptId(attempt.id)} />)}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-[15px] font-extrabold">{selectedAttempt ? `${selectedAttempt.user.name}'s warning feed` : "Student warning feed"}</h2><p className="mt-1 text-[11px] text-muted-foreground">Every detector notification is a warning until you confirm a violation.</p></div>
                <button onClick={clearFeed} disabled={!selectedAttempt || visibleProctorEvents(selectedAttempt).every((event) => event.reviewDecision === "CONFIRMED_CONCERN") || clearing === selectedAttempt?.id} title="Deletes unconfirmed warnings and their Cloudinary snapshots. Confirmed violations are preserved." className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-[10px] font-bold hover:bg-muted disabled:opacity-40"><RiDeleteBinLine /> Clear warnings</button>
              </div>
              {selectedEvents.length === 0 ? <Empty text={selectedAttempt ? "No new warnings in this student's visible feed." : "Select a student to review their warnings."} /> : (
                <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className={cn("rounded-xl border p-3", event.reviewDecision === "CONFIRMED_CONCERN" ? "border-rose-500/40 bg-rose-500/10" : "border-amber-500/25 bg-amber-500/5")}>
                      <div className="flex items-start justify-between gap-2"><p className={cn("text-[11px] font-extrabold", event.reviewDecision === "CONFIRMED_CONCERN" ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300")}>{proctorSignalLabel(event.type, event.metadata)}</p><RiAlarmWarningLine className={cn("shrink-0", event.reviewDecision === "CONFIRMED_CONCERN" ? "text-rose-500" : "text-amber-500", (event.type === "PHONE_DETECTED" || event.type === "DEVICE_DETECTED") && "animate-pulse")} /></div>
                      <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><RiTimeLine /> {formatExamDate(event.occurredAt)}</p>
                      <EventDetails event={event} />
                      {event.evidenceUrl && <a href={event.evidenceUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-border bg-zinc-950"><Image src={event.evidenceUrl} alt={`${proctorSignalLabel(event.type, event.metadata)} evidence`} width={640} height={360} unoptimized className="aspect-video w-full object-contain" /><span className="block bg-card px-3 py-2 text-[9px] font-bold text-muted-foreground">Snapshot evidence - open full size</span></a>}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className={cn("rounded-full px-2 py-1 text-[8px] font-extrabold uppercase", event.reviewDecision === "CONFIRMED_CONCERN" ? "bg-rose-500/10 text-rose-600" : event.reviewDecision === "DISMISSED" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-600")}>{event.reviewDecision === "CONFIRMED_CONCERN" ? "Confirmed violation" : event.reviewDecision === "DISMISSED" ? "Warning dismissed" : "Proctor warning"}</span>
                        {(event.reviewDecision === "PENDING" || !event.reviewDecision) && <div className="flex gap-1"><button disabled={reviewing === event.id} onClick={() => reviewEvent(event.id, "DISMISSED")} title="Dismiss warning" className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[9px] font-bold text-muted-foreground hover:bg-muted"><RiCloseCircleLine /> Dismiss</button><button disabled={reviewing === event.id} onClick={() => reviewEvent(event.id, "CONFIRMED_CONCERN")} title="Confirm violation" className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 px-2 py-1.5 text-[9px] font-bold text-rose-600 hover:bg-rose-500/10"><RiFlagLine /> Confirm violation</button></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function EventDetails({ event }: { event: ExamAttempt["proctorEvents"][number] }) {
  const direction = typeof event.metadata?.direction === "string" ? event.metadata.direction : null;
  const axis = typeof event.metadata?.axis === "string" ? event.metadata.axis : null;
  const category = typeof event.metadata?.label === "string" ? event.metadata.label : null;
  const model = typeof event.metadata?.model === "string" ? event.metadata.model : null;
  const duration = event.durationMs ? `${(event.durationMs / 1000).toFixed(1)}s sustained` : null;
  const confidence = typeof event.confidence === "number" ? `${Math.round(event.confidence * 100)}% confidence` : null;
  const details = [category ? `Object: ${category}` : null, axis ? `Axis: ${axis}` : null, direction ? `Direction: ${direction}` : null, duration, confidence, model ? `Model: ${model}` : null].filter(Boolean);
  if (details.length === 0) return null;
  return <p className="mt-2 rounded-lg bg-card/70 px-2.5 py-2 text-[9px] font-bold capitalize text-muted-foreground">{details.join(" | ")}</p>;
}

function StudentRiskCard({ attempt, selected, onSelect }: { attempt: ExamAttempt; selected: boolean; onSelect: () => void }) {
  const warnings = visibleProctorEvents(attempt).filter((event) => event.reviewDecision !== "CONFIRMED_CONCERN").length;
  return (
    <button onClick={onSelect} className={cn("w-full rounded-xl border p-4 text-left transition", selected ? "border-teal-500/40 bg-teal-500/8 shadow-sm" : attempt.suspicious ? "border-rose-500/25 bg-rose-500/5" : "border-border bg-muted/15 hover:bg-muted/30")}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[12px] font-extrabold"><RiUserLine /> {attempt.user.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{attempt.user.email}</p></div>
        <ExamStatusBadge value={attempt.status} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-card/70 px-3 py-2">
        <span className="text-[10px] font-bold text-muted-foreground">Integrity events</span>
        <span className={cn("text-sm font-black", attempt.suspiciousCount ? "text-rose-600" : "text-teal-600")}>{attempt.suspiciousCount} confirmed</span>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">{warnings ? `${warnings} warning${warnings === 1 ? "" : "s"} received` : attempt.suspicious ? "Confirmed violation history" : "No warnings received"}</p>
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[11px] text-muted-foreground">{text}</div>;
}

function visibleProctorEvents(attempt: ExamAttempt) {
  const clearedAt = attempt.proctorFeedClearedAt ? new Date(attempt.proctorFeedClearedAt).getTime() : 0;
  return attempt.proctorEvents.filter((event) => event.reviewDecision === "CONFIRMED_CONCERN" || new Date(event.occurredAt).getTime() > clearedAt);
}
