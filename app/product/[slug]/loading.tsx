export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-[32px] bg-neutral-200 dark:bg-neutral-800" />

        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-1/3 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-20 w-full animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-12 w-1/3 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
