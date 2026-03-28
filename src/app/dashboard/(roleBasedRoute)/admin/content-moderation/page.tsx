"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiShieldCheckLine, RiDeleteBinLine, RiAlertLine,
  RiRefreshLine, RiLoader4Line, RiMessageLine, RiFileTextLine,
  RiUserLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminPlatformApi } from "@/lib/api";
import { toast } from "sonner";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

type Comment = {
  id: string;
  content?: string;
  text?: string;
  createdAt: string;
  resource?: { id: string; title: string };
};

type Resource = {
  id: string;
  title: string;
  fileType: string;
  createdAt: string;
  uploader?: { name: string };
};

function SkeletonRow() {
  return (
    <div className="px-5 py-4 border-b border-border/60 animate-pulse flex items-center gap-4">
      <div className="w-8 h-8 bg-muted rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-2.5 bg-muted rounded w-40" />
      </div>
      <div className="flex gap-1.5">
        <div className="w-7 h-7 bg-muted rounded-lg" />
        <div className="w-7 h-7 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

// ─── Warn modal ───────────────────────────────────────────
function WarnModal({ userId, onClose, onWarn }: {
  userId: string;
  onClose: () => void;
  onWarn: (userId: string, reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    try { await onWarn(userId, reason); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 className="text-[15px] font-extrabold text-foreground">Warn User</h2>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
          placeholder="Reason for warning…"
          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-400/25 resize-none transition-all" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 transition-all">Cancel</button>
          <button onClick={submit} disabled={saving || !reason.trim()}
            className="flex-1 h-10 rounded-xl bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all">
            {saving ? <RiLoader4Line className="animate-spin" /> : <RiAlertLine />}
            Send warning
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContentModerationPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"comments" | "resources">("comments");
  const [warnUserId, setWarnUserId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPlatformApi.getModeration();
      setComments(Array.isArray(r.data?.comments) ? r.data.comments : []);
      setResources(Array.isArray(r.data?.resources) ? r.data.resources : []);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeComment = async (id: string) => {
    try {
      await adminPlatformApi.removeComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
      setActionLog(prev => [`Removed comment ${id}`, ...prev]);
      toast.success("Comment removed");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const warnUser = async (userId: string, reason: string) => {
    await adminPlatformApi.warnUser(userId, reason);
    setActionLog(prev => [`Warned user ${userId}: ${reason}`, ...prev]);
    toast.success("Warning sent to user");
  };

  const tabs = [
    { key: "comments" as const, label: "Comments", count: comments.length, icon: <RiMessageLine /> },
    { key: "resources" as const, label: "Resources", count: resources.length, icon: <RiFileTextLine /> },
  ];

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-rose-500 dark:text-rose-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Content Moderation</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Review flagged content, remove items, and warn users</p>
        </div>
        <button onClick={load}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
          <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("flex items-center gap-1.5 h-8 px-4 rounded-lg text-[12.5px] font-semibold transition-all",
              activeTab === tab.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab.icon}
            {tab.label}
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              activeTab === tab.key ? "bg-rose-100/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" : "bg-muted text-muted-foreground")}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/10">
          <p className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">
            {activeTab === "comments" ? "Flagged Comments" : "Recent Public Resources"}
          </p>
        </div>

        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : activeTab === "comments"
          ? comments.length === 0
            ? (
              <div className="py-16 text-center">
                <RiShieldCheckLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-[13.5px] font-medium text-muted-foreground">No flagged comments</p>
              </div>
            )
            : comments.map(c => (
              <div key={c.id} className="px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 flex items-center justify-center shrink-0">
                  <RiMessageLine className="text-rose-600 dark:text-rose-400 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-snug">{c.content ?? c.text ?? "(empty)"}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {c.resource && (
                      <span className="text-[11px] text-muted-foreground/60">
                        On: {c.resource.title}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground/60">{fmtDate(c.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toast.info("User ID required to warn")}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50/60 transition-all" title="Warn user">
                    <RiAlertLine className="text-sm" />
                  </button>
                  <button onClick={() => removeComment(c.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50/60 transition-all" title="Remove comment">
                    <RiDeleteBinLine className="text-sm" />
                  </button>
                </div>
              </div>
            ))
          : resources.length === 0
          ? (
            <div className="py-16 text-center">
              <RiShieldCheckLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[13.5px] font-medium text-muted-foreground">No resources to review</p>
            </div>
          )
          : resources.map(r => (
            <div key={r.id} className="px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                <RiFileTextLine className="text-muted-foreground text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10.5px] uppercase font-bold text-muted-foreground/60 tracking-wide">{r.fileType}</span>
                  {r.uploader && (
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground/60">
                      <RiUserLine className="text-xs" /> {r.uploader.name}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground/60">{fmtDate(r.createdAt)}</span>
                </div>
              </div>
              <button onClick={() => toast.info("Resource ID: " + r.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50/60 transition-all" title="Review">
                <RiAlertLine className="text-sm" />
              </button>
            </div>
          ))}
      </div>

      {/* Action log */}
      {actionLog.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/10">
            <p className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Moderation Log</p>
          </div>
          <div className="p-4 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {actionLog.map((log, i) => (
              <p key={i} className="text-[12px] text-muted-foreground font-mono">{log}</p>
            ))}
          </div>
        </div>
      )}

      {warnUserId && (
        <WarnModal userId={warnUserId} onClose={() => setWarnUserId(null)} onWarn={warnUser} />
      )}
    </div>
  );
}
