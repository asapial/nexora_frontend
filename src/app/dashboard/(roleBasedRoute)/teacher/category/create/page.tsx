"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiFolderLine, RiAddLine, RiEditLine, RiDeleteBinLine, RiCheckLine,
  RiCloseLine, RiGlobalLine, RiFlaskLine, RiAlertLine, RiStackLine, RiMoreLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type Scope = "GLOBAL" | "CLUSTER";
interface Cluster { id: string; name: string }
interface Category {
  id: string; name: string; color: string; isGlobal: boolean;
  clusterId: string | null; teacherId: string | null;
  _count: { resources: number };
}

const COLOR_OPTIONS = [
  "#14b8a6", "#0ea5e9", "#8b5cf6", "#f59e0b", "#f43f5e", "#10b981", "#6366f1", "#ec4899",
];

const INPUT_CLS = "w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

function CategoryForm({
  initial, clusters, onSubmit, onCancel, loading,
}: {
  initial?: Partial<Category>; clusters: Cluster[];
  onSubmit: (data: { name: string; color: string; isGlobal: boolean; clusterId?: string }) => void;
  onCancel: () => void; loading?: boolean;
}) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [color, setColor]       = useState(initial?.color ?? COLOR_OPTIONS[0]);
  const [scope, setScope]       = useState<Scope>(initial?.isGlobal ? "GLOBAL" : "CLUSTER");
  const [clusterId, setCluster] = useState(initial?.clusterId ?? "");
  const [err, setErr]           = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Name is required."); return; }
    if (scope === "CLUSTER" && !clusterId) { setErr("Select a cluster."); return; }
    onSubmit({ name, color, isGlobal: scope === "GLOBAL", clusterId: scope === "CLUSTER" ? clusterId : undefined });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Category name *</label>
          <input value={name} onChange={e => { setName(e.target.value); setErr(""); }} placeholder="e.g. Research Papers" className={INPUT_CLS} />
          {err && <p className="text-[12px] text-red-500 font-medium mt-1">{err}</p>}
        </div>
        <div>
          <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Scope</label>
          <select value={scope} onChange={e => setScope(e.target.value as Scope)}
            className="w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all appearance-none cursor-pointer">
            <option value="GLOBAL">Global — all clusters</option>
            <option value="CLUSTER">Cluster-specific</option>
          </select>
        </div>
      </div>

      {scope === "CLUSTER" && (
        <div>
          <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Cluster *</label>
          <select value={clusterId} onChange={e => setCluster(e.target.value)}
            className="w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all appearance-none cursor-pointer">
            <option value="" disabled>Select a cluster…</option>
            {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Colour tag</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={cn("w-8 h-8 rounded-lg border-2 transition-all flex-shrink-0", color === c ? "border-foreground scale-110" : "border-transparent opacity-70 hover:opacity-100")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-1 border-t border-border">
        <button type="button" onClick={onCancel} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">Cancel</button>
        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13px] font-bold shadow-sm shadow-teal-600/20 transition-all disabled:opacity-60">
          {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiCheckLine />}
          {initial?.id ? "Save changes" : "Create category"}
        </button>
      </div>
    </form>
  );
}

export default function ResourceCategoriesPage() {
  const [categories, setCategories]     = useState<Category[]>([]);
  const [clusters, setClusters]         = useState<Cluster[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchAll = useCallback(() => {
    Promise.all([
      fetch("/api/teacher/categories", { credentials: "include" }).then(r => r.json()),
      fetch("/api/teacher/announcements/clusters", { credentials: "include" }).then(r => r.json()),
    ]).then(([c, cl]) => {
      if (c.success) setCategories(c.data);
      if (cl.success) setClusters(cl.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (data: { name: string; color: string; isGlobal: boolean; clusterId?: string }) => {
    setSaving(true);
    const res = await fetch("/api/teacher/categories", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) setCategories(prev => [...prev, { ...json.data, _count: { resources: 0 } }]);
    setShowCreate(false); setSaving(false);
  };

  const handleEdit = async (data: { name: string; color: string; isGlobal: boolean; clusterId?: string }) => {
    if (!editTarget) return; setSaving(true);
    const res = await fetch(`/api/teacher/categories/${editTarget.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) setCategories(prev => prev.map(c => c.id === editTarget.id ? { ...c, ...json.data } : c));
    setEditTarget(null); setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/teacher/categories/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
    setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const globalCats  = categories.filter(c => c.isGlobal);
  const clusterCats = categories.filter(c => !c.isGlobal);

  function CatRow({ cat }: { cat: Category }) {
    const [menu, setMenu] = useState(false);
    return (
      <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
        <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color ?? "#14b8a6" }} />
        <div className="flex-1 min-w-0">
          <span className="text-[13.5px] font-semibold text-foreground">{cat.name}</span>
          {cat.clusterId && <p className="text-[11.5px] text-muted-foreground">{clusters.find(c => c.id === cat.clusterId)?.name}</p>}
        </div>
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground flex-shrink-0"><RiStackLine className="text-xs" /> {cat._count.resources}</span>
        <div className="relative flex-shrink-0">
          <button onClick={() => setMenu(o => !o)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-all"><RiMoreLine /></button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
                <button onClick={() => { setEditTarget(cat); setMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-foreground hover:bg-accent transition-colors"><RiEditLine className="text-muted-foreground" /> Edit</button>
                <button onClick={() => { setDeleteTarget(cat); setMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"><RiDeleteBinLine /> Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto w-full">
      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-red-100/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/50 text-red-600 dark:text-red-400 text-lg"><RiAlertLine /></div>
              <div>
                <h3 className="text-[14.5px] font-bold text-foreground mb-1">Delete category?</h3>
                <p className="text-[13px] text-muted-foreground">"{deleteTarget.name}" will be removed and its {deleteTarget._count.resources} resource{deleteTarget._count.resources !== 1 ? "s" : ""} un-categorised.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
              <button onClick={handleDelete} className="h-9 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold shadow-sm transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-[14px] font-bold text-foreground">Edit Category</span>
              <button onClick={() => setEditTarget(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
            </div>
            <CategoryForm initial={editTarget} clusters={clusters} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} loading={saving} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Resources</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Resource Categories</h1>
        </div>
        <button onClick={() => { setShowCreate(true); setEditTarget(null); }}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all">
          <RiAddLine /> New category
        </button>
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-teal-300/50 dark:border-teal-700/50 bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-teal-50/40 dark:bg-teal-950/20">
            <RiAddLine className="text-teal-600 dark:text-teal-400" />
            <span className="text-[14px] font-bold text-foreground">New Category</span>
          </div>
          <CategoryForm clusters={clusters} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={saving} />
        </div>
      )}

      {/* Lists */}
      {[
        { label: "Global Categories", icon: <RiGlobalLine />, items: globalCats, sub: "Available across all clusters" },
        { label: "Cluster-Specific", icon: <RiFlaskLine />, items: clusterCats, sub: "Only visible within their cluster" },
      ].map(section => (
        <div key={section.label} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400">{section.icon}</div>
            <div className="flex-1">
              <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">{section.label}</h2>
              <p className="text-[12px] text-muted-foreground">{section.sub}</p>
            </div>
            <span className="text-[12px] font-semibold text-muted-foreground">{section.items.length}</span>
          </div>
          <div className="flex flex-col divide-y divide-border/60">
            {loading ? (
              <div className="px-5 py-6 animate-pulse h-12" />
            ) : section.items.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted-foreground italic">No categories yet.</p>
            ) : (
              section.items.map(cat => <CatRow key={cat.id} cat={cat} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}