"use client";

import { useState, useMemo } from "react";
import {
  RiGroupLine, RiFlaskLine, RiTrophyLine, RiSparklingFill,
  RiArrowUpLine, RiArrowDownLine, RiCheckboxCircleLine,
  RiCalendarCheckLine, RiTimeLine, RiMedalLine,
  RiBarChartBoxLine, RiSearchLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
type MemberSubtype = "EMERGING" | "ACTIVE" | "GRADUATED" | "ALUMNI";
interface Member {
  id:              string;
  name:            string;
  email:           string;
  subtype:         MemberSubtype;
  clusterId:       string;
  clusterName:     string;
  tasksTotal:      number;
  tasksSubmitted:  number;
  avgScore:        number;
  attendance:      number;
  attendanceTotal: number;
  homeworkDone:    number;
  homeworkTotal:   number;
  streak:          number;
  joinedAt:        string;
}

const MOCK_CLUSTERS = [
  { id:"all", name:"All clusters" },
  { id:"c1",  name:"ML Research Group — 2025" },
  { id:"c2",  name:"NLP Reading Circle" },
  { id:"c3",  name:"Bootcamp Cohort B" },
];

const MOCK_MEMBERS: Member[] = [
  { id:"m1", name:"Aisha Khan",      email:"aisha@ex.com",   subtype:"ACTIVE",    clusterId:"c1", clusterName:"ML Research Group — 2025", tasksTotal:12, tasksSubmitted:12, avgScore:91, attendance:11, attendanceTotal:12, homeworkDone:12, homeworkTotal:12, streak:8,  joinedAt:"Jan 2025" },
  { id:"m2", name:"Lucas Mendes",    email:"lucas@ex.com",   subtype:"ACTIVE",    clusterId:"c1", clusterName:"ML Research Group — 2025", tasksTotal:12, tasksSubmitted:10, avgScore:78, attendance:10, attendanceTotal:12, homeworkDone:9,  homeworkTotal:12, streak:4,  joinedAt:"Jan 2025" },
  { id:"m3", name:"Priya Sharma",    email:"priya@ex.com",   subtype:"ACTIVE",    clusterId:"c1", clusterName:"ML Research Group — 2025", tasksTotal:12, tasksSubmitted:11, avgScore:85, attendance:12, attendanceTotal:12, homeworkDone:11, homeworkTotal:12, streak:6,  joinedAt:"Jan 2025" },
  { id:"m4", name:"Omar Hassan",     email:"omar@ex.com",    subtype:"EMERGING",  clusterId:"c1", clusterName:"ML Research Group — 2025", tasksTotal:12, tasksSubmitted:7,  avgScore:65, attendance:8,  attendanceTotal:12, homeworkDone:6,  homeworkTotal:12, streak:1,  joinedAt:"Feb 2025" },
  { id:"m5", name:"Elena Kozlov",    email:"elena@ex.com",   subtype:"ACTIVE",    clusterId:"c2", clusterName:"NLP Reading Circle",        tasksTotal:7,  tasksSubmitted:7,  avgScore:88, attendance:7,  attendanceTotal:7,  homeworkDone:7,  homeworkTotal:7,  streak:7,  joinedAt:"Feb 2025" },
  { id:"m6", name:"James Okonkwo",   email:"james@ex.com",   subtype:"ACTIVE",    clusterId:"c2", clusterName:"NLP Reading Circle",        tasksTotal:7,  tasksSubmitted:5,  avgScore:72, attendance:6,  attendanceTotal:7,  homeworkDone:5,  homeworkTotal:7,  streak:3,  joinedAt:"Feb 2025" },
  { id:"m7", name:"Sara Nouri",      email:"sara@ex.com",    subtype:"GRADUATED", clusterId:"c3", clusterName:"Bootcamp Cohort B",          tasksTotal:18, tasksSubmitted:18, avgScore:95, attendance:18, attendanceTotal:18, homeworkDone:18, homeworkTotal:18, streak:18, joinedAt:"Jan 2025" },
  { id:"m8", name:"David Park",      email:"david@ex.com",   subtype:"ACTIVE",    clusterId:"c3", clusterName:"Bootcamp Cohort B",          tasksTotal:18, tasksSubmitted:15, avgScore:80, attendance:16, attendanceTotal:18, homeworkDone:14, homeworkTotal:18, streak:5,  joinedAt:"Jan 2025" },
];

const SUBTYPE_COLORS: Record<MemberSubtype,string> = {
  EMERGING:  "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
  ACTIVE:    "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  GRADUATED: "bg-violet-100/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50",
  ALUMNI:    "bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-700/50",
};

const pct = (a:number, b:number) => b===0?0:Math.round((a/b)*100);
const barColor = (p:number) => p>=80?"bg-teal-500":p>=60?"bg-amber-400":"bg-red-400";
const initials = (name:string) => name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

// ─── Radar chart (SVG) ────────────────────────────────────
function RadarChart({ members }: { members: Member[] }) {
  const axes = ["Submissions","Attendance","Avg Score","Homework","Streak"];
  const N = axes.length;
  const CX = 120, CY = 120, R = 90;
  const angle = (i:number) => (Math.PI*2*i)/N - Math.PI/2;
  const point = (i:number, r:number) => ({
    x: CX + r*Math.cos(angle(i)),
    y: CY + r*Math.sin(angle(i)),
  });

  const normalize = (m:Member): number[] => [
    pct(m.tasksSubmitted,m.tasksTotal),
    pct(m.attendance,m.attendanceTotal),
    m.avgScore,
    pct(m.homeworkDone,m.homeworkTotal),
    Math.min(100, (m.streak/20)*100),
  ];

  const colors = ["#0d9488","#7c3aed","#d97706","#0284c7","#dc2626"];

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto">
      {/* Grid */}
      {[0.2,0.4,0.6,0.8,1].map(scale=>(
        <polygon key={scale}
          points={Array.from({length:N},(_,i)=>{ const p=point(i,R*scale); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
      ))}
      {/* Axes */}
      {axes.map((_,i)=>{ const p=point(i,R); return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1"/>; })}
      {/* Axis labels */}
      {axes.map((label,i)=>{
        const p=point(i,R+16);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="currentColor" opacity="0.5" className="select-none">{label}</text>;
      })}
      {/* Member data */}
      {members.slice(0,5).map((m,mi)=>{
        const values=normalize(m);
        const pts=values.map((v,i)=>{ const p=point(i,R*(v/100)); return `${p.x},${p.y}`; }).join(" ");
        return (
          <g key={m.id}>
            <polygon points={pts} fill={colors[mi]} fillOpacity="0.12" stroke={colors[mi]} strokeWidth="1.5" strokeOpacity="0.8"/>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Member row ───────────────────────────────────────────
function MemberRow({ member, rank }: { member:Member; rank:number }) {
  const subPct  = pct(member.tasksSubmitted,member.tasksTotal);
  const attPct  = pct(member.attendance,member.attendanceTotal);
  const hwPct   = pct(member.homeworkDone,member.homeworkTotal);
  const overall = Math.round((subPct+attPct+member.avgScore+hwPct)/4);

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
      {/* Rank */}
      <div className={cn("w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[12px] font-extrabold",
        rank===1?"bg-amber-100/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/50"
        :rank===2?"bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
        :rank===3?"bg-orange-100/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/70 dark:border-orange-800/50"
        :"bg-muted text-muted-foreground border border-border"
      )}>
        {rank<=3?["🥇","🥈","🥉"][rank-1]:rank}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[12px] bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border border-teal-300/50 dark:border-teal-600/30">
        {initials(member.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-[13.5px] font-bold text-foreground">{member.name}</span>
          <span className={cn("text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full border",SUBTYPE_COLORS[member.subtype])}>{member.subtype}</span>
        </div>
        <p className="text-[11.5px] text-muted-foreground">{member.clusterName}</p>
      </div>

      {/* Metrics — hidden on small */}
      <div className="hidden lg:grid grid-cols-4 gap-6 flex-shrink-0">
        {[
          { label:"Submissions", value:`${subPct}%`,   sub:`${member.tasksSubmitted}/${member.tasksTotal}`,   color:barColor(subPct)  },
          { label:"Attendance",  value:`${attPct}%`,   sub:`${member.attendance}/${member.attendanceTotal}`,  color:barColor(attPct)  },
          { label:"Avg score",   value:`${member.avgScore}%`, sub:"out of 100",                              color:barColor(member.avgScore) },
          { label:"Homework",    value:`${hwPct}%`,    sub:`${member.homeworkDone}/${member.homeworkTotal}`,  color:barColor(hwPct)   },
        ].map(m=>(
          <div key={m.label} className="flex flex-col gap-1 min-w-[80px]">
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
              <span className="text-[12px] font-bold text-foreground tabular-nums">{m.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-700",m.color)} style={{width:m.value}}/>
            </div>
            <span className="text-[10.5px] text-muted-foreground/60">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Overall score */}
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
        <span className={cn("text-[18px] font-extrabold tabular-nums",
          overall>=80?"text-teal-600 dark:text-teal-400":overall>=60?"text-amber-600 dark:text-amber-400":"text-red-500 dark:text-red-400")}>
          {overall}
        </span>
        <span className="text-[10px] text-muted-foreground/60">overall</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function MemberProgressPage() {
  const [clusterId,  setClusterId]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [sortBy,     setSortBy]     = useState<"overall"|"attendance"|"score"|"submissions">("overall");
  const [showRadar,  setShowRadar]  = useState(true);

  const filtered = useMemo(()=>{
    let m = MOCK_MEMBERS;
    if (clusterId!=="all") m = m.filter(x=>x.clusterId===clusterId);
    if (search.trim())     m = m.filter(x=>x.name.toLowerCase().includes(search.toLowerCase())||x.email.toLowerCase().includes(search.toLowerCase()));
    return m.sort((a,b)=>{
      const score = (x:Member) => {
        if (sortBy==="attendance")  return pct(x.attendance,x.attendanceTotal);
        if (sortBy==="score")       return x.avgScore;
        if (sortBy==="submissions") return pct(x.tasksSubmitted,x.tasksTotal);
        return Math.round((pct(x.tasksSubmitted,x.tasksTotal)+pct(x.attendance,x.attendanceTotal)+x.avgScore+pct(x.homeworkDone,x.homeworkTotal))/4);
      };
      return score(b)-score(a);
    });
  },[clusterId,search,sortBy]);

  const topPerformers = filtered.slice(0,3);
  const avgOverall = filtered.length ? Math.round(filtered.reduce((s,m)=>s+Math.round((pct(m.tasksSubmitted,m.tasksTotal)+pct(m.attendance,m.attendanceTotal)+m.avgScore+pct(m.homeworkDone,m.homeworkTotal))/4),0)/filtered.length) : 0;

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse"/>
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Analytics</span>
        </div>
        <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Member Progress Dashboard</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
        </div>
        <select value={clusterId} onChange={e=>setClusterId(e.target.value)}
          className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
          {MOCK_CLUSTERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
          className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
          <option value="overall">Sort: Overall</option>
          <option value="attendance">Sort: Attendance</option>
          <option value="score">Sort: Avg score</option>
          <option value="submissions">Sort: Submissions</option>
        </select>
        <button onClick={()=>setShowRadar(s=>!s)}
          className={cn("h-10 px-4 rounded-xl border text-[13.5px] font-semibold transition-all",
            showRadar?"border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400"
                     :"border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
          <RiBarChartBoxLine className="inline mr-1.5 text-base"/>Radar
        </button>
      </div>

      {/* Two-column: stats + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">

        {/* Top performers */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400"><RiTrophyLine/></div>
            <div>
              <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">Top Performers</h2>
              <p className="text-[12px] text-muted-foreground">Cluster average: {avgOverall}%</p>
            </div>
          </div>
          <div className="flex gap-0 divide-x divide-border">
            {topPerformers.map((m,i)=>{
              const overall=Math.round((pct(m.tasksSubmitted,m.tasksTotal)+pct(m.attendance,m.attendanceTotal)+m.avgScore+pct(m.homeworkDone,m.homeworkTotal))/4);
              return (
                <div key={m.id} className="flex-1 px-5 py-4 text-center">
                  <div className="text-2xl mb-2">{["🥇","🥈","🥉"][i]}</div>
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-sm bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border border-teal-300/50 dark:border-teal-600/30">{initials(m.name)}</div>
                  <p className="text-[13px] font-bold text-foreground truncate">{m.name.split(" ")[0]}</p>
                  <p className="text-[22px] font-extrabold tabular-nums text-teal-600 dark:text-teal-400">{overall}</p>
                  <p className="text-[11px] text-muted-foreground">overall</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar chart */}
        {showRadar && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiBarChartBoxLine/></div>
              <h2 className="text-[14px] font-bold text-foreground">Radar Comparison</h2>
            </div>
            <div className="p-4">
              <RadarChart members={filtered}/>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {filtered.slice(0,5).map((m,i)=>{
                  const colors=["#0d9488","#7c3aed","#d97706","#0284c7","#dc2626"];
                  return (
                    <span key={m.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:colors[i]}}/>
                      {m.name.split(" ")[0]}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full member table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiGroupLine/></div>
            <h2 className="text-[14px] font-bold text-foreground">{filtered.length} member{filtered.length!==1?"s":""}</h2>
          </div>
          <p className="text-[12px] text-muted-foreground hidden lg:block">Submissions · Attendance · Avg score · Homework</p>
        </div>
        {filtered.map((m,i)=><MemberRow key={m.id} member={m} rank={i+1}/>)}
        {filtered.length===0&&(
          <div className="px-5 py-12 text-center"><RiGroupLine className="text-3xl text-muted-foreground/25 mx-auto mb-2"/><p className="text-[13.5px] text-muted-foreground">No members match your filters</p></div>
        )}
      </div>
    </div>
  );
}