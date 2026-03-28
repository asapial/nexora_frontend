"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiFileTextLine, RiStickyNoteLine, RiShareLine,
  RiDeleteBinLine, RiAddLine, RiLoader4Line, RiCloseLine,
  RiCheckLine, RiBookOpenLine, RiEditLine, RiLinkM,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { annotationApi } from "@/lib/api";
import { toast } from "sonner";

type Resource = { id: string; title: string; fileType: string; fileUrl: string; description?: string };
type Annotation = { id: string; highlight?: string; note?: string; page?: number; isShared: boolean; userId: string; createdAt: string; user?: { name: string; image?: string } };

const FILE_TYPE_COLOR: Record<string, string> = {
  PDF:   "text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/40",
  VIDEO: "text-violet-600 dark:text-violet-400 bg-violet-50/70 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/40",
  LINK:  "text-sky-600 dark:text-sky-400 bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-800/40",
  IMAGE: "text-teal-600 dark:text-teal-400 bg-teal-50/70 dark:bg-teal-950/30 border-teal-200/50 dark:border-teal-800/40",
};

function SkeletonResource() {
  return (
    <div className="p-3 animate-pulse flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-muted rounded w-4/5" />
        <div className="h-2.5 bg-muted rounded w-14" />
      </div>
    </div>
  );
}

