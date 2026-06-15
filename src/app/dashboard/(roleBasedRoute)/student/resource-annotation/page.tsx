"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  RiAddLine,
  RiBookOpenLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiExternalLinkLine,
  RiFileTextLine,
  RiFocus3Line,
  RiInformationLine,
  RiLayoutLeftLine,
  RiLayoutRightLine,
  RiLoader4Line,
  RiRefreshLine,
  RiSearchLine,
  RiShareLine,
  RiStickyNoteLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { annotationApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import NexoraPdfReader from "@/components/resource/NexoraPdfReader";

type Resource = {
  id: string;
  title: string;
  fileType: string;
  fileUrl: string;
  description?: string;
  visibility?: "PUBLIC" | "CLUSTER" | "PRIVATE";
  uploaderId?: string;
};

type Annotation = {
  id: string;
  highlight?: string;
  note?: string;
  page?: number;
  isShared: boolean;
  userId: string;
  createdAt: string;
  user?: { name: string; image?: string };
};

const signedUrl = (resource: Resource, inline = true) => {
  const params = new URLSearchParams({ url: resource.fileUrl, filename: resource.title });
  if (inline) params.set("inline", "true");
  return `/api/resource/cloudinary-sign?${params.toString()}`;
};

const readerDataUrl = (resource: Resource) => {
  const params = new URLSearchParams({
    url: resource.fileUrl,
    filename: resource.title,
    inline: "true",
    reader: "true",
  });
  return `/api/resource/cloudinary-sign?${params.toString()}`;
};

const isPdf = (resource: Resource) =>
  resource.fileType.toLowerCase().includes("pdf") || resource.fileUrl.toLowerCase().endsWith(".pdf");

export default function ResourceAnnotationPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialResourceId = searchParams.get("resourceId");
  const teacherMode = pathname.startsWith("/dashboard/teacher");
  const libraryHref = teacherMode
    ? "/dashboard/teacher/resource/myResource"
    : "/dashboard/student/resources/all";
  const uploadHref = teacherMode
    ? "/dashboard/teacher/resource/upload"
    : "/dashboard/student/resources/upload";
  const annotationPath = teacherMode
    ? "/dashboard/teacher/resource-annotation"
    : "/dashboard/student/resource-annotation";
  const [resources, setResources] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [sharedAnnotations, setSharedAnnotations] = useState<Annotation[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"mine" | "shared">("mine");
  const [focusMode, setFocusMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pdfObjectUrl, setPdfObjectUrl] = useState("");
  const [pdfFetchKey, setPdfFetchKey] = useState(0);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState(false);
  const [showReaderHelp, setShowReaderHelp] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);

  const loadAnnotations = useCallback(async (resource: Resource) => {
    setLoadingAnnotations(true);
    try {
      const [mine, shared] = await Promise.all([
        annotationApi.getAnnotations(resource.id),
        annotationApi.getShared(resource.id),
      ]);
      setAnnotations(Array.isArray(mine.data) ? mine.data : []);
      setSharedAnnotations(Array.isArray(shared.data) ? shared.data : []);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not load notes");
    } finally {
      setLoadingAnnotations(false);
    }
  }, []);

  useEffect(() => {
    annotationApi.getResources()
      .then((response) => {
        const rows = Array.isArray(response.data) ? response.data as Resource[] : [];
        const initial = rows.find((resource) => resource.id === initialResourceId) ?? rows[0] ?? null;
        setResources(rows);
        setSelected(initial);
        if (initial) void loadAnnotations(initial);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not load your accessible resources");
      })
      .finally(() => setLoadingResources(false));
  }, [initialResourceId, loadAnnotations]);

  useEffect(() => {
    if (!selected) return;
    const savedPage = Number(localStorage.getItem(`nexora-reader-page:${selected.id}`)) || 1;
    setCurrentPage(savedPage);
    setZoom(100);
    setRotation(0);
    setReaderError(false);
    setReaderLoading(isPdf(selected));
  }, [selected]);

  useEffect(() => {
    if (!selected || !isPdf(selected)) return;
    const controller = new AbortController();
    setReaderLoading(true);
    setReaderError(false);
    setPdfObjectUrl("");

    fetch(readerDataUrl(selected), {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Reader returned ${response.status}`);
        const bytes = await response.arrayBuffer();
        const signature = new TextDecoder().decode(bytes.slice(0, 5));
        if (signature !== "%PDF-") {
          throw new Error("Storage did not return a valid PDF");
        }
        const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
        setPdfObjectUrl(objectUrl);
        setReaderLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setReaderLoading(false);
        setReaderError(true);
      });
    return () => {
      controller.abort();
      setPdfObjectUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
    };
  }, [selected, pdfFetchKey]);

  const goToPage = useCallback((page: number) => {
    if (!selected) return;
    const nextPage = Math.max(1, Math.floor(page));
    setCurrentPage(nextPage);
    setReaderError(false);
    localStorage.setItem(`nexora-reader-page:${selected.id}`, String(nextPage));
  }, [selected]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") goToPage(currentPage - 1);
      if (event.key === "ArrowRight") goToPage(currentPage + 1);
      if (event.key === "+" || event.key === "=") setZoom((value) => Math.min(200, value + 10));
      if (event.key === "-") setZoom((value) => Math.max(50, value - 10));
      if (event.key.toLowerCase() === "r") setRotation((value) => (value + 90) % 360);
      if (event.key.toLowerCase() === "f") setFocusMode((value) => !value);
      if (event.key.toLowerCase() === "n") setShowNote(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentPage, goToPage]);

  const chooseResource = (resource: Resource) => {
    setSelected(resource);
    void loadAnnotations(resource);
  };

  const deleteAnnotation = async (id: string) => {
    try {
      await annotationApi.delete(id);
      setAnnotations((current) => current.filter((annotation) => annotation.id !== id));
      toast.success("Note removed");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not remove note");
    }
  };

  const toggleShare = async (annotation: Annotation) => {
    try {
      await annotationApi.update(annotation.id, { isShared: !annotation.isShared });
      setAnnotations((current) =>
        current.map((item) => item.id === annotation.id ? { ...item, isShared: !item.isShared } : item)
      );
      toast.success(annotation.isShared ? "Note is private" : "Note shared");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not update note");
    }
  };

  const retryReader = () => {
    setReaderError(false);
    setReaderLoading(true);
    setPdfFetchKey((value) => value + 1);
  };

  const visibleResources = useMemo(
    () => resources.filter((resource) => resource.title.toLowerCase().includes(search.toLowerCase())),
    [resources, search]
  );
  const currentNotes = activeTab === "mine" ? annotations : sharedAnnotations;
  const readerUrl = selected ? pdfObjectUrl : "";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[1800px] flex-col gap-4 p-4 lg:p-6">
      <header className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-card to-violet-500/[.06] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-600">Nexora reading workspace</p>
            <h1 className="mt-1 text-xl font-black">Read, connect, and remember</h1>
            <p className="mt-1 text-[11px] text-muted-foreground">A focused PDF reader with private notes, shared insights, and remembered progress.</p>
          </div>
          <div className="flex gap-2">
            <Link href={libraryHref} className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-[10px] font-bold hover:bg-muted"><RiBookOpenLine />Resource library</Link>
            <Link href={uploadHref} className="flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-[10px] font-bold text-white hover:bg-teal-700"><RiAddLine />Add related document</Link>
          </div>
        </div>
      </header>

      <div className={cn(
        "grid min-h-[760px] flex-1 gap-4",
        focusMode || (!documentsOpen && !notesOpen)
          ? "grid-cols-1"
          : documentsOpen && notesOpen
            ? "xl:grid-cols-[280px_minmax(0,1fr)_320px]"
            : documentsOpen
              ? "xl:grid-cols-[280px_minmax(0,1fr)]"
              : "xl:grid-cols-[minmax(0,1fr)_320px]",
      )}>
        {!focusMode && documentsOpen && <DocumentLibrary resources={visibleResources} selected={selected} search={search} loading={loadingResources} onSearch={setSearch} onChoose={chooseResource} />}

        <main className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {selected ? <ReaderWorkspace
            resource={selected}
            readerUrl={readerUrl}
            readerLoading={readerLoading}
            readerError={readerError}
            currentPage={currentPage}
            zoom={zoom}
            rotation={rotation}
            focusMode={focusMode}
            showHelp={showReaderHelp}
            documentsOpen={documentsOpen}
            notesOpen={notesOpen}
            onGoToPage={goToPage}
            onZoom={setZoom}
            onRotate={() => setRotation((value) => (value + 90) % 360)}
            onToggleFocus={() => setFocusMode((value) => !value)}
            onToggleHelp={() => setShowReaderHelp((value) => !value)}
            onToggleDocuments={() => setDocumentsOpen((value) => !value)}
            onToggleNotes={() => setNotesOpen((value) => !value)}
            onLoaded={() => setReaderLoading(false)}
            onError={() => { setReaderLoading(false); setReaderError(true); }}
            onRetry={retryReader}
            onAddNote={() => setShowNote(true)}
          /> : <EmptyState />}
        </main>

        {!focusMode && notesOpen && <NotesPanel
          activeTab={activeTab}
          annotations={annotations}
          sharedAnnotations={sharedAnnotations}
          currentNotes={currentNotes}
          loading={loadingAnnotations}
          onTab={setActiveTab}
          onDelete={deleteAnnotation}
          onToggleShare={toggleShare}
          onGoToPage={goToPage}
        />}
      </div>

      {showNote && selected && <NoteModal resource={selected} resources={resources} annotationPath={annotationPath} defaultPage={currentPage} onClose={() => setShowNote(false)} onSaved={async () => { setShowNote(false); await loadAnnotations(selected); }} />}
    </div>
  );
}

function DocumentLibrary({ resources, selected, search, loading, onSearch, onChoose }: {
  resources: Resource[];
  selected: Resource | null;
  search: string;
  loading: boolean;
  onSearch: (value: string) => void;
  onChoose: (resource: Resource) => void;
}) {
  return <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
    <div className="border-b border-border p-4">
      <h2 className="text-[12px] font-black">Accessible documents</h2>
      <p className="mt-1 text-[9px] text-muted-foreground">Public, personal, and cluster resources.</p>
      <div className="relative mt-3"><RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search documents" className="h-9 w-full rounded-xl border border-border bg-muted/20 pl-9 pr-3 text-[10px] outline-none focus:border-teal-500/50" /></div>
    </div>
    <div className="flex-1 space-y-1 overflow-y-auto p-2">
      {loading ? Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />) : resources.length ? resources.map((resource) => (
        <button key={resource.id} onClick={() => onChoose(resource)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors", selected?.id === resource.id ? "border-teal-500/35 bg-teal-500/10" : "border-transparent hover:border-border hover:bg-muted/30")}>
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[8px] font-black uppercase", isPdf(resource) ? "bg-rose-500/10 text-rose-600" : "bg-sky-500/10 text-sky-600")}>{isPdf(resource) ? "PDF" : resource.fileType.slice(0, 4)}</span>
          <span className="min-w-0"><span className="block truncate text-[10px] font-black">{resource.title}</span><span className="mt-1 block text-[8px] font-bold uppercase text-muted-foreground">{resource.visibility ?? "Accessible"}</span></span>
        </button>
      )) : <p className="p-5 text-center text-[9px] text-muted-foreground">No accessible documents found.</p>}
    </div>
  </aside>;
}

function ReaderWorkspace({ resource, readerUrl, readerLoading, readerError, currentPage, zoom, rotation, focusMode, showHelp, documentsOpen, notesOpen, onGoToPage, onZoom, onRotate, onToggleFocus, onToggleHelp, onToggleDocuments, onToggleNotes, onLoaded, onError, onRetry, onAddNote }: {
  resource: Resource;
  readerUrl: string;
  readerLoading: boolean;
  readerError: boolean;
  currentPage: number;
  zoom: number;
  rotation: number;
  focusMode: boolean;
  showHelp: boolean;
  documentsOpen: boolean;
  notesOpen: boolean;
  onGoToPage: (page: number) => void;
  onZoom: React.Dispatch<React.SetStateAction<number>>;
  onRotate: () => void;
  onToggleFocus: () => void;
  onToggleHelp: () => void;
  onToggleDocuments: () => void;
  onToggleNotes: () => void;
  onLoaded: () => void;
  onError: () => void;
  onRetry: () => void;
  onAddNote: () => void;
}) {
  const pdf = isPdf(resource);
  return <>
    <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
      <div className="min-w-[180px] flex-1"><h2 className="truncate text-[12px] font-black">{resource.title}</h2><p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{resource.fileType} · {resource.visibility ?? "Accessible"}</p></div>
      {pdf && <span className="rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-[8px] font-black uppercase tracking-wider text-teal-600">Nexora native PDF reader</span>}
      <ToolbarButton title={documentsOpen ? "Collapse accessible documents" : "Show accessible documents"} active={documentsOpen} onClick={onToggleDocuments}><RiLayoutLeftLine /></ToolbarButton>
      <ToolbarButton title={notesOpen ? "Collapse notes" : "Show notes"} active={notesOpen} onClick={onToggleNotes}><RiLayoutRightLine /></ToolbarButton>
      <ToolbarButton title="Focus reading mode (F)" active={focusMode} onClick={onToggleFocus}><RiFocus3Line /></ToolbarButton>
      <ToolbarButton title="Reader shortcuts" active={showHelp} onClick={onToggleHelp}><RiInformationLine /></ToolbarButton>
      <a href={signedUrl(resource, false)} className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-[9px] font-bold hover:bg-muted"><RiDownloadLine />Download</a>
      <button onClick={onAddNote} className="flex h-9 items-center gap-1.5 rounded-xl bg-teal-600 px-3 text-[9px] font-bold text-white hover:bg-teal-700"><RiStickyNoteLine />Add note</button>
    </div>
    {showHelp && <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-border bg-sky-500/[.06] px-4 py-3 text-[9px] text-muted-foreground"><span><strong className="text-foreground">← / →</strong> page</span><span><strong className="text-foreground">+ / -</strong> zoom</span><span><strong className="text-foreground">R</strong> rotate</span><span><strong className="text-foreground">F</strong> focus</span><span><strong className="text-foreground">N</strong> note</span><span><strong className="text-foreground">Ctrl / Cmd + F</strong> search inside paper</span><span>Your last page is remembered.</span></div>}
    <div className="relative flex-1 overflow-auto bg-zinc-100 p-4 dark:bg-zinc-950">
      {pdf ? <div className="mx-auto flex min-h-[680px] items-start justify-center">
        <div className="relative min-h-[680px] w-full overflow-hidden rounded-xl bg-zinc-950 shadow-xl">
          {readerUrl && <NexoraPdfReader source={readerUrl} title={resource.title} page={currentPage} zoom={zoom} rotation={rotation} onPageChange={onGoToPage} onZoomChange={onZoom} onRotationChange={onRotate} onLoaded={onLoaded} onError={onError} />}
          {readerLoading && <ReaderLoading />}
          {readerError && <ReaderError onRetry={onRetry} />}
        </div>
      </div> : <NativeDocument resource={resource} />}
    </div>
  </>;
}

function NotesPanel({ activeTab, annotations, sharedAnnotations, currentNotes, loading, onTab, onDelete, onToggleShare, onGoToPage }: {
  activeTab: "mine" | "shared";
  annotations: Annotation[];
  sharedAnnotations: Annotation[];
  currentNotes: Annotation[];
  loading: boolean;
  onTab: (tab: "mine" | "shared") => void;
  onDelete: (id: string) => void;
  onToggleShare: (annotation: Annotation) => void;
  onGoToPage: (page: number) => void;
}) {
  return <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
    <div className="border-b border-border p-3"><div className="grid grid-cols-2 rounded-xl border border-border p-1">{(["mine", "shared"] as const).map((tab) => <button key={tab} onClick={() => onTab(tab)} className={cn("h-8 rounded-lg text-[9px] font-black", activeTab === tab ? "bg-foreground text-background" : "text-muted-foreground")}>{tab === "mine" ? `My notes (${annotations.length})` : `Shared (${sharedAnnotations.length})`}</button>)}</div></div>
    <div className="flex-1 space-y-2 overflow-y-auto p-3">{loading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />) : currentNotes.length ? currentNotes.map((annotation) => <NoteCard key={annotation.id} annotation={annotation} owned={activeTab === "mine"} onDelete={onDelete} onToggleShare={onToggleShare} onGoToPage={onGoToPage} />) : <div className="py-16 text-center"><RiStickyNoteLine className="mx-auto text-3xl text-muted-foreground/20" /><p className="mt-2 text-[10px] font-bold text-muted-foreground">No notes here yet</p></div>}</div>
  </aside>;
}

function ToolbarButton({ children, title, active, onClick }: { children: React.ReactNode; title: string; active?: boolean; onClick: () => void }) {
  return <button title={title} onClick={onClick} className={cn("flex h-9 w-9 items-center justify-center rounded-xl border text-sm", active ? "border-teal-500/30 bg-teal-500/10 text-teal-600" : "border-border hover:bg-muted")}>{children}</button>;
}

function ReaderLoading() {
  return <div className="absolute inset-0 flex items-center justify-center bg-white/95"><div className="text-center"><RiLoader4Line className="mx-auto animate-spin text-3xl text-teal-600" /><p className="mt-3 text-[10px] font-black text-zinc-700">Opening paper...</p><p className="mt-1 text-[8px] text-zinc-500">Preparing secure PDF reader</p></div></div>;
}

function ReaderError({ onRetry }: { onRetry: () => void }) {
  return <div className="absolute inset-0 flex items-center justify-center bg-white p-8 text-center"><div><RiFileTextLine className="mx-auto text-5xl text-rose-300" /><p className="mt-4 text-[12px] font-black text-zinc-800">The paper could not be opened</p><p className="mt-2 max-w-sm text-[9px] leading-5 text-zinc-500">Retry the secure in-app reader. The paper will not be sent to the browser download manager.</p><div className="mt-4 flex justify-center"><button onClick={onRetry} className="flex h-9 items-center gap-2 rounded-xl bg-teal-600 px-4 text-[9px] font-bold text-white"><RiRefreshLine />Retry</button></div></div></div>;
}

function NativeDocument({ resource }: { resource: Resource }) {
  return <div className="mx-auto flex min-h-[620px] max-w-2xl items-center justify-center rounded-xl bg-white p-8 text-center shadow-xl dark:bg-zinc-900"><div><RiFileTextLine className="mx-auto text-5xl text-muted-foreground/20" /><p className="mt-4 text-[12px] font-black">{resource.title}</p><p className="mt-2 max-w-md text-[10px] leading-5 text-muted-foreground">{resource.description || "This file opens in its native viewer."}</p><a href={signedUrl(resource)} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-sky-600 px-4 text-[10px] font-bold text-white"><RiExternalLinkLine />Open document</a></div></div>;
}

function NoteCard({ annotation, owned, onDelete, onToggleShare, onGoToPage }: { annotation: Annotation; owned: boolean; onDelete: (id: string) => void; onToggleShare: (annotation: Annotation) => void; onGoToPage: (page: number) => void }) {
  return <article className="rounded-2xl border border-border bg-muted/[.12] p-3"><div className="flex items-start justify-between gap-2"><span className={cn("rounded-full px-2 py-1 text-[7px] font-black uppercase", annotation.isShared ? "bg-teal-500/10 text-teal-600" : "bg-violet-500/10 text-violet-600")}>{annotation.isShared ? "Shared note" : "Private note"}</span>{annotation.page && <button onClick={() => onGoToPage(annotation.page!)} className="rounded-lg bg-sky-500/10 px-2 py-1 text-[8px] font-bold text-sky-600 hover:bg-sky-500/20">Go to page {annotation.page}</button>}</div>{annotation.highlight && <blockquote className="mt-3 border-l-2 border-amber-400 bg-amber-500/5 px-3 py-2 text-[9px] italic leading-4 text-amber-700 dark:text-amber-300">{annotation.highlight}</blockquote>}{annotation.note && <p className="mt-3 whitespace-pre-wrap text-[10px] leading-5">{annotation.note}</p>}{annotation.user && <p className="mt-3 text-[8px] font-bold text-muted-foreground">Shared by {annotation.user.name}</p>}{owned && <div className="mt-3 flex justify-end gap-1 border-t border-border pt-2"><button onClick={() => onToggleShare(annotation)} className="flex h-7 items-center gap-1 rounded-lg px-2 text-[8px] font-bold text-muted-foreground hover:bg-muted"><RiShareLine />{annotation.isShared ? "Make private" : "Share"}</button><button onClick={() => onDelete(annotation.id)} className="flex h-7 items-center gap-1 rounded-lg px-2 text-[8px] font-bold text-rose-600 hover:bg-rose-500/10"><RiDeleteBinLine />Delete</button></div>}</article>;
}

function NoteModal({ resource, resources, annotationPath, defaultPage, onClose, onSaved }: { resource: Resource; resources: Resource[]; annotationPath: string; defaultPage: number; onClose: () => void; onSaved: () => void }) {
  const [highlight, setHighlight] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState(String(defaultPage));
  const [relatedId, setRelatedId] = useState("");
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const related = resources.find((item) => item.id === relatedId);
    const relatedText = related ? `\n\nRelated document: ${related.title}\n${annotationPath}?resourceId=${related.id}` : "";
    if (!highlight.trim() && !note.trim() && !related) return;
    setSaving(true);
    try {
      await annotationApi.create({ resourceId: resource.id, highlight: highlight.trim() || undefined, note: `${note.trim()}${relatedText}`.trim() || undefined, page: page ? Number(page) : undefined, isShared: shared });
      toast.success(shared ? "Shared note saved" : "Private note saved");
      onSaved();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not save note");
    } finally {
      setSaving(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"><div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-[9px] font-black uppercase tracking-wider text-teal-600">Reading note</p><h2 className="mt-1 text-[14px] font-black">{resource.title}</h2></div><button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted"><RiCloseLine /></button></div><div className="space-y-4 p-5"><Field label="Highlighted text"><textarea value={highlight} onChange={(event) => setHighlight(event.target.value)} rows={2} placeholder="Paste a memorable passage..." className="w-full resize-none rounded-xl border border-border bg-muted/20 p-3 text-[11px] outline-none focus:border-teal-500/50" /></Field><Field label="Your note"><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={5} placeholder="Write your understanding, question, or summary..." className="w-full resize-y rounded-xl border border-border bg-muted/20 p-3 text-[11px] outline-none focus:border-teal-500/50" /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Page number"><input type="number" min={1} value={page} onChange={(event) => setPage(event.target.value)} placeholder="Optional" className="h-10 w-full rounded-xl border border-border bg-muted/20 px-3 text-[11px] outline-none" /></Field><Field label="Related document"><select value={relatedId} onChange={(event) => setRelatedId(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-muted/20 px-3 text-[10px] outline-none"><option value="">No related document</option>{resources.filter((item) => item.id !== resource.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field></div><label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3"><span><span className="block text-[10px] font-black">Share this note</span><span className="mt-1 block text-[8px] text-muted-foreground">Other students with access can read it.</span></span><input type="checkbox" checked={shared} onChange={(event) => setShared(event.target.checked)} className="h-4 w-4 accent-teal-600" /></label></div><div className="flex justify-end gap-2 border-t border-border p-4"><button onClick={onClose} className="h-10 rounded-xl border border-border px-4 text-[10px] font-bold hover:bg-muted">Cancel</button><button onClick={save} disabled={saving || (!highlight.trim() && !note.trim() && !relatedId)} className="flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-5 text-[10px] font-bold text-white disabled:opacity-40">{saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}Save note</button></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>;
}

function EmptyState() {
  return <div className="flex flex-1 items-center justify-center p-8 text-center"><div><RiBookOpenLine className="mx-auto text-6xl text-muted-foreground/15" /><h2 className="mt-4 text-[14px] font-black">Choose a document to begin reading</h2><p className="mt-2 text-[10px] text-muted-foreground">Your accessible documents appear on the left.</p></div></div>;
}
