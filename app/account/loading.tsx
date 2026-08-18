export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800"
          />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}
