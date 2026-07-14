"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  RiAddLine,
  RiAlertLine,
  RiBookOpenLine,
  RiBrainLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiFileTextLine,
  RiFocus3Line,
  RiLinksLine,
  RiLayoutLeftLine,
  RiLoader4Line,
  RiMindMap,
  RiPlayCircleLine,
  RiRefreshLine,
  RiSearchLine,
  RiShareLine,
  RiSparklingLine,
  RiStickyNoteLine,
  RiTimeLine,
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
  graph?: { status: string; provider?: string; generatedAt?: string | null };
};

// Preview envelope returned by GET /api/resource/:id/extracted-text-preview.
// `status === "PENDING"` means the PDF hasn't been text-extracted yet.
type ExtractedTextPreview =
  | {
      resourceId: string;
      title: string;
      fileType: string;
      status: "PENDING";
      preview: null;
      pageCount: null;
      totalChars: 0;
    }
  | {
      resourceId: string;
      title: string;
      fileType: string;
      status: "READY";
      preview: string;
      pageCount: number | null;
      language?: string | null;
      totalChars: number;
      truncated: boolean;
      updatedAt?: string;
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
  // Native Bangla (বাংলা) mirrors — always populated server-side either by the
  // bilingual AI prompt, the translation fallback, or an English→Bangla mirror
  // so the UI never renders an empty Bangla column.
  professionalSummaryBn?: string | null;
  goalsBn?: string | null;
  methodsBn?: string | null;
  resultsBn?: string | null;
  conclusionsBn?: string | null;
  keyContributionsBn?: string[];
  limitationsBn?: string[];
  keywordsBn?: string[];
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
  verifiedUrl?: string | null;
  linkVerified?: boolean;
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
  edges: Array<{ id: string; source: string; target: string; type?: string; confidenceScore?: number | null; label?: string }>;
  generatedAt?: string | null;
  provider?: string;
  providerPaperId?: string | null;
  citationCount?: number | null;
  warning?: string | null;
  stats?: { references: number; citedBy: number; secondLayer: number; related: number };
};

type AiFeatureErrors = Partial<Record<"status" | "summary" | "citations" | "graph", string>>;
type LoadAiOptions = { preserveContent?: boolean; silent?: boolean };
type WorkspaceMode = "read" | "study" | "research" | "graph";

// The backend getSummary() returns this envelope inside response.data:
type SummaryEnvelope = {
  resourceId: string;
  status: string;
  processingError: string | null;
  summaryStatus: "COMPLETED" | "HIDDEN" | "PENDING" | "FAILED" | string;
  summary: ResourceSummary | null;
  documentIdentity?: {
    storedTitle: string;
    detectedTitle: string;
    detectedAuthors: string[];
    sourceType: "FULL_PAPER" | "RESEARCH_SUMMARY" | "EXTRACTED_TEXT";
    titleMismatch: boolean;
    warning?: string | null;
  };
};

// ─── AI status classification ────────────────────────────────────────────────
// Processing: backend is actively working — show spinner
const AI_PROCESSING_STATUSES = new Set(["TEXT_PROCESSING", "SUMMARY_PROCESSING", "CITATION_PROCESSING", "GRAPH_PROCESSING"]);
// Ready states that are NOT yet final (pipeline still has more steps)
const AI_INTERMEDIATE_STATUSES = new Set(["TEXT_EXTRACTED", "SUMMARY_READY"]);
// Terminal: job is done (either success or failure) — stop polling.
// SUMMARY_READY is included because the /summary/regenerate endpoint ends
// its job at that state (no citations step follows in summary-only mode).
// Without it the polling loop runs forever after a successful summary.
const AI_TERMINAL_STATUSES = new Set(["GRAPH_READY", "CITATIONS_READY", "SUMMARY_READY", "FAILED"]);
// Any "good" terminal state
const AI_READY_STATUSES = new Set(["SUMMARY_READY", "CITATIONS_READY", "GRAPH_READY"]);

const isAiProcessingStatus = (status?: string | null) =>
  Boolean(status && (AI_PROCESSING_STATUSES.has(status) || AI_INTERMEDIATE_STATUSES.has(status)));
const isAiReadyStatus = (status?: string | null) => Boolean(status && AI_READY_STATUSES.has(status));
const isAiTerminalStatus = (status?: string | null) => Boolean(status && AI_TERMINAL_STATUSES.has(status));


const aiStatusLabel = (status?: string | null) => {
  if (status === "TEXT_PROCESSING" || status === "TEXT_EXTRACTED") return "Extracting text";
  if (status === "SUMMARY_PROCESSING") return "Generating summary";
  if (status === "CITATION_PROCESSING") return "Analyzing references";
  if (status === "GRAPH_PROCESSING") return "Building research graph";
  if (isAiReadyStatus(status)) return "Ready";
  if (status === "FAILED") return "Failed";
  return "Not processed";
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

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

// ─── Defensive data extractors ──────────────────────────────────────────────
// These handle varied backend response shapes to prevent silent failures.

function extractCitations(data: unknown): ResourceCitation[] {
  if (Array.isArray(data)) return data as ResourceCitation[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.citations)) return obj.citations as ResourceCitation[];
    if (Array.isArray(obj.data)) return obj.data as ResourceCitation[];
  }
  return [];
}

function extractGraph(data: unknown): ResourceGraph | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  // May be { nodes, edges } directly, or { graph: { nodes, edges } }
  if (Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
    return obj as unknown as ResourceGraph;
  }
  if (obj.graph && typeof obj.graph === "object") {
    const g = obj.graph as Record<string, unknown>;
    if (Array.isArray(g.nodes) && Array.isArray(g.edges)) {
      return g as unknown as ResourceGraph;
    }
  }
  return null;
}

const graphEdgeRelation = (edge: ResourceGraph["edges"][number]) =>
  String(edge.type ?? edge.label ?? "REFERENCES").toUpperCase().replaceAll(" ", "_");

// ─── Deterministic literature-tree layout ───────────────────────────────────
// References sit to the left of the selected paper; direct citing papers are
// its first child column; citations of those papers form the second child
// column. Related work branches beneath the root.
type GraphLayoutMode = "lineage" | "constellation";

