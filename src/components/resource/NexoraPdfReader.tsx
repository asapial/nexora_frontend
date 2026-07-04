"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiExpandHeightLine,
  RiExpandWidthLine,
  RiEyeLine,
  RiFileList2Line,
  RiFocus3Line,
  RiFullscreenLine,
  RiLoader4Line,
  RiMoonClearLine,
  RiPagesLine,
  RiRefreshLine,
  RiSearchLine,
  RiScrollToBottomLine,
  RiSunLine,
  RiZoomInLine,
  RiZoomOutLine,
} from "react-icons/ri";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const modeOptions: Array<{ mode: ReaderMode; label: string; icon: React.ReactNode }> = [
  { mode: "paper", label: "Paper view", icon: <RiSunLine /> },
  { mode: "soft", label: "Warm view", icon: <RiEyeLine /> },
  { mode: "night", label: "Night view", icon: <RiMoonClearLine /> },
];

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

  const pageCount = pdf?.numPages ?? 0;
  const pageProgress = pageCount ? (page / pageCount) * 100 : 0;

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
      const pageScale = Math.max(0.25, Math.min(widthScale, (containerSize.height - 96) / natural.height));
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

  const goToPage = useCallback((next: number) => {
    onPageChange(Math.min(Math.max(next, 1), pageCount || 1));
  }, [onPageChange, pageCount]);

  const toggleFullscreen = async () => {
    if (!rootRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await rootRef.current.requestFullscreen();
  };

  const stageClass = cn(
    readerMode === "paper" && "bg-[#eef0f3]",
    readerMode === "soft" && "bg-[#eee7d8]",
    readerMode === "night" && "bg-[#111114]",
  );
  const pageToneClass = cn(
    readerMode === "soft" && "brightness-[.96] sepia-[.16]",
    readerMode === "night" && "invert hue-rotate-180 brightness-[.84] contrast-[.92]",
  );

  return (
    <TooltipProvider delayDuration={120}>
      <div ref={rootRef} className="flex h-full min-h-[720px] flex-col overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200/80 bg-white/95 px-2.5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/95">
          <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-white/10 dark:bg-white/[.04]">
            <IconButton active={sidebar === "pages"} title="Page thumbnails" onClick={() => setSidebar(sidebar === "pages" ? null : "pages")}>
              <RiFileList2Line />
            </IconButton>
            <IconButton active={sidebar === "search"} title="Search document" onClick={() => setSidebar(sidebar === "search" ? null : "search")}>
              <RiSearchLine />
            </IconButton>
          </div>

          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-[12px] font-semibold leading-4">{title}</p>
            <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400">
              Page {page} of {pageCount || "..."}
            </p>
          </div>

          <div className="hidden items-center rounded-md border border-zinc-200 bg-zinc-50 p-0.5 sm:flex dark:border-white/10 dark:bg-white/[.04]">
            {modeOptions.map((option) => (
              <IconButton key={option.mode} active={readerMode === option.mode} title={option.label} onClick={() => setReaderMode(option.mode)}>
                {option.icon}
              </IconButton>
            ))}
          </div>

          <IconButton title="Rotate page" onClick={() => onRotationChange((rotation + 90) % 360)}>
            <RiRefreshLine />
          </IconButton>
          <IconButton title="Fullscreen" onClick={toggleFullscreen}>
            <RiFullscreenLine />
          </IconButton>
        </div>

        <div className="h-0.5 bg-zinc-200 dark:bg-white/10">
          <div className="h-full bg-teal-500 transition-all" style={{ width: `${pageProgress}%` }} />
        </div>

        <div className="flex min-h-0 flex-1">
          {sidebar && (
            <aside className="w-64 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white/95 p-3 dark:border-white/10 dark:bg-zinc-950/95 sm:w-56">
              {sidebar === "pages" ? (
                <div className="space-y-3">
                  <PanelHeading icon={<RiFileList2Line />} label={`${pageCount || 0} pages`} />
                  {pdf && Array.from({ length: pdf.numPages }, (_, index) => (
                    <Thumbnail key={index + 1} pdf={pdf} page={index + 1} active={page === index + 1} onClick={() => goToPage(index + 1)} />
                  ))}
                </div>
              ) : (
                <div>
                  <PanelHeading icon={<RiSearchLine />} label="Search" />
                  <form onSubmit={(event) => { event.preventDefault(); void searchDocument(); }} className="relative mt-3">
                    <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Find in document"
                      className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-8 pr-9 text-[11px] outline-none transition-colors focus:border-teal-500/60 dark:border-white/10 dark:bg-white/[.04]"
                    />
                    <button type="submit" title="Search" className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white transition-colors hover:bg-teal-600 dark:bg-white dark:text-zinc-950">
                      <RiArrowRightSLine />
                    </button>
                  </form>
                  <p className="my-3 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                    {searching ? "Searching..." : `${results.length} matching pages`}
                  </p>
                  <div className="space-y-2">
                    {results.map((result) => (
                      <button key={result.page} onClick={() => goToPage(result.page)} className="w-full rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-left transition-colors hover:border-teal-500/50 dark:border-white/10 dark:bg-white/[.04]">
                        <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-300">Page {result.page}</span>
                        <span className="mt-1 block text-[9px] leading-4 text-zinc-500 dark:text-zinc-400">...{result.snippet}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}

          <div className="relative min-h-0 flex-1">
            <div ref={viewportRef} className={cn("flex h-full min-h-0 flex-1 items-start justify-center overflow-auto px-4 py-8 pb-24 sm:px-8", stageClass)}>
              {readingLayout === "page" ? (
                <div className={cn("relative max-w-full bg-white shadow-[0_18px_60px_rgba(15,23,42,0.22)] ring-1 ring-zinc-950/10", pageToneClass)}>
                  <canvas ref={canvasRef} aria-label={`${title}, page ${page}`} className="block bg-white" />
                  {(loading || rendering) && (
                    <div className="absolute inset-0 flex min-h-96 items-center justify-center bg-white/85 text-zinc-700 backdrop-blur-sm">
                      <div className="text-center">
                        <RiLoader4Line className="mx-auto animate-spin text-2xl text-teal-600" />
                        <p className="mt-2 text-[10px] font-semibold">{loading ? "Opening document" : "Rendering page"}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : pdf ? (
                <div className="flex w-full flex-col items-center gap-5 pb-8">
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
                </div>
              ) : null}

              {!loading && !pdf && (
                <div className="flex min-h-96 items-center justify-center text-center">
                  <div>
                    <RiFocus3Line className="mx-auto text-4xl text-rose-400" />
                    <p className="mt-3 text-[11px] font-semibold">Nexora could not render this PDF.</p>
                  </div>
                </div>
              )}
            </div>

            <FloatingControls
              page={page}
              pageCount={pageCount}
              zoom={zoom}
              fitMode={fitMode}
              readingLayout={readingLayout}
              onPrevious={() => goToPage(page - 1)}
              onNext={() => goToPage(page + 1)}
              onZoomOut={() => {
                setFitMode("custom");
                onZoomChange(Math.max(50, zoom - 10));
              }}
              onZoomReset={() => {
                setFitMode("custom");
                onZoomChange(100);
              }}
              onZoomIn={() => {
                setFitMode("custom");
                onZoomChange(Math.min(250, zoom + 10));
              }}
              onFitWidth={() => setFitMode("width")}
              onFitPage={() => setFitMode("page")}
              onPageLayout={() => setReadingLayout("page")}
              onScrollLayout={() => {
                setReadingLayout("scroll");
                if (fitMode === "page") setFitMode("width");
              }}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function FloatingControls({
  page,
  pageCount,
  zoom,
  fitMode,
  readingLayout,
  onPrevious,
  onNext,
  onZoomOut,
  onZoomReset,
  onZoomIn,
  onFitWidth,
  onFitPage,
  onPageLayout,
  onScrollLayout,
}: {
  page: number;
  pageCount: number;
  zoom: number;
  fitMode: FitMode;
  readingLayout: ReadingLayout;
  onPrevious: () => void;
  onNext: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomIn: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onPageLayout: () => void;
  onScrollLayout: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1 rounded-lg border border-zinc-200/80 bg-white/90 p-1 shadow-[0_12px_36px_rgba(15,23,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/90">
        <IconButton title="Previous page" onClick={onPrevious}>
          <RiArrowLeftSLine />
        </IconButton>
        <span className="flex h-8 min-w-20 items-center justify-center rounded-md bg-zinc-100 px-2 text-[10px] font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
          {page} / {pageCount || "..."}
        </span>
        <IconButton title="Next page" onClick={onNext}>
          <RiArrowRightSLine />
        </IconButton>
        <Divider />
        <IconButton title="Zoom out" onClick={onZoomOut}>
          <RiZoomOutLine />
        </IconButton>
        <TextControl title="Actual size" active={fitMode === "custom"} onClick={onZoomReset}>
          {zoom}%
        </TextControl>
        <IconButton title="Zoom in" onClick={onZoomIn}>
          <RiZoomInLine />
        </IconButton>
        <Divider />
        <IconButton active={fitMode === "width"} title="Fit width" onClick={onFitWidth}>
          <RiExpandWidthLine />
        </IconButton>
        <IconButton active={fitMode === "page"} title="Fit page" onClick={onFitPage}>
          <RiExpandHeightLine />
        </IconButton>
        <Divider />
        <IconButton active={readingLayout === "page"} title="Single page" onClick={onPageLayout}>
          <RiPagesLine />
        </IconButton>
        <IconButton active={readingLayout === "scroll"} title="Continuous scroll" onClick={onScrollLayout}>
          <RiScrollToBottomLine />
        </IconButton>
      </div>
    </div>
  );
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

  return (
    <section ref={wrapperRef} aria-label={`Page ${page}`} className="relative max-w-full scroll-mt-8" style={{ width: size.width, minHeight: size.height }}>
      <div className={cn("absolute -left-12 top-2 hidden h-7 min-w-8 items-center justify-center rounded-md border px-2 text-[9px] font-semibold sm:flex", active ? "border-teal-500/40 bg-teal-500/15 text-teal-700 dark:text-teal-200" : "border-zinc-200 bg-white/80 text-zinc-500 dark:border-white/10 dark:bg-zinc-950/75")}>
        {page}
      </div>
      <div
        className={cn(
          "overflow-hidden bg-white shadow-[0_18px_60px_rgba(15,23,42,0.2)] ring-1 ring-zinc-950/10",
          active && "ring-2 ring-teal-500/50",
          readerMode === "soft" && "brightness-[.96] sepia-[.16]",
          readerMode === "night" && "invert hue-rotate-180 brightness-[.84] contrast-[.92]",
        )}
        style={{ width: size.width, minHeight: size.height }}
      >
        {nearViewport ? <canvas ref={canvasRef} className="block bg-white" /> : <div className="flex h-full min-h-96 items-center justify-center bg-white text-[10px] font-semibold text-zinc-400">Page {page}</div>}
      </div>
    </section>
  );
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

  return (
    <button onClick={onClick} className={cn("group w-full rounded-md border p-2 transition-colors", active ? "border-teal-500 bg-teal-500/10" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-white/10 dark:bg-white/[.04] dark:hover:border-white/20")}>
      <canvas ref={canvasRef} className="mx-auto max-w-full bg-white shadow-sm" />
      <span className={cn("mt-2 block text-[9px] font-semibold", active ? "text-teal-700 dark:text-teal-300" : "text-zinc-500")}>Page {page}</span>
    </button>
  );
}

function IconButton({ children, title, active = false, onClick }: { children: React.ReactNode; title: string; active?: boolean; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={title}
          title={title}
          onClick={onClick}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-[16px] transition-colors",
            active
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{title}</TooltipContent>
    </Tooltip>
  );
}

function TextControl({ children, title, active = false, onClick }: { children: React.ReactNode; title: string; active?: boolean; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={title}
          title={title}
          onClick={onClick}
          className={cn(
            "flex h-8 min-w-12 items-center justify-center rounded-md px-2 text-[10px] font-semibold transition-colors",
            active
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{title}</TooltipContent>
    </Tooltip>
  );
}

function PanelHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex h-8 items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      <span className="text-[15px]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-zinc-200 dark:bg-white/10" />;
}
