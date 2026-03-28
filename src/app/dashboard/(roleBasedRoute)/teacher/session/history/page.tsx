"use client";

import { useState, useMemo } from "react";
import {
  RiCalendarCheckLine, RiDownloadLine, RiFilterLine, RiFlaskLine,
  RiGroupLine, RiCheckboxCircleLine, RiTimeLine, RiSparklingFill,
  RiSearchLine, RiArrowRightLine, RiFileTextLine, RiMapPinLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface Session {
  id:              string;
  title:           string;
  clusterId:       string;
  clusterName:     string;
  date:            string;
  time:            string;
  location?:       string;
  memberCount:     number;
  attendanceCount: number;
  taskCount:       number;
  submittedCount:  number;
  duration:        number;
}

// ─── Mock data ────────────────────────────────────────────
const MOCK_CLUSTERS = [
  { id:"all", name:"All clusters" },
  { id:"c1",  name:"ML Research Group — 2025" },
  { id:"c2",  name:"NLP Reading Circle" },
  { id:"c3",  name:"Bootcamp Cohort B" },
];

const MOCK_SESSIONS: Session[] = [
  { id:"s1",  title:"Session 12 — Attention Mechanisms",      clusterId:"c1", clusterName:"ML Research Group — 2025", date:"2025-03-18", time:"2:00 PM", location:"Room 204",  memberCount:18, attendanceCount:16, taskCount:18, submittedCount:15, duration:90 },
  { id:"s2",  title:"Session 11 — Transformer Architecture",  clusterId:"c1", clusterName:"ML Research Group — 2025", date:"2025-03-11", time:"2:00 PM", location:"Room 204",  memberCount:18, attendanceCount:18, taskCount:18, submittedCount:18, duration:90 },
  { id:"s3",  title:"NLP Week 7 — BERT Finetuning",           clusterId:"c2", clusterName:"NLP Reading Circle",        date:"2025-03-15", time:"4:00 PM", location:"Zoom",      memberCount:11, attendanceCount:9,  taskCount:11, submittedCount:8,  duration:60 },
  { id:"s4",  title:"Sprint 8 — REST API Project",            clusterId:"c3", clusterName:"Bootcamp Cohort B",          date:"2025-03-14", time:"10:00 AM",location:"Lab A",     memberCount:42, attendanceCount:38, taskCount:42, submittedCount:40, duration:120 },
  { id:"s5",  title:"Session 10 — Positional Encoding",       clusterId:"c1", clusterName:"ML Research Group — 2025", date:"2025-03-04", time:"2:00 PM", location:"Room 204",  memberCount:18, attendanceCount:15, taskCount:18, submittedCount:12, duration:90 },
  { id:"s6",  title:"NLP Week 6 — Word2Vec & GloVe",          clusterId:"c2", clusterName:"NLP Reading Circle",        date:"2025-03-08", time:"4:00 PM", location:"Zoom",      memberCount:11, attendanceCount:11, taskCount:11, submittedCount:11, duration:60 },
  { id:"s7",  title:"Sprint 7 — Database Design",             clusterId:"c3", clusterName:"Bootcamp Cohort B",          date:"2025-03-07", time:"10:00 AM",location:"Lab A",     memberCount:42, attendanceCount:35, taskCount:42, submittedCount:36, duration:120 },
  { id:"s8",  title:"Sprint 6 — Authentication",              clusterId:"c3", clusterName:"Bootcamp Cohort B",          date:"2025-02-28", time:"10:00 AM",location:"Lab A",     memberCount:42, attendanceCount:40, taskCount:42, submittedCount:39, duration:120 },
];

// ─── Helpers ──────────────────────────────────────────────
const pct = (a:number, b:number) => b===0 ? 0 : Math.round((a/b)*100);
const barColor = (p:number) => p>=80?"bg-teal-500":p>=60?"bg-amber-400":"bg-red-400";
const fmtDate = (d:string) => {
  try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); }
  catch { return d; }
};

function MiniBar({ value, max, color }: { value:number; max:number; color:string }) {
  const p = max===0?0:Math.round((value/max)*100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500",color)} style={{width:`${p}%`}}/>
      </div>
      <span className="text-[12px] font-bold tabular-nums text-foreground/60 w-8 text-right flex-shrink-0">{p}%</span>
    </div>
  );
}

