"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary-container text-on-primary-container font-headline uppercase tracking-widest hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,85,85,0.3)]",
        destructive:
          "bg-destructive-container text-destructive hover:bg-destructive-container/80",
        outline:
          "ghost-border bg-transparent text-on-surface hover:bg-surface-bright hover:text-on-surface",
        secondary:
          "bg-secondary-container text-secondary hover:bg-secondary-container/80",
        ghost: "hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-secondary-container text-secondary hover:bg-secondary-container/80",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-10 py-5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
