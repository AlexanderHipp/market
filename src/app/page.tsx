import { Suspense } from "react";
import HomeContent from "./home-content";

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white dark:bg-neutral-950">
          <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-neutral-500">
            Loading…
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