function AnnotationItem({
  ann,
  onDelete,
  onToggleShare,
}: {
  ann: Annotation;
  onDelete: (id: string) => void;
  onToggleShare: (ann: Annotation) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-2 group">
      {ann.highlight && (
        <div className="px-2.5 py-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border-l-2 border-amber-400">
          <p className="text-[12px] text-amber-800 dark:text-amber-300 italic leading-snug">"{ann.highlight}"</p>
        </div>
      )}
      {ann.note && (
        <div className="flex items-start gap-1.5">
          <RiStickyNoteLine className="text-violet-500 text-sm mt-0.5 shrink-0" />
          <p className="text-[12.5px] text-foreground leading-snug">{ann.note}</p>
        </div>
      )}
      {ann.page != null && (
        <p className="text-[11px] text-muted-foreground">Page {ann.page}</p>
      )}
      <div className="flex items-center gap-1.5 justify-between">
        <button
          onClick={() => onToggleShare(ann)}
          className={cn(
            "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all",
            ann.isShared
              ? "text-teal-700 dark:text-teal-400 border-teal-200/50 dark:border-teal-800/40 bg-teal-50/60 dark:bg-teal-950/20"
              : "text-muted-foreground border-border hover:bg-muted/40"
          )}
        >
          <RiShareLine className="text-xs" />
          {ann.isShared ? "Shared" : "Share"}
        </button>
        <button
          onClick={() => onDelete(ann.id)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-50/60 transition-all opacity-0 group-hover:opacity-100"
        >
          <RiDeleteBinLine className="text-xs" />
        </button>
      </div>
      {ann.user && (
        <p className="text-[10.5px] text-muted-foreground/60">{ann.user.name}</p>
      )}
    </div>
  );
}

export default function ResourceAnnotationPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [sharedAnnotations, setSharedAnnotations] = useState<Annotation[]>([]);
  const [loadingRes, setLoadingRes] = useState(true);
  const [loadingAnn, setLoadingAnn] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [highlight, setHighlight] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"mine" | "shared">("mine");

  // Load resources
  useEffect(() => {
    setLoadingRes(true);
    annotationApi.getResources()
      .then(r => setResources(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error("Failed to load resources"))
      .finally(() => setLoadingRes(false));
  }, []);

  const loadAnnotations = useCallback(async (res: Resource) => {
    setLoadingAnn(true);
    try {
      const [mine, shared] = await Promise.all([
        annotationApi.getAnnotations(res.id),
        annotationApi.getShared(res.id),
      ]);
      setAnnotations(Array.isArray(mine.data) ? mine.data : []);
      setSharedAnnotations(Array.isArray(shared.data) ? shared.data : []);
    } catch {
      toast.error("Failed to load annotations");
    } finally {
      setLoadingAnn(false);
    }
  }, []);

  const selectResource = (res: Resource) => {
    setSelected(res);
    loadAnnotations(res);
  };

  const addAnnotation = async () => {
    if (!selected || (!highlight.trim() && !note.trim())) return;
    setSaving(true);
    try {
      await annotationApi.create({
        resourceId: selected.id,
        highlight: highlight.trim() || undefined,
        note: note.trim() || undefined,
        page: page ? +page : undefined,
        isShared,
      });
      toast.success("Annotation saved");
      setShowAddModal(false);
      setHighlight(""); setNote(""); setPage(""); setIsShared(false);
      await loadAnnotations(selected);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnotation = async (id: string) => {
    try {
      await annotationApi.delete(id);
      setAnnotations(prev => prev.filter(a => a.id !== id));
      toast.success("Annotation removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const toggleShare = async (ann: Annotation) => {
    try {
      await annotationApi.update(ann.id, { isShared: !ann.isShared });
      setAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, isShared: !a.isShared } : a));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const filtered = resources.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-3.5rem)] max-w-7xl mx-auto w-full">
      {/* Left: Resource list */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <RiSparklingFill className="text-rose-500 text-sm" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Student</span>
          </div>
          <h1 className="text-[14px] font-extrabold text-foreground">Resource Annotations</h1>
          <div className="relative mt-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resources…"
              className="w-full h-8 pl-3 pr-3 rounded-xl text-[12px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingRes
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonResource key={i} />)
            : filtered.length === 0
            ? (
              <div className="py-10 text-center px-4">
                <RiBookOpenLine className="text-3xl text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[12px] text-muted-foreground">No resources found</p>
              </div>
            )
            : filtered.map(r => {
              const cls = FILE_TYPE_COLOR[r.fileType] ?? FILE_TYPE_COLOR.PDF;
              return (
                <button
                  key={r.id}
                  onClick={() => selectResource(r)}
                  className={cn(
                    "w-full p-3 flex items-center gap-2.5 text-left hover:bg-muted/30 transition-colors border-b border-border/40",
                    selected?.id === r.id && "bg-rose-50/40 dark:bg-rose-950/10"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0", cls)}>
                    {r.fileType.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-foreground truncate">{r.title}</p>
                    <p className="text-[10.5px] text-muted-foreground">{r.fileType}</p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Center: Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            <div className="px-5 py-3.5 border-b border-border bg-card/80 flex items-center gap-3">
              <RiFileTextLine className="text-rose-500 text-lg shrink-0" />
              <h2 className="text-[14px] font-bold text-foreground truncate flex-1">{selected.title}</h2>
              {selected.fileUrl && (
                <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                  <RiLinkM /> Open
                </a>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="h-8 px-3 rounded-xl bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all"
              >
                <RiAddLine /> Add note
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {selected.fileType === "PDF" && selected.fileUrl ? (
                <iframe
                  src={selected.fileUrl}
                  className="w-full h-full border-0"
                  title={selected.title}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center p-8">
                  <div>
                    <RiFileTextLine className="text-6xl text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-[14px] font-semibold text-muted-foreground">{selected.fileType} file</p>
                    <p className="text-[12px] text-muted-foreground/60 mt-1">{selected.description ?? "No preview available"}</p>
                    {selected.fileUrl && (
                      <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-sky-600 text-white text-[12.5px] font-bold hover:bg-sky-700 transition-all">
                        <RiLinkM /> Open resource
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <RiBookOpenLine className="text-6xl text-muted-foreground/15 mx-auto mb-4" />
              <p className="text-[15px] font-semibold text-muted-foreground">Select a resource</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Choose a resource from the left to view it and add annotations</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Annotations sidebar */}
      {selected && (
        <div className="w-72 shrink-0 border-l border-border flex flex-col bg-card/50">
          <div className="p-4 border-b border-border">
            <div className="flex gap-0 rounded-xl overflow-hidden border border-border">
              {(["mine", "shared"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 h-8 text-[11.5px] font-semibold transition-colors",
                    activeTab === tab ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  {tab === "mine" ? `Mine (${annotations.length})` : `Shared (${sharedAnnotations.length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {loadingAnn
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-3.5 animate-pulse space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-8 bg-muted rounded" />
                  </div>
                ))
              : activeTab === "mine"
              ? annotations.length === 0
                ? (
                  <div className="py-8 text-center">
                    <RiStickyNoteLine className="text-3xl text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground">No annotations yet</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Click "Add note" to start</p>
                  </div>
                )
                : annotations.map(a => (
                  <AnnotationItem key={a.id} ann={a} onDelete={deleteAnnotation} onToggleShare={toggleShare} />
                ))
              : sharedAnnotations.length === 0
              ? (
                <div className="py-8 text-center">
                  <RiShareLine className="text-3xl text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[12px] text-muted-foreground">No shared annotations</p>
                </div>
              )
              : sharedAnnotations.map(a => (
                <AnnotationItem key={a.id} ann={a} onDelete={() => {}} onToggleShare={() => {}} />
              ))
            }
          </div>
        </div>
      )}

      {/* Add annotation modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-foreground">Add annotation</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all">
                <RiCloseLine />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Highlighted text</label>
                <textarea value={highlight} onChange={e => setHighlight(e.target.value)} rows={2}
                  placeholder="Paste or type the text you want to highlight…"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-[12.5px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-rose-400/20 resize-none transition-all" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Sticky note</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Your private note about this section…"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-[12.5px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-rose-400/20 resize-none transition-all" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Page number</label>
                  <input type="number" value={page} onChange={e => setPage(e.target.value)} placeholder="e.g. 12"
                    className="w-full h-9 px-3 rounded-xl border border-border bg-muted/30 text-[12.5px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all" />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setIsShared(!isShared)}
                      className={cn("w-9 h-5 rounded-full border transition-all relative", isShared ? "bg-teal-500 border-teal-500" : "bg-muted border-border")}>
                      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", isShared ? "left-4" : "left-0.5")} />
                    </div>
                    <span className="text-[11.5px] font-semibold text-muted-foreground">Share</span>
                  </label>
                </div>
              </div>
            </div>
            <button
              onClick={addAnnotation}
              disabled={saving || (!highlight.trim() && !note.trim())}
              className="h-11 rounded-xl bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
            >
              {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
              Save annotation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
