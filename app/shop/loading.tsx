export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 h-10 w-48 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="h-96 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" />

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-96 animate-pulse rounded-[28px] bg-neutral-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
