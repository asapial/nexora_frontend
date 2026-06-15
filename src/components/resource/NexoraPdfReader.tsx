"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFileList2Line,
  RiFocus3Line,
  RiFullscreenLine,
  RiLoader4Line,
  RiPagesLine,
  RiRefreshLine,
  RiSearchLine,
  RiScrollToBottomLine,
  RiSubtractLine,
  RiZoomInLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type PdfDocument = Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>>["promise"] extends Promise<infer T> ? T : never;
type ReaderMode = "paper" | "soft" | "night";
type FitMode = "custom" | "width" | "page";
type ReadingLayout = "page" | "scroll";

type NexoraPdfReaderProps = {
  source: string;
  title: string;
  page: number;
  zoom: number;
  rotation: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onLoaded?: () => void;
  onError?: () => void;
};

type SearchResult = { page: number; snippet: string };

export default function NexoraPdfReader({
  source,
  title,
  page,
  zoom,
  rotation,
  onPageChange,
  onZoomChange,
  onRotationChange,
  onLoaded,
  onError,
}: NexoraPdfReaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [sidebar, setSidebar] = useState<"pages" | "search" | null>("pages");
  const [fitMode, setFitMode] = useState<FitMode>("width");
  const [readerMode, setReaderMode] = useState<ReaderMode>("paper");
  const [readingLayout, setReadingLayout] = useState<ReadingLayout>("page");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 700 });

  useEffect(() => {
    onLoadedRef.current = onLoaded;
    onErrorRef.current = onError;
  }, [onError, onLoaded]);

  useEffect(() => {
    let active = true;
    let task: { destroy: () => Promise<void> } | null = null;
    setLoading(true);
    setPdf(null);
    void import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const loadingTask = pdfjs.getDocument({ url: source });
      task = loadingTask;
      return loadingTask.promise;
    }).then((document) => {
      if (!active) return;
      setPdf(document);
      setLoading(false);
      onLoadedRef.current?.();
    }).catch(() => {
      if (!active) return;
      setLoading(false);
      onErrorRef.current?.();
    });
    return () => {
      active = false;
      void task?.destroy();
    };
  }, [source]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!pdf || !canvas || readingLayout === "scroll") return;
    renderTaskRef.current?.cancel();
    setRendering(true);
    try {
      const pdfPage = await pdf.getPage(Math.min(Math.max(page, 1), pdf.numPages));
      const natural = pdfPage.getViewport({ scale: 1, rotation });
      const widthScale = Math.max(0.25, (containerSize.width - 64) / natural.width);
      const pageScale = Math.max(0.25, Math.min(widthScale, (containerSize.height - 64) / natural.height));
      const scale = fitMode === "width" ? widthScale : fitMode === "page" ? pageScale : zoom / 100;
      const viewport = pdfPage.getViewport({ scale, rotation });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const task = pdfPage.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      });
      renderTaskRef.current = task;
      await task.promise;
    } catch (error: unknown) {
      if (!(error instanceof Error && error.name === "RenderingCancelledException")) onErrorRef.current?.();
    } finally {
      setRendering(false);
    }
  }, [containerSize, fitMode, page, pdf, readingLayout, rotation, zoom]);

  useEffect(() => {
    void renderPage();
    return () => renderTaskRef.current?.cancel();
  }, [renderPage]);

  useEffect(() => {
    if (!pdf) return;
    if (page > pdf.numPages) onPageChange(pdf.numPages);
  }, [onPageChange, page, pdf]);

  const searchDocument = async () => {
    if (!pdf || !query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const needle = query.trim().toLowerCase();
    const matches: SearchResult[] = [];
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const pdfPage = await pdf.getPage(index);
      const content = await pdfPage.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ");
      const position = text.toLowerCase().indexOf(needle);
      if (position >= 0) {
        matches.push({
          page: index,
          snippet: text.slice(Math.max(0, position - 55), position + needle.length + 90),
        });
      }
    }
    setResults(matches);
    setSearching(false);
  };

  const goToPage = (next: number) => onPageChange(Math.min(Math.max(next, 1), pdf?.numPages ?? 1));
  const toggleFullscreen = async () => {
    if (!rootRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await rootRef.current.requestFullscreen();
  };

  return <div ref={rootRef} className="flex h-full min-h-[720px] flex-col bg-zinc-950 text-zinc-100">
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-zinc-950/95 p-2.5">
      <button onClick={() => setSidebar(sidebar === "pages" ? null : "pages")} className={toolClass(sidebar === "pages")} title="Page thumbnails"><RiFileList2Line /></button>
      <button onClick={() => setSidebar(sidebar === "search" ? null : "search")} className={toolClass(sidebar === "search")} title="Search document"><RiSearchLine /></button>
      <span className="mx-1 h-6 w-px bg-white/10" />
      <button onClick={() => goToPage(page - 1)} className={toolClass()} title="Previous page"><RiArrowLeftSLine /></button>
      <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black">Page {page} / {pdf?.numPages ?? "..."}</span>
      <button onClick={() => goToPage(page + 1)} className={toolClass()} title="Next page"><RiArrowRightSLine /></button>
      <span className="mx-1 h-6 w-px bg-white/10" />
      <button onClick={() => setReadingLayout("page")} className={toolClass(readingLayout === "page")} title="Read one page at a time"><RiPagesLine />Page</button>
      <button onClick={() => { setReadingLayout("scroll"); if (fitMode === "page") setFitMode("width"); }} className={toolClass(readingLayout === "scroll")} title="Read by continuously scrolling pages"><RiScrollToBottomLine />Scroll</button>
      <span className="mx-1 h-6 w-px bg-white/10" />
      <button onClick={() => { setFitMode("custom"); onZoomChange(Math.max(50, zoom - 10)); }} className={toolClass()} title="Zoom out"><RiSubtractLine /></button>
      <button onClick={() => { setFitMode("custom"); onZoomChange(100); }} className={toolClass(fitMode === "custom")}>{zoom}%</button>
      <button onClick={() => { setFitMode("custom"); onZoomChange(Math.min(250, zoom + 10)); }} className={toolClass()} title="Zoom in"><RiZoomInLine /></button>
      <button onClick={() => setFitMode("width")} className={toolClass(fitMode === "width")}>Fit width</button>
      <button onClick={() => setFitMode("page")} className={toolClass(fitMode === "page")}>Fit page</button>
      <button onClick={() => onRotationChange((rotation + 90) % 360)} className={toolClass()} title="Rotate"><RiRefreshLine /></button>
      <span className="mx-1 h-6 w-px bg-white/10" />
      {(["paper", "soft", "night"] as ReaderMode[]).map((mode) => <button key={mode} onClick={() => setReaderMode(mode)} className={toolClass(readerMode === mode)}>{mode}</button>)}
      <div className="flex-1" />
      <button onClick={toggleFullscreen} className={toolClass()} title="Fullscreen"><RiFullscreenLine /></button>
    </div>

    <div className="h-1 bg-white/5"><div className="h-full bg-teal-500 transition-all" style={{ width: `${pdf ? (page / pdf.numPages) * 100 : 0}%` }} /></div>

    <div className="flex min-h-0 flex-1">
      {sidebar && <aside className="w-56 shrink-0 overflow-y-auto border-r border-white/10 bg-zinc-950 p-3">
        {sidebar === "pages" ? <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{pdf?.numPages ?? 0} pages</p>
          {pdf && Array.from({ length: pdf.numPages }, (_, index) => <Thumbnail key={index + 1} pdf={pdf} page={index + 1} active={page === index + 1} onClick={() => goToPage(index + 1)} />)}
        </div> : <div>
          <form onSubmit={(event) => { event.preventDefault(); void searchDocument(); }} className="flex gap-1.5">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this paper" className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 text-[9px] outline-none focus:border-teal-500/50" />
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600"><RiSearchLine /></button>
          </form>
          <p className="my-3 text-[8px] font-bold uppercase text-zinc-500">{searching ? "Searching..." : `${results.length} matching pages`}</p>
          <div className="space-y-2">{results.map((result) => <button key={result.page} onClick={() => goToPage(result.page)} className="w-full rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-left hover:border-teal-500/40"><span className="text-[8px] font-black text-teal-400">Page {result.page}</span><span className="mt-1 block text-[8px] leading-4 text-zinc-400">...{result.snippet}...</span></button>)}</div>
        </div>}
      </aside>}

      <div ref={viewportRef} className={cn("relative flex min-h-0 flex-1 items-start justify-center overflow-auto p-8", readerMode === "paper" && "bg-zinc-800", readerMode === "soft" && "bg-[#ddd5c3]", readerMode === "night" && "bg-black")}>
        {readingLayout === "page" ? <div className={cn("relative shadow-2xl", readerMode === "soft" && "brightness-[.94] sepia-[.22]", readerMode === "night" && "invert hue-rotate-180 brightness-[.82] contrast-[.9]")}>
          <canvas ref={canvasRef} aria-label={`${title}, page ${page}`} className="block bg-white" />
          {(loading || rendering) && <div className="absolute inset-0 flex min-h-96 items-center justify-center bg-white/80 text-zinc-700"><div className="text-center"><RiLoader4Line className="mx-auto animate-spin text-2xl text-teal-600" /><p className="mt-2 text-[9px] font-black">{loading ? "Opening paper..." : "Rendering page..."}</p></div></div>}
        </div> : pdf ? <div className="flex w-full flex-col items-center gap-5 pb-8">
          {Array.from({ length: pdf.numPages }, (_, index) => (
            <ContinuousPage
              key={index + 1}
              pdf={pdf}
              page={index + 1}
              active={page === index + 1}
              containerWidth={containerSize.width}
              fitMode={fitMode}
              zoom={zoom}
              rotation={rotation}
              readerMode={readerMode}
              scrollRoot={viewportRef}
              onVisible={goToPage}
            />
          ))}
        </div> : null}
        {!loading && !pdf && <div className="flex min-h-96 items-center justify-center text-center"><div><RiFocus3Line className="mx-auto text-4xl text-rose-400" /><p className="mt-3 text-[10px] font-black">Nexora could not render this PDF.</p></div></div>}
      </div>
    </div>
  </div>;
}

