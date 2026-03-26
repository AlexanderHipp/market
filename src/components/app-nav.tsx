"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  const path = usePathname();
  const home = path === "/";
  const framing = path.startsWith("/framing");

  return (
    <nav className="flex gap-6 text-sm border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-8">
      <Link
        href="/"
        className={
          home
            ? "font-medium text-neutral-900 dark:text-neutral-100"
            : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        }
      >
        Competitor deep-dive
      </Link>
      <Link
        href="/framing"
        className={
          framing
            ? "font-medium text-neutral-900 dark:text-neutral-100"
            : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        }
      >
        Market framing
      </Link>
    </nav>
  );
}
