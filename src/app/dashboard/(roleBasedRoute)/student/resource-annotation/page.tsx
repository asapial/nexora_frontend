"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  RiAddLine,
  RiBookOpenLine,
  RiBrainLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiExternalLinkLine,
  RiFileTextLine,
  RiFocus3Line,
  RiLinksLine,
  RiLayoutLeftLine,
  RiLayoutRightLine,
  RiLoader4Line,
  RiMindMap,
  RiPlayCircleLine,
  RiRefreshLine,
  RiSearchLine,
  RiShareLine,
  RiStickyNoteLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { annotationApi, resourceAiApi } from "@/lib/api";
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

type ResourceAiStatus = {
  status: string;
  processingError?: string | null;
  lastProcessedAt?: string | null;
  text?: { status: string; pageCount?: number | null };
  summary?: { status: string; isVisible?: boolean };
  citations?: { status: string; count: number };
};

type ResourceSummary = {
  professionalSummary: string;
  goals?: string | null;
  methods?: string | null;
  results?: string | null;
  conclusions?: string | null;
  keyContributions: string[];
  limitations: string[];
  keywords: string[];
  isVisible?: boolean;
};

type CitationTarget = {
  type: "internal" | "external" | "unresolved";
  id?: string;
  title?: string;
  authors?: string | string[] | null;
  publicationYear?: number | null;
  year?: number | null;
  doi?: string | null;
  url?: string | null;
};

type ResourceCitation = {
  id: string;
  confidenceScore?: number | null;
  rawReference?: string | null;
  referenceIndex?: number | null;
  resolverSource?: string | null;
  target: CitationTarget;
};

