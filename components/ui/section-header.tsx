import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  accentWord?: string
  subtitle?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    icon?: React.ReactNode
  }
}

export function SectionHeader({
  title,
  accentWord,
  subtitle,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn("flex flex-wrap items-end justify-between gap-4 mb-5", className)}
      {...props}
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}{" "}
          {accentWord && (
            <span className="text-accent">{accentWord}</span>
          )}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {action && (
        action.href ? (
          <Button
            asChild
            variant="soft"
            size="sm"
            className="text-xs font-semibold px-4 h-8"
          >
            <Link href={action.href} className="flex items-center gap-1.5">
              <span>{action.label}</span>
              {action.icon}
            </Link>
          </Button>
        ) : (
          <Button
            variant="soft"
            size="sm"
            onClick={action.onClick}
            className="text-xs font-semibold px-4 h-8 flex items-center gap-1.5"
          >
            <span>{action.label}</span>
            {action.icon}
          </Button>
        )
      )}
    </div>
  )
}
