"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiEditLine, RiFileTextLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiCheckLine, RiAlertLine,
  RiSendPlaneLine, RiPauseCircleLine, RiStarLine, RiPriceTag3Line,
  RiShieldCheckLine, RiPercentLine, RiArrowRightLine, RiBookOpenLine,
  RiCheckboxCircleLine, RiLock2Line, RiLoader4Line, RiRefreshLine,
  RiTimeLine, RiThumbUpLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { courseApi } from "../../../../../../lib/api";
import { toast } from "sonner";
import type { Course, CourseMission } from "../../../../../../types/course.type";

function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.09) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-teal-500/[0.05] blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-500/[0.03] blur-[100px]" />
    </div>
  );
}

const fmtCurrency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const MISSION_STATUS_CFG = {
  DRAFT:            { label: "Draft",    badge: "text-muted-foreground bg-muted/40 border-border",                                                                        dot: "bg-muted-foreground/40" },
  PENDING_APPROVAL: { label: "Pending",  badge: "text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50",   dot: "bg-amber-500 animate-pulse" },
  PUBLISHED:        { label: "Published",badge: "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50",         dot: "bg-teal-500" },
  REJECTED:         { label: "Rejected", badge: "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50",               dot: "bg-red-500" },
};

const COURSE_STATUS_MAP: Record<string, string> = {
  DRAFT:            "text-muted-foreground bg-muted/40 border-border",
  PENDING_APPROVAL: "text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50",
  PUBLISHED:        "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50",
  CLOSED:           "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/50",
  REJECTED:         "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50",
};
const COURSE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending Approval", PUBLISHED: "Published", CLOSED: "Closed", REJECTED: "Rejected",
};

function MissionBadge({ status }: { status: string }) {
  const cfg = (MISSION_STATUS_CFG as any)[status] ?? MISSION_STATUS_CFG.DRAFT;
  return <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border", cfg.badge)}><span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />{cfg.label}</span>;
}

function InfoTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="relative flex flex-col gap-1.5 px-4 py-3.5 rounded-xl bg-muted/30 border border-border hover:border-teal-200/40 dark:hover:border-teal-800/40 transition-colors overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-teal-500/[0.02] pointer-events-none" />
      <div className={cn("flex items-center gap-1.5 relative z-10", accent ?? "text-teal-600 dark:text-teal-400")}>
        <span className="text-sm">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div className="text-[13.5px] font-bold text-foreground relative z-10">{value}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function CourseDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [course, setCourse] = useState<Course | null>(null);
  const [missions, setMissions] = useState<CourseMission[]>([]);
  const [enrollStats, setEnrollStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "missions" | "enrollments" | "earnings">("overview");
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [cRes, mRes, eRes] = await Promise.all([
        courseApi.get(id),
        courseApi.getMissions(id),
        courseApi.getEnrollmentStats(id),
      ]);
      setCourse(cRes.data);
      setMissions(mRes.data);
      setEnrollStats(eRes.data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await courseApi.submit(id);
      toast.success("Submitted for approval!", { position: "top-right" });
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleClose = async () => {
    if (!confirm("Close this course? Students keep access but no new enrollments or missions allowed.")) return;
    setClosing(true);
    try {
      await courseApi.close(id);
      toast.success("Course closed.", { position: "top-right" });
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setClosing(false); }
  };

  if (loading) {
    return (
      <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
        <AmbientBg />
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-6 w-40 rounded-full bg-muted/60" />
          <div className="h-8 w-2/3 rounded-xl bg-muted/60" />
          <div className="h-52 rounded-2xl bg-muted/40" />
          <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted/40" />)}</div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="relative flex flex-col items-center gap-4 p-10 max-w-xl mx-auto">
        <AmbientBg />
        <RiAlertLine className="text-4xl text-red-500" />
        <p className="text-[14px] font-bold text-foreground">{error ?? "Course not found"}</p>
        <button onClick={fetchAll} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">
          <RiRefreshLine /> Retry
        </button>
      </div>
    );
  }

  const canEdit = course.status === "DRAFT" || course.status === "REJECTED";
  const canSubmit = course.status === "DRAFT" || course.status === "REJECTED";
  const canClose = course.status === "PUBLISHED";
  const canAddMissions = course.status === "PUBLISHED";

  const TABS = [
    { key: "overview", label: "Overview", icon: <RiBookOpenLine /> },
    { key: "missions", label: "Missions", icon: <RiFileTextLine />, count: missions.length },
    { key: "enrollments", label: "Enrollments", icon: <RiGroupLine />, count: course._count?.enrollments },
    { key: "earnings", label: "Earnings", icon: <RiMoneyDollarCircleLine /> },
  ] as const;

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      <AmbientBg />

      {/* Back */}
      <div>
        <button onClick={() => router.push("/dashboard/teacher/courses")} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <RiArrowLeftLine /> My Courses
        </button>

        {/* Hero row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
              <span className={cn("px-3 py-1 rounded-full text-[12px] font-bold border", COURSE_STATUS_MAP[course.status] ?? COURSE_STATUS_MAP.DRAFT)}>
                {COURSE_STATUS_LABELS[course.status] ?? course.status}
              </span>
              {course.isFeatured && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  <RiStarLine className="text-xs" /> Featured
                </span>
              )}
            </div>
            <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-tight">{course.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {course.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-md bg-muted/50 border border-border text-[11px] font-semibold text-muted-foreground">{tag}</span>)}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button onClick={fetchAll} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Refresh">
              <RiRefreshLine className="text-sm" />
            </button>
            {canEdit && (
              <button onClick={() => router.push(`/dashboard/teacher/courses/${id}/edit`)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                <RiEditLine className="text-sm" /> Edit
              </button>
            )}
            {canSubmit && (
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[12.5px] font-bold transition-all disabled:opacity-60">
                {submitting ? <RiLoader4Line className="animate-spin text-sm" /> : <RiSendPlaneLine className="text-sm" />}
                {submitting ? "Submitting…" : "Submit for approval"}
              </button>
            )}
            {canClose && (
              <button onClick={handleClose} disabled={closing} className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-red-200/60 dark:border-red-800/50 bg-red-50/40 dark:bg-red-950/20 text-[12.5px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100/60 transition-all disabled:opacity-60">
                <RiPauseCircleLine className="text-sm" /> {closing ? "Closing…" : "Close course"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rejection */}
      {course.status === "REJECTED" && course.rejectedNote && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
          <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-bold text-red-600 dark:text-red-400">Course rejected by admin</p>
            <p className="text-[12.5px] text-red-600/80 dark:text-red-400/80 mt-0.5">{course.rejectedNote}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-border -mb-2">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-all -mb-px",
              activeTab === tab.key ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500" : "text-muted-foreground hover:text-foreground")}>
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
            {"count" in tab && tab.count !== undefined && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-5">
          {course.thumbnailUrl && (
            <div className="rounded-2xl overflow-hidden h-52 relative shadow-xl">
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoTile icon={<RiGroupLine />} label="Students" value={(course._count?.enrollments ?? 0).toLocaleString()} />
            <InfoTile icon={<RiFileTextLine />} label="Missions" value={course._count?.missions ?? 0} />
            <InfoTile icon={<RiPriceTag3Line />} label="Price" value={course.isFree ? "Free" : fmtCurrency(course.price)} />
            <InfoTile icon={<RiPercentLine />} label="Your cut" value={`${course.teacherRevenuePercent}%`} accent="text-amber-600 dark:text-amber-400" />
          </div>

          <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-6 py-5">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-3">About this course</p>
            <p className="text-[13.5px] text-foreground/80 leading-relaxed">{course.description || "No description added."}</p>
          </div>

          {!course.isFree && (
            <div className={cn("flex items-start gap-3 px-5 py-4 rounded-2xl border",
              course.priceApprovalStatus === "APPROVED" ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-800/50"
              : course.priceApprovalStatus === "REJECTED" ? "bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50"
              : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/50")}>
              <RiShieldCheckLine className={cn("text-lg mt-0.5 flex-shrink-0",
                course.priceApprovalStatus === "APPROVED" ? "text-teal-600 dark:text-teal-400"
                : course.priceApprovalStatus === "REJECTED" ? "text-red-500" : "text-amber-600 dark:text-amber-400")} />
              <div>
                <p className="text-[13px] font-bold text-foreground">
                  Price: {fmtCurrency(course.price)} · {course.priceApprovalStatus === "APPROVED" ? "Admin approved" : course.priceApprovalStatus === "REJECTED" ? "Request rejected" : "Awaiting admin approval"}
                </p>
                {course.priceApprovalNote && <p className="text-[12px] text-muted-foreground mt-0.5">{course.priceApprovalNote}</p>}
                <button onClick={() => router.push(`/dashboard/teacher/courses/${id}/price-requests`)} className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                  View price request history <RiArrowRightLine className="text-xs" />
                </button>
              </div>
            </div>
          )}

          {course.status === "CLOSED" && (
            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/50">
              <RiLock2Line className="text-blue-600 dark:text-blue-400 text-base mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-blue-700 dark:text-blue-300">Course is closed</p>
                <p className="text-[12px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">Existing students retain access. No new enrollments or missions can be added.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Missions ── */}
      {activeTab === "missions" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-foreground">{missions.length} missions</p>
            {canAddMissions && (
              <button onClick={() => router.push(`/dashboard/teacher/courses/${id}/missions`)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[12.5px] font-bold hover:bg-teal-700 transition-colors">
                <RiArrowRightLine className="text-xs" /> Manage missions
              </button>
            )}
          </div>
          {missions.length === 0
            ? <div className="rounded-2xl border border-border bg-card/80 py-12 flex flex-col items-center gap-3 text-center">
                <RiFileTextLine className="text-2xl text-muted-foreground/30" />
                <p className="text-[13.5px] font-bold text-muted-foreground">No missions yet</p>
                {canAddMissions && <button onClick={() => router.push(`/dashboard/teacher/courses/${id}/missions`)} className="text-[12.5px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">Add your first mission →</button>}
              </div>
            : missions.map((m, i) => (
                <div key={m.id} onClick={() => router.push(`/dashboard/teacher/courses/${id}/missions`)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-border bg-card/90 hover:border-teal-200/60 dark:hover:border-teal-800/50 hover:shadow-md hover:shadow-teal-500/5 transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-[12px] font-extrabold">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-foreground truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{m.title}</p>
                    {m.description && <p className="text-[12px] text-muted-foreground truncate">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11.5px] text-muted-foreground hidden sm:block">{m._count?.contents ?? 0} items</span>
                    <MissionBadge status={m.status} />
                    <RiArrowRightLine className="text-muted-foreground text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* ── Enrollments ── */}
      {activeTab === "enrollments" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { l: "Total enrolled", v: enrollStats?.total ?? course._count?.enrollments ?? 0, icon: <RiGroupLine />, a: "teal" },
              { l: "Total revenue", v: fmtCurrency(enrollStats?.totalRevenue ?? 0), icon: <RiMoneyDollarCircleLine />, a: "teal" },
              { l: "Your earnings", v: fmtCurrency(enrollStats?.teacherEarning ?? course.teacherEarning ?? 0), icon: <RiPercentLine />, a: "amber" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-border bg-card/90">
                <div className={cn("w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base border",
                  s.a === "amber" ? "bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400"
                  : "bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400")}>{s.icon}</div>
                <div>
                  <p className="text-[18px] font-extrabold text-foreground leading-none tabular-nums">{s.v}</p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">{s.l}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push(`/dashboard/teacher/courses/${id}/enrollments`)}
            className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-muted/30 text-[13px] font-semibold text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300/50 dark:hover:border-teal-700/50 transition-all group">
            View all enrollments <RiArrowRightLine className="text-xs group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* ── Earnings ── */}
      {activeTab === "earnings" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { l: "Revenue percent", v: `${course.teacherRevenuePercent}%`, note: "Admin-set", icon: <RiPercentLine />, a: "amber" },
              { l: "Platform cut", v: `${100 - course.teacherRevenuePercent}%`, note: "Retained by platform", icon: <RiShieldCheckLine />, a: "blue" },
              { l: "Total earned", v: fmtCurrency(course.teacherEarning ?? 0), note: "From this course", icon: <RiMoneyDollarCircleLine />, a: "teal" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-card/90">
                <div className={cn("w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base border",
                  s.a === "amber" ? "bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400"
                  : s.a === "blue" ? "bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400"
                  : "bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400")}>{s.icon}</div>
                <div>
                  <p className="text-[18px] font-extrabold text-foreground leading-none">{s.v}</p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">{s.l}</p>
                  <p className="text-[10.5px] text-muted-foreground/60">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/dashboard/teacher/courses/earnings")} className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-muted/30 text-[13px] font-semibold text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300/50 dark:hover:border-teal-700/50 transition-all group">
            Full earnings dashboard <RiArrowRightLine className="text-xs group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}