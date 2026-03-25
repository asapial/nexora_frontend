"use client";

import { useState, useMemo } from "react";
import {
  RiFileTextLine, RiCheckLine, RiCloseLine, RiTimeLine,
  RiEditLine, RiDeleteBinLine, RiSparklingFill, RiFlaskLine,
  RiCalendarCheckLine, RiGroupLine, RiAlertLine, RiSendPlaneLine,
  RiSearchLine, RiFilterLine, RiMoreLine, RiArrowRightLine,
  RiRefreshLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
type HWStatus    = "PENDING" | "SUBMITTED" | "LATE" | "REVOKED";
type SortKey     = "deadline" | "cluster" | "completion" | "created";

interface Homework {
  id:              string;
  title:           string;
  sessionTitle:    string;
  clusterId:       string;
  clusterName:     string;
  deadline?:       string;
  createdAt:       string;
  totalMembers:    number;
  submittedCount:  number;
  lateCount:       number;
  status:          HWStatus;
  description:     string;
}

// ─── Mock data ────────────────────────────────────────────
const MOCK_CLUSTERS = [
  { id:"all", name:"All clusters"             },
  { id:"c1",  name:"ML Research Group — 2025" },
  { id:"c2",  name:"NLP Reading Circle"        },
  { id:"c3",  name:"Bootcamp Cohort B"          },
];

const MOCK_HW: Homework[] = [
  { id:"hw1", title:"Attention Mechanism Summary",         sessionTitle:"Session 12", clusterId:"c1", clusterName:"ML Research Group — 2025", deadline:"2025-03-25", createdAt:"2025-03-18", totalMembers:18, submittedCount:15, lateCount:1, status:"PENDING",   description:"Write a 500-word summary of the attention mechanism paper discussed in today's session." },
  { id:"hw2", title:"Transformer Architecture Deep-Dive",  sessionTitle:"Session 11", clusterId:"c1", clusterName:"ML Research Group — 2025", deadline:"2025-03-18", createdAt:"2025-03-11", totalMembers:18, submittedCount:18, lateCount:2, status:"SUBMITTED",  description:"Implement a simplified self-attention layer in Python/PyTorch." },
  { id:"hw3", title:"BERT Finetuning Lab",                 sessionTitle:"NLP Week 7", clusterId:"c2", clusterName:"NLP Reading Circle",        deadline:"2025-03-22", createdAt:"2025-03-15", totalMembers:11, submittedCount:8,  lateCount:0, status:"PENDING",   description:"Finetune a pre-trained BERT model on the provided sentiment analysis dataset." },
  { id:"hw4", title:"REST API Project — Sprint 8",         sessionTitle:"Sprint 8",   clusterId:"c3", clusterName:"Bootcamp Cohort B",          deadline:"2025-03-21", createdAt:"2025-03-14", totalMembers:42, submittedCount:40, lateCount:3, status:"SUBMITTED",  description:"Build a full REST API with authentication using Express + Prisma." },
  { id:"hw5", title:"Positional Encoding Write-up",        sessionTitle:"Session 10", clusterId:"c1", clusterName:"ML Research Group — 2025", deadline:"2025-03-11", createdAt:"2025-03-04", totalMembers:18, submittedCount:12, lateCount:4, status:"LATE",       description:"Explain positional encoding and why it is needed in transformer models." },
  { id:"hw6", title:"Word2Vec vs GloVe Analysis",          sessionTitle:"NLP Week 6", clusterId:"c2", clusterName:"NLP Reading Circle",        deadline:"2025-03-12", createdAt:"2025-03-08", totalMembers:11, submittedCount:11, lateCount:0, status:"SUBMITTED",  description:"Compare Word2Vec and GloVe embeddings on the provided analogy benchmark." },
  { id:"hw7", title:"Database Schema Design",              sessionTitle:"Sprint 7",   clusterId:"c3", clusterName:"Bootcamp Cohort B",          deadline:"2025-03-10", createdAt:"2025-03-07", totalMembers:42, submittedCount:36, lateCount:5, status:"LATE",       description:"Design and document the schema for the capstone project database." },
];

// ─── Helpers ──────────────────────────────────────────────
const pct      = (a:number,b:number) => b===0?0:Math.round((a/b)*100);
const barColor = (p:number) => p>=80?"bg-teal-500":p>=60?"bg-amber-400":"bg-red-400";
const fmtDate  = (d?:string) => { if(!d) return "No deadline"; try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return d; } };
const isPast   = (d?:string) => d ? new Date(d)<new Date() : false;

const HW_STATUS: Record<HWStatus,{label:string;cls:string}> = {
  PENDING:   { label:"Open",     cls:"bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50"          },
  SUBMITTED: { label:"Closed",   cls:"bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50"    },
  LATE:      { label:"Late",     cls:"bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50" },
  REVOKED:   { label:"Revoked",  cls:"bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"            },
};

