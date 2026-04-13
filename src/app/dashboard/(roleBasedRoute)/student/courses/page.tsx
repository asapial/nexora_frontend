"use client";


import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiBookOpenLine, RiCheckLine, RiAlertLine,
  RiArrowRightLine,RiTrophyLine,
  RiCalendarLine, RiTimeLine
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { studentApi, paymentApi } from "../../../../../lib/api";
import { AmbientBg6 } from "@/components/backgrounds/AmbientBg";
import RefreshIcon from "@/components/shared/RefreshIcon";


const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function MyLearningPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"inprogress" | "completed">("inprogress");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await paymentApi.syncPendingPayments().catch(() => {});
      const r = await studentApi.getMyEnrollments();
      const raw = r.data as unknown;
      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown }).data)
          ? (raw as { data: unknown[] }).data
          : [];
      setEnrollments(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const inProgress = enrollments.filter(e => !e.completedAt && Number(e.progress ?? 0) < 100);
  const completed  = enrollments.filter(e => e.completedAt || Number(e.progress ?? 0) >= 100);

  // If everything landed under "Completed" (e.g. progress already 100%), don't leave the user on an empty "In Progress" tab.
  useEffect(() => {
    if (loading || enrollments.length === 0) return;
    if (inProgress.length === 0 && completed.length > 0) setActiveTab("completed");
  }, [loading, enrollments, inProgress.length, completed.length]);

  const EnrollCard = ({ e }: { e: any }) => {
    const course = e.course ?? {};
    const isDone = !!(e.completedAt || (e.progress ?? 0) >= 100);
    const pct = e.progress ?? 0;
    return (
      <div onClick={() => router.push(`/dashboard/student/courses/${course.id ?? e.courseId}`)}
        className={cn(
          "group relative rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden cursor-pointer",
          "hover:border-teal-300/50 dark:hover:border-teal-700/40",
          "hover:shadow-2xl hover:shadow-teal-600/[0.07] transition-all duration-300"
        )}>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Thumbnail */}
        <div className="relative h-36 bg-gradient-to-br from-teal-950/80 via-slate-900 to-slate-950 overflow-hidden">
          {course.thumbnailUrl
            ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-[1.03] transition-all duration-500 ease-out" />
            : <div className="w-full h-full flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
                <RiBookOpenLine className="text-4xl text-teal-700/20 relative z-10" />
              </div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {/* Progress bar on thumbnail */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div className={cn("h-full transition-all duration-700", isDone ? "bg-gradient-to-r from-teal-400 to-teal-500" : "bg-teal-500")} style={{ width: `${pct}%` }} />
          </div>
          {isDone && <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/90 text-[11px] font-bold text-white"><RiCheckLine className="text-xs" />Complete</span>}
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">
          <div>
            <h3 className="text-[14px] font-extrabold text-foreground leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{course.title ?? "Unknown course"}</h3>
            {e.enrolledAt && <p className="text-[11.5px] text-muted-foreground mt-0.5 flex items-center gap-1"><RiCalendarLine className="text-xs" />Enrolled {fmtDate(e.enrolledAt)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Progress</span>
              <span className={cn("text-[12px] font-extrabold", isDone ? "text-teal-600 dark:text-teal-400" : "text-foreground")}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-700", isDone ? "bg-gradient-to-r from-teal-600 to-teal-400" : "bg-gradient-to-r from-teal-600/80 to-teal-400/80")} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className={cn(
            "w-full h-9 rounded-xl flex items-center justify-center gap-2 border text-[12.5px] font-semibold transition-all",
            isDone
              ? "bg-teal-50/50 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 dark:group-hover:bg-teal-500 dark:group-hover:border-teal-500"
              : "bg-muted/20 border-border text-muted-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-300/50 dark:group-hover:border-teal-700/50 group-hover:bg-teal-50/30 dark:group-hover:bg-teal-950/20"
          )}>
            {isDone ? "Review course" : "Continue learning"} <RiArrowRightLine className="text-xs group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    );
  };

  const list = activeTab === "inprogress" ? inProgress : completed;

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-5xl mx-auto w-full min-h-screen">

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1"><RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" /><span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">My Learning</span></div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">My Courses</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">Continue where you left off. Track your progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshIcon onClick={load} loading={loading} />
          <button onClick={() => router.push("/courses")} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"><RiBookOpenLine className="text-sm" />Browse courses</button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <RiBookOpenLine />, l: "Enrolled", v: enrollments.length, a: "teal" },
            { icon: <RiTimeLine />, l: "In progress", v: inProgress.length, a: "blue" },
            { icon: <RiTrophyLine />, l: "Completed", v: completed.length, a: "amber" },
          ].map((s, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-4 py-3.5 flex items-center gap-3">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-teal-500/[0.02] pointer-events-none" />
              <div className={cn("w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base border z-10",
                s.a === "amber" ? "bg-amber-100/70 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400"
                : s.a === "blue" ? "bg-blue-100/70 dark:bg-blue-950/50 border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400"
                : "bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400"
              )}>{s.icon}</div>
              <div className="z-10"><p className="text-[20px] font-extrabold text-foreground leading-none tabular-nums">{s.v}</p><p className="text-[12px] text-muted-foreground mt-0.5">{s.l}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-0.5 bg-muted/30 border border-border rounded-xl p-1 w-fit">
        {[{ k: "inprogress", l: `In Progress (${inProgress.length})` }, { k: "completed", l: `Completed (${completed.length})` }].map(tab => (
          <button key={tab.k} onClick={() => setActiveTab(tab.k as any)}
            className={cn("px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all whitespace-nowrap",
              activeTab === tab.k ? "bg-teal-600 dark:bg-teal-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            {tab.l}
          </button>
        ))}
      </div>

      {error && <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" /><p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p><button onClick={load} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline">Retry</button></div>}

      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-muted/40" />)}</div>
        : list.length === 0
          ? <div className="rounded-2xl border border-border bg-card/80 py-20 flex flex-col items-center gap-4 text-center">
              {activeTab === "inprogress" ? <RiTimeLine className="text-4xl text-muted-foreground/30" /> : <RiTrophyLine className="text-4xl text-muted-foreground/30" />}
              <p className="text-[14px] font-bold text-muted-foreground">{activeTab === "inprogress" ? "No courses in progress" : "No completed courses yet"}</p>
              <button onClick={() => router.push("/courses")} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors"><RiBookOpenLine className="text-sm" />Browse courses</button>
            </div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{list.map(e => <EnrollCard key={e.id} e={e} />)}</div>
      }
    </div>
  );
}
