"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiShieldCheckLine, RiDeleteBinLine, RiAlertLine,
  RiLoader4Line, RiBookOpenLine, RiFileTextLine,
  RiUserLine, RiCloseLine, RiTimeLine, RiEyeLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminPlatformApi } from "@/lib/api";
import { toast } from "sonner";
import RefreshIcon from "@/components/shared/RefreshIcon";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

type Course = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count?: { enrollments: number };
  teacher?: {
    user?: { id: string; name: string; email: string };
  };
};

type Resource = {
  id: string;
  title: string;
  fileType: string;
  createdAt: string;
  uploader?: { id: string; name: string };
};

type Warning = {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  createdAt: string;
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
function WarnModal({ userId, userName, onClose, onWarn }: {
  userId: string;
  userName: string;
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
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-foreground">Warn {userName}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all">
            <RiCloseLine />
          </button>
        </div>
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

// ─── Warning viewer ───────────────────────────────────────
function WarningsPanel({ userId, userName, onClose }: {
  userId: string;
  userName: string;
  onClose: () => void;
}) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPlatformApi.getWarnings(userId);
      setWarnings(Array.isArray(r.data) ? r.data : []);
    } catch { toast.error("Failed to load warnings"); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const removeWarning = async (warningId: string) => {
    if (!confirm("Remove this warning?")) return;
    setRemovingId(warningId);
    try {
      await adminPlatformApi.removeWarning(warningId);
      setWarnings(prev => prev.filter(w => w.id !== warningId));
      toast.success("Warning removed");
    } catch { toast.error("Failed to remove warning"); }
    finally { setRemovingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[80vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-foreground">Warnings for {userName}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all">
            <RiCloseLine />
          </button>
        </div>
        <div className="overflow-y-auto flex flex-col gap-2 flex-1">
          {loading ? (
            <div className="py-8 text-center">
              <RiLoader4Line className="animate-spin text-xl text-muted-foreground mx-auto" />
            </div>
          ) : warnings.length === 0 ? (
            <div className="py-8 text-center">
              <RiShieldCheckLine className="text-3xl text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No warnings issued to this user</p>
            </div>
          ) : warnings.map(w => (
            <div key={w.id} className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20 p-3 flex items-start gap-3">
              <RiAlertLine className="text-amber-500 text-base mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-amber-700 dark:text-amber-400">{w.body ?? "Warning"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{fmtDate(w.createdAt)}</p>
              </div>
              <button
                onClick={() => removeWarning(w.id)}
                disabled={removingId === w.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-all shrink-0"
                title="Remove warning">
                {removingId === w.id ? <RiLoader4Line className="text-sm animate-spin" /> : <RiDeleteBinLine className="text-sm" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ContentModerationPage() {
  const [courses, setCourses]     = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<"courses" | "resources">("courses");
  const [warnTarget, setWarnTarget] = useState<{ userId: string; name: string } | null>(null);
  const [warningsTarget, setWarningsTarget] = useState<{ userId: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionLog, setActionLog]   = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPlatformApi.getModeration();
      setCourses(Array.isArray(r.data?.courses) ? r.data.courses : []);
      setResources(Array.isArray(r.data?.resources) ? r.data.resources : []);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeCourse = async (id: string, title: string) => {
    if (!confirm(`Remove course "${title}"? This is irreversible.`)) return;
    setRemovingId(id);
    try {
      await adminPlatformApi.removeCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      setActionLog(prev => [`Removed course: ${title}`, ...prev]);
      toast.success("Course removed");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setRemovingId(null); }
  };

  const removeResource = async (id: string, title: string) => {
    if (!confirm(`Remove resource "${title}"?`)) return;
    setRemovingId(id);
    try {
      await adminPlatformApi.removeResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
      setActionLog(prev => [`Removed resource: ${title}`, ...prev]);
      toast.success("Resource removed");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setRemovingId(null); }
  };

  const warnUser = async (userId: string, reason: string) => {
    await adminPlatformApi.warnUser(userId, reason);
    setActionLog(prev => [`Warned user ${userId}: ${reason}`, ...prev]);
    toast.success("Warning sent to user");
  };

  const tabs = [
    { key: "courses"   as const, label: "Courses",   count: courses.length,   icon: <RiBookOpenLine /> },
    { key: "resources" as const, label: "Resources",  count: resources.length, icon: <RiFileTextLine /> },
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
          <p className="text-[13px] text-muted-foreground mt-1">Review published courses and resources, remove items, and warn users</p>
        </div>
        <RefreshIcon onClick={load} loading={loading} />
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
            {activeTab === "courses" ? "Published Courses" : "Public Resources"}
          </p>
        </div>

        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : activeTab === "courses"
          ? courses.length === 0
            ? (
              <div className="py-16 text-center">
                <RiShieldCheckLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-[13.5px] font-medium text-muted-foreground">No published courses</p>
              </div>
            )
            : courses.map(c => (
              <div key={c.id} className="px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 flex items-center justify-center shrink-0">
                  <RiBookOpenLine className="text-rose-600 dark:text-rose-400 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{c.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {c.teacher?.user && (
                      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground/70">
                        <RiUserLine className="text-xs" /> {c.teacher.user.name}
                      </span>
                    )}
                    {c._count && (
                      <span className="text-[11px] text-muted-foreground/60">{c._count.enrollments} enrolled</span>
                    )}
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground/60">
                      <RiTimeLine className="text-xs" /> {fmtDate(c.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {c.teacher?.user && (
                    <>
                      <button
                        onClick={() => setWarningsTarget({ userId: c.teacher!.user!.id, name: c.teacher!.user!.name })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sky-600 hover:bg-sky-50/60 dark:hover:bg-sky-950/30 transition-all"
                        title="View warnings">
                        <RiEyeLine className="text-sm" />
                      </button>
                      <button
                        onClick={() => setWarnTarget({ userId: c.teacher!.user!.id, name: c.teacher!.user!.name })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 transition-all"
                        title="Warn teacher">
                        <RiAlertLine className="text-sm" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => removeCourse(c.id, c.title)}
                    disabled={removingId === c.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-all"
                    title="Remove course">
                    {removingId === c.id ? <RiLoader4Line className="text-sm animate-spin" /> : <RiDeleteBinLine className="text-sm" />}
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
              <div className="flex items-center gap-1 shrink-0">
                {r.uploader && (
                  <>
                    <button
                      onClick={() => setWarningsTarget({ userId: r.uploader!.id, name: r.uploader!.name })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sky-600 hover:bg-sky-50/60 transition-all"
                      title="View warnings">
                      <RiEyeLine className="text-sm" />
                    </button>
                    <button
                      onClick={() => setWarnTarget({ userId: r.uploader!.id, name: r.uploader!.name })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50/60 transition-all"
                      title="Warn uploader">
                      <RiAlertLine className="text-sm" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => removeResource(r.id, r.title)}
                  disabled={removingId === r.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50/60 transition-all"
                  title="Remove resource">
                  {removingId === r.id ? <RiLoader4Line className="text-sm animate-spin" /> : <RiDeleteBinLine className="text-sm" />}
                </button>
              </div>
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

      {warnTarget && (
        <WarnModal
          userId={warnTarget.userId}
          userName={warnTarget.name}
          onClose={() => setWarnTarget(null)}
          onWarn={warnUser}
        />
      )}

      {warningsTarget && (
        <WarningsPanel
          userId={warningsTarget.userId}
          userName={warningsTarget.name}
          onClose={() => setWarningsTarget(null)}
        />
      )}
    </div>
  );
}
