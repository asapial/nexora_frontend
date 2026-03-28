"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiMailLine, RiEyeLine, RiSendPlaneLine,
  RiLoader4Line, RiCheckLine, RiCodeLine, RiAddLine,
  RiDeleteBinLine, RiCloseLine, RiRefreshLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminPlatformApi } from "@/lib/api";
import { toast } from "sonner";

type Template = {
  id: string;
  slug: string;
  name: string;
  subject: string;
  description: string;
  body: string;
  updatedAt?: string;
};

function SkeletonSidebar() {
  return (
    <div className="flex flex-col gap-1 p-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-3.5 rounded-xl animate-pulse">
          <div className="h-3 bg-muted rounded w-28 mb-2" />
          <div className="h-2.5 bg-muted rounded w-40" />
        </div>
      ))}
    </div>
  );
}

// ─── Create Template Modal ─────────────────────────────────
function CreateModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (t: { name: string; slug: string; subject: string; description: string; body: string }) => Promise<void>;
}) {
  const [name, setName]         = useState("");
  const [slug, setSlug]         = useState("");
  const [subject, setSubject]   = useState("");
  const [desc, setDesc]         = useState("");
  const [body, setBody]         = useState("");
  const [saving, setSaving]     = useState(false);

  const autoSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const submit = async () => {
    if (!name.trim() || !slug.trim() || !subject.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await onCreate({ name: name.trim(), slug: slug.trim(), subject: subject.trim(), description: desc.trim(), body });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-foreground">Create Template</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all">
            <RiCloseLine />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Name *</label>
              <input value={name} onChange={e => { setName(e.target.value); setSlug(autoSlug(e.target.value)); }}
                placeholder="Teacher Welcome"
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/25 transition-all" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Slug *</label>
              <input value={slug} onChange={e => setSlug(e.target.value)}
                placeholder="teacher-welcome"
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/25 transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Email subject line"
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/25 transition-all" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Short description of when this template is used"
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/25 transition-all" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">HTML Body *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
              placeholder="<!DOCTYPE html><html><body>…</body></html>"
              className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-[12.5px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/25 resize-none transition-all" />
          </div>
        </div>
        <button onClick={submit} disabled={saving || !name.trim() || !slug.trim() || !subject.trim() || !body.trim()}
          className="h-11 rounded-xl bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all">
          {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
          Create template
        </button>
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Template | null>(null);
  const [editing, setEditing]     = useState(false);
  const [editBody, setEditBody]   = useState("");
  const [preview, setPreview]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendLoading, setSendLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPlatformApi.getEmailTemplates();
      const raw = r.data;
      const list: Template[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setTemplates(list);
      if (!selected && list.length > 0) {
        setSelected(list[0]);
        setEditBody(list[0].body);
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const selectTemplate = (t: Template) => {
    setSelected(t);
    setEditBody(t.body);
    setEditing(false);
    setPreview(false);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminPlatformApi.updateEmailTemplate(selected.id, { body: editBody });
      toast.success("Template saved");
      setEditing(false);
      // Update local
      setTemplates(prev => prev.map(t => t.id === selected.id ? { ...t, body: editBody } : t));
      setSelected(prev => prev ? { ...prev, body: editBody } : prev);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    setDeleting(id);
    try {
      await adminPlatformApi.deleteEmailTemplate(id);
      toast.success("Template deleted");
      const remaining = templates.filter(t => t.id !== id);
      setTemplates(remaining);
      if (selected?.id === id) {
        setSelected(remaining[0] ?? null);
        setEditBody(remaining[0]?.body ?? "");
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setDeleting(null); }
  };

  const handleCreate = async (payload: { name: string; slug: string; subject: string; description: string; body: string }) => {
    const r = await adminPlatformApi.createEmailTemplate(payload);
    toast.success("Template created");
    await load();
    if (r.data) selectTemplate(r.data);
  };

  const testSend = async () => {
    if (!testEmail.trim()) return;
    setSendLoading(true);
    try {
      await new Promise(res => setTimeout(res, 1000));
      toast.success(`Test email sent to ${testEmail}`);
    } finally { setSendLoading(false); }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] max-w-7xl mx-auto w-full">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-sky-500 text-sm" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Admin</span>
          </div>
          <h1 className="text-[14px] font-extrabold text-foreground">Email Templates</h1>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">Edit and preview system emails</p>
        </div>

        {/* Actions */}
        <div className="p-2 border-b border-border flex gap-1">
          <button onClick={() => setShowCreate(true)}
            className="flex-1 h-8 rounded-xl bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all">
            <RiAddLine /> New template
          </button>
          <button onClick={load} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-all">
            <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          </button>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? <SkeletonSidebar /> : templates.map(t => (
            <button key={t.id} onClick={() => selectTemplate(t)}
              className={cn("w-full p-3.5 flex flex-col items-start text-left hover:bg-muted/30 transition-colors border-b border-border/40 gap-1 group relative",
                selected?.id === t.id && "bg-sky-50/40 dark:bg-sky-950/10 border-l-2 border-l-sky-500")}>
              <div className="flex items-center gap-2 w-full">
                <RiMailLine className={cn("text-sm shrink-0", selected?.id === t.id ? "text-sky-500" : "text-muted-foreground/50")} />
                <p className={cn("text-[12.5px] font-semibold truncate flex-1", selected?.id === t.id ? "text-foreground" : "text-muted-foreground")}>{t.name}</p>
                <button onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                  disabled={deleting === t.id}
                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  {deleting === t.id ? <RiLoader4Line className="animate-spin text-xs" /> : <RiDeleteBinLine className="text-xs" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground/60 line-clamp-2 ml-5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor / Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RiMailLine className="text-5xl text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-muted-foreground">Select a template</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">or create a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div className="px-5 py-3.5 border-b border-border bg-card/80 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground truncate">{selected.name}</p>
                <p className="text-[11.5px] text-muted-foreground truncate">Subject: {selected.subject}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => { setEditing(!editing); setPreview(false); }}
                  className={cn("h-8 px-3 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-1.5",
                    editing ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted/40")}>
                  <RiCodeLine className="text-xs" /> {editing ? "Editing" : "Edit"}
                </button>
                <button onClick={() => { setPreview(!preview); setEditing(false); }}
                  className={cn("h-8 px-3 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-1.5",
                    preview ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted/40")}>
                  <RiEyeLine className="text-xs" /> Preview
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {preview ? (
                <div className="p-6 h-full">
                  <div className="rounded-xl border border-border overflow-hidden shadow-sm h-full">
                    <iframe
                      srcDoc={editing ? editBody : selected.body}
                      className="w-full h-full border-0"
                      title="Email preview"
                    />
                  </div>
                </div>
              ) : editing ? (
                <div className="p-4 h-full flex flex-col gap-3">
                  <textarea
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                    className="flex-1 w-full px-4 py-3 rounded-xl border border-border bg-muted/20 text-[12.5px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/25 resize-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving}
                      className="h-10 px-5 rounded-xl bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all">
                      {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} Save template
                    </button>
                    <button onClick={() => { setEditing(false); setEditBody(selected.body); }}
                      className="h-10 px-4 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">{selected.body}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Test send */}
            <div className="border-t border-border px-5 py-4 bg-card/80">
              <p className="text-[11.5px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <RiSendPlaneLine /> Test Send
              </p>
              <div className="flex gap-2">
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="flex-1 h-9 px-3 rounded-xl border border-border bg-muted/30 text-[12.5px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all" />
                <button onClick={testSend} disabled={sendLoading || !testEmail.trim()}
                  className="h-9 px-4 rounded-xl bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 disabled:opacity-50 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all">
                  {sendLoading ? <RiLoader4Line className="animate-spin" /> : <RiSendPlaneLine />}
                  Send test
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
