import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide transition",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-accent-dim text-primary",
        secondary: "border-border bg-muted text-muted-foreground",
        success: "border-success/20 bg-success-dim text-success",
        warning: "border-warning/20 bg-warning-dim text-warning",
        destructive: "border-destructive/20 bg-danger-dim text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
