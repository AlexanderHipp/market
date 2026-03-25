"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CompetitorCard } from "@/components/competitor-card";
import { TracePanel } from "@/components/trace-panel";
import { classifyInput } from "@/lib/classifier";
import type { Competitor, InputClassification } from "@/lib/types";

interface AnalysisResult {
  marketSummary: string;
  competitors: Competitor[];
  trace: {
    discovery: { prompt: string; response: unknown };
    explanations: Array<{ name: string; prompt: string; response: unknown }>;
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [scope, setScope] = useState("");
  const [classification, setClassification] = useState<InputClassification | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Classify input on change
  useEffect(() => {
    if (input.trim().length > 3) {
      setClassification(classifyInput(input));
    } else {
      setClassification(null);
    }
  }, [input]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), scope: scope.trim() || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, scope]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to analyze
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && input.trim() && !loading) {
        e.preventDefault();
        handleAnalyze();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleAnalyze, input, loading]);

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Find your real competitors
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Paste a company, product, or idea to understand the landscape
          </p>
        </header>

        {/* Input Section */}
        <div className="space-y-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you exploring? e.g. Intercom, customer support software, AI CRM for SMBs..."
            className="min-h-[100px] resize-none text-sm"
            disabled={loading}
          />

          {/* Scope field - appears when input is broad */}
          {classification?.needsScope && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                {classification.suggestedScopePrompt || "What specifically should we focus on?"}
              </label>
              <Input
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="e.g. B2B SaaS, small businesses, enterprise..."
                className="text-sm"
                disabled={loading}
              />
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center justify-between">
            <Button
              onClick={handleAnalyze}
              disabled={!input.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Find competitors
                </>
              )}
            </Button>
            <span className="text-xs text-neutral-400">
              {!loading && input.trim() && (
                <>
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono">
                    {typeof navigator !== "undefined" && navigator.userAgent?.includes("Mac") ? "⌘" : "Ctrl"}
                  </kbd>
                  <span className="mx-0.5">+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono">
                    Enter
                  </kbd>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Market Summary */}
            <div className="mb-8">
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                Market
              </h2>
              <p className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                {result.marketSummary}
              </p>
            </div>

            {/* Competitors */}
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                Competitors
              </h2>
              <div className="border-t border-neutral-100 dark:border-neutral-800">
                {result.competitors.map((competitor) => (
                  <CompetitorCard key={competitor.name} competitor={competitor} />
                ))}
              </div>
            </div>

            {/* Trace Panel */}
            <TracePanel trace={result.trace} />
          </div>
        )}

        {/* Loading state trace */}
        {loading && !result && (
          <div className="mt-10">
            <TracePanel
              trace={{}}
              isLoading={true}
              currentStep="discovery"
            />
          </div>
        )}
      </div>
    </main>
  );
}