// ─── Edit modal ───────────────────────────────────────────
function EditModal({ hw, onSave, onClose }: { hw:Homework; onSave:(patch:Partial<Homework>)=>void; onClose:()=>void }) {
  const [title,    setTitle]    = useState(hw.title);
  const [desc,     setDesc]     = useState(hw.description);
  const [deadline, setDeadline] = useState(hw.deadline??"");
  const [notifyMembers, setNotify] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="text-[14.5px] font-bold text-foreground">Edit Homework</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"><RiCloseLine/></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)}
              className="w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4}
              className="w-full rounded-xl px-4 py-3 text-[13.5px] leading-relaxed resize-none bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Deadline</label>
            <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}
              className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
          </div>
          <label className={cn("flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-all",
            notifyMembers?"border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20":"border-border bg-muted/30 hover:bg-muted/50")}>
            <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
              notifyMembers?"border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-500":"border-border bg-background")}>
              {notifyMembers&&<RiCheckLine className="text-white text-xs"/>}
            </div>
            <input type="checkbox" className="sr-only" checked={notifyMembers} onChange={e=>setNotify(e.target.checked)}/>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Notify members of changes</p>
              <p className="text-[11.5px] text-muted-foreground">Send an in-app + email notification</p>
            </div>
          </label>
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-border">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">Cancel</button>
          <button onClick={()=>{ onSave({title,description:desc,deadline:deadline||undefined}); onClose(); }}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13px] font-bold shadow-sm shadow-teal-600/20 transition-all">
            <RiCheckLine/> Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Homework card ────────────────────────────────────────
