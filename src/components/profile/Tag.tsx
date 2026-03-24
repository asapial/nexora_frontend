

export function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-semibold
                     bg-muted/60 text-foreground/70 border border-border">
      {label}
    </span>
  );
}