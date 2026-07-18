"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  RiAlertLine, RiArrowDownSLine, RiArrowRightLine, RiBarChartBoxLine,
  RiCheckLine, RiCloseLine, RiFileList3Line, RiShieldCheckLine,
  RiTimeLine, RiTrophyLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, ExamShieldRoleNav, ExamStatusBadge } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { formatExamDate, proctorSignalLabel } from "@/lib/examShield";
import { cn } from "@/lib/utils";

type ResultAnswer = {
  id: string;
  prompt: string;
  marks: number;
  awardedMarks: number;
  isCorrect: boolean;
  textAnswer?: string | null;
  selectedOption?: { text: string } | null;
  correctOptions: Array<{ text: string }>;
  explanation?: string | null;
};

type PublishedResult = {
  exam: { id: string; title: string; type: string; endTime: string; answerSheetPublishedAt?: string | null; cluster?: { name: string } | null };
  attempt: { status: string; score: number; totalMarks: number; percentage: number; suspicious: boolean; suspiciousCount: number };
  statistics: { rank: number; participantCount: number };
  answerSheetAvailable: boolean;
  answerSheet: ResultAnswer[] | null;
  violationHistory: Array<{ id: string; type: string; occurredAt: string; metadata?: Record<string, unknown> | null }>;
};

