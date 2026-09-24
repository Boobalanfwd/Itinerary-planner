import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft-xs active:scale-[0.98] rounded-full",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft active:scale-[0.98] rounded-full font-semibold",
        soft:
          "bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft/80 active:scale-[0.98] rounded-full font-semibold",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-soft active:scale-[0.98] rounded-full font-semibold",
        "accent-soft":
          "bg-accent-soft text-accent-soft-foreground hover:bg-accent-soft/80 active:scale-[0.98] rounded-full font-semibold",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft-xs active:scale-[0.98] rounded-full",
        outline:
          "border border-border bg-card shadow-soft-xs hover:bg-muted text-foreground active:scale-[0.98] rounded-full",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full",
        ghost:
          "hover:bg-muted hover:text-foreground rounded-full",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto rounded-none",
        "icon-round":
          "rounded-full border border-border bg-card hover:bg-muted text-foreground p-0 shadow-soft-xs active:scale-95",
      },
      size: {
        default: "h-10 px-5 py-2",
        xs: "h-7 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3.5 text-xs",
        lg: "h-12 px-7 text-base font-semibold",
        pill: "h-11 px-6 text-sm font-semibold rounded-full",
        icon: "size-9 rounded-xl",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-11 rounded-full",
        "icon-round": "size-10 rounded-full",
        "icon-round-sm": "size-8 rounded-full",
        "icon-round-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
