export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-44 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3 w-24 rounded-full bg-muted/60" />
        <div className="h-4 w-3/4 rounded-full bg-muted/60" />
        <div className="h-3 w-full rounded-full bg-muted/40" />
        <div className="h-px bg-border/60 my-1" />
        <div className="h-9 rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}