function ContinuousPage({ pdf, page, active, containerWidth, fitMode, zoom, rotation, readerMode, scrollRoot, onVisible }: {
  pdf: PdfDocument;
  page: number;
  active: boolean;
  containerWidth: number;
  fitMode: FitMode;
  zoom: number;
  rotation: number;
  readerMode: ReaderMode;
  scrollRoot: React.RefObject<HTMLDivElement | null>;
  onVisible: (page: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [size, setSize] = useState({ width: 720, height: 960 });

  useEffect(() => {
    const element = wrapperRef.current;
    const root = scrollRoot.current;
    if (!element || !root) return;
    const lazyObserver = new IntersectionObserver(
      ([entry]) => setNearViewport(Boolean(entry?.isIntersecting)),
      { root, rootMargin: "1000px 0px" },
    );
    const pageObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onVisible(page);
      },
      { root, rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    lazyObserver.observe(element);
    pageObserver.observe(element);
    return () => {
      lazyObserver.disconnect();
      pageObserver.disconnect();
    };
  }, [onVisible, page, scrollRoot]);

  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    void pdf.getPage(page).then((pdfPage) => {
      if (cancelled) return;
      const natural = pdfPage.getViewport({ scale: 1, rotation });
      const widthScale = Math.max(0.25, (containerWidth - 96) / natural.width);
      const scale = fitMode === "custom" ? zoom / 100 : widthScale;
      const viewport = pdfPage.getViewport({ scale, rotation });
      setSize({ width: viewport.width, height: viewport.height });
      if (!nearViewport || !canvasRef.current) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const context = canvasRef.current.getContext("2d", { alpha: false });
      if (!context) return;
      canvasRef.current.width = Math.floor(viewport.width * ratio);
      canvasRef.current.height = Math.floor(viewport.height * ratio);
      canvasRef.current.style.width = `${Math.floor(viewport.width)}px`;
      canvasRef.current.style.height = `${Math.floor(viewport.height)}px`;
      task = pdfPage.render({
        canvas: canvasRef.current,
        canvasContext: context,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      });
      return task.promise;
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [containerWidth, fitMode, nearViewport, page, pdf, rotation, zoom]);

  return <section ref={wrapperRef} aria-label={`Page ${page}`} className="relative max-w-full" style={{ width: size.width, minHeight: size.height }}>
    <div className={cn("absolute -left-14 top-2 rounded-lg border px-2 py-1 text-[8px] font-black", active ? "border-teal-400/50 bg-teal-500/20 text-teal-200" : "border-white/10 bg-zinc-950/70 text-zinc-400")}>{page}</div>
    <div className={cn("overflow-hidden bg-white shadow-2xl", active && "ring-2 ring-teal-500/50", readerMode === "soft" && "brightness-[.94] sepia-[.22]", readerMode === "night" && "invert hue-rotate-180 brightness-[.82] contrast-[.9]")} style={{ width: size.width, minHeight: size.height }}>
      {nearViewport ? <canvas ref={canvasRef} className="block bg-white" /> : <div className="flex h-full min-h-96 items-center justify-center bg-white text-[9px] font-black text-zinc-400">Page {page}</div>}
    </div>
  </section>;
}

function Thumbnail({ pdf, page, active, onClick }: { pdf: PdfDocument; page: number; active: boolean; onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    void pdf.getPage(page).then((pdfPage) => {
      if (cancelled || !canvasRef.current) return;
      const natural = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: 150 / natural.width });
      const context = canvasRef.current.getContext("2d", { alpha: false });
      if (!context) return;
      canvasRef.current.width = viewport.width;
      canvasRef.current.height = viewport.height;
      renderTask = pdfPage.render({ canvas: canvasRef.current, canvasContext: context, viewport });
      return renderTask.promise;
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [page, pdf]);
  return <button onClick={onClick} className={cn("w-full rounded-xl border p-2 transition-colors", active ? "border-teal-500 bg-teal-500/10" : "border-white/10 hover:border-white/25")}><canvas ref={canvasRef} className="mx-auto max-w-full bg-white shadow" /><span className="mt-2 block text-[8px] font-black text-zinc-400">Page {page}</span></button>;
}

function toolClass(active = false) {
  return cn("flex h-8 items-center justify-center gap-1 rounded-lg border px-2.5 text-[8px] font-black capitalize transition-colors", active ? "border-teal-500/50 bg-teal-500/15 text-teal-300" : "border-white/10 bg-white/[.03] text-zinc-300 hover:bg-white/10");
}