function runGraphLayout(
  nodes: ResourceGraph["nodes"],
  mode: GraphLayoutMode,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const currentNode = nodes.find((n) => n.type === "current-resource") ?? nodes[0];
  const relation = (node: ResourceGraph["nodes"][number]) => String(node.data?.relation ?? "");
  const depth = (node: ResourceGraph["nodes"][number]) => Number(node.data?.depth ?? 0);
  const references = nodes.filter((node) => node.id !== currentNode?.id && (node.type === "reference-paper" || relation(node) === "REFERENCES" || node.type === "external-resource" || node.type === "internal-resource"));
  const firstLayer = nodes.filter((node) => node.id !== currentNode?.id && relation(node) === "CITED_BY" && depth(node) <= 1);
  const secondLayer = nodes.filter((node) => node.id !== currentNode?.id && relation(node) === "CITED_BY" && depth(node) >= 2);
  const related = nodes.filter((node) => node.id !== currentNode?.id && (node.type === "related-paper" || relation(node) === "RELATED"));
  const assigned = new Set([currentNode?.id, ...references.map((n) => n.id), ...firstLayer.map((n) => n.id), ...secondLayer.map((n) => n.id), ...related.map((n) => n.id)]);
  firstLayer.push(...nodes.filter((node) => !assigned.has(node.id)));

  if (mode === "constellation") {
    const placeOrbit = (items: ResourceGraph["nodes"], startAngle: number, endAngle: number, baseRadius: number, perRing: number) => {
      items.forEach((node, index) => {
        const ring = Math.floor(index / perRing);
        const ringItems = Math.min(perRing, items.length - ring * perRing);
        const slot = index % perRing;
        const angle = ringItems === 1
          ? (startAngle + endAngle) / 2
          : startAngle + (endAngle - startAngle) * (slot / (ringItems - 1));
        const radians = angle * Math.PI / 180;
        const radius = baseRadius + ring * 245;
        positions.set(node.id, {
          x: Math.cos(radians) * radius,
          y: Math.sin(radians) * radius * 0.82,
        });
      });
    };
    placeOrbit(references, 125, 235, 390, 12);
    placeOrbit(firstLayer, -52, 52, 430, 10);
    placeOrbit(secondLayer, -42, 42, 760, 12);
    placeOrbit(related, 65, 115, 430, 10);
    if (currentNode) positions.set(currentNode.id, { x: 0, y: 0 });
    return positions;
  }

  const gap = 132;
  const placeColumn = (items: ResourceGraph["nodes"], x: number, startY = 0) => {
    items.forEach((node, index) => positions.set(node.id, { x, y: startY + index * gap }));
  };
  const mainHeight = Math.max(references.length, firstLayer.length, secondLayer.length, 1) * gap;
  placeColumn(references, 0);
  placeColumn(firstLayer, 720);
  placeColumn(secondLayer, 1080);
  placeColumn(related, 360, mainHeight + 150);
  if (currentNode) positions.set(currentNode.id, { x: 360, y: Math.max(0, mainHeight / 2 - 40) });
  return positions;
}

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
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("research");
  const [documentPanelWidth, setDocumentPanelWidth] = useState(272);
  const [utilityPanelWidth, setUtilityPanelWidth] = useState(440);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiTab, setAiTab] = useState<"summary" | "citations" | "graph">("summary");
  const [aiStatus, setAiStatus] = useState<ResourceAiStatus | null>(null);
  const [aiSummary, setAiSummary] = useState<ResourceSummary | null>(null);
  const [citations, setCitations] = useState<ResourceCitation[]>([]);
  const [graph, setGraph] = useState<ResourceGraph | null>(null);
  const [aiErrors, setAiErrors] = useState<AiFeatureErrors>({});
  const [summaryEnvelope, setSummaryEnvelope] = useState<SummaryEnvelope | null>(null);
  const [extractedTextPreview, setExtractedTextPreview] = useState<ExtractedTextPreview | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("nexora-resource-workspace-mode") as WorkspaceMode | null;
    const savedDocuments = Number(localStorage.getItem("nexora-resource-documents-width"));
    const savedUtility = Number(localStorage.getItem("nexora-resource-utility-width"));
    if (savedDocuments >= 220 && savedDocuments <= 360) setDocumentPanelWidth(savedDocuments);
    if (savedUtility >= 360 && savedUtility <= 600) setUtilityPanelWidth(savedUtility);
    if (savedMode && ["read", "study", "research", "graph"].includes(savedMode)) {
      setWorkspaceMode(savedMode);
      setNotesOpen(savedMode === "study");
      setAiOpen(savedMode === "research" || savedMode === "graph");
      if (savedMode === "graph") setAiTab("graph");
    }
  }, []);

  const selectWorkspaceMode = useCallback((mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    setNotesOpen(mode === "study");
    setAiOpen(mode === "research" || mode === "graph");
    if (mode === "graph") setAiTab("graph");
    localStorage.setItem("nexora-resource-workspace-mode", mode);
  }, []);

  const beginPanelResize = useCallback((panel: "documents" | "utility", event: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1536) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panel === "documents" ? documentPanelWidth : utilityPanelWidth;
    let finalWidth = startWidth;
    const onMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      finalWidth = panel === "documents"
        ? Math.max(220, Math.min(360, startWidth + delta))
        : Math.max(360, Math.min(Math.min(600, window.innerWidth * 0.55), startWidth - delta));
      if (panel === "documents") setDocumentPanelWidth(finalWidth);
      else setUtilityPanelWidth(finalWidth);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem(
        panel === "documents" ? "nexora-resource-documents-width" : "nexora-resource-utility-width",
        String(Math.round(finalWidth)),
      );
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [documentPanelWidth, utilityPanelWidth]);

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

  const loadAiFeatures = useCallback(async (resource: Resource, options: LoadAiOptions = {}) => {
    const { preserveContent = false, silent = false } = options;
    if (!isPdf(resource)) {
      setAiStatus(null);
      setAiSummary(null);
      setCitations([]);
      setGraph(null);
      setAiErrors({});
      setExtractedTextPreview(null);
      return;
    }
    if (!silent) setAiLoading(true);
    if (!preserveContent) {
      setAiStatus(null);
      setAiSummary(null);
      setSummaryEnvelope(null);
      setCitations([]);
      setGraph(null);
      setAiErrors({});
      setExtractedTextPreview(null);
    }

    const [statusResult, summaryResult, citationsResult, graphResult, previewResult] = await Promise.allSettled([
      resourceAiApi.status(resource.id),
      resourceAiApi.summary(resource.id),
      resourceAiApi.citations(resource.id),
      resourceAiApi.graph(resource.id, { includeExternal: "true", minConfidence: "0", limit: "100" }),
      resourceAiApi.extractedTextPreview(resource.id),
    ]);

    const nextErrors: AiFeatureErrors = {};
    let refreshPending = false;

    if (statusResult.status === "fulfilled") {
      setAiStatus(statusResult.value.data ?? null);
    } else {
      nextErrors.status = errorMessage(statusResult.reason, "Could not load AI status");
      setAiStatus(null);
    }

    if (summaryResult.status === "fulfilled") {
      // Backend returns { resourceId, status, summaryStatus, summary: {...} | null }
      // summary is null when: (a) never processed, (b) isVisible=false (HIDDEN by teacher)
      const env = summaryResult.value.data as SummaryEnvelope | null;
      setSummaryEnvelope(env ?? null);
      setAiSummary(env?.summary ?? null);
      refreshPending = Boolean(env?.documentIdentity?.warning?.toLowerCase().includes("refres"));
    } else {
      nextErrors.summary = errorMessage(summaryResult.reason, "Could not load AI summary");
      setAiSummary(null);
      setSummaryEnvelope(null);
    }

    if (citationsResult.status === "fulfilled") {
      // Use defensive extractor to handle array or { citations: [...] } wrappers
      setCitations(extractCitations(citationsResult.value.data));
    } else {
      nextErrors.citations = errorMessage(citationsResult.reason, "Could not load AI references");
      setCitations([]);
    }

    if (graphResult.status === "fulfilled") {
      const extracted = extractGraph(graphResult.value.data);
      setGraph(extracted);
      refreshPending = refreshPending || Boolean(extracted?.warning?.toLowerCase().includes("refres"));
    } else {
      nextErrors.graph = errorMessage(graphResult.reason, "Could not load citation graph");
      setGraph(null);
    }

    if (previewResult.status === "fulfilled") {
      setExtractedTextPreview(previewResult.value.data ?? null);
    } else {
      // Preview is non-critical — silently ignore so we don't toast on every load.
      setExtractedTextPreview(null);
    }

    setAiErrors(nextErrors);
    if (!silent) setAiLoading(false);

    // A stale artifact response starts a backend refresh asynchronously. The
    // initial status request can race that enqueue and still say GRAPH_READY;
    // mark the UI as processing so the status poller waits for the fresh
    // summary, references, and graph before the next full reload.
    if (refreshPending && statusResult.status === "fulfilled" && isAiTerminalStatus(statusResult.value.data?.status)) {
      setAiProcessing(true);
      setAiStatus((current) => current ? { ...current, status: "GRAPH_PROCESSING" } : current);
    }

    if (!silent && Object.keys(nextErrors).length) {
      toast.error("Some AI reading features could not load");
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

  // ─── Stable polling ref ────────────────────────────────────────────────────
  // We use a ref-based interval so it is set ONCE when processing starts and
  // cleared ONCE when a terminal status arrives — not cleared/reset on every
  // render caused by aiStatus state updates (which was the previous bug).
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollKickoffRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollSelectedRef = useRef<Resource | null>(null);

  const stopPolling = useCallback(() => {
    if (pollKickoffRef.current !== null) {
      clearTimeout(pollKickoffRef.current);
      pollKickoffRef.current = null;
    }
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Lightweight status-only poller used while a job is in-flight. The
  // full `loadAiFeatures` makes 5 parallel calls (status + summary +
  // citations + graph + text-preview) every 2.5s; during processing the
  // heavy citations/graph/text-preview values can't have changed yet, so
  // we only poll the cheap status endpoint until a terminal status arrives,
  // then do one full refresh.
  const pollStatusOnly = useCallback(async (resource: Resource) => {
    try {
      const response = await resourceAiApi.status(resource.id);
      const next = response.data ?? null;
      setAiStatus((prev) => {
        if (prev?.status === next?.status) return prev;
        return next;
      });
      if (next && isAiTerminalStatus(next.status)) {
        stopPolling();
        setAiProcessing(false);
        // One full reload to populate summary/citations/graph from DB.
        void loadAiFeatures(resource, { preserveContent: true, silent: true });
      }
    } catch {
      // Network blip — leave the interval running, the next tick will retry.
    }
  }, [loadAiFeatures, stopPolling]);

  const startPolling = useCallback((resource: Resource) => {
    stopPolling(); // clear any previous interval first
    pollSelectedRef.current = resource;
    // Small initial delay so the backend has time to write the new status to DB
    pollKickoffRef.current = setTimeout(() => {
      pollKickoffRef.current = null;
      pollIntervalRef.current = setInterval(() => {
        const res = pollSelectedRef.current;
        if (!res) { stopPolling(); return; }
        void pollStatusOnly(res);
      }, 2500);
    }, 800);
  }, [pollStatusOnly, stopPolling]);

  // Stop polling whenever a terminal status arrives in aiStatus
  useEffect(() => {
    if (!selected || !isPdf(selected)) { stopPolling(); return; }
    const s = aiStatus?.status;
    if (isAiProcessingStatus(s) && pollIntervalRef.current === null) {
      setAiProcessing(true);
      startPolling(selected);
    }
    if (isAiTerminalStatus(s)) {
      stopPolling();
      setAiProcessing(false);
    }
  }, [aiStatus?.status, selected, startPolling, stopPolling]);


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
      if (event.key.toLowerCase() === "f") selectWorkspaceMode("read");
      if (event.key.toLowerCase() === "n") {
        selectWorkspaceMode("study");
        setShowNote(true);
      }
      if (event.key.toLowerCase() === "a") selectWorkspaceMode("research");
      if (event.key.toLowerCase() === "g") selectWorkspaceMode("graph");
      if (event.key === "Escape" && workspaceMode === "graph") selectWorkspaceMode("research");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentPage, goToPage, selectWorkspaceMode, workspaceMode]);

  const chooseResource = (resource: Resource) => {
    stopPolling();
    setSelected(resource);
    setAiProcessing(false);
    void loadAnnotations(resource);
    void loadAiFeatures(resource);
  };

  const processAi = async (mode: "full" | "summary" | "citations" | "graph" = "full") => {
    if (!selected) return;
    setAiProcessing(true);
    try {
      if (mode === "summary") await resourceAiApi.regenerateSummary(selected.id);
      else if (mode === "citations") await resourceAiApi.reanalyzeCitations(selected.id);
      else if (mode === "graph") await resourceAiApi.regenerateGraph(selected.id);
      else await resourceAiApi.process(selected.id, {
        regenerateSummary: true,
        reanalyzeCitations: true,
      });
      toast.success("AI reading started — processing in background");
      // Start the stable polling loop — keeps running until terminal status arrives
      startPolling(selected);
      // Immediately refresh once (with a short delay) to update the stepper UI
      setTimeout(() => {
        void loadAiFeatures(selected, { preserveContent: true, silent: true });
      }, 600);
    } catch (error: unknown) {
      setAiProcessing(false);
      stopPolling();
      toast.error(errorMessage(error, "AI processing failed"));
      await loadAiFeatures(selected, { preserveContent: true, silent: true });
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
  const graphWorkspace = workspaceMode === "graph" && aiOpen;
  const showUtility = notesOpen || aiOpen;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full max-w-full overflow-hidden bg-[#f1f5f4] text-foreground dark:bg-[#07110f]">
      <aside className="hidden w-14 shrink-0 flex-col items-center gap-1.5 border-r border-white/10 bg-gradient-to-b from-[#092522] via-[#0b322d] to-[#071b19] py-3 shadow-xl shadow-teal-950/10 sm:flex">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-base text-[#06211e] shadow-lg shadow-teal-950/30" title="Nexora research workspace"><RiSparklingLine /></div>
        <RailButton title="Documents" active={documentsOpen} onClick={() => setDocumentsOpen((value) => !value)}><RiBookOpenLine /></RailButton>
        <RailButton title="Study notes (N)" active={workspaceMode === "study"} onClick={() => selectWorkspaceMode("study")}><RiStickyNoteLine /></RailButton>
        <RailButton title="AI research (A)" active={workspaceMode === "research"} onClick={() => selectWorkspaceMode("research")}><RiBrainLine /></RailButton>
        <RailButton title="Connected graph (G)" active={workspaceMode === "graph"} onClick={() => selectWorkspaceMode("graph")}><RiMindMap /></RailButton>
        <RailButton title="Reading mode (F)" active={workspaceMode === "read"} onClick={() => selectWorkspaceMode("read")}><RiFocus3Line /></RailButton>
        <span className="my-1.5 h-px w-6 bg-white/10" />
        <Link href={libraryHref} title="Resource library" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/55 transition-all hover:bg-white/10 hover:text-white"><RiBookOpenLine /></Link>
        <Link href={uploadHref} title="Upload resource" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/55 transition-all hover:bg-white/10 hover:text-white"><RiAddLine /></Link>
      </aside>

      <section className="flex w-0 min-w-0 flex-1 flex-col overflow-hidden">
        <WorkspaceHeader
          resource={selected}
          mode={workspaceMode}
          documentsOpen={documentsOpen}
          onMode={selectWorkspaceMode}
          onToggleDocuments={() => setDocumentsOpen((value) => !value)}
          onAddNote={() => { selectWorkspaceMode("study"); setShowNote(true); }}
          onReset={() => {
            setDocumentPanelWidth(272);
            setUtilityPanelWidth(440);
            localStorage.setItem("nexora-resource-documents-width", "272");
            localStorage.setItem("nexora-resource-utility-width", "440");
            selectWorkspaceMode("research");
          }}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {documentsOpen && !graphWorkspace && (
            <>
              <div
                className="absolute inset-y-3 left-3 z-30 h-auto w-[min(330px,calc(100%-1.5rem))] shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-background/95 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 2xl:static 2xl:inset-auto 2xl:z-auto 2xl:h-full 2xl:w-[var(--document-width)] 2xl:rounded-none 2xl:border-0 2xl:shadow-none"
                style={{ "--document-width": `${documentPanelWidth}px` } as React.CSSProperties}
              >
                <DocumentLibrary
                  resources={visibleResources}
                  selected={selected}
                  search={search}
                  loading={loadingResources}
                  onSearch={setSearch}
                  onChoose={(resource) => {
                    chooseResource(resource);
                    if (window.innerWidth < 1536) setDocumentsOpen(false);
                  }}
                  onClose={() => setDocumentsOpen(false)}
                />
              </div>
              <PanelResizeHandle label="Resize document library" onPointerDown={(event) => beginPanelResize("documents", event)} />
            </>
          )}

          {!graphWorkspace && (
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
              {selected ? <ReaderWorkspace
                resource={selected}
                readerUrl={readerUrl}
                readerLoading={readerLoading}
                readerError={readerError}
                currentPage={currentPage}
                zoom={zoom}
                rotation={rotation}
                onGoToPage={goToPage}
                onZoom={setZoom}
                onRotate={() => setRotation((value) => (value + 90) % 360)}
                onLoaded={() => setReaderLoading(false)}
                onError={() => { setReaderLoading(false); setReaderError(true); }}
                onRetry={retryReader}
                onAddNote={() => { selectWorkspaceMode("study"); setShowNote(true); }}
                onOpenAi={() => selectWorkspaceMode("research")}
              /> : <EmptyState />}
            </main>
          )}

          {showUtility && !graphWorkspace && <PanelResizeHandle label="Resize study panel" onPointerDown={(event) => beginPanelResize("utility", event)} />}

          {showUtility && (
            <div
              className={cn(
                "min-h-0 overflow-hidden bg-background/95 backdrop-blur-xl",
                graphWorkspace
                  ? "absolute inset-0 z-40 w-full xl:static xl:z-auto xl:flex-1"
                  : "absolute inset-y-3 right-3 z-40 w-[calc(100%-1.5rem)] rounded-2xl border border-white/70 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)] dark:border-white/10 sm:max-w-[560px] xl:static xl:inset-auto xl:z-auto xl:w-[var(--utility-width)] xl:shrink-0 xl:rounded-none xl:border-0 xl:shadow-none",
              )}
              style={graphWorkspace ? undefined : { "--utility-width": `${utilityPanelWidth}px` } as React.CSSProperties}
            >
              {notesOpen ? (
                <NotesPanel
                  activeTab={activeTab}
                  annotations={annotations}
                  sharedAnnotations={sharedAnnotations}
                  currentNotes={currentNotes}
                  loading={loadingAnnotations}
                  onTab={setActiveTab}
                  onDelete={deleteAnnotation}
                  onToggleShare={toggleShare}
                  onGoToPage={goToPage}
                  onAddNote={() => setShowNote(true)}
                  onClose={() => selectWorkspaceMode("read")}
                />
              ) : (
                <AiReadingPanel
                  loading={aiLoading}
                  processing={aiProcessing}
                  activeTab={aiTab}
                  status={aiStatus}
                  summary={aiSummary}
                  summaryEnvelope={summaryEnvelope}
                  citations={citations}
                  graph={graph}
                  errors={aiErrors}
                  teacherMode={teacherMode}
                  extractedTextPreview={extractedTextPreview}
                  onTab={setAiTab}
                  onProcess={processAi}
                  onClose={() => selectWorkspaceMode("read")}
                  onOpenGraphWorkspace={() => selectWorkspaceMode("graph")}
                  layout={graphWorkspace ? "graph" : "side"}
                />
              )}
            </div>
          )}
        </div>

        <MobileWorkspaceNav mode={workspaceMode} onMode={selectWorkspaceMode} />
      </section>

      {showNote && selected && <NoteModal resource={selected} resources={resources} annotationPath={annotationPath} defaultPage={currentPage} onClose={() => setShowNote(false)} onSaved={async () => { setShowNote(false); await loadAnnotations(selected); }} />}
    </div>
  );
}

const workspaceModes: Array<{ mode: WorkspaceMode; label: string; shortcut: string; icon: React.ReactNode }> = [
  { mode: "read", label: "Read", shortcut: "F", icon: <RiBookOpenLine /> },
  { mode: "study", label: "Study", shortcut: "N", icon: <RiStickyNoteLine /> },
  { mode: "research", label: "Research", shortcut: "A", icon: <RiBrainLine /> },
  { mode: "graph", label: "Graph", shortcut: "G", icon: <RiMindMap /> },
];

function WorkspaceHeader({ resource, mode, documentsOpen, onMode, onToggleDocuments, onAddNote, onReset }: {
  resource: Resource | null;
  mode: WorkspaceMode;
  documentsOpen: boolean;
  onMode: (mode: WorkspaceMode) => void;
  onToggleDocuments: () => void;
  onAddNote: () => void;
  onReset: () => void;
}) {
  const currentWorkspace = workspaceModes.find((item) => item.mode === mode);
  return (
    <header className="relative flex h-16 min-w-0 shrink-0 items-center gap-2.5 overflow-hidden border-b border-emerald-950/10 bg-white/90 px-3 shadow-[0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1715]/90 lg:px-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-56 bg-gradient-to-r from-teal-500/[.08] to-transparent" />
      <button
        onClick={onToggleDocuments}
        className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-base shadow-sm transition-all", documentsOpen ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300" : "border-border bg-background text-muted-foreground hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700")}
        title={documentsOpen ? "Hide documents" : "Show documents"}
      >
        <RiLayoutLeftLine />
      </button>
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-400">Nexora Reader</p>
          <span className="hidden rounded-full bg-teal-600/10 px-2 py-0.5 text-[9px] font-semibold text-teal-700 dark:text-teal-300 sm:inline-flex">{currentWorkspace?.label ?? "Read"} mode</span>
        </div>
        <h1 className="mt-0.5 truncate text-[13px] font-semibold tracking-[-0.01em] text-foreground lg:text-sm">{resource?.title ?? "Choose a resource to begin"}</h1>
      </div>
      <nav className="hidden shrink-0 items-center gap-1 rounded-2xl border border-emerald-950/10 bg-[#eef5f3] p-1 shadow-inner dark:border-white/10 dark:bg-white/[.04] md:flex" aria-label="Workspace mode">
        {workspaceModes.map((item) => (
          <button
            key={item.mode}
            onClick={() => onMode(item.mode)}
            title={`${item.label} workspace (${item.shortcut})`}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-semibold transition-all",
              mode === item.mode ? "bg-gradient-to-r from-teal-700 to-emerald-600 text-white shadow-md shadow-teal-900/15" : "text-slate-500 hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white",
            )}
          >
            <span className="text-sm">{item.icon}</span><span className="hidden 2xl:inline">{item.label}</span>
          </button>
        ))}
      </nav>
      <button onClick={onAddNote} className="hidden h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 px-4 text-[11px] font-semibold text-white shadow-md shadow-teal-900/15 transition-all hover:-translate-y-0.5 hover:shadow-lg xl:flex"><RiStickyNoteLine className="text-sm" />New note</button>
      <button onClick={onReset} title="Reset workspace layout" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"><RiRefreshLine /></button>
    </header>
  );
}

function PanelResizeHandle({ label, onPointerDown }: { label: string; onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void }) {
  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      className="group hidden w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border/20 transition-colors hover:bg-teal-500/15 2xl:flex"
    >
      <span className="h-10 w-0.5 rounded-full bg-border transition-colors group-hover:bg-teal-500" />
    </div>
  );
}