export default function StudentPublishedResultsPage() {
  const [results, setResults] = useState<PublishedResult[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const assignments = (await examApi.studentList()).data ?? [];
        const publishedIds = assignments
          .filter((item: { exam: { resultsPublishedAt?: string | null; attempts?: Array<{ status: string }> } }) =>
            item.exam.resultsPublishedAt && item.exam.attempts?.[0]?.status !== "IN_PROGRESS",
          )
          .map((item: { exam: { id: string } }) => item.exam.id);
        const settled = await Promise.allSettled(publishedIds.map((id: string) => examApi.result(id)));
        setResults(settled.filter((item) => item.status === "fulfilled").map((item) => item.value.data as PublishedResult));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Could not load published results");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-5 lg:p-8">
      <ExamShieldHeader eyebrow="ExamShield outcomes" title="Published results & answer sheets" description="Review your official scores and compare your response with the correct answer. Attempts with integrity events display the recorded violation history instead." />
      <ExamShieldRoleNav role="student" />

      {loading ? <div className="h-48 animate-pulse rounded-2xl bg-muted" /> : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center"><RiTrophyLine className="mx-auto text-4xl text-muted-foreground/30" /><p className="mt-3 text-[13px] font-black">No results published yet</p><p className="mt-1 text-[11px] text-muted-foreground">Your teacher controls when each result becomes available.</p></div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => {
            const expanded = expandedId === result.exam.id;
            return (
              <article key={result.exam.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2"><ExamStatusBadge value="PUBLISHED" /><span className="text-[10px] font-bold text-muted-foreground">{result.exam.type}</span></div>
                      <h2 className="mt-3 text-[15px] font-black">{result.exam.title}</h2>
                      <p className="mt-1 text-[10px] text-muted-foreground">{result.exam.cluster?.name ?? "Assessment"} · {formatExamDate(result.exam.endTime)}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-xl text-teal-600"><RiBarChartBoxLine /></div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="Your score" value={`${result.attempt.score}/${result.attempt.totalMarks}`} />
                    <Stat label="Percentage" value={`${result.attempt.percentage}%`} accent />
                    <Stat label="Class rank" value={result.statistics.rank ? `#${result.statistics.rank}/${result.statistics.participantCount}` : "-"} />
                    <Stat label={result.attempt.suspicious ? "Integrity events" : "Answer sheet"} value={result.attempt.suspicious ? result.attempt.suspiciousCount : result.answerSheetAvailable ? "Published" : "Not released"} danger={result.attempt.suspicious} />
                  </div>

                  {result.attempt.suspicious && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-3">
                      <RiShieldCheckLine className="mt-0.5 shrink-0 text-rose-600" />
                      <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">Your answer sheet is hidden because {result.attempt.suspiciousCount} integrity events were recorded. Expand this result to review the complete violation history.</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => setExpandedId(expanded ? null : result.exam.id)} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-[11px] font-bold text-white sm:flex-none">
                      {result.attempt.suspicious ? "View violation history" : result.answerSheetAvailable ? "Compare answer sheets" : "View result status"}
                      <RiArrowDownSLine className={cn("transition", expanded && "rotate-180")} />
                    </button>
                    <Link href={`/dashboard/student/exams/results/${result.exam.id}`} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 text-[11px] font-bold sm:flex-none">Open full report <RiArrowRightLine /></Link>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-border bg-muted/10 p-5">
                    {result.attempt.suspicious ? (
                      <ViolationHistory events={result.violationHistory} />
                    ) : result.answerSheetAvailable && result.answerSheet ? (
                      <AnswerComparison answers={result.answerSheet} />
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center"><RiFileList3Line className="mx-auto text-3xl text-muted-foreground/30" /><p className="mt-3 text-[12px] font-black">Answer sheet not released</p><p className="mt-1 text-[10px] text-muted-foreground">The score is published, but your teacher has not published answer sheets yet.</p></div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = false, danger = false }: { label: string; value: string | number; accent?: boolean; danger?: boolean }) {
  return <div className={cn("rounded-xl p-3 text-center", danger ? "bg-rose-500/10" : accent ? "bg-teal-500/10" : "bg-muted/30")}><b className={cn("text-[13px]", danger ? "text-rose-600" : accent ? "text-teal-600" : "text-foreground")}>{value}</b><p className="text-[9px] text-muted-foreground">{label}</p></div>;
}

function AnswerComparison({ answers }: { answers: ResultAnswer[] }) {
  return (
    <div>
      <div className="mb-4"><h3 className="text-[14px] font-black">Student answer sheet vs correct answer sheet</h3><p className="mt-1 text-[10px] text-muted-foreground">Every submitted response is compared side by side with the correct answer or teacher guidance.</p></div>
      <div className="space-y-4">
        {answers.map((answer, index) => (
          <div key={answer.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4"><p className="text-[12px] font-black"><span className="mr-2 text-teal-600">{index + 1}.</span>{answer.prompt}</p><span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black", answer.isCorrect ? "bg-teal-500/10 text-teal-600" : "bg-rose-500/10 text-rose-600")}>{answer.isCorrect ? <RiCheckLine /> : <RiCloseLine />}{answer.awardedMarks}/{answer.marks}</span></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className={cn("rounded-xl border p-3", answer.isCorrect ? "border-teal-500/20 bg-teal-500/5" : "border-rose-500/20 bg-rose-500/5")}><p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Student answer</p><p className="mt-2 text-[11px] font-bold">{answer.selectedOption?.text || answer.textAnswer || "Not answered"}</p></div>
              <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-3"><p className="text-[9px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-300">Correct answer sheet</p><p className="mt-2 text-[11px] font-bold">{answer.correctOptions.map((option) => option.text).join(", ") || answer.explanation || "Teacher-graded response"}</p></div>
            </div>
            {answer.explanation && <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground"><strong className="text-foreground">Explanation:</strong> {answer.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ViolationHistory({ events }: { events: PublishedResult["violationHistory"] }) {
  return (
    <div>
      <div className="mb-4 flex gap-3"><RiAlertLine className="text-lg text-rose-600" /><div><h3 className="text-[14px] font-black text-rose-700 dark:text-rose-300">Recorded violation history</h3><p className="mt-1 text-[10px] text-muted-foreground">The answer sheet is replaced by this integrity record.</p></div></div>
      <div className="space-y-2">{events.map((event, index) => <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-card p-3"><p className="text-[11px] font-extrabold text-rose-600">{index + 1}. {proctorSignalLabel(event.type, event.metadata)}</p><p className="flex items-center gap-1 text-[9px] text-muted-foreground"><RiTimeLine /> {formatExamDate(event.occurredAt)}</p></div>)}</div>
    </div>
  );
}
