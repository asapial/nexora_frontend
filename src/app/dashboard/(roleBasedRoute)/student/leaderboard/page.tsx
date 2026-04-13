"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiTrophyLine, RiMedalLine, RiSparklingFill, RiShieldCheckLine,
  RiEyeOffLine, RiEyeLine, RiGroupLine,
  RiCalendarCheckLine, RiLoader4Line, RiUserLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { leaderboardApi } from "@/lib/api";
import { toast } from "sonner";
import RefreshIcon from "@/components/shared/RefreshIcon";

type Period = "weekly" | "all-time";

type Entry = {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  taskScore: number;
  taskCount: number;
  attendanceCount: number;
  composite: number;
};

const MEDAL_COLOR: Record<number, string> = {
  1: "text-amber-400",
  2: "text-zinc-400",
  3: "text-orange-400",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className={cn("text-lg", MEDAL_COLOR[rank])}>
        <RiMedalLine />
      </span>
    );
  }
  return (
    <span className="text-[12px] font-bold text-muted-foreground tabular-nums w-6 text-center">
      {rank}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/60 animate-pulse">
      <div className="w-6 h-4 bg-muted rounded" />
      <div className="w-9 h-9 rounded-full bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-muted rounded w-40" />
        <div className="h-2.5 bg-muted rounded w-24" />
      </div>
      <div className="w-12 h-4 bg-muted rounded" />
      <div className="w-12 h-4 bg-muted rounded" />
      <div className="w-14 h-5 bg-muted rounded-full" />
    </div>
  );
}

export default function StudentLeaderboardPage() {
  const [period, setPeriod] = useState<Period>("all-time");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [myEntry, setMyEntry] = useState<Entry | null>(null);
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [optLoading, setOptLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lb, optStatus] = await Promise.all([
        leaderboardApi.get({ period }),
        leaderboardApi.getOptIn(),
      ]);
      setEntries(lb.data?.entries ?? []);
      setMyEntry(lb.data?.myEntry ?? null);
      setOptIn(optStatus.data?.leaderboardOptIn ?? false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const toggleOptIn = async () => {
    setOptLoading(true);
    try {
      if (optIn) {
        await leaderboardApi.optOut();
        setOptIn(false);
        toast.success("You've opted out of the leaderboard");
      } else {
        await leaderboardApi.optIn();
        setOptIn(true);
        toast.success("You're now on the leaderboard!");
      }
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setOptLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-amber-500 dark:text-amber-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Student</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Leaderboard</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Cluster rankings based on task scores and attendance</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <RefreshIcon onClick={load} loading={loading} />
          <button
            onClick={toggleOptIn}
            disabled={optLoading}
            className={cn(
              "h-9 px-4 rounded-xl text-[12.5px] font-semibold flex items-center gap-1.5 border transition-all",
              optIn
                ? "border-rose-300/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100/60"
                : "border-teal-300/50 bg-teal-50/60 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100/60"
            )}
          >
            {optLoading ? <RiLoader4Line className="animate-spin" /> : optIn ? <RiEyeOffLine /> : <RiEyeLine />}
            {optIn ? "Opt out" : "Opt in"}
          </button>
        </div>
      </div>

      {/* My rank card */}
      {myEntry && (
        <div className="rounded-2xl border border-amber-200/50 dark:border-amber-800/40 bg-gradient-to-r from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center">
            <RiTrophyLine className="text-2xl text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Your rank</p>
            <p className="text-[1.25rem] font-extrabold text-foreground leading-none">#{myEntry.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground mb-0.5">Composite</p>
            <p className="text-[1.25rem] font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{myEntry.composite}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground mb-0.5">Tasks</p>
            <p className="text-[1.25rem] font-extrabold tabular-nums text-foreground">{myEntry.taskScore}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground mb-0.5">Attendance</p>
            <p className="text-[1.25rem] font-extrabold tabular-nums text-foreground">{myEntry.attendanceCount}</p>
          </div>
        </div>
      )}

      {/* Period toggle */}
      <div className="flex items-center gap-2">
        {(["all-time", "weekly"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "h-8 px-4 rounded-xl text-[12px] font-semibold border transition-all",
              period === p
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:bg-muted/40"
            )}
          >
            {p === "all-time" ? "All time" : "This week"}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-muted-foreground">{entries.length} participants</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[36px_1fr_80px_80px_80px] gap-3 px-5 py-3 border-b border-border bg-muted/20">
          {["#", "Student", "Task Score", "Attendance", "Score"].map((h) => (
            <p key={h} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : entries.length === 0
          ? (
            <div className="py-16 text-center">
              <RiGroupLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[13.5px] font-medium text-muted-foreground">No entries yet</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Join clusters and complete tasks to appear here</p>
            </div>
          )
          : entries.map((e) => (
            <div
              key={e.userId}
              className={cn(
                "grid grid-cols-[36px_1fr_80px_80px_80px] gap-3 px-5 py-3.5 border-b border-border/60 last:border-0 items-center",
                e.rank <= 3 && "bg-amber-50/20 dark:bg-amber-950/10",
                myEntry?.userId === e.userId && "bg-teal-50/30 dark:bg-teal-950/10 ring-1 ring-teal-300/30 dark:ring-teal-700/30"
              )}
            >
              <RankBadge rank={e.rank} />
              <div className="flex items-center gap-2.5 min-w-0">
                {e.image ? (
                  <img src={e.image} alt={e.name} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-border" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <RiUserLine className="text-muted-foreground text-sm" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {e.name}
                    {myEntry?.userId === e.userId && (
                      <span className="ml-1.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-950/50 px-1.5 py-0.5 rounded-full">You</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{e.taskCount} tasks graded</p>
                </div>
              </div>
              <p className="text-[13px] font-semibold tabular-nums text-foreground">{e.taskScore}</p>
              <div className="flex items-center gap-1">
                <RiCalendarCheckLine className="text-teal-500 text-xs" />
                <p className="text-[13px] font-semibold tabular-nums text-foreground">{e.attendanceCount}</p>
              </div>
              <div className={cn(
                "text-[12px] font-bold tabular-nums px-2 py-0.5 rounded-full w-fit",
                e.rank === 1 && "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
                e.rank === 2 && "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40",
                e.rank === 3 && "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40",
                e.rank > 3 && "text-foreground bg-muted/60"
              )}>
                {e.composite}
              </div>
            </div>
          ))}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20 text-[12px] text-muted-foreground">
        <RiShieldCheckLine className="text-teal-500 text-sm shrink-0" />
        <p>Your privacy is protected. Opt out at any time to hide your name from all leaderboards. Score = 60% avg task score + 40% attendance (max 10 sessions).</p>
      </div>
    </div>
  );
}
