"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiFlaskLine, RiRefreshLine, RiAlertLine,
  RiTimeLine, RiGroupLine, RiCalendarLine, RiArchiveLine,
  RiCheckLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminPlatformApi } from "@/lib/api";
import { toast } from "sonner";

const HEALTH_CFG: Record<string, { label: string; dot: string; cls: string }> = {
  HEALTHY:  { label: "Healthy",  dot: "bg-teal-500",  cls: "text-teal-700 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-950/40 border-teal-200/60" },
  AT_RISK:  { label: "At Risk",  dot: "bg-amber-500", cls: "text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/60" },
  INACTIVE: { label: "Inactive", dot: "bg-rose-500",  cls: "text-rose-700 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/60" },
};

type Cluster = {
  id: string;
  name: string;
  healthStatus?: string;
  healthScore?: number;
  _count: { members: number; sessions: number };
  teacher?: { user: { name: string } };
  lastSession?: { scheduledAt: string; status: string } | null;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_120px_80px_80px_100px_80px] gap-4 px-5 py-4 border-b border-border/60 animate-pulse items-center">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-3 bg-muted rounded" />)}
    </div>
  );
}

function HealthScore({ score }: { score?: number }) {
  const v = score ?? 0;
  const color = v >= 70 ? "bg-teal-500" : v >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[60px]">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${v}%` }} />
      </div>
      <span className="text-[12px] font-semibold tabular-nums text-foreground">{v}</span>
    </div>
  );
}

export default function ClusterOversightPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthFilter, setHealthFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPlatformApi.getClusters({ health: healthFilter || undefined });
      const raw = r.data;
      setClusters(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, [healthFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = clusters.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher?.user?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:    clusters.length,
    healthy:  clusters.filter(c => c.healthStatus === "HEALTHY").length,
    atRisk:   clusters.filter(c => c.healthStatus === "AT_RISK").length,
    inactive: clusters.filter(c => c.healthStatus === "INACTIVE").length,
  };

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-sky-500 dark:text-sky-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Cluster Oversight</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Monitor cluster health, activity, and session frequency</p>
          </div>
          <button onClick={load}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Clusters", val: stats.total,    col: "text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60", icon: <RiFlaskLine /> },
          { label: "Healthy",        val: stats.healthy,  col: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60", icon: <RiCheckLine /> },
          { label: "At Risk",        val: stats.atRisk,   col: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60", icon: <RiAlertLine /> },
          { label: "Inactive",       val: stats.inactive, col: "text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/40 border-rose-200/60", icon: <RiArchiveLine /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", s.col)}>{s.icon}</div>
            <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : s.val}</p>
            <p className="text-[12px] font-medium text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clusters or teachers…"
            className="w-full h-10 pl-4 pr-4 rounded-xl text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          {[
            { val: "", label: "All" },
            { val: "HEALTHY", label: "Healthy" },
            { val: "AT_RISK", label: "At Risk" },
            { val: "INACTIVE", label: "Inactive" },
          ].map(f => (
            <button key={f.val} onClick={() => setHealthFilter(f.val)}
              className={cn("h-9 px-3 rounded-xl text-[12px] font-semibold border transition-all",
                healthFilter === f.val ? "bg-sky-600 text-white border-sky-600" : "border-border text-muted-foreground hover:bg-muted/40")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_80px_80px_100px_80px] gap-4 px-5 py-3 border-b border-border bg-muted/20">
          {["Cluster", "Teacher", "Members", "Sessions", "Health", "Last Session"].map(h => (
            <p key={h} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : filtered.length === 0
          ? (
            <div className="py-16 text-center">
              <RiFlaskLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[13.5px] font-medium text-muted-foreground">No clusters found</p>
            </div>
          )
          : filtered.map(c => {
            const hcfg = HEALTH_CFG[c.healthStatus ?? "HEALTHY"] ?? HEALTH_CFG.HEALTHY;
            return (
              <div key={c.id} className="grid grid-cols-[1fr_140px_80px_80px_100px_80px] gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors items-center">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{c.name}</p>
                </div>
                <p className="text-[12.5px] text-muted-foreground truncate">{c.teacher?.user?.name ?? "—"}</p>
                <div className="flex items-center gap-1">
                  <RiGroupLine className="text-muted-foreground text-xs" />
                  <p className="text-[13px] font-semibold tabular-nums text-foreground">{c._count.members}</p>
                </div>
                <div className="flex items-center gap-1">
                  <RiCalendarLine className="text-muted-foreground text-xs" />
                  <p className="text-[13px] font-semibold tabular-nums text-foreground">{c._count.sessions}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={cn("text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full border w-fit flex items-center gap-1", hcfg.cls)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", hcfg.dot)} />
                    {hcfg.label}
                  </span>
                  <HealthScore score={c.healthScore} />
                </div>
                <div className="min-w-0">
                  {c.lastSession ? (
                    <div className="flex items-center gap-1">
                      <RiTimeLine className="text-muted-foreground text-xs shrink-0" />
                      <p className="text-[11px] text-muted-foreground truncate">{fmtDate(c.lastSession.scheduledAt)}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/40">Never</p>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {!loading && (
        <p className="text-[12px] text-muted-foreground text-center">
          Showing {filtered.length} of {clusters.length} clusters
        </p>
      )}
    </div>
  );
}
