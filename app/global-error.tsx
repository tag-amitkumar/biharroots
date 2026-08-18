"use client";

import { useEffect } from "react";

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
    <html lang="en">
      <body className="bg-canvas antialiased">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md rounded-[32px] border border-neutral-200 bg-white p-10 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <span className="text-3xl">⚠️</span>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold text-neutral-900">
              Something went wrong
            </h1>

            <p className="mt-3 text-neutral-500">
              A critical error occurred. Please try again.
            </p>

            <button
              onClick={reset}
              className="mt-8 rounded-full bg-brand-600 px-8 py-3 font-bold text-white transition hover:bg-brand-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
