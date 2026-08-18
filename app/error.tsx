"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 dark:bg-canvas-dark">
      <div className="max-w-md rounded-[32px] border border-neutral-200/70 bg-white p-10 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="mt-6 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
          Something went wrong
        </h1>

        <p className="mt-3 text-neutral-500">
          An unexpected error occurred. Please try again.
        </p>

        <Button onClick={reset} variant="primary" className="mt-8">
          Try Again
        </Button>
      </div>
    </div>
  );
}
