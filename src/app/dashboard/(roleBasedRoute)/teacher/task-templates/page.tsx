"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiAddLine, RiDeleteBinLine, RiEditLine,
  RiCheckLine, RiCloseLine, RiLoader4Line, RiLayoutGridLine,
  RiFileListLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { teacherDashApi } from "@/lib/api";
import { toast } from "sonner";


type Template = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function TemplateCard({ tpl, onEdit, onDelete }: {
  tpl: Template;
  onEdit: (t: Template) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 group hover:border-violet-300/50 dark:hover:border-violet-700/50 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-100/70 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/50 shrink-0">
          <RiFileListLine className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(tpl)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
            <RiEditLine className="text-sm" />
          </button>
          <button onClick={() => onDelete(tpl.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-50/60 transition-all">
            <RiDeleteBinLine className="text-sm" />
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-[13.5px] font-bold text-foreground">{tpl.title}</h3>
        {tpl.description && (
          <p className="text-[12px] text-muted-foreground mt-1 line-clamp-3 leading-relaxed">{tpl.description}</p>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground/60 mt-auto pt-2 border-t border-border/60">
        Created {fmtDate(tpl.createdAt)}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
      <div className="w-9 h-9 bg-muted rounded-xl" />
      <div className="space-y-1.5">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
      <div className="h-2.5 bg-muted rounded w-20 mt-3" />
    </div>
  );
}

export default function TeacherTaskTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await teacherDashApi.getTemplates();
      setTemplates(Array.isArray(r.data) ? r.data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setShowModal(true);
  };

  const openEdit = (tpl: Template) => {
    setEditing(tpl);
    setTitle(tpl.title);
    setDescription(tpl.description ?? "");
    setShowModal(true);
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await teacherDashApi.updateTemplate(editing.id, { title, description });
        toast.success("Template updated");
      } else {
        await teacherDashApi.createTemplate({ title, description });
        toast.success("Template created");
      }
      setShowModal(false);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    try {
      await teacherDashApi.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success("Template deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const filtered = templates.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-violet-500 dark:text-violet-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Teacher</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Task Template Library</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Reusable task definitions to speed up session setup</p>
        </div>
        <button
          onClick={openCreate}
          className="h-9 px-4 rounded-xl bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all shrink-0"
        >
          <RiAddLine /> New template
        </button>
      </div>

      {/* Search + stats */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full h-10 pl-4 pr-4 rounded-xl text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all"
          />
        </div>
        <span className="text-[12px] text-muted-foreground ml-auto">
          {loading ? "Loading…" : `${templates.length} template${templates.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <RiLayoutGridLine className="text-5xl text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-[15px] font-semibold text-muted-foreground">
            {templates.length === 0 ? "No templates yet" : "No results"}
          </p>
          <p className="text-[12.5px] text-muted-foreground/60 mt-1">
            {templates.length === 0
              ? "Create your first template to reuse task definitions across sessions"
              : "Try a different search term"}
          </p>
          {templates.length === 0 && (
            <button
              onClick={openCreate}
              className="mt-5 h-9 px-5 rounded-xl bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <RiAddLine /> Create first template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <TemplateCard key={tpl.id} tpl={tpl} onEdit={openEdit} onDelete={del} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-foreground">
                {editing ? "Edit template" : "New task template"}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all">
                <RiCloseLine />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Template title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Weekly reflection homework"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-400/25 transition-all"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Task description, rubric hints, submission format…"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-400/25 transition-all resize-none"
                />
              </div>
            </div>
            <button
              onClick={save}
              disabled={saving || !title.trim()}
              className="h-11 rounded-xl bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
            >
              {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
              {editing ? "Save changes" : "Create template"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
