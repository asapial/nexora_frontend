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
import { TooltipProvider } from "@/components/ui/tooltip";


// ─── Types ─────────────────────────────────────────────────
type Accent = "teal" | "violet" | "amber" | "sky";
type Status = "healthy" | "at-risk" | "inactive";
type ActType = "submit" | "session" | "badge" | "alert";

interface StatCard { label: string; value: string; sub: string; up: boolean; icon: React.ReactNode; accent: Accent }
interface Cluster { name: string; members: number; health: number; next: string; status: Status }
interface Activity { action: string; subject: string; time: string; type: ActType }

// ─── Data ──────────────────────────────────────────────────
const STATS: StatCard[] = [
  { label: "Active Clusters", value: "8", sub: "+1 this month", up: true, icon: <RiFlaskLine />, accent: "teal" },
  { label: "Total Members", value: "124", sub: "+12 this week", up: true, icon: <RiGroupLine />, accent: "violet" },
  { label: "Sessions Held", value: "342", sub: "+18 this month", up: true, icon: <RiCalendarCheckLine />, accent: "amber" },
  { label: "Avg Health Score", value: "82", sub: "↓ 3 from last wk", up: false, icon: <RiBarChartBoxLine />, accent: "sky" },
];

const CLUSTERS: Cluster[] = [
  { name: "ML Research Group — 2025", members: 18, health: 94, next: "Tomorrow, 2 pm", status: "healthy" },
  { name: "NLP Reading Circle", members: 11, health: 67, next: "Wed, 4 pm", status: "at-risk" },
  { name: "Bootcamp Cohort B", members: 42, health: 88, next: "Fri, 10 am", status: "healthy" },
  { name: "Computer Vision Seminar", members: 9, health: 31, next: "Overdue", status: "inactive" },
];

const ACTIVITY: Activity[] = [
  { action: "Submitted", subject: "Sprint 8 — REST API Project", time: "5 min ago", type: "submit" },
  { action: "Session created", subject: "ML Research Group — Session 12", time: "1 hr ago", type: "session" },
  { action: "Badge awarded", subject: "5 Consecutive Submissions — Aisha K", time: "2 hr ago", type: "badge" },
  { action: "At-risk alert", subject: "NLP Reading Circle health dropped to 67", time: "3 hr ago", type: "alert" },
  { action: "Submitted", subject: "Attention Paper Review — Lucas M", time: "4 hr ago", type: "submit" },
  { action: "Session created", subject: "Bootcamp Cohort B — Sprint 9", time: "Yesterday", type: "session" },
];

// ─── Token maps ────────────────────────────────────────────
const ACCENT: Record<Accent, { icon: string; bg: string; border: string }> = {
  teal: { icon: "text-teal-600 dark:text-teal-400", bg: "bg-teal-100/70 dark:bg-teal-950/50", border: "border-teal-200/70 dark:border-teal-800/50" },
  violet: { icon: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100/70 dark:bg-violet-950/50", border: "border-violet-200/70 dark:border-violet-800/50" },
  amber: { icon: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100/70 dark:bg-amber-950/50", border: "border-amber-200/70 dark:border-amber-800/50" },
  sky: { icon: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100/70 dark:bg-sky-950/50", border: "border-sky-200/70 dark:border-sky-800/50" },
};

const STATUS_BADGE: Record<Status, string> = {
  healthy: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  "at-risk": "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50",
  inactive: "bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50",
};

const HEALTH_BAR = (h: number) =>
  h >= 80 ? "bg-teal-500"
    : h >= 50 ? "bg-amber-400"
      : "bg-red-400";

const ACT_STYLE: Record<ActType, { icon: React.ReactNode; cls: string }> = {
  submit: { icon: <RiCheckboxCircleLine />, cls: "text-teal-600 dark:text-teal-400   bg-teal-100/60 dark:bg-teal-950/40" },
  session: { icon: <RiCalendarCheckLine />, cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40" },
  badge: { icon: <RiTrophyLine />, cls: "text-amber-600 dark:text-amber-400  bg-amber-100/60 dark:bg-amber-950/40" },
  alert: { icon: <RiAlertLine />, cls: "text-red-500 dark:text-red-400      bg-red-100/60 dark:bg-red-950/30" },
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
export default function layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>

          {/* ══ Sticky top bar ═══════════════════════════════ */}
          <header className="
          sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2
          border-b border-border
          bg-background/80 backdrop-blur-md
          px-4
          transition-[width,height] ease-linear
          group-has-data-[collapsible=icon]/sidebar-wrapper:h-12
        ">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />

            <Separator
              orientation="vertical"
              className="mx-1 data-[orientation=vertical]:h-4 bg-border"
            />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[13.5px] font-semibold text-foreground">
                    Dashboard
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Greeting + pulse */}
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden sm:block text-[12.5px] text-muted-foreground">
                Good morning, Dr. Mehta
              </span>
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            </div>
          </header>
          <div>

            {children}

          </div>

        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}