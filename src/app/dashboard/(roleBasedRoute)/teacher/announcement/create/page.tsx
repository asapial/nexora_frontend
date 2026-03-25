"use client";

import { useState, useRef } from "react";
import {
  RiMegaphoneLine, RiAddLine, RiFlaskLine, RiTimeLine,
  RiAlertLine, RiInformationLine, RiErrorWarningLine,
  RiCheckLine, RiCloseLine, RiSparklingFill, RiCalendarLine,
  RiAttachmentLine, RiDeleteBinLine, RiSendPlaneLine,
  RiDraftLine, RiMoreLine, RiEditLine, RiEyeLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
type Urgency = "INFO" | "IMPORTANT" | "CRITICAL";

interface Announcement {
  id:          string;
  title:       string;
  body:        string;
  urgency:     Urgency;
  clusterIds:  string[];
  clusterNames:string[];
  scheduled?:  string;
  attachment?: string;
  sentAt?:     string;
  status:      "draft" | "sent" | "scheduled";
  readCount:   number;
  totalCount:  number;
}

const MOCK_CLUSTERS = [
  { id:"c1", name:"ML Research Group — 2025", memberCount:18 },
  { id:"c2", name:"NLP Reading Circle",        memberCount:11 },
  { id:"c3", name:"Bootcamp Cohort B",          memberCount:42 },
  { id:"c4", name:"Computer Vision Seminar",    memberCount:9  },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id:"a1", title:"Session rescheduled to Friday", body:"Due to the departmental seminar, this week's ML session is moved to Friday 3 PM. Please update your calendars.", urgency:"IMPORTANT", clusterIds:["c1"], clusterNames:["ML Research Group — 2025"], sentAt:"2 hrs ago", status:"sent", readCount:14, totalCount:18 },
  { id:"a2", title:"Assignment deadline extended",  body:"The Sprint 8 deadline has been extended to Sunday 11:59 PM following student feedback. Please use the extra time wisely.", urgency:"INFO", clusterIds:["c3"], clusterNames:["Bootcamp Cohort B"], sentAt:"Yesterday", status:"sent", readCount:38, totalCount:42 },
  { id:"a3", title:"Critical: Server maintenance",  body:"The Nexora platform will be unavailable on Saturday 2–4 AM IST for scheduled maintenance. Please save your work.", urgency:"CRITICAL", clusterIds:["c1","c2","c3","c4"], clusterNames:["All clusters"], scheduled:"Sat 2 AM IST", status:"scheduled", readCount:0, totalCount:80 },
];

// ─── Urgency config ───────────────────────────────────────
const URGENCY: Record<Urgency, { label:string; icon:React.ReactNode; badge:string; border:string; glow:string }> = {
  INFO:      { label:"Info",      icon:<RiInformationLine />,  badge:"bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",      border:"border-sky-300/50 dark:border-sky-700/50",     glow:"" },
  IMPORTANT: { label:"Important", icon:<RiAlertLine />,        badge:"bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50", border:"border-amber-300/50 dark:border-amber-700/50", glow:"" },
  CRITICAL:  { label:"Critical",  icon:<RiErrorWarningLine />, badge:"bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50",       border:"border-red-300/50 dark:border-red-700/50",    glow:"shadow-sm shadow-red-200 dark:shadow-red-900/30" },
};

