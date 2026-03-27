"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  RiGroupLine, RiFlaskLine, RiTrophyLine, RiSparklingFill,
  RiCheckboxCircleLine, RiCalendarCheckLine, RiMedalLine,
  RiBarChartBoxLine, RiSearchLine, RiRefreshLine, RiLoader4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
type MemberSubtype = "EMERGING" | "ACTIVE" | "GRADUATED" | "ALUMNI";

interface Member {
  id:              string;
  name:            string;
  email:           string;
  image:           string | null;
  subtype:         MemberSubtype;
  clusterId:       string;
  clusterName:     string;
  tasksTotal:      number;
  tasksSubmitted:  number;
  avgScore:        number;
  attendance:      number;
  attendanceTotal: number;
}

interface Cluster { id: string; name: string }

const SUBTYPE_COLORS: Record<MemberSubtype, string> = {
  EMERGING:  "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
  ACTIVE:    "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  GRADUATED: "bg-violet-100/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50",
  ALUMNI:    "bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-700/50",
};

const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);
const barColor = (p: number) => p >= 80 ? "bg-teal-500" : p >= 60 ? "bg-amber-400" : "bg-red-400";
const initials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

// ─── Radar chart (SVG) ──────────────────────────────────────
function RadarChart({ members }: { members: Member[] }) {
  const axes = ["Submissions", "Attendance", "Avg Score"];
  const N = axes.length;
  const CX = 120, CY = 120, R = 90;
  const angle = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const point = (i: number, r: number) => ({ x: CX + r * Math.cos(angle(i)), y: CY + r * Math.sin(angle(i)) });

  const normalize = (m: Member): number[] => [
    pct(m.tasksSubmitted, m.tasksTotal),
    pct(m.attendance, m.attendanceTotal),
    m.avgScore,
  ];

  const colors = ["#0d9488", "#7c3aed", "#d97706", "#0284c7", "#dc2626"];

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto">
      {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
        <polygon key={scale}
          points={Array.from({ length: N }, (_, i) => { const p = point(i, R * scale); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
      ))}
      {axes.map((_, i) => { const p = point(i, R); return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />; })}
      {axes.map((label, i) => {
        const p = point(i, R + 16);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="currentColor" opacity="0.5" className="select-none">{label}</text>;
      })}
      {members.slice(0, 5).map((m, mi) => {
        const values = normalize(m);
        const pts = values.map((v, i) => { const p = point(i, R * (v / 100)); return `${p.x},${p.y}`; }).join(" ");
        return (
          <g key={m.id}>
            <polygon points={pts} fill={colors[mi]} fillOpacity="0.12" stroke={colors[mi]} strokeWidth="1.5" strokeOpacity="0.8" />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Member row ───────────────────────────────────────────
function MemberRow({ member, rank }: { member: Member; rank: number }) {
  const subPct = pct(member.tasksSubmitted, member.tasksTotal);
  const attPct = pct(member.attendance, member.attendanceTotal);
  const overall = Math.round((subPct + attPct + member.avgScore) / 3);

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
      <div className={cn("w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[12px] font-extrabold",
        rank === 1 ? "bg-amber-100/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/50"
        : rank === 2 ? "bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
        : rank === 3 ? "bg-orange-100/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/70 dark:border-orange-800/50"
        : "bg-muted text-muted-foreground border border-border"
      )}>
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[12px] bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border border-teal-300/50 dark:border-teal-600/30 overflow-hidden">
        {member.image
          ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
          : initials(member.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-[13.5px] font-bold text-foreground">{member.name}</span>
          <span className={cn("text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full border", SUBTYPE_COLORS[member.subtype])}>{member.subtype}</span>
        </div>
        <p className="text-[11.5px] text-muted-foreground">{member.clusterName} · {member.email}</p>
      </div>

      {/* Metrics */}
      <div className="hidden lg:grid grid-cols-3 gap-5 flex-shrink-0">
        {[
          { label: "Submissions", value: `${subPct}%`, sub: `${member.tasksSubmitted}/${member.tasksTotal}`, color: barColor(subPct) },
          { label: "Attendance",  value: `${attPct}%`, sub: `${member.attendance}/${member.attendanceTotal}`,  color: barColor(attPct) },
          { label: "Avg score",   value: `${member.avgScore}%`, sub: "out of 100", color: barColor(member.avgScore) },
        ].map(m => (
          <div key={m.label} className="flex flex-col gap-1 min-w-[80px]">
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
              <span className="text-[12px] font-bold text-foreground tabular-nums">{m.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-700", m.color)} style={{ width: m.value }} />
            </div>
            <span className="text-[10.5px] text-muted-foreground/60">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Overall */}
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
        <span className={cn("text-[18px] font-extrabold tabular-nums",
          overall >= 80 ? "text-teal-600 dark:text-teal-400" : overall >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400")}>
          {overall}
        </span>
        <span className="text-[10px] text-muted-foreground/60">overall</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function MemberProgressPage() {
  const [clusters,     setClusters]     = useState<Cluster[]>([]);
  const [allMembers,   setAllMembers]   = useState<Member[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [clusterId,    setClusterId]    = useState("all");
  const [search,       setSearch]       = useState("");
  const [sortBy,       setSortBy]       = useState<"overall" | "attendance" | "score" | "submissions">("overall");
  const [showRadar,    setShowRadar]    = useState(true);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get teacher's clusters
      const clRes = await fetch("/api/cluster", { credentials: "include" });
      const clData = await clRes.json();
      const clList: Cluster[] = (clData.data ?? clData) || [];
      setClusters(clList);

      // 2. For each cluster, fetch members + their stats
      const memberPromises = clList.map(async (cl) => {
        try {
          const mRes = await fetch(`/api/teacher/tasks/sessions/${cl.id}/members`, { credentials: "include" });
          const mData = await mRes.json();
          const rawMembers: any[] = mData.data ?? [];

          // Map to Member shape — attendance & task stats may vary by backend
          return rawMembers.map((m: any): Member => ({
            id:              m.studentProfileId ?? m.id,
            name:            m.name ?? m.user?.name ?? "Unknown",
            email:           m.email ?? m.user?.email ?? "",
            image:           m.image ?? m.user?.image ?? null,
            subtype:         (m.subtype ?? "ACTIVE") as MemberSubtype,
            clusterId:       cl.id,
            clusterName:     cl.name,
            tasksTotal:      m.tasksTotal   ?? 0,
            tasksSubmitted:  m.tasksSubmitted ?? 0,
            avgScore:        m.avgScore     ?? 0,
            attendance:      m.attendance   ?? 0,
            attendanceTotal: m.attendanceTotal ?? 0,
          }));
        } catch {
          return [];
        }
      });

      const nested = await Promise.all(memberPromises);
      setAllMembers(nested.flat());
    } catch { /* silent — show empty state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const filtered = useMemo(() => {
    let m = allMembers;
    if (clusterId !== "all") m = m.filter(x => x.clusterId === clusterId);
    if (search.trim()) m = m.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.email.toLowerCase().includes(search.toLowerCase()));
    return m.sort((a, b) => {
      const score = (x: Member) => {
        if (sortBy === "attendance")  return pct(x.attendance, x.attendanceTotal);
        if (sortBy === "score")       return x.avgScore;
        if (sortBy === "submissions") return pct(x.tasksSubmitted, x.tasksTotal);
        return Math.round((pct(x.tasksSubmitted, x.tasksTotal) + pct(x.attendance, x.attendanceTotal) + x.avgScore) / 3);
      };
      return score(b) - score(a);
    });
  }, [allMembers, clusterId, search, sortBy]);

  const topPerformers    = filtered.slice(0, 3);
  const avgOverall       = filtered.length
    ? Math.round(filtered.reduce((s, m) => s + Math.round((pct(m.tasksSubmitted, m.tasksTotal) + pct(m.attendance, m.attendanceTotal) + m.avgScore) / 3), 0) / filtered.length)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Analytics</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Member Progress Dashboard</h1>
        </div>
        <button onClick={fetchProgress} className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
          <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
        </div>
        <select value={clusterId} onChange={e => setClusterId(e.target.value)}
          className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
          <option value="all">All clusters</option>
          {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
          <option value="overall">Sort: Overall</option>
          <option value="attendance">Sort: Attendance</option>
          <option value="score">Sort: Avg score</option>
          <option value="submissions">Sort: Submissions</option>
        </select>
        <button onClick={() => setShowRadar(s => !s)}
          className={cn("h-10 px-4 rounded-xl border text-[13.5px] font-semibold transition-all",
            showRadar ? "border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400"
            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
          <RiBarChartBoxLine className="inline mr-1.5 text-base" />Radar
        </button>
      </div>

      {loading ? (
        /* Skeleton */
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-border bg-card animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-muted flex-shrink-0" />
              <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-2.5 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : allMembers.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 flex flex-col items-center gap-3 text-center">
          <RiGroupLine className="text-3xl text-muted-foreground/30" />
          <p className="text-[14px] font-bold text-muted-foreground">No member data found</p>
          <p className="text-[12.5px] text-muted-foreground/60">Make sure you have active clusters with members and sessions.</p>
          <button onClick={fetchProgress} className="mt-1 inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <RiRefreshLine /> Try again
          </button>
        </div>
      ) : (
        <>
          {/* Two-column: top performers + radar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
            {/* Top performers */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400"><RiTrophyLine /></div>
                <div>
                  <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">Top Performers</h2>
                  <p className="text-[12px] text-muted-foreground">Cluster average: {avgOverall}%</p>
                </div>
              </div>
              <div className="flex gap-0 divide-x divide-border">
                {topPerformers.map((m, i) => {
                  const overall = Math.round((pct(m.tasksSubmitted, m.tasksTotal) + pct(m.attendance, m.attendanceTotal) + m.avgScore) / 3);
                  return (
                    <div key={m.id} className="flex-1 px-5 py-4 text-center">
                      <div className="text-2xl mb-2">{["🥇", "🥈", "🥉"][i]}</div>
                      <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-sm bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border border-teal-300/50 dark:border-teal-600/30">
                        {initials(m.name)}
                      </div>
                      <p className="text-[13px] font-bold text-foreground truncate">{m.name.split(" ")[0]}</p>
                      <p className="text-[22px] font-extrabold tabular-nums text-teal-600 dark:text-teal-400">{overall}</p>
                      <p className="text-[11px] text-muted-foreground">overall</p>
                    </div>
                  );
                })}
                {topPerformers.length === 0 && <p className="px-5 py-8 text-[13px] text-muted-foreground italic">No members found.</p>}
              </div>
            </div>

            {/* Radar chart */}
            {showRadar && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiBarChartBoxLine /></div>
                  <h2 className="text-[14px] font-bold text-foreground">Radar Comparison</h2>
                </div>
                <div className="p-4">
                  <RadarChart members={filtered} />
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {filtered.slice(0, 5).map((m, i) => {
                      const colors = ["#0d9488", "#7c3aed", "#d97706", "#0284c7", "#dc2626"];
                      return (
                        <span key={m.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors[i] }} />
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
                <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiGroupLine /></div>
                <h2 className="text-[14px] font-bold text-foreground">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</h2>
              </div>
              <p className="text-[12px] text-muted-foreground hidden lg:block">Submissions · Attendance · Avg score</p>
            </div>
            {filtered.map((m, i) => <MemberRow key={m.id} member={m} rank={i + 1} />)}
            {filtered.length === 0 && (
              <div className="px-5 py-12 text-center"><RiGroupLine className="text-3xl text-muted-foreground/25 mx-auto mb-2" /><p className="text-[13.5px] text-muted-foreground">No members match your filters</p></div>
            )}
          </div>
        </>
      )}
    </div>
  );
}