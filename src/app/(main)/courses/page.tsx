"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter} from "next/navigation";
import {
  RiSparklingFill, RiSearchLine, RiBookOpenLine, RiStarLine, RiAlertLine, RiCloseLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { studentApi } from "@/lib/api";
import { AmbientBg } from "@/components/courses/AmbientBg";
import { CatalogCard } from "@/components/courses/CatalogCard";
import { SkeletonCard } from "@/components/courses/SkeletonCard";
import { AmbientBg6 } from "@/components/backgrounds/AmbientBg";



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
    <div className="relative flex flex-col gap-6 p-5 lg:p-20 pt-6 max-w-7xl mx-auto w-full min-h-screen">
       <AmbientBg6 />

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