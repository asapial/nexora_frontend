"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiSparklingFill, RiBook2Line, RiDownloadLine, RiBookmarkLine, RiBookmarkFill,
  RiFilePdfLine, RiVideoLine, RiFileTextLine, RiFileLine, RiUser3Line,
  RiEyeLine, RiCalendarLine, RiPriceTag3Line, RiDeleteBinLine,
  RiUploadCloud2Line, RiFilterLine, RiCloseLine, RiSearchLine,
  RiGlobalLine, RiGroupLine, RiEditLine, RiCheckLine, RiAddLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

type Visibility = "PUBLIC" | "CLUSTER" | "PRIVATE";
interface Cluster { id: string; name: string; _count?: { members: number } }
interface Resource {
  id: string; title: string; description: string | null; fileUrl: string; fileType: string;
  visibility: Visibility; tags: string[]; authors: string[]; year: number | null;
  viewCount: number; isFeatured: boolean; isBookmarked: boolean;
  uploaderId: string | null;
  clusterIds?: string[];
  uploader: { name: string; email: string } | null;
  category: { id: string; name: string } | null;
  cluster: { id: string; name: string } | null;
}
interface Meta { page: number; limit: number; total: number; totalPages: number; }

const VIS_CLS: Record<Visibility, string> = {
  PUBLIC:  "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  CLUSTER: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50",
  PRIVATE: "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
};

function FilePreview({ fileUrl, fileType }: { fileUrl: string; fileType: string }) {
  const isPdf = fileType.includes("pdf") || fileUrl.endsWith(".pdf");
  const isImg = fileType.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(fileUrl);
  const isVid = fileType.startsWith("video/");
  if (isPdf) return (
    <div className="relative w-full h-48 bg-gradient-to-br from-red-50 to-red-100/60 dark:from-red-950/30 dark:to-red-900/20 flex flex-col items-center justify-center gap-2 overflow-hidden">
      <div className="absolute inset-0 flex flex-col justify-center px-8 gap-2 opacity-10 pointer-events-none">
        {Array.from({length:8}).map((_,i)=><div key={i} className="h-px bg-red-600 rounded" style={{width:`${55+i*5}%`}}/>)}
      </div>
      <RiFilePdfLine className="text-5xl text-red-500/80 drop-shadow-sm relative z-10" />
      <span className="text-[10px] font-bold tracking-widest uppercase text-red-500/60 relative z-10">PDF Document</span>
    </div>
  );
  if (isImg) return <img src={fileUrl} alt="" className="w-full h-48 object-cover" />;
  if (isVid) return (
    <div className="w-full h-48 bg-gradient-to-br from-violet-50 to-violet-100/60 dark:from-violet-950/30 dark:to-violet-900/20 flex flex-col items-center justify-center gap-2">
      <RiVideoLine className="text-5xl text-violet-400/80" />
      <span className="text-[10px] font-bold tracking-widest uppercase text-violet-500/60">Video</span>
    </div>
  );
  return (
    <div className="w-full h-48 bg-gradient-to-br from-zinc-50 to-zinc-100/60 dark:from-zinc-900/30 dark:to-zinc-800/20 flex flex-col items-center justify-center gap-2">
      {fileType.includes("text") ? <RiFileTextLine className="text-5xl text-zinc-400/80"/> : <RiFileLine className="text-5xl text-zinc-400/80"/>}
      <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500/60">{fileType || "File"}</span>
    </div>
  );
}

// ── URL helpers ───────────────────────────────────────────────────────────────
// For existing files stored as /image/upload/ (Cloudinary returns 401 in browser),
// we route through our backend which uses the Cloudinary Admin API to generate a
// signed delivery URL valid for 1 hour.  New PDFs uploaded after the multer fix
// will use /raw/upload/ and can also be served this way.

function signedUrl(fileUrl: string, opts: { inline?: boolean; filename?: string } = {}): string {
  const p = new URLSearchParams({ url: fileUrl });
  if (opts.inline)    p.set("inline", "true");
  if (opts.filename)  p.set("filename", opts.filename);
  return `/api/resource/cloudinary-sign?${p.toString()}`;
}

function viewUrl(url: string): string {
  return signedUrl(url, { inline: true });
}