// ─── Export CSV ───────────────────────────────────────────
function exportCSV(sessions: Session[]) {
  const header = ["Title","Cluster","Date","Time","Duration (min)","Members","Attendance","Attendance %","Tasks","Submitted","Submission %"];
  const rows = sessions.map(s => [
    `"${s.title}"`,s.clusterName,s.date,s.time,s.duration,
    s.memberCount,s.attendanceCount,pct(s.attendanceCount,s.memberCount),
    s.taskCount,s.submittedCount,pct(s.submittedCount,s.taskCount),
  ].join(","));
  const csv = [header.join(","),...rows].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = `nexora-sessions-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// ─── Page ─────────────────────────────────────────────────
export default function SessionHistoryPage() {
  const [clusterId, setClusterId] = useState("all");
  const [search,    setSearch]    = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");

  const filtered = useMemo(()=>{
    let s = MOCK_SESSIONS;
    if (clusterId!=="all")  s = s.filter(x=>x.clusterId===clusterId);
    if (search.trim())      s = s.filter(x=>x.title.toLowerCase().includes(search.toLowerCase())||x.clusterName.toLowerCase().includes(search.toLowerCase()));
    if (dateFrom)           s = s.filter(x=>x.date>=dateFrom);
    if (dateTo)             s = s.filter(x=>x.date<=dateTo);
    return s.sort((a,b)=>b.date.localeCompare(a.date));
  },[clusterId,search,dateFrom,dateTo]);

  // Aggregate stats
  const totalAtt  = filtered.reduce((s,x)=>s+pct(x.attendanceCount,x.memberCount),0);
  const totalSub  = filtered.reduce((s,x)=>s+pct(x.submittedCount,x.taskCount),0);
  const avgAtt    = filtered.length?Math.round(totalAtt/filtered.length):0;
  const avgSub    = filtered.length?Math.round(totalSub/filtered.length):0;

  const accentMap: Record<string, { i: string; b: string; br: string }> = {
  teal:   { i:"text-teal-600 dark:text-teal-400",   b:"bg-teal-100/70 dark:bg-teal-950/50",   br:"border-teal-200/70 dark:border-teal-800/50" },
  violet: { i:"text-violet-600 dark:text-violet-400", b:"bg-violet-100/70 dark:bg-violet-950/50", br:"border-violet-200/70 dark:border-violet-800/50" },
  amber:  { i:"text-amber-600 dark:text-amber-400",  b:"bg-amber-100/70 dark:bg-amber-950/50",  br:"border-amber-200/70 dark:border-amber-800/50" },
  sky:    { i:"text-sky-600 dark:text-sky-400",      b:"bg-sky-100/70 dark:bg-sky-950/50",      br:"border-sky-200/70 dark:border-sky-800/50" },
};

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse"/>
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Sessions</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Session History & Export</h1>
        </div>
        <button onClick={()=>exportCSV(filtered)} disabled={filtered.length===0}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 text-[13.5px] font-semibold text-foreground/80 hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <RiDownloadLine/> Export CSV {filtered.length>0&&`(${filtered.length})`}
        </button>
      </div>

      {/* Aggregate summary cards */}
      {filtered.length>0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
{[
  { label:"Sessions",         value:filtered.length,  icon:<RiCalendarCheckLine/>, accent:"teal" },
  { label:"Avg attendance",   value:`${avgAtt}%`,     icon:<RiGroupLine/>,          accent:"violet" },
  { label:"Avg submission",   value:`${avgSub}%`,     icon:<RiCheckboxCircleLine/>, accent:"amber" },
  { label:"Total member-hrs", value:filtered.reduce((s,x)=>s+Math.round((x.attendanceCount*x.duration)/60),0), icon:<RiTimeLine/>, accent:"sky" },
].map(card => {
  const a = accentMap[card.accent] ?? accentMap["teal"];
  return (
    <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base border mb-3", a.b, a.br, a.i)}>{card.icon}</div>
      <p className="text-[1.4rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{card.value}</p>
      <p className="text-[12px] font-medium text-muted-foreground">{card.label}</p>
    </div>
  );
})}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <RiFilterLine className="text-muted-foreground/60"/>
          <span className="text-[13px] font-bold text-foreground">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sessions…"
              className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
          </div>
          {/* Cluster */}
          <select value={clusterId} onChange={e=>setClusterId(e.target.value)}
            className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all">
            {MOCK_CLUSTERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {/* Date from */}
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
          {/* Date to */}
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
        </div>
        {(search||clusterId!=="all"||dateFrom||dateTo) && (
          <button onClick={()=>{setSearch("");setClusterId("all");setDateFrom("");setDateTo("");}}
            className="mt-3 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
            Clear filters
          </button>
        )}
      </div>

      {/* Session table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[14px] font-bold text-foreground">{filtered.length} session{filtered.length!==1?"s":""}</h2>
        </div>

        {filtered.length===0 ? (
          <div className="px-5 py-12 text-center">
            <RiCalendarCheckLine className="text-3xl text-muted-foreground/25 mx-auto mb-2"/>
            <p className="text-[13.5px] text-muted-foreground">No sessions match your filters</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {filtered.map(s=>{
              const attPct = pct(s.attendanceCount,s.memberCount);
              const subPct = pct(s.submittedCount,s.taskCount);
              return (
                <div key={s.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-base mt-0.5">
                      <RiCalendarCheckLine/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-foreground mb-0.5 truncate">{s.title}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400"/>{s.clusterName}</span>
                        <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiCalendarCheckLine className="text-xs"/>{fmtDate(s.date)} · {s.time}</span>
                        {s.location && <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiMapPinLine className="text-xs"/>{s.location}</span>}
                        <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiTimeLine className="text-xs"/>{s.duration} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 ml-12">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-muted-foreground flex items-center gap-1"><RiGroupLine className="text-xs"/>Attendance</span>
                        <span className="text-[12px] font-bold text-foreground tabular-nums">{s.attendanceCount}/{s.memberCount}</span>
                      </div>
                      <MiniBar value={s.attendanceCount} max={s.memberCount} color={barColor(attPct)}/>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-muted-foreground flex items-center gap-1"><RiFileTextLine className="text-xs"/>Submissions</span>
                        <span className="text-[12px] font-bold text-foreground tabular-nums">{s.submittedCount}/{s.taskCount}</span>
                      </div>
                      <MiniBar value={s.submittedCount} max={s.taskCount} color={barColor(subPct)}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}