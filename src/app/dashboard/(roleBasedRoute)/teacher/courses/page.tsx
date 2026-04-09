"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiAddLine, RiSearchLine, RiBookOpenLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiCheckLine,
  RiAlertLine,
  RiArrowRightLine, RiEditLine, RiEyeLine, RiMoreLine,
  RiFileTextLine, RiStarLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { courseApi } from "../../../../../lib/api";
import type { Course, CourseStatus } from "../../../../../types/course.type";
import RefreshIcon from "@/components/shared/RefreshIcon";

// ─── Status Config ────────────────────────────────────────
const STATUS_CONFIG: Record<CourseStatus, { label: string; badge: string; dot: string }> = {
  DRAFT:            { label: "Draft",     badge: "text-muted-foreground bg-muted/50 border-border",                                                                       dot: "bg-muted-foreground/50" },
  PENDING_APPROVAL: { label: "Pending",   badge: "text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50",  dot: "bg-amber-500 animate-pulse" },
  PUBLISHED:        { label: "Published", badge: "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50",        dot: "bg-teal-500" },
  CLOSED:           { label: "Closed",    badge: "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/50",        dot: "bg-blue-500" },
  REJECTED:         { label: "Rejected",  badge: "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50",              dot: "bg-red-500" },
  FINISHED:         { label: "Finished",  badge: "text-purple-600 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/30 border-purple-200/60 dark:border-purple-800/50", dot: "bg-purple-500" },
};

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ─── Ambient Background ───────────────────────────────────
function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Dot grid */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(20,184,166,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
      {/* Glows */}
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-teal-400/[0.04] blur-[100px]" />
      <div className="absolute -bottom-60 left-1/3 w-[500px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[110px]" />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-40 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3 w-24 rounded-full bg-muted/60" />
        <div className="h-4 w-3/4 rounded-full bg-muted/60" />
        <div className="h-3 w-full rounded-full bg-muted/40" />
        <div className="h-px bg-border/60 my-1" />
        <div className="h-8 rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: CourseStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    // <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border", cfg.badge)}>
    //   <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
    //   {cfg.label}
    // </span>
    <div></div>
  );
}