type ResourceGraph = {
  nodes: Array<{ id: string; type: string; label: string; data?: Record<string, unknown> }>;
  edges: Array<{ id: string; source: string; target: string; confidenceScore?: number | null; label?: string }>;
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
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiTab, setAiTab] = useState<"summary" | "citations" | "graph">("summary");
  const [aiStatus, setAiStatus] = useState<ResourceAiStatus | null>(null);
  const [aiSummary, setAiSummary] = useState<ResourceSummary | null>(null);
  const [citations, setCitations] = useState<ResourceCitation[]>([]);
  const [graph, setGraph] = useState<ResourceGraph | null>(null);

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

  const loadAiFeatures = useCallback(async (resource: Resource) => {
    if (!isPdf(resource)) {
      setAiStatus(null);
      setAiSummary(null);
      setCitations([]);
      setGraph(null);
      return;
    }
    setAiLoading(true);
    try {
      const [statusResponse, summaryResponse, citationsResponse, graphResponse] = await Promise.all([
        resourceAiApi.status(resource.id),
        resourceAiApi.summary(resource.id),
        resourceAiApi.citations(resource.id),
        resourceAiApi.graph(resource.id, { includeExternal: "true", minConfidence: "0", limit: "50" }),
      ]);
      setAiStatus(statusResponse.data ?? null);
      setAiSummary(summaryResponse.data?.summary ?? null);
      setCitations(Array.isArray(citationsResponse.data) ? citationsResponse.data : []);
      setGraph(graphResponse.data ?? null);
    } catch (error: unknown) {
      setAiStatus(null);
      setAiSummary(null);
      setCitations([]);
      setGraph(null);
      toast.error(error instanceof Error ? error.message : "Could not load AI reading features");
    } finally {
      setAiLoading(false);
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
        if (initial) void loadAiFeatures(initial);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not load your accessible resources");
      })
      .finally(() => setLoadingResources(false));
  }, [initialResourceId, loadAiFeatures, loadAnnotations]);

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
    void loadAiFeatures(resource);
  };

  const processAi = async (mode: "full" | "summary" | "citations" = "full") => {
    if (!selected) return;
    setAiProcessing(true);
    try {
      if (mode === "summary") await resourceAiApi.regenerateSummary(selected.id);
      else if (mode === "citations") await resourceAiApi.reanalyzeCitations(selected.id);
      else await resourceAiApi.process(selected.id);
      toast.success("AI reading features updated");
      await loadAiFeatures(selected);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "AI processing failed");
    } finally {
      setAiProcessing(false);
    }
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
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-zinc-100 text-foreground dark:bg-zinc-950">
      <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-background/95 py-2">
        <RailButton title="Documents" active={documentsOpen} onClick={() => setDocumentsOpen((value) => !value)}><RiBookOpenLine /></RailButton>
        <RailButton title="Notes" active={notesOpen} onClick={() => setNotesOpen((value) => !value)}><RiStickyNoteLine /></RailButton>
        <RailButton title="AI reading" active={aiOpen} onClick={() => setAiOpen((value) => !value)}><RiBrainLine /></RailButton>
        <RailButton title="Focus" active={focusMode} onClick={() => setFocusMode((value) => !value)}><RiFocus3Line /></RailButton>
        <span className="my-1 h-px w-6 bg-border" />
        <Link href={libraryHref} title="Resource library" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><RiBookOpenLine /></Link>
        <Link href={uploadHref} title="Upload resource" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><RiAddLine /></Link>
      </aside>

      <div className={cn(
        "grid min-w-0 flex-1",
        focusMode || (!documentsOpen && !notesOpen)
          ? "grid-cols-1"
          : documentsOpen && notesOpen
            ? "xl:grid-cols-[260px_minmax(0,1fr)_300px]"
            : documentsOpen
              ? "xl:grid-cols-[260px_minmax(0,1fr)]"
              : "xl:grid-cols-[minmax(0,1fr)_300px]",
      )}>
        {!focusMode && documentsOpen && <DocumentLibrary resources={visibleResources} selected={selected} search={search} loading={loadingResources} onSearch={setSearch} onChoose={chooseResource} />}

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-background">
          {selected ? <ReaderWorkspace
            resource={selected}
            readerUrl={readerUrl}
            readerLoading={readerLoading}
            readerError={readerError}
            currentPage={currentPage}
            zoom={zoom}
            rotation={rotation}
            focusMode={focusMode}
            documentsOpen={documentsOpen}
            notesOpen={notesOpen}
            onGoToPage={goToPage}
            onZoom={setZoom}
            onRotate={() => setRotation((value) => (value + 90) % 360)}
            onToggleFocus={() => setFocusMode((value) => !value)}
            onToggleDocuments={() => setDocumentsOpen((value) => !value)}
            onToggleNotes={() => setNotesOpen((value) => !value)}
            onLoaded={() => setReaderLoading(false)}
            onError={() => { setReaderLoading(false); setReaderError(true); }}
            onRetry={retryReader}
            onAddNote={() => setShowNote(true)}
            aiOpen={aiOpen}
            aiLoading={aiLoading}
            aiProcessing={aiProcessing}
            aiTab={aiTab}
            aiStatus={aiStatus}
            aiSummary={aiSummary}
            citations={citations}
            graph={graph}
            onToggleAi={() => setAiOpen((value) => !value)}
            onAiTab={setAiTab}
            onProcessAi={processAi}
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
  return <aside className="flex min-h-0 flex-col overflow-hidden border-r border-border bg-background">
    <div className="border-b border-border p-3">
      <div className="flex h-8 items-center gap-2 text-[11px] font-semibold"><RiBookOpenLine className="text-muted-foreground" />Documents</div>
      <div className="relative mt-2"><RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search" className="h-8 w-full rounded-md border border-border bg-muted/20 pl-8 pr-2 text-[11px] outline-none focus:border-teal-500/50" /></div>
    </div>
    <div className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
      {loading ? Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />) : resources.length ? resources.map((resource) => (
        <button key={resource.id} onClick={() => onChoose(resource)} className={cn("flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors", selected?.id === resource.id ? "bg-teal-500/10 text-teal-700 dark:text-teal-200" : "hover:bg-muted")}>
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[8px] font-black uppercase", isPdf(resource) ? "bg-rose-500/10 text-rose-600" : "bg-sky-500/10 text-sky-600")}>{isPdf(resource) ? "PDF" : resource.fileType.slice(0, 4)}</span>
          <span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{resource.title}</span><span className="mt-0.5 block text-[8px] font-bold uppercase text-muted-foreground">{resource.visibility ?? "Accessible"}</span></span>
        </button>
      )) : <p className="p-4 text-center text-[10px] text-muted-foreground">No documents</p>}
    </div>
  </aside>;
}