function HomeworkCard({ hw, onEdit, onRevoke, onResend }: {
  hw:Homework; onEdit:()=>void; onRevoke:()=>void; onResend:()=>void;
}) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);
  const compPct    = pct(hw.submittedCount, hw.totalMembers);
  const pending    = hw.totalMembers - hw.submittedCount;
  const pastDeadline = isPast(hw.deadline);
  const st = HW_STATUS[hw.status];

  const handleResend = async () => {
    setResending(true);
    await new Promise(r=>setTimeout(r,700));
    setResending(false); setResent(true);
    setTimeout(()=>setResent(false),3000);
    onResend();
  };

  return (
    <div className={cn("rounded-2xl border bg-card overflow-hidden transition-all",
      hw.status==="REVOKED"?"border-border opacity-60":"border-border hover:shadow-md hover:shadow-black/[0.04] dark:hover:shadow-black/20")}>
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-base mt-0.5">
          <RiFileTextLine/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[14px] font-bold text-foreground">{hw.title}</span>
            <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",st.cls)}>{st.label}</span>
            {pastDeadline && hw.status==="PENDING" && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50">Overdue</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400"/>{hw.clusterName}</span>
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiCalendarCheckLine className="text-xs"/>{hw.sessionTitle}</span>
            <span className={cn("flex items-center gap-1 text-[12px]",pastDeadline&&hw.status==="PENDING"?"text-red-500 dark:text-red-400 font-semibold":"text-muted-foreground")}>
              <RiTimeLine className="text-xs"/>{fmtDate(hw.deadline)}
            </span>
          </div>
        </div>

        {/* Menu */}
        {hw.status!=="REVOKED" && (
          <div className="relative flex-shrink-0">
            <button onClick={()=>setMenuOpen(o=>!o)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-all"><RiMoreLine/></button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={()=>setMenuOpen(false)}/>
                <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
                  <button onClick={()=>{ onEdit(); setMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-foreground hover:bg-accent transition-colors"><RiEditLine className="text-muted-foreground"/>Edit</button>
                  <button onClick={()=>{ handleResend(); setMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-foreground hover:bg-accent transition-colors"><RiSendPlaneLine className="text-muted-foreground"/>Re-notify members</button>
                  <div className="border-t border-border"/>
                  <button onClick={()=>{ onRevoke(); setMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"><RiDeleteBinLine/>Revoke</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {hw.description && (
        <div className="px-5 py-3 border-b border-border/50">
          <p className="text-[13px] text-muted-foreground line-clamp-2">{hw.description}</p>
        </div>
      )}

      {/* Completion bar */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12.5px] font-semibold text-muted-foreground">Completion</span>
          <div className="flex items-center gap-2">
            {resent && <span className="text-[12px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1"><RiCheckLine className="text-xs"/>Notified</span>}
            <span className="text-[12.5px] font-bold text-foreground tabular-nums">{hw.submittedCount}/{hw.totalMembers}</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
          <div className={cn("h-full rounded-full transition-all duration-700",barColor(compPct))} style={{width:`${compPct}%`}}/>
        </div>
        <div className="flex gap-4 text-[12px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-teal-500 flex-shrink-0"/>{hw.submittedCount} submitted</span>
          {hw.lateCount>0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-400 flex-shrink-0"/>{hw.lateCount} late</span>}
          {pending>0 && hw.status!=="REVOKED" && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-muted-foreground/30 flex-shrink-0"/>{pending} pending</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function HomeworkManagementPage() {
  const [homeworks,   setHomeworks]   = useState<Homework[]>(MOCK_HW);
  const [editTarget,  setEditTarget]  = useState<Homework|null>(null);
  const [clusterId,   setClusterId]   = useState("all");
  const [statusFilter,setStatusFilter]= useState<HWStatus|"ALL">("ALL");
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState<SortKey>("deadline");

  const filtered = useMemo(()=>{
    let h = homeworks;
    if (clusterId!=="all")       h = h.filter(x=>x.clusterId===clusterId);
    if (statusFilter!=="ALL")    h = h.filter(x=>x.status===statusFilter);
    if (search.trim())           h = h.filter(x=>x.title.toLowerCase().includes(search.toLowerCase())||x.clusterName.toLowerCase().includes(search.toLowerCase()));
    return h.sort((a,b)=>{
      if (sortBy==="deadline")   return (a.deadline??"z").localeCompare(b.deadline??"z");
      if (sortBy==="cluster")    return a.clusterName.localeCompare(b.clusterName);
      if (sortBy==="completion") return pct(b.submittedCount,b.totalMembers)-pct(a.submittedCount,a.totalMembers);
      return b.createdAt.localeCompare(a.createdAt);
    });
  },[homeworks,clusterId,statusFilter,search,sortBy]);

  const handlePatch = (id:string, patch:Partial<Homework>) =>
    setHomeworks(hs=>hs.map(h=>h.id===id?{...h,...patch}:h));

  const handleRevoke = (id:string) =>
    setHomeworks(hs=>hs.map(h=>h.id===id?{...h,status:"REVOKED"}:h));

  // Summary stats
  const open      = homeworks.filter(h=>h.status==="PENDING").length;
  const overdue   = homeworks.filter(h=>h.status==="PENDING"&&isPast(h.deadline)).length;
  const totalPct  = homeworks.length?Math.round(homeworks.reduce((s,h)=>s+pct(h.submittedCount,h.totalMembers),0)/homeworks.length):0;

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          hw={editTarget}
          onSave={patch=>handlePatch(editTarget.id,patch)}
          onClose={()=>setEditTarget(null)}
        />
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse"/>
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Sessions</span>
        </div>
        <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Homework Management</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Open assignments", value:open,      icon:<RiFileTextLine/>, accent:"teal"   },
          { label:"Overdue",          value:overdue,    icon:<RiAlertLine/>,    accent:"amber"  },
          { label:"Avg completion",   value:`${totalPct}%`, icon:<RiCheckLine/>, accent:"violet" },
        ].map(card=>{
          const a={teal:{i:"text-teal-600 dark:text-teal-400",b:"bg-teal-100/70 dark:bg-teal-950/50",br:"border-teal-200/70 dark:border-teal-800/50"},amber:{i:"text-amber-600 dark:text-amber-400",b:"bg-amber-100/70 dark:bg-amber-950/50",br:"border-amber-200/70 dark:border-amber-800/50"},violet:{i:"text-violet-600 dark:text-violet-400",b:"bg-violet-100/70 dark:bg-violet-950/50",br:"border-violet-200/70 dark:border-violet-800/50"}}[card.accent];
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5",a.b,a.br,a.i)}>{card.icon}</div>
              <p className="text-[1.4rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{card.value}</p>
              <p className="text-[12px] font-medium text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <RiFilterLine className="text-muted-foreground/60"/>
          <span className="text-[13px] font-bold text-foreground">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
              className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
          </div>
          <select value={clusterId} onChange={e=>setClusterId(e.target.value)}
            className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
            {MOCK_CLUSTERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)}
            className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
            <option value="ALL">All statuses</option>
            <option value="PENDING">Open</option>
            <option value="SUBMITTED">Closed</option>
            <option value="LATE">Late</option>
            <option value="REVOKED">Revoked</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as SortKey)}
            className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
            <option value="deadline">Sort: Deadline</option>
            <option value="cluster">Sort: Cluster</option>
            <option value="completion">Sort: Completion</option>
            <option value="created">Sort: Created</option>
          </select>
        </div>
      </div>

      {/* Homework list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-[.1em] text-muted-foreground">{filtered.length} assignment{filtered.length!==1?"s":""}</p>
        </div>

        {filtered.length===0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <RiFileTextLine className="text-3xl text-muted-foreground/25 mx-auto mb-2"/>
            <p className="text-[13.5px] text-muted-foreground">No homework matches your filters</p>
          </div>
        ) : (
          filtered.map(hw=>(
            <HomeworkCard
              key={hw.id}
              hw={hw}
              onEdit={()=>setEditTarget(hw)}
              onRevoke={()=>handleRevoke(hw.id)}
              onResend={()=>{/* TODO: POST /api/homework/${hw.id}/notify */}}
            />
          ))
        )}
      </div>
    </div>
  );
}