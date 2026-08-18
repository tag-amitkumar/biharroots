import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
      <Link
        href="/"
        className="flex items-center gap-1 text-neutral-500 hover:text-brand-600 dark:text-neutral-400"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600" />

          {item.href ? (
            <Link
              href={item.href}
              className="text-neutral-500 hover:text-brand-600 dark:text-neutral-400"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
