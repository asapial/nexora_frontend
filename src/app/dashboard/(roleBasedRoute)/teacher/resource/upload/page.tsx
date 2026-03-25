"use client";

import { useState, useRef, useCallback } from "react";
import {
  RiUploadCloud2Line, RiFilePdfLine, RiFileWordLine, RiFilePpt2Line,
  RiFileTextLine, RiCheckLine, RiCloseLine, RiSparklingFill,
  RiAddLine, RiStarLine, RiStarFill, RiEyeLine, RiTagLine,
  RiFileInfoLine, RiAlertLine, RiDeleteBinLine, RiEditLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
type Visibility = "PUBLIC" | "CLUSTER" | "PRIVATE";
interface FileEntry {
  id:         string;
  file:       File;
  status:     "pending" | "uploading" | "done" | "error";
  progress:   number;
  // metadata
  title:      string;
  authors:    string;
  year:       string;
  abstract:   string;
  tags:       string[];
  categoryId: string;
  visibility: Visibility;
  featured:   boolean;
  // tag input
  tagInput:   string;
}

const MOCK_CATEGORIES = [
  { id: "",    name: "Uncategorised"    },
  { id: "c1",  name: "Research Papers"  },
  { id: "c2",  name: "Lecture Slides"   },
  { id: "c3",  name: "Code & Notebooks" },
  { id: "c4",  name: "Sprint Tasks"     },
];

const VIS_OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  { value: "PUBLIC",  label: "Public",  desc: "All Nexora users"   },
  { value: "CLUSTER", label: "Cluster", desc: "Cluster members only"},
  { value: "PRIVATE", label: "Private", desc: "Only you"           },
];

// ─── Helpers ──────────────────────────────────────────────
function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf")  return <RiFilePdfLine  className="text-red-500" />;
  if (ext === "docx" || ext === "doc") return <RiFileWordLine className="text-blue-500" />;
  if (ext === "pptx" || ext === "ppt") return <RiFilePpt2Line className="text-orange-500" />;
  return <RiFileTextLine className="text-muted-foreground" />;
}

function fileSize(bytes: number) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
}

function mkEntry(file: File): FileEntry {
  const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  return {
    id:         `fe-${Date.now()}-${Math.random()}`,
    file, status:"pending", progress:0,
    title:      name, authors:"", year: new Date().getFullYear().toString(),
    abstract:"", tags:[], categoryId:"", visibility:"CLUSTER", featured:false,
    tagInput:"",
  };
}

// ─── Tag input inside metadata ─────────────────────────────
function TagInput({ tags, tagInput, onChange, onInputChange }: {
  tags: string[]; tagInput: string;
  onChange: (tags: string[]) => void;
  onInputChange: (v: string) => void;
}) {
  const add = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/,+$/, "").trim();
    if (!t || tags.includes(t)) { onInputChange(""); return; }
    onChange([...tags, t]); onInputChange("");
  };
  return (
    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg bg-muted/40 border border-border">
      {tags.map((t, i) => (
        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-semibold bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/50">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))}
            className="text-teal-500 hover:text-red-500 transition-colors"><RiCloseLine className="text-xs" /></button>
        </span>
      ))}
      <input value={tagInput} onChange={e => onInputChange(e.target.value)}
        onKeyDown={e => { if (["Enter",","," "].includes(e.key)) { e.preventDefault(); add(tagInput); } }}
        onBlur={() => { if (tagInput.trim()) add(tagInput); }}
        placeholder={tags.length === 0 ? "Add tags…" : "+"}
        className="flex-1 min-w-[80px] bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground/40 outline-none" />
    </div>
  );
}

