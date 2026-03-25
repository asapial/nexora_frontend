"use client";

import { useState, useMemo } from "react";
import {
  RiCalendarCheckLine, RiGroupLine, RiFlaskLine, RiSparklingFill,
  RiCheckLine, RiCloseLine, RiSubtractLine, RiSaveLine,
  RiHistoryLine, RiArrowRightLine, RiEditLine, RiFilterLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
type Status = "PRESENT" | "ABSENT" | "EXCUSED" | "UNMARKED";

interface Member {
  id:   string;
  name: string;
  email:string;
}

interface AttendanceRecord {
  memberId: string;
  status:   Status;
  note:     string;
}

interface Session {
  id:         string;
  title:      string;
  date:       string;
  clusterId:  string;
  clusterName:string;
}

interface HistoryEntry {
  sessionTitle: string;
  date:         string;
  status:       Status;
}

// ─── Mock data ────────────────────────────────────────────
const MOCK_CLUSTERS = [
  { id:"c1", name:"ML Research Group — 2025" },
  { id:"c2", name:"NLP Reading Circle"        },
  { id:"c3", name:"Bootcamp Cohort B"          },
];

const MOCK_SESSIONS: Session[] = [
  { id:"s1", title:"Session 12 — Attention Mechanisms",     date:"2025-03-18", clusterId:"c1", clusterName:"ML Research Group — 2025" },
  { id:"s2", title:"Session 11 — Transformer Architecture", date:"2025-03-11", clusterId:"c1", clusterName:"ML Research Group — 2025" },
  { id:"s3", title:"NLP Week 7 — BERT Finetuning",          date:"2025-03-15", clusterId:"c2", clusterName:"NLP Reading Circle"        },
  { id:"s4", title:"Sprint 8 — REST API Project",           date:"2025-03-14", clusterId:"c3", clusterName:"Bootcamp Cohort B"          },
  { id:"s5", title:"Session 10 — Positional Encoding",      date:"2025-03-04", clusterId:"c1", clusterName:"ML Research Group — 2025" },
];

const MOCK_MEMBERS: Member[] = [
  { id:"m1", name:"Aisha Khan",   email:"aisha@ex.com"  },
  { id:"m2", name:"Lucas Mendes", email:"lucas@ex.com"  },
  { id:"m3", name:"Priya Sharma", email:"priya@ex.com"  },
  { id:"m4", name:"Omar Hassan",  email:"omar@ex.com"   },
  { id:"m5", name:"Elena Kozlov", email:"elena@ex.com"  },
];

const HISTORY: Record<string, HistoryEntry[]> = {
  m1:[ {sessionTitle:"Session 11",date:"Mar 11",status:"PRESENT"},{sessionTitle:"Session 10",date:"Mar 4",status:"PRESENT"},{sessionTitle:"Session 9",date:"Feb 25",status:"EXCUSED"},{sessionTitle:"Session 8",date:"Feb 18",status:"PRESENT"},{sessionTitle:"Session 7",date:"Feb 11",status:"PRESENT"} ],
  m2:[ {sessionTitle:"Session 11",date:"Mar 11",status:"PRESENT"},{sessionTitle:"Session 10",date:"Mar 4",status:"ABSENT"}, {sessionTitle:"Session 9",date:"Feb 25",status:"PRESENT"},{sessionTitle:"Session 8",date:"Feb 18",status:"PRESENT"},{sessionTitle:"Session 7",date:"Feb 11",status:"EXCUSED"} ],
  m3:[ {sessionTitle:"Session 11",date:"Mar 11",status:"PRESENT"},{sessionTitle:"Session 10",date:"Mar 4",status:"PRESENT"},{sessionTitle:"Session 9",date:"Feb 25",status:"PRESENT"},{sessionTitle:"Session 8",date:"Feb 18",status:"PRESENT"},{sessionTitle:"Session 7",date:"Feb 11",status:"PRESENT"} ],
  m4:[ {sessionTitle:"Session 11",date:"Mar 11",status:"ABSENT"}, {sessionTitle:"Session 10",date:"Mar 4",status:"ABSENT"}, {sessionTitle:"Session 9",date:"Feb 25",status:"EXCUSED"},{sessionTitle:"Session 8",date:"Feb 18",status:"PRESENT"},{sessionTitle:"Session 7",date:"Feb 11",status:"ABSENT"} ],
  m5:[ {sessionTitle:"Session 11",date:"Mar 11",status:"PRESENT"},{sessionTitle:"Session 10",date:"Mar 4",status:"PRESENT"},{sessionTitle:"Session 9",date:"Feb 25",status:"PRESENT"},{sessionTitle:"Session 8",date:"Feb 18",status:"EXCUSED"},{sessionTitle:"Session 7",date:"Feb 11",status:"PRESENT"} ],
};

// ─── Config ───────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { label:string; icon:React.ReactNode; activeClass:string; dotClass:string }> = {
  PRESENT:  { label:"Present",  icon:<RiCheckLine/>,     activeClass:"border-teal-400 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white",        dotClass:"bg-teal-500" },
  ABSENT:   { label:"Absent",   icon:<RiCloseLine/>,     activeClass:"border-red-400 dark:border-red-500 bg-red-600 dark:bg-red-500 text-white",              dotClass:"bg-red-500"  },
  EXCUSED:  { label:"Excused",  icon:<RiSubtractLine/>,  activeClass:"border-amber-400 dark:border-amber-500 bg-amber-500 dark:bg-amber-500 text-white",     dotClass:"bg-amber-400"},
  UNMARKED: { label:"—",        icon:null,               activeClass:"",                                                                                      dotClass:"bg-muted-foreground/30" },
};

