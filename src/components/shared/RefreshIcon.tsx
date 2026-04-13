import React from 'react'
import { RiRefreshLine } from 'react-icons/ri'
import { cn } from '@/lib/utils'

interface RefreshIconProps {
  onClick: () => void
  loading: boolean
  className?: string
}

export default function RefreshIcon({ onClick, loading, className }: RefreshIconProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title="Refresh"
      className={cn(
        "w-9 h-9 rounded-xl border border-border flex items-center justify-center",
        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        "transition-all disabled:opacity-50",
        className
      )}
    >
      <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
    </button>
  )
}
