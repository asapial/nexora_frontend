import { UserRole } from "@/app/dashboard/(commonRoute)/profile/profileInterface";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RiArrowRightLine, RiInformationLine } from "react-icons/ri";

export function CompletenessBar({ filled, total, role }: { filled: number; total: number; role: UserRole }) {
  const pct = Math.round((filled / total) * 100);
  const incomplete = total - filled;
  const color = pct === 100 ? "bg-teal-500" : pct >= 70 ? "bg-teal-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  const textColor = pct === 100 ? "text-teal-600 dark:text-teal-400" : pct >= 70 ? "text-teal-600 dark:text-teal-400" : pct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400";

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <RiInformationLine className="text-base text-muted-foreground/60" />
          <span className="text-[13px] font-bold text-foreground">Profile completeness</span>
        </div>
        <span className={cn("text-[14px] font-extrabold tabular-nums", textColor)}>
          {pct}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-2.5">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          {pct === 100
            ? "Your profile is fully complete 🎉"
            : incomplete === 1
            ? "1 field missing — nearly there!"
            : `${incomplete} fields incomplete`}
        </p>
        {pct < 100 && (
          <Link href="/dashboard/settings"
            className="text-[12px] font-semibold text-teal-600 dark:text-teal-400
                       hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-1">
            Complete <RiArrowRightLine className="text-xs" />
          </Link>
        )}
      </div>
    </div>
  );
}