const initials = (name:string) => name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const fmtDate  = (d:string) => { try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return d; } };
const pct      = (a:number,b:number) => b===0?0:Math.round((a/b)*100);

// ─── Status toggle button ─────────────────────────────────
function StatusBtn({ status, current, onClick }: { status:Status; current:Status; onClick:()=>void }) {
  const cfg = STATUS_CONFIG[status];
  const isActive = status===current;
  if (status==="UNMARKED") return null;
  return (
    <button type="button" onClick={onClick}
      className={cn("w-8 h-8 rounded-lg border-2 flex items-center justify-center text-base transition-all duration-150",
        isActive ? cfg.activeClass : "border-border text-muted-foreground/50 hover:border-border/80 hover:text-foreground hover:bg-muted/50"
      )}>
      {cfg.icon}
    </button>
  );
}

// ─── History dots ──────────────────────────────────────────
function HistoryDots({ memberId }: { memberId: string }) {
  const entries = HISTORY[memberId] ?? [];
  if (!entries.length) return <span className="text-[11.5px] text-muted-foreground/50">No history</span>;
  const presentCount = entries.filter(e=>e.status==="PRESENT").length;
  const rate = pct(presentCount,entries.length);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {entries.map((e,i)=>(
          <div key={i} title={`${e.sessionTitle} · ${e.date} · ${e.status}`}
            className={cn("w-3 h-3 rounded-sm transition-all",STATUS_CONFIG[e.status].dotClass)}/>
        ))}
      </div>
      <span className={cn("text-[11.5px] font-bold tabular-nums",
        rate>=80?"text-teal-600 dark:text-teal-400":rate>=60?"text-amber-600 dark:text-amber-400":"text-red-500 dark:text-red-400")}>
        {rate}%
      </span>
    </div>
  );
}

