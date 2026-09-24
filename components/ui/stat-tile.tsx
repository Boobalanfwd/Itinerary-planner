import * as React from "react"
import { cn } from "@/lib/utils"

export type StatTileTone = "orange" | "mint" | "lavender" | "peach" | "neutral"
export type StatTileSize = "sm" | "md" | "lg"

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  subvalue?: React.ReactNode
  icon?: React.ReactNode
  tone?: StatTileTone
  size?: StatTileSize
}

const toneStyles: Record<
  StatTileTone,
  { container: string; label: string; value: string; icon: string }
> = {
  orange: {
    container: "bg-primary-soft/70 border-primary/20",
    label: "text-primary-soft-foreground/80",
    value: "text-primary-soft-foreground",
    icon: "text-primary",
  },
  mint: {
    container: "bg-tag-mint/70 border-accent/20",
    label: "text-tag-mint-foreground/80",
    value: "text-tag-mint-foreground",
    icon: "text-accent",
  },
  lavender: {
    container: "bg-tag-lavender/70 border-tag-lavender-foreground/20",
    label: "text-tag-lavender-foreground/80",
    value: "text-tag-lavender-foreground",
    icon: "text-tag-lavender-foreground",
  },
  peach: {
    container: "bg-tag-peach/70 border-tag-peach-foreground/20",
    label: "text-tag-peach-foreground/80",
    value: "text-tag-peach-foreground",
    icon: "text-tag-peach-foreground",
  },
  neutral: {
    container: "bg-muted/60 border-border/70",
    label: "text-muted-foreground",
    value: "text-foreground",
    icon: "text-muted-foreground",
  },
}

const sizeStyles: Record<
  StatTileSize,
  { container: string; label: string; icon: string; value: string }
> = {
  sm: {
    container: "p-2.5 sm:p-3 rounded-2xl",
    label: "text-[10px]",
    icon: "size-3.5",
    value: "text-base sm:text-lg",
  },
  md: {
    container: "p-3 sm:p-3.5 rounded-2xl",
    label: "text-[10px] sm:text-[11px]",
    icon: "size-4",
    value: "text-lg sm:text-xl",
  },
  lg: {
    container: "p-4 rounded-2xl",
    label: "text-xs",
    icon: "size-4.5",
    value: "text-xl sm:text-2xl",
  },
}

export function StatTile({
  label,
  value,
  subvalue,
  icon,
  tone = "neutral",
  size = "md",
  className,
  ...props
}: StatTileProps) {
  const styles = toneStyles[tone]
  const sizes = sizeStyles[size]

  return (
    <div
      className={cn(
        "flex flex-col justify-between border transition-all duration-200 min-w-0 overflow-hidden",
        styles.container,
        sizes.container,
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-1.5 mb-1 min-w-0">
        <span
          className={cn(
            "font-bold uppercase tracking-wider truncate",
            sizes.label,
            styles.label
          )}
        >
          {label}
        </span>
        {icon && (
          <span className={cn("shrink-0", sizes.icon, styles.icon)}>
            {icon}
          </span>
        )}
      </div>

      <div
        className={cn(
          "font-extrabold tracking-tight min-w-0 w-full overflow-hidden text-ellipsis leading-tight pt-0.5",
          sizes.value,
          styles.value
        )}
      >
        {value}
      </div>

      {subvalue && (
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {subvalue}
        </div>
      )}
    </div>
  )
}
