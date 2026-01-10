import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        warning: "border-transparent bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
        // Industrial Semantic Variants
        pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        rejected: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        blocked: "bg-rose-500/20 text-rose-500 border-rose-500/40",
        under_review: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        in_analysis: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
