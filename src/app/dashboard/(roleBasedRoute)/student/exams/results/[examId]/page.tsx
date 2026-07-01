"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RiAlertLine, RiArrowLeftLine, RiBarChartBoxLine, RiCheckLine, RiFileList3Line, RiShieldCheckLine, RiTimeLine, RiTrophyLine } from "react-icons/ri";
import { toast } from "sonner";
import { MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { formatExamDate } from "@/lib/examShield";
import { cn } from "@/lib/utils";

type Result = {
  exam: { title: string; cluster?: { name: string } | null; resultsPublishedAt: string };
  attempt: { status: string; startedAt: string; submittedAt?: string | null; score: number; totalMarks: number; percentage: number; suspicious: boolean; suspiciousCount: number };
  statistics: { highestPercentage: number; lowestPercentage: number; highestScore: number; lowestScore: number; averagePercentage: number; rank: number; participantCount: number };
  answerSheetAvailable: boolean;
  answerSheet: Array<{ id: string; prompt: string; marks: number; awardedMarks: number; isCorrect: boolean; textAnswer?: string | null; selectedOption?: { text: string } | null; correctOptions: Array<{ text: string }>; explanation?: string | null }> | null;
  violationHistory: Array<{ id: string; type: string; occurredAt: string }>;
};

export default function StudentResultDetailPage() {
  const { examId } = useParams<{ examId: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { examApi.result(examId).then((response) => setResult(response.data as Result)).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not load result")).finally(() => setLoading(false)); }, [examId]);
  if (loading) return <div className="mx-auto max-w-6xl p-8"><div className="h-60 animate-pulse rounded-3xl bg-muted" /></div>;
  if (!result) return <div className="mx-auto max-w-xl p-8 text-center"><RiAlertLine className="mx-auto text-4xl text-amber-500" /><h1 className="mt-4 font-black">Result is not available</h1><Link href="/dashboard/student/exams/results" className="mt-5 inline-block text-sm font-bold text-teal-600">Back to published results</Link></div>;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:p-8">
      <Link href="/dashboard/student/exams/results" className="inline-flex w-fit items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-teal-600"><RiArrowLeftLine /> Published results</Link>
      <header className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/15 via-card to-card p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><div className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Official ExamShield result</div><h1 className="mt-3 text-2xl font-black sm:text-3xl">{result.exam.title}</h1><p className="mt-2 text-[11px] text-muted-foreground">{result.exam.cluster?.name ?? "Assessment"} · published {formatExamDate(result.exam.resultsPublishedAt)}</p></div><div className="rounded-2xl border border-teal-500/20 bg-card/80 px-6 py-4 text-center"><p className="text-3xl font-black text-teal-600">{result.attempt.percentage}%</p><p className="text-[10px] font-bold text-muted-foreground">Final percentage</p></div></div></header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5"><MetricCard label="Your score" value={`${result.attempt.score}/${result.attempt.totalMarks}`} note={result.attempt.status.replaceAll("_", " ")} icon={<RiCheckLine />} /><MetricCard label="Your rank" value={result.statistics.rank ? `#${result.statistics.rank}` : "-"} note={`Among ${result.statistics.participantCount}`} icon={<RiTrophyLine />} accent="violet" /><MetricCard label="Highest mark" value={result.statistics.highestScore} note={`${result.statistics.highestPercentage}% top score`} icon={<RiBarChartBoxLine />} accent="sky" /><MetricCard label="Average mark" value={`${result.statistics.averagePercentage}%`} note="Class average" icon={<RiBarChartBoxLine />} /><MetricCard label="Lowest mark" value={result.statistics.lowestScore} note={`${result.statistics.lowestPercentage}% lowest score`} icon={<RiBarChartBoxLine />} accent="rose" /></div>
      <section className="rounded-2xl border border-border bg-card p-5"><div className="grid gap-3 text-[11px] text-muted-foreground sm:grid-cols-3"><p><strong className="text-foreground">Started:</strong> {formatExamDate(result.attempt.startedAt)}</p><p><strong className="text-foreground">Submitted:</strong> {result.attempt.submittedAt ? formatExamDate(result.attempt.submittedAt) : "-"}</p><p><strong className="text-foreground">Integrity events:</strong> {result.attempt.suspiciousCount}</p></div></section>
      {result.attempt.suspicious ? (
        <section className="rounded-3xl border border-rose-500/25 bg-rose-500/5 p-5 sm:p-7"><div className="flex gap-3"><RiShieldCheckLine className="text-2xl text-rose-600" /><div><h2 className="text-[16px] font-black text-rose-700 dark:text-rose-300">Integrity review history</h2><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Because violations were recorded, your answer sheet is replaced by the complete recorded violation history.</p></div></div><div className="mt-5 space-y-3">{result.violationHistory.map((event) => <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-card p-4"><p className="text-[12px] font-extrabold text-rose-600">{event.type.replaceAll("_", " ")}</p><p className="flex items-center gap-1 text-[10px] text-muted-foreground"><RiTimeLine /> {formatExamDate(event.occurredAt)}</p></div>)}</div></section>
      ) : result.answerSheetAvailable && result.answerSheet ? (
        <section><div className="mb-4 flex items-center gap-2"><RiFileList3Line className="text-teal-600" /><div><h2 className="text-[16px] font-black">Student answer sheet vs correct answer sheet</h2><p className="text-[10px] text-muted-foreground">Your submitted responses are compared side by side with the correct answer.</p></div></div><div className="space-y-4">{result.answerSheet.map((answer, index) => <article key={answer.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><h3 className="text-[13px] font-black"><span className="mr-2 text-teal-600">{index + 1}.</span>{answer.prompt}</h3><span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black", answer.isCorrect ? "bg-teal-500/10 text-teal-600" : "bg-rose-500/10 text-rose-600")}>{answer.isCorrect ? "Correct" : "Incorrect"} · {answer.awardedMarks}/{answer.marks}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div className={cn("rounded-xl border p-3", answer.isCorrect ? "border-teal-500/20 bg-teal-500/5" : "border-rose-500/20 bg-rose-500/5")}><p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Student answer sheet</p><p className="mt-2 text-[11px] font-bold">{answer.selectedOption?.text || answer.textAnswer || "Not answered"}</p></div><div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-3"><p className="text-[9px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-300">Correct answer sheet</p><p className="mt-2 text-[11px] font-bold">{answer.correctOptions.map((option) => option.text).join(", ") || answer.explanation || "Teacher-graded response"}</p></div></div>{answer.explanation && <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground"><strong>Explanation:</strong> {answer.explanation}</p>}</article>)}</div></section>
      ) : <section className="rounded-2xl border border-dashed border-border p-8 text-center"><RiFileList3Line className="mx-auto text-3xl text-muted-foreground/30" /><p className="mt-3 text-[13px] font-black">Answer sheet not published</p><p className="mt-1 text-[11px] text-muted-foreground">Your teacher published the score but has not released answer sheets yet.</p></section>}
    </div>
  );
}
