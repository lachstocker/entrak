import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground",
        outline:
          "text-foreground border border-input",
        payment:
          "bg-blue-100 text-blue-800",
        delivery:
          "bg-green-100 text-green-800",
        reporting:
          "bg-purple-100 text-purple-800",
        compliance:
          "bg-teal-100 text-teal-800",
        termination:
          "bg-red-100 text-red-800",
        renewal:
          "bg-orange-100 text-orange-800",
        other:
          "bg-gray-100 text-gray-800",
        pending:
          "bg-yellow-100 text-yellow-800",
        completed:
          "bg-green-100 text-green-800",
        overdue:
          "bg-red-100 text-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