function downloadFile(fileUrl: string, filename: string) {
  // Build the signed download URL with the desired filename embedded.
  // The backend passes it as the Cloudinary `attachment` option so Cloudinary
  // sets Content-Disposition: attachment; filename="<title>.pdf" directly.
  const href = signedUrl(fileUrl, { filename });
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;   // belt-and-suspenders for same-origin response
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


// ── Filter Bar ────────────────────────────────────────────────────────────────
interface Filters { search: string; author: string; categoryId: string; year: string; tag: string; fileType: string; bookmarked: string; }
const EMPTY: Filters = { search:"", author:"", categoryId:"", year:"", tag:"", fileType:"", bookmarked:"" };

function FilterBar({ filters, onChange, categories, allTags, allAuthors }: {
  filters: Filters; onChange: (f: Filters) => void;
  categories: {id:string;name:string}[]; allTags: string[]; allAuthors: string[];
}) {
  const [open, setOpen] = useState(false);
  const active = Object.values(filters).filter(Boolean).length;
  const set = (k: keyof Filters, v: string) => onChange({...filters, [k]: v});
  const FIELD = "w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-[12.5px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500/40 transition-colors";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm"/>
          <input value={filters.search} onChange={e=>set("search",e.target.value)} placeholder="Search title, description, or author…" className="w-full rounded-xl border border-border bg-muted/30 pl-9 pr-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-400/60 transition-colors"/>
        </div>
        <button onClick={()=>setOpen(o=>!o)} className={cn("flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[12.5px] font-semibold transition-colors", open || active ? "border-violet-400/60 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400":"border-border text-muted-foreground hover:bg-muted/40")}>
          <RiFilterLine/> Filters {active>0 && <span className="ml-0.5 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">{active}</span>}
        </button>
        <button onClick={()=>set("bookmarked", filters.bookmarked === "true" ? "" : "true")} className={cn("flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[12.5px] font-semibold transition-colors", filters.bookmarked === "true" ? "border-amber-400/60 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" : "border-border text-muted-foreground hover:bg-muted/40")}>
          {filters.bookmarked === "true" ? <RiBookmarkFill className="text-[14px]" /> : <RiBookmarkLine className="text-[14px]" />} Bookmarked
        </button>
        {active>0 && <button onClick={()=>onChange(EMPTY)} className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-red-200/70 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[12px] font-semibold hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"><RiCloseLine/> Clear</button>}
      </div>
      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-4 rounded-2xl border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/40 dark:bg-violet-950/10">
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Author</label>
            <select value={filters.author} onChange={e=>set("author",e.target.value)} className={FIELD}>
              <option value="">Any author</option>
              {allAuthors.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Category</label>
            <select value={filters.categoryId} onChange={e=>set("categoryId",e.target.value)} className={FIELD}>
              <option value="">Any category</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Topic / Tag</label>
            <select value={filters.tag} onChange={e=>set("tag",e.target.value)} className={FIELD}>
              <option value="">Any topic</option>
              {allTags.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Year</label>
            <input type="number" value={filters.year} onChange={e=>set("year",e.target.value)} placeholder="e.g. 2024" min={1900} max={new Date().getFullYear()} className={FIELD}/>
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">File Type</label>
            <select value={filters.fileType} onChange={e=>set("fileType",e.target.value)} className={FIELD}>
              <option value="">Any type</option>
              {["pdf","video","image","text","link","other"].map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────────────
const EF = "w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-400/60 transition-colors";

function EditModal({ resource, categories, clusters, onClose, onSaved }: {
  resource: Resource; categories: {id:string;name:string}[]; clusters: Cluster[];
  onClose: ()=>void; onSaved: (u: Resource)=>void;
}) {
  const [title,setTitle]             = useState(resource.title);
  const [description,setDescription] = useState(resource.description??"");
  const [categoryId,setCategoryId]   = useState(resource.category?.id??"");
  const [visibility,setVisibility]   = useState<Visibility>(resource.visibility);
  const [clusterIds,setClusterIds]   = useState<string[]>(resource.clusterIds??(resource.cluster?[resource.cluster.id]:[]));
  const [authors,setAuthors]         = useState<string[]>(resource.authors);
  const [tags,setTags]               = useState<string[]>(resource.tags);
  const [authorInput,setAuthorInput] = useState("");
  const [tagInput,setTagInput]       = useState("");
  const [saving,setSaving]           = useState(false);
  const [err,setErr]                 = useState<string|null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[onClose]);

  const toggleCluster=(id:string)=>setClusterIds(p=>p.includes(id)?p.filter(c=>c!==id):[...p,id]);
  const addAuthor=()=>{ const v=authorInput.trim(); if(v&&!authors.includes(v)) setAuthors(p=>[...p,v]); setAuthorInput(""); };
  const addTag=()=>{ const v=tagInput.trim().toLowerCase(); if(v&&!tags.includes(v)) setTags(p=>[...p,v]); setTagInput(""); };

  const handleSave=async()=>{
    if(!title.trim()){setErr("Title is required.");return;}
    if(visibility==="CLUSTER"&&clusterIds.length===0){setErr("Select at least one cluster.");return;}
    setSaving(true);setErr(null);
    try{
      const res=await fetch(`/api/resource/${resource.id}`,{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,description,categoryId:categoryId||null,visibility,clusterIds,authors,tags})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.message||"Update failed");
      onSaved(data.data as Resource);
    }catch(e:unknown){setErr(e instanceof Error?e.message:"Failed to save");}
    finally{setSaving(false);}
  };

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div ref={ref} className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiEditLine/></div>
          <h2 className="text-[14px] font-bold text-foreground flex-1">Edit Resource</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><RiCloseLine className="text-lg"/></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div><label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Title *</label><input value={title} onChange={e=>setTitle(e.target.value)} className={EF} placeholder="Resource title"/></div>
          <div><label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Category</label><select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className={cn(EF,"cursor-pointer")}><option value="">No category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Abstract / Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} placeholder="Brief description…" className={cn(EF,"resize-vertical")}/></div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Authors</label>
            <div className="flex flex-wrap gap-1.5 mb-2">{authors.map(a=>(<span key={a} className="flex items-center gap-1 text-[11.5px] px-2.5 py-1 rounded-full bg-violet-100/70 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/40 text-violet-700 dark:text-violet-400">{a}<button type="button" onClick={()=>setAuthors(p=>p.filter(x=>x!==a))} className="hover:text-red-500"><RiCloseLine className="text-xs"/></button></span>))}</div>
            <div className="flex gap-2"><input value={authorInput} onChange={e=>setAuthorInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addAuthor();}}} placeholder="Author name, press Enter…" className={EF}/><button type="button" onClick={addAuthor} className="px-3 rounded-xl border border-border text-muted-foreground hover:bg-muted/40"><RiAddLine/></button></div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">{tags.map(t=>(<span key={t} className="flex items-center gap-1 text-[11.5px] px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">{t}<button type="button" onClick={()=>setTags(p=>p.filter(x=>x!==t))} className="hover:text-red-500"><RiCloseLine className="text-xs"/></button></span>))}</div>
            <div className="flex gap-2"><input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();addTag();}}} placeholder="Add tag, press Enter…" className={EF}/><button type="button" onClick={addTag} className="px-3 rounded-xl border border-border text-muted-foreground hover:bg-muted/40"><RiAddLine/></button></div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Visibility</label>
            <div className="grid grid-cols-3 gap-2">{(["PUBLIC","CLUSTER","PRIVATE"] as Visibility[]).map(v=>(<button key={v} type="button" onClick={()=>{setVisibility(v);if(v!=="CLUSTER")setClusterIds([]);}} className={cn("py-2.5 px-3 rounded-xl border-2 text-[12.5px] font-bold transition-all",visibility===v?v==="PUBLIC"?"border-teal-400/70 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400":v==="CLUSTER"?"border-amber-400/70 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400":"border-zinc-400/70 bg-zinc-50 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300":"border-border text-muted-foreground hover:bg-muted/30")}>{v}</button>))}</div>
            {visibility==="CLUSTER"&&clusters.length>0&&(
              <div className="mt-2.5 rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/10 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Select clusters <span className="font-normal normal-case text-muted-foreground">(multiple allowed)</span></p>
                <div className="flex flex-col gap-1.5">{clusters.map(c=>{const isSel=clusterIds.includes(c.id);return(<button key={c.id} type="button" onClick={()=>toggleCluster(c.id)} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left",isSel?"border-amber-400/70 bg-amber-50 dark:bg-amber-950/30":"border-border bg-card hover:border-amber-300/60")}><span className={cn("w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center",isSel?"border-amber-500 bg-amber-500":"border-border")}>{isSel&&<RiCheckLine className="text-[9px] text-white"/>}</span><span className="text-[12.5px] font-semibold text-foreground flex-1">{c.name}</span>{c._count&&<span className="text-[11px] text-muted-foreground">{c._count.members} members</span>}</button>);})}</div>
                {clusterIds.length>0&&<p className="mt-2 text-[11.5px] text-amber-600 dark:text-amber-400 font-medium">{clusterIds.length} cluster{clusterIds.length>1?"s":""} selected</p>}
              </div>
            )}
          </div>
          {err&&<p className="text-[12.5px] text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-800/50 px-3 py-2 rounded-xl">{err}</p>}
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/10 flex-shrink-0">
          <button onClick={onClose} className="h-9 px-5 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving?<span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<RiCheckLine/>}
            {saving?"Saving…":"Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentAllResourcesPage() {
  const [resources, setResources]   = useState<Resource[]>([]);
  const [meta, setMeta]             = useState<Meta>({page:1,limit:12,total:0,totalPages:1});
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState<Filters>(EMPTY);
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(12);
  const [categories, setCategories] = useState<{id:string;name:string}[]>([]);
  const [clusters, setClusters]     = useState<Cluster[]>([]);
  const [myUserId, setMyUserId]     = useState<string|null>(null);
  const [downloading, setDownloading] = useState<string|null>(null);
  const [deleting, setDeleting]     = useState<string|null>(null);
  const [editResource, setEditResource] = useState<Resource|null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const allAuthors = [...new Set(resources.flatMap(r=>r.authors))].sort();
  const allTags    = [...new Set(resources.flatMap(r=>r.tags))].sort();

  useEffect(()=>{
    fetch("/api/resource/categories",{credentials:"include"}).then(r=>r.json()).then(d=>{ if(d.success) setCategories(d.data??[]); });
    fetch("/api/teacher/announcements/clusters",{credentials:"include"}).then(r=>r.json()).then(d=>{ if(d.success) setClusters(d.data??[]); });
    fetch("/api/settings/account",{credentials:"include"}).then(r=>r.json()).then(d=>{ if(d.success&&d.data?.id) setMyUserId(d.data.id); });
  },[]);

  const fetchResources = useCallback(()=>{
    setLoading(true);
    const p = new URLSearchParams({page:String(page), limit:String(limit)});
    if (filters.search)     p.set("search", filters.search);
    if (filters.author)     p.set("author", filters.author);
    if (filters.categoryId) p.set("categoryId", filters.categoryId);
    if (filters.year)       p.set("year", filters.year);
    if (filters.tag)        p.set("tags", filters.tag);
    if (filters.fileType)   p.set("fileType", filters.fileType);
    if (filters.bookmarked) p.set("bookmarked", filters.bookmarked);
    // Use /browse — enforces PUBLIC + CLUSTER-member visibility gate on the backend
    fetch(`/api/resource/browse?${p}`,{credentials:"include"})
      .then(r=>r.json()).then(d=>{ if(d.success){ setResources(d.data??[]); if(d.meta) setMeta(d.meta); }})
      .finally(()=>setLoading(false));
  },[filters, page, limit]);

  useEffect(()=>{ fetchResources(); },[fetchResources]);

  const handleBookmark = async(id:string,bm:boolean)=>{
    try {
      await fetch(`/api/resource/${id}/bookmark`,{method:bm?"DELETE":"POST",credentials:"include"});
      setResources(prev=>prev.map(r=>r.id===id?{...r,isBookmarked:!bm}:r));
    } catch { toast.error("Failed to update bookmark."); }
  };
  const handleDelete = async(id:string)=>{
    if(!confirm("Delete this resource? This cannot be undone.")) return;
    setDeleting(id);
    try{
      const res=await fetch(`/api/resource/${id}`,{method:"DELETE",credentials:"include"});
      const data=await res.json();
      if(!res.ok) throw new Error(data.message||"Delete failed");
      setResources(prev=>prev.filter(r=>r.id!==id));
      toast.success("Resource deleted.");
    }catch(e:unknown){toast.error(e instanceof Error?e.message:"Failed to delete.");}
    finally{setDeleting(null);}
  };
  const handleDownload = (r: Resource) => {
    const safe = r.title.replace(/[^a-z0-9\-_ ]/gi, "").trim().replace(/\s+/g, "_").slice(0, 80) || "document";
    downloadFile(r.fileUrl, `${safe}_nexoraResources.pdf`);
  };
  const handleTagClick = (tag:string)=>{
    setFilters(f=>({...f, tag: f.tag===tag?"":tag}));
    setPage(1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const buildPages = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };
  const pageList   = buildPages(page, meta.totalPages);
  const firstItem  = meta.total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem   = Math.min(page * limit, meta.total);

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto">
      {/* Edit Modal */}
      {editResource&&(
        <EditModal resource={editResource} categories={categories} clusters={clusters}
          onClose={()=>setEditResource(null)}
          onSaved={updated=>{
            setResources(prev=>prev.map(r=>r.id===updated.id?{...r,...updated}:r));
            setEditResource(null); toast.success("Resource updated!");
          }}/>
      )}
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse"/>
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Library</span>
          </div>
          <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">Resource Library</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Browse public resources and cluster-shared content</p>
        </div>
        <Link href="/dashboard/student/resources/upload" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-[12.5px] font-bold hover:bg-teal-700 transition-colors shadow-sm shadow-teal-500/20">
          <RiUploadCloud2Line/> Upload Resource
        </Link>
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={f=>{setFilters(f);setPage(1);}} categories={categories} allTags={allTags} allAuthors={allAuthors}/>

      {/* Info strip + per-page */}
      {!loading && (
        <div className="flex items-center justify-between flex-wrap gap-3 -mt-2">
          <p className="text-[12.5px] text-muted-foreground">
            {meta.total === 0
              ? "No resources found"
              : <>Showing <strong className="text-foreground">{firstItem}–{lastItem}</strong> of <strong className="text-foreground">{meta.total}</strong> resource{meta.total !== 1 ? "s" : ""}</>}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-muted-foreground">Per page:</span>
            {[6, 12, 24].map(n => (
              <button key={n} type="button" onClick={() => { setLimit(n); setPage(1); }}
                className={cn("h-7 px-3 rounded-lg border text-[11.5px] font-semibold transition-colors",
                  limit === n ? "border-teal-400/70 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400" : "border-border text-muted-foreground hover:bg-muted/40")}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({length: limit}).map((_,i)=>(
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="h-48 bg-muted/60"/><div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4"/><div className="h-3 bg-muted rounded w-full"/><div className="h-3 bg-muted rounded w-1/2"/></div>
            </div>
          ))}
        </div>
      ) : resources.length===0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4"><RiBook2Line className="text-2xl text-muted-foreground/40"/></div>
          <p className="text-[14px] font-semibold text-foreground mb-1">No resources found</p>
          <p className="text-[12.5px] text-muted-foreground mb-4">No public or cluster-shared resources found yet.</p>
          <Link href="/dashboard/teacher/resource/upload" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-[12.5px] font-bold hover:bg-teal-700 transition-colors"><RiUploadCloud2Line className="text-sm"/> Upload resource</Link>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {resources.map(r=>(
            <div key={r.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-black/30 hover:border-border/80 transition-all duration-200 flex flex-col">
              {/* Thumbnail */}
              <div className="relative overflow-hidden">
                <FilePreview fileUrl={r.fileUrl} fileType={r.fileType}/>
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className={cn("text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border backdrop-blur-sm flex items-center gap-0.5", VIS_CLS[r.visibility])}>
                    {r.visibility === "PUBLIC" && <RiGlobalLine className="text-[8px]"/>}
                    {r.visibility === "CLUSTER" && <RiGroupLine className="text-[8px]"/>}
                    {r.visibility}
                  </span>
                </div>
                {r.isFeatured && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-amber-400/90 text-amber-900 border-amber-300 backdrop-blur-sm flex items-center gap-0.5">
                      <RiSparklingFill className="text-[8px]"/> Featured
                    </span>
                  </div>
                )}
                {r.viewCount>0 && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <RiEyeLine className="text-[10px]"/>{r.viewCount}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="px-4 pt-4 pb-3 flex-1 flex flex-col gap-3">
                {/* Title */}
                <div>
                  <h3 className="text-[13.5px] font-bold text-foreground leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {r.title}
                  </h3>
                  {r.uploader?.name && (
                    <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground/70 font-medium mt-0.5">
                      <RiUser3Line className="text-[10px]"/> {r.uploader.name}
                    </span>
                  )}
                  {r.category && <span className="text-[10.5px] text-muted-foreground/70 font-medium mt-0.5 block">{r.category.name}{r.cluster && ` · ${r.cluster.name}`}</span>}
                </div>

                {/* Full description */}
                {r.description && (
                  <p className="text-[12px] text-muted-foreground leading-relaxed text-justify">
                    {r.description}
                  </p>
                )}

                {/* Authors + Year */}
                {(r.authors.length>0||r.year) && (
                  <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground flex-wrap">
                    {r.authors.length>0 && (
                      <span className="flex items-start gap-1 min-w-0">
                        <RiUser3Line className="text-xs flex-shrink-0"/>
                        <span className="">{r.authors.join(", ")}</span>
                      </span>
                    )}
                    {r.year && <span className="flex items-center gap-1 flex-shrink-0"><RiCalendarLine className="text-xs"/>{r.year}</span>}
                  </div>
                )}

                {/* Actionable Tags */}
                {r.tags.length>0 && (
                  <div className="flex flex-wrap gap-1">
                    <RiPriceTag3Line className="text-[11px] text-muted-foreground/50 mt-0.5 flex-shrink-0"/>
                    {r.tags.map(tag=>(
                      <button
                        key={tag}
                        type="button"
                        onClick={()=>handleTagClick(tag)}
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-md border leading-none transition-all",
                          filters.tag===tag
                            ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700/60 text-violet-700 dark:text-violet-300"
                            : "bg-muted border-border text-muted-foreground hover:border-violet-300 dark:hover:border-violet-700/50 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                        )}
                        title={`Filter by: ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1"/>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-muted/60 border border-border px-1.5 py-0.5 rounded-md">
                    {r.fileType.split("/").pop()||r.fileType}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={()=>handleBookmark(r.id,r.isBookmarked)} className={cn("p-1.5 rounded-lg transition-colors",r.isBookmarked?"text-amber-500 hover:text-amber-400":"text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20")} title={r.isBookmarked?"Remove bookmark":"Bookmark"}>
                      {r.isBookmarked?<RiBookmarkFill className="text-[15px]"/>:<RiBookmarkLine className="text-[15px]"/>}
                    </button>
                    {/* Own resource actions */}
                    {myUserId && r.uploaderId === myUserId && (
                      <>
                        <button onClick={()=>setEditResource(r)}
                          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-colors" title="Edit">
                          <RiEditLine className="text-[15px]"/>
                        </button>
                        <button onClick={()=>handleDelete(r.id)} disabled={deleting===r.id}
                          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50" title="Delete">
                          <RiDeleteBinLine className="text-[15px]"/>
                        </button>
                      </>
                    )}
                    <button onClick={()=>handleDownload(r)} disabled={downloading===r.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold hover:bg-teal-700 transition-colors disabled:opacity-50" title="Download">
                      <RiDownloadLine className={cn("text-[12px]",downloading===r.id&&"animate-bounce")}/>
                      {downloading===r.id?"…":"Download"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-[12px] text-muted-foreground">
            Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{meta.totalPages}</strong>
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button onClick={() => goToPage(1)} disabled={page <= 1}
              className="h-8 w-8 rounded-lg border border-border text-[11px] font-bold text-muted-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors flex items-center justify-center" title="First page">«</button>
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="h-8 px-3 rounded-lg border border-border text-[12px] font-semibold text-muted-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors">
              ‹ Prev
            </button>
            {pageList.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="h-8 w-8 flex items-center justify-center text-[12px] text-muted-foreground">…</span>
              ) : (
                <button key={p} onClick={() => goToPage(p as number)}
                  className={cn("h-8 w-8 rounded-lg border text-[12.5px] font-bold transition-all",
                    page === p ? "border-teal-400/70 bg-teal-600 text-white shadow-sm" : "border-border text-muted-foreground hover:bg-muted/40")}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => goToPage(page + 1)} disabled={page >= meta.totalPages}
              className="h-8 px-3 rounded-lg border border-border text-[12px] font-semibold text-muted-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors">
              Next ›
            </button>
            <button onClick={() => goToPage(meta.totalPages)} disabled={page >= meta.totalPages}
              className="h-8 w-8 rounded-lg border border-border text-[11px] font-bold text-muted-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors flex items-center justify-center" title="Last page">»</button>
          </div>
        </div>
      )}
    </div>
  );
}