// ─── Shared field ─────────────────────────────────────────
function Field({ label, children, hint, required }: { label:string; children:React.ReactNode; hint?:string; required?:boolean }) {
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

function TextInput({ value, onChange, placeholder, error }: { value:string; onChange:(v:string)=>void; placeholder?:string; error?:string }) {
  return (
    <>
      <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className={cn("w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border",
          error?"border-red-400/60":"border-border focus:border-teal-400/70",
          "text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all")} />
      {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
    </>
  );
}

// ─── Cluster multi-select ─────────────────────────────────
function ClusterSelect({ selected, onChange }: { selected:string[]; onChange:(ids:string[])=>void }) {
  const toggle = (id:string) =>
    onChange(selected.includes(id) ? selected.filter(s=>s!==id) : [...selected,id]);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <button type="button" onClick={()=>onChange(MOCK_CLUSTERS.map(c=>c.id))}
          className="text-[12px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">Select all</button>
        <span className="text-muted-foreground/30">·</span>
        <button type="button" onClick={()=>onChange([])}
          className="text-[12px] font-semibold text-muted-foreground hover:text-foreground">Clear</button>
      </div>
      {MOCK_CLUSTERS.map(c=>(
        <label key={c.id}
          className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all",
            selected.includes(c.id)
              ?"border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20"
              :"border-border bg-muted/30 hover:bg-muted/50")}>
          <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
            selected.includes(c.id)
              ?"border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-500"
              :"border-border bg-background")}>
            {selected.includes(c.id) && <RiCheckLine className="text-white text-xs" />}
          </div>
          <input type="checkbox" className="sr-only" checked={selected.includes(c.id)} onChange={()=>toggle(c.id)} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">{c.name}</p>
            <p className="text-[11.5px] text-muted-foreground">{c.memberCount} members</p>
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── Announcement card ────────────────────────────────────
function AnnouncementCard({ ann }: { ann:Announcement }) {
  const u = URGENCY[ann.urgency];
  const readPct = ann.totalCount > 0 ? Math.round((ann.readCount/ann.totalCount)*100) : 0;
  return (
    <div className={cn("rounded-2xl border bg-card overflow-hidden", u.border, u.glow)}>
      <div className="flex items-start gap-4 px-5 py-4">
        <div className={cn("w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base mt-0.5",
          ann.urgency==="INFO"?"bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400"
          :ann.urgency==="IMPORTANT"?"bg-amber-100/70 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
          :"bg-red-100/70 dark:bg-red-950/30 text-red-600 dark:text-red-400")}>
          {u.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[14px] font-bold text-foreground">{ann.title}</span>
            <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",u.badge)}>{u.label}</span>
            <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",
              ann.status==="sent"?"bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50"
              :ann.status==="scheduled"?"bg-violet-100/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50"
              :"bg-muted text-muted-foreground border-border")}>
              {ann.status==="scheduled"?`Scheduled · ${ann.scheduled}`:ann.status}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground line-clamp-2 mb-2">{ann.body}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
              <RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />
              {ann.clusterNames.join(", ")}
            </span>
            {ann.sentAt && <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiTimeLine className="text-xs" />{ann.sentAt}</span>}
          </div>
        </div>
      </div>
      {ann.status==="sent" && (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-muted-foreground">Read rate</span>
            <span className="text-[12px] font-bold text-foreground">{ann.readCount}/{ann.totalCount} ({readPct}%)</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-teal-500 transition-all duration-700" style={{width:`${readPct}%`}} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function AnnouncementsPage() {
  const [showForm,    setShowForm]    = useState(false);
  const [announcements,setAnnouncements]=useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [title,       setTitle]       = useState("");
  const [body,        setBody]        = useState("");
  const [urgency,     setUrgency]     = useState<Urgency>("INFO");
  const [clusters,    setClusters]    = useState<string[]>([]);
  const [schedDate,   setSchedDate]   = useState("");
  const [schedTime,   setSchedTime]   = useState("");
  const [attachment,  setAttachment]  = useState<File|null>(null);
  const [errors,      setErrors]      = useState<Record<string,string>>({});
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e:Record<string,string>={};
    if (!title.trim())    e.title="Title is required";
    if (!body.trim())     e.body="Message body is required";
    if (!clusters.length) e.clusters="Select at least one cluster";
    return e;
  };

  const handleSend = async (draft=false) => {
    const e=validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    const clusterNames = clusters.length===MOCK_CLUSTERS.length
      ? ["All clusters"]
      : MOCK_CLUSTERS.filter(c=>clusters.includes(c.id)).map(c=>c.name);
    const totalCount = MOCK_CLUSTERS.filter(c=>clusters.includes(c.id)).reduce((s,c)=>s+c.memberCount,0);
    setAnnouncements(as=>[{
      id:`a-${Date.now()}`, title:title.trim(), body:body.trim(), urgency, clusterIds:clusters,
      clusterNames, attachment:attachment?.name,
      scheduled: schedDate ? `${schedDate} ${schedTime}`.trim() : undefined,
      sentAt:draft||schedDate?undefined:"Just now",
      status:draft?"draft":schedDate?"scheduled":"sent",
      readCount:0, totalCount,
    },...as]);
    setSuccess(true); setLoading(false);
    setTimeout(()=>{ setSuccess(false); setShowForm(false); setTitle(""); setBody(""); setClusters([]); setSchedDate(""); setSchedTime(""); setAttachment(null); },1800);
  };

  const totalMembers = MOCK_CLUSTERS.filter(c=>clusters.includes(c.id)).reduce((s,c)=>s+c.memberCount,0);

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Communication</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Announcements</h1>
        </div>
        <button onClick={()=>setShowForm(s=>!s)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]">
          {showForm?<RiCloseLine/>:<RiAddLine/>} {showForm?"Close":"New announcement"}
        </button>
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="rounded-2xl border border-teal-300/40 dark:border-teal-700/40 bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-teal-50/30 dark:bg-teal-950/10">
            <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiMegaphoneLine /></div>
            <h2 className="text-[14px] font-bold text-foreground">New Announcement</h2>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
            {/* Left */}
            <div className="flex flex-col gap-4">
              <Field label="Title" required>
                <TextInput value={title} onChange={v=>{setTitle(v);setErrors(e=>({...e,title:""}))}} placeholder="e.g. Session rescheduled to Friday" error={errors.title}/>
              </Field>

              {/* Urgency pills */}
              <Field label="Urgency">
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(URGENCY) as [Urgency,typeof URGENCY[Urgency]][]).map(([k,v])=>(
                    <button key={k} type="button" onClick={()=>setUrgency(k)}
                      className={cn("inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-bold border transition-all",
                        urgency===k?v.badge+" scale-105":
                        "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50")}>
                      <span className="text-base">{v.icon}</span>{v.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Body */}
              <Field label="Message" required>
                <>
                  <textarea value={body} onChange={e=>{setBody(e.target.value);setErrors(ev=>({...ev,body:""}))}} rows={6}
                    placeholder="Write your announcement here…"
                    className={cn("w-full rounded-xl px-4 py-3 text-[13.5px] font-medium leading-relaxed resize-none bg-muted/40 border",
                      errors.body?"border-red-400/60":"border-border focus:border-teal-400/70",
                      "text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all")}/>
                  {errors.body && <p className="text-[12px] text-red-500 font-medium">{errors.body}</p>}
                </>
              </Field>

              {/* Attachment */}
              <Field label="Attachment" hint="Optional — PDF, DOCX, image (max 10 MB)">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={()=>fileRef.current?.click()}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 text-[13px] font-semibold text-foreground/80 hover:text-foreground transition-all">
                    <RiAttachmentLine className="text-base"/> {attachment?"Change file":"Attach file"}
                  </button>
                  {attachment && (
                    <>
                      <span className="text-[12.5px] text-muted-foreground truncate max-w-[180px]">{attachment.name}</span>
                      <button type="button" onClick={()=>setAttachment(null)} className="text-muted-foreground/50 hover:text-red-500 transition-colors"><RiCloseLine/></button>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={e=>setAttachment(e.target.files?.[0]??null)}/>
              </Field>

              {/* Schedule */}
              <Field label="Schedule for later" hint="Leave blank to send immediately">
                <div className="flex gap-3">
                  <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                    className="flex-1 h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
                  <input type="time" value={schedTime} onChange={e=>setSchedTime(e.target.value)}
                    className="w-32 h-10 px-3 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"/>
                </div>
              </Field>
            </div>

            {/* Right — cluster select */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[13px] font-semibold text-foreground/80 mb-0.5">
                  Send to clusters<span className="text-red-500 ml-0.5">*</span>
                </p>
                {errors.clusters && <p className="text-[12px] text-red-500 font-medium mb-1">{errors.clusters}</p>}
              </div>
              <ClusterSelect selected={clusters} onChange={ids=>{setClusters(ids);setErrors(e=>({...e,clusters:""}))}}/>
              {clusters.length>0 && (
                <div className="px-3 py-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-800/40">
                  <p className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-400">
                    {totalMembers} member{totalMembers!==1?"s":""} will be notified
                  </p>
                  {schedDate && (
                    <p className="text-[12px] text-teal-600/70 dark:text-teal-500/70 flex items-center gap-1 mt-0.5">
                      <RiCalendarLine className="text-xs"/> Scheduled: {schedDate} {schedTime}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <button type="button" onClick={()=>handleSend(true)} disabled={loading}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-60">
              <RiDraftLine/> Save draft
            </button>
            <button type="button" onClick={()=>handleSend(false)} disabled={loading}
              className={cn("inline-flex items-center gap-2 h-10 px-6 rounded-xl text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] disabled:opacity-60",
                success?"bg-teal-600 dark:bg-teal-500":"bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600")}>
              {loading
                ?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending…</>
                :success?<><RiCheckLine/>Sent!</>
                :schedDate?<><RiCalendarLine/>{`Schedule · ${schedDate}`}</>
                :<><RiSendPlaneLine/>Send now</>}
            </button>
          </div>
        </div>
      )}

      {/* Past announcements */}
      <div className="flex flex-col gap-4">
        <p className="text-[12px] font-bold uppercase tracking-[.1em] text-muted-foreground">
          Recent Announcements · {announcements.length}
        </p>
        {announcements.map(a=><AnnouncementCard key={a.id} ann={a}/>)}
        {announcements.length===0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <RiMegaphoneLine className="text-3xl text-muted-foreground/30 mx-auto mb-2"/>
            <p className="text-[13.5px] text-muted-foreground">No announcements yet</p>
          </div>
        )}
      </div>
    </div>
  );
}