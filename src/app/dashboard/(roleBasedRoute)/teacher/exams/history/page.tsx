"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RiAlarmWarningLine, RiBarChartBoxLine, RiDownloadLine, RiFilterLine,
  RiHistoryLine, RiSearchLine, RiTeamLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, ExamStatusBadge, MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { downloadCsv, ExamDetail, ExamSummary, examPhase, formatExamDate } from "@/lib/examShield";

interface HistoryRow {
  exam: ExamSummary;
  detail?: ExamDetail;
  phase: string;
  assigned: number;
  participated: number;
  submitted: number;
  averageScore: number;
  violations: number;
}

export default function ExamHistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const summaries = (await examApi.teacherList()).data as ExamSummary[];
        const details = await Promise.allSettled(summaries.map((exam) => examApi.teacherDetail(exam.id)));
        setRows(summaries.map((exam, index) => {
          const result = details[index];
          const detail = result?.status === "fulfilled" ? result.value.data as ExamDetail : undefined;
          const attempts = detail?.attempts ?? [];
          const scored = attempts.filter((attempt) => attempt.percentage !== null && attempt.percentage !== undefined);
          return {
            exam,
            detail,
            phase: examPhase(exam),
            assigned: exam._count.assignments,
            participated: attempts.length || exam._count.attempts,
            submitted: attempts.filter((attempt) => attempt.status !== "IN_PROGRESS").length,
            averageScore: scored.length ? Math.round(scored.reduce((sum, attempt) => sum + (attempt.percentage ?? 0), 0) / scored.length) : 0,
            violations: attempts.reduce((sum, attempt) => sum + attempt.suspiciousCount, 0),
          };
        }));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Could not load exam history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => rows.filter((row) => {
    const query = search.trim().toLowerCase();
    if (query && !`${row.exam.title} ${row.exam.cluster?.name ?? ""}`.toLowerCase().includes(query)) return false;
    if (status !== "ALL" && row.phase !== status && row.exam.status !== status) return false;
    const start = new Date(row.exam.startTime).getTime();
    if (dateFrom && start < new Date(dateFrom).getTime()) return false;
    if (dateTo && start > new Date(`${dateTo}T23:59:59`).getTime()) return false;
    return true;
  }), [dateFrom, dateTo, rows, search, status]);

  const completed = filtered.filter((row) => row.phase === "COMPLETED").length;
  const averageScore = filtered.length ? Math.round(filtered.reduce((sum, row) => sum + row.averageScore, 0) / filtered.length) : 0;
  const participation = filtered.reduce((sum, row) => sum + row.participated, 0);
  const violations = filtered.reduce((sum, row) => sum + row.violations, 0);

  const exportHistory = () => {
    downloadCsv(`examshield-history-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Exam", "Cluster", "Status", "Type", "Starts", "Ends", "Assigned", "Participated", "Submitted", "Average score %", "Violations"],
      ...filtered.map((row) => [
        row.exam.title,
        row.exam.cluster?.name ?? "",
        row.phase,
        row.exam.type,
        row.exam.startTime,
        row.exam.endTime,
        row.assigned,
        row.participated,
        row.submitted,
        row.averageScore,
        row.violations,
      ]),
    ]);
    toast.success(`Exported ${filtered.length} exam records`);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:p-8">
      <ExamShieldHeader
        eyebrow="ExamShield reporting"
        title="Exam history & export"
        description="Review assessment outcomes, participation, performance, and integrity signals across every exam window."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Completed exams" value={completed} note="In the current result set" icon={<RiHistoryLine />} />
        <MetricCard label="Student attempts" value={participation} note="Participation across exams" icon={<RiTeamLine />} accent="sky" />
        <MetricCard label="Average score" value={`${averageScore}%`} note="Average across filtered exams" icon={<RiBarChartBoxLine />} accent="violet" />
        <MetricCard label="Violations" value={violations} note="Recorded integrity events" icon={<RiAlarmWarningLine />} accent="rose" />
      </div>

      <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><RiFilterLine className="text-teal-600" /><div><h2 className="text-[14px] font-extrabold">Report filters</h2><p className="text-[10px] text-muted-foreground">The export follows your current filters.</p></div></div>
          <button onClick={exportHistory} disabled={!filtered.length} className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-[12px] font-bold text-white disabled:opacity-40"><RiDownloadLine /> Export CSV ({filtered.length})</button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="relative"><RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exam or cluster" className="h-11 w-full rounded-xl border border-border bg-muted/30 pl-9 pr-3 text-[12px] outline-none focus:border-teal-500/50" /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-border bg-muted/30 px-3 text-[12px] font-bold outline-none focus:border-teal-500/50"><option value="ALL">All statuses</option><option value="COMPLETED">Completed</option><option value="LIVE">Live</option><option value="UPCOMING">Upcoming</option><option value="PENDING_APPROVAL">Pending approval</option><option value="REJECTED">Rejected</option></select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-11 rounded-xl border border-border bg-muted/30 px-3 text-[12px] outline-none focus:border-teal-500/50" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-11 rounded-xl border border-border bg-muted/30 px-3 text-[12px] outline-none focus:border-teal-500/50" />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm">
        <div className="border-b border-border px-5 py-4"><h2 className="text-[14px] font-extrabold">Assessment records</h2><p className="mt-1 text-[10px] text-muted-foreground">{filtered.length} exams match the current report.</p></div>
        {loading ? (
          <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-[12px] text-muted-foreground">No exam records match these filters.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((row) => (
              <article key={row.exam.id} className="grid gap-4 p-5 transition hover:bg-muted/15 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(90px,.55fr))] lg:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2"><ExamStatusBadge value={row.phase} /><span className="text-[10px] font-bold text-muted-foreground">{row.exam.type}</span></div>
                  <h3 className="text-[13px] font-extrabold">{row.exam.title}</h3>
                  <p className="mt-1 text-[10px] text-muted-foreground">{row.exam.cluster?.name ?? "No cluster"} · {formatExamDate(row.exam.startTime)}</p>
                </div>
                <ReportValue label="Participation" value={`${row.participated}/${row.assigned}`} />
                <ReportValue label="Submitted" value={row.submitted} />
                <ReportValue label="Average score" value={`${row.averageScore}%`} />
                <ReportValue label="Violations" value={row.violations} danger={row.violations > 0} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReportValue({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return <div className="rounded-xl bg-muted/30 px-3 py-2 lg:bg-transparent lg:p-0"><p className="text-[10px] font-bold text-muted-foreground">{label}</p><p className={`mt-1 text-[15px] font-black ${danger ? "text-rose-600" : "text-foreground"}`}>{value}</p></div>;
}
