"use client";

import { useState } from "react";
import {
  RiFolderLine, RiAddLine, RiEditLine, RiDeleteBinLine, RiCheckLine,
  RiCloseLine, RiSparklingFill, RiGlobalLine, RiFlaskLine,
  RiAlertLine, RiMoreLine, RiStackLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
type Scope = "GLOBAL" | "CLUSTER";
interface Category {
  id:          string;
  name:        string;
  description: string;
  scope:       Scope;
  clusterId?:  string;
  clusterName?:string;
  resourceCount: number;
  color:       string;
  createdAt:   string;
}

const MOCK_CLUSTERS = [
  { id: "c1", name: "ML Research Group — 2025" },
  { id: "c2", name: "NLP Reading Circle"        },
  { id: "c3", name: "Bootcamp Cohort B"          },
];

const COLORS = [
  "bg-teal-500",  "bg-sky-500",   "bg-violet-500",
  "bg-amber-500", "bg-rose-500",  "bg-emerald-500",
];

const MOCK_CATEGORIES: Category[] = [
  { id:"cat1", name:"Research Papers",      description:"Peer-reviewed papers and preprints.", scope:"GLOBAL",  resourceCount:24, color:"bg-teal-500",   createdAt:"Jan 2025" },
  { id:"cat2", name:"Lecture Slides",       description:"Presentation decks from sessions.",   scope:"GLOBAL",  resourceCount:18, color:"bg-sky-500",    createdAt:"Jan 2025" },
  { id:"cat3", name:"Code & Notebooks",     description:"Jupyter notebooks and code samples.", scope:"GLOBAL",  resourceCount:11, color:"bg-violet-500", createdAt:"Feb 2025" },
  { id:"cat4", name:"Sprint Tasks",         description:"Bootcamp sprint reference material.", scope:"CLUSTER", clusterId:"c3", clusterName:"Bootcamp Cohort B",  resourceCount:9,  color:"bg-amber-500", createdAt:"Feb 2025" },
  { id:"cat5", name:"NLP Reading List",     description:"Curated papers for reading circle.",  scope:"CLUSTER", clusterId:"c2", clusterName:"NLP Reading Circle",  resourceCount:6,  color:"bg-rose-500",  createdAt:"Mar 2025" },
];

// ─── Shared primitives ────────────────────────────────────
function Field({ label, hint, children, required }: {
  label: string; hint?: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11.5px] text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  return (
    <>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border",
          error ? "border-red-400/60" : "border-border focus:border-teal-400/70",
          "text-foreground placeholder:text-muted-foreground/40",
          "focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
        )} />
      {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
    </>
  );
}

