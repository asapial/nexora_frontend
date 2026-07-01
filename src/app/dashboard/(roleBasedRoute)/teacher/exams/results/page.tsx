"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiAlertLine,
  RiArrowDownSLine,
  RiCheckboxCircleLine,
  RiFileList3Line,
  RiLoader4Line,
  RiMailCheckLine,
  RiMailSendLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiUserLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, ExamStatusBadge, MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { ExamDetail, ExamSummary, examPhase, formatExamDate } from "@/lib/examShield";

type ResultRow = { summary: ExamSummary; detail: ExamDetail };

export default function TeacherExamResultsPage() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const summaries = (await examApi.teacherList()).data as ExamSummary[];
      const completed = summaries.filter((exam) => examPhase(exam) === "COMPLETED");
      const details = await Promise.all(completed.map((exam) => examApi.teacherDetail(exam.id)));
      setRows(completed.map((summary, index) => ({ summary, detail: details[index]!.data as ExamDetail })));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not load completed exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updatePublication = async (exam: ExamSummary, body: { resultsPublished?: boolean; answerSheetPublished?: boolean; }) => {
    setBusy(`${exam.id}:publish`);
    try {
      await examApi.publishResults(exam.id, body);
      toast.success("Publication settings updated");
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not update publication");
    } finally {
      setBusy("");
    }
  };

  const emailResults = async (exam: ExamSummary) => {
    setBusy(`${exam.id}:email`);
    try {
      const response = await examApi.emailResults(exam.id);
      toast.success(`Sent ${response.data.sent} result emails${response.data.failed ? `, ${response.data.failed} failed` : ""}`);
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not send result emails");
    } finally {
      setBusy("");
    }
  };

  const emailStudentResult = async (exam: ExamSummary, attemptId: string, studentName: string) => {
    setBusy(`${exam.id}:student:${attemptId}`);
    try {
      await examApi.emailStudentResult(exam.id, attemptId);
      toast.success(`Result email sent to ${studentName}`);
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not send student result email");
    } finally {
      setBusy("");
    }
  };

  const totals = useMemo(() => ({
    published: rows.filter(({ summary }) => summary.resultsPublishedAt).length,
    sheets: rows.filter(({ summary }) => summary.answerSheetPublishedAt).length,
    attempts: rows.reduce((sum, row) => sum + row.detail.attempts.filter((attempt) => attempt.status !== "IN_PROGRESS").length, 0),
    flagged: rows.reduce((sum, row) => sum + row.detail.attempts.filter((attempt) => attempt.suspicious).length, 0),
  }), [rows]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:p-8">
      <ExamShieldHeader eyebrow="ExamShield outcomes" title="Publish results & answer sheets" description="Release scores and answer sheets independently, then email every submitted student together or deliver a result to one student at a time. Flagged students receive their violation history instead of an answer sheet." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Results published" value={totals.published} note="Visible to students" icon={<RiCheckboxCircleLine />} />
        <MetricCard label="Sheets published" value={totals.sheets} note="For clean attempts" icon={<RiFileList3Line />} accent="violet" />
        <MetricCard label="Submitted attempts" value={totals.attempts} note="Eligible for publication" icon={<RiTeamLine />} accent="sky" />
        <MetricCard label="Flagged attempts" value={totals.flagged} note="Violation history shown" icon={<RiShieldCheckLine />} accent="rose" />
      </div>

      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-muted" /> : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-[12px] text-muted-foreground">Completed exams will appear here.</div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ summary, detail }) => {
            const attempts = detail.attempts.filter((attempt) => attempt.status !== "IN_PROGRESS");
            const flagged = attempts.filter((attempt) => attempt.suspicious).length;
            const scores = attempts.map((attempt) => attempt.percentage ?? 0);
            const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
            return (
              <article key={summary.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><div className="flex gap-2"><ExamStatusBadge value="COMPLETED" /><span className="text-[10px] font-bold text-muted-foreground">{summary.type}</span></div><h2 className="mt-3 text-[15px] font-black">{summary.title}</h2><p className="mt-1 text-[10px] text-muted-foreground">{summary.cluster?.name} · ended {formatExamDate(summary.endTime)}</p></div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-muted/30 px-3 py-2"><b>{attempts.length}</b><p className="text-[9px] text-muted-foreground">submitted</p></div>
                    <div className="rounded-xl bg-muted/30 px-3 py-2"><b>{average}%</b><p className="text-[9px] text-muted-foreground">average</p></div>
                    <div className="rounded-xl bg-rose-500/10 px-3 py-2"><b className="text-rose-600">{flagged}</b><p className="text-[9px] text-muted-foreground">flagged</p></div>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  <button disabled={busy.startsWith(summary.id)} onClick={() => updatePublication(summary, { resultsPublished: !summary.resultsPublishedAt, answerSheetPublished: summary.resultsPublishedAt ? undefined : false })} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 text-[11px] font-bold text-teal-700 disabled:opacity-50 dark:text-teal-300">
                    {busy === `${summary.id}:publish` && <RiLoader4Line className="animate-spin" />}{summary.resultsPublishedAt ? "Unpublish results" : "Publish results"}
                  </button>
                  <button disabled={!summary.resultsPublishedAt || busy.startsWith(summary.id)} onClick={() => updatePublication(summary, { answerSheetPublished: !summary.answerSheetPublishedAt })} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 text-[11px] font-bold text-violet-700 disabled:opacity-40 dark:text-violet-300">
                    <RiFileList3Line /> {summary.answerSheetPublishedAt ? "Hide answer sheets" : "Publish answer sheets"}
                  </button>
                  <button disabled={!summary.resultsPublishedAt || busy.startsWith(summary.id) || !attempts.length} onClick={() => emailResults(summary)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 text-[11px] font-bold text-white shadow-lg shadow-teal-600/20 disabled:opacity-40">
                    {busy === `${summary.id}:email` ? <RiLoader4Line className="animate-spin" /> : <RiMailSendLine />} Email results {summary.answerSheetPublishedAt ? "with sheets" : ""}
                  </button>
                </div>
                {summary.resultEmailsSentAt && <p className="mt-3 text-[10px] text-muted-foreground">Last emailed {formatExamDate(summary.resultEmailsSentAt)}</p>}
                <details className="group mt-5 overflow-hidden rounded-xl border border-border bg-muted/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600"><RiUserLine /></div>
                      <div>
                        <p className="text-[11px] font-extrabold">Individual student delivery</p>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">Send or resend a professional result email to a selected student.</p>
                      </div>
                    </div>
                    <RiArrowDownSLine className="text-lg text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-border p-3">
                    {!summary.resultsPublishedAt && (
                      <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        <RiAlertLine /> Publish results before sending student emails.
                      </div>
                    )}
                    <div className="space-y-2">
                      {attempts.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[10px] text-muted-foreground">
                          No submitted student attempts are available for email delivery.
                        </div>
                      )}
                      {attempts.map((attempt) => {
                        const studentBusy = busy === `${summary.id}:student:${attempt.id}`;
                        return (
                          <div key={attempt.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-[11px] font-black text-teal-600">
                              {attempt.user.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-[11px] font-extrabold">{attempt.user.name}</p>
                                {attempt.suspicious && <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-rose-600">Flagged</span>}
                              </div>
                              <p className="truncate text-[9px] text-muted-foreground">{attempt.user.email} | {attempt.percentage ?? 0}%</p>
                              <p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                                {attempt.resultEmailSentAt ? <><RiMailCheckLine className="text-teal-600" /> Last sent {formatExamDate(attempt.resultEmailSentAt)}</> : "Not emailed yet"}
                              </p>
                            </div>
                            <button
                              disabled={!summary.resultsPublishedAt || busy.startsWith(summary.id)}
                              onClick={() => emailStudentResult(summary, attempt.id, attempt.user.name)}
                              className="inline-flex h-9 items-center gap-2 rounded-lg border border-teal-500/25 bg-teal-500/10 px-3 text-[10px] font-extrabold text-teal-700 hover:bg-teal-500/15 disabled:cursor-not-allowed disabled:opacity-40 dark:text-teal-300"
                            >
                              {studentBusy ? <RiLoader4Line className="animate-spin" /> : <RiMailSendLine />}
                              {attempt.resultEmailSentAt ? "Resend result" : "Send result"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
