"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiGlobalLine, RiAddLine, RiDeleteBinLine,
  RiLoader4Line, RiCheckLine, RiCloseLine, RiTimeLine,
  RiAlertLine, RiInformationLine, RiBroadcastLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminPlatformApi } from "@/lib/api";
import { toast } from "sonner";

const URGENCY_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  INFO:    { label: "Info",    icon: <RiInformationLine />, cls: "text-sky-700 dark:text-sky-400 bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/60" },
  WARNING: { label: "Warning", icon: <RiAlertLine />,       cls: "text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/60" },
  URGENT:  { label: "Urgent",  icon: <RiBroadcastLine />,   cls: "text-rose-700 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/60" },
};

const ROLE_LABELS: Record<string, string> = { "": "All users", TEACHER: "Teachers only", STUDENT: "Students only" };

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

type Announcement = {
  id: string;
  title: string;
  body: string;
  urgency: string;
  targetRole?: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  author: { name: string; email: string };
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-muted rounded-xl" />
        <div className="h-3.5 bg-muted rounded w-48" />
        <div className="ml-auto w-12 h-5 bg-muted rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-4/5" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded-full w-16" />
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
    </div>
  );
}

export default function GlobalAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urgency, setUrgency] = useState("INFO");
  const [targetRole, setTargetRole] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPlatformApi.getAnnouncements();
      const raw = r.data;
      setAnnouncements(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await adminPlatformApi.createAnnouncement({
        title, body, urgency,
        targetRole: targetRole || undefined,
        scheduledAt: scheduledAt || undefined,
      });
      toast.success("Announcement posted");
      setShowModal(false);
      setTitle(""); setBody(""); setUrgency("INFO"); setTargetRole(""); setScheduledAt("");
      await load();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    try {
      await adminPlatformApi.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success("Announcement deleted");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-amber-500 dark:text-amber-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Global Announcements</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Post platform-wide messages, schedule and target by role</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="h-9 px-4 rounded-xl bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all shrink-0">
          <RiAddLine /> New announcement
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : announcements.length === 0
          ? (
            <div className="py-20 text-center">
              <RiGlobalLine className="text-5xl text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-[15px] font-semibold text-muted-foreground">No announcements yet</p>
              <p className="text-[12.5px] text-muted-foreground/60 mt-1">Create the first platform-wide announcement</p>
              <button onClick={() => setShowModal(true)}
                className="mt-5 h-9 px-5 rounded-xl bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-all">
                <RiAddLine /> Create announcement
              </button>
            </div>
          )
          : announcements.map(a => {
            const urgCfg = URGENCY_CFG[a.urgency] ?? URGENCY_CFG.INFO;
            return (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-amber-300/40 dark:hover:border-amber-700/40 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border shrink-0", urgCfg.cls)}>
                      {urgCfg.icon}
                    </div>
                    <h3 className="text-[14px] font-bold text-foreground truncate">{a.title}</h3>
                  </div>
                  <button onClick={() => del(a.id)} disabled={deleting === a.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-50/60 transition-all opacity-0 group-hover:opacity-100 shrink-0">
                    {deleting === a.id ? <RiLoader4Line className="animate-spin text-xs" /> : <RiDeleteBinLine className="text-xs" />}
                  </button>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{a.body}</p>
                <div className="flex items-center gap-2 flex-wrap border-t border-border/60 pt-3">
                  <span className={cn("text-[10.5px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border", urgCfg.cls)}>
                    {urgCfg.label}
                  </span>
                  <span className="text-[10.5px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-muted/30">
                    {ROLE_LABELS[a.targetRole ?? ""] ?? a.targetRole}
                  </span>
                  {a.scheduledAt && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                      <RiTimeLine className="text-xs" />
                      Scheduled: {fmtDate(a.scheduledAt)}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground/50">
                    By {a.author?.name} · {fmtDate(a.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-foreground">New Global Announcement</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all">
                <RiCloseLine />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title…"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-400/25 transition-all" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Message *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
                  placeholder="Write your announcement…"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-400/25 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Urgency</label>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(URGENCY_CFG).map(([key, cfg]) => (
                      <button key={key} onClick={() => setUrgency(key)}
                        className={cn("flex items-center gap-2 h-8 px-3 rounded-xl text-[11.5px] font-semibold border transition-all text-left",
                          urgency === key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted/40")}>
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Target</label>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <button key={key} onClick={() => setTargetRole(key)}
                        className={cn("h-8 px-3 rounded-xl text-[11.5px] font-semibold border transition-all text-left",
                          targetRole === key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted/40")}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Schedule (optional)</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/25 transition-all" />
              </div>
            </div>
            <button onClick={create} disabled={saving || !title.trim() || !body.trim()}
              className="h-11 rounded-xl bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all">
              {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
              {scheduledAt ? "Schedule announcement" : "Post now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