function MobileWorkspaceNav({ mode, onMode }: { mode: WorkspaceMode; onMode: (mode: WorkspaceMode) => void }) {
  return (
    <nav className="grid h-16 shrink-0 grid-cols-4 border-t border-emerald-950/10 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-20px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1715]/95 sm:hidden" aria-label="Mobile workspace mode">
      {workspaceModes.map((item) => (
        <button key={item.mode} onClick={() => onMode(item.mode)} className={cn("relative flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors", mode === item.mode ? "text-teal-700 dark:text-teal-300" : "text-muted-foreground")}>
          {mode === item.mode && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400" />}
          <span className={cn("text-lg", mode === item.mode && "drop-shadow-sm")}>{item.icon}</span>{item.label}
        </button>
      ))}
    </nav>
  );
}

function DocumentLibrary({ resources, selected, search, loading, onSearch, onChoose, onClose }: {
  resources: Resource[];
  selected: Resource | null;
  search: string;
  loading: boolean;
  onSearch: (value: string) => void;
  onChoose: (resource: Resource) => void;
  onClose?: () => void;
}) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-emerald-950/10 bg-white dark:border-white/10 dark:bg-[#0b1715]">
      <div className="border-b border-emerald-950/10 bg-gradient-to-br from-teal-50 via-white to-cyan-50/50 p-4 dark:border-white/10 dark:from-teal-950/30 dark:via-[#0b1715] dark:to-cyan-950/20">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[13px] font-bold tracking-[-0.01em]">Paper library</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{resources.length} accessible resource{resources.length === 1 ? "" : "s"}</p>
          </div>
          {onClose && <button onClick={onClose} aria-label="Close document library" className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground shadow-sm transition-colors hover:text-foreground 2xl:hidden"><RiCloseLine /></button>}
        </div>
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-teal-700/70" />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search papers…"
            className="h-10 w-full rounded-xl border border-emerald-950/10 bg-white/80 pl-9 pr-3 text-[12px] shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/[.05] dark:focus:bg-white/[.08]" />
        </div>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />)
          : resources.length
            ? resources.map((resource) => (
                <button key={resource.id} onClick={() => onChoose(resource)}
                  className={cn("group flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-all",
                    selected?.id === resource.id
                      ? "border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50/50 text-teal-800 shadow-sm dark:border-teal-800 dark:from-teal-950/50 dark:to-cyan-950/20 dark:text-teal-200"
                      : "border-transparent text-foreground hover:border-border hover:bg-muted/50"
                  )}>
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm",
                    isPdf(resource) ? "bg-gradient-to-br from-rose-100 to-orange-50 text-rose-600 dark:from-rose-950/70 dark:to-orange-950/30" : "bg-gradient-to-br from-sky-100 to-cyan-50 text-sky-700 dark:from-sky-950/70 dark:to-cyan-950/30"
                  )}>{isPdf(resource) ? "PDF" : resource.fileType.slice(0, 4)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block line-clamp-2 text-[11px] font-semibold leading-4">{resource.title}</span>
                    <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{resource.visibility ?? "Accessible"}</span>
                  </span>
                </button>
              ))
            : <p className="p-6 text-center text-[10px] text-muted-foreground">No documents found</p>}
      </div>
    </aside>
  );
}

function ReaderWorkspace({ resource, readerUrl, readerLoading, readerError, currentPage, zoom, rotation, onGoToPage, onZoom, onRotate, onLoaded, onError, onRetry, onAddNote, onOpenAi }: {
  resource: Resource;
  readerUrl: string;
  readerLoading: boolean;
  readerError: boolean;
  currentPage: number;
  zoom: number;
  rotation: number;
  onGoToPage: (page: number) => void;
  onZoom: React.Dispatch<React.SetStateAction<number>>;
  onRotate: () => void;
  onLoaded: () => void;
  onError: () => void;
  onRetry: () => void;
  onAddNote: () => void;
  onOpenAi: () => void;
}) {
  const pdf = isPdf(resource);
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-emerald-950/10 bg-white/80 px-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1715]/80 lg:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[9px] font-black uppercase shadow-sm",
            pdf ? "bg-gradient-to-br from-rose-100 to-orange-50 text-rose-600 dark:from-rose-950/60 dark:to-orange-950/30" : "bg-gradient-to-br from-sky-100 to-cyan-50 text-sky-700 dark:from-sky-950/60 dark:to-cyan-950/30"
          )}>{pdf ? "PDF" : resource.fileType.slice(0, 3)}</span>
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold leading-tight">{resource.title}</h2>
            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Page {currentPage} · {resource.visibility ?? "Accessible"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {pdf && <button onClick={onOpenAi} title="Open AI research workspace (A)" className="hidden h-9 items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 text-[10px] font-semibold text-teal-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300 sm:flex"><RiBrainLine className="text-sm" />AI research</button>}
          <a href={signedUrl(resource, false)} title="Download" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:text-foreground"><RiDownloadLine className="text-[14px]" /></a>
          <button onClick={onAddNote} title="Add page note (N)" className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 px-3 text-[10px] font-semibold text-white shadow-md shadow-teal-900/15 transition-all hover:-translate-y-0.5 hover:shadow-lg"><RiStickyNoteLine className="text-sm" /><span className="hidden sm:inline">Page note</span></button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.08),transparent_32%),linear-gradient(135deg,#e8efed_0%,#f4f7f6_52%,#e9f1ef_100%)] p-2.5 dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_30%),linear-gradient(135deg,#07110f_0%,#0b1715_55%,#07110f_100%)] lg:p-4">
        {pdf ? (
          <div className="mx-auto h-full min-h-0 w-full max-w-[1500px]">
            <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_22px_60px_-28px_rgba(15,23,42,0.5)] ring-1 ring-emerald-950/[.04] dark:border-white/10 dark:bg-zinc-900 dark:ring-white/[.04]">
              {readerUrl && <NexoraPdfReader source={readerUrl} title={resource.title} page={currentPage} zoom={zoom} rotation={rotation} onPageChange={onGoToPage} onZoomChange={onZoom} onRotationChange={onRotate} onLoaded={onLoaded} onError={onError} />}
              {readerLoading && <ReaderLoading />}
              {readerError && <ReaderError onRetry={onRetry} />}
            </div>
          </div>
        ) : <NativeDocument resource={resource} />}
      </div>
    </>
  );
}

