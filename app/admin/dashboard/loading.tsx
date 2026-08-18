export default function Loading() {
  return (
    <div className="p-8">
      <div className="mb-8 h-10 w-64 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />

      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800"
          />
        ))}
      </div>

      <div className="mt-10 h-64 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}