// ─── Per-file metadata panel ───────────────────────────────
function MetadataPanel({ entry, onChange }: {
  entry: FileEntry;
  onChange: (patch: Partial<FileEntry>) => void;
}) {
  const inp = (field: keyof FileEntry) => (v: string) => onChange({ [field]: v } as any);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/50">
      {/* Title */}
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label className="text-[11.5px] font-bold uppercase tracking-[.07em] text-muted-foreground/70">Title</label>
        <input value={entry.title} onChange={e => inp("title")(e.target.value)} placeholder="Resource title"
          className="w-full h-9 px-3 rounded-lg text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-teal-400/30 focus:border-teal-400/60 transition-all" />
      </div>
      {/* Authors */}
      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-bold uppercase tracking-[.07em] text-muted-foreground/70">Authors</label>
        <input value={entry.authors} onChange={e => inp("authors")(e.target.value)} placeholder="Vaswani et al."
          className="w-full h-9 px-3 rounded-lg text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-teal-400/30 transition-all" />
      </div>
      {/* Year */}
      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-bold uppercase tracking-[.07em] text-muted-foreground/70">Year</label>
        <input value={entry.year} onChange={e => inp("year")(e.target.value)} placeholder="2024" maxLength={4}
          className="w-full h-9 px-3 rounded-lg text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-teal-400/30 transition-all" />
      </div>
      {/* Category */}
      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-bold uppercase tracking-[.07em] text-muted-foreground/70">Category</label>
        <select value={entry.categoryId} onChange={e => onChange({ categoryId: e.target.value })}
          className="w-full h-9 px-3 rounded-lg text-[13px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-400/30 transition-all">
          {MOCK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {/* Visibility */}
      <div className="flex flex-col gap-1">
        <label className="text-[11.5px] font-bold uppercase tracking-[.07em] text-muted-foreground/70">Visibility</label>
        <select value={entry.visibility} onChange={e => onChange({ visibility: e.target.value as Visibility })}
          className="w-full h-9 px-3 rounded-lg text-[13px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-400/30 transition-all">
          {VIS_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label} — {v.desc}</option>)}
        </select>
      </div>
      {/* Abstract */}
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label className="text-[11.5px] font-bold uppercase tracking-[.07em] text-muted-foreground/70">Abstract / Notes</label>
        <textarea value={entry.abstract} onChange={e => inp("abstract")(e.target.value)} rows={2} placeholder="Brief description or abstract…"
          className="w-full rounded-lg px-3 py-2 text-[13px] resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-teal-400/30 transition-all" />
      </div>
      {/* Tags */}
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label className="text-[11.5px] font-bold uppercase tracking-[.07em] text-muted-foreground/70">Tags</label>
        <TagInput tags={entry.tags} tagInput={entry.tagInput}
          onChange={tags => onChange({ tags })}
          onInputChange={v => onChange({ tagInput: v })} />
      </div>
      {/* Featured */}
      <div className="sm:col-span-2">
        <button type="button" onClick={() => onChange({ featured: !entry.featured })}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border text-[13px] font-semibold transition-all",
            entry.featured
              ? "border-amber-300/60 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
              : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}>
          {entry.featured ? <RiStarFill className="text-amber-500" /> : <RiStarLine className="text-base" />}
          {entry.featured ? "Featured resource" : "Mark as featured"}
          <span className="ml-auto text-[11px] font-medium text-muted-foreground">shown at top</span>
        </button>
      </div>
    </div>
  );
}

