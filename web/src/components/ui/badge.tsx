"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-semibold font-label uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary-container/20 text-primary border border-primary/20",
        secondary:
          "bg-secondary-container text-secondary border border-secondary/20",
        destructive:
          "bg-destructive-container text-destructive border border-destructive/20",
        outline: "text-on-surface ghost-border",
        success:
          "bg-secondary-container text-secondary border border-secondary/20",
        accent:
          "bg-surface-container-high text-on-surface-variant border border-outline-variant/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
