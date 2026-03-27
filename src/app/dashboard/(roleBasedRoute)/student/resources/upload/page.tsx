"use client";

import { useState } from "react";
import {
  RiSparklingFill,
  RiUploadCloud2Line,
  RiFileAddLine,
  RiCloseLine,
  RiCheckLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type Visibility = "PUBLIC" | "CLUSTER" | "PRIVATE";

interface FormState {
  title: string;
  description: string;
  authors: string[];
  year: string;
  category: string;
  tags: string[];
  visibility: Visibility;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  { value: "PUBLIC",  label: "Public",  desc: "Visible to everyone on the platform" },
  { value: "CLUSTER", label: "Cluster", desc: "Visible only to cluster members" },
  { value: "PRIVATE", label: "Private", desc: "Only visible to you" },
];

const VISIBILITY_CLS: Record<Visibility, string> = {
  PUBLIC:  "border-teal-400/60 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400",
  CLUSTER: "border-amber-400/60 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400",
  PRIVATE: "border-border bg-muted/30 text-muted-foreground",
};

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="hover:text-red-500 transition-colors"
            >
              <RiCloseLine className="text-xs" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder="Add tag, press Enter…"
          className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-400/60 transition-colors"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AuthorInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((author) => (
          <span
            key={author}
            className="flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-violet-100/70 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/40 text-violet-700 dark:text-violet-400"
          >
            {author}
            <button
              type="button"
              onClick={() => onChange(value.filter((a) => a !== author))}
              className="hover:text-red-500 transition-colors"
            >
              <RiCloseLine className="text-xs" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Author name, press Enter…"
          className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-400/60 transition-colors"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

const FIELD_CLS =
  "w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-400/60 transition-colors";

const LABEL_CLS = "text-[12px] font-semibold text-muted-foreground mb-1.5 block";

export default function ResourceUploadPage() {
  const [form, setForm] = useState<FormState>({
    title:       "",
    description: "",
    authors:     [],
    year:        "",
    category:    "",
    tags:        [],
    visibility:  "PUBLIC",
  });
  const [file, setFile]       = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]  = useState(false);
  const [error, setError]      = useState<string | null>(null);

  const set = (k: keyof FormState, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!file)              { setError("Please attach a file."); return; }
    setSubmitting(true); setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", form.title);
      if (form.description) fd.append("description", form.description);
      form.authors.forEach((a) => fd.append("authors[]", a));
      form.tags.forEach((t) => fd.append("tags[]", t));
      if (form.year) fd.append("year", form.year);
      fd.append("visibility", form.visibility);

      const res = await fetch("/api/resource", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setSuccess(true);
      setForm({ title: "", description: "", authors: [], year: "", category: "", tags: [], visibility: "PUBLIC" });
      setFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
            Library
          </span>
        </div>
        <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">
          Upload Resource
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Share a resource with your cluster or the platform
        </p>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-teal-300/60 dark:border-teal-700/50 bg-teal-50 dark:bg-teal-950/30 px-4 py-3 text-[13px] text-teal-700 dark:text-teal-400">
          <RiCheckLine className="text-base flex-shrink-0" />
          Resource uploaded successfully!
          <button
            onClick={() => setSuccess(false)}
            className="ml-auto text-[12px] font-semibold underline"
          >
            Upload another
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* File drop zone */}
        <div>
          <label className={LABEL_CLS}>File *</label>
          <label
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer py-10 px-6 transition-colors",
              dragging
                ? "border-teal-500/60 bg-teal-50/50 dark:bg-teal-950/20"
                : "border-border hover:border-teal-400/50 hover:bg-muted/20"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
          >
            {file ? (
              <>
                <RiFileAddLine className="text-3xl text-teal-500" />
                <p className="text-[13px] font-semibold text-foreground">{file.name}</p>
                <p className="text-[11.5px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <RiUploadCloud2Line className="text-3xl text-muted-foreground/40" />
                <p className="text-[13px] font-semibold text-foreground">Drop a file or click to browse</p>
                <p className="text-[11.5px] text-muted-foreground">PDF, video, image, document…</p>
              </>
            )}
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* Title */}
        <div>
          <label className={LABEL_CLS}>Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Resource title"
            className={FIELD_CLS}
          />
        </div>

        {/* Description */}
        <div>
          <label className={LABEL_CLS}>Abstract / Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Brief description or abstract…"
            className={cn(FIELD_CLS, "resize-vertical")}
          />
        </div>

        {/* Authors + Year */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
          <div>
            <label className={LABEL_CLS}>Authors</label>
            <AuthorInput value={form.authors} onChange={(v) => set("authors", v)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder={String(new Date().getFullYear())}
              min={1900}
              max={new Date().getFullYear()}
              className={FIELD_CLS}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={LABEL_CLS}>Tags</label>
          <TagInput value={form.tags} onChange={(v) => set("tags", v)} />
        </div>

        {/* Visibility */}
        <div>
          <label className={LABEL_CLS}>Visibility</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("visibility", opt.value)}
                className={cn(
                  "flex flex-col gap-1 p-3.5 rounded-xl border-2 text-left transition-all",
                  form.visibility === opt.value
                    ? VISIBILITY_CLS[opt.value]
                    : "border-border text-muted-foreground hover:bg-muted/30"
                )}
              >
                <span className="text-[13px] font-bold">{opt.label}</span>
                <span className="text-[11px] leading-snug opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[12.5px] text-red-500 border border-red-200/70 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 rounded-xl">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white text-[13.5px] font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-sm shadow-teal-500/20"
        >
          <RiUploadCloud2Line />
          {submitting ? "Uploading…" : "Upload Resource"}
        </button>
      </form>
    </div>
  );
}