// ─── File row ──────────────────────────────────────────────
function FileRow({ entry, onRemove, onPatch }: {
  entry:   FileEntry;
  onRemove:(id: string) => void;
  onPatch: (id: string, patch: Partial<FileEntry>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn(
      "rounded-2xl border bg-card overflow-hidden transition-all",
      entry.status === "done"  ? "border-teal-300/50 dark:border-teal-700/50"
      : entry.status === "error" ? "border-red-300/50 dark:border-red-700/50"
      : "border-border"
    )}>
      <div className="flex items-center gap-3 px-5 py-3.5">
        <span className="text-2xl flex-shrink-0">{fileIcon(entry.file.name)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-foreground truncate">{entry.title || entry.file.name}</p>
          <p className="text-[11.5px] text-muted-foreground">{fileSize(entry.file.size)} · {entry.file.name.split(".").pop()?.toUpperCase()}</p>
        </div>
        {/* Status */}
        {entry.status === "uploading" && (
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden flex-shrink-0">
            <div className="h-full rounded-full bg-teal-500 transition-all duration-300" style={{ width:`${entry.progress}%` }} />
          </div>
        )}
        {entry.status === "done"  && <RiCheckLine className="text-teal-500 dark:text-teal-400 text-lg flex-shrink-0" />}
        {entry.status === "error" && <RiAlertLine className="text-red-500 dark:text-red-400 text-lg flex-shrink-0" />}
        {entry.featured && <RiStarFill className="text-amber-400 text-base flex-shrink-0" />}

        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => setExpanded(e => !e)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all" title="Edit metadata">
            <RiEditLine />
          </button>
          <button type="button" onClick={() => onRemove(entry.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all" title="Remove">
            <RiDeleteBinLine />
          </button>
        </div>
      </div>

      {/* Metadata panel */}
      {expanded && (
        <div className="px-5 pb-5">
          <MetadataPanel entry={entry} onChange={patch => onPatch(entry.id, patch)} />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function UploadResourcesPage() {
  const [entries,  setEntries]  = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading,setUploading]= useState(false);
  const [done,     setDone]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) => {
    const accepted = files.filter(f =>
      ["pdf","doc","docx","ppt","pptx","txt","md","zip","xlsx","csv"].includes(f.name.split(".").pop()?.toLowerCase() ?? "")
    );
    setEntries(es => [...es, ...accepted.map(mkEntry)]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const patch = (id: string, p: Partial<FileEntry>) =>
    setEntries(es => es.map(e => e.id === id ? { ...e, ...p } : e));

  const remove = (id: string) => setEntries(es => es.filter(e => e.id !== id));

  const handleUpload = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (entries.length === 0) return;
    setUploading(true);
    for (const entry of entries) {
      patch(entry.id, { status: "uploading" });
      for (let p = 0; p <= 100; p += 20) {
        await new Promise(r => setTimeout(r, 80));
        patch(entry.id, { progress: p });
      }
      patch(entry.id, { status: "done", progress: 100 });
    }
    setUploading(false); setDone(true);
  };

  if (done) return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-2xl mx-auto w-full">
      <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl"><RiCheckLine /></div>
        <div>
          <h2 className="text-[18px] font-extrabold text-foreground mb-1">{entries.length} resource{entries.length !== 1 ? "s" : ""} uploaded</h2>
          <p className="text-[13.5px] text-muted-foreground">All files are now available in the resource library.</p>
        </div>
        <button onClick={() => { setEntries([]); setDone(false); }}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold transition-all hover:bg-teal-700">
          <RiAddLine /> Upload more
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleUpload}>
      <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto w-full">

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Resources</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Upload Resources</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">Upload PDFs, slides, documents and more. Edit metadata per file before uploading.</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
            "flex flex-col items-center justify-center gap-3 py-12 px-6 text-center",
            dragging
              ? "border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 scale-[1.01]"
              : "border-border hover:border-teal-400/60 dark:hover:border-teal-600/50 hover:bg-muted/30"
          )}>
          <input ref={inputRef} type="file" multiple className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.zip,.xlsx,.csv"
            onChange={e => addFiles(Array.from(e.target.files ?? []))} />
          <div className="w-14 h-14 rounded-2xl bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl">
            <RiUploadCloud2Line />
          </div>
          <div>
            <p className="text-[14.5px] font-bold text-foreground">Drop files here or click to browse</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">PDF, DOCX, PPTX, TXT, MD, XLSX, CSV, ZIP · Up to 50 MB each</p>
          </div>
          {entries.length > 0 && (
            <span className="text-[12.5px] font-semibold text-teal-600 dark:text-teal-400">{entries.length} file{entries.length !== 1 ? "s" : ""} queued</span>
          )}
        </div>

        {/* File list */}
        {entries.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-foreground">{entries.length} file{entries.length !== 1 ? "s" : ""} ready — click <RiEditLine className="inline text-xs" /> to edit metadata</p>
              <button type="button" onClick={() => setEntries([])} className="text-[12.5px] font-semibold text-red-500 dark:text-red-400 hover:underline">Clear all</button>
            </div>
            {entries.map(e => <FileRow key={e.id} entry={e} onRemove={remove} onPatch={patch} />)}
          </div>
        )}

        {/* Submit */}
        {entries.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-[12.5px] text-muted-foreground">
              {entries.filter(e => e.featured).length > 0 && `${entries.filter(e => e.featured).length} featured · `}
              {entries.length} file{entries.length !== 1 ? "s" : ""} total
            </p>
            <button type="submit" disabled={uploading}
              className={cn(
                "inline-flex items-center gap-2 h-10 px-7 rounded-xl",
                "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
                "text-white text-[14px] font-bold shadow-md shadow-teal-600/20",
                "transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}>
              {uploading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                : <><RiUploadCloud2Line /> Upload {entries.length} file{entries.length !== 1 ? "s" : ""}</>}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}