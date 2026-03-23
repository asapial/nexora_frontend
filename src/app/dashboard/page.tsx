import Link from "next/link";
import {
  RiArrowRightLine,
  RiFlaskLine,
  RiGroupLine,
  RiCalendarCheckLine,
  RiBarChartBoxLine,
  RiTrophyLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiSparklingFill,
  RiBook2Line,
} from "react-icons/ri";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────
type Accent  = "teal" | "violet" | "amber" | "sky";
type Status  = "healthy" | "at-risk" | "inactive";
type ActType = "submit" | "session" | "badge" | "alert";

interface StatCard  { label: string; value: string; sub: string; up: boolean; icon: React.ReactNode; accent: Accent }
interface Cluster   { name: string; members: number; health: number; next: string; status: Status }
interface Activity  { action: string; subject: string; time: string; type: ActType }

// ─── Data ──────────────────────────────────────────────────
const STATS: StatCard[] = [
  { label: "Active Clusters",  value: "8",   sub: "+1 this month",   up: true,  icon: <RiFlaskLine />,         accent: "teal"   },
  { label: "Total Members",    value: "124", sub: "+12 this week",   up: true,  icon: <RiGroupLine />,         accent: "violet" },
  { label: "Sessions Held",    value: "342", sub: "+18 this month",  up: true,  icon: <RiCalendarCheckLine />, accent: "amber"  },
  { label: "Avg Health Score", value: "82",  sub: "↓ 3 from last wk",up: false, icon: <RiBarChartBoxLine />,   accent: "sky"    },
];

const CLUSTERS: Cluster[] = [
  { name: "ML Research Group — 2025",   members: 18, health: 94, next: "Tomorrow, 2 pm",  status: "healthy"  },
  { name: "NLP Reading Circle",          members: 11, health: 67, next: "Wed, 4 pm",        status: "at-risk"  },
  { name: "Bootcamp Cohort B",           members: 42, health: 88, next: "Fri, 10 am",       status: "healthy"  },
  { name: "Computer Vision Seminar",     members: 9,  health: 31, next: "Overdue",           status: "inactive" },
];

const ACTIVITY: Activity[] = [
  { action: "Submitted",       subject: "Sprint 8 — REST API Project",           time: "5 min ago",  type: "submit"  },
  { action: "Session created", subject: "ML Research Group — Session 12",         time: "1 hr ago",   type: "session" },
  { action: "Badge awarded",   subject: "5 Consecutive Submissions — Aisha K",    time: "2 hr ago",   type: "badge"   },
  { action: "At-risk alert",   subject: "NLP Reading Circle health dropped to 67",time: "3 hr ago",   type: "alert"   },
  { action: "Submitted",       subject: "Attention Paper Review — Lucas M",        time: "4 hr ago",   type: "submit"  },
  { action: "Session created", subject: "Bootcamp Cohort B — Sprint 9",            time: "Yesterday",  type: "session" },
];

