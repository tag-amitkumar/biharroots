import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <Skeleton className="h-72 w-full rounded-none" />

      <div className="space-y-4 p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