// ─── Category form (create / edit) ────────────────────────
function CategoryForm({
  initial, onSubmit, onCancel, loading,
}: {
  initial?: Partial<Category>;
  onSubmit: (data: Omit<Category, "id" | "resourceCount" | "createdAt">) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [name,      setName]      = useState(initial?.name        ?? "");
  const [desc,      setDesc]      = useState(initial?.description ?? "");
  const [scope,     setScope]     = useState<Scope>(initial?.scope ?? "GLOBAL");
  const [clusterId, setClusterId] = useState(initial?.clusterId   ?? "");
  const [color,     setColor]     = useState(initial?.color       ?? COLORS[0]);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())                   e.name      = "Name is required";
    if (scope === "CLUSTER" && !clusterId) e.cluster = "Select a cluster";
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const cluster = MOCK_CLUSTERS.find(c => c.id === clusterId);
    onSubmit({
      name:        name.trim(),
      description: desc.trim(),
      scope,
      clusterId:   scope === "CLUSTER" ? clusterId   : undefined,
      clusterName: scope === "CLUSTER" ? cluster?.name : undefined,
      color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Category name" required>
          <TextInput value={name} onChange={setName} placeholder="e.g. Research Papers" error={errors.name} />
        </Field>
        <Field label="Scope">
          <select value={scope} onChange={e => setScope(e.target.value as Scope)}
            className="w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all appearance-none cursor-pointer">
            <option value="GLOBAL">Global — all clusters</option>
            <option value="CLUSTER">Cluster-specific</option>
          </select>
        </Field>
      </div>

      {scope === "CLUSTER" && (
        <Field label="Cluster" required>
          <>
            <select value={clusterId} onChange={e => setClusterId(e.target.value)}
              className={cn(
                "w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border appearance-none cursor-pointer",
                errors.cluster ? "border-red-400/60" : "border-border focus:border-teal-400/70",
                "text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
              )}>
              <option value="" disabled>Select a cluster…</option>
              {MOCK_CLUSTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.cluster && <p className="text-[12px] text-red-500 font-medium">{errors.cluster}</p>}
          </>
        </Field>
      )}

      <Field label="Description" hint="Optional — shown below the category name.">
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="What kind of resources live here?"
          className="w-full rounded-xl px-4 py-2.5 text-[13.5px] font-medium leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all" />
      </Field>

      <Field label="Colour tag">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={cn("w-8 h-8 rounded-lg border-2 transition-all", c,
                color === c ? "border-foreground scale-110" : "border-transparent opacity-70 hover:opacity-100"
              )} />
          ))}
        </div>
      </Field>

      <div className="flex gap-3 justify-end pt-1 border-t border-border">
        <button type="button" onClick={onCancel}
          className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13px] font-bold shadow-sm shadow-teal-600/20 transition-all disabled:opacity-60">
          {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiCheckLine />}
          {initial?.id ? "Save changes" : "Create category"}
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function ResourceCategoriesPage() {
  const [categories,  setCategories]  = useState<Category[]>(MOCK_CATEGORIES);
  const [showCreate,  setShowCreate]  = useState(false);
  const [editTarget,  setEditTarget]  = useState<Category | null>(null);
  const [deleteTarget,setDeleteTarget]= useState<Category | null>(null);
  const [loading,     setLoading]     = useState(false);

  const handleCreate = async (data: Omit<Category, "id" | "resourceCount" | "createdAt">) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setCategories(cs => [...cs, { ...data, id: `cat-${Date.now()}`, resourceCount: 0, createdAt: "Just now" }]);
    setShowCreate(false); setLoading(false);
  };

  const handleEdit = async (data: Omit<Category, "id" | "resourceCount" | "createdAt">) => {
    if (!editTarget) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setCategories(cs => cs.map(c => c.id === editTarget.id ? { ...c, ...data } : c));
    setEditTarget(null); setLoading(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setCategories(cs => cs.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const globalCats  = categories.filter(c => c.scope === "GLOBAL");
  const clusterCats = categories.filter(c => c.scope === "CLUSTER");

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-red-100/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/50 text-red-600 dark:text-red-400 text-lg"><RiAlertLine /></div>
              <div>
                <h3 className="text-[14.5px] font-bold text-foreground mb-1">Delete category?</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">"{deleteTarget.name}"</strong> and its {deleteTarget.resourceCount} resource{deleteTarget.resourceCount !== 1 ? "s" : ""} will be uncategorised. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
              <button onClick={confirmDelete} className="h-9 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold shadow-sm transition-all">Delete</button>
            </div>
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
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]">
          <RiAddLine /> New category
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border border-teal-300/50 dark:border-teal-700/50 bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-teal-50/40 dark:bg-teal-950/20">
            <RiAddLine className="text-teal-600 dark:text-teal-400" />
            <span className="text-[14px] font-bold text-foreground">New Category</span>
          </div>
          <CategoryForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={loading} />
        </div>
      )}

      {/* Global categories */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiGlobalLine /></div>
          <div className="flex-1">
            <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">Global Categories</h2>
            <p className="text-[12px] text-muted-foreground">Available across all clusters</p>
          </div>
          <span className="text-[12px] font-semibold text-muted-foreground">{globalCats.length}</span>
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {globalCats.map(cat => <CategoryRow key={cat.id} cat={cat} onEdit={setEditTarget} onDelete={setDeleteTarget} />)}
          {globalCats.length === 0 && <p className="px-5 py-6 text-[13px] text-muted-foreground italic">No global categories yet.</p>}
        </div>
      </div>

      {/* Cluster-specific */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiFlaskLine /></div>
          <div className="flex-1">
            <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">Cluster-Specific Categories</h2>
            <p className="text-[12px] text-muted-foreground">Only visible within their cluster</p>
          </div>
          <span className="text-[12px] font-semibold text-muted-foreground">{clusterCats.length}</span>
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {clusterCats.map(cat => <CategoryRow key={cat.id} cat={cat} onEdit={setEditTarget} onDelete={setDeleteTarget} />)}
          {clusterCats.length === 0 && <p className="px-5 py-6 text-[13px] text-muted-foreground italic">No cluster-specific categories yet.</p>}
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-[14px] font-bold text-foreground">Edit Category</span>
              <button onClick={() => setEditTarget(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
            </div>
            <CategoryForm initial={editTarget} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryRow({ cat, onEdit, onDelete }: {
  cat: Category; onEdit: (c: Category) => void; onDelete: (c: Category) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
      <div className={cn("w-3 h-10 rounded-full flex-shrink-0", cat.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-semibold text-foreground">{cat.name}</span>
          {cat.clusterName && (
            <span className="text-[10.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/60">{cat.clusterName}</span>
          )}
        </div>
        {cat.description && <p className="text-[12px] text-muted-foreground truncate">{cat.description}</p>}
      </div>
      <span className="flex items-center gap-1 text-[12px] text-muted-foreground flex-shrink-0">
        <RiStackLine className="text-xs" /> {cat.resourceCount}
      </span>
      <div className="relative flex-shrink-0">
        <button onClick={() => setMenuOpen(o => !o)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-all">
          <RiMoreLine />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
              <button onClick={() => { onEdit(cat); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-foreground hover:bg-accent transition-colors"><RiEditLine className="text-muted-foreground" /> Edit</button>
              <button onClick={() => { onDelete(cat); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"><RiDeleteBinLine /> Delete</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}