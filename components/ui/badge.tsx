import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a&]:hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-muted",
        ghost:
          "[a&]:hover:bg-muted [a&]:hover:text-foreground",
        link:
          "text-primary underline-offset-4 [a&]:hover:underline",
        "tag-lavender":
          "bg-tag-lavender text-tag-lavender-foreground border-transparent font-medium",
        "tag-mint":
          "bg-tag-mint text-tag-mint-foreground border-transparent font-medium",
        "tag-peach":
          "bg-tag-peach text-tag-peach-foreground border-transparent font-medium",
        new:
          "bg-indigo text-indigo-foreground border-transparent font-bold tracking-wider uppercase text-[10px] px-2 py-0.5 shadow-soft-xs",
        date:
          "bg-tag-date text-tag-date-foreground border-transparent font-semibold px-2.5 py-1",
        "date-gray":
          "bg-muted text-muted-foreground border-transparent font-medium px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
