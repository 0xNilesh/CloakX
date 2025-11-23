import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--badge-blue-bg))] text-[hsl(var(--badge-blue-text))] border-0",
        secondary: "bg-secondary text-secondary-foreground border-0",
        destructive: "bg-destructive/10 text-destructive border-0",
        outline: "border border-border text-foreground bg-card",
        purple: "bg-[hsl(258,90%,95%)] text-[hsl(var(--badge-purple))] border-0",
        pink: "bg-[hsl(330,81%,95%)] text-[hsl(var(--badge-pink))] border-0",
        orange: "bg-[hsl(25,95%,95%)] text-[hsl(var(--badge-orange))] border-0",
        green: "bg-[hsl(142,71%,95%)] text-[hsl(var(--badge-green))] border-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
