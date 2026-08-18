import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
        secondary: "border-transparent bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
        outline: "border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200",
        success: "border-transparent bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
        warning: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        destructive: "border-transparent bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
