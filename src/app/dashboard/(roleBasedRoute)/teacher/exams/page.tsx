"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RiAddLine, RiAlarmWarningLine, RiHistoryLine, RiLiveLine, RiQuestionLine, RiTeamLine, RiTimeLine } from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, ExamStatusBadge, MetricCard } from "@/components/examshield/ExamShieldUI";
import { examApi } from "@/lib/api";
import { ExamSummary, examPhase, formatExamDate } from "@/lib/examShield";

const workspaces = [
  {
    title: "Creation studio",
    description: "Build a polished exam with guided scheduling, question design, and approval readiness.",
    href: "/dashboard/teacher/exams/create",
    icon: <RiAddLine />,
    accent: "from-teal-500/15 to-emerald-500/5 text-teal-600",
  },
  {
    title: "Live proctoring",
    description: "Monitor active attempts, suspicious behavior, fullscreen exits, and integrity events.",
    href: "/dashboard/teacher/exams/proctoring",
    icon: <RiLiveLine />,
    accent: "from-rose-500/15 to-orange-500/5 text-rose-600",
  },
  {
    title: "Exam history",
    description: "Review completed exams, participation, performance, violations, and export reports.",
    href: "/dashboard/teacher/exams/history",
    icon: <RiHistoryLine />,
    accent: "from-violet-500/15 to-sky-500/5 text-violet-600",
  },
];

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examApi.teacherList()
      .then((response) => setExams(response.data as ExamSummary[]))
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not load exams"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    live: exams.filter((exam) => examPhase(exam) === "LIVE").length,
    upcoming: exams.filter((exam) => examPhase(exam) === "UPCOMING").length,
    pending: exams.filter((exam) => exam.status === "PENDING_APPROVAL").length,
    students: exams.reduce((sum, exam) => sum + exam._count.assignments, 0),
  }), [exams]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 p-5 lg:p-8">
      <ExamShieldHeader
        eyebrow="ExamShield command center"
        title="Secure exams, without the operational noise."
        description="Create, supervise, and review every proctored assessment from focused workspaces designed for the job at hand."
        action={{ label: "Create new exam", href: "/dashboard/teacher/exams/create" }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Live now" value={stats.live} note="Active exam windows" icon={<RiLiveLine />} accent="rose" />
        <MetricCard label="Upcoming" value={stats.upcoming} note="Approved and scheduled" icon={<RiTimeLine />} accent="violet" />
        <MetricCard label="Awaiting approval" value={stats.pending} note="In the admin review queue" icon={<RiQuestionLine />} accent="sky" />
        <MetricCard label="Student assignments" value={stats.students} note="Across all exams" icon={<RiTeamLine />} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {workspaces.map((item) => (
          <Link key={item.title} href={item.href} className="group rounded-2xl border border-border bg-card/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-xl">
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-xl ${item.accent}`}>{item.icon}</div>
            <h2 className="text-[15px] font-extrabold text-foreground">{item.title}</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{item.description}</p>
            <p className="mt-5 text-[12px] font-bold text-teal-600 transition group-hover:translate-x-1">Open workspace →</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-extrabold">Recent exams</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">Your latest assessment activity and approval state.</p>
          </div>
          <Link href="/dashboard/teacher/exams/history" className="text-[12px] font-bold text-teal-600">View full history</Link>
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : exams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
            <RiAlarmWarningLine className="mx-auto mb-3 text-2xl text-muted-foreground" />
            <p className="text-[13px] font-bold">No exams yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Create your first proctored assessment to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {exams.slice(0, 6).map((exam) => (
              <div key={exam.id} className="rounded-xl border border-border bg-muted/15 p-4">
                <div className="mb-3 flex items-start justify-between gap-2"><ExamStatusBadge value={examPhase(exam)} /><span className="text-[10px] font-bold text-muted-foreground">{exam.type}</span></div>
                <h3 className="line-clamp-2 text-[13px] font-extrabold">{exam.title}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">{exam.cluster?.name ?? "No cluster"}</p>
                <p className="mt-4 text-[10px] text-muted-foreground">{formatExamDate(exam.startTime)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
