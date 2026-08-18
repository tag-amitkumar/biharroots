import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
