"use client";

import { useEffect, useRef, useState } from "react";
import { RiFilePdfLine, RiLoader4Line } from "react-icons/ri";

type Props = {
  fileUrl: string;
  title: string;
};

function readerDataUrl(fileUrl: string, title: string) {
  const params = new URLSearchParams({
    url: fileUrl,
    filename: title,
    inline: "true",
    reader: "true",
  });
  return `/api/resource/cloudinary-sign?${params.toString()}`;
}

export default function PdfFirstPageThumbnail({ fileUrl, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    let renderTask: { cancel: () => void } | null = null;

    setState("loading");
    void import("pdfjs-dist")
      .then(async (pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const currentLoadingTask = pdfjs.getDocument({ url: readerDataUrl(fileUrl, title) });
        loadingTask = currentLoadingTask;
        const pdf = await currentLoadingTask.promise;
        const page = await pdf.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.5, 560 / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || !active) return;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable");
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const currentRenderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        });
        renderTask = currentRenderTask;
        await currentRenderTask.promise;
        if (active) setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
      renderTask?.cancel();
      void loadingTask?.destroy();
    };
  }, [fileUrl, title]);

  return (
    <div className="relative flex h-48 w-full items-start justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      <canvas
        ref={canvasRef}
        aria-label={`First page preview of ${title}`}
        className={state === "ready" ? "min-h-full w-full object-cover object-top" : "hidden"}
      />
      {state === "loading" && (
        <div className="flex h-full items-center justify-center gap-2 text-xs font-bold text-muted-foreground">
          <RiLoader4Line className="animate-spin text-lg text-teal-500" />
          Preparing preview
        </div>
      )}
      {state === "error" && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <RiFilePdfLine className="text-5xl text-rose-400/80" />
          <span className="text-[10px] font-bold uppercase tracking-widest">PDF preview unavailable</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-zinc-950/90 to-transparent px-3 pb-2 pt-8 text-white">
        <span className="text-[9px] font-black uppercase tracking-wider">First page preview</span>
        <RiFilePdfLine className="text-lg text-rose-400" />
      </div>
    </div>
  );
}
