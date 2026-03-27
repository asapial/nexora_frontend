"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiSearchLine, RiRefreshLine, RiBookOpenLine, RiGroupLine,
  RiStarFill, RiStarLine, RiFileTextLine, RiMoneyDollarCircleLine, RiLoader4Line,
  RiCheckLine, RiCloseLine, RiAlertLine, RiFilterLine, RiDeleteBinLine,
  RiEditLine, RiShieldCheckLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "../../../../../lib/api";
import { toast } from "sonner";

const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

type CourseStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "REJECTED";

const STATUS_MAP: Record<CourseStatus, string> = {
  DRAFT:            "text-muted-foreground bg-muted/40 border-border",
  PENDING_APPROVAL: "text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60",
  PUBLISHED:        "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60",
  CLOSED:           "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60",
  REJECTED:         "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60",
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending", PUBLISHED: "Published", CLOSED: "Closed", REJECTED: "Rejected",
};

// ─── Revenue Percent Edit Inline ─────────────────────────────
function RevenueInput({ courseId, current, onUpdated }: { courseId: string; current: number; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String(current));
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0 || n > 100) { toast.error("Revenue % must be 0–100"); return; }
    setSaving(true);
    try { await adminApi.setRevenuePercent(courseId, n); toast.success("Revenue % updated"); setEditing(false); onUpdated(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  if (!editing) return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[12px] font-bold text-violet-600 dark:text-violet-400 hover:underline">
      {current}% <RiEditLine className="text-xs" />
    </button>
  );
  return (
    <div className="flex items-center gap-1.5">
      <input type="number" min="0" max="100" value={val} onChange={e => setVal(e.target.value)}
        className="w-16 h-7 px-2 rounded-lg text-[12px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
      <button onClick={save} disabled={saving} className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-600 text-white text-xs disabled:opacity-60">
        {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
      </button>
      <button onClick={() => setEditing(false)} className="w-7 h-7 rounded-lg flex items-center justify-center border border-border text-muted-foreground text-xs hover:bg-muted/50">
        <RiCloseLine />
      </button>
    </div>
  );
}

// ─── Course Row Card ──────────────────────────────────────────
function CourseRow({ course, onRefresh }: { course: any; onRefresh: () => void }) {
  const router = useRouter();
  const [toggling, setToggling]   = useState(false);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const toggleFeatured = async () => {
    setToggling(true);
    try { await adminApi.toggleFeatured(course.id); toast.success("Featured toggled"); onRefresh(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setToggling(false); }
  };

  const approve = async () => {
    setApproving(true);
    try { await adminApi.approveCourse(course.id); toast.success("Approved!"); onRefresh(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setApproving(false); }
  };

  const deleteCourse = async () => {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await adminApi.deleteCourse(course.id); toast.success("Deleted"); onRefresh(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setDeleting(false); }
  };

  const statusCls = STATUS_MAP[course.status as CourseStatus] ?? STATUS_MAP.DRAFT;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 hover:bg-muted/15 transition-colors border-b border-border/60 last:border-0">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-teal-950/80 via-slate-900 to-slate-950 border border-border">
        {course.thumbnailUrl
          ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><RiBookOpenLine className="text-xl text-teal-700/30" /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-[13.5px] font-bold text-foreground truncate">{course.title}</p>
          <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", statusCls)}>
            {STATUS_LABELS[course.status] ?? course.status}
          </span>
          {course.isFeatured && <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400"><RiStarFill className="text-xs" />Featured</span>}
        </div>
        <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground flex-wrap">
          {course.teacher?.user && <span>{course.teacher.user.name}</span>}
          <span className="flex items-center gap-1"><RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />{course._count?.enrollments ?? 0} students</span>
          <span className="flex items-center gap-1"><RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" />{course._count?.missions ?? 0} missions</span>
          <span>{course.isFree ? "Free" : fmtUSD(course.price)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-muted-foreground/70">Revenue %:</span>
          <RevenueInput courseId={course.id} current={course.teacherRevenuePercent ?? 70} onUpdated={onRefresh} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
        <button onClick={() => router.push(`/dashboard/admin/courses/${course.id}`)}
          title="View detail"
          className="h-8 px-3 rounded-lg border border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
          Detail
        </button>
        {course.status === "PENDING_APPROVAL" && (
          <button onClick={approve} disabled={approving}
            className="h-8 px-3 rounded-lg border border-teal-300/60 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 text-[12px] font-semibold hover:bg-teal-100/60 transition-all disabled:opacity-60 flex items-center gap-1">
            {approving ? <RiLoader4Line className="animate-spin text-xs" /> : <RiCheckLine className="text-xs" />} Approve
          </button>
        )}
        <button onClick={toggleFeatured} disabled={toggling}
          title={course.isFeatured ? "Unfeature" : "Feature"}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all disabled:opacity-50">
          {toggling ? <RiLoader4Line className="text-xs animate-spin" /> : <RiStarLine className="text-xs" />}
        </button>
        <button onClick={deleteCourse} disabled={deleting}
          title="Delete"
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50">
          {deleting ? <RiLoader4Line className="text-xs animate-spin" /> : <RiDeleteBinLine className="text-xs" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function AdminCoursesPage() {
  const [courses,    setCourses]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterSt,   setFilterSt]   = useState("all");
  const [filterFeat, setFilterFeat] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p: any = {};
      if (filterSt !== "all") p.status = filterSt;
      if (filterFeat) p.featured = "true";
      const r = await adminApi.getAllCourses(p);
      setCourses(Array.isArray(r.data) ? r.data : (r.data as any).data ?? []);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, [filterSt, filterFeat]);

  useEffect(() => { load(); }, [load]);

  const filtered = courses.filter(c =>
    !search.trim() || c.title?.toLowerCase().includes(search.toLowerCase()) || c.teacher?.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount   = courses.filter(c => c.status === "PENDING_APPROVAL").length;
  const publishedCount = courses.filter(c => c.status === "PUBLISHED").length;

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">All Courses</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Manage and moderate all platform courses</p>
          </div>
          <button onClick={load} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex-shrink-0">
            <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <RiBookOpenLine />, l: "Total",     v: courses.length,    cls: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/40" },
          { icon: <RiAlertLine />,   l: "Pending",   v: pendingCount,      cls: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40" },
          { icon: <RiCheckLine />,   l: "Published", v: publishedCount,    cls: "text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40" },
          { icon: <RiStarFill />,    l: "Featured",  v: courses.filter(c => c.isFeatured).length, cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/40" },
        ].map(s => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", s.cls)}>{s.icon}</div>
            <p className="text-[1.4rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{s.v}</p>
            <p className="text-[12px] font-medium text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or teacher…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "PENDING_APPROVAL", "PUBLISHED", "DRAFT", "REJECTED", "CLOSED"] as const).map(st => (
            <button key={st} onClick={() => setFilterSt(st)}
              className={cn("h-8 px-3 rounded-xl text-[12px] font-semibold border transition-all",
                filterSt === st ? "bg-teal-600 text-white border-teal-600" : "border-border text-muted-foreground hover:bg-muted/40")}>
              {st === "all" ? "All statuses" : STATUS_LABELS[st] ?? st}
            </button>
          ))}
          <button onClick={() => setFilterFeat(p => !p)}
            className={cn("h-8 px-3 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-1",
              filterFeat ? "border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" : "border-border text-muted-foreground hover:bg-muted/40")}>
            <RiStarLine className="text-xs" /> Featured only
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-[12.5px] font-semibold text-muted-foreground">{filtered.length.toLocaleString()} courses</p>
        </div>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/60 animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/3" /><div className="h-2.5 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <RiBookOpenLine className="text-4xl text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No courses found</p>
          </div>
        ) : (
          filtered.map(c => <CourseRow key={c.id} course={c} onRefresh={load} />)
        )}
      </div>
    </div>
  );
}