// ─── Attendance rate bar ───────────────────────────────────
function RateBar({ records }: { records: AttendanceRecord[] }) {
  const present  = records.filter(r=>r.status==="PRESENT").length;
  const excused  = records.filter(r=>r.status==="EXCUSED").length;
  const absent   = records.filter(r=>r.status==="ABSENT").length;
  const unmarked = records.filter(r=>r.status==="UNMARKED").length;
  const total    = records.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[12.5px] font-semibold text-foreground">
        <span>Session attendance</span>
        <span className={cn(total===unmarked?"text-muted-foreground":pct(present,total)>=80?"text-teal-600 dark:text-teal-400":pct(present,total)>=60?"text-amber-600 dark:text-amber-400":"text-red-500 dark:text-red-400")}>
          {total===unmarked?"Not marked yet":`${pct(present,total)}% present`}
        </span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden flex gap-0.5">
        {total>0&&[
          {count:present,  color:"bg-teal-500"},
          {count:excused,  color:"bg-amber-400"},
          {count:absent,   color:"bg-red-400"},
          {count:unmarked, color:"bg-muted-foreground/20"},
        ].map((seg,i)=>seg.count>0&&(
          <div key={i} className={cn("h-full transition-all duration-700",seg.color)} style={{width:`${pct(seg.count,total)}%`}}/>
        ))}
      </div>
      <div className="flex gap-4 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-500"/>Present: {present}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400"/>Excused: {excused}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400"/>Absent: {absent}</span>
        {unmarked>0&&<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground/30"/>Unmarked: {unmarked}</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function AttendanceTrackingPage() {
  const [clusterId,  setClusterId]  = useState("c1");
  const [sessionId,  setSessionId]  = useState<string>("");
  const [records,    setRecords]    = useState<Record<string, AttendanceRecord>>({});
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [showHistory,setShowHistory]= useState(false);

  const clusterSessions = MOCK_SESSIONS.filter(s=>s.clusterId===clusterId);
  const activeSession   = clusterSessions.find(s=>s.id===sessionId) ?? clusterSessions[0];

  // Init records when session changes
  const sessionRecords = useMemo(()=>{
    if (!activeSession) return [];
    return MOCK_MEMBERS.map(m=>({
      memberId: m.id,
      status:   records[`${activeSession.id}-${m.id}`]?.status ?? "UNMARKED",
      note:     records[`${activeSession.id}-${m.id}`]?.note   ?? "",
    }));
  },[activeSession,records]);

  const setStatus = (memberId:string, status:Status) =>
    setRecords(r=>({...r,[`${activeSession!.id}-${memberId}`]:{ memberId, status, note:r[`${activeSession!.id}-${memberId}`]?.note??"" }}));

  const setNote = (memberId:string, note:string) =>
    setRecords(r=>({...r,[`${activeSession!.id}-${memberId}`]:{ memberId, status:r[`${activeSession!.id}-${memberId}`]?.status??"UNMARKED", note }}));

  const markAll = (status:Status) =>
    MOCK_MEMBERS.forEach(m=>setStatus(m.id,status));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,700));
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse"/>
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Sessions</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Attendance Tracking</h1>
        </div>
        <button onClick={()=>setShowHistory(s=>!s)}
          className={cn("inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-[13.5px] font-semibold transition-all",
            showHistory?"border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400"
                       :"border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
          <RiHistoryLine/> {showHistory?"Hide history":"Show history"}
        </button>
      </div>

      {/* Session selector */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Cluster</label>
            <select value={clusterId} onChange={e=>{ setClusterId(e.target.value); setSessionId(""); }}
              className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all">
              {MOCK_CLUSTERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Session</label>
            <select value={activeSession?.id??""} onChange={e=>setSessionId(e.target.value)}
              className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all">
              {clusterSessions.map(s=><option key={s.id} value={s.id}>{s.title} · {fmtDate(s.date)}</option>)}
            </select>
          </div>
        </div>
        {activeSession && <RateBar records={sessionRecords}/>}
      </div>

      {/* Mark all row + table */}
      {activeSession && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <RiGroupLine className="text-muted-foreground/60 text-base"/>
              <span className="text-[13px] font-bold text-foreground">{MOCK_MEMBERS.length} members</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground mr-1">Mark all:</span>
              {(["PRESENT","ABSENT","EXCUSED"] as Status[]).map(s=>(
                <button key={s} type="button" onClick={()=>markAll(s)}
                  className={cn("h-7 px-3 rounded-lg text-[11.5px] font-bold border transition-all",
                    s==="PRESENT"?"border-teal-300/60 dark:border-teal-700/50 text-teal-700 dark:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/30"
                    :s==="ABSENT"?"border-red-300/60 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/30"
                    :"border-amber-300/60 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/30"
                  )}>
                  {s.charAt(0)+s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Member rows */}
          {MOCK_MEMBERS.map(member=>{
            const rec = sessionRecords.find(r=>r.memberId===member.id);
            const status = rec?.status ?? "UNMARKED";
            const note   = rec?.note   ?? "";
            return (
              <div key={member.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-4 px-5 py-3.5">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[12px] bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border border-teal-300/50 dark:border-teal-600/30">
                    {initials(member.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">{member.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{member.email}</p>
                  </div>

                  {/* Status buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(["PRESENT","EXCUSED","ABSENT"] as Status[]).map(s=>(
                      <StatusBtn key={s} status={s} current={status} onClick={()=>setStatus(member.id,s)}/>
                    ))}
                  </div>

                  {/* Current status label */}
                  <div className={cn("w-20 text-center text-[11.5px] font-bold flex-shrink-0 hidden sm:block",
                    status==="PRESENT"?"text-teal-600 dark:text-teal-400"
                    :status==="ABSENT"?"text-red-500 dark:text-red-400"
                    :status==="EXCUSED"?"text-amber-600 dark:text-amber-400"
                    :"text-muted-foreground/40")}>
                    {STATUS_CONFIG[status].label}
                  </div>
                </div>

                {/* Note input */}
                <div className="px-5 pb-3">
                  <input value={note} onChange={e=>setNote(member.id,e.target.value)} placeholder="Add a note (optional)…"
                    className="w-full h-8 px-3 rounded-lg text-[12.5px] bg-muted/30 border border-border/60 text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-teal-400/25 focus:border-teal-400/50 transition-all"/>
                </div>

                {/* History row */}
                {showHistory && (
                  <div className="px-5 pb-3 flex items-center gap-3">
                    <span className="text-[11.5px] font-semibold text-muted-foreground/70 flex-shrink-0">History:</span>
                    <HistoryDots memberId={member.id}/>
                  </div>
                )}
              </div>
            );
          })}

          {/* Save footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/20">
            <p className="text-[12.5px] text-muted-foreground">
              {sessionRecords.filter(r=>r.status!=="UNMARKED").length}/{MOCK_MEMBERS.length} marked
            </p>
            <button onClick={handleSave} disabled={saving}
              className={cn("inline-flex items-center gap-2 h-10 px-6 rounded-xl text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] disabled:opacity-60",
                saved?"bg-teal-600 dark:bg-teal-500":"bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600")}>
              {saving?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</>
               :saved?<><RiCheckLine/>Saved!</>
               :<><RiSaveLine/>Save attendance</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}