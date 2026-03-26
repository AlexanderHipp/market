"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Download,
  Link2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AppNav } from "@/components/app-nav";
import {
  getBrief,
  updateBriefTracking,
  deleteBrief,
  exportBriefAsJson,
  buildDeepDiveHref,
  type MarketBrief,
} from "@/lib/market-brief";

export function BriefDetail({ id }: { id: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [brief, setBrief] = useState<MarketBrief | null>(null);
  const [copyFlash, setCopyFlash] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setBrief(getBrief(id) ?? null);
    });
  }, [id]);

  const handleTracking = () => {
    if (!brief) return;
    const next = !brief.trackingEnabled;
    const updated = updateBriefTracking(brief.id, next);
    if (updated) setBrief(updated);
  };

  const handleDelete = () => {
    if (!brief) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this market brief? This cannot be undone.")
    ) {
      return;
    }
    deleteBrief(brief.id);
    router.push("/framing");
  };

  const handleExport = () => {
    if (!brief) return;
    const blob = new Blob([exportBriefAsJson(brief)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `market-brief-${brief.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined" || !brief) return;
    const url = `${window.location.origin}/framing/${brief.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 2000);
    } catch {
      setCopyFlash(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-2xl px-4 py-16 flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading…
        </div>
      </main>
    );
  }

  if (brief === null) {
    return (
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <AppNav />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This brief was not found. It may have been deleted or this link is
            for another browser or device.
          </p>
          <Link
            href="/framing"
            className="mt-4 inline-block text-sm text-neutral-900 underline dark:text-neutral-100"
          >
            Back to Market framing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <AppNav />

        <div className="mb-8">
          <Link
            href="/framing"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Market framing
          </Link>
        </div>

        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {brief.subject}
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Updated{" "}
              {new Date(brief.updatedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link href={buildDeepDiveHref(brief)} className="gap-2">
                <Search className="h-4 w-4" />
                Run competitor deep-dive
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            type="button"
            variant={brief.trackingEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleTracking}
          >
            Track this market: {brief.trackingEnabled ? "On" : "Off"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
            <Link2 className="h-4 w-4 mr-1.5" />
            {copyFlash ? "Copied" : "Copy link"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-red-700 dark:text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>

        <p className="text-xs text-neutral-500 mb-8">
          Copy link works on this device where the brief is saved. Export JSON
          to move it elsewhere.
        </p>

        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
              Original input
            </h2>
            <p className="text-sm text-neutral-800 dark:text-neutral-200">
              {brief.rawInput}
            </p>
            {brief.refinedInput && (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Refined: {brief.refinedInput}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {brief.interpretationKind}
            </Badge>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
              Market lens
            </h2>
            <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
              {brief.marketLens}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Direct alternatives
                </p>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-neutral-800 dark:text-neutral-200 space-y-1">
                  {brief.directAlternatives.length === 0 ? (
                    <li className="list-none text-neutral-500">—</li>
                  ) : (
                    brief.directAlternatives.map((a) => <li key={a}>{a}</li>)
                  )}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Adjacent alternatives
                </p>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-neutral-800 dark:text-neutral-200 space-y-1">
                  {brief.adjacentAlternatives.length === 0 ? (
                    <li className="list-none text-neutral-500">—</li>
                  ) : (
                    brief.adjacentAlternatives.map((a) => <li key={a}>{a}</li>)
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
              Rationale
            </h2>
            <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
              {brief.rationale}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