// ─── Token maps ────────────────────────────────────────────
const ACCENT: Record<Accent, { icon: string; bg: string; border: string }> = {
  teal:   { icon: "text-teal-600 dark:text-teal-400",     bg: "bg-teal-100/70 dark:bg-teal-950/50",    border: "border-teal-200/70 dark:border-teal-800/50"   },
  violet: { icon: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100/70 dark:bg-violet-950/50", border: "border-violet-200/70 dark:border-violet-800/50" },
  amber:  { icon: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100/70 dark:bg-amber-950/50",  border: "border-amber-200/70 dark:border-amber-800/50"   },
  sky:    { icon: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-100/70 dark:bg-sky-950/50",      border: "border-sky-200/70 dark:border-sky-800/50"       },
};

const STATUS_BADGE: Record<Status, string> = {
  healthy:  "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  "at-risk":"bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50",
  inactive: "bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50",
};

const HEALTH_BAR = (h: number) =>
  h >= 80 ? "bg-teal-500"
  : h >= 50 ? "bg-amber-400"
  : "bg-red-400";

const ACT_STYLE: Record<ActType, { icon: React.ReactNode; cls: string }> = {
  submit:  { icon: <RiCheckboxCircleLine />, cls: "text-teal-600 dark:text-teal-400   bg-teal-100/60 dark:bg-teal-950/40"     },
  session: { icon: <RiCalendarCheckLine />,  cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40" },
  badge:   { icon: <RiTrophyLine />,         cls: "text-amber-600 dark:text-amber-400  bg-amber-100/60 dark:bg-amber-950/40"    },
  alert:   { icon: <RiAlertLine />,          cls: "text-red-500 dark:text-red-400      bg-red-100/60 dark:bg-red-950/30"        },
};

// ─── StatCard ──────────────────────────────────────────────
function StatCardItem({ label, value, sub, up, icon, accent }: StatCard) {
  const a = ACCENT[accent];
  return (
    <div className="
      rounded-2xl border border-border bg-card p-5
      hover:shadow-md hover:shadow-black/[0.04] dark:hover:shadow-black/20
      transition-shadow duration-200
    ">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-[18px] border",
          a.bg, a.border, a.icon
        )}>
          {icon}
        </div>
        <span className={cn(
          "text-[11.5px] font-semibold px-2 py-0.5 rounded-full border",
          up
            ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/50"
            : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/50"
        )}>
          {sub}
        </span>
      </div>

      <p className="text-[2rem] font-extrabold tabular-nums leading-none text-foreground mb-1">
        {value}
      </p>
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────
export default function DashboardPage() {
  return (
<>
        {/* ══ Page content ═════════════════════════════════ */}
        <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6">

          {/* ─ Page heading ─ */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
              <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
                Overview
              </span>
            </div>
            <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">
              Your Nexora Dashboard
            </h1>
          </div>

          {/* ─ Stat cards ─ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATS.map((s) => <StatCardItem key={s.label} {...s} />)}
          </div>

          {/* ─ Main two-col grid ─ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

            {/* ── Clusters panel ── */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-[14.5px] font-bold text-foreground leading-none mb-0.5">My Clusters</h2>
                  <p className="text-[12px] text-muted-foreground">Health scores &amp; next sessions</p>
                </div>
                <Link
                  href="/dashboard/clusters"
                  className="
                    inline-flex items-center gap-1 text-[12.5px] font-semibold
                    text-teal-600 dark:text-teal-400
                    hover:text-teal-700 dark:hover:text-teal-300
                    transition-colors
                  "
                >
                  View all <RiArrowRightLine />
                </Link>
              </div>

              {/* Rows */}
              <div className="flex flex-col divide-y divide-border">
                {CLUSTERS.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors duration-100"
                  >
                    {/* Icon */}
                    <div className="
                      w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-base
                      bg-teal-100/60 dark:bg-teal-950/40
                      border border-teal-200/60 dark:border-teal-800/40
                      text-teal-600 dark:text-teal-400
                    ">
                      <RiFlaskLine />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[13.5px] font-semibold text-foreground truncate">{c.name}</p>
                        <span className={cn(
                          "flex-shrink-0 text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                          STATUS_BADGE[c.status]
                        )}>
                          {c.status === "at-risk" ? "At Risk" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </div>

                      {/* Health bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", HEALTH_BAR(c.health))}
                            style={{ width: `${c.health}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-bold tabular-nums text-foreground/60 w-7 text-right flex-shrink-0">
                          {c.health}
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[11.5px] font-semibold text-muted-foreground">{c.members} members</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                        <RiTimeLine className="text-xs" />{c.next}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Activity feed ── */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                <div>
                  <h2 className="text-[14.5px] font-bold text-foreground leading-none mb-0.5">Recent Activity</h2>
                  <p className="text-[12px] text-muted-foreground">Across all clusters</p>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-col divide-y divide-border flex-1">
                {ACTIVITY.map((item, i) => {
                  const s = ACT_STYLE[item.type];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors duration-100"
                    >
                      <div className={cn(
                        "mt-0.5 w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-sm",
                        s.cls
                      )}>
                        {s.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] leading-snug text-foreground">
                          <span className="font-semibold">{item.action}</span>
                          <span className="text-muted-foreground"> — {item.subject}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground/55 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer link */}
              <div className="px-5 py-3 border-t border-border flex-shrink-0">
                <Link
                  href="/dashboard/activity"
                  className="
                    flex items-center gap-1.5 text-[12.5px] font-semibold
                    text-teal-600 dark:text-teal-400
                    hover:text-teal-700 dark:hover:text-teal-300 transition-colors
                  "
                >
                  View all activity <RiArrowRightLine className="text-sm" />
                </Link>
              </div>
            </div>

          </div>

          {/* ─ Quick actions ─ */}
          <div>
            <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-3">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { label: "New Cluster",         href: "/dashboard/clusters/new",          icon: <RiFlaskLine />,         accent: "teal"   },
                { label: "New Session",         href: "/dashboard/sessions/new",          icon: <RiCalendarCheckLine />, accent: "violet" },
                { label: "Upload Resource",     href: "/dashboard/resources/upload",      icon: <RiBook2Line />,         accent: "amber"  },
                { label: "Issue Certificates",  href: "/dashboard/certificates/issue",    icon: <RiTrophyLine />,        accent: "sky"    },
              ] as { label: string; href: string; icon: React.ReactNode; accent: Accent }[]).map((action) => {
                const a = ACCENT[action.accent];
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="
                      group flex flex-col items-center gap-3 py-5 px-3
                      rounded-2xl border border-border bg-card text-center
                      hover:border-teal-300/60 dark:hover:border-teal-700/50
                      hover:bg-muted/40
                      hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.03] dark:hover:shadow-black/15
                      transition-all duration-200
                    "
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-[18px] border",
                      "group-hover:scale-110 transition-transform duration-200",
                      a.bg, a.border, a.icon
                    )}>
                      {action.icon}
                    </div>
                    <span className="text-[12.5px] font-semibold text-foreground/75 leading-snug">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
</>
  );
}