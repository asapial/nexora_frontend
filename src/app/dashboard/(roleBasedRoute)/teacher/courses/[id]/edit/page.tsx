"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiEditLine, RiSendPlaneLine,
  RiLoader4Line, RiAlertLine, RiRefreshLine, RiCheckLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

interface Course {
  id: string; title: string; description: string | null;
  tags: string[]; isFree: boolean; requestedPrice: number | null; price: number;
  status: string;
}

const INP = "w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";
const TEXTAREA = "w-full rounded-xl px-4 py-3 text-[13.5px] leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

export default function CourseEditPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  // Form state
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [tags, setTags]         = useState("");
  const [isFree, setIsFree]     = useState(true);
  const [reqPrice, setReqPrice] = useState("");

  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saved, setSaved]     = useState(false);

  const fetchCourse = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/courses/${id}`, { credentials: "include" });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);
      const c = d.data as Course;
      setCourse(c);
      setTitle(c.title);
      setDesc(c.description ?? "");
      setTags(c.tags.join(", "));
      setIsFree(c.isFree);
      setReqPrice(c.requestedPrice ? String(c.requestedPrice) : "");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setSaveErr("Title is required."); return; }
    setSaving(true); setSaveErr(null); setSaved(false);
    try {
      const body: Record<string, unknown> = {
        title,
        description: desc || null,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        isFree,
      };
      if (!isFree && reqPrice) body.requestedPrice = parseFloat(reqPrice);

      const res = await fetch(`/api/courses/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Update failed");
      setSaved(true);
      setTimeout(() => router.push(`/dashboard/teacher/courses/${id}`), 1000);
    } catch (e: unknown) { setSaveErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-5 lg:p-7 pt-6 max-w-2xl mx-auto w-full animate-pulse">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-8 w-2/3 rounded-xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <RiAlertLine className="text-4xl text-red-500" />
        <p className="text-[14px] font-bold text-foreground">{error ?? "Course not found"}</p>
        <button onClick={fetchCourse} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">
          <RiRefreshLine /> Retry
        </button>
      </div>
    );
  }

  const canEdit = course.status === "DRAFT" || course.status === "REJECTED";

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-2xl mx-auto w-full">
      {/* Back */}
      <button onClick={() => router.push(`/dashboard/teacher/courses/${id}`)}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <RiArrowLeftLine /> Course Detail
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Edit Course</span>
        </div>
        <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-tight">{course.title}</h1>
      </div>

      {/* Only DRAFT/REJECTED can be edited */}
      {!canEdit && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
          <RiAlertLine className="text-amber-500 text-base mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-amber-700 dark:text-amber-300">
            Only <strong>DRAFT</strong> or <strong>REJECTED</strong> courses can be edited. This course is currently <strong>{course.status}</strong>.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Course title" className={INP} disabled={!canEdit} />
          </div>

          {/* Description */}
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5} placeholder="What will students learn?" className={cn(TEXTAREA)} disabled={!canEdit} />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Tags <span className="font-normal text-muted-foreground">(comma separated)</span></label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. Python, Machine Learning, AI" className={INP} disabled={!canEdit} />
          </div>

          {/* Pricing */}
          <div>
            <label className="text-[13px] font-semibold text-foreground/80 mb-2 block">Pricing</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => canEdit && setIsFree(true)}
                className={cn("flex-1 h-10 rounded-xl border text-[13px] font-semibold transition-all",
                  isFree ? "bg-teal-600 text-white border-teal-600" : "border-border text-muted-foreground hover:bg-muted/40")}
                disabled={!canEdit}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => canEdit && setIsFree(false)}
                className={cn("flex-1 h-10 rounded-xl border text-[13px] font-semibold transition-all",
                  !isFree ? "bg-teal-600 text-white border-teal-600" : "border-border text-muted-foreground hover:bg-muted/40")}
                disabled={!canEdit}
              >
                Paid
              </button>
            </div>
            {!isFree && (
              <div className="mt-3">
                <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Requested Price (USD)</label>
                <input type="number" min="0" step="0.01" value={reqPrice} onChange={e => setReqPrice(e.target.value)}
                  placeholder="e.g. 29.99" className={INP} disabled={!canEdit} />
                <p className="text-[11.5px] text-muted-foreground mt-1">Admin will review and set the final price.</p>
              </div>
            )}
          </div>
        </div>

        {saveErr && <p className="text-[12.5px] text-red-500">{saveErr}</p>}
        {saved && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 text-[13px] font-semibold">
            <RiCheckLine /> Changes saved! Redirecting…
          </div>
        )}

        {canEdit && (
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.push(`/dashboard/teacher/courses/${id}`)}
              className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold shadow-sm transition-all disabled:opacity-60">
              {saving ? <RiLoader4Line className="animate-spin" /> : <RiEditLine />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