function ReaderWorkspace({ resource, readerUrl, readerLoading, readerError, currentPage, zoom, rotation, focusMode, documentsOpen, notesOpen, aiOpen, aiLoading, aiProcessing, aiTab, aiStatus, aiSummary, citations, graph, onGoToPage, onZoom, onRotate, onToggleFocus, onToggleDocuments, onToggleNotes, onToggleAi, onAiTab, onProcessAi, onLoaded, onError, onRetry, onAddNote }: {
  resource: Resource;
  readerUrl: string;
  readerLoading: boolean;
  readerError: boolean;
  currentPage: number;
  zoom: number;
  rotation: number;
  focusMode: boolean;
  documentsOpen: boolean;
  notesOpen: boolean;
  aiOpen: boolean;
  aiLoading: boolean;
  aiProcessing: boolean;
  aiTab: "summary" | "citations" | "graph";
  aiStatus: ResourceAiStatus | null;
  aiSummary: ResourceSummary | null;
  citations: ResourceCitation[];
  graph: ResourceGraph | null;
  onGoToPage: (page: number) => void;
  onZoom: React.Dispatch<React.SetStateAction<number>>;
  onRotate: () => void;
  onToggleFocus: () => void;
  onToggleDocuments: () => void;
  onToggleNotes: () => void;
  onToggleAi: () => void;
  onAiTab: (tab: "summary" | "citations" | "graph") => void;
  onProcessAi: (mode?: "full" | "summary" | "citations") => void;
  onLoaded: () => void;
  onError: () => void;
  onRetry: () => void;
  onAddNote: () => void;
}) {
  const pdf = isPdf(resource);
  return <>
    <div className="flex h-12 items-center gap-1 border-b border-border bg-background/95 px-2 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-600"><RiFileTextLine /></span>
        <div className="min-w-0">
          <h2 className="truncate text-[12px] font-semibold">{resource.title}</h2>
          <p className="text-[8px] font-bold uppercase text-muted-foreground">{resource.fileType} / {resource.visibility ?? "Accessible"}</p>
        </div>
      </div>
      <ToolbarButton title={documentsOpen ? "Collapse accessible documents" : "Show accessible documents"} active={documentsOpen} onClick={onToggleDocuments}><RiLayoutLeftLine /></ToolbarButton>
      <ToolbarButton title={notesOpen ? "Collapse notes" : "Show notes"} active={notesOpen} onClick={onToggleNotes}><RiLayoutRightLine /></ToolbarButton>
      {pdf && <ToolbarButton title={aiOpen ? "Hide AI reading panel" : "Show AI reading panel"} active={aiOpen} onClick={onToggleAi}><RiBrainLine /></ToolbarButton>}
      <ToolbarButton title="Focus reading mode (F)" active={focusMode} onClick={onToggleFocus}><RiFocus3Line /></ToolbarButton>
      <a href={signedUrl(resource, false)} title="Download" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"><RiDownloadLine /></a>
      <button onClick={onAddNote} title="Add note" className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white hover:bg-teal-700"><RiStickyNoteLine /></button>
    </div>
    <div className="relative flex-1 overflow-auto bg-zinc-100 p-3 dark:bg-zinc-950">
      {pdf ? <div className={cn("mx-auto grid min-h-[680px] items-start gap-4", aiOpen ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1")}>
        <div className="relative min-h-[680px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          {readerUrl && <NexoraPdfReader source={readerUrl} title={resource.title} page={currentPage} zoom={zoom} rotation={rotation} onPageChange={onGoToPage} onZoomChange={onZoom} onRotationChange={onRotate} onLoaded={onLoaded} onError={onError} />}
          {readerLoading && <ReaderLoading />}
          {readerError && <ReaderError onRetry={onRetry} />}
        </div>
        {aiOpen && <AiReadingPanel
          loading={aiLoading}
          processing={aiProcessing}
          activeTab={aiTab}
          status={aiStatus}
          summary={aiSummary}
          citations={citations}
          graph={graph}
          onTab={onAiTab}
          onProcess={onProcessAi}
        />}
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
  return <button title={title} onClick={onClick} className={cn("flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors", active ? "border-teal-500/30 bg-teal-500/10 text-teal-600" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>{children}</button>;
}

function RailButton({ children, title, active, onClick }: { children: React.ReactNode; title: string; active?: boolean; onClick: () => void }) {
  return <button title={title} onClick={onClick} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors", active ? "bg-teal-500/10 text-teal-600" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{children}</button>;
}

function ReaderLoading() {
  return <div className="absolute inset-0 flex items-center justify-center bg-white/95"><div className="text-center"><RiLoader4Line className="mx-auto animate-spin text-3xl text-teal-600" /><p className="mt-3 text-[10px] font-black text-zinc-700">Opening paper...</p><p className="mt-1 text-[8px] text-zinc-500">Preparing secure PDF reader</p></div></div>;
}

function ReaderError({ onRetry }: { onRetry: () => void }) {
  return <div className="absolute inset-0 flex items-center justify-center bg-white p-8 text-center"><div><RiFileTextLine className="mx-auto text-5xl text-rose-300" /><p className="mt-4 text-[12px] font-black text-zinc-800">The paper could not be opened</p><p className="mt-2 max-w-sm text-[9px] leading-5 text-zinc-500">Retry the secure in-app reader. The paper will not be sent to the browser download manager.</p><div className="mt-4 flex justify-center"><button onClick={onRetry} className="flex h-9 items-center gap-2 rounded-xl bg-teal-600 px-4 text-[9px] font-bold text-white"><RiRefreshLine />Retry</button></div></div></div>;
}

function AiReadingPanel({ loading, processing, activeTab, status, summary, citations, graph, onTab, onProcess }: {
  loading: boolean;
  processing: boolean;
  activeTab: "summary" | "citations" | "graph";
  status: ResourceAiStatus | null;
  summary: ResourceSummary | null;
  citations: ResourceCitation[];
  graph: ResourceGraph | null;
  onTab: (tab: "summary" | "citations" | "graph") => void;
  onProcess: (mode?: "full" | "summary" | "citations") => void;
}) {
  return <aside className="flex max-h-[760px] min-h-[680px] flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950 text-zinc-100 shadow-xl">
    <div className="border-b border-white/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-teal-300"><RiBrainLine />AI reading</p>
          <p className="mt-1 text-[8px] text-zinc-500">Verify generated content with the original PDF.</p>
        </div>
        <button disabled={processing} onClick={() => onProcess(activeTab === "summary" ? "summary" : activeTab === "citations" ? "citations" : "full")} className="flex h-8 items-center gap-1.5 rounded-lg bg-teal-600 px-3 text-[8px] font-black text-white disabled:opacity-50">
          {processing ? <RiLoader4Line className="animate-spin" /> : <RiPlayCircleLine />}Process
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 rounded-lg border border-white/10 p-1">
        {([
          ["summary", <RiBrainLine key="s" />, "Summary"],
          ["citations", <RiLinksLine key="c" />, "Refs"],
          ["graph", <RiMindMap key="g" />, "Graph"],
        ] as const).map(([tab, icon, label]) => (
          <button key={tab} onClick={() => onTab(tab)} className={cn("flex h-8 items-center justify-center gap-1 rounded-md text-[8px] font-black", activeTab === tab ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-white/10")}>{icon}{label}</button>
        ))}
      </div>
      <StatusStrip status={status} loading={loading} />
    </div>
    <div className="flex-1 overflow-y-auto p-3">
      {loading ? <AiSkeleton /> : activeTab === "summary" ? <SummaryPanel summary={summary} onRegenerate={() => onProcess("summary")} processing={processing} /> : activeTab === "citations" ? <CitationList citations={citations} onReanalyze={() => onProcess("citations")} processing={processing} /> : <CitationGraph graph={graph} citations={citations} />}
    </div>
  </aside>;
}

function StatusStrip({ status, loading }: { status: ResourceAiStatus | null; loading: boolean }) {
  const label = loading ? "Loading" : status?.status ?? "Not processed";
  const tone = label === "FAILED" ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : label.includes("READY") || label === "GRAPH_READY" ? "border-teal-500/30 bg-teal-500/10 text-teal-300" : "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return <div className={cn("mt-3 rounded-lg border px-3 py-2 text-[8px] font-black uppercase tracking-wider", tone)}>
    <div className="flex items-center justify-between gap-2"><span>{label.replaceAll("_", " ")}</span><span>{status?.citations?.count ?? 0} refs</span></div>
    {status?.processingError && <p className="mt-1 normal-case tracking-normal text-rose-200">{status.processingError}</p>}
  </div>;
}

function AiSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-white/10" />)}</div>;
}

function SummaryPanel({ summary, processing, onRegenerate }: { summary: ResourceSummary | null; processing: boolean; onRegenerate: () => void }) {
  if (!summary) {
    return <EmptyAiState icon={<RiBrainLine />} title="No summary yet" text="Process this PDF to create a structured academic summary." actionLabel="Generate summary" loading={processing} onAction={onRegenerate} />;
  }
  const sections = [
    ["Goals", summary.goals],
    ["Methods", summary.methods],
    ["Results", summary.results],
    ["Conclusions", summary.conclusions],
  ].filter(([, value]) => value);
  return <div className="space-y-3">
    <div className="rounded-lg border border-teal-500/20 bg-teal-500/10 p-3">
      <p className="text-[8px] font-black uppercase text-teal-300">Professional summary</p>
      <p className="mt-2 text-[10px] leading-5 text-zinc-100">{summary.professionalSummary}</p>
    </div>
    {sections.map(([label, value]) => <section key={label} className="rounded-lg border border-white/10 p-3"><p className="text-[8px] font-black uppercase text-zinc-500">{label}</p><p className="mt-1 text-[9px] leading-5 text-zinc-300">{value}</p></section>)}
    <ChipSection label="Contributions" items={summary.keyContributions} />
    <ChipSection label="Limitations" items={summary.limitations} />
    <ChipSection label="Keywords" items={summary.keywords} compact />
    <button disabled={processing} onClick={onRegenerate} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-[8px] font-black hover:bg-white/10 disabled:opacity-50">{processing ? <RiLoader4Line className="animate-spin" /> : <RiRefreshLine />}Regenerate summary</button>
  </div>;
}

function ChipSection({ label, items, compact = false }: { label: string; items: string[]; compact?: boolean }) {
  if (!items.length) return null;
  return <section className="rounded-lg border border-white/10 p-3"><p className="text-[8px] font-black uppercase text-zinc-500">{label}</p><div className="mt-2 flex flex-wrap gap-1.5">{items.map((item) => <span key={item} className={cn("rounded-full border border-white/10 bg-white/5 text-zinc-300", compact ? "px-2 py-1 text-[8px]" : "px-2.5 py-1.5 text-[9px]")}>{item}</span>)}</div></section>;
}

function CitationList({ citations, processing, onReanalyze }: { citations: ResourceCitation[]; processing: boolean; onReanalyze: () => void }) {
  if (!citations.length) return <EmptyAiState icon={<RiLinksLine />} title="No references extracted" text="Process or reanalyze the PDF to parse its reference section." actionLabel="Analyze references" loading={processing} onAction={onReanalyze} />;
  return <div className="space-y-2">
    <button disabled={processing} onClick={onReanalyze} className="mb-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-[8px] font-black hover:bg-white/10 disabled:opacity-50">{processing ? <RiLoader4Line className="animate-spin" /> : <RiRefreshLine />}Reanalyze citations</button>
    {citations.map((citation) => <article key={citation.id} className="rounded-lg border border-white/10 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-black leading-4 text-zinc-100">{citation.target.title ?? "Unresolved reference"}</p>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[7px] font-black uppercase text-zinc-400">{Math.round((citation.confidenceScore ?? 0) * 100)}%</span>
      </div>
      <p className="mt-1 text-[8px] uppercase text-zinc-500">{citation.target.type}{citation.target.publicationYear || citation.target.year ? ` · ${citation.target.publicationYear ?? citation.target.year}` : ""}</p>
      {citation.target.doi && <p className="mt-2 break-all text-[8px] text-teal-300">doi:{citation.target.doi}</p>}
      {citation.target.url && <a href={citation.target.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[8px] font-black text-sky-300 hover:text-sky-200">Open source</a>}
      {citation.rawReference && <p className="mt-2 line-clamp-3 text-[8px] leading-4 text-zinc-500">{citation.rawReference}</p>}
    </article>)}
  </div>;
}

function CitationGraph({ graph, citations }: { graph: ResourceGraph | null; citations: ResourceCitation[] }) {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  if (!nodes.length || edges.length === 0) return <EmptyAiState icon={<RiMindMap />} title="Graph unavailable" text={citations.length ? "No graph edges matched the current filters." : "Analyze references to build a connected-paper graph."} />;
  const center = { x: 160, y: 150 };
  const related = nodes.filter((node) => node.type !== "current-resource");
  const positions = new Map<string, { x: number; y: number }>();
  positions.set(nodes[0].id, center);
  related.forEach((node, index) => {
    const angle = (index / Math.max(related.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions.set(node.id, { x: center.x + Math.cos(angle) * 110, y: center.y + Math.sin(angle) * 105 });
  });
  return <div className="space-y-3">
    <div className="rounded-lg border border-white/10 bg-white/[.03] p-2">
      <svg viewBox="0 0 320 300" className="h-[300px] w-full">
        {edges.map((edge) => {
          const source = positions.get(edge.source);
          const target = positions.get(edge.target);
          if (!source || !target) return null;
          return <line key={edge.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={edge.confidenceScore && edge.confidenceScore < 0.7 ? "#f59e0b" : "#14b8a6"} strokeWidth="1.4" strokeDasharray={edge.confidenceScore && edge.confidenceScore < 0.7 ? "4 4" : undefined} />;
        })}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const current = node.type === "current-resource";
          return <g key={node.id}>
            <circle cx={pos.x} cy={pos.y} r={current ? 28 : 20} fill={current ? "#14b8a6" : node.type === "internal-resource" ? "#38bdf8" : "#18181b"} stroke={current ? "#99f6e4" : "#71717a"} strokeWidth="2" />
            <text x={pos.x} y={pos.y + (current ? 42 : 34)} textAnchor="middle" fill="#e4e4e7" fontSize="8" fontWeight="700">{node.label.slice(0, 24)}</text>
          </g>;
        })}
      </svg>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center text-[8px] font-black uppercase text-zinc-400"><span>{nodes.length} nodes</span><span>{edges.length} edges</span><span>1 hop</span></div>
  </div>;
}

function EmptyAiState({ icon, title, text, actionLabel, loading, onAction }: { icon: React.ReactNode; title: string; text: string; actionLabel?: string; loading?: boolean; onAction?: () => void }) {
  return <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-white/15 p-6 text-center">
    <div>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-zinc-400">{icon}</div>
      <p className="mt-3 text-[11px] font-black">{title}</p>
      <p className="mx-auto mt-1 max-w-52 text-[9px] leading-4 text-zinc-500">{text}</p>
      {actionLabel && onAction && <button disabled={loading} onClick={onAction} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-[8px] font-black text-white disabled:opacity-50">{loading ? <RiLoader4Line className="animate-spin" /> : <RiPlayCircleLine />}{actionLabel}</button>}
    </div>
  </div>;
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
