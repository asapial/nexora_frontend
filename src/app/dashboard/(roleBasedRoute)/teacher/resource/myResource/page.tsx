"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiBook2Line, RiDownloadLine, RiBookmarkLine, RiBookmarkFill,
  RiSearchLine, RiFilterLine, RiFilePdfLine, RiVideoLine, RiFileTextLine,
  RiFileLine, RiUser3Line, RiDeleteBinLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type Visibility = "PUBLIC" | "CLUSTER" | "PRIVATE";
interface Resource {
  id: string; title: string; description: string | null; fileUrl: string; fileType: string;
  visibility: Visibility; tags: string[]; authors: string[]; year: number | null;
  viewCount: number; isFeatured: boolean; isBookmarked: boolean;
  category: { id: string; name: string } | null;
  cluster: { id: string; name: string } | null;
}
interface Meta { page: number; limit: number; total: number; totalPages: number }

const FILE_TYPES = ["", "pdf", "video", "image", "text", "link", "other"];
const VISIBILITY_CLS: Record<Visibility, string> = {
  PUBLIC:  "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  CLUSTER: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50",
  PRIVATE: "bg-muted text-muted-foreground border-border",
};

function getFileIcon(t: string): React.ReactNode {
  if (t.includes("pdf"))   return <RiFilePdfLine />;
  if (t.includes("video")) return <RiVideoLine />;
  if (t.includes("text"))  return <RiFileTextLine />;
  return <RiFileLine />;
}

export default function TeacherMyResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [meta, setMeta]           = useState<Meta>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [fileType, setFileType]   = useState("");
  const [page, setPage]           = useState(1);

  const fetchResources = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (search)   params.set("search", search);
    if (fileType) params.set("fileType", fileType);
    fetch(`/api/resource/my?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setResources(d.data ?? []);
          if (d.meta) setMeta(d.meta);
        }
      })
      .finally(() => setLoading(false));
  }, [search, fileType, page]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const handleBookmarkToggle = async (id: string, bookmarked: boolean) => {
    await fetch(`/api/resource/${id}/bookmark`, {
      method: bookmarked ? "DELETE" : "POST", credentials: "include",
    });
    setResources(prev => prev.map(r => r.id === id ? { ...r, isBookmarked: !bookmarked } : r));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Library</span>
        </div>
        <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">My Resources</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Resources you have uploaded</p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search resources…"
            className="w-full rounded-xl border border-border bg-muted/30 pl-9 pr-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-400/60 transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          <RiFilterLine className="text-muted-foreground text-sm flex-shrink-0" />
          <select value={fileType} onChange={e => { setFileType(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-colors">
            {FILE_TYPES.map(ft => <option key={ft} value={ft}>{ft === "" ? "All types" : ft.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {!loading && <p className="text-[12.5px] text-muted-foreground -mt-2">{meta.total} resource{meta.total !== 1 ? "s" : ""}</p>}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-52" />)}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RiBook2Line className="text-4xl text-muted-foreground/30 mb-3" />
          <p className="text-[14px] font-semibold text-foreground mb-1">No resources yet</p>
          <p className="text-[12.5px] text-muted-foreground">Resources you upload will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {resources.map(r => {
            const visCls = VISIBILITY_CLS[r.visibility] ?? VISIBILITY_CLS.PUBLIC;
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:shadow-black/[0.04] dark:hover:shadow-black/20 transition-shadow duration-200 flex flex-col">
                <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[18px] bg-violet-100/70 dark:bg-violet-950/50 border border-violet-200/70 dark:border-violet-800/50 text-violet-600 dark:text-violet-400">
                    {getFileIcon(r.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-foreground leading-snug line-clamp-2">{r.title}</p>
                    {r.category && <p className="text-[11px] text-muted-foreground/70 font-medium mt-0.5">{r.category.name}</p>}
                  </div>
                </div>
                <div className="px-5 pb-4 flex-1 flex flex-col">
                  {r.description && <p className="text-[12px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">{r.description}</p>}
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {r.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                  {(r.authors.length > 0 || r.year) && (
                    <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground mb-3">
                      {r.authors.length > 0 && <span className="flex items-center gap-1"><RiUser3Line className="text-xs" /> {r.authors.slice(0, 2).join(", ")}</span>}
                      {r.year && <span>· {r.year}</span>}
                    </div>
                  )}
                  <div className="flex-1" />
                  <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", visCls)}>{r.visibility}</span>
                      <span className="text-[11px] text-muted-foreground/55 font-medium uppercase">{r.fileType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleBookmarkToggle(r.id, r.isBookmarked)}
                        className={cn("text-[16px] transition-colors", r.isBookmarked ? "text-amber-500 hover:text-amber-400" : "text-muted-foreground/40 hover:text-amber-500")}
                        title={r.isBookmarked ? "Remove bookmark" : "Bookmark"}>
                        {r.isBookmarked ? <RiBookmarkFill /> : <RiBookmarkLine />}
                      </button>
                      <a href={r.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11.5px] font-semibold hover:bg-teal-700 transition-colors">
                        <RiDownloadLine className="text-xs" /> Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 disabled:opacity-40 transition-colors">Previous</button>
          <span className="text-[12.5px] text-muted-foreground">{page} / {meta.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
            className="px-4 py-2 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 disabled:opacity-40 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