function NotesPanel({ activeTab, annotations, sharedAnnotations, currentNotes, loading, onTab, onDelete, onToggleShare, onGoToPage, onAddNote, onClose }: {
  activeTab: "mine" | "shared";
  annotations: Annotation[];
  sharedAnnotations: Annotation[];
  currentNotes: Annotation[];
  loading: boolean;
  onTab: (tab: "mine" | "shared") => void;
  onDelete: (id: string) => void;
  onToggleShare: (annotation: Annotation) => void;
  onGoToPage: (page: number) => void;
  onAddNote: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filteredNotes = useMemo(() => currentNotes
    .filter((annotation) => `${annotation.note ?? ""} ${annotation.highlight ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((left, right) => (left.page ?? Number.MAX_SAFE_INTEGER) - (right.page ?? Number.MAX_SAFE_INTEGER)), [currentNotes, query]);
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l border-emerald-950/10 bg-[#fbfcfc] dark:border-white/10 dark:bg-[#0b1715]">
      <div className="border-b border-emerald-950/10 bg-gradient-to-br from-amber-50/80 via-white to-teal-50/60 p-4 dark:border-white/10 dark:from-amber-950/20 dark:via-[#0b1715] dark:to-teal-950/20">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg text-white shadow-lg shadow-amber-900/15"><RiStickyNoteLine /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-bold tracking-[-0.01em]">Study notebook</h2>
            <p className="text-[10px] text-muted-foreground">Capture page-linked insights and questions</p>
          </div>
          <button onClick={onAddNote} className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 px-3 text-[10px] font-semibold text-white shadow-md shadow-teal-900/15 transition-transform hover:-translate-y-0.5"><RiAddLine className="text-sm" />Add</button>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground shadow-sm hover:text-foreground" aria-label="Close notes"><RiCloseLine /></button>
        </div>
        <div className="flex gap-1 rounded-xl border border-emerald-950/10 bg-[#eef4f2] p-1 dark:border-white/10 dark:bg-white/[.04]">
          {(["mine", "shared"] as const).map((tab) => (
            <button key={tab} onClick={() => onTab(tab)}
              className={cn("flex-1 rounded-lg py-2 text-[10px] font-semibold transition-all",
                activeTab === tab ? "bg-white text-teal-800 shadow-sm dark:bg-white/10 dark:text-teal-300" : "text-muted-foreground hover:text-foreground"
              )}>
              {tab === "mine" ? `My notes (${annotations.length})` : `Shared (${sharedAnnotations.length})`}
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-teal-700/70" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes and highlights…" className="h-10 w-full rounded-xl border border-emerald-950/10 bg-white/80 pl-9 pr-3 text-[11px] shadow-sm outline-none transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/[.05]" />
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />)
          : filteredNotes.length
            ? filteredNotes.map((annotation, index) => {
                const previousPage = index > 0 ? filteredNotes[index - 1]?.page : undefined;
                return <div key={annotation.id}>
                  {annotation.page && annotation.page !== previousPage && (
                    <button onClick={() => onGoToPage(annotation.page!)} className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700 hover:text-teal-800 dark:text-teal-400">
                      <span className="h-px w-5 bg-gradient-to-r from-teal-500 to-transparent" />Page {annotation.page}
                    </button>
                  )}
                  <NoteCard annotation={annotation} owned={activeTab === "mine"} onDelete={onDelete} onToggleShare={onToggleShare} onGoToPage={onGoToPage} />
                </div>;
              })
            : <div className="py-12 text-center"><RiStickyNoteLine className="mx-auto text-3xl text-muted-foreground/20" /><p className="mt-2 text-[10px] text-muted-foreground">{query ? "No matching notes" : "No notes yet"}</p><button onClick={onAddNote} className="mt-3 rounded-lg bg-teal-600 px-3 py-2 text-[9px] font-semibold text-white">Create first note</button></div>}
      </div>
    </aside>
  );
}

function RailButton({ children, title, active, onClick }: { children: React.ReactNode; title: string; active?: boolean; onClick: () => void }) {
  return <button title={title} onClick={onClick} className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-[15px] transition-all",
    active ? "bg-gradient-to-br from-teal-400 to-cyan-500 text-[#06211e] shadow-lg shadow-black/20" : "text-white/55 hover:bg-white/10 hover:text-white"
  )}>{children}</button>;
}

function ReaderLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-zinc-900/95">
      <div className="text-center">
        <RiLoader4Line className="mx-auto animate-spin text-2xl text-teal-600" />
        <p className="mt-3 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Opening document…</p>
      </div>
    </div>
  );
}

function ReaderError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
      <div>
        <RiFileTextLine className="mx-auto text-4xl text-rose-300" />
        <p className="mt-4 text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">Could not open document</p>
        <p className="mt-1 max-w-xs text-[10px] leading-5 text-zinc-500">Retry the secure in-app reader.</p>
        <button onClick={onRetry} className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal-600 px-4 text-[10px] font-medium text-white hover:bg-teal-700"><RiRefreshLine /> Retry</button>
      </div>
    </div>
  );
}

// ─── Processing step definitions ─────────────────────────────────────────────
const AI_STEPS = [
  { key: "text",     label: "Extracting text",   statuses: ["TEXT_PROCESSING", "TEXT_EXTRACTED"] },
  { key: "summary",  label: "Generating summary", statuses: ["SUMMARY_PROCESSING", "SUMMARY_READY"] },
  { key: "refs",     label: "Parsing references", statuses: ["CITATION_PROCESSING", "CITATIONS_READY"] },
  { key: "graph",    label: "Building graph",     statuses: ["GRAPH_PROCESSING", "GRAPH_READY"] },
] as const;

type AiStepKey = typeof AI_STEPS[number]["key"];

function getActiveStep(status?: string | null): AiStepKey | null {
  if (!status) return null;
  for (const step of AI_STEPS) {
    if ((step.statuses as readonly string[]).includes(status)) return step.key;
  }
  return null;
}

function isStepDone(stepKey: AiStepKey, currentStatus?: string | null): boolean {
  const order = AI_STEPS.map((s) => s.key);
  const currentIdx = AI_STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(currentStatus ?? ""));
  const stepIdx = order.indexOf(stepKey);
  return currentIdx > stepIdx;
}

function AiReadingPanel({ loading, processing, activeTab, status, summary, summaryEnvelope, citations, graph, errors, onTab, onProcess, teacherMode, extractedTextPreview, onClose, onOpenGraphWorkspace, layout = "side" }: {
  loading: boolean;
  processing: boolean;
  activeTab: "summary" | "citations" | "graph";
  status: ResourceAiStatus | null;
  summary: ResourceSummary | null;
  summaryEnvelope: SummaryEnvelope | null;
  citations: ResourceCitation[];
  graph: ResourceGraph | null;
  errors: AiFeatureErrors;
  teacherMode: boolean;
  extractedTextPreview: ExtractedTextPreview | null;
  onTab: (tab: "summary" | "citations" | "graph") => void;
  onProcess: (mode?: "full" | "summary" | "citations" | "graph") => void;
  onClose?: () => void;
  onOpenGraphWorkspace?: () => void;
  layout?: "side" | "graph";
}) {
  const rawStatus = status?.status;
  const busy = processing || isAiProcessingStatus(rawStatus);
  const hasArtifacts = Boolean(summary || citations.length || graph?.edges.length);
  const notStarted = (!rawStatus || rawStatus === "PENDING" || rawStatus === "NOT_PROCESSED") && !hasArtifacts;
  const isFailed = rawStatus === "FAILED";

  return (
    <aside className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-[#fbfcfc] dark:bg-[#0b1715]", layout === "side" && "border-l border-emerald-950/10 dark:border-white/10")}>
      {/* Header */}
      <div className="relative overflow-hidden border-b border-emerald-950/10 bg-gradient-to-br from-teal-50 via-white to-cyan-50/60 p-4 dark:border-white/10 dark:from-teal-950/30 dark:via-[#0b1715] dark:to-cyan-950/20">
        <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-500 text-lg text-white shadow-lg shadow-teal-900/20"><RiBrainLine /></span>
            <div className="min-w-0">
              <span className="block text-[14px] font-bold tracking-[-0.01em] text-foreground">AI research desk</span>
              <span className="block truncate text-[10px] text-muted-foreground">Evidence-backed summary, sources and connections</span>
            </div>
            {layout === "graph" && citations.length > 0 && <span className="hidden rounded-full border border-teal-200 bg-white/80 px-2.5 py-1 text-[9px] font-bold text-teal-700 shadow-sm dark:border-teal-800 dark:bg-white/[.06] dark:text-teal-300 lg:inline-flex">{citations.length} sources</span>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button disabled={busy} onClick={() => onProcess("full")}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 px-3 text-[10px] font-semibold text-white shadow-md shadow-teal-900/15 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50">
              {busy ? <RiLoader4Line className="animate-spin text-[13px]" /> : <RiPlayCircleLine className="text-[13px]" />}
              {busy ? "Working…" : notStarted ? "Process PDF" : "Re-process"}
            </button>
            {onClose && <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground shadow-sm hover:text-foreground" aria-label="Close AI workspace"><RiCloseLine /></button>}
          </div>
        </div>
        {/* Tab bar */}
        <div className="relative mt-4 flex gap-1 rounded-xl border border-emerald-950/10 bg-[#eaf2f0] p-1 dark:border-white/10 dark:bg-white/[.04]">
          {(["summary", "citations", "graph"] as const).map((tab) => (
            <button key={tab} onClick={() => {
              onTab(tab);
              if (tab === "graph" && layout === "side") onOpenGraphWorkspace?.();
            }}
              className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-semibold transition-all",
                activeTab === tab ? "bg-white text-teal-800 shadow-sm dark:bg-white/10 dark:text-teal-300" : "text-muted-foreground hover:text-foreground"
              )}>
              {tab === "summary" && <RiBrainLine />}{tab === "citations" && <RiLinksLine />}{tab === "graph" && <RiMindMap />}
              {tab === "summary" ? "Summary" : tab === "citations" ? `Refs${citations.length ? ` (${citations.length})` : ""}` : "Graph"}
            </button>
          ))}
        </div>
        {/* Status: progress stepper during processing, compact badge otherwise */}
        {busy ? (
          <ProcessingStepper status={rawStatus} />
        ) : (
          <StatusBadge status={rawStatus} error={errors.status} loading={loading} processingError={status?.processingError} />
        )}
      </div>
      {/* Body */}
      <div className={cn("flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.5),transparent_180px)]", layout === "graph" ? "p-4 lg:p-5" : "p-4")}>
        {loading ? <AiSkeleton />
          : busy && !summary && !citations.length && !graph?.edges.length ? <AiProcessingOverlay status={rawStatus} />
          : notStarted ? <NotProcessedState onProcess={() => onProcess("full")} processing={busy} />
          : isFailed && !hasArtifacts ? <FailedState error={status?.processingError} onRetry={() => onProcess("full")} processing={busy} />
          : activeTab === "summary" ? <SummaryPanel summary={summary} summaryEnvelope={summaryEnvelope} error={errors.summary} onRegenerate={() => onProcess("summary")} processing={busy} teacherMode={teacherMode} resourceId={summaryEnvelope?.resourceId} extractedTextPreview={extractedTextPreview} />
          : activeTab === "citations" ? <CitationList citations={citations} error={errors.citations} onReanalyze={() => onProcess("citations")} processing={busy} />
          : <CitationGraph graph={graph} citations={citations} error={errors.graph} onProcess={() => onProcess("graph")} processing={busy} fullHeight={layout === "graph"} />}
      </div>
    </aside>
  );
}

function ProcessingStepper({ status }: { status?: string | null }) {
  const active = getActiveStep(status);
  return (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-teal-200/60 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/80 p-3.5 shadow-sm dark:border-teal-900/40 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/30">
      {/* Animated shimmer band */}
      <div className="pointer-events-none absolute inset-x-0 -top-1 h-1 bg-gradient-to-r from-transparent via-teal-400/70 to-transparent [animation:shimmer_2.2s_linear_infinite]" />
      <div className="flex items-center justify-between">
        {AI_STEPS.map((step, i) => {
          const done = isStepDone(step.key, status);
          const current = active === step.key;
          return (
            <div key={step.key} className="flex flex-1 items-center gap-1.5 last:flex-none">
              <div className="relative">
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-500",
                  done ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                    : current ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/40 ring-2 ring-teal-300/60"
                    : "bg-muted text-muted-foreground"
                )}>
                  {done ? <RiCheckLine className="text-[11px]" />
                    : current ? <RiLoader4Line className="animate-spin text-[11px]" />
                    : i + 1}
                </div>
                {current && (
                  <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-teal-400/40" />
                )}
              </div>
              <span className={cn("text-[9px] font-medium transition-colors",
                done ? "text-teal-700 dark:text-teal-400"
                  : current ? "text-teal-700 dark:text-teal-300"
                  : "text-muted-foreground/70"
              )}>
                {step.label}
              </span>
              {i < AI_STEPS.length - 1 && (
                <span className={cn("mx-1 h-px flex-1 transition-colors",
                  done ? "bg-teal-500/60" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function StatusBadge({ status, error, loading, processingError }: { status?: string | null; error?: string; loading: boolean; processingError?: string | null }) {
  const label = error ? "Status unavailable" : loading ? "Loading…" : aiStatusLabel(status);
  const isError = error || status === "FAILED";
  const isReady = isAiReadyStatus(status);
  if (!status && !loading && !error) return null; // hide if nothing to show
  return (
    <div className={cn("mt-2 rounded-md px-2.5 py-1.5 text-[9px] font-medium",
      isError ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
        : isReady ? "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400"
        : "bg-muted/60 text-muted-foreground"
    )}>
      <span>{label}</span>
      {processingError && isError && <p className="mt-0.5 font-normal opacity-80">{processingError}</p>}
    </div>
  );
}

/**
 * Full-panel aesthetic loader shown while the backend is actively processing
 * the PDF. Replaces the regular tab body so the user sees a focused,
 * non-distracting loading experience instead of stale or empty content.
 */
function AiProcessingOverlay({ status }: { status?: string | null }) {
  const active = getActiveStep(status);
  const activeStep = AI_STEPS.find((s) => s.key === active);
  const headline =
    activeStep?.key === "text" ? "Reading your paper" :
    activeStep?.key === "summary" ? "Drafting your bilingual summary" :
    activeStep?.key === "refs" ? "Resolving citations" :
    activeStep?.key === "graph" ? "Mapping connected papers" :
    "Starting AI reading…";
  const subline =
    activeStep?.key === "text" ? "Extracting structured text from every page so the AI has a clean signal." :
    activeStep?.key === "summary" ? "Writing an academic-grade summary in English and native বাংলা." :
    activeStep?.key === "refs" ? "Looking up DOIs, titles, and venues for each reference." :
    activeStep?.key === "graph" ? "Linking this paper to the wider research graph." :
    "Warming up the reader — this usually takes 30–60 seconds.";

  return (
    <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-xl border border-teal-200/50 bg-gradient-to-br from-white via-teal-50/40 to-cyan-50/40 px-6 py-10 text-center dark:border-teal-900/30 dark:from-background dark:via-teal-950/20 dark:to-cyan-950/20">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-teal-300/25 blur-3xl [animation:floatA_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl [animation:floatB_9s_ease-in-out_infinite]" />

      {/* Pulsing brain icon */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-teal-400/30" />
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-cyan-400/20 [animation-delay:300ms]" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 text-white shadow-2xl shadow-teal-500/40 ring-4 ring-teal-200/50 dark:ring-teal-900/40">
          <RiBrainLine className="h-9 w-9 animate-pulse" />
        </div>
      </div>

      <h3 className="mt-6 text-[15px] font-semibold tracking-tight text-foreground">{headline}</h3>
      <p className="mt-1.5 max-w-xs text-[10px] leading-relaxed text-muted-foreground">{subline}</p>

      {/* Step list */}
      <div className="mt-7 w-full max-w-xs space-y-2">
        {AI_STEPS.map((step) => {
          const done = isStepDone(step.key, status);
          const current = active === step.key;
          return (
            <div key={step.key} className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all duration-500",
              done ? "border-teal-200 bg-teal-50/70 dark:border-teal-900/40 dark:bg-teal-950/30"
                : current ? "border-teal-300 bg-white shadow-sm shadow-teal-200/60 dark:border-teal-800 dark:bg-teal-950/40"
                : "border-border/60 bg-background/40 opacity-60"
            )}>
              <div className={cn(
                "flex h-5 w-5 flex-none items-center justify-center rounded-full text-[8px] font-bold transition-all",
                done ? "bg-teal-600 text-white"
                  : current ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {done ? <RiCheckLine className="text-[9px]" />
                  : current ? <RiLoader4Line className="animate-spin text-[9px]" />
                  : null}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                done ? "text-teal-700 dark:text-teal-400"
                  : current ? "text-foreground"
                  : "text-muted-foreground"
              )}>
                {step.label}
              </span>
              {current && (
                <span className="ml-auto flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-teal-500 [animation-delay:0ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-teal-500 [animation-delay:150ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-teal-500 [animation-delay:300ms]" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-7 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/80">
        Runs in the background — you can keep reading
      </p>

      <style jsx>{`
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 30px) scale(1.1); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, -20px) scale(1.15); }
        }
      `}</style>
    </div>
  );
}

function AiSkeleton() {
  return <div className="space-y-2.5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className={cn("animate-pulse rounded-lg bg-muted", i === 0 ? "h-24" : "h-16")} />)}</div>;
}

function NotProcessedState({ onProcess, processing }: { onProcess: () => void; processing: boolean }) {
  return (
    <div className="relative flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-teal-300/60 bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/40 p-6 text-center dark:border-teal-900/40 dark:from-teal-950/20 dark:via-background dark:to-cyan-950/20">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30 ring-2 ring-teal-200/60 dark:ring-teal-900/40">
        <RiBrainLine className="text-2xl" />
      </div>
      <p className="mt-4 text-[13px] font-semibold tracking-tight">Generate AI reading</p>
      <p className="mx-auto mt-1.5 max-w-60 text-[9px] leading-[1.6] text-muted-foreground">
        Extract a bilingual summary, resolve the reference list, and build a citation graph for this paper.
      </p>
      <button disabled={processing} onClick={onProcess}
        className="group relative mt-6 inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 via-teal-600 to-cyan-600 px-6 text-[11px] font-semibold text-white shadow-lg shadow-teal-600/30 transition-all hover:shadow-xl hover:shadow-teal-600/40 disabled:opacity-50">
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {processing ? <RiLoader4Line className="animate-spin" /> : <RiSparklingLine className="transition-transform group-hover:rotate-12" />}
        {processing ? "Starting…" : "Generate AI summary"}
      </button>
      <p className="mt-4 flex items-center gap-1.5 text-[8px] text-muted-foreground">
        <RiTimeLine /> Takes 30–60 seconds · Result is saved and shared with all users
      </p>
    </div>
  );
}

function FailedState({ error, onRetry, processing }: { error?: string | null; onRetry: () => void; processing: boolean }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-rose-200 bg-rose-50/40 p-6 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50">
        <RiAlertLine className="text-xl text-rose-500" />
      </div>
      <p className="mt-3 text-[12px] font-semibold text-rose-700 dark:text-rose-400">Processing failed</p>
      {error && <p className="mx-auto mt-1.5 max-w-52 text-[9px] leading-[1.6] text-rose-600/80 dark:text-rose-400/70">{error}</p>}
      <button disabled={processing} onClick={onRetry}
        className="mt-5 flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-5 text-[10px] font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50">
        {processing ? <RiLoader4Line className="animate-spin" /> : <RiRefreshLine />}
        {processing ? "Retrying…" : "Retry processing"}
      </button>
    </div>
  );
}

function SummaryPanel({ summary, summaryEnvelope, error, processing, onRegenerate, teacherMode, resourceId, extractedTextPreview }: {
  summary: ResourceSummary | null;
  summaryEnvelope: SummaryEnvelope | null;
  error?: string;
  processing: boolean;
  teacherMode: boolean;
  resourceId?: string;
  onRegenerate: () => void;
  extractedTextPreview?: ExtractedTextPreview | null;
}) {
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  // Default to English so the initial render is always readable, but
  // auto-switch to বাংলা if the resource has no English summary and only
  // a mirrored-from-English Bangla row (so the user sees something useful
  // and the "(mirrored from English)" badge can make the source clear).
  const [lang, setLang] = useState<"en" | "bn">("en");

  const toggleVisibility = async () => {
    if (!resourceId) return;
    const makingVisible = summaryEnvelope?.summaryStatus === "HIDDEN";
    setTogglingVisibility(true);
    try {
      await resourceAiApi.setSummaryVisibility(resourceId, makingVisible);
      toast.success(makingVisible ? "Summary is now visible to students" : "Summary hidden from students");
      onRegenerate(); // Reload summary state
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not update summary visibility");
    } finally {
      setTogglingVisibility(false);
    }
  };

  if (error) {
    return <EmptyAiState icon={<RiAlertLine />} title="Summary unavailable" text={error} actionLabel="Try again" loading={processing} onAction={onRegenerate} />;
  }
  if (summaryEnvelope?.summaryStatus === "HIDDEN") {
    return (
      <div className="space-y-3">
        {teacherMode && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div>
              <p className="text-[9px] font-semibold text-amber-700 dark:text-amber-400">Summary is hidden from students</p>
              <p className="text-[8px] text-amber-600/70 dark:text-amber-500/70">Click to make it visible to all users</p>
            </div>
            <button onClick={toggleVisibility} disabled={togglingVisibility} className="flex h-7 items-center gap-1 rounded-md bg-amber-600 px-2.5 text-[8px] font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {togglingVisibility ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} Publish
            </button>
          </div>
        )}
        <EmptyAiState icon={<RiBrainLine />} title="Summary is hidden" text="The summary for this resource has been set to private by the teacher. Contact your instructor if you need access." />
      </div>
    );
  }
  if (!summary) {
    // When the paper hasn't been summarized yet, show the user *exactly* what
    // text the AI will see — so they understand what's about to be analyzed and
    // can choose to trigger generation. The "Ready to summarize" frame keeps
    // each paper clearly isolated as its own card.
    return (
      <ReadyToSummarizeCard
        processing={processing}
        onGenerate={onRegenerate}
        extractedTextPreview={extractedTextPreview ?? null}
      />
    );
  }

  // Pick the Bangla field if it's actually populated, otherwise gracefully
  // fall back to the English equivalent so the UI never renders empty.
  const pick = (en?: string | null, bn?: string | null): string | null | undefined => {
    if (lang === "bn") return bn && bn.trim().length > 0 ? bn : en;
    return en;
  };
  const pickList = (en: string[], bn?: string[]): string[] => {
    if (lang === "bn" && bn && bn.length > 0) return bn;
    return en;
  };

  const labels = {
    en: { goals: "Goals", methods: "Methods", results: "Results", conclusions: "Conclusions" },
    bn: { goals: "লক্ষ্য", methods: "পদ্ধতি", results: "ফলাফল", conclusions: "উপসংহার" },
  } as const;
  const sectionLabels = labels[lang];

  const sections: [string, string][] = (
    [
      [sectionLabels.goals, pick(summary.goals, summary.goalsBn) ?? ""],
      [sectionLabels.methods, pick(summary.methods, summary.methodsBn) ?? ""],
      [sectionLabels.results, pick(summary.results, summary.resultsBn) ?? ""],
      [sectionLabels.conclusions, pick(summary.conclusions, summary.conclusionsBn) ?? ""],
    ] as [string, string][]
  ).filter(([, value]) => value.length > 0);

  // Build a plain-text export of the current summary in the active language
  // so users can copy the whole thing or download it as a .txt file.
  const buildSummaryText = (): string => {
    const sep = "\n\n";
    const contribs = pickList(summary.keyContributions, summary.keyContributionsBn)
      .map((c, i) => `${i + 1}. ${c}`)
      .join("\n");
    const limitations = pickList(summary.limitations, summary.limitationsBn)
      .map((c) => `• ${c}`)
      .join("\n");
    const keywords = pickList(summary.keywords, summary.keywordsBn).join(", ");
    return [
      pick(summary.professionalSummary, summary.professionalSummaryBn),
      sections.map(([label, value]) => `${label}\n${value}`).join(sep),
      `${lang === "bn" ? "মূল অবদান" : "Key contributions"}\n${contribs}`,
      `${lang === "bn" ? "সীমাবদ্ধতা" : "Limitations"}\n${limitations}`,
      `${lang === "bn" ? "কীওয়ার্ড" : "Keywords"}\n${keywords}`,
    ]
      .filter(Boolean)
      .join(sep);
  };

  const copySummary = async () => {
    const text = buildSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      toast.success(lang === "bn" ? "সারসংক্ষেপ কপি হয়েছে" : "Summary copied to clipboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Copy failed");
    }
  };

  const downloadSummary = () => {
    const text = buildSummaryText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resourceId ?? "summary")}-${lang}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sectionLabel = {
    summary: lang === "bn" ? "সারসংক্ষেপ" : "Summary",
    keyContributions: lang === "bn" ? "মূল অবদান" : "Key Contributions",
    limitations: lang === "bn" ? "সীমাবদ্ধতা" : "Limitations",
    keywords: lang === "bn" ? "মূল শব্দ" : "Keywords",
  } as const;

  const hasBangla =
    Boolean(summary.professionalSummaryBn && summary.professionalSummaryBn.trim().length > 0) ||
    Boolean(summary.goalsBn && summary.goalsBn.trim().length > 0) ||
    Boolean(summary.keyContributionsBn && summary.keyContributionsBn.length > 0);

  return (
    <div className="space-y-3.5">
      {/* Per-paper framing: each summary gets its own header strip showing
          the paper title, file type, and language toggle. This makes it
          visually obvious that the AI panel content belongs to one paper. */}
      <SummaryPaperHeader
        identity={summaryEnvelope?.documentIdentity}
        lang={lang}
        setLang={setLang}
        hasBangla={hasBangla}
        summaryStatus={summaryEnvelope?.summaryStatus ?? null}
        teacherMode={teacherMode}
        togglingVisibility={togglingVisibility}
        onToggleVisibility={toggleVisibility}
      />

      {summaryEnvelope?.documentIdentity?.warning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex gap-2">
            <RiAlertLine className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-[9px] font-semibold text-amber-800 dark:text-amber-300">Source transparency</p>
              <p className="mt-0.5 text-[8px] leading-4 text-amber-700/90 dark:text-amber-400/90">{summaryEnvelope.documentIdentity.warning}</p>
              {summaryEnvelope.documentIdentity.titleMismatch && (
                <p className="mt-1 text-[8px] leading-4 text-amber-700/80 dark:text-amber-400/80">
                  Saved title: {summaryEnvelope.documentIdentity.storedTitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero professional summary — large card with quote glyph, the focal
          point of the paper. */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-white to-cyan-50/60 p-4 shadow-sm dark:border-teal-900/40 dark:from-teal-950/30 dark:via-[#0b1715] dark:to-cyan-950/20">
        <span aria-hidden className="absolute -left-1 -top-3 select-none text-6xl font-serif leading-none text-teal-300/60 dark:text-teal-700/40">“</span>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">{sectionLabel.summary}</p>
          <RiFileTextLine className="text-[14px] text-teal-500/70" />
        </div>
        <p
          lang={lang === "bn" ? "bn" : "en"}
          className={cn(
            "relative mt-2 text-[12px] leading-6 text-foreground/90",
            lang === "bn" && "font-bn",
          )}
        >
          {pick(summary.professionalSummary, summary.professionalSummaryBn)}
        </p>
      </div>

      {/* The paper's argument as a connected research path: objective →
          method → evidence → conclusion. */}
      <ResearchFlow sections={sections} lang={lang} />

      {/* Key contributions: full-width chip grid */}
      <KeyContributionGrid
        label={sectionLabel.keyContributions}
        items={pickList(summary.keyContributions, summary.keyContributionsBn)}
        lang={lang}
      />

      {/* Limitations: dashed-border list (visually distinct from the chip grid) */}
      <LimitationsList
        label={sectionLabel.limitations}
        items={pickList(summary.limitations, summary.limitationsBn)}
        lang={lang}
      />

      {/* Keywords: dense tag chips at the bottom */}
      <KeywordChips
        label={sectionLabel.keywords}
        items={pickList(summary.keywords, summary.keywordsBn)}
      />

      <div className="flex items-center gap-1.5">
        <button
          disabled={processing}
          onClick={copySummary}
          title={lang === "bn" ? "সারসংক্ষেপ কপি করুন" : "Copy summary"}
          aria-label="Copy summary"
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-[9px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RiFileCopyLine className="text-[12px]" />{lang === "bn" ? "কপি" : "Copy"}
        </button>
        <button
          disabled={processing}
          onClick={downloadSummary}
          title={lang === "bn" ? "টেক্সট ফাইল ডাউনলোড" : "Download as .txt"}
          aria-label="Download summary"
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-[9px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RiDownloadLine className="text-[12px]" />{lang === "bn" ? "ডাউনলোড" : "Download"}
        </button>
        <button
          disabled={processing}
          onClick={onRegenerate}
          title={lang === "bn" ? "নতুন করে তৈরি করুন" : "Regenerate summary"}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-[9px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {processing ? <RiLoader4Line className="animate-spin text-[12px]" /> : <RiRefreshLine className="text-[12px]" />}{lang === "bn" ? "পুনঃতৈরি" : "Regenerate"}
        </button>
      </div>
    </div>
  );
}

// Only use URLs the backend resolved from a DOI or a real publisher/index
// landing page. A search query is not the original paper and must not be
// presented as if it were a citation link.
function resolvePaperUrl(target: CitationTarget): string | null {
  if (target.verifiedUrl) return target.verifiedUrl;
  if (target.doi) return `https://doi.org/${target.doi}`;
  return null;
}