// ─── Summary Card ─────────────────────────────────────────
function SummaryCard({ icon, label, value, accent, loading }: {
  icon: React.ReactNode; label: string; value: string | number;
  accent: "teal" | "amber" | "blue"; loading?: boolean;
}) {
  const clr = {
    teal:  "bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400",
    amber: "bg-amber-100/70 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400",
    blue:  "bg-blue-100/70 dark:bg-blue-950/50 border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-5 py-4 flex items-center gap-4 hover:border-teal-200/50 dark:hover:border-teal-800/40 transition-colors duration-200">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-teal-500/[0.02] pointer-events-none" />
      <div className={cn("w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg border z-10", clr[accent])}>
        {icon}
      </div>
      <div className="z-10">
        {loading ? <div className="h-6 w-16 rounded-lg bg-muted/60 animate-pulse mb-1" />
          : <p className="text-[22px] font-extrabold text-foreground leading-none tabular-nums">{value}</p>}
        <p className="text-[12px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────
function CourseCard({ course, onView, onEdit, onDelete }: {
  course: Course; onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={cn(
      "group relative rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden",
      "hover:border-teal-300/50 dark:hover:border-teal-700/40",
      "hover:shadow-2xl hover:shadow-teal-600/[0.07] dark:hover:shadow-teal-500/[0.1]",
      "transition-all duration-300 ease-out"
    )}>
      {/* Hover shimmer */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-10" />

      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-teal-950/80 via-slate-900 to-slate-950 overflow-hidden cursor-pointer" onClick={onView}>
        {course.thumbnailUrl
          ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-[1.03] transition-all duration-500 ease-out" />
          : (
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: "linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
              <RiBookOpenLine className="text-5xl text-teal-700/20 relative z-10" />
            </div>
          )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {/* Tags top-left */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {course.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10.5px] font-semibold text-white/80 border border-white/10">{tag}</span>
          ))}
        </div>

        {/* Featured */}
        {course.isFeatured && (
          <span className="absolute top-3 right-8 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-[10.5px] font-bold text-white">
            <RiStarLine className="text-xs" /> Featured
          </span>
        )}

        {/* Price */}
        <div className="absolute bottom-3 left-3">
          <span className={cn("px-2.5 py-1 rounded-lg text-[12px] font-extrabold backdrop-blur-sm border",
            course.isFree ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "bg-black/50 text-white border-white/20"
          )}>{course.isFree ? "Free" : fmtCurrency(course.price)}</span>
        </div>

        {/* Menu */}
        <div className="absolute top-2 right-2">
          <button onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60 transition-all">
            <RiMoreLine className="text-sm" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <button onClick={() => { setMenuOpen(false); onView(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-foreground hover:bg-muted/50 transition-colors">
                  <RiEyeLine className="text-muted-foreground" /> View details
                </button>
                {(course.status === "DRAFT" || course.status === "REJECTED") && (
                  <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-foreground hover:bg-muted/50 transition-colors">
                    <RiEditLine className="text-muted-foreground" /> Edit
                  </button>
                )}
                <div className="border-t border-border" />
                <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors">
                  Delete course
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <div>
          <StatusBadge status={course.status} />
          <h3 onClick={onView} className="text-[14px] font-extrabold text-foreground leading-snug mt-2 cursor-pointer group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">{course.title}</h3>
          {course.description && <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{course.description}</p>}
        </div>

        {course.status === "REJECTED" && course.rejectedNote && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/40">
            <RiAlertLine className="text-red-500 text-xs mt-0.5 flex-shrink-0" />
            <p className="text-[11.5px] text-red-600 dark:text-red-400 line-clamp-2">{course.rejectedNote}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />
              <span className="text-[12px] font-bold text-foreground">{course._count?.enrollments ?? 0}</span>
              <span className="text-[11px] text-muted-foreground">students</span>
            </span>
            <span className="flex items-center gap-1.5">
              <RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" />
              <span className="text-[12px] font-bold text-foreground">{course._count?.missions ?? 0}</span>
              <span className="text-[11px] text-muted-foreground">missions</span>
            </span>
          </div>
          {!course.isFree && (course.teacherEarning ?? 0) > 0 &&
            <span className="text-[11.5px] font-bold text-amber-600 dark:text-amber-400">{fmtCurrency(course.teacherEarning ?? 0)}</span>}
        </div>

        <button onClick={onView} className="w-full h-9 rounded-xl flex items-center justify-center gap-2 border border-border text-[12.5px] font-semibold text-muted-foreground bg-muted/20 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300/50 dark:hover:border-teal-700/50 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all duration-150 group/btn">
          View details <RiArrowRightLine className="text-xs group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function MyCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CourseStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const fetchCourses = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await courseApi.list(); setCourses(r.data); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    try {
      await fetch(`/api/teacher/courses/${id}`, { method: "DELETE", credentials: "include" });
      setCourses(p => p.filter(c => c.id !== id));
    } catch { alert("Failed to delete."); }
  };

  const TABS: { key: CourseStatus | "ALL"; label: string }[] = [
    { key: "ALL", label: "All" }, { key: "DRAFT", label: "Draft" },
    { key: "PENDING_APPROVAL", label: "Pending" }, { key: "PUBLISHED", label: "Published" },
    { key: "CLOSED", label: "Closed" }, { key: "REJECTED", label: "Rejected" },
  ];

  const filtered = courses.filter(c =>
    (activeTab === "ALL" || c.status === activeTab) &&
    (!search || c.title.toLowerCase().includes(search.toLowerCase()))
  );

  const totalStudents = courses.reduce((a, c) => a + (c._count?.enrollments ?? 0), 0);
  const totalEarned = courses.reduce((a, c) => a + (c.teacherEarning ?? 0), 0);

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-7xl mx-auto w-full min-h-screen">
      <AmbientBg />

      {/* Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Courses</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">My Courses</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">Create, manage and track all your courses in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshIcon onClick={fetchCourses} loading={loading} />
          <button onClick={() => router.push("/dashboard/teacher/courses/create")}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
            <RiAddLine /> New course
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
          <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
          <p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p>
          <button onClick={fetchCourses} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline flex-shrink-0">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={<RiBookOpenLine />} label="Total courses" value={courses.length} accent="teal" loading={loading} />
        <SummaryCard icon={<RiCheckLine />} label="Published" value={courses.filter(c => c.status === "PUBLISHED").length} accent="teal" loading={loading} />
        <SummaryCard icon={<RiGroupLine />} label="Total students" value={totalStudents.toLocaleString()} accent="blue" loading={loading} />
        <SummaryCard icon={<RiMoneyDollarCircleLine />} label="Total earned" value={fmtCurrency(totalEarned)} accent="amber" loading={loading} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-0.5 bg-muted/30 border border-border rounded-xl p-1 overflow-x-auto flex-shrink-0">
          {TABS.map(tab => {
            const count = tab.key === "ALL" ? courses.length : courses.filter(c => c.status === tab.key).length;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all whitespace-nowrap",
                  activeTab === tab.key ? "bg-teal-600 dark:bg-teal-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                {tab.label}
                {count > 0 && <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center", activeTab === tab.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>{count}</span>}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm pointer-events-none" />
          <input type="text" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
        </div>
      </div>

      {/* Grid */}
      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        : filtered.length === 0
          ? (
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm py-20 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-2xl text-muted-foreground/30"><RiBookOpenLine /></div>
              <div>
                <p className="text-[14px] font-bold text-muted-foreground">No courses found</p>
                <p className="text-[13px] text-muted-foreground/60 mt-1">Try a different filter or create your first course.</p>
              </div>
              <button onClick={() => router.push("/dashboard/teacher/courses/create")} className="flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">
                <RiAddLine /> Create course
              </button>
            </div>
          )
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(course => (
                <CourseCard key={course.id} course={course}
                  onView={() => router.push(`/dashboard/teacher/courses/${course.id}`)}
                  onEdit={() => router.push(`/dashboard/teacher/courses/${course.id}/edit`)}
                  onDelete={() => handleDelete(course.id)} />
              ))}
            </div>
          )
      }
    </div>
  );
}