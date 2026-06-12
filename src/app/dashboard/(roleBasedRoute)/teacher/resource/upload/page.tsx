"use client";

import { useState, useEffect, useRef } from "react";
import {
  RiSparklingFill, RiUploadCloud2Line, RiFileAddLine, RiCloseLine, RiCheckLine,
  RiRobot2Line, RiLoader4Line
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Visibility = "PUBLIC" | "CLUSTER" | "PRIVATE";

interface Cluster { id: string; name: string; _count?: { members: number; }; }

interface FormState {
  title: string; description: string; authors: string[];
  year: string; tags: string[]; visibility: Visibility;
  categoryId: string; clusterIds: string[];
}

interface AiSuggestions {
  titles: string[];
  descriptions: string[];
  authorSets: string[][];
  years: string[];
  tagSets: string[][];
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string; cls: string; }[] = [
  { value: "PUBLIC", label: "Public", desc: "Available to all users on Nexora", cls: "border-teal-400/60 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400" },
  { value: "CLUSTER", label: "Cluster", desc: "Visible to a specific cluster only", cls: "border-amber-400/60 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" },
  { value: "PRIVATE", label: "Private", desc: "Only visible to you", cls: "border-border bg-muted/30 text-muted-foreground" },
];

const LABEL = "text-[12px] font-semibold text-muted-foreground mb-1.5 block";
const FIELD = "w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-400/60 transition-colors";

// ── Suggestion Chips Panel ───────────────────────────────────────────────────
function SuggestionPanel({
  options,
  selected,
  onSelect,
  renderLabel,
}: {
  options: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  renderLabel?: (v: string, i: number) => React.ReactNode;
}) {
  if (!options.some(o => o.trim())) return null;
  return (
    <div className="mt-2 grid grid-cols-1 gap-2">
      {options.map((opt, i) => {
        if (!opt.trim()) return null;
        const isSelected = selected === opt;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(opt)}
            className={cn(
              "text-left w-full px-3 py-2.5 rounded-xl border text-[12px] leading-relaxed transition-all group",
              isSelected
                ? "border-teal-400/60 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 shadow-sm"
                : "border-border bg-card hover:border-violet-300 dark:hover:border-violet-700/60 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-foreground"
            )}
          >
            <div className="flex items-start gap-2">
              <span className={cn(
                "mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                isSelected ? "border-teal-500 bg-teal-500" : "border-muted-foreground/30 group-hover:border-violet-400"
              )}>
                {isSelected && <RiCheckLine className="text-[9px] text-white" />}
              </span>
              <span className="flex-1">
                {renderLabel ? renderLabel(opt, i) : opt}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Array option panel (for authorSets / tagSets)
function ArraySuggestionPanel({
  options,
  selectedIdx,
  onSelect,
  renderItem,
}: {
  options: string[][];
  selectedIdx: number | null;
  onSelect: (idx: number, arr: string[]) => void;
  renderItem: (arr: string[], idx: number) => React.ReactNode;
}) {
  if (!options.some(o => o.length > 0)) return null;
  return (
    <div className="mt-2 grid grid-cols-1 gap-2">
      {options.map((arr, i) => {
        if (!arr.length) return null;
        const isSelected = selectedIdx === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i, arr)}
            className={cn(
              "text-left w-full px-3 py-2.5 rounded-xl border text-[12px] transition-all group",
              isSelected
                ? "border-teal-400/60 bg-teal-50 dark:bg-teal-950/30 shadow-sm"
                : "border-border bg-card hover:border-violet-300 dark:hover:border-violet-700/60 hover:bg-violet-50 dark:hover:bg-violet-950/20"
            )}
          >
            <div className="flex items-start gap-2">
              <span className={cn(
                "mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                isSelected ? "border-teal-500 bg-teal-500" : "border-muted-foreground/30 group-hover:border-violet-400"
              )}>
                {isSelected && <RiCheckLine className="text-[9px] text-white" />}
              </span>
              <span className="flex-1">{renderItem(arr, i)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void; }) {
  const [input, setInput] = useState("");
  const add = () => { const t = input.trim().toLowerCase(); if (t && !value.includes(t)) onChange([...value, t]); setInput(""); };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
            {tag}
            <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-red-500 transition-colors"><RiCloseLine className="text-xs" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder="Add tag, press Enter…" className={FIELD} />
        <button type="button" onClick={add} className="px-3 py-2 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors">Add</button>
      </div>
    </div>
  );
}

export default function TeacherResourceUploadPage() {
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/resource/categories", { credentials: "include" });
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          setCategories(json.data.map((c: { id: string; name: string; }) => ({ id: c.id, name: c.name })));
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setCategoriesLoading(false); }
    })();
    // Fetch teacher's clusters
    setClustersLoading(true);
    fetch("/api/teacher/announcements/clusters", { credentials: "include" })
      .then(r => r.json())
      .then(json => { if (!cancelled && json.success && Array.isArray(json.data)) setClusters(json.data); })
      .catch(() => { })
      .finally(() => { if (!cancelled) setClustersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const [form, setForm] = useState<FormState>({
    title: "", description: "", authors: [], year: "", tags: [],
    visibility: "PUBLIC", categoryId: "", clusterIds: [],
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestions | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clusters owned by this teacher
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  // Track which suggestion index is selected for array-type fields
  const [selAuthorIdx, setSelAuthorIdx] = useState<number | null>(null);
  const [selTagIdx, setSelTagIdx] = useState<number | null>(null);

  // ── Cycling status messages while AI is working ───────────────────────────
  const SUGGEST_STAGES = [
    // Phase 1 — PDF ingestion
    "Opening PDF…",
    "Reading document…",
    "Extracting raw text…",
    "Detecting page structure…",
    "Removing noise & headers…",
    // Phase 2 — RAG chunking
    "Splitting into chunks…",
    "Applying overlap windows…",
    "Indexing text segments…",
    "Computing chunk density…",
    // Phase 3 — Vector retrieval
    "Scoring relevance…",
    "Ranking top segments…",
    "Retrieving best context…",
    "Building retrieval window…",
    // Phase 4 — AI inference
    "Connecting to AI model…",
    "Sending context to LLM…",
    "Model is thinking…",
    "Generating title options…",
    "Drafting abstracts…",
    "Identifying authors…",
    "Detecting publication year…",
    "Extracting keyword tags…",
    // Phase 5 — Post-processing
    "Parsing AI response…",
    "Validating JSON structure…",
    "Normalising suggestions…",
    "Deduplicating results…",
    // Phase 6 — Encouragement while waiting
    "Free models take a moment — hang tight…",
    "Still working, almost done…",
    "Great things take time…",
    "Wrapping up…",
    "Polishing suggestions…",
    "Almost there…",
  ];
  const [stageIdx, setStageIdx] = useState(0);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSuggesting) {
      setStageIdx(0);
      stageTimer.current = setInterval(() => {
        setStageIdx(i => (i + 1) % SUGGEST_STAGES.length);
      }, 2000);
    } else {
      if (stageTimer.current) clearInterval(stageTimer.current);
    }
    return () => { if (stageTimer.current) clearInterval(stageTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuggesting]);

  const set = (k: keyof FormState, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  // When switching visibility, clear clusterIds unless CLUSTER is selected
  const setVisibility = (v: Visibility) => setForm(f => ({ ...f, visibility: v, clusterIds: v === "CLUSTER" ? f.clusterIds : [] }));

  // Toggle a cluster in/out of multi-select
  const toggleCluster = (id: string) =>
    setForm(f => ({
      ...f,
      clusterIds: f.clusterIds.includes(id)
        ? f.clusterIds.filter(c => c !== id)
        : [...f.clusterIds, id],
    }));

  const handleSuggest = async () => {
    if (!file) return;
    setIsSuggesting(true);
    setError(null);
    setSuggestions(null);
    setSelAuthorIdx(null);
    setSelTagIdx(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/resource/suggest-metadata", { method: "POST", credentials: "include", body: fd });

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        throw new Error("The server encountered an unexpected error. Please try again later.");
      }

      if (!res.ok) throw new Error(json?.message || "Failed to extract metadata");
      setSuggestions(json.data as AiSuggestions);
      toast.success("AI generated 4 suggestions for each field — pick the best ones!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "AI extraction failed. Make sure the PDF contains readable text.";
      // If the error message happens to be a raw JSON parse error string, clean it up just in case
      if (errorMessage.includes("is not valid JSON") || errorMessage.includes("Unexpected token")) {
        setError("The server returned an invalid response. Please try again later.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!file) { setError("Please attach a file."); return; }
    setSubmitting(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", form.title);
      if (form.description) fd.append("description", form.description);
      form.authors.forEach(a => fd.append("authors[]", a));
      form.tags.forEach(t => fd.append("tags[]", t));
      if (form.year) fd.append("year", form.year);
      fd.append("visibility", form.visibility);
      if (form.categoryId) fd.append("categoryId", form.categoryId);
      // Send all selected cluster IDs
      if (form.visibility === "CLUSTER") {
        form.clusterIds.forEach(id => fd.append("clusterIds[]", id));
      }

      const res = await fetch("/api/resource", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setSuccess(true);
      setForm({ title: "", description: "", authors: [], year: "", tags: [], visibility: "PUBLIC", categoryId: "", clusterIds: [] });
      setFile(null);
      setSuggestions(null);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setSubmitting(false); }
  };

  // ── Suggestion header label ─────────────────────────────────────────────
  const SuggestionHeader = () => (
    <div className="flex items-center gap-1.5 mb-1">
      <RiRobot2Line className="text-[11px] text-violet-500" />
      <span className="text-[10.5px] font-bold tracking-wider uppercase text-violet-500 dark:text-violet-400">
        AI Suggestions — click to use
      </span>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Library</span>
        </div>
        <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">Upload Resource</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Share a resource with your cluster or the platform</p>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-teal-300/60 dark:border-teal-700/50 bg-teal-50 dark:bg-teal-950/30 px-4 py-3 text-[13px] text-teal-700 dark:text-teal-400">
          <RiCheckLine className="text-base flex-shrink-0" />
          Resource uploaded successfully!
          <button onClick={() => setSuccess(false)} className="ml-auto text-[12px] font-semibold underline">Upload another</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Drop zone */}
        <div>
          <label className={LABEL}>File *</label>
          <label
            className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer py-10 px-6 transition-colors",
              dragging ? "border-teal-500/60 bg-teal-50/50 dark:bg-teal-950/20" : "border-border hover:border-teal-400/50 hover:bg-muted/20")}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) { setFile(f); setSuggestions(null); } }}>
            {file ? (
              <><RiFileAddLine className="text-3xl text-teal-500" />
                <p className="text-[13px] font-semibold text-foreground">{file.name}</p>
                <p className="text-[11.5px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · {file.type === "application/pdf" ? "PDF — AI suggestions available" : file.type}</p></>
            ) : (
              <><RiUploadCloud2Line className="text-3xl text-muted-foreground/40" />
                <p className="text-[13px] font-semibold text-foreground">Drop a file or click to browse</p>
                <p className="text-[11.5px] text-muted-foreground">PDF (with AI suggestions), video, image, document…</p></>
            )}
            <input type="file" accept="application/pdf,image/*,video/*,.doc,.docx" className="hidden" onChange={e => { setFile(e.target.files?.[0] ?? null); setSuggestions(null); setSelAuthorIdx(null); setSelTagIdx(null); }} />
          </label>

          {/* AI Trigger button — only for PDFs */}
          {file && file.type === "application/pdf" && (
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="mt-3 flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700/60 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 font-semibold text-[13px] hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all disabled:opacity-50"
            >
              {isSuggesting ? (
                <RiLoader4Line className="text-base animate-spin" />
              ) : (
                <RiSparklingFill className="text-base" />
              )}
              {isSuggesting
                ? SUGGEST_STAGES[stageIdx]
                : suggestions
                  ? "✨ Re-analyze PDF with AI"
                  : "✨ Get AI Suggestions  (RAG + Vector Search)"}
            </button>
          )}
        </div>

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <div>
          <label className={LABEL}>Title *</label>
          <input type="text" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Resource title" className={FIELD} />
          {suggestions && (
            <div className="mt-3 rounded-xl border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/10 p-3">
              <SuggestionHeader />
              <SuggestionPanel
                options={suggestions.titles}
                selected={form.title}
                onSelect={v => set("title", v)}
              />
            </div>
          )}
        </div>

        {/* ── Category ──────────────────────────────────────────────────── */}
        <div>
          <label className={LABEL}>Category</label>
          <p className="text-[11px] text-muted-foreground/80 mb-1.5">Includes global (admin) categories and any you created under Library.</p>
          <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} disabled={categoriesLoading} className={cn(FIELD, "cursor-pointer")}>
            <option value="">{categoriesLoading ? "Loading categories…" : "Optional — select a category"}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* ── Abstract / Description ────────────────────────────────────── */}
        <div>
          <label className={LABEL}>Abstract / Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Brief description or abstract…" className={cn(FIELD, "resize-vertical")} />
          {suggestions && (
            <div className="mt-3 rounded-xl border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/10 p-3">
              <SuggestionHeader />
              <SuggestionPanel
                options={suggestions.descriptions}
                selected={form.description}
                onSelect={v => set("description", v)}
              />
            </div>
          )}
        </div>

        {/* ── Authors + Year ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
          <div>
            <label className={LABEL}>Authors</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Author name, press Enter…"
                className={FIELD}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v && !form.authors.includes(v)) set("authors", [...form.authors, v]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.authors.map(a => (
                <span key={a} className="flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-violet-100/70 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/40 text-violet-700 dark:text-violet-400">
                  {a}<button type="button" onClick={() => set("authors", form.authors.filter(x => x !== a))} className="hover:text-red-500 transition-colors"><RiCloseLine className="text-xs" /></button>
                </span>
              ))}
            </div>
            {suggestions && (
              <div className="mt-3 rounded-xl border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/10 p-3">
                <SuggestionHeader />
                <ArraySuggestionPanel
                  options={suggestions.authorSets}
                  selectedIdx={selAuthorIdx}
                  onSelect={(idx, arr) => { setSelAuthorIdx(idx); set("authors", arr); }}
                  renderItem={(arr) => (
                    <span className="flex flex-wrap gap-1">
                      {arr.map(a => (
                        <span key={a} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-700/40">
                          {a}
                        </span>
                      ))}
                    </span>
                  )}
                />
              </div>
            )}
          </div>

          <div>
            <label className={LABEL}>Year</label>
            <input type="number" value={form.year} onChange={e => set("year", e.target.value)}
              placeholder={String(new Date().getFullYear())} min={1900} max={new Date().getFullYear()} className={FIELD} />
            {suggestions && (
              <div className="mt-3 rounded-xl border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/10 p-3">
                <SuggestionHeader />
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {suggestions.years.filter(y => y.trim()).map(y => {
                    const isSel = form.year === y;
                    return (
                      <button key={y} type="button" onClick={() => set("year", y)}
                        className={cn("py-1.5 rounded-lg border text-[12px] font-bold transition-all",
                          isSel ? "border-teal-400/60 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300"
                            : "border-border bg-card hover:border-violet-300 dark:hover:border-violet-700/60 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-foreground"
                        )}>
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tags ──────────────────────────────────────────────────────── */}
        <div>
          <label className={LABEL}>Tags</label>
          <TagInput value={form.tags} onChange={v => set("tags", v)} />
          {suggestions && (
            <div className="mt-3 rounded-xl border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/10 p-3">
              <SuggestionHeader />
              <ArraySuggestionPanel
                options={suggestions.tagSets}
                selectedIdx={selTagIdx}
                onSelect={(idx, arr) => { setSelTagIdx(idx); set("tags", arr); }}
                renderItem={(arr) => (
                  <span className="flex flex-wrap gap-1">
                    {arr.map(tag => (
                      <span key={tag} className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              />
            </div>
          )}
        </div>

        {/* ── Visibility ────────────────────────────────────────────────── */}
        <div>
          <label className={LABEL}>Visibility</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {VISIBILITY_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setVisibility(opt.value)}
                className={cn("flex flex-col gap-1 p-3.5 rounded-xl border-2 text-left transition-all",
                  form.visibility === opt.value ? opt.cls : "border-border text-muted-foreground hover:bg-muted/30")}>
                <span className="text-[13px] font-bold">{opt.label}</span>
                <span className="text-[11px] leading-snug opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>

          {/* Cluster picker — shown only when CLUSTER is selected */}
          {form.visibility === "CLUSTER" && (
            <div className="mt-3 rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/10 p-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2.5">
                Select clusters <span className="font-normal normal-case text-muted-foreground">(can select multiple)</span>
              </p>
              {clustersLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/40 border-t-amber-500 animate-spin" />
                  <span className="text-[12px] text-muted-foreground">Loading your clusters…</span>
                </div>
              ) : clusters.length === 0 ? (
                <div className="py-3 text-center">
                  <p className="text-[12.5px] text-muted-foreground">You have no clusters yet.</p>
                  <a href="/dashboard/teacher/cluster/create"
                    className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:no-underline">
                    Create your first cluster →
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {clusters.map(c => {
                    const isSelected = form.clusterIds.includes(c.id);
                    return (
                      <button key={c.id} type="button" onClick={() => toggleCluster(c.id)}
                        className={cn(
                          "flex items-center gap-3 w-full text-left px-3.5 py-3 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-amber-400/70 bg-amber-50 dark:bg-amber-950/30 shadow-sm"
                            : "border-border bg-card hover:border-amber-300/60 hover:bg-amber-50/30 dark:hover:bg-amber-950/10"
                        )}>
                        {/* Checkbox style indicator */}
                        <span className={cn(
                          "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all",
                          isSelected ? "border-amber-500 bg-amber-500" : "border-border"
                        )}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground">{c.name}</p>
                          {c._count && (
                            <p className="text-[11px] text-muted-foreground">{c._count.members} member{c._count.members !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">✓ Selected</span>
                        )}
                      </button>
                    );
                  })}
                  {form.clusterIds.length > 0 && (
                    <p className="text-[11.5px] text-amber-600 dark:text-amber-400 font-medium pt-1">
                      {form.clusterIds.length} cluster{form.clusterIds.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              )}
              {form.clusterIds.length === 0 && clusters.length > 0 && (
                <p className="mt-2 text-[11.5px] text-amber-600/70 dark:text-amber-400/60">⚠ Select at least one cluster to continue.</p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-[12.5px] text-red-500 border border-red-200/70 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 rounded-xl">{error}</p>}

        <button type="submit" disabled={submitting}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white text-[13.5px] font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-sm shadow-teal-500/20">
          <RiUploadCloud2Line />
          {submitting ? "Uploading…" : "Upload Resource"}
        </button>
      </form>
    </div>
  );
}
