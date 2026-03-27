"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiAddLine, RiEditLine,
  RiDeleteBinLine, RiSendPlaneLine, RiFileTextLine, RiAlertLine,
  RiCheckLine, RiCloseLine, RiArrowUpLine, RiArrowDownLine,
  RiVideoLine, RiArticleLine, RiFileMarkedLine, RiLoader4Line,
  RiRefreshLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { courseApi } from "../../../../../../../lib/api";
import { toast } from "sonner";
import type { CourseMission, MissionContent, MissionContentType } from "../../../../../../../types/course.type";

function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.08) 1px,transparent 1px)", backgroundSize: "26px 26px" }} />
      <div className="absolute top-0 left-1/2 w-[600px] h-[300px] -translate-x-1/2 rounded-full bg-teal-500/[0.04] blur-[100px]" />
    </div>
  );
}

const CONTENT_CFG: Record<MissionContentType, { icon: React.ReactNode; label: string; color: string }> = {
  VIDEO: { icon: <RiVideoLine />,    label: "Video", color: "text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50" },
  TEXT:  { icon: <RiArticleLine />,  label: "Text",  color: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50" },
  PDF:   { icon: <RiFileMarkedLine />, label: "PDF",   color: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50" },
};

const STATUS_CFG = {
  DRAFT:            { label:"Draft",    badge:"text-muted-foreground bg-muted/40 border-border",                                                                        dot:"bg-muted-foreground/40" },
  PENDING_APPROVAL: { label:"Pending",  badge:"text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50",   dot:"bg-amber-500 animate-pulse" },
  PUBLISHED:        { label:"Published",badge:"text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50",         dot:"bg-teal-500" },
  REJECTED:         { label:"Rejected", badge:"text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50",               dot:"bg-red-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = (STATUS_CFG as any)[status] ?? STATUS_CFG.DRAFT;
  return <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border", cfg.badge)}><span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />{cfg.label}</span>;
}

const iCls = "w-full h-10 px-3.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

// ─── Mission Modal ────────────────────────────────────────
function MissionModal({ mission, onClose, onSave }: { mission?: CourseMission; onClose: () => void; onSave: (d: { title: string; description: string }) => Promise<void> }) {
  const [title, setTitle] = useState(mission?.title ?? "");
  const [description, setDescription] = useState(mission?.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    try { await onSave({ title: title.trim(), description: description.trim() }); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-sm"><RiFileTextLine /></div>
              <h3 className="text-[14px] font-extrabold text-foreground">{mission ? "Edit Mission" : "New Mission"}</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-sm" /><p className="text-[12.5px] font-medium text-red-600 dark:text-red-400">{error}</p></div>}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Title <span className="text-red-500">*</span></label>
              <input className={cn(iCls, error && !title && "border-red-400/60")} value={title} onChange={e => { setTitle(e.target.value); setError(""); }} placeholder="Mission title" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Description</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What will students learn in this mission?" className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all resize-none" />
            </div>
          </div>
          <div className="px-6 pb-5 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13px] font-bold transition-all disabled:opacity-60">
              {saving ? <RiLoader4Line className="animate-spin text-sm" /> : <RiCheckLine className="text-sm" />}
              {mission ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Add Content Modal ────────────────────────────────────
function AddContentModal({ missionId, onClose, onAdd }: { missionId: string; onClose: () => void; onAdd: (item: MissionContent) => void }) {
  const [type, setType] = useState<MissionContentType>("VIDEO");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [textBody, setTextBody] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (type === "VIDEO" && !videoUrl.trim()) { setError("Video URL is required"); return; }
    if (type === "PDF" && !pdfUrl.trim()) { setError("PDF URL is required"); return; }
    setSaving(true);
    try {
      const res = await courseApi.createContent(missionId, {
        type, title: title.trim(),
        videoUrl: type === "VIDEO" ? videoUrl.trim() : undefined,
        textBody: type === "TEXT" ? textBody.trim() : undefined,
        pdfUrl: type === "PDF" ? pdfUrl.trim() : undefined,
        duration: duration ? parseInt(duration) : undefined,
      });
      onAdd(res.data);
      onClose();
      toast.success("Content added!", { position: "top-right" });
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <h3 className="text-[14px] font-extrabold text-foreground">Add content</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-sm" /><p className="text-[12.5px] font-medium text-red-600 dark:text-red-400">{error}</p></div>}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Content type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["VIDEO", "TEXT", "PDF"] as MissionContentType[]).map(t => {
                  const cfg = CONTENT_CFG[t];
                  return (
                    <div key={t} onClick={() => setType(t)} className={cn("flex flex-col items-center gap-2 px-3 py-3 rounded-xl cursor-pointer border transition-all",
                      type === t ? "border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20" : "border-border bg-muted/30 hover:bg-muted/50")}>
                      <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-base border", cfg.color)}>{cfg.icon}</span>
                      <span className="text-[12px] font-semibold text-foreground">{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Title <span className="text-red-500">*</span></label>
              <input className={iCls} value={title} onChange={e => { setTitle(e.target.value); setError(""); }} placeholder="Content title" />
            </div>
            {type === "VIDEO" && <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-muted-foreground">Video URL <span className="text-red-500">*</span></label>
                <input className={iCls} value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setError(""); }} placeholder="https://youtube.com/..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-muted-foreground">Duration (seconds)</label>
                <input type="number" className={iCls} value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 1800" min="0" />
              </div>
            </>}
            {type === "TEXT" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-muted-foreground">Content body</label>
                <textarea rows={6} value={textBody} onChange={e => setTextBody(e.target.value)} placeholder="Write lesson content here (Markdown supported)…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all resize-none leading-relaxed" />
              </div>
            )}
            {type === "PDF" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-muted-foreground">PDF URL <span className="text-red-500">*</span></label>
                <input className={iCls} value={pdfUrl} onChange={e => { setPdfUrl(e.target.value); setError(""); }} placeholder="https://storage.example.com/file.pdf" />
              </div>
            )}
          </div>
          <div className="px-6 pb-5 flex items-center gap-3 flex-shrink-0">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13px] font-bold transition-all disabled:opacity-60">
              {saving ? <RiLoader4Line className="animate-spin text-sm" /> : <RiAddLine />} Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function ManageMissionsPage() {
  const router = useRouter();
  const { id: courseId } = useParams() as { id: string };
  const [missions, setMissions] = useState<CourseMission[]>([]);
  const [contents, setContents] = useState<Record<string, MissionContent[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingMission, setEditingMission] = useState<CourseMission | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddContent, setShowAddContent] = useState<string | null>(null);
  const [loadingContents, setLoadingContents] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await courseApi.getMissions(courseId); setMissions(r.data); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const loadContents = async (missionId: string) => {
    if (contents[missionId]) return;
    setLoadingContents(missionId);
    try { const r = await courseApi.getContents(missionId); setContents(p => ({ ...p, [missionId]: r.data })); }
    catch { }
    finally { setLoadingContents(null); }
  };

  const toggleExpand = async (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) await loadContents(next);
  };

  const handleCreate = async (data: { title: string; description: string }) => {
    const r = await courseApi.createMission(courseId, data);
    setMissions(p => [...p, r.data]);
    toast.success("Mission created!", { position: "top-right" });
  };

  const handleUpdate = async (data: { title: string; description: string }) => {
    if (!editingMission) return;
    const r = await courseApi.updateMission(courseId, editingMission.id, data);
    setMissions(p => p.map(m => m.id === editingMission.id ? { ...m, ...r.data } : m));
    toast.success("Mission updated!", { position: "top-right" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this mission?")) return;
    try {
      await courseApi.deleteMission(courseId, id);
      setMissions(p => p.filter(m => m.id !== id).map((m, i) => ({ ...m, order: i })));
      toast.success("Mission deleted.", { position: "top-right" });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSubmit = async (id: string) => {
    try {
      await courseApi.submitMission(courseId, id);
      setMissions(p => p.map(m => m.id === id ? { ...m, status: "PENDING_APPROVAL" } : m));
      toast.success("Mission submitted for approval!", { position: "top-right" });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteContent = async (missionId: string, contentId: string) => {
    try {
      await courseApi.deleteContent(missionId, contentId);
      setContents(p => ({ ...p, [missionId]: (p[missionId] ?? []).filter(c => c.id !== contentId) }));
      setMissions(p => p.map(m => m.id === missionId ? { ...m, _count: { contents: Math.max(0, (m._count?.contents ?? 1) - 1) } } : m));
      toast.success("Content removed.", { position: "top-right" });
    } catch (e: any) { toast.error(e.message); }
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...missions];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setMissions(arr.map((m, i) => ({ ...m, order: i })));
  };
  const moveDown = (idx: number) => {
    if (idx === missions.length - 1) return;
    const arr = [...missions];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    setMissions(arr.map((m, i) => ({ ...m, order: i })));
  };

  return (
    <>
      {(showCreate || editingMission) && (
        <MissionModal mission={editingMission ?? undefined}
          onClose={() => { setShowCreate(false); setEditingMission(null); }}
          onSave={editingMission ? handleUpdate : handleCreate} />
      )}
      {showAddContent && (
        <AddContentModal missionId={showAddContent} onClose={() => setShowAddContent(null)}
          onAdd={item => {
            setContents(p => ({ ...p, [showAddContent]: [...(p[showAddContent] ?? []), item] }));
            setMissions(p => p.map(m => m.id === showAddContent ? { ...m, _count: { contents: (m._count?.contents ?? 0) + 1 } } : m));
          }} />
      )}

      <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full min-h-screen">
        <AmbientBg />

        {/* Heading */}
        <div>
          <button onClick={() => router.push(`/dashboard/teacher/courses/${courseId}`)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3">
            <RiArrowLeftLine /> Back to course
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
                <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Missions</span>
              </div>
              <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground">Manage Missions</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Build the lesson structure. Each mission can contain videos, text and PDFs.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={fetchMissions} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
              </button>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <RiAddLine /> Add mission
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
            <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
            <p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p>
            <button onClick={fetchMissions} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline flex-shrink-0">Retry</button>
          </div>
        )}

        {/* Skeleton */}
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted/40" />)}
          </div>
        ) : missions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-xl text-muted-foreground/30"><RiFileTextLine /></div>
            <div>
              <p className="text-[14px] font-bold text-muted-foreground">No missions yet</p>
              <p className="text-[13px] text-muted-foreground/60 mt-1">Add your first mission to start building the course.</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">
              <RiAddLine /> Add mission
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {missions.sort((a, b) => a.order - b.order).map((m, idx) => {
              const isExpanded = expandedId === m.id;
              const mContents = contents[m.id] ?? [];
              const canEdit = m.status === "DRAFT" || m.status === "REJECTED";
              const canDel = m.status === "DRAFT";
              const canSubmit = m.status === "DRAFT" || m.status === "REJECTED";

              return (
                <div key={m.id} className={cn(
                  "rounded-2xl border bg-card/90 backdrop-blur-sm overflow-hidden transition-all duration-200",
                  isExpanded ? "border-teal-200/60 dark:border-teal-800/50 shadow-md shadow-teal-500/5" : "border-border hover:border-teal-200/40 dark:hover:border-teal-800/30"
                )}>
                  {/* Header */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0} className="w-5 h-5 flex items-center justify-center text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"><RiArrowUpLine className="text-xs" /></button>
                      <button onClick={() => moveDown(idx)} disabled={idx === missions.length - 1} className="w-5 h-5 flex items-center justify-center text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"><RiArrowDownLine className="text-xs" /></button>
                    </div>
                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-[11px] font-extrabold">{idx + 1}</div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(m.id)}>
                      <p className="text-[14px] font-extrabold text-foreground truncate">{m.title}</p>
                      {m.description && <p className="text-[12px] text-muted-foreground truncate">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11.5px] text-muted-foreground hidden sm:block">{m._count?.contents ?? 0} items</span>
                      <StatusBadge status={m.status} />
                      {canSubmit && (
                        <button onClick={() => handleSubmit(m.id)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[11.5px] font-bold transition-colors">
                          <RiSendPlaneLine className="text-xs" /> Submit
                        </button>
                      )}
                      {canEdit && <button onClick={() => setEditingMission(m)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"><RiEditLine className="text-sm" /></button>}
                      {canDel && <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all"><RiDeleteBinLine className="text-sm" /></button>}
                    </div>
                  </div>

                  {m.status === "REJECTED" && m.rejectedNote && (
                    <div className="mx-5 mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/40">
                      <RiAlertLine className="text-red-500 text-xs mt-0.5 flex-shrink-0" />
                      <p className="text-[12px] text-red-600 dark:text-red-400">{m.rejectedNote}</p>
                    </div>
                  )}

                  {/* Content panel */}
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[12.5px] font-bold text-foreground">Content items</p>
                        <button onClick={() => setShowAddContent(m.id)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-[12px] font-semibold text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300/50 dark:hover:border-teal-700/50 transition-all">
                          <RiAddLine className="text-xs" /> Add content
                        </button>
                      </div>

                      {loadingContents === m.id
                        ? <div className="flex items-center justify-center py-6"><RiLoader4Line className="animate-spin text-teal-500 text-xl" /></div>
                        : mContents.length === 0
                          ? (
                            <button onClick={() => setShowAddContent(m.id)} className="flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-teal-300/60 dark:border-teal-700/50 text-[13px] font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all">
                              <RiAddLine /> Add first content item
                            </button>
                          )
                          : (
                            <div className="flex flex-col gap-2">
                              {mContents.sort((a, b) => a.order - b.order).map(cnt => {
                                const cfg = CONTENT_CFG[cnt.type];
                                return (
                                  <div key={cnt.id} className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 border border-border hover:border-teal-200/60 dark:hover:border-teal-800/50 transition-colors">
                                    <span className={cn("w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-sm border", cfg.color)}>{cfg.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-bold text-foreground truncate">{cnt.title}</p>
                                      <p className="text-[11.5px] text-muted-foreground">{cfg.label}{cnt.duration ? ` · ${Math.floor(cnt.duration / 60)}m` : ""}</p>
                                    </div>
                                    <button onClick={() => handleDeleteContent(m.id, cnt.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all">
                                      <RiDeleteBinLine className="text-xs" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}