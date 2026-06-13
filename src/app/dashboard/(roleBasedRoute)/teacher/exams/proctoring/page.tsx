"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiAlarmWarningLine, RiCheckboxCircleLine, RiFocus3Line, RiLiveLine,
  RiRefreshLine, RiShieldCheckLine, RiTeamLine, RiTimeLine, RiUserLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, ExamStatusBadge, MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { ExamAttempt, ExamDetail, ExamSummary, examPhase, formatExamDate } from "@/lib/examShield";
import { cn } from "@/lib/utils";

export default function ExamProctoringPage() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    const timer = setInterval(() => refresh(true), 4000);
    return () => clearInterval(timer);
  }, [refresh, selectedId]);

  const attempts = useMemo(() => detail?.attempts ?? [], [detail?.attempts]);
  const submitted = attempts.filter((attempt) => attempt.status !== "IN_PROGRESS").length;
  const violations = attempts.reduce((sum, attempt) => sum + attempt.suspiciousCount, 0);
  const active = attempts.filter((attempt) => attempt.status === "IN_PROGRESS").length;
  const events = useMemo(() => attempts
    .flatMap((attempt) => attempt.proctorEvents.map((event) => ({ ...event, student: attempt.user.name, attemptId: attempt.id })))
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()), [attempts]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:p-8">
      <ExamShieldHeader
        eyebrow="ExamShield live integrity"
        title="Proctoring console"
        description="A dedicated real-time view of active attempts, risk signals, and student integrity events. Data refreshes every four seconds."
      />

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
              <div><div className="flex items-center gap-2"><ExamStatusBadge value={examPhase(detail)} /><span className="text-[10px] font-bold text-muted-foreground">{detail.type}</span></div><h2 className="mt-3 text-xl font-black">{detail.title}</h2><p className="mt-1 text-[11px] text-muted-foreground">{detail.cluster?.name ?? "No cluster"} · {formatExamDate(detail.startTime)} to {formatExamDate(detail.endTime)}</p></div>
              <div className="flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-teal-600"><span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />Auto refresh active</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Active attempts" value={active} note="Students currently in exam" icon={<RiFocus3Line />} accent="rose" />
            <MetricCard label="Submitted" value={submitted} note="Completed attempts" icon={<RiCheckboxCircleLine />} />
            <MetricCard label="Violations" value={violations} note="Integrity events recorded" icon={<RiAlarmWarningLine />} accent="rose" />
            <MetricCard label="Assigned" value={detail.cluster?.members.length ?? 0} note="Students in selected cluster" icon={<RiTeamLine />} accent="sky" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
              <div className="mb-5"><h2 className="text-[15px] font-extrabold">Student integrity status</h2><p className="mt-1 text-[11px] text-muted-foreground">Prioritized by suspicious event count.</p></div>
              {attempts.length === 0 ? <Empty text="No students have started this exam yet." /> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {[...attempts].sort((a, b) => b.suspiciousCount - a.suspiciousCount).map((attempt) => <StudentRiskCard key={attempt.id} attempt={attempt} />)}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-[15px] font-extrabold">Violation feed</h2><p className="mt-1 text-[11px] text-muted-foreground">Newest integrity events first.</p></div><RiAlarmWarningLine className="text-rose-500" /></div>
              {events.length === 0 ? <Empty text="No integrity events recorded." /> : (
                <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
                      <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300">{event.type.replaceAll("_", " ")}</p><RiAlarmWarningLine className="shrink-0 text-rose-500" /></div>
                      <p className="mt-1 text-[11px] font-bold">{event.student}</p>
                      <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><RiTimeLine /> {formatExamDate(event.occurredAt)}</p>
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

function StudentRiskCard({ attempt }: { attempt: ExamAttempt }) {
  return (
    <div className={cn("rounded-xl border p-4", attempt.suspicious ? "border-rose-500/25 bg-rose-500/5" : "border-border bg-muted/15")}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[12px] font-extrabold"><RiUserLine /> {attempt.user.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{attempt.user.email}</p></div>
        <ExamStatusBadge value={attempt.status} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-card/70 px-3 py-2">
        <span className="text-[10px] font-bold text-muted-foreground">Integrity events</span>
        <span className={cn("text-sm font-black", attempt.suspiciousCount ? "text-rose-600" : "text-teal-600")}>{attempt.suspiciousCount}</span>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">{attempt.proctorEvents[0] ? `Latest: ${attempt.proctorEvents[0].type.replaceAll("_", " ")}` : "No violations detected"}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[11px] text-muted-foreground">{text}</div>;
}
