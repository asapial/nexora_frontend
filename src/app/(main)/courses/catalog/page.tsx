"use client";
// Course Catalog:       /courses          (default export)
// Course Detail Public: /courses/[id]     (named export)

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiSearchLine, RiBookOpenLine, RiGroupLine,
  RiStarFill, RiStarLine, RiCheckLine, RiArrowRightLine,
  RiFileTextLine, RiAlertLine, RiRefreshLine, RiCloseLine,
  RiShieldCheckLine, RiLock2Line, RiFilterLine, RiLoader4Line,
  RiTimeLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { studentApi } from "../../../../lib/api";

const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-teal-400/[0.04] blur-[100px]" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[300px] rounded-full bg-amber-500/[0.04] blur-[110px]" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-44 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3 w-24 rounded-full bg-muted/60" />
        <div className="h-4 w-3/4 rounded-full bg-muted/60" />
        <div className="h-3 w-full rounded-full bg-muted/40" />
        <div className="h-px bg-border/60 my-1" />
        <div className="h-9 rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}

// ─── Catalog Card ─────────────────────────────────────────
function CatalogCard({ course, onClick }: { course: any; onClick: () => void }) {
  return (
    <div onClick={onClick} className={cn(
      "group relative rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden cursor-pointer",
      "hover:border-teal-300/50 dark:hover:border-teal-700/40",
      "hover:shadow-2xl hover:shadow-teal-600/[0.07]",
      "transition-all duration-300 ease-out"
    )}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      <div className="relative h-44 bg-gradient-to-br from-teal-950/80 via-slate-900 to-slate-950 overflow-hidden">
        {course.thumbnailUrl
          ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-500 ease-out" />
          : <div className="w-full h-full flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
              <RiBookOpenLine className="text-5xl text-teal-700/20 relative z-10" />
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {course.tags?.slice(0, 2).map((t: string) => <span key={t} className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10.5px] font-semibold text-white/80 border border-white/10">{t}</span>)}
        </div>
        {course.isFeatured && <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-[10.5px] font-bold text-white"><RiStarFill className="text-xs" />Featured</span>}
        <div className="absolute bottom-3 left-3">
          <span className={cn("px-2.5 py-1 rounded-lg text-[12px] font-extrabold backdrop-blur-sm border", course.isFree ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "bg-black/50 text-white border-white/20")}>
            {course.isFree ? "Free" : fmtUSD(course.price)}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div>
          <h3 className="text-[14px] font-extrabold text-foreground leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{course.title}</h3>
          {course.description && <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{course.description}</p>}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" /><span className="text-[12px] font-bold text-foreground">{course._count?.enrollments ?? 0}</span><span className="text-[11px] text-muted-foreground">students</span></span>
            <span className="flex items-center gap-1.5"><RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" /><span className="text-[12px] font-bold text-foreground">{course._count?.missions ?? 0}</span><span className="text-[11px] text-muted-foreground">missions</span></span>
          </div>
        </div>
        <div className="w-full h-9 rounded-xl flex items-center justify-center gap-2 border border-border text-[12.5px] font-semibold text-muted-foreground bg-muted/20 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-300/50 dark:group-hover:border-teal-700/50 group-hover:bg-teal-50/30 dark:group-hover:bg-teal-950/20 transition-all">
          View course <RiArrowRightLine className="text-xs group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COURSE CATALOG
// ════════════════════════════════════════════════════════════
export default function CourseCatalogPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPrice, setFilterPrice] = useState<"all" | "free" | "paid">("all");
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const p: any = { page, limit: 12 };
      if (search) p.search = search;
      if (filterPrice === "free") p.isFree = "true";
      if (filterPrice === "paid") p.isFree = "false";
      if (filterFeatured) p.featured = "true";
      if (filterTag) p.tag = filterTag;
      const r = await studentApi.getCatalog(p);
      const d = r.data;
      if (Array.isArray(d)) { setCourses(d); setTotalPages(1); setTotal(d.length); }
      else { setCourses(d.data ?? []); setTotalPages(d.totalPages ?? 1); setTotal(d.total ?? 0); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, search, filterPrice, filterFeatured, filterTag]);

  useEffect(() => { load(); }, [load]);

  const allTags = Array.from(new Set(courses.flatMap((c: any) => c.tags ?? [])));
  const hasFilters = search || filterPrice !== "all" || filterFeatured || filterTag;

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-7xl mx-auto w-full min-h-screen">
      <AmbientBg />

      {/* Hero */}
      <div className="text-center pt-8 pb-2">
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Nexora Learning</span>
        </div>
        <h1 className="text-[2.2rem] sm:text-[2.8rem] font-extrabold tracking-tight text-foreground leading-none">
          Explore <span className="text-teal-600 dark:text-teal-400">Courses</span>
        </h1>
        <p className="text-[14px] text-muted-foreground mt-3 max-w-md mx-auto">Learn from expert teachers. Grow your skills with curated courses.</p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        <div className="relative">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base pointer-events-none" />
          <input type="text" placeholder="Search courses…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-12 pl-11 pr-4 rounded-2xl text-[14px] font-medium bg-card/90 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/70 shadow-sm transition-all" />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {(["all", "free", "paid"] as const).map(f => (
            <button key={f} onClick={() => { setFilterPrice(f); setPage(1); }}
              className={cn("h-8 px-4 rounded-xl text-[12.5px] font-semibold border transition-all capitalize",
                filterPrice === f ? "bg-teal-600 dark:bg-teal-500 text-white border-teal-600 shadow-sm" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {f === "all" ? "All prices" : f}
            </button>
          ))}
          <button onClick={() => setFilterFeatured(p => !p)}
            className={cn("h-8 px-4 rounded-xl text-[12.5px] font-semibold border transition-all flex items-center gap-1.5",
              filterFeatured ? "border-amber-300/60 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <RiStarLine className="text-xs" /> Featured
          </button>
          {allTags.slice(0, 5).map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? "" : tag)}
              className={cn("h-8 px-3 rounded-xl text-[12.5px] font-semibold border transition-all",
                filterTag === tag ? "bg-teal-600 dark:bg-teal-500 text-white border-teal-600" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {tag}
            </button>
          ))}
          {hasFilters && (
            <button onClick={() => { setSearch(""); setFilterPrice("all"); setFilterFeatured(false); setFilterTag(""); setPage(1); }}
              className="h-8 px-3 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center gap-1.5">
              <RiCloseLine className="text-xs" /> Clear
            </button>
          )}
        </div>
      </div>

      {error && <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 max-w-2xl mx-auto w-full"><RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" /><p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p><button onClick={load} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline">Retry</button></div>}

      {!loading && <p className="text-[12.5px] text-muted-foreground text-center">{total.toLocaleString()} course{total !== 1 ? "s" : ""} found</p>}

      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        : courses.length === 0
          ? <div className="rounded-2xl border border-border bg-card/80 py-20 flex flex-col items-center gap-4 text-center"><RiBookOpenLine className="text-4xl text-muted-foreground/30" /><p className="text-[14px] font-bold text-muted-foreground">No courses found</p><button onClick={() => { setSearch(""); setFilterPrice("all"); setFilterFeatured(false); }} className="text-[12.5px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">Clear filters</button></div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{courses.map(c => <CatalogCard key={c.id} course={c} onClick={() => router.push(`/courses/${c.id}`)} />)}</div>
      }

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Previous</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={cn("h-9 w-9 rounded-xl text-[13px] font-bold transition-all", page === p ? "bg-teal-600 dark:bg-teal-500 text-white" : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>{p}</button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PUBLIC COURSE DETAIL
// ════════════════════════════════════════════════════════════
export function CourseDetailPublicPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentApi.getCoursePublic(id)
      .then(r => setCourse(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="relative flex flex-col gap-4 p-5 lg:p-8 pt-6 max-w-4xl mx-auto animate-pulse">
      <AmbientBg />
      <div className="h-64 rounded-2xl bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60" />
      <div className="h-6 w-2/3 rounded-full bg-muted/60" />
      <div className="h-4 w-full rounded-full bg-muted/40" />
    </div>
  );

  if (error || !course) return (
    <div className="relative flex flex-col items-center gap-4 p-10 max-w-xl mx-auto text-center">
      <AmbientBg />
      <RiAlertLine className="text-4xl text-red-500" />
      <p className="text-[14px] font-bold text-foreground">{error ?? "Course not found"}</p>
      <button onClick={() => router.push("/courses")} className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">Browse courses</button>
    </div>
  );

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-5xl mx-auto w-full">
      <AmbientBg />

      {/* Thumbnail hero */}
      {course.thumbnailUrl && (
        <div className="rounded-2xl overflow-hidden h-64 shadow-2xl relative">
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {course.isFeatured && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-[11px] font-bold text-amber-600 dark:text-amber-400"><RiStarFill className="text-xs" />Featured</span>}
            {course.tags?.map((t: string) => <span key={t} className="px-2 py-0.5 rounded-md bg-muted/50 border border-border text-[11px] font-semibold text-muted-foreground">{t}</span>)}
          </div>
          <h1 className="text-[1.7rem] font-extrabold tracking-tight text-foreground leading-tight">{course.title}</h1>
          {course.description && <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">{course.description}</p>}

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />{(course._count?.enrollments ?? 0).toLocaleString()} students</span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" />{course._count?.missions ?? 0} missions</span>
            {course.teacher?.user && <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><RiSparklingFill className="text-xs text-teal-600 dark:text-teal-400" />By {course.teacher.user.name}</span>}
          </div>

          {/* Mission list preview */}
          {course.missions && course.missions.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              <p className="text-[14px] font-bold text-foreground">Course content — {course.missions.length} missions</p>
              <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
                {course.missions.map((m: any, i: number) => (
                  <div key={m.id} className={cn("flex items-center gap-3 px-5 py-3.5", i !== course.missions.length - 1 && "border-b border-border")}>
                    <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-[10px] font-extrabold">{i + 1}</div>
                    <p className="text-[13px] font-semibold text-foreground flex-1 truncate">{m.title}</p>
                    <RiLock2Line className="text-muted-foreground/40 text-sm flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: enroll card */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-4 rounded-2xl border border-border bg-card/95 backdrop-blur-md px-5 py-5 flex flex-col gap-4 shadow-xl shadow-black/10">
            <div>
              <p className="text-[30px] font-extrabold text-foreground leading-none tabular-nums">
                {course.isFree ? <span className="text-teal-600 dark:text-teal-400">Free</span> : fmtUSD(course.price)}
              </p>
              {!course.isFree && <p className="text-[12px] text-muted-foreground mt-0.5">One-time payment · Lifetime access</p>}
            </div>

            <button onClick={() => router.push(`/courses/${id}/enroll`)}
              className={cn(
                "w-full h-12 rounded-xl flex items-center justify-center gap-2",
                "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
                "text-white font-extrabold text-[14.5px]",
                "shadow-lg shadow-teal-600/20 transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.99]"
              )}>
              {course.isFree ? <><RiCheckLine className="text-base" />Enroll free</> : <><RiArrowRightLine className="text-base" />Enroll now</>}
            </button>

            {!course.isFree && (
              <p className="text-[11.5px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
                <RiShieldCheckLine className="text-teal-600 dark:text-teal-400 text-sm" />
                Secure payment via Stripe
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
              {[
                { icon: <RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" />, text: `${course._count?.missions ?? 0} missions` },
                { icon: <RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />, text: `${(course._count?.enrollments ?? 0).toLocaleString()} students` },
                { icon: <RiCheckLine className="text-xs text-teal-600 dark:text-teal-400" />, text: "Lifetime access" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-[12.5px] text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}