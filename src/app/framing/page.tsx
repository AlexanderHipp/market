"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AppNav } from "@/components/app-nav";
import { classifyInput } from "@/lib/classifier";
import type { InputClassification } from "@/lib/types";
import type { MarketFrameDraft } from "@/lib/schemas";
import {
  createBrief,
  listBriefsSorted,
  type MarketBrief,
} from "@/lib/market-brief";

const EXAMPLES = [
  "AI CRM for startups",
  "Onboarding feature for fintech",
  "Notion vs Coda positioning",
  "Developer tools GTM campaign",
];

const REFINEMENT_OPTIONS: { id: string; label: string }[] = [
  { id: "too_broad", label: "Too broad" },
  { id: "wrong_market", label: "Wrong market" },
  { id: "focus_smb", label: "Focus SMB" },
  { id: "focus_enterprise", label: "Focus enterprise" },
  { id: "feature_not_product", label: "Feature, not product" },
];

export default function FramingPage() {
  const [input, setInput] = useState("");
  const [scope, setScope] = useState("");
  const [classification, setClassification] = useState<InputClassification | null>(
    null,
  );
  const [originalInput, setOriginalInput] = useState("");
  const [refinedText, setRefinedText] = useState("");
  const [selectedHints, setSelectedHints] = useState<string[]>([]);
  const [frame, setFrame] = useState<MarketFrameDraft | null>(null);
  const [briefs, setBriefs] = useState<MarketBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFlash, setSaveFlash] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshBriefs = useCallback(() => {
    setBriefs(listBriefsSorted());
  }, []);

  useEffect(() => {
    const text = frame ? refinedText : input;
    if (text.trim().length > 3) {
      setClassification(classifyInput(text));
    } else {
      setClassification(null);
    }
  }, [input, frame, refinedText]);

  useEffect(() => {
    refreshBriefs();
  }, [refreshBriefs]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const toggleHint = (id: string) => {
    setSelectedHints((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  };

  const generateDraft = useCallback(async () => {
    if (frame === null) {
      if (!input.trim()) return;
    } else if (!originalInput.trim()) {
      return;
    }

    const raw = input.trim();
    setLoading(true);
    setError(null);
    setSaveFlash(null);

    const first = frame === null;
    const rawForApi = first ? raw : originalInput.trim();
    if (!rawForApi) {
      setLoading(false);
      return;
    }

    if (first) {
      setOriginalInput(raw);
      setRefinedText(raw);
    }

    const body = {
      rawInput: rawForApi,
      refinedInput: first ? undefined : refinedText.trim() || undefined,
      scope: scope.trim() || undefined,
      refinementHints: selectedHints.length ? selectedHints : undefined,
    };

    try {
      const response = await fetch("/api/framing/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate frame");
      }
      setFrame(data as MarketFrameDraft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, frame, originalInput, refinedText, scope, selectedHints]);

  const handleFirstGenerate = () => {
    void generateDraft();
  };

  const handleRegenerate = () => {
    void generateDraft();
  };

  const handleSave = () => {
    if (!frame) return;
    createBrief({
      ...frame,
      rawInput: originalInput,
      refinedInput:
        refinedText.trim() !== originalInput.trim()
          ? refinedText.trim()
          : undefined,
      scope: scope.trim() || undefined,
    });
    refreshBriefs();
    setSaveFlash("Saved");
    setTimeout(() => setSaveFlash(null), 2000);
  };

  const fillExample = (text: string) => {
    setInput(text);
    setFrame(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <AppNav />

        <header className="mb-10">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Market framing
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Turn a vague input into a clear market view. Save a brief when it
            feels right.
          </p>
        </header>

        <div className="space-y-3 mb-8">
          <p className="text-xs font-medium text-neutral-500">Examples</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => fillExample(ex)}
                className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {!frame && (
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What are you exploring?"
              className="min-h-[100px] resize-none text-sm"
              disabled={loading}
            />
          )}

          {classification?.needsScope && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                {classification.suggestedScopePrompt ||
                  "What specifically should we focus on?"}
              </label>
              <Input
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="e.g. B2B SaaS, SMB, enterprise…"
                className="text-sm"
                disabled={loading}
              />
            </div>
          )}

          {!frame && (
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={handleFirstGenerate}
                disabled={!input.trim() || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate draft frame"
                )}
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div
            className="mt-6 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {frame && (
          <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                Original input
              </h2>
              <p className="text-sm text-neutral-800 dark:text-neutral-200">
                {originalInput}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Interpretation
              </span>
              <Badge variant="secondary" className="font-normal">
                {frame.interpretationKind}
              </Badge>
              {frame.confidence && (
                <Badge variant="outline" className="font-normal">
                  {frame.confidence} confidence
                </Badge>
              )}
              {frame.partial && (
                <span className="text-xs text-neutral-500">Partial guess</span>
              )}
            </div>

            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                Subject
              </h2>
              <p className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                {frame.subject}
              </p>
            </div>

            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                Market lens
              </h2>
              <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {frame.marketLens}
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
                    {frame.directAlternatives.length === 0 ? (
                      <li className="list-none text-neutral-500">—</li>
                    ) : (
                      frame.directAlternatives.map((a) => (
                        <li key={a}>{a}</li>
                      ))
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
                    {frame.adjacentAlternatives.length === 0 ? (
                      <li className="list-none text-neutral-500">—</li>
                    ) : (
                      frame.adjacentAlternatives.map((a) => (
                        <li key={a}>{a}</li>
                      ))
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
                {frame.rationale}
              </p>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-8 space-y-4">
              <label className="block text-xs font-medium text-neutral-500">
                Refine your focus (edit, then regenerate)
              </label>
              <Textarea
                value={refinedText}
                onChange={(e) => setRefinedText(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                disabled={loading}
              />

              <p className="text-xs text-neutral-500">Refinement</p>
              <div className="flex flex-wrap gap-2">
                {REFINEMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleHint(opt.id)}
                    className={
                      selectedHints.includes(opt.id)
                        ? "rounded-md border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                        : "rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Regenerate frame
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                  Save market brief
                </Button>
                {saveFlash && (
                  <span className="text-xs text-neutral-500">{saveFlash}</span>
                )}
              </div>

              <p className="text-xs text-neutral-500 pt-2">
                Next: open your saved brief and run a full{" "}
                <span className="text-neutral-700 dark:text-neutral-300">
                  competitor deep-dive
                </span>{" "}
                when the frame feels right.
              </p>
            </div>
          </div>
        )}

        {loading && !frame && (
          <div className="mt-10 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span aria-live="polite">Generating draft…</span>
          </div>
        )}

        {briefs.length > 0 && (
          <div className="mt-14 border-t border-neutral-100 dark:border-neutral-800 pt-10">
            <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-4">
              Recent briefs
            </h2>
            <ul className="space-y-2">
              {briefs.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/framing/${b.id}`}
                    className="block rounded-md border border-transparent px-0 py-1 text-sm text-neutral-800 hover:underline dark:text-neutral-200"
                  >
                    <span className="font-medium">{b.subject}</span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {" "}
                      ·{" "}
                      {new Date(b.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