function CitationList({ citations, error, processing, onReanalyze }: { citations: ResourceCitation[]; error?: string; processing: boolean; onReanalyze: () => void }) {
  if (error) return <EmptyAiState icon={<RiAlertLine />} title="References unavailable" text={error} actionLabel="Try again" loading={processing} onAction={onReanalyze} />;
  if (!citations.length) return <EmptyAiState icon={<RiLinksLine />} title="No references extracted" text="Process this PDF to extract and resolve its reference list. Supported formats: numbered, author-year." actionLabel="Process & extract references" loading={processing} onAction={onReanalyze} />;

  const linkedCount = citations.filter((c) => resolvePaperUrl(c.target)).length;

  return <div className="space-y-3">
    <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-950/10 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[.03]">
      <div>
        <span className="text-[11px] font-semibold text-foreground">{citations.length} reference{citations.length !== 1 ? "s" : ""}</span>
        {linkedCount > 0 && <span className="ml-1.5 text-[10px] font-medium text-teal-700 dark:text-teal-400">· {linkedCount} linked</span>}
      </div>
      <button disabled={processing} onClick={onReanalyze} className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[9px] font-semibold text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:opacity-50">
        {processing ? <RiLoader4Line className="animate-spin" /> : <RiRefreshLine />}Reanalyze
      </button>
    </div>
    {citations.map((citation) => {
      const confidence = Math.round((citation.confidenceScore ?? 0) * 100);
      const paperUrl = resolvePaperUrl(citation.target);
      const year = citation.target.publicationYear ?? citation.target.year;
      const authorsRaw = citation.target.authors;
      const authors = Array.isArray(authorsRaw) ? authorsRaw.join(", ") : (authorsRaw ?? null);
      const linkLabel = citation.target.doi ? "Open original paper" : "Open verified source";

      return <article key={citation.id} className="group rounded-2xl border border-emerald-950/10 bg-white p-3.5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)] transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_16px_36px_-22px_rgba(13,148,136,0.28)] dark:border-white/10 dark:bg-white/[.03] dark:hover:border-teal-800">
        <div className="flex items-start justify-between gap-2">
          {paperUrl ? (
            <a href={paperUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold leading-5 text-foreground underline-offset-2 hover:text-teal-700 hover:underline dark:hover:text-teal-400">
              {citation.target.title ?? "Unresolved reference"}
            </a>
          ) : <p className="text-[11px] font-semibold leading-5 text-foreground">{citation.target.title ?? "Unresolved reference"}</p>}
          <span className={cn("shrink-0 rounded-full px-2 py-1 text-[8px] font-bold uppercase",
            confidence >= 80 ? "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400"
            : confidence >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
          )}>{confidence}%</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-muted-foreground">
          <span className={cn("rounded-md px-1.5 py-0.5 text-[8px] font-semibold uppercase",
            citation.target.type === "internal" ? "bg-sky-100 text-sky-700" : citation.target.type === "external" ? "bg-slate-100 text-slate-600" : "bg-muted text-muted-foreground"
          )}>{citation.target.type}</span>
          {year && <span>{year}</span>}
          {authors && <span className="truncate max-w-[160px]">{authors}</span>}
        </div>
        {citation.target.doi && <p className="mt-2 break-all text-[9px] font-mono text-muted-foreground/70">{citation.target.doi}</p>}
        {citation.rawReference && (
          <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2">
            <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/80">Reference as printed in the paper</p>
            <p className="mt-1 whitespace-pre-wrap text-[9px] leading-5 text-muted-foreground">{citation.rawReference}</p>
          </div>
        )}
        {!paperUrl && <p className="mt-2 text-[9px] leading-4 text-amber-700 dark:text-amber-400">No verified publisher link was found for this reference.</p>}
        {paperUrl && (
          <a href={paperUrl} target="_blank" rel="noreferrer"
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-700 to-emerald-600 px-3 text-[9px] font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5">
            <RiExternalLinkLine className="text-[11px]" />{linkLabel}
          </a>
        )}
      </article>;
    })}
  </div>;
}

function CitationGraph({ graph, citations, error, onProcess, processing, fullHeight = false }: {
  graph: ResourceGraph | null;
  citations: ResourceCitation[];
  error?: string;
  onProcess: () => void;
  processing: boolean;
  fullHeight?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [showCitedBy, setShowCitedBy] = useState(true);
  const [showSecondLayer, setShowSecondLayer] = useState(true);
  const [showRelated, setShowRelated] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [graphQuery, setGraphQuery] = useState("");
  const [layoutMode, setLayoutMode] = useState<GraphLayoutMode>("lineage");
  const graphNodes = useMemo(() => graph?.nodes ?? [], [graph]);
  const graphEdges = useMemo(() => graph?.edges ?? [], [graph]);
  const rootGraphNode = useMemo(
    () => graphNodes.find((node) => node.type === "current-resource") ?? graphNodes[0],
    [graphNodes],
  );
  const hasDiscoveryEdges = graphEdges.some((edge) => ["CITED_BY", "RELATED", "RELATED_WORK"].includes(graphEdgeRelation(edge)));
  const relationFilteredEdges = useMemo(() => graphEdges.filter((edge) => {
    const relation = graphEdgeRelation(edge);
    if (relation === "CITED_BY") return edge.source === rootGraphNode?.id ? showCitedBy : showSecondLayer;
    if (relation === "RELATED" || relation === "RELATED_WORK") return showRelated;
    return showReferences || !hasDiscoveryEdges;
  }), [graphEdges, hasDiscoveryEdges, rootGraphNode?.id, showCitedBy, showReferences, showRelated, showSecondLayer]);
  const searchMatchIds = useMemo(() => {
    const query = graphQuery.trim().toLowerCase();
    if (!query) return new Set<string>();
    return new Set(graphNodes.filter((node) => {
      const authorValue = node.data?.authors;
      const authors = Array.isArray(authorValue) ? authorValue.join(" ") : typeof authorValue === "string" ? authorValue : "";
      const venue = typeof node.data?.venue === "string" ? node.data.venue : "";
      return `${node.label} ${authors} ${venue}`.toLowerCase().includes(query);
    }).map((node) => node.id));
  }, [graphNodes, graphQuery]);
  const visibleEdges = useMemo(() => {
    if (!graphQuery.trim()) return relationFilteredEdges;
    const relevantIds = new Set(searchMatchIds);
    if (rootGraphNode) relevantIds.add(rootGraphNode.id);
    relationFilteredEdges.forEach((edge) => {
      if (searchMatchIds.has(edge.source) || searchMatchIds.has(edge.target)) {
        relevantIds.add(edge.source);
        relevantIds.add(edge.target);
      }
    });
    return relationFilteredEdges.filter((edge) => relevantIds.has(edge.source) && relevantIds.has(edge.target));
  }, [graphQuery, relationFilteredEdges, rootGraphNode, searchMatchIds]);
  const visibleNodeIds = useMemo(() => {
    const ids = new Set(visibleEdges.flatMap((edge) => [edge.source, edge.target]));
    if (rootGraphNode) ids.add(rootGraphNode.id);
    searchMatchIds.forEach((id) => ids.add(id));
    return ids;
  }, [rootGraphNode, searchMatchIds, visibleEdges]);
  const visibleNodes = useMemo(() => graphNodes.filter((node) => visibleNodeIds.has(node.id)), [graphNodes, visibleNodeIds]);

  const { flowNodes, flowEdges, currentNodeId } = useMemo(() => {
    const sourceCurrentNode = visibleNodes.find((n) => n.type === "current-resource") ?? visibleNodes[0];
    if (!sourceCurrentNode) return { flowNodes: [], flowEdges: [], currentNodeId: "" };

    const positions = runGraphLayout(visibleNodes, layoutMode);
    const fNodes: Node<{ label: React.ReactNode; paperUrl?: string | null; graphNodeId: string }>[] = visibleNodes.map((node) => {
      const pos = positions.get(node.id) ?? { x: 0, y: 0 };
      const isCurrent = node.id === sourceCurrentNode.id;
      const year = (node.data?.publicationYear ?? node.data?.year) as number | null | undefined;
      const citationCount = node.data?.citationCount as number | null | undefined;
      const paperUrl = node.data?.url as string | null | undefined;
      const authorValue = node.data?.authors;
      const authors = Array.isArray(authorValue)
        ? authorValue.filter((author): author is string => typeof author === "string").slice(0, 2).join(", ")
        : typeof authorValue === "string" ? authorValue.split(",").slice(0, 2).join(",") : "";
      const venue = typeof node.data?.venue === "string" ? node.data.venue : "";
      const relation = String(node.data?.relation ?? (node.type.includes("reference") ? "REFERENCES" : ""));
      const depth = Number(node.data?.depth ?? 0);
      const isReference = relation === "REFERENCES" || node.type.includes("reference") || node.type === "external-resource" || node.type === "internal-resource";
      const isRelated = relation === "RELATED" || node.type === "related-paper";
      const isSecondLayer = depth >= 2 || node.type === "second-layer-paper";
      const isSearchMatch = searchMatchIds.has(node.id);
      const tone = isCurrent
        ? { border: "#0f766e", bg: "#ccfbf1", color: "#134e4a", shadow: "0 10px 28px rgba(15,118,110,0.22)" }
        : isRelated
          ? { border: "#d97706", bg: "#fef3c7", color: "#92400e", shadow: "0 6px 18px rgba(217,119,6,0.12)" }
          : isReference
            ? { border: "#71717a", bg: "#f4f4f5", color: "#3f3f46", shadow: "0 4px 12px rgba(0,0,0,0.07)" }
            : isSecondLayer
              ? { border: "#6d28d9", bg: "#ede9fe", color: "#5b21b6", shadow: "0 6px 18px rgba(109,40,217,0.14)" }
              : { border: "#0369a1", bg: "#e0f2fe", color: "#075985", shadow: "0 6px 18px rgba(3,105,161,0.12)" };
      const kind = isCurrent ? "Selected paper" : isRelated ? "Related work" : isReference ? "Referenced work" : isSecondLayer ? "Second layer" : "Cites this paper";
      return {
        id: node.id,
        position: pos,
        sourcePosition: isRelated ? Position.Top : Position.Right,
        targetPosition: isReference ? Position.Right : isRelated ? Position.Top : Position.Left,
        data: {
          paperUrl,
          graphNodeId: node.id,
          label: (
            <div className="max-w-[178px]">
              <p className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest opacity-70">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{kind}
              </p>
              <p className="mt-1 line-clamp-2 text-[10.5px] font-semibold leading-[1.4]">{node.label}</p>
              {authors && <p className="mt-1 truncate text-[8.5px] opacity-70">{authors}</p>}
              <p className="mt-1 flex items-center gap-1 text-[8px] opacity-60">
                {year && <span>{year}</span>}
                {venue && <span className="max-w-[62px] truncate">· {venue}</span>}
                {citationCount != null && <span>· {citationCount} citations</span>}
              </p>
            </div>
          ),
        },
        style: {
          width: isCurrent ? 220 : 200,
          cursor: "pointer",
          borderRadius: 14,
          border: `${node.id === selectedNodeId || isSearchMatch ? 3 : 1.5}px solid ${tone.border}`,
          background: tone.bg,
          color: tone.color,
          boxShadow: node.id === selectedNodeId
            ? `0 0 0 5px ${tone.border}24, ${tone.shadow}`
            : isSearchMatch ? `0 0 0 4px ${tone.border}18, ${tone.shadow}` : tone.shadow,
          padding: "10px 12px",
          opacity: graphQuery.trim() && !isSearchMatch && !isCurrent ? 0.72 : 1,
        },
      };
    });
    const fEdges: Edge[] = visibleEdges.map((edge) => {
      const relation = graphEdgeRelation(edge);
      const isCitedBy = relation === "CITED_BY";
      const isRelated = relation === "RELATED" || relation === "RELATED_WORK";
      const isSecondLayerEdge = isCitedBy && edge.source !== sourceCurrentNode.id;
      const touchesSelection = !selectedNodeId || edge.source === selectedNodeId || edge.target === selectedNodeId;
      const stroke = isSecondLayerEdge ? "#7c3aed" : isCitedBy ? "#0284c7" : isRelated ? "#d97706" : "#71717a";
      return {
        id: edge.id, source: edge.source, target: edge.target,
        type: layoutMode === "lineage" ? "smoothstep" : "default",
        label: isRelated ? "Related" : relation === "REFERENCES" ? "References" : isSecondLayerEdge ? "Layer 2" : undefined,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: stroke },
        style: { stroke, strokeWidth: touchesSelection ? (isCitedBy ? 2.4 : 1.8) : 1.2, opacity: touchesSelection ? 0.88 : 0.14, strokeDasharray: isRelated ? "7 5" : relation === "REFERENCES" ? "3 4" : undefined },
        labelStyle: { fontSize: 8, fill: stroke, fontWeight: 700, opacity: touchesSelection ? 1 : 0.2 },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 },
        animated: touchesSelection && (isRelated || Boolean(selectedNodeId)),
      };
    });
    return { flowNodes: fNodes, flowEdges: fEdges, currentNodeId: sourceCurrentNode.id };
  }, [graphQuery, layoutMode, searchMatchIds, visibleNodes, visibleEdges, selectedNodeId]);

  const selectedGraphNode = useMemo(
    () => graphNodes.find((node) => node.id === selectedNodeId) ?? null,
    [graphNodes, selectedNodeId],
  );
  const selectedConnectionCount = useMemo(
    () => selectedNodeId ? graphEdges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId).length : 0,
    [graphEdges, selectedNodeId],
  );

  if (error) return <EmptyAiState icon={<RiAlertLine />} title="Graph unavailable" text={error} />;

  if (!graphEdges.length) {
    return (
      <EmptyAiState
        icon={<RiMindMap />}
        title="No connected papers yet"
        text={citations.length
          ? "Citations were found but no external connections could be resolved. Try re-processing."
          : "Process this PDF to extract references and build a connected-paper graph."}
        actionLabel={citations.length ? "Build research graph" : "Process PDF"}
        loading={processing}
        onAction={onProcess}
      />
    );
  }

  const stats = graph?.stats ?? {
    references: graphEdges.filter((edge) => graphEdgeRelation(edge) === "REFERENCES").length,
    citedBy: graphEdges.filter((edge) => graphEdgeRelation(edge) === "CITED_BY" && edge.source === rootGraphNode?.id).length,
    secondLayer: graphEdges.filter((edge) => graphEdgeRelation(edge) === "CITED_BY" && edge.source !== rootGraphNode?.id).length,
    related: graphEdges.filter((edge) => ["RELATED", "RELATED_WORK"].includes(graphEdgeRelation(edge))).length,
  };

  const renderCanvas = (full: boolean) => (
    <ReactFlow
      key={`${layoutMode}-${showReferences}-${showCitedBy}-${showSecondLayer}-${showRelated}-${graphQuery}`}
      nodes={flowNodes}
      edges={flowEdges}
      fitView
      fitViewOptions={{ padding: full ? 0.16 : 0.22, maxZoom: 1.15 }}
      minZoom={0.08}
      maxZoom={2.5}
      nodesConnectable={false}
      nodesDraggable
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => {
        setSelectedNodeId(node.data.graphNodeId);
      }}
      onPaneClick={() => setSelectedNodeId(null)}
    >
      <Background gap={20} size={0.8} color="#d4d4d8" />
      <Controls showInteractive={false} className="!border-border !bg-background/90 !shadow-sm" />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) => {
          if (n.id === currentNodeId) return "#0f766e";
          const sourceNode = graphNodes.find((node) => node.id === n.id);
          const relation = String(sourceNode?.data?.relation ?? "");
          const depth = Number(sourceNode?.data?.depth ?? 0);
          if (relation === "RELATED") return "#d97706";
          if (relation === "REFERENCES") return "#71717a";
          if (depth >= 2) return "#7c3aed";
          return "#0284c7";
        }}
        className={cn("!rounded-xl !border !border-border !bg-background/95 !shadow-lg", full ? "!h-[100px] !w-[140px]" : "!h-[72px] !w-[100px]")}
      />
    </ReactFlow>
  );

  return (
    <div className="space-y-3.5">
      {fullHeight ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-950/10 bg-gradient-to-r from-[#0b2f2b] via-[#0f443d] to-[#0b2f2b] px-4 py-3 text-white shadow-lg shadow-teal-950/10 dark:border-white/10">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg ring-1 ring-white/15"><RiMindMap /></span>
          <div className="min-w-48 flex-1">
            <p className="text-[13px] font-bold">Connected paper landscape</p>
            <p className="text-[9px] text-white/60">Parent paper → direct citations → second-generation research</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <GraphOverviewMetric label="Papers" value={graphNodes.length} tone="teal" />
            <GraphOverviewMetric label="Direct" value={stats.citedBy} tone="sky" />
            <GraphOverviewMetric label="Layer 2" value={stats.secondLayer} tone="violet" />
            <GraphOverviewMetric label="Related" value={stats.related} tone="amber" />
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[8px] font-semibold text-white/75">
            {graph?.provider === "semantic-scholar" ? "Semantic Scholar" : graph?.provider === "openalex" ? "OpenAlex + Crossref" : "Local graph"}
          </span>
        </div>
      ) : <div className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-gradient-to-br from-slate-50 via-white to-teal-50/80 shadow-sm dark:border-white/10 dark:from-slate-950/60 dark:via-[#0b1715] dark:to-teal-950/20">
        <div className="border-b border-emerald-950/10 px-4 py-3 dark:border-white/10">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-500 text-lg text-white shadow-lg shadow-teal-900/15"><RiMindMap /></span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold tracking-[-0.01em]">Citation lineage</p>
              <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">Explore how this paper connects to references, citing research, and related work.</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[9px] font-semibold text-muted-foreground shadow-sm">
              {graph?.provider === "semantic-scholar" ? "Semantic Scholar" : graph?.provider === "openalex" ? "OpenAlex + Crossref" : "Local graph"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5 px-4 py-2.5 text-center text-[9px] font-semibold">
          <span className="rounded-lg bg-zinc-100 px-2 py-1.5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">Referenced works</span>
          <span className="text-muted-foreground">←</span>
          <span className="rounded-lg bg-teal-100 px-2 py-1.5 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300">Selected paper</span>
          <span className="text-muted-foreground">→</span>
          <span className="rounded-lg bg-sky-100 px-2 py-1.5 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">Citing papers → layer 2</span>
        </div>
      </div>}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-48 flex-1 sm:max-w-sm">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground" />
          <input
            value={graphQuery}
            onChange={(event) => setGraphQuery(event.target.value)}
            placeholder="Find a paper, author, or venue"
            className="h-10 w-full rounded-xl border border-emerald-950/10 bg-white pl-9 pr-8 text-[11px] shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/[.04]"
          />
          {graphQuery && <button onClick={() => setGraphQuery("")} aria-label="Clear graph search" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><RiCloseLine /></button>}
        </label>
        {graphQuery && <span className="text-[9px] font-semibold text-muted-foreground">{searchMatchIds.size} match{searchMatchIds.size === 1 ? "" : "es"}</span>}
        <div className="flex h-10 items-center rounded-xl border border-emerald-950/10 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[.04]" aria-label="Graph layout">
          <button onClick={() => setLayoutMode("lineage")} className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-semibold transition-all", layoutMode === "lineage" ? "bg-teal-700 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")} title="Citation generation layout"><RiLinksLine />Lineage</button>
          <button onClick={() => setLayoutMode("constellation")} className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-semibold transition-all", layoutMode === "constellation" ? "bg-teal-700 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")} title="Connected paper map"><RiMindMap />Map</button>
        </div>
        {!fullHeight && <button onClick={() => setExpanded(true)} className="ml-auto h-9 rounded-xl border border-border bg-background px-3 text-[9px] font-semibold text-muted-foreground shadow-sm hover:text-foreground">Expand</button>}
        <button disabled={processing} onClick={onProcess} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground disabled:opacity-50" title="Rebuild graph">
          {processing ? <RiLoader4Line className="animate-spin" /> : <RiRefreshLine />}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <GraphFilter label="Direct citations" count={stats.citedBy} active={showCitedBy} onClick={() => setShowCitedBy((value) => !value)} tone="sky" />
        <GraphFilter label="Layer 2" count={stats.secondLayer} active={showSecondLayer} onClick={() => setShowSecondLayer((value) => !value)} tone="violet" />
        <GraphFilter label="Related" count={stats.related} active={showRelated} onClick={() => setShowRelated((value) => !value)} tone="amber" />
        <GraphFilter label="References" count={stats.references} active={showReferences || !hasDiscoveryEdges} onClick={() => setShowReferences((value) => !value)} tone="zinc" />
      </div>
      <div className={cn("relative overflow-hidden rounded-2xl border border-emerald-950/10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.09),transparent_32%),linear-gradient(135deg,#f8fbfa,#eef5f3)] shadow-inner dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_30%),linear-gradient(135deg,#07110f,#0b1715)]", fullHeight ? "h-[calc(100dvh-16rem)] min-h-[520px]" : "h-[460px] min-h-[380px]")}>
        {renderCanvas(fullHeight)}
        <GraphCanvasLegend />
        {graphQuery.trim() && searchMatchIds.size === 0 && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/80 bg-white/90 px-5 py-4 text-center shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#0b1715]/90">
            <RiSearchLine className="mx-auto text-xl text-muted-foreground" />
            <p className="mt-2 text-[11px] font-semibold">No matching papers</p>
            <p className="mt-1 text-[9px] text-muted-foreground">Try another title, author, or venue.</p>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-[8px] font-semibold text-slate-500 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#0b1715]/85 dark:text-slate-400 sm:block">
          Drag nodes · scroll to zoom · select a paper to trace its connections
        </div>
        {fullHeight && selectedGraphNode && (
          <div className="absolute right-3 top-3 z-10 w-[min(340px,calc(100%-1.5rem))]">
            <GraphPaperDetails node={selectedGraphNode} connectionCount={selectedConnectionCount} onClose={() => setSelectedNodeId(null)} />
          </div>
        )}
      </div>
      {!fullHeight && selectedGraphNode && (
        <GraphPaperDetails node={selectedGraphNode} connectionCount={selectedConnectionCount} onClose={() => setSelectedNodeId(null)} />
      )}
      {!fullHeight && <div className="grid grid-cols-4 gap-1.5">
        <GraphStat label="Direct citations" value={stats.citedBy} tone="sky" />
        <GraphStat label="2nd layer" value={stats.secondLayer} tone="violet" />
        <GraphStat label="Related" value={stats.related} tone="amber" />
        <GraphStat label="References" value={stats.references} tone="zinc" />
      </div>}
      <div className="flex items-center justify-between gap-2 text-[9px] text-muted-foreground">
        <span>{visibleNodes.length} visible of {graphNodes.length} papers · {visibleEdges.length} visible connections</span>
        {graph?.generatedAt && <span>Saved {new Date(graph.generatedAt).toLocaleDateString()}</span>}
      </div>
      {graph?.warning && <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[8px] leading-4 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400">{graph.warning}</p>}
      {expanded && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/55 p-3 backdrop-blur-md sm:p-5">
          <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/15 bg-background shadow-[0_30px_120px_-30px_rgba(2,6,23,0.85)]">
            <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-[#0b2f2b] via-[#0f443d] to-[#0b2f2b] px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg ring-1 ring-white/15"><RiMindMap /></div>
              <div>
                <h3 className="text-sm font-semibold">Research connection graph</h3>
                <p className="text-[10px] text-white/60">Selected paper → direct citing papers → second-level citations, with related and referenced work</p>
              </div>
              <div className="ml-auto flex items-center gap-1 rounded-xl bg-white/10 p-1 ring-1 ring-white/10">
                <button onClick={() => setLayoutMode("lineage")} className={cn("rounded-lg px-2.5 py-1.5 text-[9px] font-semibold", layoutMode === "lineage" ? "bg-white text-teal-900" : "text-white/65")}><RiLinksLine className="mr-1 inline" />Lineage</button>
                <button onClick={() => setLayoutMode("constellation")} className={cn("rounded-lg px-2.5 py-1.5 text-[9px] font-semibold", layoutMode === "constellation" ? "bg-white text-teal-900" : "text-white/65")}><RiMindMap className="mr-1 inline" />Map</button>
              </div>
              <button onClick={() => setExpanded(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close expanded graph"><RiCloseLine /></button>
            </div>
            <div className="relative flex min-h-0 flex-1">
              <div className="relative min-w-0 flex-1 bg-muted/20">{renderCanvas(true)}<GraphCanvasLegend /></div>
              {selectedGraphNode && (
                <aside className="w-[340px] shrink-0 overflow-y-auto border-l border-border bg-background p-4">
                  <GraphPaperDetails node={selectedGraphNode} connectionCount={selectedConnectionCount} onClose={() => setSelectedNodeId(null)} expanded />
                </aside>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GraphOverviewMetric({ label, value, tone }: { label: string; value: number; tone: "teal" | "sky" | "violet" | "amber" }) {
  const toneClass = tone === "teal"
    ? "bg-teal-300/15 text-teal-100 ring-teal-200/20"
    : tone === "sky"
      ? "bg-sky-300/15 text-sky-100 ring-sky-200/20"
      : tone === "violet"
        ? "bg-violet-300/15 text-violet-100 ring-violet-200/20"
        : "bg-amber-300/15 text-amber-100 ring-amber-200/20";
  return (
    <span className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ring-1", toneClass)}>
      <strong className="text-[11px]">{value}</strong><span className="text-[8px] font-medium opacity-75">{label}</span>
    </span>
  );
}

function GraphCanvasLegend() {
  const items = [
    { label: "Selected paper", color: "bg-teal-600" },
    { label: "Direct citation", color: "bg-sky-600" },
    { label: "Second layer", color: "bg-violet-600" },
    { label: "Related work", color: "bg-amber-500" },
    { label: "Reference", color: "bg-zinc-500" },
  ];
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 hidden max-w-[420px] flex-wrap gap-x-3 gap-y-1.5 rounded-xl border border-white/80 bg-white/85 px-3 py-2 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#0b1715]/85 sm:flex">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-600 dark:text-slate-300">
          <span className={cn("h-2 w-2 rounded-full shadow-sm", item.color)} />{item.label}
        </span>
      ))}
    </div>
  );
}

function GraphPaperDetails({ node, connectionCount = 0, onClose, expanded = false }: {
  node: ResourceGraph["nodes"][number];
  connectionCount?: number;
  onClose: () => void;
  expanded?: boolean;
}) {
  const data = node.data ?? {};
  const authors = Array.isArray(data.authors)
    ? data.authors.filter((author): author is string => typeof author === "string").join(", ")
    : typeof data.authors === "string" ? data.authors : null;
  const year = (data.publicationYear ?? data.year) as number | null | undefined;
  const venue = typeof data.venue === "string" ? data.venue : null;
  const citationCount = typeof data.citationCount === "number" ? data.citationCount : null;
  const doi = typeof data.doi === "string" ? data.doi : null;
  const paperUrl = typeof data.url === "string"
    ? data.url
    : doi ? `https://doi.org/${doi}` : null;
  const abstract = typeof data.abstract === "string" ? data.abstract : null;
  const context = typeof data.context === "string" ? data.context : null;
  const relation = String(data.relation ?? (node.type.includes("reference") ? "REFERENCES" : "ROOT"));
  const relationLabel = relation === "CITED_BY"
    ? Number(data.depth ?? 1) >= 2 ? "Second-generation citing paper" : "Cites the selected paper"
    : relation === "RELATED" ? "Related research" : relation === "REFERENCES" ? "Referenced by the selected paper" : "Selected paper";

  return (
    <article className={cn("rounded-2xl border border-emerald-950/10 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#0b1715]/95", expanded && "border-0 p-0 shadow-none")}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">{relationLabel}</p>
          <h4 className={cn("mt-1.5 font-semibold leading-5", expanded ? "text-sm" : "text-[12px]")}>{node.label}</h4>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Close paper details"><RiCloseLine /></button>
      </div>
      {(authors || year || venue) && (
        <div className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-muted-foreground">
          {authors && <span>{authors}</span>}
          {year && <span>• {year}</span>}
          {venue && <span>• {venue}</span>}
        </div>
      )}
      {(context || abstract) && (
        <p className={cn("mt-2.5 text-[10px] leading-5 text-muted-foreground", expanded ? "line-clamp-none" : "line-clamp-3")}>
          {context ? `Citation context: ${context}` : abstract}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        {citationCount != null && <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[9px] font-semibold text-muted-foreground">{citationCount.toLocaleString()} citations</span>}
        <span className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-[9px] font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">{connectionCount} connection{connectionCount === 1 ? "" : "s"}</span>
        {paperUrl && (
          <a href={paperUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-700 to-emerald-600 px-3 text-[9px] font-semibold text-white shadow-sm hover:shadow-md">
            <RiExternalLinkLine /> Open paper
          </a>
        )}
      </div>
    </article>
  );
}

function GraphFilter({ label, count, active, onClick, tone }: { label: string; count: number; active: boolean; onClick: () => void; tone: "sky" | "violet" | "amber" | "zinc" }) {
  const activeClass = tone === "sky"
    ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
    : tone === "violet"
      ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300"
      : tone === "amber"
        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
        : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
  return <button onClick={onClick} aria-pressed={active} className={cn("rounded-full border px-3 py-1.5 text-[9px] font-semibold shadow-sm transition-all hover:-translate-y-0.5", active ? activeClass : "border-border bg-background text-muted-foreground opacity-60")}>{label} · {count}</button>;
}

function GraphStat({ label, value, tone }: { label: string; value: number; tone: "sky" | "violet" | "amber" | "zinc" }) {
  const color = tone === "sky" ? "text-sky-600" : tone === "violet" ? "text-violet-600" : tone === "amber" ? "text-amber-600" : "text-zinc-600 dark:text-zinc-300";
  return <div className="rounded-xl border border-emerald-950/10 bg-white px-2 py-2.5 text-center shadow-sm dark:border-white/10 dark:bg-white/[.03]"><p className={cn("text-[15px] font-black", color)}>{value}</p><p className="mt-0.5 text-[8px] font-medium leading-3 text-muted-foreground">{label}</p></div>;
}

function EmptyAiState({ icon, title, text, actionLabel, loading, onAction }: { icon: React.ReactNode; title: string; text: string; actionLabel?: string; loading?: boolean; onAction?: () => void }) {
  return <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
    <div>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl text-muted-foreground">{icon}</div>
      <p className="mt-3 text-[11px] font-black">{title}</p>
      <p className="mx-auto mt-1 max-w-52 break-words text-[9px] leading-4 text-muted-foreground">{text}</p>
      {actionLabel && onAction && <button disabled={loading} onClick={onAction} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-[8px] font-black text-white disabled:opacity-50">{loading ? <RiLoader4Line className="animate-spin" /> : <RiPlayCircleLine />}{actionLabel}</button>}
    </div>
  </div>;
}

function NativeDocument({ resource }: { resource: Resource }) {
  return <div className="mx-auto flex min-h-[620px] max-w-2xl items-center justify-center rounded-lg border border-border bg-card p-8 text-center shadow-sm"><div><RiFileTextLine className="mx-auto text-5xl text-muted-foreground/20" /><p className="mt-4 text-[12px] font-black">{resource.title}</p><p className="mt-2 max-w-md text-[10px] leading-5 text-muted-foreground">{resource.description || "This file opens in its native viewer."}</p><a href={signedUrl(resource)} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-sky-600 px-4 text-[10px] font-bold text-white"><RiExternalLinkLine />Open document</a></div></div>;
}

function NoteCard({ annotation, owned, onDelete, onToggleShare, onGoToPage }: { annotation: Annotation; owned: boolean; onDelete: (id: string) => void; onToggleShare: (annotation: Annotation) => void; onGoToPage: (page: number) => void }) {
  return (
    <article className="group rounded-2xl border border-emerald-950/10 bg-white p-3.5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)] transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_16px_36px_-22px_rgba(13,148,136,0.35)] dark:border-white/10 dark:bg-white/[.035] dark:hover:border-teal-800">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("rounded-full px-2.5 py-1 text-[9px] font-semibold",
          annotation.isShared ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40" : "bg-muted text-muted-foreground"
        )}>{annotation.isShared ? "Shared" : "Private"}</span>
        {annotation.page && <button onClick={() => onGoToPage(annotation.page!)} className="rounded-lg bg-sky-50 px-2.5 py-1 text-[9px] font-semibold text-sky-700 transition-colors hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400">Page {annotation.page}</button>}
      </div>
      {annotation.highlight && <blockquote className="mt-3 rounded-r-xl border-l-2 border-amber-400 bg-amber-50/70 px-3 py-2 text-[10px] italic leading-5 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300">{annotation.highlight}</blockquote>}
      {annotation.note && <p className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-foreground/90">{annotation.note}</p>}
      {annotation.user && <p className="mt-3 text-[9px] text-muted-foreground">Shared by <span className="font-semibold">{annotation.user.name}</span></p>}
      {owned && (
        <div className="mt-3 flex justify-end gap-1 border-t border-border/70 pt-2.5">
          <button onClick={() => onToggleShare(annotation)} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-semibold text-muted-foreground transition-colors hover:bg-muted"><RiShareLine />{annotation.isShared ? "Make private" : "Share"}</button>
          <button onClick={() => onDelete(annotation.id)} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"><RiDeleteBinLine />Delete</button>
        </div>
      )}
    </article>
  );
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-background shadow-[0_30px_100px_-30px_rgba(2,6,23,0.7)] dark:border-white/10">
        <div className="flex items-center justify-between border-b border-emerald-950/10 bg-gradient-to-r from-teal-50 via-white to-cyan-50 px-5 py-4 dark:border-white/10 dark:from-teal-950/30 dark:via-[#0b1715] dark:to-cyan-950/20">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg text-white shadow-lg shadow-amber-900/15"><RiStickyNoteLine /></span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">Reading note</p>
              <h2 className="mt-0.5 truncate text-[14px] font-semibold leading-tight">{resource.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground shadow-sm transition-colors hover:text-foreground"><RiCloseLine /></button>
        </div>
        <div className="space-y-4 p-5">
          <Field label="Highlighted text">
            <textarea value={highlight} onChange={(event) => setHighlight(event.target.value)} rows={2} placeholder="Paste a memorable passage…" className="w-full resize-none rounded-xl border border-border bg-muted/20 p-3.5 text-[12px] outline-none transition-all focus:border-teal-400 focus:bg-background focus:ring-4 focus:ring-teal-500/10" />
          </Field>
          <Field label="Your note">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Write your understanding, question, or summary…" className="w-full resize-y rounded-xl border border-border bg-muted/20 p-3.5 text-[12px] outline-none transition-all focus:border-teal-400 focus:bg-background focus:ring-4 focus:ring-teal-500/10" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Page number">
              <input type="number" min={1} value={page} onChange={(event) => setPage(event.target.value)} placeholder="Optional" className="h-9 w-full rounded-lg border border-border bg-muted/20 px-3 text-[11px] outline-none transition-colors focus:border-teal-500/60" />
            </Field>
            <Field label="Related document">
              <select value={relatedId} onChange={(event) => setRelatedId(event.target.value)} className="h-9 w-full rounded-lg border border-border bg-muted/20 px-3 text-[10px] outline-none transition-colors focus:border-teal-500/60">
                <option value="">None</option>
                {resources.filter((item) => item.id !== resource.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </Field>
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/30">
            <span><span className="block text-[10px] font-medium">Share this note</span><span className="mt-0.5 block text-[8px] text-muted-foreground">Other students with access can read it.</span></span>
            <input type="checkbox" checked={shared} onChange={(event) => setShared(event.target.checked)} className="h-4 w-4 accent-teal-600" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="h-9 rounded-lg border border-border px-4 text-[10px] font-medium transition-colors hover:bg-muted">Cancel</button>
          <button onClick={save} disabled={saving || (!highlight.trim() && !note.trim() && !relatedId)} className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 px-5 text-[11px] font-semibold text-white shadow-md shadow-teal-900/15 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40">
            {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}Save note
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>{children}</label>;
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.09),transparent_38%)] p-8 text-center">
      <div className="max-w-sm rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)] backdrop-blur dark:border-white/10 dark:bg-white/[.035]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-500 text-3xl text-white shadow-xl shadow-teal-900/20"><RiBookOpenLine /></span>
        <h2 className="mt-5 text-[16px] font-bold tracking-[-0.02em]">Choose a paper to begin</h2>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Open your paper library, select a resource, and start reading with notes and AI research beside you.</p>
      </div>
    </div>
  );
}

// ─── Per-summary section sub-components ──────────────────────────────────────
// These were originally defined as a follow-up that was never checked in — the
// summary panel references them but they don't exist anywhere in the bundle.
// Defining them here gives each section its own distinct visual treatment, and
// gives the no-summary case a proper "Create summary" CTA.

function SummaryPaperHeader({
  identity,
  lang,
  setLang,
  hasBangla,
  summaryStatus,
  teacherMode,
  togglingVisibility,
  onToggleVisibility,
}: {
  identity?: SummaryEnvelope["documentIdentity"];
  lang: "en" | "bn";
  setLang: (value: "en" | "bn") => void;
  hasBangla: boolean;
  summaryStatus: string | null;
  teacherMode: boolean;
  togglingVisibility: boolean;
  onToggleVisibility: () => void;
}) {
  const isHidden = summaryStatus === "HIDDEN";
  const sourceLabel = identity?.sourceType === "RESEARCH_SUMMARY"
    ? "Prepared research pack"
    : identity?.sourceType === "FULL_PAPER" ? "Full research paper" : "Extracted document";
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-950/10 bg-gradient-to-r from-teal-50 via-white to-cyan-50/70 px-3.5 py-3 shadow-sm dark:border-white/10 dark:from-teal-950/25 dark:via-[#0b1715] dark:to-cyan-950/20">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-md shadow-teal-900/15">
          <RiFileTextLine className="text-[15px]" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">AI Summary</p>
            {identity && <span className="hidden rounded-full bg-background/90 px-2 py-0.5 text-[8px] font-semibold text-teal-700 shadow-sm dark:text-teal-300 sm:inline-flex">{sourceLabel}</span>}
          </div>
          <p className="max-w-[340px] truncate text-[12px] font-semibold leading-tight">
            {identity?.detectedTitle || (summaryStatus === "PENDING" ? "Awaiting generation" : "Bilingual reading guide")}
          </p>
          {identity?.detectedAuthors?.length ? <p className="mt-1 max-w-[340px] truncate text-[9px] text-muted-foreground">{identity.detectedAuthors.join(", ")}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {teacherMode && (
          <button
            onClick={onToggleVisibility}
            disabled={togglingVisibility}
            title={isHidden ? "Publish to students" : "Hide from students"}
            className={cn(
              "flex h-7 items-center gap-1 rounded-md px-2 text-[8px] font-semibold transition-colors disabled:opacity-50",
              isHidden
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {togglingVisibility ? <RiLoader4Line className="animate-spin" /> : isHidden ? <RiCheckLine /> : <RiCloseLine />}
            {isHidden ? "Publish" : "Visible"}
          </button>
        )}
        <div className="flex h-8 items-center rounded-lg border border-border bg-background p-0.5 text-[9px] font-bold shadow-sm">
          <button
            onClick={() => setLang("en")}
            className={cn(
              "flex h-full items-center gap-1 rounded-[5px] px-2 transition-colors",
              lang === "en"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Show English summary"
          >
            EN
          </button>
          <button
            onClick={() => setLang("bn")}
            disabled={!hasBangla}
            className={cn(
              "flex h-full items-center gap-1 rounded-[5px] px-2 font-bn transition-colors",
              lang === "bn"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              !hasBangla && "cursor-not-allowed opacity-40"
            )}
            title={hasBangla ? "Show বাংলা summary" : "Bangla summary not available for this paper"}
          >
            বাং
          </button>
        </div>
      </div>
    </div>
  );
}

function ResearchFlow({ sections, lang }: { sections: [string, string][]; lang: "en" | "bn" }) {
  if (!sections.length) return null;
  return (
    <section className="rounded-2xl border border-emerald-950/10 bg-white/70 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[.025]">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {lang === "bn" ? "গবেষণার প্রবাহ" : "Research flow"}
          </p>
          <p className="mt-0.5 text-[9px] text-muted-foreground/70">
            {lang === "bn" ? "লক্ষ্য থেকে উপসংহার পর্যন্ত" : "From objective to conclusion"}
          </p>
        </div>
        <span className="rounded-full bg-background px-2.5 py-1 text-[9px] font-semibold text-muted-foreground shadow-sm">
          {sections.length} {lang === "bn" ? "ধাপ" : "stages"}
        </span>
      </div>
      <div className="space-y-0">
        {sections.map(([label, value], index) => (
          <div key={label} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
            <div className="flex flex-col items-center">
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-black text-white shadow-sm",
                index === 0 ? "bg-sky-500" : index === 1 ? "bg-violet-500" : index === 2 ? "bg-amber-500" : "bg-emerald-500",
              )}>{index + 1}</span>
              {index < sections.length - 1 && <span className="min-h-3 flex-1 border-l-2 border-dashed border-border" />}
            </div>
            <div className={cn(index < sections.length - 1 && "pb-2")}>
              <SummarySectionCard label={label} value={value} lang={lang} variant={index} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummarySectionCard({
  label,
  value,
  lang,
  variant,
}: {
  label: string;
  value: string;
  lang: "en" | "bn";
  variant: number;
}) {
  // Each variant gets its own accent color so the 2x2 grid feels visually
  // varied instead of four identical cards.
  const accents = [
    { ring: "border-sky-200/70 dark:border-sky-900/40", dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-300" },
    { ring: "border-violet-200/70 dark:border-violet-900/40", dot: "bg-violet-500", text: "text-violet-700 dark:text-violet-300" },
    { ring: "border-amber-200/70 dark:border-amber-900/40", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
    { ring: "border-emerald-200/70 dark:border-emerald-900/40", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  ] as const;
  const accent = accents[variant % accents.length];
  return (
    <div className={cn("rounded-xl border bg-background p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md", accent.ring)}>
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
        <p className={cn("text-[10px] font-bold uppercase tracking-wider", accent.text)}>{label}</p>
      </div>
      <p
        lang={lang === "bn" ? "bn" : "en"}
        className={cn("mt-2 text-[11px] leading-5 text-foreground/90", lang === "bn" && "font-bn")}
      >
        {value}
      </p>
    </div>
  );
}

function KeyContributionGrid({ label, items, lang }: { label: string; items: string[]; lang: "en" | "bn" }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/60 to-white p-3.5 shadow-sm dark:border-teal-900/30 dark:from-teal-950/20 dark:to-background">
      <div className="flex items-center gap-1.5">
        <RiSparklingLine className="text-[11px] text-teal-600 dark:text-teal-400" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">{label}</p>
        <span className="ml-auto text-[8px] font-medium text-muted-foreground">{items.length}</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-2.5 rounded-xl bg-background/70 px-3 py-2"
          >
            <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[8px] font-bold text-white">
              {index + 1}
            </span>
            <span
              lang={lang === "bn" ? "bn" : "en"}
              className={cn("text-[11px] leading-5 text-foreground/90", lang === "bn" && "font-bn")}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LimitationsList({ label, items, lang }: { label: string; items: string[]; lang: "en" | "bn" }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-2xl border border-dashed border-rose-200/70 bg-rose-50/40 p-3.5 dark:border-rose-900/30 dark:bg-rose-950/10">
      <div className="flex items-center gap-1.5">
        <RiAlertLine className="text-[11px] text-rose-500 dark:text-rose-400" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">{label}</p>
        <span className="ml-auto text-[8px] font-medium text-muted-foreground">{items.length}</span>
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-2.5 rounded-xl border border-rose-200/40 bg-background/70 px-3 py-2 dark:border-rose-900/30"
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
            <span
              lang={lang === "bn" ? "bn" : "en"}
              className={cn("text-[11px] leading-5 text-foreground/90", lang === "bn" && "font-bn")}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function KeywordChips({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-2xl border border-border/60 bg-muted/20 p-3.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="ml-auto text-[8px] font-medium text-muted-foreground">{items.length}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-semibold text-foreground/80 shadow-sm"
          >
            #{item}
          </span>
        ))}
      </div>
    </section>
  );
}

/**
 * Shown when a paper exists in the database but no AI summary has been
 * generated for it yet. This is the "give the user a CTA to create a new
 * summary" path — the backend already exposes a /summary/regenerate endpoint
 * that creates a fresh row for the resource without re-extracting text or
 * re-resolving citations. We surface that here so the user can act on the
 * empty state in one click.
 */
function ReadyToSummarizeCard({
  processing,
  onGenerate,
  extractedTextPreview,
}: {
  processing: boolean;
  onGenerate: () => void;
  extractedTextPreview: ExtractedTextPreview | null;
}) {
  const hasPreview = extractedTextPreview?.status === "READY";
  const totalChars = extractedTextPreview?.totalChars ?? 0;
  const pageCount = extractedTextPreview?.pageCount ?? null;

  return (
    <div className="space-y-2.5">
      <div className="relative overflow-hidden rounded-xl border border-teal-200/70 bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/60 p-4 dark:border-teal-900/40 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/30">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-300/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-6 h-28 w-28 rounded-full bg-cyan-300/25 blur-2xl" />
        <div className="relative">
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="absolute inset-0 -z-10 animate-pulse rounded-2xl bg-teal-400/25" />
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30 ring-2 ring-teal-200/60 dark:ring-teal-900/40">
                <RiBrainLine className="text-xl" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">
                No summary yet
              </p>
              <h3 className="mt-0.5 text-[13px] font-semibold leading-tight">
                Create an AI summary for this paper
              </h3>
              <p className="mt-1 text-[10px] leading-[1.55] text-muted-foreground">
                Generate a bilingual reading guide in English and বাংলা — a professional
                summary plus goals, methods, results, conclusions, key contributions,
                limitations, and keywords. The result is saved and shared.
              </p>
            </div>
          </div>

          {/* Paper stats row — gives the user confidence the AI is looking at the
              right thing. */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-teal-200/70 bg-white/60 px-2 py-0.5 text-[8px] font-medium text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/30 dark:text-teal-300">
              <RiFileTextLine className="mr-0.5 inline" /> PDF ready
            </span>
            {pageCount ? (
              <span className="rounded-full border border-border bg-white/60 px-2 py-0.5 text-[8px] font-medium text-muted-foreground dark:bg-background/60">
                {pageCount} page{pageCount === 1 ? "" : "s"}
              </span>
            ) : null}
            {totalChars > 0 ? (
              <span className="rounded-full border border-border bg-white/60 px-2 py-0.5 text-[8px] font-medium text-muted-foreground dark:bg-background/60">
                {(totalChars / 1000).toFixed(1)}k chars extracted
              </span>
            ) : (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[8px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                Text will be extracted on first run
              </span>
            )}
          </div>

          <button
            disabled={processing}
            onClick={onGenerate}
            className="group relative mt-4 inline-flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 via-teal-600 to-cyan-600 px-5 text-[11px] font-semibold text-white shadow-lg shadow-teal-600/30 transition-all hover:shadow-xl hover:shadow-teal-600/40 disabled:opacity-50"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {processing ? (
              <RiLoader4Line className="animate-spin" />
            ) : (
              <RiSparklingLine className="transition-transform group-hover:rotate-12" />
            )}
            {processing ? "Creating summary…" : "Create AI summary"}
          </button>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[8px] text-muted-foreground">
            <RiTimeLine /> Bilingual (English + বাংলা) · Takes 30–60 seconds
          </p>
        </div>
      </div>

      {/* Show the user exactly what text the AI will see — preview of the
          extracted PDF content, or a friendly message if text hasn't been
          extracted yet. Helps build trust before they click the CTA. */}
      {hasPreview && extractedTextPreview?.preview ? (
        <details className="group rounded-lg border border-border bg-muted/20 p-3">
          <summary className="flex cursor-pointer items-center gap-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            <RiFileTextLine className="text-[11px]" />
            Preview text the AI will read
            <span className="ml-auto text-[8px] font-normal normal-case opacity-70">
              first {extractedTextPreview.preview.length} chars
            </span>
          </summary>
          <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-border/60 bg-background/70 p-2.5 text-[9px] leading-[1.55] text-foreground/80">
            {extractedTextPreview.preview}
            {extractedTextPreview.truncated ? "…" : ""}
          </pre>
        </details>
      ) : (
        <p className="rounded-md border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-[8.5px] leading-[1.55] text-muted-foreground">
          Text hasn&apos;t been extracted from this PDF yet — the first run will
          read every page, then build the summary.
        </p>
      )}
    </div>
  );
}
