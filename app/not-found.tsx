import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 dark:bg-canvas-dark">
      <div className="max-w-md rounded-[32px] border border-neutral-200/70 bg-white p-10 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <SearchX className="h-8 w-8 text-neutral-400" />
        </div>

        <h1 className="mt-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
          Page not found
        </h1>

        <p className="mt-3 text-neutral-500">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        <Button asChild variant="primary" className="mt-8">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
