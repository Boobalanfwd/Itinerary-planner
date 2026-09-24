import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface AvatarItem {
  id?: string
  name: string
  image?: string
  fallback?: string
}

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: AvatarItem[]
  max?: number
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "size-6 text-[10px] ring-2 ring-card -ml-1.5 first:ml-0",
  md: "size-8 text-xs ring-2 ring-card -ml-2 first:ml-0",
  lg: "size-10 text-sm ring-2 ring-card -ml-2.5 first:ml-0",
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  className,
  ...props
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div
      className={cn("inline-flex items-center select-none", className)}
      {...props}
    >
      {visible.map((item, idx) => {
        const initials =
          item.fallback ||
          item.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ||
          "U"

        return (
          <Avatar
            key={item.id || idx}
            className={cn(sizeClasses[size], "transition-transform hover:z-10 hover:scale-110")}
          >
            {item.image && <AvatarImage src={item.image} alt={item.name} />}
            <AvatarFallback className="bg-muted text-foreground font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        )
      })}

      {remaining > 0 && (
        <div
          className={cn(
            sizeClasses[size],
            "flex items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground font-semibold"
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
